/**
 * Shared Memory Module
 *
 * Every AI agent in this system uses this module to:
 * 1. Remember things they've learned from past interactions
 * 2. Recall relevant memories before acting
 * 3. Build up knowledge over time so they stop asking the same questions
 *
 * Simple version: It's like each agent has their own notebook. When
 * they learn something new, they write it down. Before they do anything,
 * they flip through their notebook to see if they've seen this before.
 * The more they write, the smarter they get.
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getConfidence, logDecision } from '../decision_engine/engine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * AgentMemory class — one instance per agent.
 * Each agent creates their own: const memory = new AgentMemory('Erin')
 */
export class AgentMemory {
  constructor(agentName) {
    this.agentName = agentName
    this.memoryFile = path.join(__dirname, `../data/sops/library.json`)
    this.sessionMemory = []  // Short-term: current session only
  }

  /**
   * Remember something new — write it to the agent's long-term memory store.
   *
   * @param {object} params
   * @param {string} params.key - What category this memory belongs to
   * @param {string} params.value - What was learned
   * @param {string} [params.source] - Where this came from (decision ID, client name, etc.)
   * @param {number} [params.importance] - 1-5, default 3
   */
  async remember(params) {
    const library = await this._loadLibrary()

    if (!library.agent_memories[this.agentName]) {
      library.agent_memories[this.agentName] = []
    }

    const memory = {
      id: `mem_${this.agentName}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      key: params.key,
      value: params.value,
      source: params.source || null,
      importance: params.importance || 3,
      recall_count: 0,
      last_recalled: null
    }

    library.agent_memories[this.agentName].push(memory)
    await this._saveLibrary(library)

    // Also keep in session memory
    this.sessionMemory.push(memory)

    return memory.id
  }

  /**
   * Recall relevant memories for a given topic or situation.
   * Returns the most important/recent memories matching the query.
   *
   * @param {string} query - What to look for
   * @param {number} [limit] - Max memories to return, default 5
   */
  async recall(query, limit = 5) {
    const library = await this._loadLibrary()
    const agentMems = library.agent_memories[this.agentName] || []

    const queryLower = query.toLowerCase()

    // Score memories by relevance
    const scored = agentMems.map(m => {
      let score = 0
      if (m.key.toLowerCase().includes(queryLower)) score += 3
      if (m.value.toLowerCase().includes(queryLower)) score += 2
      if (m.source && m.source.toLowerCase().includes(queryLower)) score += 1
      score += m.importance * 0.5
      // Recency boost — memories from last 30 days get a bump
      const ageMs = Date.now() - new Date(m.timestamp).getTime()
      const ageDays = ageMs / (1000 * 60 * 60 * 24)
      if (ageDays < 30) score += 1
      return { memory: m, score }
    })

    const relevant = scored
      .filter(s => s.score > 1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.memory)

    // Update recall counts
    for (const m of relevant) {
      m.recall_count++
      m.last_recalled = new Date().toISOString()
    }
    if (relevant.length > 0) await this._saveLibrary(library)

    return relevant
  }

  /**
   * Get confidence level for a decision type.
   * Wraps the Decision Engine's confidence check.
   *
   * @param {string} situationType
   * @param {object} currentInputs
   * @returns {{ confidence: number, autonomous: boolean, recommendation: string|null }}
   */
  async checkConfidence(situationType, currentInputs) {
    return getConfidence(situationType, this.agentName, currentInputs)
  }

  /**
   * Log a decision to the Decision Engine.
   * Shorthand so agents don't have to import engine directly.
   */
  async logDecision(params) {
    return logDecision({ ...params, agent: this.agentName })
  }

  /**
   * Build a memory context string to inject into Claude API calls.
   * This is what makes Claude "remember" previous interactions.
   *
   * @param {string} topic - What topic the current task is about
   * @returns {string} - A formatted string to prepend to the system prompt
   */
  async buildContext(topic) {
    const memories = await this.recall(topic, 5)

    if (memories.length === 0) {
      return `[${this.agentName} Memory]: No relevant past experience on "${topic}" yet. Proceeding fresh.`
    }

    const lines = memories.map((m, i) =>
      `${i + 1}. [${m.key}] ${m.value}${m.source ? ` (from: ${m.source})` : ''}`
    )

    return `[${this.agentName} Memory — Relevant Experience on "${topic}"]:\n${lines.join('\n')}\n\nUse this past experience to inform your current action.`
  }

  /**
   * Forget outdated or incorrect memories.
   * Call this when you know a past memory is wrong.
   */
  async forget(memoryId) {
    const library = await this._loadLibrary()
    const mems = library.agent_memories[this.agentName] || []
    library.agent_memories[this.agentName] = mems.filter(m => m.id !== memoryId)
    await this._saveLibrary(library)
  }

  /**
   * Get all memories for this agent (for Maya's summary report).
   */
  async getAllMemories() {
    const library = await this._loadLibrary()
    return library.agent_memories[this.agentName] || []
  }

  async _loadLibrary() {
    try {
      const raw = await fs.readFile(this.memoryFile, 'utf8')
      return JSON.parse(raw)
    } catch {
      return { workshops_completed: [], agent_memories: {} }
    }
  }

  async _saveLibrary(library) {
    await fs.writeFile(this.memoryFile, JSON.stringify(library, null, 2))
  }
}

/**
 * Quick helper to get a memory instance for any agent.
 * Usage: const mem = getMemory('Erin')
 */
export function getMemory(agentName) {
  return new AgentMemory(agentName)
}
