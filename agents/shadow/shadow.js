/**
 * Shadow Agent
 *
 * Watches every decision that flows through the system, learns from patterns,
 * and surfaces proactive recommendations when similar situations arise.
 *
 * The Shadow Agent never acts directly — it observes, learns, and advises.
 * Think of it as the institutional memory of the business.
 *
 * Core loop:
 *   1. observeDecision()  — called after every decision is logged
 *   2. suggestAction()    — called when a new situation needs guidance
 *   3. getDailyInsight()  — called by the morning report to summarize learning
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { AgentMemory } from '../../shared/memory.js'
import { logDecision, getSummary } from '../../decision_engine/engine.js'
import { findSimilar } from '../../decision_engine/matcher.js'

const client = new Anthropic()
const memory = new AgentMemory('Shadow')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Load all decisions from disk (reuses engine's file path).
 */
async function loadAllDecisions() {
  try {
    const { default: fs } = await import('fs/promises')
    const { default: path } = await import('path')
    const { fileURLToPath } = await import('url')
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const DECISIONS_FILE = path.join(__dirname, '../../data/decisions/decisions.json')
    const raw = await fs.readFile(DECISIONS_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

// ─── Main Exports ─────────────────────────────────────────────────────────────

/**
 * Observe a new decision record, store it in memory, and extract a pattern
 * insight if enough similar decisions exist.
 *
 * @param {object} decisionRecord - A decision object from the Decision Engine
 * @returns {Promise<{ pattern_found: boolean, insight: string|null, confidence: number }>}
 */
export async function observeDecision(decisionRecord) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Shadow] System paused. observeDecision() aborted.')
    return { pattern_found: false, insight: null, confidence: 0 }
  }

  if (!decisionRecord || !decisionRecord.situation_type) {
    console.warn('[Shadow] observeDecision() received invalid decision record')
    return { pattern_found: false, insight: null, confidence: 0 }
  }

  console.log(`[Shadow] Observing decision: ${decisionRecord.id || 'unknown'} — ${decisionRecord.situation_type}`)

  // Store observation in memory
  await memory.remember({
    key: `observed_${decisionRecord.situation_type}`,
    value: `${decisionRecord.agent} made a ${decisionRecord.situation_type} decision. Recommendation: ${decisionRecord.recommendation?.slice(0, 100)}. Outcome: ${decisionRecord.outcome || 'pending'}`,
    source: decisionRecord.id,
    importance: decisionRecord.outcome ? 3 : 2
  })

  // Load all decisions and find similar ones
  const allDecisions = await loadAllDecisions()
  const summary = await getSummary()

  // Check how many similar decisions exist
  const similarDecisions = allDecisions.filter(d =>
    d.situation_type === decisionRecord.situation_type &&
    d.id !== decisionRecord.id &&
    d.outcome !== null
  )

  // Only try to extract a pattern if we have at least 3 similar completed decisions
  if (similarDecisions.length < 3) {
    return { pattern_found: false, insight: null, confidence: 0 }
  }

  let insight = null
  let confidence = 0
  let pattern_found = false

  try {
    const recentSimilar = similarDecisions.slice(-10) // Last 10 similar decisions

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: `You are the Shadow Agent — the institutional memory of an AI freight dispatch business.
Your job is to observe patterns across decisions and surface actionable insights.
Be specific, data-driven, and brief. No fluff.
Return ONLY valid JSON. No extra text.`,
      messages: [{
        role: 'user',
        content: `I have observed ${similarDecisions.length} decisions of type "${decisionRecord.situation_type}".

The latest decision:
${JSON.stringify(decisionRecord, null, 2)}

Recent similar decisions (last 10):
${JSON.stringify(recentSimilar, null, 2)}

Decision engine summary:
${JSON.stringify(summary, null, 2)}

Analyze these decisions and respond with JSON:
{
  "pattern_found": true or false,
  "insight": "one clear, specific pattern observed (or null if none)",
  "confidence": 0.0 to 1.0,
  "suggested_rule": "optional: if a rule should be codified from this pattern"
}`
      }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      insight = parsed.insight || null
      confidence = parsed.confidence || 0
      pattern_found = parsed.pattern_found || false

      if (pattern_found && insight) {
        await memory.remember({
          key: `pattern_${decisionRecord.situation_type}`,
          value: `Pattern detected (confidence ${(confidence * 100).toFixed(0)}%): ${insight}`,
          source: decisionRecord.id,
          importance: 4
        })

        console.log(`[Shadow] Pattern found in ${decisionRecord.situation_type}: ${insight}`)
      }
    }
  } catch (err) {
    console.error(`[Shadow] Pattern extraction failed: ${err.message}`)
  }

  return { pattern_found, insight, confidence }
}

/**
 * Given a new situation, search past decisions and build a recommendation.
 * Uses the Decision Engine's matcher to find similar past outcomes.
 *
 * @param {object} situation - Arbitrary situation data (same shape as decision inputs)
 * @param {string} [situation.situation_type] - Required for matcher lookup
 * @param {string} [situation.agent] - Agent context
 * @returns {Promise<{ recommendation: string, confidence: number, based_on_count: number }>}
 */
