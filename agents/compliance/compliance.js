/**
 * Compliance Agent
 *
 * The gatekeeper. Nothing moves without compliance clearance.
 * Vets carriers, checks loads, tracks insurance expiry, validates docs.
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { AgentMemory } from '../../shared/memory.js'
import { logDecision } from '../../decision_engine/engine.js'
import { evaluateEscalation } from '../maya/maya.js'

const client = new Anthropic()
const memory = new AgentMemory('Compliance')

/**
 * Vet a carrier before their first load (or re-vet on demand).
 *
 * @param {object} carrier
 * @param {string} carrier.mc_number
 * @param {string} carrier.dot_number
 * @param {string} carrier.company_name
 * @param {string} [carrier.insurance_exp_date]
 * @returns {{ passed: boolean, flags: string[], score: number }}
 */
export async function vetCarrier(carrier) {
  // Check memory first — have we vetted this carrier before?
  const pastVettings = await memory.recall(`carrier_${carrier.mc_number}`, 1)
  if (pastVettings.length > 0) {
    const past = pastVettings[0]
    const vetDate = new Date(past.timestamp)
    const daysSince = (Date.now() - vetDate) / (1000 * 60 * 60 * 24)

    // Re-vet if more than 30 days since last check
    if (daysSince < 30 && past.value.includes('PASSED')) {
      console.log(`[Compliance] ${carrier.company_name} — using cached vet result (${Math.round(daysSince)} days old)`)
      return { passed: true, flags: [], score: 1.0, from_cache: true }
    }
  }

  const flags = []

  // Iron Rule: Authority age check
  if (carrier.authority_start_date) {
    const ageMs = Date.now() - new Date(carrier.authority_start_date).getTime()
    const ageDays = ageMs / (1000 * 60 * 60 * 24)
    if (ageDays < 180) {
      flags.push(`IRON RULE VIOLATION: Authority age ${Math.round(ageDays)} days — minimum 180 required`)
    }
  }

  // Safety rating check
  if (carrier.safety_rating) {
    const blockedRatings = ['Conditional', 'Unsatisfactory']
    if (blockedRatings.includes(carrier.safety_rating)) {
      flags.push(`IRON RULE VIOLATION: Safety rating "${carrier.safety_rating}" — only Satisfactory or Unrated allowed`)
    }
  }

  // Insurance expiry check
  if (carrier.insurance_exp_date) {
    const expiry = new Date(carrier.insurance_exp_date)
    const daysUntilExpiry = (expiry - Date.now()) / (1000 * 60 * 60 * 24)
    if (daysUntilExpiry < 0) {
      flags.push(`BLOCKED: Insurance expired on ${carrier.insurance_exp_date}`)
    } else if (daysUntilExpiry < 30) {
      flags.push(`WARNING: Insurance expires in ${Math.round(daysUntilExpiry)} days — alert owner`)
      // Notify Maya
      await evaluateEscalation({
        type: 'insurance_expiring',
        agent: 'Compliance',
        data: { carrier: carrier.company_name, mc: carrier.mc_number, days_left: Math.round(daysUntilExpiry) },
        ref_id: carrier.mc_number
      })
    }
  }

  const passed = flags.filter(f => f.startsWith('IRON RULE') || f.startsWith('BLOCKED')).length === 0
  const score = passed ? (flags.length === 0 ? 1.0 : 0.7) : 0.0

  // Remember this vetting result
  await memory.remember({
    key: `carrier_${carrier.mc_number}`,
    value: `${passed ? 'PASSED' : 'FAILED'} vetting on ${new Date().toDateString()}. Flags: ${flags.join('; ') || 'none'}`,
    source: carrier.mc_number,
    importance: passed ? 2 : 5
  })

  // Log the vetting decision
  await logDecision({
    agent: 'Compliance',
    situation_type: 'carrier_vetting',
    inputs: { mc_number: carrier.mc_number, company_name: carrier.company_name, safety_rating: carrier.safety_rating },
    recommendation: passed ? 'APPROVE carrier' : 'BLOCK carrier',
    owner_decision: passed ? 'APPROVED_AUTO' : 'BLOCKED_AUTO',
    confidence_before: 0.95
  })

  if (!passed) {
    await evaluateEscalation({
      type: 'carrier_vetting_failed',
      agent: 'Compliance',
      data: { carrier: carrier.company_name, mc: carrier.mc_number, flags },
      ref_id: carrier.mc_number
    })
  }

  return { passed, flags, score }
}

/**
 * Check a load for compliance before Erin books it.
 *
 * @param {object} load
 * @returns {{ passed: boolean, flags: string[], checklist: object }}
 */
export async function checkLoad(load) {
  const flags = []
  const checklist = {}

  // Iron Rule: No Florida
  const flStates = ['FL', 'Florida']
  if (flStates.some(s => load.origin?.includes(s) || load.destination?.includes(s))) {
    flags.push('IRON RULE VIOLATION: Florida load — auto-rejected, no exceptions')
  }
  checklist.no_florida = flags.length === 0

  // Iron Rule: Max weight
  if (load.weight_lbs > 48000) {
    flags.push(`IRON RULE VIOLATION: Weight ${load.weight_lbs} lbs exceeds 48,000 lb maximum`)
  }
  checklist.weight_ok = !flags.some(f => f.includes('Weight'))

  // Cargo type check — dry van only
  const blockedCargo = ['reefer', 'hazmat', 'oversized', 'flatbed', 'livestock', 'liquid bulk']
  if (load.cargo_type && blockedCargo.some(b => load.cargo_type.toLowerCase().includes(b))) {
    flags.push(`IRON RULE VIOLATION: Cargo type "${load.cargo_type}" not allowed — dry van only`)
  }
  checklist.cargo_type_ok = !flags.some(f => f.includes('Cargo type'))

  // Controlled substance / biohazard check
  const highRiskCargo = ['controlled substance', 'biohazard', 'specimen', 'blood', 'tissue']
  if (load.cargo_type && highRiskCargo.some(h => load.cargo_type.toLowerCase().includes(h))) {
    flags.push(`TIER 3 REQUIRED: "${load.cargo_type}" requires owner approval before dispatch`)
    await evaluateEscalation({
      type: 'high_risk_cargo',
      agent: 'Compliance',
      data: { load_id: load.load_id, cargo: load.cargo_type },
      ref_id: load.load_id
    })
  }

  checklist.bol_ready = !!load.bol_number
  checklist.rate_conf_signed = !!load.rate_confirmation_signed

  const passed = !flags.some(f => f.startsWith('IRON RULE') || f.startsWith('BLOCKED'))

  return { passed, flags, checklist }
}

// CLI test mode
if (process.argv.includes('--test')) {
  console.log('Testing Compliance Agent...')

  const result = await vetCarrier({
    mc_number: 'MC123456',
    dot_number: '1234567',
    company_name: 'Test Carrier LLC',
    safety_rating: 'Satisfactory',
    authority_start_date: '2024-01-01',
    insurance_exp_date: '2027-01-01'
  })
  console.log('Carrier vet result:', result)

  const loadResult = await checkLoad({
    load_id: 'LOAD_001',
    origin: 'Chicago, IL',
    destination: 'Atlanta, GA',
    weight_lbs: 42000,
    cargo_type: 'medical_supplies'
  })
  console.log('Load check result:', loadResult)
}
