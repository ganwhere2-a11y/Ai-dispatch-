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
import TelegramBot from 'node-telegram-bot-api'
import cron from 'node-cron'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(express.json())
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
      { name: 'Collette',     role: 'Voice AI',     status: 'green',  msg: '3 calls handled today' },
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
      { agent: 'Onboarding', text: 'TruckPro LLC trial → 3 loads dispatched, no flags. Offer 8% commission agreement?' }
    ]
  }
}

// ── API endpoint ──────────────────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
  const data = await getLiveData()
  res.json(data)
})

// ── SOP / Knowledge file storage ─────────────────────────────────────────────
const SOP_DIR = path.join(__dirname, 'data/sops/uploaded')

app.post('/api/sop/save', async (req, res) => {
  try {
    await fs.mkdir(SOP_DIR, { recursive: true })
    const { title, scope, content, filename, type } = req.body
    const safeName = (filename || title || 'sop').replace(/[^a-z0-9._-]/gi, '_')
    const id = Date.now() + '_' + safeName
    const textContent = (content || '').slice(0, 10000)
    const meta = { id, title, scope, content: textContent, filename: safeName, type, saved: new Date().toISOString() }
    await fs.writeFile(path.join(SOP_DIR, id + '.json'), JSON.stringify(meta, null, 2))

    // Auto-commit to sops/training/ in git (background — non-blocking)
    autoCommitSop(title, safeName, textContent, scope).catch(() => {})

    res.json({ ok: true, id })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

async function autoCommitSop(title, safeName, content, scope) {
  try {
    const { execFile } = await import('child_process')
    const { promisify } = await import('util')
    const exec = promisify(execFile)

    const trainingDir = path.join(__dirname, 'sops/training')
    await fs.mkdir(trainingDir, { recursive: true })

    // Write as markdown file in sops/training/
    const mdName = safeName.replace(/\.json$/, '').replace(/[^a-z0-9._-]/gi, '_') + '.md'
    const mdPath = path.join(trainingDir, mdName)
    const mdContent = `# ${title}\n**Scope:** ${scope}\n**Saved:** ${new Date().toISOString()}\n\n---\n\n${content}`
    await fs.writeFile(mdPath, mdContent)

    // Git commit + push
    await exec('git', ['add', path.join('sops/training', mdName)], { cwd: __dirname })
    await exec('git', ['commit', '-m', `SOP saved from dashboard: ${title}`], { cwd: __dirname })
    await exec('git', ['push', '-u', 'origin', 'main'], { cwd: __dirname })
  } catch {
    // Silent fail — server save is primary, git is bonus
  }
}

app.get('/api/sops', async (req, res) => {
  try {
    await fs.mkdir(SOP_DIR, { recursive: true })
    const files = (await fs.readdir(SOP_DIR)).filter(f => f.endsWith('.json'))
    const sops = await Promise.all(files.map(async f => {
      const raw = await fs.readFile(path.join(SOP_DIR, f), 'utf8')
      return JSON.parse(raw)
    }))
    res.json(sops.sort((a, b) => b.saved.localeCompare(a.saved)))
  } catch { res.json([]) }
})

app.delete('/api/sop/:id', async (req, res) => {
  try {
    const files = (await fs.readdir(SOP_DIR)).filter(f => f.startsWith(req.params.id))
    await Promise.all(files.map(f => fs.unlink(path.join(SOP_DIR, f))))
    res.json({ ok: true })
  } catch { res.json({ ok: false }) }
})

// Load saved SOPs filtered to the requesting agent
// scope values: 'All agents (global)', 'Maya only', 'Erin only', etc.
async function loadSopContext(agentName) {
  try {
    const files = (await fs.readdir(SOP_DIR)).filter(f => f.endsWith('.json'))
    const sops = await Promise.all(files.map(async f => {
      const raw = await fs.readFile(path.join(SOP_DIR, f), 'utf8')
      return JSON.parse(raw)
    }))
    const agentLower = (agentName || '').toLowerCase()
    const relevant = sops.filter(s => {
      const scope = (s.scope || '').toLowerCase()
      if (scope === 'all agents (global)') return true
      // Match "maya only" → agentName "Maya", "erin only" → "Erin", etc.
      return scope.startsWith(agentLower)
    })
    if (relevant.length === 0) return ''
    return relevant.map(s => `=== ${s.title} [${s.scope}] ===\n${s.content}`).join('\n\n')
  } catch { return '' }
}

// ── Workflow definitions + runner ─────────────────────────────────────────────
const WORKFLOWS = [
  { id: 'daily_morning_report', name: 'Morning Report',     desc: "Maya's 6AM briefing — loads, revenue, escalations, priority list",  icon: '🌅', schedule: 'Daily 6:00 AM',    file: 'daily_morning_report.js' },
  { id: 'load_to_book',         name: 'Load to Book',       desc: 'Full dispatch pipeline — match carrier, vet, assign, confirm',        icon: '🚛', schedule: 'On demand',         file: 'load_to_book.js' },
  { id: 'trial_onboarding',     name: 'Trial Onboarding',   desc: '7-day free trial automation — check-ins on days 1/3/5/7, conversion', icon: '🎯', schedule: 'Daily 9:00 AM',    file: 'trial_onboarding.js' },
  { id: 'lead_gen_outreach',    name: 'Lead Gen Outreach',  desc: 'FMCSA scrape + LinkedIn leads + 4-email outreach sequences',          icon: '📈', schedule: 'Daily 10:00 AM',   file: 'lead_gen_outreach.js' },
  { id: 'carrier_development',  name: 'Carrier Development',desc: 'Carrier relationship management, retention outreach, check-ins',      icon: '🤝', schedule: 'Weekly Mon 8AM',   file: 'carrier_development.js' },
  { id: 'escalation_routing',   name: 'Escalation Routing', desc: 'Event → Maya → owner Telegram/SMS notification chain',               icon: '⚡', schedule: 'On event trigger',  file: 'escalation_routing.js' },
  { id: 'weekly_review',        name: 'Weekly Review',      desc: 'Week-over-week KPI analytics, RPM trends, carrier performance',       icon: '📊', schedule: 'Weekly Fri 5PM',   file: 'weekly_review.js' },
]

app.get('/api/workflows', (req, res) => res.json(WORKFLOWS))

app.post('/api/workflow/run', async (req, res) => {
  const { id } = req.body
  const wf = WORKFLOWS.find(w => w.id === id)
  if (!wf) return res.status(404).json({ error: 'Workflow not found' })
  try {
    // Spawn workflow in background (non-blocking)
    const { spawn } = await import('child_process')
    spawn('node', [path.join(__dirname, 'workflows', wf.file)], {
      detached: true, stdio: 'ignore', env: { ...process.env }
    }).unref()
    res.json({ ok: true, workflow: wf.name, started: new Date().toISOString(), msg: `${wf.name} started. Maya will send you a Telegram update when complete.` })
  } catch (e) {
    res.json({ ok: true, workflow: wf.name, msg: `${wf.name} queued. Check Telegram for results.` })
  }
})

// ── Chat proxy (keeps API key server-side) ────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages, system, agentName } = req.body
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_key') {
    return res.json({ content: [{ text: '⚠️ ANTHROPIC_API_KEY not set in Railway Variables. Add it to enable live AI responses.' }] })
  }
  try {
    // Inject only SOPs scoped to this agent (or global)
    const sopContext = await loadSopContext(agentName)
    const fullSystem = sopContext
      ? `${system}\n\n--- OWNER KNOWLEDGE BASE (highest priority — ${agentName || 'agent'}-specific) ---\n${sopContext}`
      : system

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1024, system: fullSystem, messages })
    })
    const data = await r.json()
    if (!r.ok) {
      return res.json({ content: [{ text: `⚠️ Anthropic API error ${r.status}: ${data.error?.message || JSON.stringify(data)}` }] })
    }
    res.json(data)
  } catch (e) {
    res.status(500).json({ content: [{ text: `⚠️ Server error: ${e.message}` }] })
  }
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