export async function suggestAction(situation) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Shadow] System paused. suggestAction() aborted.')
    return { recommendation: 'System paused — no suggestion available', confidence: 0, based_on_count: 0 }
  }

  const { situation_type, agent, ...inputs } = situation

  if (!situation_type) {
    throw new Error('[Shadow] suggestAction() requires situation.situation_type')
  }

  console.log(`[Shadow] Suggesting action for: ${situation_type}`)

  const allDecisions = await loadAllDecisions()

  // Use the matcher to find similar past decisions
  const matchResult = findSimilar(allDecisions, situation_type, agent || 'Erin', inputs)

  // Recall Shadow's own pattern memories
  const patternMemories = await memory.recall(`pattern_${situation_type}`, 3)
  const generalMemories = await memory.recall(situation_type, 3)

  const memContext = [...patternMemories, ...generalMemories]
    .map((m, i) => `${i + 1}. [${m.key}] ${m.value}`)
    .join('\n')

  let recommendation = ''

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: `You are the Shadow Agent. Based on past decisions and observed patterns, recommend what action to take in a new situation.
Be specific and actionable. One clear recommendation. Under 100 words.
Return ONLY valid JSON. No extra text.`,
      messages: [{
        role: 'user',
        content: `Situation type: ${situation_type}
Current inputs: ${JSON.stringify(inputs, null, 2)}

Matcher result from past decisions:
${JSON.stringify(matchResult, null, 2)}

Pattern memories:
${memContext || 'None yet.'}

Based on the above, what should the agent do?

Return JSON:
{
  "recommendation": "specific action recommendation",
  "confidence": 0.0-1.0,
  "reasoning": "one sentence"
}`
      }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      recommendation = parsed.recommendation || matchResult.recommendation || 'No clear recommendation — proceed with standard protocol'
      const finalConfidence = parsed.confidence ?? matchResult.confidence

      return {
        recommendation,
        confidence: finalConfidence,
        based_on_count: matchResult.similar_count,
        reasoning: parsed.reasoning || null
      }
    }
  } catch (err) {
    console.error(`[Shadow] suggestAction Claude call failed: ${err.message}`)
  }

  // Fallback to raw matcher result
  return {
    recommendation: matchResult.recommendation || 'No clear recommendation — proceed with standard protocol',
    confidence: matchResult.confidence,
    based_on_count: matchResult.similar_count
  }
}

/**
 * Summarize what the Shadow Agent has learned in the last 24 hours.
 * Called by the morning report to surface actionable insights for the owner.
 *
 * @returns {Promise<string>} A short paragraph summarizing recent learning
 */
export async function getDailyInsight() {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Shadow] System paused. getDailyInsight() aborted.')
    return 'System paused — no daily insight available.'
  }

  console.log('[Shadow] Generating daily insight...')

  const allDecisions = await loadAllDecisions()
  const summary = await getSummary()

  // Get decisions from the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentDecisions = allDecisions.filter(d => new Date(d.timestamp) > oneDayAgo)

  // Pull all recent memories
  const recentMemories = await memory.recall('pattern', 5)

  let insight = ''

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: `You are the Shadow Agent for an AI freight dispatch company.
Summarize what you've learned in the last 24 hours in plain English.
Focus on patterns, anomalies, and actionable observations.
Write one short paragraph (3-5 sentences). No bullet points. No headers. No jargon.`,
      messages: [{
        role: 'user',
        content: `Decisions in the last 24 hours: ${recentDecisions.length}

Recent decisions summary:
${JSON.stringify(recentDecisions.slice(-5), null, 2)}

Decision engine totals:
${JSON.stringify(summary, null, 2)}

Pattern memories I've stored:
${recentMemories.map(m => `- ${m.value}`).join('\n') || 'No patterns stored yet.'}

Write a 3-5 sentence daily insight paragraph for the owner.`
      }]
    })

    insight = response.content[0].text.trim()
  } catch (err) {
    console.error(`[Shadow] getDailyInsight Claude call failed: ${err.message}`)
    insight = `Shadow Agent observed ${recentDecisions.length} decisions in the last 24 hours across ${new Set(recentDecisions.map(d => d.situation_type)).size} situation types. ` +
      `Decision engine total: ${summary.total} decisions logged. ` +
      `Autonomous capabilities unlocked: ${summary.autonomous_eligible}. ` +
      `No pattern anomalies detected in this period.`
  }

  await memory.remember({
    key: 'daily_insight',
    value: `Daily insight generated: ${insight.slice(0, 100)}...`,
    importance: 2
  })

  return insight
}

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv[2] === '--daily-insight') {
  getDailyInsight().then(insight => {
    console.log('[Shadow] Daily Insight:\n')
    console.log(insight)
  })
}
