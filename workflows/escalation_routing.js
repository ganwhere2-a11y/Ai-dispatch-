/**
 * Workflow: Escalation Routing
 *
 * Central escalation router for the entire AI dispatch system.
 * All agents should route escalations through this module to ensure:
 *   1. Consistent event validation
 *   2. Decision logging before escalation
 *   3. Pause state check (AI_DISPATCH_PAUSED)
 *   4. Uniform event structure sent to Maya
 *
 * Usage:
 *   import { routeEscalation, createEscalationEvent } from '../../workflows/escalation_routing.js'
 *
 *   const event = createEscalationEvent('load_value_exceeded', 'Erin', { client_rate: 6200 }, 'LOAD_001')
 *   const result = await routeEscalation(event)
 */

import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { evaluateEscalation } from '../agents/maya/maya.js'
import { logDecision } from '../decision_engine/engine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DECISIONS_FILE = path.join(__dirname, '../data/decisions/decisions.json')

// ─── Required Event Fields ────────────────────────────────────────────────────

const REQUIRED_FIELDS = ['type', 'agent', 'data']

// Known escalation types — for validation and logging
const KNOWN_TYPES = [
  'load_value_exceeded',
  'carrier_vetting_failed',
  'client_complaint',
  'trial_started',
  'trial_day7_conversion',
  'trial_not_converted',
  'trial_converted',
  'insurance_expiring',
  'high_risk_cargo',
  'outreach_batch_sent',
  'outreach_last_chance',
  'campaign_launched',
  'morning_report_failed',
  'loads_need_pickup_today',
  'carrier_verification_failed',
  'family_load_high_value',
  'system_error'
]

// ─── Main Exports ─────────────────────────────────────────────────────────────

/**
 * Factory function that creates a properly structured escalation event object.
 *
 * @param {string} type - Escalation type (see KNOWN_TYPES)
 * @param {string} agent - Agent name that is escalating (e.g., 'Erin', 'Support')
 * @param {object} data - Relevant data for the escalation
 * @param {string} [ref_id] - Optional reference ID (load_id, mc_number, client_id, etc.)
 * @returns {object} Structured escalation event
 */
export function createEscalationEvent(type, agent, data, ref_id = null) {
  if (!type || !agent || !data) {
    throw new Error('[escalation_routing] createEscalationEvent() requires type, agent, and data')
  }

  const event = {
    type,
    agent,
    data,
    ref_id: ref_id || null,
    created_at: new Date().toISOString(),
    routing_version: '1.0'
  }

  if (!KNOWN_TYPES.includes(type)) {
    console.warn(`[escalation_routing] Unknown escalation type: "${type}" — routing anyway`)
    event.unknown_type = true
  }

  return event
}

/**
 * Central escalation router. Validates the event, logs it, then dispatches
 * to Maya's evaluateEscalation().
 *
 * @param {object} event
 * @param {string} event.type - Escalation type
 * @param {string} event.agent - Which agent is escalating
 * @param {object} event.data - Relevant data
 * @param {string} [event.ref_id] - Reference ID
 * @returns {Promise<object>} Maya's evaluation result
 */
export async function routeEscalation(event) {
  // Pause check — always first
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log(`[escalation_routing] System paused — escalation blocked: ${event?.type || 'unknown'}`)
    return { blocked: true, reason: 'system_paused', event }
  }

  // Validate required fields
  if (!event || typeof event !== 'object') {
    console.error('[escalation_routing] routeEscalation() received invalid event (null or non-object)')
    return { blocked: true, reason: 'invalid_event', event }
  }

  const missingFields = REQUIRED_FIELDS.filter(f => !event[f])
  if (missingFields.length > 0) {
    console.error(`[escalation_routing] Escalation event missing required fields: ${missingFields.join(', ')}`)
    console.error('[escalation_routing] Event received:', JSON.stringify(event))
    return { blocked: true, reason: 'missing_fields', missing: missingFields, event }
  }

  // Validate data is an object
  if (typeof event.data !== 'object' || Array.isArray(event.data)) {
    console.error('[escalation_routing] event.data must be a plain object')
    return { blocked: true, reason: 'invalid_data_type', event }
  }

  console.log(`[escalation_routing] Routing escalation: ${event.type} from ${event.agent}${event.ref_id ? ` (ref: ${event.ref_id})` : ''}`)

  // Log to decisions.json before dispatching
  let decisionId = null
  try {
    decisionId = await logDecision({
      agent: event.agent,
      situation_type: `escalation_${event.type}`,
      inputs: {
        type: event.type,
        ref_id: event.ref_id,
        data_keys: Object.keys(event.data),
        ...event.data
      },
      recommendation: `Escalation routed: ${event.type} from ${event.agent}`,
      owner_decision: null,
      confidence_before: 0.95
    })
  } catch (err) {
    console.error(`[escalation_routing] Decision log failed (continuing anyway): ${err.message}`)
  }

  // Enrich event with routing metadata before passing to Maya
  const enrichedEvent = {
    ...event,
    routed_at: new Date().toISOString(),
    decision_id: decisionId
  }

  // Dispatch to Maya
  let result = null
  try {
    result = await evaluateEscalation(enrichedEvent)
  } catch (err) {
    console.error(`[escalation_routing] evaluateEscalation failed: ${err.message}`)
    result = {
      error: err.message,
      tier: 2,
      send_now: false,
      message: `[ROUTING ERROR] ${event.type} from ${event.agent} failed to route`,
      priority: 'HIGH'
    }
  }

  console.log(`[escalation_routing] Escalation ${event.type} processed — tier: ${result?.tier || 'unknown'}, sent: ${result?.send_now || false}`)

  return {
    ...result,
    event_type: event.type,
    agent: event.agent,
    ref_id: event.ref_id,
    decision_id: decisionId,
    routed_at: enrichedEvent.routed_at
  }
}

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv[2] === '--test') {
  console.log('Testing escalation routing...')

  const event = createEscalationEvent(
    'load_value_exceeded',
    'Erin',
    { load_id: 'LOAD_001', client_rate: 6200, route: 'IL→GA' },
    'LOAD_001'
  )

  routeEscalation(event).then(result => {
    console.log('[escalation_routing] Test result:', JSON.stringify(result, null, 2))
  })
}
