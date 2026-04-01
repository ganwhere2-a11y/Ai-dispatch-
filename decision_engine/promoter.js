/**
 * Decision Promoter
 *
 * When an agent has made enough good decisions of the same type,
 * this module marks them as "autonomous eligible" — meaning the
 * agent has EARNED the right to act without asking.
 *
 * Simple version: Think of it like getting a driver's license.
 * You have to prove you can drive safely many times before you
 * get to drive alone. The promoter checks your record and
 * gives you the license when you've earned it.
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DECISIONS_FILE = path.join(__dirname, '../data/decisions/decisions.json')

const PROMOTION_RULES = {
  min_similar_decisions: 10,    // Must have seen this situation at least 10 times
  min_confidence: 0.85,         // 85%+ of those times must have gone well
  max_failures: 1,              // No more than 1 bad outcome in the last 10
  review_cycle_days: 30         // Re-evaluate every 30 days
}

export const promoter = {

  /**
   * Check if a situation type should be promoted to autonomous for a given agent.
   * Called automatically after every outcome update.
   */
  async checkPromotion(situationType, agentName, decisions) {
    const relevant = decisions.filter(d =>
      d.situation_type === situationType &&
      d.agent === agentName &&
      d.outcome !== null &&
      d.confidence_after !== null
    )

    if (relevant.length < PROMOTION_RULES.min_similar_decisions) {
      return { promoted: false, reason: `Only ${relevant.length}/${PROMOTION_RULES.min_similar_decisions} decisions logged` }
    }

    // Look at the last N decisions
    const recent = relevant.slice(-PROMOTION_RULES.min_similar_decisions)
    const failures = recent.filter(d => d.confidence_after < 0.5).length
    const avgConfidence = recent.reduce((sum, d) => sum + (d.confidence_after || 0), 0) / recent.length

    if (failures > PROMOTION_RULES.max_failures) {
      return { promoted: false, reason: `${failures} failures in last ${PROMOTION_RULES.min_similar_decisions} decisions` }
    }

    if (avgConfidence < PROMOTION_RULES.min_confidence) {
      return { promoted: false, reason: `Average confidence ${(avgConfidence * 100).toFixed(0)}% is below 85% threshold` }
    }

    // Promote all recent matching decisions
    const raw = await fs.readFile(DECISIONS_FILE, 'utf8')
    const allDecisions = JSON.parse(raw)

    let promoted = 0
    for (const d of allDecisions) {
      if (d.situation_type === situationType && d.agent === agentName && !d.autonomous_eligible) {
        d.autonomous_eligible = true
        promoted++
      }
    }

    await fs.writeFile(DECISIONS_FILE, JSON.stringify(allDecisions, null, 2))

    console.log(`[Promoter] PROMOTED: ${agentName} can now handle "${situationType}" autonomously (${promoted} decisions updated)`)

    return {
      promoted: true,
      agent: agentName,
      situation_type: situationType,
      avg_confidence: avgConfidence,
      decisions_count: relevant.length
    }
  },

  /**
   * Get all autonomous-eligible decision types for a given agent.
   * Agents call this at startup to know what they can do without asking.
   */
  async getAutonomousCapabilities(agentName, decisions) {
    const eligible = [...new Set(
      decisions
        .filter(d => d.agent === agentName && d.autonomous_eligible)
        .map(d => d.situation_type)
    )]

    return eligible
  },

  /**
   * Demote an autonomous capability if a bad outcome occurs.
   * Called when owner manually overrides an autonomous decision.
   */
  async demote(situationType, agentName) {
    const raw = await fs.readFile(DECISIONS_FILE, 'utf8')
    const decisions = JSON.parse(raw)

    let demoted = 0
    for (const d of decisions) {
      if (d.situation_type === situationType && d.agent === agentName && d.autonomous_eligible) {
        d.autonomous_eligible = false
        demoted++
      }
    }

    await fs.writeFile(DECISIONS_FILE, JSON.stringify(decisions, null, 2))
    console.log(`[Promoter] DEMOTED: ${agentName} on "${situationType}" (${demoted} decisions reset)`)
  }
}