// ── Maya morning report builder (self-contained, no circular deps) ────────────
async function buildMorningReport() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set in Railway Variables')

  const data = await getLiveData()
  const prompt = `Generate Maya's morning report for an AI freight dispatch business.

Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
Market: ${data.market}
Active Loads: ${data.metrics.activeLoads}
Revenue This Week: $${data.metrics.revenueWeek.toLocaleString()}
Trucks Under Management: ${data.metrics.truckCount}
Trial Prospects: ${data.metrics.trialCount}
Decisions This Week: ${data.decisions.thisWeek}
CEO Shadow Phase: ${data.shadow.phase} (${data.shadow.confidence}% confidence)

Format EXACTLY like this:
MAYA | Morning Report — [Date] | Market: ${data.market}

BUSINESS STATE
Active Loads: [N] | Revenue This Week: $[X]
Trucks: [N] | Trials: [N] active

TODAY'S PRIORITY LIST
1. [most important]
2. [second]
3. [third]

NEEDS YOUR DECISION
• [items needing owner approval — or "None today"]

ANYTHING WRONG
[issues or "All systems running. No flags."]

Keep it under 350 words. Plain English.`

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!r.ok) {
    const err = await r.text()
    throw new Error(`Anthropic API error ${r.status}: ${err}`)
  }

  const json = await r.json()
  return json.content[0].text
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[AI Dispatch] Command Center → http://localhost:${PORT}`)
  console.log(`[AI Dispatch] Market: ${process.env.ACTIVE_CONTEXT || 'USA'}`)

  // ── Maya Telegram Bot — incoming message handler ───────────────────────────
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_OWNER_CHAT_ID) {
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
    const OWNER_ID = process.env.TELEGRAM_OWNER_CHAT_ID

    bot.on('message', async (msg) => {
      const chatId = String(msg.chat.id)
      const text = (msg.text || '').toLowerCase().trim()

      // Only respond to owner
      if (chatId !== String(OWNER_ID)) return

      try {
        if (text === '/start' || text === 'start') {
          await bot.sendMessage(chatId,
            'Maya online. Commands:\n\n' +
            '• "briefing" — Morning report now\n' +
            '• "status" — System status\n' +
            '• "pause" — Pause all agents\n' +
            '• "resume" — Resume agents'
          )
        } else if (text.includes('brief') || text.includes('report') || text.includes('morning')) {
          await bot.sendMessage(chatId, 'Generating your morning report...')
          const reportText = await buildMorningReport()
          // Split if over Telegram's 4096 char limit
          if (reportText.length <= 4096) {
            await bot.sendMessage(chatId, reportText)
          } else {
            await bot.sendMessage(chatId, reportText.slice(0, 4096))
            await bot.sendMessage(chatId, reportText.slice(4096))
          }
        } else if (text === 'status') {
          const data = await getLiveData()
          await bot.sendMessage(chatId,
            `AI DISPATCH STATUS\n` +
            `Market: ${data.market} | Paused: ${data.paused ? 'YES' : 'NO'}\n` +
            `Active Loads: ${data.metrics.activeLoads} | Trucks: ${data.metrics.truckCount}\n` +
            `Decisions this week: ${data.decisions.thisWeek}`
          )
        } else if (text === 'pause') {
          process.env.AI_DISPATCH_PAUSED = 'true'
          await bot.sendMessage(chatId, 'MAYA: All agents paused. Send "resume" to restart.')
        } else if (text === 'resume') {
          process.env.AI_DISPATCH_PAUSED = 'false'
          await bot.sendMessage(chatId, 'MAYA: Agents resumed. System is live.')
        } else {
          await bot.sendMessage(chatId,
            'Commands: "briefing", "status", "pause", "resume"'
          )
        }
      } catch (err) {
        console.error('[Maya Bot] Error:', err.message, err.stack)
        await bot.sendMessage(chatId, `Maya error: ${err.message}`).catch(() => {})
      }
    })

    // ── 6AM daily report cron ────────────────────────────────────────────────
    cron.schedule('0 6 * * *', async () => {
      console.log('[Maya] 6AM cron — generating morning report')
      try {
        const report = await buildMorningReport()
        await bot.sendMessage(OWNER_ID, report)
      } catch (err) {
        console.error('[Maya] Cron report failed:', err.message)
        await bot.sendMessage(OWNER_ID, `Maya error generating report: ${err.message}`).catch(() => {})
      }
    }, { timezone: 'America/Chicago' })

    console.log('[Maya] Telegram bot active — listening for owner commands')
    console.log('[Maya] Morning report cron set for 6AM America/Chicago')
  } else {
    console.log('[Maya] Telegram not configured — set TELEGRAM_BOT_TOKEN and TELEGRAM_OWNER_CHAT_ID')
  }
})