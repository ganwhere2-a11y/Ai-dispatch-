/**
 * Sales Agent
 *
 * Finds shipper and carrier leads, manages the 4-step outreach sequence,
 * and queues new prospects into data/sales/leads.json.
 *
 * Lead sources:
 *   - Carriers: FMCSA SAFER API (real endpoint commented inline)
 *   - Shippers: DAT Shipper API / Google Maps Places API (real endpoint commented inline)
 *
 * Outreach steps (stored as outreach_step 0–3):
 *   0 → welcome email
 *   1 → followup email
 *   2 → trial_offer email
 *   3 → last_chance email
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { AgentMemory } from '../../shared/memory.js'
import { logDecision } from '../../decision_engine/engine.js'
import { evaluateEscalation } from '../daniel/daniel.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LEADS_FILE = path.join(__dirname, '../../data/sales/leads.json')

const client = new Anthropic()
const memory = new AgentMemory('Sales')

// ─── Email Templates ──────────────────────────────────────────────────────────

const EMAIL_TEMPLATES = {
  welcome: (lead) => ({
    subject: `Dispatch for your dry van — 7 days free`,
    body: lead.type === 'carrier'
      ? `Hi ${lead.name || lead.company},\n\nWe help dry van carriers find consistent medical freight loads without spending hours on load boards.\n\nSpecialty: medical supply freight — clean cargo, consistent lanes, rates averaging $2.75+/mile.\n\nI'm offering a 7-day free dispatch trial — real loads, your lanes, no fees until you see results.\n\nInterested? Reply here or book 15 minutes: ${process.env.CALENDLY_LINK || '[calendly link]'}\n\n— AI Dispatch Team`
      : `Hi ${lead.name || lead.company},\n\nMedical facilities like yours move time-sensitive supplies regularly. Delays hurt patient care and staff schedules.\n\nWe specialize in dry van medical freight — same-day dispatch, real-time tracking, consistent vetted carrier network.\n\nWorth a 15-minute call? ${process.env.CALENDLY_LINK || '[calendly link]'}\n\n— AI Dispatch Team`
  }),
  followup: (lead) => ({
    subject: `One example from this week`,
    body: `Hi ${lead.name || lead.company},\n\nQuick follow-up. Real load we booked this week:\n\nChicago, IL → Atlanta, GA | 600 miles | $2.60/mile | Medical supplies\nCarrier cleared $472 profit after costs. Total time to book: under 2 hours.\n\nIf that's the kind of result you want, the 7-day free trial shows you what we can do on your specific lanes.\n\nWorth a conversation? ${process.env.CALENDLY_LINK || '[calendly link]'}\n\n— AI Dispatch Team`
  }),
  trial_offer: (lead) => ({
    subject: `Free trial — real loads, no commitment`,
    body: `Hi ${lead.name || lead.company},\n\nSimple offer:\n\n7-day free dispatch trial:\n- We find loads on your lanes\n- You see real rates and real results\n- No fee until you decide to continue\n\nIf it doesn't work, you owe nothing. If it works, we talk.\n\nReady to start? ${process.env.CALENDLY_LINK || '[calendly link]'}\n\n— AI Dispatch Team`
  }),
  last_chance: (lead) => ({
    subject: `Last one — then I'll leave you alone`,
    body: `Hi ${lead.name || lead.company},\n\nLast email from me.\n\nIf the timing isn't right, no problem. I'll add you to our quarterly check-in list — we reach out every 90 days in case things change.\n\nIf you want to talk before then, you know where to find me.\n\nGood luck on the road.\n\n— AI Dispatch Team`
  })
}

const STEP_TO_TEMPLATE = ['welcome', 'followup', 'trial_offer', 'last_chance']

// ─── File Helpers ─────────────────────────────────────────────────────────────

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

async function sendEmail(to, subject, body, leadName) {
  // Real implementation: use SendGrid / Resend / Postmark
  // await fetch('https://api.sendgrid.com/v3/mail/send', { headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` }, ... })
  console.log(`[Sales] EMAIL → ${to || leadName}`)
  console.log(`  Subject: ${subject}`)
  console.log(`  Preview: ${body.slice(0, 80)}...`)
  return { sent: true, timestamp: new Date().toISOString() }
}

// ─── Lead Discovery ───────────────────────────────────────────────────────────

/**
 * Find new leads using Claude to generate a structured list based on options.
 * In production: replace Claude generation with real FMCSA / DAT API calls.
 *
 * @param {object} options
 * @param {'shipper'|'carrier'} options.type
 * @param {string} [options.zip]
 * @param {string} [options.state]
 * @param {number} [options.radius_miles]
 * @returns {Promise<Array<{name, company, email, phone, type, source}>>}
 */
