/**
 * Memory Router
 *
 * Every agent has its own memory namespace.
 * This router makes sure each agent reads and writes only to their own section
 * in data/sops/library.json — like giving each person their own notebook
 * instead of everyone scribbling in the same one.
 *
 * Also handles:
 * - Workshop completion tracking (read/write scores)
 * - Platform setup status
 * - In-flight load state (for kill switch layer 2)
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LIBRARY_FILE = path.join(__dirname, '../data/sops/library.json')

// ─── Core Read/Write ─────────────────────────────────────────────────────────

async function readLibrary() {
  try {
    const raw = await fs.readFile(LIBRARY_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { workshops: {}, agent_memories: {}, platform_setup_complete: false, platform_setup: {} }
  }
}

async function writeLibrary(data) {
  await fs.writeFile(LIBRARY_FILE, JSON.stringify(data, null, 2))
}

// ─── Agent Memory Routing ─────────────────────────────────────────────────────

/**
 * Write a memory entry to the correct agent namespace.
 * Each agent's memories are isolated under agent_memories[agentName].
 */
export async function routeWrite(agentName, key, value, metadata = {}) {
  const lib = await readLibrary()

  if (!lib.agent_memories[agentName]) {
    lib.agent_memories[agentName] = {}
  }

  lib.agent_memories[agentName][key] = {
    value,
    timestamp: new Date().toISOString(),
    importance: metadata.importance || 1,
    source: metadata.source || agentName,
    recall_count: 0
  }

  await writeLibrary(lib)
  return key
}

/**
 * Read memories for a specific agent only.
 * No agent can read another agent's private memories.
 */
export async function routeRead(agentName, query = null) {
  const lib = await readLibrary()
  const agentMemories = lib.agent_memories[agentName] || {}

  if (!query) return Object.entries(agentMemories).map(([k, v]) => ({ key: k, ...v }))

  // Simple relevance filter by query keyword
  const queryLower = query.toLowerCase()
  return Object.entries(agentMemories)
    .filter(([k, v]) =>
      k.toLowerCase().includes(queryLower) ||
      String(v.value).toLowerCase().includes(queryLower)
    )
    .map(([k, v]) => ({ key: k, ...v }))
    .sort((a, b) => (b.importance - a.importance))
    .slice(0, 5)
}

/**
 * Get the full memory namespace for a given agent — for buildContext().
 */
export async function getAgentNamespace(agentName) {
  const lib = await readLibrary()
  return lib.agent_memories[agentName] || {}
}

// ─── Workshop Tracking ────────────────────────────────────────────────────────

/**
 * Mark a workshop as completed with a score.
 * Called at the end of each /workshop command.
 *
 * @param {string} workshopName - e.g. 'dispatch_basics'
 * @param {number} score - 0–100
 */
export async function completeWorkshop(workshopName, score) {
  const lib = await readLibrary()

  if (!lib.workshops) lib.workshops = {}
  if (!lib.workshops[workshopName]) lib.workshops[workshopName] = { status: 'not_started', score: null, attempts: 0, shadow_flags: [] }

  lib.workshops[workshopName].status = score >= 70 ? 'completed' : 'attempted'
  lib.workshops[workshopName].score = score
  lib.workshops[workshopName].completed_at = score >= 70 ? new Date().toISOString() : null
  lib.workshops[workshopName].attempts = (lib.workshops[workshopName].attempts || 0) + 1

  // Also update legacy workshops_completed array
  if (score >= 70 && !lib.workshops_completed.includes(workshopName)) {
    lib.workshops_completed.push(workshopName)
  }

  await writeLibrary(lib)
  return { workshop: workshopName, score, status: lib.workshops[workshopName].status }
}

/**
 * Add a Shadow flag to a workshop — when owner's real decisions contradict the lesson.
 */
export async function flagWorkshopContradiction(workshopName, note) {
  const lib = await readLibrary()

  if (!lib.workshops?.[workshopName]) return
  lib.workshops[workshopName].shadow_flags = lib.workshops[workshopName].shadow_flags || []
  lib.workshops[workshopName].shadow_flags.push({
    note,
    flagged_at: new Date().toISOString()
  })

  await writeLibrary(lib)
}

/**
 * Get all workshop statuses — for Shadow's training report and Maya's morning brief.
 */
export async function getWorkshopSummary() {
  const lib = await readLibrary()
  const workshops = lib.workshops || {}

  const total = Object.keys(workshops).length
  const completed = Object.values(workshops).filter(w => w.status === 'completed').length
  const inProgress = Object.values(workshops).filter(w => w.status === 'attempted').length
  const avgScore = Object.values(workshops)
    .filter(w => w.score !== null)
    .reduce((sum, w, _, arr) => sum + w.score / arr.length, 0)

  return {
    total,
    completed,
    in_progress: inProgress,
    not_started: total - completed - inProgress,
    average_score: Math.round(avgScore) || null,
    details: workshops
  }
}

// ─── Platform Setup Tracking ──────────────────────────────────────────────────

/**
 * Mark a platform setup item as complete.
 * @param {string} item - e.g. 'railway', 'google_cloud', 'airtable'
 */
export async function markPlatformSetup(item) {
  const lib = await readLibrary()
  if (!lib.platform_setup) lib.platform_setup = {}
  lib.platform_setup[item] = true

  // Check if all items are complete
  const allDone = Object.values(lib.platform_setup).every(Boolean)
  lib.platform_setup_complete = allDone

  await writeLibrary(lib)
  return { item, complete: true, all_done: allDone }
}

// ─── In-Flight Load State (for Kill Switch Layer 2) ───────────────────────────

/**
 * Register a load as "in flight" — picked up, not yet delivered.
 * Maya checks this before applying a hard pause.
 */
export async function registerInFlightLoad(loadId, loadData) {
  const lib = await readLibrary()
  if (!lib.in_flight_loads) lib.in_flight_loads = {}
  lib.in_flight_loads[loadId] = {
    ...loadData,
    in_flight_since: new Date().toISOString()
  }
  await writeLibrary(lib)
}

/**
 * Mark a load as delivered — remove from in-flight.
 */
export async function clearInFlightLoad(loadId) {
  const lib = await readLibrary()
  if (lib.in_flight_loads?.[loadId]) {
    delete lib.in_flight_loads[loadId]
    await writeLibrary(lib)
  }
}

/**
 * Get all currently in-flight loads.
 * Used by Maya when AI_DISPATCH_PAUSED=true to tell owner what's still moving.
 */
export async function getInFlightLoads() {
  const lib = await readLibrary()
  return lib.in_flight_loads || {}
}
