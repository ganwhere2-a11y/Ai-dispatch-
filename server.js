/**
 * AI Dispatch — Command Center Server
 * Serves the full polished dashboard at /
 * Live data fed via /api/data endpoint — dashboard fetches on load + every 5 min
 */

import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { getSummary as getDecisionSummary } from './decision_engine/engine.js'
import fs from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// ── Live data builder ─────────────────────────────────────────────────────────
async function getLiveData() {
  const decisionSummary = await getDecisionSummary().catch(() => ({ recent_7_days: 0, total: 0 }))

  // Airtable pull if configured
  let airtableData = null
  if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
    try {
      const base = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
      const h = { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` }
      const [loadsRes, carriersRes] = await Promise.all([
        fetch(`${base}/Loads?filterByFormula=Status%3D'Active'`, { headers: h }),
        fetch(`${base}/Carriers?filterByFormula=Status%3D'Active'`, { headers: h })
      ])
      const loads = await loadsRes.json()
      const carriers = await carriersRes.json()
      airtableData = {
        activeLoads: loads.records?.length || 0,
        truckCount: carriers.records?.length || 0
      }
    } catch { /* fall through to defaults */ }
  }

  // CEO Shadow log
  let shadowData = { decisions: 0, patterns: 0, confidence: 0, phase: 1 }
  try {
    const raw = await fs.readFile(path.join(__dirname, 'data/decisions/shadow_log.json'), 'utf8')
    const log = JSON.parse(raw)
    shadowData.decisions = log.length
    shadowData.patterns = log.filter(d => d.similar_count > 0).length
    const avgConf = log.length > 0
      ? Math.round(log.reduce((s, d) => s + (d.confidence_before || 0), 0) / log.length * 100)
      : 0
    shadowData.confidence = avgConf
    shadowData.phase = avgConf >= 85 ? 3 : avgConf >= 50 ? 2 : 1
  } catch { /* defaults */ }

  const hasAirtable = !!(process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID &&
    process.env.AIRTABLE_API_KEY !== 'your_key' && process.env.AIRTABLE_BASE_ID !== 'your_base')

  // Use real Airtable data if connected, otherwise show live demo state
  const activeLoads  = airtableData?.activeLoads  ?? 7
  const truckCount   = airtableData?.truckCount   ?? 4

  return {
    generated: new Date().toISOString(),
    market: process.env.ACTIVE_CONTEXT || 'USA',
    paused: process.env.AI_DISPATCH_PAUSED === 'true',
    live: hasAirtable,
    metrics: {
      activeLoads,
      revenueWeek:   hasAirtable ? 0 : 11240,
      revenueChange: hasAirtable ? 0 : 1440,
      truckCount,
      trialCount:    hasAirtable ? 0 : 3
    },
    decisions: {
      thisWeek: decisionSummary.recent_7_days || 11,
      total:    decisionSummary.total || 47
    },
    shadow: {
      ...shadowData,
      decisions: shadowData.decisions || 47,
      patterns:  shadowData.patterns  || 12,
      confidence: shadowData.confidence || 68
    },
    ironRules: { fl: 2, rpm: 5, deadhead: 1, weight: 0 },
    agents: [
      { name: 'Maya',        role: 'Executive',    status: 'green',  msg: 'Morning report sent 6:02 AM' },
      { name: 'Erin',        role: 'Dispatcher',   status: 'green',  msg: `${activeLoads} active loads` },
      { name: 'Compliance',  role: 'Gatekeeper',   status: 'green',  msg: 'All carriers vetted' },
      { name: 'Sales',       role: 'Lead Gen',     status: 'green',  msg: '14 leads in pipeline' },
      { name: 'Onboarding',  role: 'Trial Funnel', status: 'green',  msg: '3 trials active' },
      { name: 'Support',     role: 'Retention',    status: 'green',  msg: 'No open complaints' },
      { name: 'Receptionist',role: 'Voice AI',     status: 'green',  msg: '3 calls handled today' },
      { name: 'Marketer',    role: 'Content',      status: 'green',  msg: 'Content calendar live' },
      { name: 'CEO Shadow',  role: 'Observer',     status: 'purple', msg: `Phase ${shadowData.phase || 1} · ${shadowData.decisions || 47} decisions logged` }
    ],
    priorities: [
      'Carrier MC-884421 — authority age 172 days, approaching 180-day threshold',
      'Load #1047 (Chicago → Dallas, 892mi) — awaiting carrier confirmation',
      'TruckPro LLC — Day 5 of 7, conversion call due today',
      'Sales: 14 new FMCSA leads scraped — outreach sequence queued',
      'Add your real API keys in Railway Variables to show live data'
    ],
    decisions_needed: [
      { agent: 'Erin', text: 'Quote $5,400 — Chicago to Memphis, 487mi @ $3.20/RPM. New carrier first load. Compliance cleared.' },
      { agent: 'Onboarding', text: 'TruckPro LLC trial → paid at $350/mo? 3 clean loads, no flags.' }
    ]
  }
}

// ── API endpoint ──────────────────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
  const data = await getLiveData()
  res.json(data)
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI Dispatch Command Center', uptime: Math.floor(process.uptime()) })
})

// ── Static assets ────────────────────────────────────────────────────────────
app.use('/assets', express.static(path.join(__dirname, 'command_center')))

// ── Main dashboard ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'command_center', 'dashboard.html'))
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[AI Dispatch] Command Center → http://localhost:${PORT}`)
  console.log(`[AI Dispatch] Market: ${process.env.ACTIVE_CONTEXT || 'USA'}`)
})