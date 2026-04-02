/**
 * Decision Engine — Core Module
 *
 * Every decision made by an agent or the owner is logged here.
 * The engine matches new situations to past decisions, calculates
 * confidence scores, and determines when an agent has earned the
 * right to act autonomously.
 *
 * Simple version: Think of it like a notebook where every decision
 * gets written down. When a new situation comes up, the engine reads
 * the notebook to see if it's happened before. If it has — many times —
 * the agent already knows what to do and doesn't need to ask.
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { matcher } from './matcher.js'
import { promoter } from './promoter.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DECISIONS_FILE = path.join(__dirname, '../data/decisions/decisions.json')

/**
 * Load all decisions from disk
 */
async function loadDecisions() {
  try {
    const raw = await fs.readFile(DECISIONS_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/**
 * Save decisions to disk
 */
async function saveDecisions(decisions) {
  await fs.writeFile(DECISIONS_FILE, JSON.stringify(decisions, null, 2))
}

/**
 * Log a new decision event.
 * Call this whenever an agent makes a recommendation or the owner makes a call.
 *
 * @param {object} params
 * @param {string} params.agent - Which agent is making this decision
 * @param {string} params.context - USA | CANADA | EUROPE
 * @param {string} params.situation_type - Category from schema.json
 * @param {object} params.inputs - All data at decision time
 * @param {string} params.recommendation - What the agent suggested
 * @param {string} [params.owner_decision] - What owner decided (if Tier 2+)
 * @param {string} [params.modification_notes] - If owner changed the recommendation
 * @param {number} [params.confidence_before] - Agent's confidence 0-1
 */
export async function logDecision(params) {
  const decisions = await loadDecisions()

  const id = `dec_${String(decisions.length + 1).padStart(4, '0')}`
  const entry = {
    id,
    timestamp: new Date().toISOString(),
    agent: params.agent,
    context: params.context || process.env.ACTIVE_CONTEXT || 'USA',
    situation_type: params.situation_type,
    inputs: params.inputs,
    recommendation: params.recommendation,
    owner_decision: params.owner_decision || null,
    modification_notes: params.modification_notes || null,
    outcome: null,
    outcome_date: null,
    lesson: null,
    confidence_before: params.confidence_before || 0.5,
    confidence_after: null,
    autonomous_eligible: false
  }

  decisions.push(entry)
  await saveDecisions(decisions)

  console.log(`[DecisionEngine] Logged: ${id} | ${params.agent} | ${params.situation_type}`)
  return id
}

/**
 * Update a decision with its outcome once we know what happened.
 * Call this after a load delivers, a client converts, etc.
 *
 * @param {string} decisionId - The ID returned from logDecision
 * @param {object} params
 * @param {string} params.outcome - What actually happened
 * @param {string} [params.lesson] - What to learn from this
 * @param {number} [params.confidence_after] - Updated confidence 0-1
 */
export async function updateOutcome(decisionId, params) {
  const decisions = await loadDecisions()
  const idx = decisions.findIndex(d => d.id === decisionId)

  if (idx === -1) {
    console.error(`[DecisionEngine] Decision ${decisionId} not found`)
    return
  }

  decisions[idx].outcome = params.outcome
  decisions[idx].outcome_date = new Date().toISOString()
  decisions[idx].lesson = params.lesson || null
  decisions[idx].confidence_after = params.confidence_after ?? decisions[idx].confidence_before

  await saveDecisions(decisions)

  // Check if this decision type can now be promoted to autonomous
  await promoter.checkPromotion(decisions[idx].situation_type, decisions[idx].agent, decisions)

  console.log(`[DecisionEngine] Updated outcome: ${decisionId}`)
}

/**
 * Get the confidence level for a given situation type + agent combo.
 * Used by agents before acting — if confidence is high enough, act autonomously.
 *
 * @param {string} situationType
 * @param {string} agentName
 * @returns {{ confidence: number, autonomous: boolean, similar_count: number, recommendation: string|null }}
 */
export async function getConfidence(situationType, agentName, currentInputs) {
  const decisions = await loadDecisions()
  return matcher.findSimilar(decisions, situationType, agentName, currentInputs)
}

/**
 * Get a summary of all decisions for Maya's morning report.
 * Returns counts by agent, situation type, and autonomous eligibility.
 */
export async function getSummary() {
  const decisions = await loadDecisions()

  const summary = {
    total: decisions.length,
    pending_outcomes: decisions.filter(d => d.outcome === null && d.owner_decision !== null).length,
    autonomous_eligible: decisions.filter(d => d.autonomous_eligible).length,
    by_agent: {},
    by_situation: {},
    recent_7_days: 0
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  for (const d of decisions) {
    summary.by_agent[d.agent] = (summary.by_agent[d.agent] || 0) + 1
    summary.by_situation[d.situation_type] = (summary.by_situation[d.situation_type] || 0) + 1
    if (new Date(d.timestamp) > sevenDaysAgo) summary.recent_7_days++
  }

  return summary
}

// CLI test mode
if (process.argv.includes('--test')) {
  console.log('Testing Decision Engine...')

  const id = await logDecision({
    agent: 'Erin',
    context: 'USA',
    situation_type: 'load_evaluation',
    inputs: { loaded_miles: 500, deadhead_miles: 30, rate_per_mile: 2.58, route: 'TX→GA', profit: 395 },
    recommendation: 'ACCEPT — profit $395, strong lane, within iron rules',
    owner_decision: 'ACCEPT',
    confidence_before: 0.75
  })

  await updateOutcome(id, {
    outcome: 'Delivered on time. Client satisfied.',
    lesson: 'TX→GA at $2.50+ with <50mi deadhead is consistently profitable',
    confidence_after: 0.85
  })

  const summary = await getSummary()
  console.log('Summary:', JSON.stringify(summary, null, 2))
  console.log('Decision Engine test passed.')
}
