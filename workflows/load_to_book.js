/**
 * Workflow: Load to Book
 *
 * Full load lifecycle from intake to invoice.
 * Orchestrates Erin, Compliance, and Maya agents
 * through every stage of booking a freight load.
 *
 * Stages:
 *   1. Intake — validate load object has required fields
 *   2. Compliance check — vet carrier + check load
 *   3. Iron Rules + carrier match — Erin evaluates
 *   4. Rate calculation — carrier rate + client rate
 *   5. Escalate if >$5K client rate
 *   6. Generate documents — BOL, rate confirmation
 *   7. Send confirmations — to carrier and shipper
 *   8. Track — log acceptance in Decision Engine
 *   9. Invoice — generate and log invoice record
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { evaluateLoad, calculateClientRate } from '../agents/erin/erin.js'
import { checkLoad, vetCarrier } from '../agents/compliance/compliance.js'
import { evaluateEscalation } from '../agents/maya/maya.js'
import { logDecision } from '../decision_engine/engine.js'

const client = new Anthropic()

// ─── Stage Helpers ────────────────────────────────────────────────────────────

/**
 * Stage 1: Validate that the incoming load has the minimum required fields.
 */
function intakeLoad(loadRequest) {
  const required = ['load_id', 'origin', 'destination', 'loaded_miles', 'rate_per_mile', 'cargo_type', 'weight_lbs']
  const missing = required.filter(f => loadRequest[f] === undefined || loadRequest[f] === null)

  if (missing.length > 0) {
    return {
      passed: false,
      stage: 'intake',
      error: `Missing required fields: ${missing.join(', ')}`,
      load: loadRequest
    }
  }

  // Normalize types
  const load = {
    ...loadRequest,
    loaded_miles: Number(loadRequest.loaded_miles),
    deadhead_miles: Number(loadRequest.deadhead_miles || 0),
    rate_per_mile: Number(loadRequest.rate_per_mile),
    weight_lbs: Number(loadRequest.weight_lbs),
    is_new_carrier: loadRequest.is_new_carrier ?? true
  }

  console.log(`[load_to_book] Stage 1 — Intake: Load ${load.load_id} received (${load.origin} → ${load.destination})`)
  return { passed: true, load }
}

/**
 * Stage 6: Use Claude to generate BOL and rate confirmation documents.
 */
async function generateDocuments(load, rateCalc) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Generate a brief Bill of Lading summary and Rate Confirmation for this load.

Load details:
- Load ID: ${load.load_id}
- Origin: ${load.origin}
- Destination: ${load.destination}
- Cargo: ${load.cargo_type}
- Weight: ${load.weight_lbs} lbs
- Loaded Miles: ${load.loaded_miles}
- Deadhead Miles: ${load.deadhead_miles}
- Rate per mile: $${load.rate_per_mile}
- Carrier: ${load.carrier_name || 'TBD'}
- Carrier Rate Total: $${(load.loaded_miles * load.rate_per_mile).toFixed(2)}
- Client Rate Total: $${rateCalc.clientRate.toFixed(2)}
- Commission: $${rateCalc.commission.toFixed(2)}
- Date: ${new Date().toDateString()}

