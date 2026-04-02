/**
 * Erin — AI Dispatcher Agent
 *
 * The core engine of the business. Erin finds loads, scores them,
 * matches carriers, and books freight — all while enforcing Iron Rules
 * and logging every decision to the Decision Engine.
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { AgentMemory } from '../../shared/memory.js'
import { logDecision, getConfidence } from '../../decision_engine/engine.js'
import { vetCarrier, checkLoad } from '../compliance/compliance.js'
import { evaluateEscalation } from '../maya/maya.js'

const client = new Anthropic()
const memory = new AgentMemory('Erin')

const COST_PER_MILE = parseFloat(process.env.COST_PER_MILE || '1.70')
const COMMISSION_EXISTING = parseFloat(process.env.COMMISSION_RATE_EXISTING || '0.08')
const COMMISSION_NEW = parseFloat(process.env.COMMISSION_RATE_NEW || '0.10')
const NEW_CARRIER_DAYS = parseInt(process.env.NEW_CARRIER_THRESHOLD_DAYS || '90')

// ─── Iron Rules ──────────────────────────────────────────────────────────────

const IRON_RULES = {
  MIN_RPM_REJECT: parseFloat(process.env.MIN_RPM_REJECT || '2.51'),
  MIN_RPM_ACCEPT: parseFloat(process.env.MIN_RPM_ACCEPT || '2.75'),
  MIN_RPM_PRIORITY: parseFloat(process.env.MIN_RPM_PRIORITY || '3.00'),
  MAX_DEADHEAD_MILES: parseInt(process.env.MAX_DEADHEAD_MILES || '50'),
  MAX_DEADHEAD_PERCENT: parseFloat(process.env.MAX_DEADHEAD_PERCENT || '0.25'),
  MAX_LOAD_WEIGHT: parseInt(process.env.MAX_LOAD_WEIGHT || '48000'),
  FLORIDA_STATES: ['FL', 'Florida'],
  BLOCKED_CARGO: ['reefer', 'hazmat', 'oversized', 'flatbed', 'livestock', 'liquid bulk']
}

// ─── Core Profit Formula ─────────────────────────────────────────────────────

/**
 * Calculate profit for a load.
 * This is the FIRST thing Erin runs on any load.
 *
 * @param {number} loadedMiles
 * @param {number} deadheadMiles
 * @param {number} ratePerMile
 * @returns {{ revenue, cost, profit, profitTier, trueRpm }}
 */
export function calculateProfit(loadedMiles, deadheadMiles, ratePerMile) {
  const revenue = loadedMiles * ratePerMile
  const cost = (loadedMiles + deadheadMiles) * COST_PER_MILE
  const profit = revenue - cost
  const trueRpm = loadedMiles > 0 ? profit / loadedMiles : 0

  let profitTier
  if (profit < 0) profitTier = 'LOSS'
  else if (profit < 200) profitTier = 'BORDERLINE'
  else if (profit < 400) profitTier = 'DECENT'
  else profitTier = 'STRONG'

  return { revenue, cost, profit, profitTier, trueRpm }
}

/**
 * Calculate client rate from carrier rate + commission.
 *
 * @param {number} carrierRateTotal - Total carrier wants for the load
 * @param {boolean} isNewCarrier - true if carrier has been with us < 90 days
 * @returns {{ clientRate, commission, commissionRate }}
 */
export function calculateClientRate(carrierRateTotal, isNewCarrier) {
  const commissionRate = isNewCarrier ? COMMISSION_NEW : COMMISSION_EXISTING
  const commission = carrierRateTotal * commissionRate
  const clientRate = carrierRateTotal + commission
  return { clientRate: Math.round(clientRate * 100) / 100, commission: Math.round(commission * 100) / 100, commissionRate }
}

// ─── Iron Rule Enforcement ───────────────────────────────────────────────────

/**
 * Run all Iron Rules against a load. Returns immediately if any rule is violated.
 * @returns {{ passed: boolean, violations: string[], rpmAction: string|null }}
 */
