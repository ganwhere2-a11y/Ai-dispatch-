/**
 * AI Dispatch — System Health Check
 *
 * Run before starting agents to verify your environment is configured.
 * This does NOT require all keys to be set — it shows you exactly what's
 * missing and what's live, then tells you which agents can actually run.
 *
 * Usage: npm run health
 */

import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

// ─── Terminal Colors ────────────────────────────────────────────────────────

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m'
}

const ok = `${C.green}✓${C.reset}`
const fail = `${C.red}✗${C.reset}`
const warn = `${C.yellow}⚠${C.reset}`
const dash = `${C.gray}–${C.reset}`

// ─── Required Variables by Agent ───────────────────────────────────────────

const AGENT_REQUIREMENTS = {
  'Maya (Reports)': ['ANTHROPIC_API_KEY', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_OWNER_CHAT_ID'],
  'Erin (Dispatcher)': ['ANTHROPIC_API_KEY', 'AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID'],
  'Compliance': ['ANTHROPIC_API_KEY', 'FMCSA_API_KEY'],
  'Sales': ['ANTHROPIC_API_KEY', 'AIRTABLE_API_KEY', 'FMCSA_API_KEY'],
  'Onboarding': ['ANTHROPIC_API_KEY', 'AIRTABLE_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
  'Support': ['ANTHROPIC_API_KEY', 'AIRTABLE_API_KEY'],
  'Collette': ['RETELL_API_KEY', 'RETELL_AGENT_ID', 'RETELL_WEBHOOK_SECRET'],
  'Marketer': ['ANTHROPIC_API_KEY'],
  'Shadow': ['ANTHROPIC_API_KEY']
}

const ALL_VARS = {
  // Critical
  ANTHROPIC_API_KEY: { label: 'Claude AI', critical: true },
  TELEGRAM_BOT_TOKEN: { label: 'Telegram bot', critical: true },
  TELEGRAM_OWNER_CHAT_ID: { label: 'Telegram chat ID', critical: true },
  AIRTABLE_API_KEY: { label: 'Airtable DB', critical: true },
  AIRTABLE_BASE_ID: { label: 'Airtable base', critical: true },
  // Standard
  FMCSA_API_KEY: { label: 'FMCSA SAFER API', critical: false },
  RETELL_API_KEY: { label: 'Retell AI voice', critical: false },
  RETELL_AGENT_ID: { label: 'Retell agent', critical: false },
  RETELL_WEBHOOK_SECRET: { label: 'Retell webhook', critical: false },
  TWILIO_ACCOUNT_SID: { label: 'Twilio SID', critical: false },
  TWILIO_AUTH_TOKEN: { label: 'Twilio token', critical: false },
  TWILIO_FROM_NUMBER: { label: 'Twilio number', critical: false },
  OWNER_PHONE_NUMBER: { label: 'Owner phone', critical: false },
  GMAIL_USER: { label: 'Gmail account', critical: false },
  GMAIL_APP_PASSWORD: { label: 'Gmail password', critical: false },
  CALENDLY_API_KEY: { label: 'Calendly', critical: false },
  DOCUSIGN_INTEGRATION_KEY: { label: 'DocuSign', critical: false },
  QB_CLIENT_ID: { label: 'QuickBooks', critical: false }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isSet(key) {
  const val = process.env[key]
  return !!(val && val.trim() !== '')
}

function maskKey(val) {
  if (!val || val.length < 8) return '****'
  return val.slice(0, 4) + '…' + val.slice(-4)
}

async function checkDataDir() {
  const results = {}
  const dirs = ['decisions', 'calls', 'content', 'emails', 'finance', 'sales', 'sops']
  for (const dir of dirs) {
    try {
      await fs.access(path.join(ROOT, 'data', dir))
      results[dir] = true
    } catch {
      results[dir] = false
    }
  }
  return results
}

async function checkMemoryFile() {
  try {
    const raw = await fs.readFile(path.join(ROOT, 'data/sops/library.json'), 'utf8')
    const data = JSON.parse(raw)
    const agentCount = Object.keys(data.agent_memories || {}).length
    const workshopsCount = (data.workshops_completed || []).length
    return { ok: true, agents: agentCount, workshops: workshopsCount }
  } catch {
    return { ok: false }
  }
}

async function checkDecisionEngine() {
  try {
    const raw = await fs.readFile(path.join(ROOT, 'data/decisions/decisions.json'), 'utf8')
    const decisions = JSON.parse(raw)
    return { ok: true, count: decisions.length }
  } catch {
    return { ok: false, count: 0 }
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const paused = process.env.AI_DISPATCH_PAUSED === 'true'
  const context = process.env.ACTIVE_CONTEXT || 'USA'

  console.log()
  console.log(`${C.bold}${C.cyan}════════════════════════════════════════${C.reset}`)
  console.log(`${C.bold}${C.white}  AI DISPATCH — SYSTEM HEALTH CHECK${C.reset}`)
  console.log(`${C.bold}${C.cyan}════════════════════════════════════════${C.reset}`)
  console.log(`  Context: ${C.bold}${context}${C.reset}  |  Status: ${paused ? `${C.red}PAUSED${C.reset}` : `${C.green}ACTIVE${C.reset}`}`)
  console.log(`  Checked: ${new Date().toLocaleString()}`)
  console.log()

  // ── 1. Env Vars ───────────────────────────────────────────────────────────
  console.log(`${C.bold}ENV VARIABLES${C.reset}`)
  let criticalMissing = 0
  for (const [key, meta] of Object.entries(ALL_VARS)) {
    const set = isSet(key)
    if (!set && meta.critical) criticalMissing++
    const icon = set ? ok : (meta.critical ? fail : dash)
    const val = set ? `${C.gray}${maskKey(process.env[key])}${C.reset}` : `${C.gray}not set${C.reset}`
    console.log(`  ${icon}  ${meta.label.padEnd(22)} ${val}`)
  }
  console.log()

  // ── 2. Agent Readiness ────────────────────────────────────────────────────
  console.log(`${C.bold}AGENT READINESS${C.reset}`)
  const agentStatus = {}
  for (const [agent, vars] of Object.entries(AGENT_REQUIREMENTS)) {
    const missing = vars.filter(v => !isSet(v))
    const ready = missing.length === 0
    agentStatus[agent] = ready
    const icon = ready ? ok : (missing.length === vars.length ? fail : warn)
    const detail = ready
      ? `${C.gray}all deps set${C.reset}`
      : `${C.yellow}missing: ${missing.map(v => v.replace(/_/g, ' ').toLowerCase()).join(', ')}${C.reset}`
    console.log(`  ${icon}  ${agent.padEnd(22)} ${detail}`)
  }
  console.log()

  // ── 3. Data Layer ─────────────────────────────────────────────────────────
  const [dirs, memory, engine] = await Promise.all([
    checkDataDir(),
    checkMemoryFile(),
    checkDecisionEngine()
  ])

  console.log(`${C.bold}DATA LAYER${C.reset}`)
  const allDirsOk = Object.values(dirs).every(Boolean)
  console.log(`  ${allDirsOk ? ok : warn}  Data directories        ${allDirsOk ? `${C.gray}all present${C.reset}` : `${C.yellow}missing: ${Object.entries(dirs).filter(([,v]) => !v).map(([k]) => k).join(', ')}${C.reset}`}`)
  console.log(`  ${memory.ok ? ok : warn}  Agent memory (library)  ${memory.ok ? `${C.gray}${memory.agents} agents, ${memory.workshops} workshops${C.reset}` : `${C.yellow}not initialized${C.reset}`}`)
  console.log(`  ${ok}  Decision Engine         ${C.gray}${engine.count} decisions logged${C.reset}`)
  console.log()

  // ── 4. Iron Rule Thresholds ───────────────────────────────────────────────
  console.log(`${C.bold}IRON RULE THRESHOLDS${C.reset}`)
  const rules = [
    ['Min RPM reject', process.env.MIN_RPM_REJECT || '2.51', '$/mile'],
    ['Min RPM accept', process.env.MIN_RPM_ACCEPT || '2.75', '$/mile'],
    ['Min RPM priority', process.env.MIN_RPM_PRIORITY || '3.00', '$/mile'],
    ['Max deadhead', process.env.MAX_DEADHEAD_MILES || '50', 'miles'],
    ['Max weight', process.env.MAX_LOAD_WEIGHT || '48000', 'lbs'],
    ['Authority min age', process.env.AUTHORITY_MIN_AGE_DAYS || '30', 'days'],
    ['Escalation threshold', process.env.QUOTE_ESCALATION_THRESHOLD || '5000', '$'],
    ['Commission (existing)', ((parseFloat(process.env.COMMISSION_RATE_EXISTING) || 0.08) * 100).toFixed(0), '%'],
    ['Commission (new)', ((parseFloat(process.env.COMMISSION_RATE_NEW) || 0.10) * 100).toFixed(0), '%']
  ]
  for (const [label, val, unit] of rules) {
    console.log(`  ${dash}  ${label.padEnd(22)} ${C.white}${val} ${unit}${C.reset}`)
  }
  console.log()

  // ── 5. Summary ────────────────────────────────────────────────────────────
  const readyAgents = Object.values(agentStatus).filter(Boolean).length
  const totalAgents = Object.keys(agentStatus).length

  console.log(`${C.bold}SUMMARY${C.reset}`)
  if (criticalMissing === 0 && readyAgents === totalAgents) {
    console.log(`  ${ok}  ${C.green}${C.bold}All systems go. ${readyAgents}/${totalAgents} agents ready.${C.reset}`)
    console.log(`  ${ok}  Run ${C.cyan}npm run maya${C.reset} to start the morning report.`)
  } else if (criticalMissing > 0) {
    console.log(`  ${fail}  ${C.red}${criticalMissing} critical env var(s) missing.${C.reset}`)
    console.log(`  ${dash}  Copy ${C.cyan}config/env.example${C.reset} → ${C.cyan}.env${C.reset} and fill in your credentials.`)
    console.log(`  ${dash}  ${readyAgents}/${totalAgents} agents can run with current config.`)
  } else {
    console.log(`  ${warn}  ${C.yellow}Partial config: ${readyAgents}/${totalAgents} agents ready.${C.reset}`)
    console.log(`  ${dash}  Add missing vars to ${C.cyan}.env${C.reset} to enable remaining agents.`)
  }

  if (paused) {
    console.log()
    console.log(`  ${warn}  ${C.yellow}${C.bold}AI_DISPATCH_PAUSED=true — all agents are frozen.${C.reset}`)
    console.log(`  ${dash}  Set ${C.cyan}AI_DISPATCH_PAUSED=false${C.reset} in .env to resume.`)
  }

  console.log()
  console.log(`${C.bold}${C.cyan}════════════════════════════════════════${C.reset}`)
  console.log()

  // Exit 1 if critical vars missing (useful for CI/pre-flight)
  if (criticalMissing > 0) process.exit(1)
}

main().catch(err => {
  console.error('Health check failed:', err.message)
  process.exit(1)
})