export async function findLeads(options = {}) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Sales] System paused. findLeads() aborted.')
    return []
  }

  const { type = 'carrier', zip, state, radius_miles = 100 } = options

  console.log(`[Sales] Finding ${type} leads — state: ${state || 'any'}, zip: ${zip || 'any'}, radius: ${radius_miles}mi`)

  // Real API calls would go here:
  // Carriers → FMCSA SAFER API: https://mobile.fmcsa.dot.gov/qc/services/carriers/snapshot?state=${state}&key=${process.env.FMCSA_API_KEY}
  // Shippers → DAT Shipper API: https://api.dat.com/freight/shippers (requires DAT IQ subscription)
  // Shippers → Google Maps: https://maps.googleapis.com/maps/api/place/textsearch/json?query=medical+supply+${state}&key=${process.env.GOOGLE_MAPS_API_KEY}

  let leads = []

  try {
    const locationContext = [state && `state: ${state}`, zip && `zip: ${zip}`, `radius: ${radius_miles} miles`]
      .filter(Boolean).join(', ')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: `You are a lead generation assistant for an AI-native medical freight dispatch company.
Generate realistic ${type} leads for outreach. Each lead should be a plausible business that would benefit from our dispatch service.
For carriers: dry van operators with 1-10 trucks.
For shippers: medical supply distributors, hospital supply chains, pharmaceutical distributors, home health equipment companies.
Return ONLY a valid JSON array of exactly 10 lead objects. No extra text.`,
      messages: [{
        role: 'user',
        content: `Generate 10 ${type} leads for our freight dispatch service.
Location context: ${locationContext || 'nationwide USA'}

Return a JSON array of 10 objects, each with these exact fields:
- name: contact first and last name
- company: company name
- email: realistic business email
- phone: 10-digit US phone number formatted as XXX-XXX-XXXX
- type: "${type}"
- source: "${type === 'carrier' ? 'fmcsa_simulated' : 'dat_simulated'}"
${type === 'carrier' ? '- mc_number: realistic MC number like MC701234\n- home_state: 2-letter state code' : '- address: city and state'}

Make the companies sound real and plausible for the ${state || 'US'} region.`
      }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      leads = JSON.parse(jsonMatch[0])
    }
  } catch (err) {
    console.warn(`[Sales] Claude lead generation failed: ${err.message} — using fallback data`)
    // Fallback: return minimal simulated leads
    leads = Array.from({ length: 10 }, (_, i) => ({
      name: `Contact ${i + 1}`,
      company: `${state || 'USA'} ${type === 'carrier' ? 'Transport' : 'Medical Supply'} LLC ${i + 1}`,
      email: `contact${i + 1}@example.com`,
      phone: `555-010-${String(i + 1).padStart(4, '0')}`,
      type,
      source: 'fallback_simulated'
    }))
  }

  await logDecision({
    agent: 'Sales',
    situation_type: 'lead_discovery',
    inputs: { type, state, zip, radius_miles, count: leads.length },
    recommendation: `Found ${leads.length} ${type} leads`,
    owner_decision: 'AUTO_QUEUED',
    confidence_before: 0.8
  })

  await memory.remember({
    key: `lead_search_${type}_${state || 'any'}`,
    value: `Found ${leads.length} ${type} leads for ${state || 'nationwide'}`,
    importance: 2
  })

  console.log(`[Sales] findLeads() returned ${leads.length} leads`)
  return leads
}

// ─── Outreach Sequence ────────────────────────────────────────────────────────

/**
 * Process all leads with outreach_step < 4.
 * Loads the right email template for each step and sends it.
 * Logs the send back to data/sales/leads.json.
 */
