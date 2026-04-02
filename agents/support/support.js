/**
 * Support Agent
 *
 * Handles client inquiries, generates weekly performance summaries,
 * and manages the handoff from trial prospect to active client.
 *
 * Complaint detection → auto-escalates to Maya via evaluateEscalation.
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { AgentMemory } from '../../shared/memory.js'
import { logDecision } from '../../decision_engine/engine.js'
import { evaluateEscalation } from '../maya/maya.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PNL_FILE = path.join(__dirname, '../../data/finance/pnl.json')
const LEADS_FILE = path.join(__dirname, '../../data/sales/leads.json')

const client = new Anthropic()
const memory = new AgentMemory('Support')

// Keywords that trigger complaint escalation
const COMPLAINT_SIGNALS = [
  'late', 'delayed', 'missing', 'lost', 'damaged', 'wrong', 'cancel', 'refund',
  'unacceptable', 'terrible', 'awful', 'never again', 'disappointed', 'furious',
  'angry', 'lawsuit', 'legal', 'attorney', 'complaint', 'dispute', 'charge back',
  'fraud', 'scam', 'overcharged', 'not delivered'
]

// ─── File Helpers ─────────────────────────────────────────────────────────────

async function loadPnl() {
  try {
    const raw = await fs.readFile(PNL_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { weekly: [], loads: [], invoices: [] }
  }
}

async function loadLeads() {
  try {
    const raw = await fs.readFile(LEADS_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function saveLeads(leads) {
  await fs.mkdir(path.dirname(LEADS_FILE), { recursive: true })
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2))
}

function detectComplaint(text) {
  const lower = text.toLowerCase()
  return COMPLAINT_SIGNALS.some(signal => lower.includes(signal))
}

// ─── Main Exports ─────────────────────────────────────────────────────────────

/**
 * Handle an incoming client inquiry from any channel.
 * Uses Claude to draft a response. Escalates to Maya on complaint detection.
 *
 * @param {{ client_id: string, subject: string, message: string, channel: string }} inquiry
 * @returns {Promise<{ response_text: string, escalated: boolean, action_required: string|null }>}
 */
export async function handleInquiry(inquiry) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Support] System paused. handleInquiry() aborted.')
    return { response_text: 'System temporarily paused. A team member will follow up shortly.', escalated: false, action_required: 'resume_system' }
  }

  const { client_id, subject, message, channel } = inquiry

  if (!message) {
    throw new Error('[Support] handleInquiry() requires inquiry.message')
  }

  console.log(`[Support] Handling inquiry from ${client_id} via ${channel}: "${subject}"`)

  const isComplaint = detectComplaint(subject + ' ' + message)

  const memContext = await memory.buildContext(`client_${client_id}`)

  let response_text = ''
  let action_required = null
  let escalated = false

  try {
    const claudeResponse = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `You are the Support Agent for an AI-native medical freight dispatch company.
Your job is to respond to client and carrier inquiries professionally and helpfully.

${memContext}

Rules:
- Be concise, warm, and professional
- Address the specific question or concern directly
- If a shipment issue is mentioned, acknowledge it immediately and commit to checking status within 1 hour
- Never promise specific delivery times without checking with Erin first
- Sign off as: "— AI Dispatch Support Team"
- Keep responses under 200 words unless detail is clearly required`,
      messages: [{
        role: 'user',
        content: `Client ID: ${client_id}
Channel: ${channel}
Subject: ${subject}
Message: ${message}

Draft a professional response to this inquiry.`
      }]
    })

    response_text = claudeResponse.content[0].text.trim()
  } catch (err) {
    console.error(`[Support] Claude response generation failed: ${err.message}`)
    response_text = `Hi,\n\nThank you for reaching out. We've received your message regarding "${subject}" and will follow up within 2 hours.\n\nFor urgent load issues, please call ${process.env.BUSINESS_PHONE || 'our dispatch line'} directly.\n\n— AI Dispatch Support Team`
    action_required = 'manual_follow_up'
  }

  // Escalate complaints to Maya
  if (isComplaint) {
    escalated = true
    action_required = action_required || 'owner_review'

    await evaluateEscalation({
      type: 'client_complaint',
      agent: 'Support',
      data: {
        client_id,
        channel,
        subject,
        message_preview: message.slice(0, 200),
        auto_response_sent: true
      },
      ref_id: client_id
    })

    console.log(`[Support] Complaint detected — escalated to Maya for client ${client_id}`)
  }

  // Log the interaction
  await logDecision({
    agent: 'Support',
    situation_type: 'client_inquiry',
    inputs: { client_id, channel, subject, is_complaint: isComplaint },
    recommendation: isComplaint ? 'ESCALATE + respond' : 'AUTO_RESPOND',
    owner_decision: isComplaint ? 'ESCALATED' : 'AUTO_HANDLED',
    confidence_before: isComplaint ? 0.95 : 0.85
  })

  await memory.remember({
    key: `client_${client_id}`,
    value: `Inquiry on "${subject}" via ${channel}. Complaint: ${isComplaint}. Escalated: ${escalated}`,
    source: client_id,
    importance: isComplaint ? 4 : 2
  })

  return { response_text, escalated, action_required }
}

/**
 * Generate a plain-English weekly summary email for a client.
 * Reads recent loads from data/finance/pnl.json.
 *
 * @param {string} clientId
 * @returns {Promise<string>} Email body string
 */
