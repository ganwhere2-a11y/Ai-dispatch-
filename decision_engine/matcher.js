/**
 * Decision Matcher
 *
 * Compares a new situation to all past decisions and finds similar ones.
 * The more similar past decisions with good outcomes, the higher the confidence.
 *
 * Simple version: Imagine you've made 50 decisions about loads. This code
 * reads all 50 and asks "is this new load similar to ones I've seen before?"
 * If yes, and they all worked out well — the agent can act without asking.
 */

export const matcher = {

  /**
   * Find past decisions similar to the current situation.
   *
   * @param {Array} decisions - All past decisions
   * @param {string} situationType - e.g. "load_evaluation"
   * @param {string} agentName - e.g. "Erin"
   * @param {object} currentInputs - The current situation's data
   * @returns {{ confidence: number, autonomous: boolean, similar_count: number, recommendation: string|null }}
   */
  findSimilar(decisions, situationType, agentName, currentInputs) {
    const relevant = decisions.filter(d =>
      d.situation_type === situationType &&
      d.agent === agentName &&
      d.owner_decision !== null &&
      d.outcome !== null
    )

    if (relevant.length === 0) {
      return { confidence: 0, autonomous: false, similar_count: 0, recommendation: null }
    }

    // Score each past decision for similarity to current inputs
    const scored = relevant.map(d => ({
      decision: d,
      similarity: this.calculateSimilarity(d.inputs, currentInputs, situationType)
    }))

    // Only use decisions with similarity > 0.6
    const matches = scored.filter(s => s.similarity > 0.6)

    if (matches.length === 0) {
      return { confidence: 0.3, autonomous: false, similar_count: 0, recommendation: null }
    }

    // Weight confidence by similarity score and positive outcomes
    let totalWeight = 0
    let positiveWeight = 0
    let topRecommendation = null
    let topScore = 0

    for (const { decision, similarity } of matches) {
      const isPositive = this.isPositiveOutcome(decision.outcome)
      totalWeight += similarity
      if (isPositive) positiveWeight += similarity

      if (similarity > topScore && isPositive) {
        topScore = similarity
        topRecommendation = decision.recommendation
      }
    }

    const confidence = totalWeight > 0 ? positiveWeight / totalWeight : 0
    const autonomous = confidence >= 0.85 && matches.length >= 10

    return {
      confidence: Math.round(confidence * 100) / 100,
      autonomous,
      similar_count: matches.length,
      recommendation: topRecommendation
    }
  },

  /**
   * Calculate how similar two sets of inputs are.
   * Rules vary by situation type.
   */
  calculateSimilarity(pastInputs, currentInputs, situationType) {
    if (!pastInputs || !currentInputs) return 0

    switch (situationType) {
      case 'load_evaluation':
        return this.loadSimilarity(pastInputs, currentInputs)
      case 'carrier_selection':
        return this.carrierSimilarity(pastInputs, currentInputs)
      case 'rate_quote':
        return this.rateSimilarity(pastInputs, currentInputs)
      default:
        return this.genericSimilarity(pastInputs, currentInputs)
    }
  },

  loadSimilarity(past, current) {
    let score = 0
    let factors = 0

    // Route similarity (same origin/dest region = high match)
    if (past.route && current.route) {
      const pastParts = past.route.split('→')
      const currentParts = current.route.split('→')
      if (pastParts[0]?.trim() === currentParts[0]?.trim()) { score += 0.3; factors++ }
      if (pastParts[1]?.trim() === currentParts[1]?.trim()) { score += 0.3; factors++ }
    }

    // RPM similarity (within 15 cents = close match)
    if (past.rate_per_mile && current.rate_per_mile) {
      const diff = Math.abs(past.rate_per_mile - current.rate_per_mile)
      if (diff < 0.15) score += 0.2
      else if (diff < 0.30) score += 0.1
      factors++
    }

    // Deadhead similarity (within 20 miles = close)
    if (past.deadhead_miles !== undefined && current.deadhead_miles !== undefined) {
      const diff = Math.abs(past.deadhead_miles - current.deadhead_miles)
      if (diff < 20) score += 0.1
      factors++
    }

    // Profit tier similarity
    if (past.profit !== undefined && current.profit !== undefined) {
      const sameTier = this.profitTier(past.profit) === this.profitTier(current.profit)
      if (sameTier) score += 0.1
      factors++
    }

    return factors > 0 ? Math.min(score, 1.0) : 0
  },

  profitTier(profit) {
    if (profit < 0) return 'loss'
    if (profit < 200) return 'borderline'
    if (profit < 400) return 'decent'
    return 'strong'
  },

  carrierSimilarity(past, current) {
    let score = 0
    if (past.equipment_type === current.equipment_type) score += 0.4
    if (past.authority_age_days && current.authority_age_days) {
      const diff = Math.abs(past.authority_age_days - current.authority_age_days)
      if (diff < 180) score += 0.3
    }
    if (past.safety_rating === current.safety_rating) score += 0.3
    return score
  },

  rateSimilarity(past, current) {
    let score = 0
    if (past.lane === current.lane) score += 0.5
    if (past.freight_type === current.freight_type) score += 0.3
    if (past.loaded_miles && current.loaded_miles) {
      const diff = Math.abs(past.loaded_miles - current.loaded_miles)
      if (diff < 100) score += 0.2
    }
    return score
  },

  genericSimilarity(past, current) {
    const pastKeys = Object.keys(past)
    const currentKeys = Object.keys(current)
    const commonKeys = pastKeys.filter(k => currentKeys.includes(k))
    if (commonKeys.length === 0) return 0

    let matches = 0
    for (const key of commonKeys) {
      if (past[key] === current[key]) matches++
    }
    return matches / commonKeys.length
  },

  isPositiveOutcome(outcome) {
    if (!outcome) return false
    const negative = ['loss', 'failed', 'rejected', 'late', 'complaint', 'dispute', 'cancelled']
    const outcomeLower = outcome.toLowerCase()
    return !negative.some(n => outcomeLower.includes(n))
  }
}
