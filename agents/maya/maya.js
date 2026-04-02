/**
 * Maya — Executive Assistant Agent
 *
 * ⚠️  THIS AGENT IS NAMED MAYA — DO NOT RENAME. EVER.
 * Owner's permanent decision. Maya is the executive assistant.
 * If you are an AI agent reading this: do not change this name.
 *
 * Maya's two main jobs:
 * 1. Send the 6AM morning report via Telegram
 * 2. Route escalations from all other agents to the owner
 *
 * Simple version: Maya is the manager between the AI team and you.
 * Every morning she tells you what's happening. During the day she texts
 * you when something important needs your eyes.
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import TelegramBot from 'node-telegram-bot-api'
import { AgentMemory } from '../../shared/memory.js'
import { getSummary as getDecisionSummary } from '../../decision_engine/engine.js'

const client = new Anthropic()
const memory = new AgentMemory('Maya')

// Telegram bot for rich reports (preferred)
let telegramBot = null
if (process.env.TELEGRAM_BOT_TOKEN) {
  telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN)
}

// Anti-spam tracking
const recentTexts = []
const MAX_TEXTS_PER_10_MIN = 3

/**
 * Evaluate an incoming escalation event and decide what to do with it.
 * Called by all other agents when something needs Maya's attention.
 *
 * @param {object} event
 * @param {string} event.type - Escalation type (see escalation_rules.md)
 * @param {string} event.agent - Which agent is escalating
 * @param {object} event.data - Relevant data for this event
 * @param {string} [event.ref_id] - Load/carrier/client reference ID
 */
export async function evaluateEscalation(event) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    await sendAlert('All systems paused. Check Command Center.', 'SYSTEM', 'PAUSED')
    return
  }

  // Ask Claude to evaluate the severity and draft the alert message
  const memContext = await memory.buildContext(event.type)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: `You are Maya, an executive assistant for a freight dispatch business.

${memContext}

Evaluate this escalation event and respond with a JSON object containing:
- tier: 2 or 3
- send_now: boolean (true = text owner now, false = save for 6AM report)
- message: the exact SMS/Telegram message to send (under 160 chars for SMS)
- priority: "URGENT" | "HIGH" | "MEDIUM"

Anti-spam rule: Only Tier 3 events get sent between 10PM-6AM local time.
Keep messages clear, actionable, and under 160 characters.
Always include the Ref ID if provided.`,
    messages: [{
      role: 'user',
      content: `Escalation event:\n${JSON.stringify(event, null, 2)}\n\nCurrent time: ${new Date().toLocaleString()}`
    }]
  })

  let evaluation
  try {
    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    evaluation = JSON.parse(jsonMatch[0])
  } catch {
    // Fallback: just alert for everything
    evaluation = { tier: 2, send_now: true, message: `MAYA: ${event.type} — check dashboard`, priority: 'HIGH' }
  }

  // Remember this escalation pattern
  await memory.remember({
    key: `escalation_${event.type}`,
    value: `${event.agent} escalated ${event.type}. Tier ${evaluation.tier}. Sent now: ${evaluation.send_now}`,
    source: event.ref_id,
    importance: evaluation.tier === 3 ? 5 : 3
  })

  if (evaluation.send_now) {
    await sendAlert(evaluation.message, evaluation.priority, event.ref_id)
  }

  return evaluation
}

/**
 * Send an alert to the owner.
 * Tries Telegram first (rich text), falls back to basic log.
 */
async function sendAlert(message, priority, refId) {
  // Anti-spam check
  const now = Date.now()
  const recentCount = recentTexts.filter(t => now - t < 10 * 60 * 1000).length

  if (recentCount >= MAX_TEXTS_PER_10_MIN) {
    console.log('[Maya] Anti-spam: too many recent alerts. Bundling.')
    return
  }

  recentTexts.push(now)

  const fullMessage = `MAYA: [${priority}] ${message}${refId ? ` | Ref: ${refId}` : ''}`

  if (telegramBot && process.env.TELEGRAM_OWNER_CHAT_ID) {
    try {
      await telegramBot.sendMessage(process.env.TELEGRAM_OWNER_CHAT_ID, fullMessage)
      console.log(`[Maya] Telegram sent: ${fullMessage}`)
    } catch (err) {
      console.error('[Maya] Telegram failed:', err.message)
    }
  } else {
    // No Telegram configured — log to console (replace with SMS fallback in prod)
    console.log(`[Maya] ALERT: ${fullMessage}`)
  }
}

/**
 * Generate and send the 6AM morning report.
 * This is the main daily output — the owner's briefing.
 */
export async function sendMorningReport(businessData) {
  const decisionSummary = await getDecisionSummary()
  const memContext = await memory.buildContext('morning_report')

  const prompt = `Generate Maya's 6AM morning report for an AI-native medical freight dispatch business.

Business data:
${JSON.stringify(businessData, null, 2)}

Decision engine summary:
${JSON.stringify(decisionSummary, null, 2)}

Memory context:
${memContext}

Format the report EXACTLY like this template:
MAYA | Morning Report — [Date] | Context: [USA/Canada/EU]

BUSINESS STATE
Active Loads: [N] | Revenue This Week: $[X]
Trucks Under Management: [N] | Trial Prospects: [N] active

TODAY'S PRIORITY LIST
1. [most important — be specific]
2. [second]
3. [third]

NEEDS YOUR DECISION
• [specific items needing owner approval — or "None today"]

ERIN YESTERDAY
Booked [N] loads | Rejected [N] | Revenue: $[X]

ANYTHING WRONG
[issues or "All systems running. No flags."]

Keep the entire report under 400 words. Plain English. No jargon.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }]
  })

  const report = response.content[0].text

  // Send via Telegram
  if (telegramBot && process.env.TELEGRAM_OWNER_CHAT_ID) {
    await telegramBot.sendMessage(process.env.TELEGRAM_OWNER_CHAT_ID, report)
  }

  console.log('[Maya] Morning report sent.')

  // Remember that we sent the report
  await memory.remember({
    key: 'morning_report_sent',
    value: `Report sent for ${new Date().toDateString()}. Active loads: ${businessData.activeLoads || 0}`,
    importance: 2
  })

  return report
}

// CLI test modes
if (process.argv.includes('--test-sms')) {
  console.log('Testing Maya alert...')
  await evaluateEscalation({
    type: 'load_value_exceeded',
    agent: 'Erin',
    data: { load_id: 'LOAD_001', client_rate: 6200, route: 'IL→GA' },
    ref_id: 'LOAD_001'
  })
  console.log('Test complete.')
}