export function enforceIronRules(load) {
  const violations = []
  let rpmAction = null

  // Rule 1: No Florida
  if (IRON_RULES.FLORIDA_STATES.some(s => load.origin?.includes(s) || load.destination?.includes(s))) {
    violations.push('NO_FLORIDA: Florida loads are permanently blocked')
  }

  // Rule 2: RPM check
  if (load.rate_per_mile !== undefined) {
    if (load.rate_per_mile < IRON_RULES.MIN_RPM_REJECT) {
      violations.push(`MIN_RPM: $${load.rate_per_mile}/mile is below $${IRON_RULES.MIN_RPM_REJECT} minimum`)
    } else if (load.rate_per_mile < IRON_RULES.MIN_RPM_ACCEPT) {
      rpmAction = 'COUNTER_OFFER'
    } else if (load.rate_per_mile >= IRON_RULES.MIN_RPM_PRIORITY) {
      rpmAction = 'PRIORITIZE'
    } else {
      rpmAction = 'ACCEPT'
    }
  }

  // Rule 3: Max Deadhead
  if (load.deadhead_miles !== undefined && load.loaded_miles !== undefined) {
    const deadheadLimit = Math.min(
      IRON_RULES.MAX_DEADHEAD_MILES,
      load.loaded_miles * IRON_RULES.MAX_DEADHEAD_PERCENT
    )
    if (load.deadhead_miles > deadheadLimit) {
      violations.push(`MAX_DEADHEAD: ${load.deadhead_miles}mi exceeds limit of ${Math.round(deadheadLimit)}mi for this load`)
    }
  }

  // Rule 4: Max Weight
  if (load.weight_lbs > IRON_RULES.MAX_LOAD_WEIGHT) {
    violations.push(`MAX_WEIGHT: ${load.weight_lbs} lbs exceeds ${IRON_RULES.MAX_LOAD_WEIGHT} lb maximum`)
  }

  // Rule 7: Cargo type
  if (load.cargo_type && IRON_RULES.BLOCKED_CARGO.some(b => load.cargo_type.toLowerCase().includes(b))) {
    violations.push(`CARGO_TYPE: "${load.cargo_type}" not allowed — dry van only`)
  }

  return {
    passed: violations.length === 0,
    violations,
    rpmAction
  }
}

// ─── Main Dispatch Functions ─────────────────────────────────────────────────

/**
 * Evaluate a load — the first step for any incoming load request.
 * Runs Iron Rules + profit formula and returns Erin's recommendation.
 */