Return a JSON object with two keys:
- bol_summary: a plain-text BOL summary covering all required fields
- rate_confirmation: a plain-text rate confirmation document`
    }]
  })

  try {
    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    return JSON.parse(jsonMatch[0])
  } catch {
    return {
      bol_summary: `BOL — Load ${load.load_id} | ${load.origin} → ${load.destination} | ${load.cargo_type} | ${load.weight_lbs} lbs | Date: ${new Date().toDateString()}`,
      rate_confirmation: `Rate Confirmation — Load ${load.load_id} | Carrier Rate: $${(load.loaded_miles * load.rate_per_mile).toFixed(2)} | Client Rate: $${rateCalc.clientRate.toFixed(2)}`
    }
  }
}

/**
 * Stage 7: Send confirmations (logs to console — replace with email/Airtable in prod).
 */
async function sendConfirmations(load, docs) {
  console.log(`[load_to_book] Stage 7 — Confirmations: Sending to carrier ${load.carrier_name || 'TBD'} and shipper`)
  // TODO: Replace with actual email send (agents/support or marketer)
  console.log(`  BOL: ${docs.bol_summary.slice(0, 80)}...`)
  console.log(`  Rate Conf: ${docs.rate_confirmation.slice(0, 80)}...`)
  return { sent: true, timestamp: new Date().toISOString() }
}

/**
 * Stage 9: Generate invoice record for this load.
 */
function generateInvoice(load, rateCalc, profit) {
  return {
    invoice_id: `INV-${load.load_id}-${Date.now()}`,
    load_id: load.load_id,
    route: `${load.origin} → ${load.destination}`,
    cargo: load.cargo_type,
    carrier_rate: Number((load.loaded_miles * load.rate_per_mile).toFixed(2)),
    commission_rate: rateCalc.commissionRate,
    commission: rateCalc.commission,
    client_rate: rateCalc.clientRate,
    profit: Number(profit.profit.toFixed(2)),
    profit_tier: profit.profitTier,
    issued_at: new Date().toISOString(),
    status: 'PENDING_DELIVERY'
  }
}

// ─── Main Workflow ────────────────────────────────────────────────────────────

/**
 * Run the full load-to-book workflow.
 *
 * @param {object} loadRequest - Raw load object from broker/API/manual entry
 * @returns {object} Result with stage-by-stage outcomes and final invoice
 */
export async function loadToBook(loadRequest) {
  const result = {
    load_id: loadRequest.load_id,
    started_at: new Date().toISOString(),
    stages: {},
    final_status: null,
    invoice: null
  }

  // ── Stage 1: Intake ──────────────────────────────────────────────────────
  const intake = intakeLoad(loadRequest)
  result.stages.intake = intake
  if (!intake.passed) {
    result.final_status = 'REJECTED_INTAKE'
    return result
  }
  const load = intake.load

  // ── Stage 2: Compliance check ────────────────────────────────────────────
  console.log(`[load_to_book] Stage 2 — Compliance check`)
  const loadCompliance = await checkLoad(load)
  result.stages.compliance_load = loadCompliance

  if (!loadCompliance.passed) {
    result.final_status = 'REJECTED_COMPLIANCE'
    await logDecision({
      agent: 'workflow/load_to_book',
      situation_type: 'load_compliance_block',
      inputs: { load_id: load.load_id, flags: loadCompliance.flags },
      recommendation: `BLOCK — compliance failed: ${loadCompliance.flags.join('; ')}`,
      owner_decision: 'BLOCKED_AUTO',
      confidence_before: 1.0
    })
    return result
  }

  // Vet carrier if MC number is known
  if (load.carrier_mc) {
    console.log(`[load_to_book] Stage 2b — Carrier vet (MC ${load.carrier_mc})`)
    const carrierVet = await vetCarrier({
      mc_number: load.carrier_mc,
      dot_number: load.carrier_dot,
      company_name: load.carrier_name,
      safety_rating: load.carrier_safety_rating,
      authority_start_date: load.carrier_authority_date,
      insurance_exp_date: load.carrier_insurance_exp
    })
    result.stages.compliance_carrier = carrierVet

    if (!carrierVet.passed) {
      result.final_status = 'REJECTED_CARRIER_VET'
      return result
    }
  }

  // ── Stage 3: Erin evaluates (Iron Rules + profit formula) ────────────────
  console.log(`[load_to_book] Stage 3 — Erin evaluates load`)
  const erinEval = await evaluateLoad(load)
  result.stages.erin_evaluation = erinEval

  if (!erinEval.accepted) {
    result.final_status = `REJECTED_${(erinEval.reason || 'erin').toUpperCase()}`
    return result
  }

  // ── Stage 4: Rate calculation ────────────────────────────────────────────
  console.log(`[load_to_book] Stage 4 — Rate calculation`)
  const carrierRateTotal = load.loaded_miles * load.rate_per_mile
  const rateCalc = calculateClientRate(carrierRateTotal, load.is_new_carrier)
  result.stages.rate_calc = rateCalc

  // ── Stage 5: Escalate if client rate > $5,000 ───────────────────────────
  const escalationThreshold = parseFloat(process.env.QUOTE_ESCALATION_THRESHOLD || '5000')
  if (rateCalc.clientRate > escalationThreshold) {
    console.log(`[load_to_book] Stage 5 — Escalating: client rate $${rateCalc.clientRate} > $${escalationThreshold}`)
    await evaluateEscalation({
      type: 'load_value_exceeded',
      agent: 'workflow/load_to_book',
      data: {
        load_id: load.load_id,
        route: `${load.origin} → ${load.destination}`,
        client_rate: rateCalc.clientRate,
        profit: erinEval.profit?.profit
      },
      ref_id: load.load_id
    })
    result.stages.escalation = { escalated: true, reason: 'client_rate_exceeded', threshold: escalationThreshold, client_rate: rateCalc.clientRate }
    result.final_status = 'ESCALATED_AWAITING_APPROVAL'
    return result
  }
  result.stages.escalation = { escalated: false }

  // ── Stage 6: Generate documents ─────────────────────────────────────────
  console.log(`[load_to_book] Stage 6 — Generating documents`)
  const docs = await generateDocuments(load, rateCalc)
  result.stages.documents = { generated: true, bol_preview: docs.bol_summary.slice(0, 100), rate_conf_preview: docs.rate_confirmation.slice(0, 100) }

  // ── Stage 7: Send confirmations ──────────────────────────────────────────
  const confirmations = await sendConfirmations(load, docs)
  result.stages.confirmations = confirmations

  // ── Stage 8: Track decision ──────────────────────────────────────────────
  console.log(`[load_to_book] Stage 8 — Logging to Decision Engine`)
  const decisionId = await logDecision({
    agent: 'workflow/load_to_book',
    situation_type: 'load_booked',
    inputs: {
      load_id: load.load_id,
      route: `${load.origin} → ${load.destination}`,
      rate_per_mile: load.rate_per_mile,
      loaded_miles: load.loaded_miles,
      deadhead_miles: load.deadhead_miles,
      profit: erinEval.profit?.profit,
      profit_tier: erinEval.profit?.profitTier,
      client_rate: rateCalc.clientRate
    },
    recommendation: `BOOK — profit $${erinEval.profit?.profit?.toFixed(0)}, tier ${erinEval.profit?.profitTier}`,
    owner_decision: 'BOOKED_AUTO',
    confidence_before: erinEval.confidence?.confidence || 0.8
  })
  result.stages.decision_log = { decision_id: decisionId }

  // ── Stage 9: Generate invoice ────────────────────────────────────────────
  console.log(`[load_to_book] Stage 9 — Generating invoice`)
  const invoice = generateInvoice(load, rateCalc, erinEval.profit)
  result.invoice = invoice
  result.stages.invoice = { invoice_id: invoice.invoice_id, client_rate: invoice.client_rate, profit: invoice.profit }

  result.final_status = 'BOOKED'
  result.completed_at = new Date().toISOString()

  console.log(`[load_to_book] Complete — Load ${load.load_id} BOOKED. Client rate: $${rateCalc.clientRate}. Profit: $${erinEval.profit?.profit?.toFixed(0)} (${erinEval.profit?.profitTier})`)
  return result
}

// ─── CLI Test Mode ────────────────────────────────────────────────────────────

if (process.argv.includes('--test')) {
  const testLoad = {
    load_id: 'LOAD_TEST_001',
    origin: 'Chicago, IL',
    destination: 'Atlanta, GA',
    loaded_miles: 600,
    deadhead_miles: 35,
    rate_per_mile: 2.60,
    weight_lbs: 42000,
    cargo_type: 'medical_supplies',
    carrier_name: 'MidWest Medical Freight LLC',
    carrier_mc: 'MC999001',
    carrier_safety_rating: 'Satisfactory',
    carrier_authority_date: '2023-01-15',
    carrier_insurance_exp: '2026-12-01',
    is_new_carrier: false
  }

  console.log('Running load_to_book workflow test...\n')
  const result = await loadToBook(testLoad)
  console.log('\nFinal result:')
  console.log(JSON.stringify(result, null, 2))
}