export async function runOutreachSequence() {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Sales] System paused. runOutreachSequence() aborted.')
    return { sent: 0, skipped: 0 }
  }

  const leads = await loadLeads()
  const MAX_PER_DAY = parseInt(process.env.MAX_OUTREACH_PER_DAY || '50')

  const pending = leads.filter(l => (l.outreach_step ?? 0) < 4 && !l.converted && !l.archived)
  console.log(`[Sales] ${pending.length} leads pending outreach (limit: ${MAX_PER_DAY}/day)`)

  let sent = 0
  let skipped = 0
  const now = new Date()

  for (const lead of pending) {
    if (sent >= MAX_PER_DAY) {
      console.log(`[Sales] Daily limit reached (${MAX_PER_DAY}). Remaining leads deferred.`)
      break
    }

    const step = lead.outreach_step ?? 0

    // Respect minimum delay between steps
    if (lead.last_contact_at) {
      const hoursSince = (now - new Date(lead.last_contact_at)) / (1000 * 60 * 60)
      const minHours = step === 0 ? 0 : step <= 2 ? 96 : 144  // 0h, 4 days, 4 days, 6 days
      if (hoursSince < minHours) {
        skipped++
        continue
      }
    }

    const templateKey = STEP_TO_TEMPLATE[step]
    const template = EMAIL_TEMPLATES[templateKey]
    if (!template) {
      console.warn(`[Sales] No template for step ${step} (${templateKey})`)
      skipped++
      continue
    }

    const emailContent = template(lead)

    // Step 3 (last_chance) escalates through Daniel for awareness
    if (step === 3) {
      await evaluateEscalation({
        type: 'outreach_last_chance',
        agent: 'Sales',
        data: { lead_company: lead.company, lead_type: lead.type, steps_completed: 3 },
        ref_id: lead.id
      })
    }

    const result = await sendEmail(lead.email, emailContent.subject, emailContent.body, lead.company)

    if (result.sent) {
      lead.outreach_step = step + 1
      lead.last_contact_at = result.timestamp
      lead[`step_${step}_sent_at`] = result.timestamp

      if (step + 1 >= 4) {
        lead.archived = true
        lead.archived_at = result.timestamp
        lead.archive_reason = 'sequence_complete'
      }

      sent++

      await memory.remember({
        key: `outreach_${lead.id || lead.company}`,
        value: `Sent step ${step} (${templateKey}) to ${lead.company} on ${now.toDateString()}`,
        source: lead.id,
        importance: 2
      })
    }
  }

  await saveLeads(leads)

  console.log(`[Sales] Outreach complete — sent: ${sent}, skipped: ${skipped}`)

  if (sent > 0) {
    await evaluateEscalation({
      type: 'outreach_batch_sent',
      agent: 'Sales',
      data: { sent, pending: pending.length },
      ref_id: 'daily_outreach'
    })
  }

  return { sent, skipped, total_pending: pending.length }
}

// ─── Queue Management ─────────────────────────────────────────────────────────

/**
 * Add a new lead to data/sales/leads.json with outreach_step=0.
 *
 * @param {{ name, company, email, phone, type, source, [mc_number], [home_state], [address] }} lead
 * @returns {Promise<object>} The saved lead object with id and queued_at
 */
export async function queueLead(lead) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Sales] System paused. queueLead() aborted.')
    return null
  }

  if (!lead.company || !lead.type) {
    throw new Error('[Sales] queueLead() requires lead.company and lead.type')
  }

  const leads = await loadLeads()

  // Dedupe — skip if same company already in queue
  const exists = leads.some(l => l.company?.toLowerCase() === lead.company.toLowerCase())
  if (exists) {
    console.log(`[Sales] Lead already in queue: ${lead.company}`)
    return leads.find(l => l.company?.toLowerCase() === lead.company.toLowerCase())
  }

  const newLead = {
    ...lead,
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    outreach_step: 0,
    queued_at: new Date().toISOString(),
    last_contact_at: null,
    converted: false,
    archived: false,
    trial_status: null
  }

  leads.push(newLead)
  await saveLeads(leads)

  console.log(`[Sales] Queued lead: ${newLead.company} (${newLead.type}) — id: ${newLead.id}`)

  await memory.remember({
    key: `lead_queued_${newLead.id}`,
    value: `Queued ${newLead.type} lead: ${newLead.company} from ${newLead.source || 'unknown'}`,
    source: newLead.id,
    importance: 2
  })

  return newLead
}

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv[2] === '--find-leads') {
  findLeads({ type: 'carrier', state: 'TX' }).then(console.log)
}

if (process.argv[2] === '--outreach') {
  runOutreachSequence().then(r => console.log('[Sales] Outreach result:', r))
}