export async function evaluateLoad(load) {
  // Step 1: Iron Rules — instant reject if violated
  const ironRuleResult = enforceIronRules(load)
  if (!ironRuleResult.passed) {
    await logDecision({
      agent: 'Erin',
      situation_type: 'load_evaluation',
      inputs: load,
      recommendation: `REJECT — Iron Rule violation: ${ironRuleResult.violations.join('; ')}`,
      owner_decision: 'REJECTED_AUTO',
      confidence_before: 1.0
    })
    return { accepted: false, reason: 'iron_rule', violations: ironRuleResult.violations }
  }

  // Step 2: Handle counter-offer case
  if (ironRuleResult.rpmAction === 'COUNTER_OFFER') {
    return {
      accepted: false,
      reason: 'counter_offer',
      counter_offer_rpm: IRON_RULES.MIN_RPM_ACCEPT,
      message: `Rate $${load.rate_per_mile}/mile is below accept threshold. Counter-offering at $${IRON_RULES.MIN_RPM_ACCEPT}/mile.`
    }
  }

  // Step 3: Profit formula
  const profitCalc = calculateProfit(load.loaded_miles, load.deadhead_miles || 0, load.rate_per_mile)

  if (profitCalc.profitTier === 'LOSS' || profitCalc.profitTier === 'BORDERLINE') {
    await logDecision({
      agent: 'Erin',
      situation_type: 'load_evaluation',
      inputs: { ...load, ...profitCalc },
      recommendation: `REJECT — Profit $${profitCalc.profit.toFixed(0)} is ${profitCalc.profitTier}`,
      owner_decision: 'REJECTED_AUTO',
      confidence_before: 0.9
    })
    return {
      accepted: false,
      reason: 'low_profit',
      profit: profitCalc,
      message: `Profit $${profitCalc.profit.toFixed(0)} — ${profitCalc.profitTier}. Not worth dispatching.`
    }
  }

  // Step 4: Check Decision Engine confidence
  const confidence = await getConfidence('load_evaluation', 'Erin', {
    route: `${load.origin}→${load.destination}`,
    rate_per_mile: load.rate_per_mile,
    deadhead_miles: load.deadhead_miles,
    profit: profitCalc.profit
  })

  // Step 5: Check Compliance
  const complianceResult = await checkLoad(load)
  if (!complianceResult.passed) {
    return {
      accepted: false,
      reason: 'compliance',
      flags: complianceResult.flags
    }
  }

  // Step 6: Calculate client rate
  const rateCalc = calculateClientRate(
    load.loaded_miles * load.rate_per_mile,
    load.is_new_carrier || false
  )

  // Step 7: Escalate if client rate > $5,000
  if (rateCalc.clientRate > parseFloat(process.env.QUOTE_ESCALATION_THRESHOLD || '5000')) {
    await evaluateEscalation({
      type: 'load_value_exceeded',
      agent: 'Erin',
      data: { load_id: load.load_id, client_rate: rateCalc.clientRate, route: `${load.origin}→${load.destination}` },
      ref_id: load.load_id
    })
    return {
      accepted: false,
      reason: 'escalated',
      message: `Client rate $${rateCalc.clientRate} exceeds threshold. Maya notified. Awaiting owner approval.`,
      rate_calc: rateCalc,
      profit: profitCalc
    }
  }

  // Remember this good load
  await memory.remember({
    key: `lane_${load.origin}_${load.destination}`,
    value: `Accepted load at $${load.rate_per_mile}/mile. Profit: $${profitCalc.profit.toFixed(0)}. Score: ${profitCalc.profitTier}`,
    source: load.load_id,
    importance: profitCalc.profitTier === 'STRONG' ? 4 : 2
  })

  return {
    accepted: true,
    profit: profitCalc,
    rate_calc: rateCalc,
    iron_rule_action: ironRuleResult.rpmAction,
    compliance: complianceResult,
    confidence
  }
}

// ─── CLI Test Mode ────────────────────────────────────────────────────────────

if (process.argv.includes('--test-iron-rules')) {
  console.log('Testing Iron Rules...\n')

  const tests = [
    { name: 'Florida reject', origin: 'Miami, FL', destination: 'Atlanta, GA', rate_per_mile: 2.80, loaded_miles: 663, deadhead_miles: 20, weight_lbs: 40000, cargo_type: 'medical_supplies' },
    { name: 'Low RPM reject', origin: 'Chicago, IL', destination: 'Columbus, OH', rate_per_mile: 2.30, loaded_miles: 300, deadhead_miles: 25, weight_lbs: 35000, cargo_type: 'medical_supplies' },
    { name: 'Example 3 - bad deadhead', origin: 'Dallas, TX', destination: 'Nashville, TN', rate_per_mile: 2.50, loaded_miles: 400, deadhead_miles: 200, weight_lbs: 38000, cargo_type: 'medical_supplies' },
    { name: 'Strong load', origin: 'Chicago, IL', destination: 'Atlanta, GA', rate_per_mile: 2.60, loaded_miles: 600, deadhead_miles: 40, weight_lbs: 42000, cargo_type: 'medical_supplies' },
  ]

  for (const test of tests) {
    const result = await evaluateLoad(test)
    console.log(`${test.name}: ${result.accepted ? '✓ ACCEPTED' : '✗ REJECTED'} — ${result.reason || result.iron_rule_action || ''}`)
    if (result.profit) console.log(`  Profit: $${result.profit.profit.toFixed(0)} (${result.profit.profitTier})`)
    if (result.violations) console.log(`  Violations: ${result.violations.join(', ')}`)
    console.log()
  }
}

if (process.argv.includes('--test-pricing')) {
  console.log('Testing pricing formula...\n')
  const calc = calculateProfit(600, 40, 2.60)
  console.log('Example 2 (Strong load):', calc)
  const rates = calculateClientRate(1560, false)
  console.log('Client rate (8% commission):', rates)
}