export async function sendWeeklySummary(clientId) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Support] System paused. sendWeeklySummary() aborted.')
    return ''
  }

  console.log(`[Support] Generating weekly summary for client ${clientId}`)

  const pnl = await loadPnl()
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Filter loads for this client in the last 7 days
  const clientLoads = (pnl.loads || []).filter(l => {
    const loadDate = l.delivery_date ? new Date(l.delivery_date) : (l.booked_at ? new Date(l.booked_at) : null)
    return l.client_id === clientId && loadDate && loadDate >= oneWeekAgo
  })

  const totalRevenue = clientLoads.reduce((sum, l) => sum + (l.client_rate || 0), 0)
  const deliveredLoads = clientLoads.filter(l => l.status === 'Delivered' || l.status === 'delivered')
  const issueLoads = clientLoads.filter(l => l.has_issue || l.status === 'Issue')

  let emailBody = ''

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `You are the Support Agent for an AI-native medical freight dispatch company.
Write a friendly, plain-English weekly summary email for a client.
Be specific with numbers. Be brief — under 250 words. No jargon.
Sign off as: "— AI Dispatch Team"`,
      messages: [{
        role: 'user',
        content: `Write a weekly summary email for client ${clientId}.

This week's data:
- Total loads dispatched: ${clientLoads.length}
- Loads delivered: ${deliveredLoads.length}
- Issues this week: ${issueLoads.length}
- Total revenue moved: $${totalRevenue.toLocaleString()}
- Load details: ${JSON.stringify(clientLoads.slice(0, 5), null, 2)}

Cover:
1. How many loads were dispatched and delivered this week
2. Any issues (if none, say so clearly)
3. What's coming up next week (if any loads are booked ahead)
4. One next step or action for them to take`
      }]
    })

    emailBody = response.content[0].text.trim()
  } catch (err) {
    console.error(`[Support] Weekly summary generation failed: ${err.message}`)
    emailBody = `Hi,\n\nHere's your weekly freight summary for the week ending ${new Date().toLocaleDateString()}:\n\n` +
      `Loads dispatched: ${clientLoads.length}\n` +
      `Loads delivered: ${deliveredLoads.length}\n` +
      `Issues: ${issueLoads.length > 0 ? issueLoads.length + ' — we will follow up separately' : 'None'}\n` +
      `Total freight value: $${totalRevenue.toLocaleString()}\n\n` +
      `Questions? Reply to this email or call ${process.env.BUSINESS_PHONE || 'our office'}.\n\n` +
      `— AI Dispatch Team`
  }

  await memory.remember({
    key: `weekly_summary_${clientId}`,
    value: `Weekly summary sent. ${clientLoads.length} loads, $${totalRevenue} revenue, ${issueLoads.length} issues`,
    source: clientId,
    importance: 2
  })

  return emailBody
}

/**
 * Handle the handoff when a trial prospect converts to a paying client.
 * Marks as converted in leads.json, logs to decision engine, triggers welcome.
 *
 * @param {string} prospectId - The lead id from leads.json
 * @returns {Promise<boolean>} success
 */
export async function handleTrialHandoff(prospectId) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Support] System paused. handleTrialHandoff() aborted.')
    return false
  }

  console.log(`[Support] Handling trial handoff for prospect: ${prospectId}`)

  const leads = await loadLeads()
  const leadIndex = leads.findIndex(l => l.id === prospectId || l.mc_number === prospectId)

  if (leadIndex === -1) {
    console.warn(`[Support] Prospect ${prospectId} not found in leads.json`)
    // Still log and proceed — prospect may be in a different data store
  }

  let lead = null
  if (leadIndex !== -1) {
    lead = leads[leadIndex]
    leads[leadIndex] = {
      ...lead,
      converted: true,
      trial_status: 'converted',
      converted_at: new Date().toISOString(),
      outreach_step: 4
    }
    await saveLeads(leads)
    console.log(`[Support] Marked ${lead.company} as converted in leads.json`)
  }

  // Log the conversion decision
  await logDecision({
    agent: 'Support',
    situation_type: 'trial_handoff',
    inputs: { prospect_id: prospectId, company: lead?.company || prospectId },
    recommendation: 'CONVERT — trial handoff initiated',
    owner_decision: 'CONVERTED',
    confidence_before: 0.95
  })

  // Notify Maya
  await evaluateEscalation({
    type: 'trial_converted',
    agent: 'Support',
    data: {
      prospect_id: prospectId,
      company: lead?.company || prospectId,
      converted_at: new Date().toISOString()
    },
    ref_id: prospectId
  })

  await memory.remember({
    key: `conversion_${prospectId}`,
    value: `Prospect ${lead?.company || prospectId} converted from trial to paid client on ${new Date().toDateString()}`,
    source: prospectId,
    importance: 5
  })

  console.log(`[Support] Trial handoff complete for ${prospectId}`)
  return true
}

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv[2] === '--test-inquiry') {
  handleInquiry({
    client_id: 'CLIENT_001',
    subject: 'Where is my shipment?',
    message: 'Hi, my load was supposed to arrive yesterday and it still hasn\'t shown up. Can you check on it?',
    channel: 'email'
  }).then(r => console.log('[Support] Inquiry result:', r))
}
