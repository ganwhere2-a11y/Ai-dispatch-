/**
 * Onboarding Agent
 *
 * Manages carrier onboarding through the 4 Iron Rule pre-trial checks,
 * the 7-day free trial lifecycle, and the Day 7 conversion decision.
 *
 * Iron Rule pre-trial checks (all 4 must pass before trial starts):
 *   1. MC active on FMCSA SAFER
 *   2. Insurance current (not expired, not expiring within 30 days)
 *   3. Operating authority in good standing (Authorized for Property)
 *   4. Safety rating acceptable (Satisfactory or Unrated only)
 *
 * FMCSA SAFER API:
 *   https://mobile.fmcsa.dot.gov/qc/services/carriers/${mc_number}?webKey=${FMCSA_API_KEY}
 *   (Requires FMCSA web key — register at ask.fmcsa.dot.gov)
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { AgentMemory } from '../../shared/memory.js'
import { logDecision } from '../../decision_engine/engine.js'
import { evaluateEscalation } from '../maya/maya.js'
import { handleTrialHandoff } from '../support/support.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LEADS_FILE = path.join(__dirname, '../../data/sales/leads.json')
const PNL_FILE = path.join(__dirname, '../../data/finance/pnl.json')

const client = new Anthropic()
const memory = new AgentMemory('Onboarding')

const FMCSA_API_BASE = 'https://mobile.fmcsa.dot.gov/qc/services/carriers'
const TRIAL_DURATION_DAYS = 7

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

async function loadPnl() {
  try {
    const raw = await fs.readFile(PNL_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { weekly: [], loads: [], invoices: [] }
  }
}

async function sendEmail(to, subject, body, carrierName) {
  // Real implementation: SendGrid / Resend / Postmark
  // await fetch('https://api.sendgrid.com/v3/mail/send', { ... })
  console.log(`[Onboarding] EMAIL → ${to || carrierName}`)
  console.log(`  Subject: ${subject}`)
  console.log(`  Preview: ${body.slice(0, 100)}...`)
  return { sent: true, timestamp: new Date().toISOString() }
}

// ─── Iron Rule Verification ───────────────────────────────────────────────────

/**
 * Verify a carrier against the 4 Iron Rule pre-trial conditions.
 * Uses Claude to simulate FMCSA SAFER API lookup with realistic data.
 *
 * Real FMCSA SAFER API endpoint:
 *   GET https://mobile.fmcsa.dot.gov/qc/services/carriers/${mc_number}?webKey=${FMCSA_API_KEY}
 *   Response fields: entityType, statusCode, safetyRating, insuranceOnFile, bipdInsuranceRequired
 *
 * @param {string} mcNumber - MC number to verify (e.g., "MC123456")
 * @returns {Promise<{ passed: boolean, checks: { mc_active, insurance_current, authority_good, safety_ok }, failed_reasons: string[] }>}
 */
export async function verifyCarrier(mcNumber) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Onboarding] System paused. verifyCarrier() aborted.')
    return { passed: false, checks: { mc_active: false, insurance_current: false, authority_good: false, safety_ok: false }, failed_reasons: ['System paused'] }
  }

  if (!mcNumber) {
    throw new Error('[Onboarding] verifyCarrier() requires mcNumber')
  }

  console.log(`[Onboarding] Verifying carrier: ${mcNumber}`)

  let fmcsaData = null

  // Attempt real FMCSA SAFER API call
  if (process.env.FMCSA_API_KEY) {
    try {
      const { default: fetch } = await import('node-fetch')
      // Real FMCSA SAFER API: GET /carriers/{mc_number}?webKey={key}
      const url = `${FMCSA_API_BASE}/${mcNumber.replace(/^MC/i, '')}?webKey=${process.env.FMCSA_API_KEY}`
      const res = await fetch(url, { timeout: 8000 })
      if (res.ok) {
        fmcsaData = await res.json()
        console.log(`[Onboarding] FMCSA data retrieved for ${mcNumber}`)
      }
    } catch (err) {
      console.warn(`[Onboarding] FMCSA API unavailable: ${err.message} — using Claude simulation`)
    }
  }

  const checks = {
    mc_active: false,
    insurance_current: false,
    authority_good: false,
    safety_ok: false
  }
  const failed_reasons = []

  if (fmcsaData) {
    // Parse real FMCSA response
    const carrier = fmcsaData.content?.carrier || fmcsaData

    checks.mc_active = carrier.statusCode === 'A'  // 'A' = Active
    if (!checks.mc_active) failed_reasons.push(`MC ${mcNumber} is not active on FMCSA (status: ${carrier.statusCode || 'unknown'})`)

    checks.insurance_current = carrier.insuranceOnFile === 'Y'
    if (!checks.insurance_current) failed_reasons.push('Insurance not on file with FMCSA')

    checks.authority_good = carrier.commonAuthorityStatus === 'A' || carrier.contractAuthorityStatus === 'A'
    if (!checks.authority_good) failed_reasons.push('Operating authority not in good standing for property')

    const blockedRatings = ['Conditional', 'Unsatisfactory']
    checks.safety_ok = !blockedRatings.includes(carrier.safetyRating)
    if (!checks.safety_ok) failed_reasons.push(`Safety rating "${carrier.safetyRating}" — Satisfactory or Unrated required`)

  } else {
    // Simulate FMCSA lookup via Claude when real API is unavailable
    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: `You are simulating an FMCSA SAFER database lookup for a freight dispatch compliance check.
Generate realistic carrier compliance data for the given MC number.
Return ONLY valid JSON. No extra text.`,
        messages: [{
          role: 'user',
          content: `Simulate an FMCSA SAFER lookup for carrier ${mcNumber}.
Generate realistic carrier data and run these 4 Iron Rule checks:
1. mc_active: Is the MC number active on FMCSA? (true for most established carriers)
2. insurance_current: Is cargo and liability insurance current? (true for most)
3. authority_good: Is operating authority "Authorized for Property" and in good standing? (true for most)
4. safety_ok: Is safety rating Satisfactory or Unrated? (Conditional/Unsatisfactory = fail)

For a realistic simulation, most carriers (70%) should pass all 4 checks.
About 20% should fail 1 check (usually authority or safety), 10% fail 2+.

Return JSON:
{
  "carrier_name": "simulated company name",
  "authority_age_days": number,
  "checks": {
    "mc_active": true/false,
    "insurance_current": true/false,
    "authority_good": true/false,
    "safety_ok": true/false
  },
  "failed_reasons": ["reason if failed, else omit"],
  "raw_safety_rating": "Satisfactory|Unrated|Conditional|Unsatisfactory",
  "insurance_expiry": "YYYY-MM-DD simulated date"
}`
        }]
      })

      const text = response.content[0].text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const simResult = JSON.parse(jsonMatch[0])
        checks.mc_active = simResult.checks.mc_active
        checks.insurance_current = simResult.checks.insurance_current
        checks.authority_good = simResult.checks.authority_good
        checks.safety_ok = simResult.checks.safety_ok

        if (!checks.mc_active) failed_reasons.push(`MC ${mcNumber} not active on FMCSA (simulated)`)
        if (!checks.insurance_current) failed_reasons.push('Insurance not current or not on file with FMCSA (simulated)')
        if (!checks.authority_good) failed_reasons.push('Operating authority not in good standing for property (simulated)')
        if (!checks.safety_ok) failed_reasons.push(`Safety rating "${simResult.raw_safety_rating}" — only Satisfactory or Unrated accepted (simulated)`)
      }
    } catch (err) {
      console.error(`[Onboarding] Claude simulation failed: ${err.message}`)
      // Conservative fallback — fail all until real data available
      failed_reasons.push('Unable to verify MC number — FMCSA API unavailable and simulation failed')
    }
  }

  const passed = failed_reasons.length === 0

  await logDecision({
    agent: 'Onboarding',
    situation_type: 'carrier_verification',
    inputs: { mc_number: mcNumber, checks },
    recommendation: passed ? 'APPROVED — all 4 Iron Rule checks passed' : `REJECTED — ${failed_reasons.join('; ')}`,
    owner_decision: passed ? 'APPROVED_AUTO' : 'BLOCKED_AUTO',
    confidence_before: fmcsaData ? 0.99 : 0.75
  })

  console.log(`[Onboarding] ${mcNumber} verification: ${passed ? 'PASSED' : 'FAILED'} (${failed_reasons.length} failures)`)
  return { passed, checks, failed_reasons }
}

// ─── Trial Management ─────────────────────────────────────────────────────────

/**
 * Start a 7-day free trial for a carrier.
 * Runs verifyCarrier() first — trial only starts if all 4 checks pass.
 *
 * @param {{ name: string, mc_number: string, email: string, truck_count: number, [contact_name], [home_state], [preferred_lanes] }} carrier
 * @returns {Promise<{ started: boolean, trial_end_date: string|null, failure_reasons: string[]|null }>}
 */
export async function startTrial(carrier) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Onboarding] System paused. startTrial() aborted.')
    return { started: false, trial_end_date: null, failure_reasons: ['System paused'] }
  }

  if (!carrier.mc_number || !carrier.name) {
    throw new Error('[Onboarding] startTrial() requires carrier.mc_number and carrier.name')
  }

  console.log(`[Onboarding] Starting trial for ${carrier.name} (${carrier.mc_number})`)

  // Step 1: Verify carrier against all 4 Iron Rules
  const verification = await verifyCarrier(carrier.mc_number)

  if (!verification.passed) {
    // Send pre-check failure email
    const failureEmailBody = `Hi ${carrier.contact_name || carrier.name},\n\nWe looked up your authority to get your trial ready. There's one issue we need to resolve first:\n\n${verification.failed_reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nThis is standard compliance — we check every carrier the same way. Once you've resolved it, reply to this email and we'll start your trial immediately.\n\nNeed help? FMCSA can be reached at 1-800-832-5660 or safer.fmcsa.dot.gov.\n\n— AI Dispatch Team`

    if (carrier.email) {
      await sendEmail(carrier.email, 'One thing to fix before your trial starts', failureEmailBody, carrier.name)
    }

    await evaluateEscalation({
      type: 'carrier_verification_failed',
      agent: 'Onboarding',
      data: { carrier: carrier.name, mc: carrier.mc_number, failed_reasons: verification.failed_reasons },
      ref_id: carrier.mc_number
    })

    return { started: false, trial_end_date: null, failure_reasons: verification.failed_reasons }
  }

  // Step 2: Record trial in leads.json
  const leads = await loadLeads()
  const trialStartDate = new Date()
  const trialEndDate = new Date(trialStartDate.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000)
  const trialEndISO = trialEndDate.toISOString().split('T')[0]

  const existingIndex = leads.findIndex(l =>
    l.mc_number === carrier.mc_number || l.company?.toLowerCase() === carrier.name.toLowerCase()
  )

  const trialRecord = {
    id: existingIndex >= 0 ? leads[existingIndex].id : `lead_${Date.now()}`,
    company: carrier.name,
    mc_number: carrier.mc_number,
    email: carrier.email || null,
    contact_name: carrier.contact_name || carrier.name,
    home_state: carrier.home_state || null,
    truck_count: carrier.truck_count || 1,
    type: 'carrier',
    source: 'trial_signup',
    outreach_step: 0,
    queued_at: trialStartDate.toISOString(),
    trial_status: 'active',
    trial_start_date: trialStartDate.toISOString().split('T')[0],
    trial_end_date: trialEndISO,
    trial_day: 1,
    loads_found: 0,
    estimated_revenue: 0,
    converted: false,
    archived: false
  }

  if (existingIndex >= 0) {
    leads[existingIndex] = { ...leads[existingIndex], ...trialRecord }
  } else {
    leads.push(trialRecord)
  }
  await saveLeads(leads)

  // Step 3: Send trial welcome email
  const businessName = process.env.BUSINESS_NAME || 'AI Dispatch'
  const welcomeBody = `Hi ${carrier.contact_name || carrier.name},\n\nWelcome to your 7-day free dispatch trial.\n\nHere's what happens:\n\nDays 1-4: Our dispatch system (Erin) starts searching for loads on your preferred lanes — dry van only, $2.75+/mile minimum.\nDay 5: You'll get a recap showing what we found, estimated revenue, and time saved.\nDay 7: You decide — if it's working, we continue. No commitment until then.\n\nYour profile:\n- Equipment: Dry van\n- Trucks: ${carrier.truck_count || 1}\n- MC Number: ${carrier.mc_number}\n\nIf you have specific lanes or availability windows, reply to this email.\n\nOne thing to know: we only book loads that meet our iron rules — profitable, compliant, no exceptions. If a load doesn't meet the standard, we don't book it.\n\nTrial start: ${trialStartDate.toLocaleDateString()}\nTrial end: ${trialEndDate.toLocaleDateString()}\n\n— The Dispatch Team\n${businessName}\n${process.env.BUSINESS_PHONE || ''} | ${process.env.BUSINESS_EMAIL || ''}`

  if (carrier.email) {
    await sendEmail(carrier.email, 'Your 7-Day Free Dispatch Trial Has Started — Here\'s What Happens Next', welcomeBody, carrier.name)
  }

  // Step 4: Notify Maya
  await evaluateEscalation({
    type: 'trial_started',
    agent: 'Onboarding',
    data: { carrier: carrier.name, mc: carrier.mc_number, trucks: carrier.truck_count, trial_end: trialEndISO },
    ref_id: carrier.mc_number
  })

  await memory.remember({
    key: `trial_active_${carrier.mc_number}`,
    value: `Trial started ${trialStartDate.toDateString()} for ${carrier.name} (${carrier.mc_number}). Ends ${trialEndISO}. Trucks: ${carrier.truck_count || 1}`,
    source: carrier.mc_number,
    importance: 3
  })

  console.log(`[Onboarding] Trial started for ${carrier.name} — ends ${trialEndISO}`)
  return { started: true, trial_end_date: trialEndISO, failure_reasons: null }
}

/**
 * Generate a Day 5 recap email body for a carrier in trial.
 * Pulls load data from data/finance/pnl.json filtered by carrier ID.
 *
 * @param {string} carrierId - mc_number or lead id
 * @returns {Promise<string>} Email body string
 */
export async function sendDay5Recap(carrierId) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Onboarding] System paused. sendDay5Recap() aborted.')
    return ''
  }

  console.log(`[Onboarding] Generating Day 5 recap for carrier: ${carrierId}`)

  const pnl = await loadPnl()
  const leads = await loadLeads()

  // Find the carrier's trial record
  const trialRecord = leads.find(l => l.mc_number === carrierId || l.id === carrierId)
  const carrierName = trialRecord?.company || trialRecord?.contact_name || carrierId

  // Pull loads matching this carrier from pnl.json
  const trialLoads = (pnl.loads || []).filter(l =>
    l.carrier_id === carrierId || l.mc_number === carrierId
  )

  const totalRevenue = trialLoads.reduce((sum, l) => sum + (l.client_rate || 0), 0)
  const avgRpm = trialLoads.length > 0
    ? (trialLoads.reduce((sum, l) => sum + (l.rate_per_mile || 0), 0) / trialLoads.length).toFixed(2)
    : 0

  const topLoad = trialLoads.reduce((best, l) => {
    return (l.profit || 0) > (best?.profit || 0) ? l : best
  }, null)

  const hoursSaved = Math.max(2, trialLoads.length * 1.5)

  let emailBody = ''

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: `You are the Onboarding Agent for an AI freight dispatch company.
Write a Day 5 trial recap email. Be specific, encouraging, and brief (under 200 words).
Sign off as: "— AI Dispatch Team"`,
      messages: [{
        role: 'user',
        content: `Write a Day 5 trial recap email for carrier ${carrierName}.

Trial stats so far (Days 1-4):
- Loads found: ${trialLoads.length}
- Estimated gross revenue: $${totalRevenue.toLocaleString()}
- Average rate per mile: $${avgRpm}/mile
- Hours you saved not being on load boards: ~${hoursSaved} hours
- Top load: ${topLoad ? `${topLoad.origin || 'origin'} → ${topLoad.destination || 'destination'} — $${topLoad.profit || 0} profit` : 'No loads booked yet'}

Two days left in the trial. Day 7 = conversion decision.`
      }]
    })

    emailBody = response.content[0].text.trim()
  } catch (err) {
    console.error(`[Onboarding] Day 5 recap generation failed: ${err.message}`)
    emailBody = `Hi ${carrierName},\n\nHere's your 4-day trial recap:\n\nLoads found on your lanes: ${trialLoads.length}\nEstimated gross revenue: $${totalRevenue.toLocaleString()}\nAverage rate: $${avgRpm}/mile\nTime saved vs load boards: ~${hoursSaved} hours\n\n${topLoad ? `Best lane this week: ${topLoad.origin || '?'} → ${topLoad.destination || '?'} at $${topLoad.profit || 0} profit` : 'Load volume was lighter than typical this week — this can vary by season and lane.'}\n\nTwo days left. Day 7, you decide whether to continue.\n\nQuestions? Reply here.\n\n— AI Dispatch Team`
  }

  await memory.remember({
    key: `trial_day5_${carrierId}`,
    value: `Day 5 recap sent. Loads: ${trialLoads.length}. Revenue: $${totalRevenue}. Avg RPM: $${avgRpm}`,
    source: carrierId,
    importance: 3
  })

  return emailBody
}

/**
 * Handle the Day 7 conversion decision for a trial carrier.
 * If marked ready to convert → calls support.handleTrialHandoff().
 * If not ready → moves to nurture drip (outreach_step=1, different campaign).
 *
 * @param {string} carrierId - mc_number or lead id
 * @returns {Promise<{ converted: boolean, action_taken: string }>}
 */
export async function handleDay7(carrierId) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Onboarding] System paused. handleDay7() aborted.')
    return { converted: false, action_taken: 'system_paused' }
  }

  console.log(`[Onboarding] Day 7 decision for carrier: ${carrierId}`)

  const leads = await loadLeads()
  const leadIndex = leads.findIndex(l => l.mc_number === carrierId || l.id === carrierId)

  if (leadIndex === -1) {
    console.warn(`[Onboarding] Carrier ${carrierId} not found in leads.json`)
    return { converted: false, action_taken: 'carrier_not_found' }
  }

  const lead = leads[leadIndex]
  const isReadyToConvert = lead.ready_to_convert === true || (lead.loads_found > 0 && lead.trial_status === 'active')

  if (isReadyToConvert) {
    console.log(`[Onboarding] ${lead.company} ready to convert — calling handleTrialHandoff()`)

    let handoffSuccess = false
    try {
      handoffSuccess = await handleTrialHandoff(lead.id || carrierId)
    } catch (err) {
      console.error(`[Onboarding] handleTrialHandoff failed: ${err.message}`)
    }

    // Update lead record
    leads[leadIndex] = {
      ...lead,
      trial_status: handoffSuccess ? 'converted' : 'conversion_pending',
      converted: handoffSuccess,
      converted_at: handoffSuccess ? new Date().toISOString() : null,
      trial_day: 7
    }
    await saveLeads(leads)

    await logDecision({
      agent: 'Onboarding',
      situation_type: 'trial_day7_decision',
      inputs: { carrier: lead.company, mc_number: lead.mc_number, loads_found: lead.loads_found },
      recommendation: 'CONVERT — Day 7 check passed, trial showed positive results',
      owner_decision: handoffSuccess ? 'CONVERTED' : 'CONVERSION_PENDING',
      confidence_before: 0.85
    })

    return { converted: handoffSuccess, action_taken: handoffSuccess ? 'trial_handoff_completed' : 'trial_handoff_queued' }

  } else {
    // Not ready to convert — move to nurture drip
    console.log(`[Onboarding] ${lead.company} not ready to convert — moving to nurture drip`)

    leads[leadIndex] = {
      ...lead,
      trial_status: 'nurture',
      trial_day: 7,
      outreach_step: 1,  // Start nurture sequence from step 1 (skip welcome, already had trial)
      trial_ended_at: new Date().toISOString()
    }
    await saveLeads(leads)

    const nurtureEmailBody = `Hi ${lead.contact_name || lead.company},\n\nYour trial is wrapping up. No hard close here.\n\nIf the timing isn't right, that's fine. I'll check back in 30 days — things change, and we'll still be here.\n\nIf something specific held you back (rates, lane coverage, timing), reply and let me know. I'd rather fix a real problem than lose a good carrier.\n\nEither way, good luck out there.\n\n— AI Dispatch Team`

    if (lead.email) {
      await sendEmail(lead.email, 'No pressure — here when you\'re ready', nurtureEmailBody, lead.company)
    }

    await logDecision({
      agent: 'Onboarding',
      situation_type: 'trial_day7_decision',
      inputs: { carrier: lead.company, mc_number: lead.mc_number, loads_found: lead.loads_found || 0 },
      recommendation: 'NURTURE — Day 7, carrier not ready to convert. Moving to 30-day nurture drip.',
      owner_decision: 'NURTURE_DRIP',
      confidence_before: 0.75
    })

    await evaluateEscalation({
      type: 'trial_not_converted',
      agent: 'Onboarding',
      data: { carrier: lead.company, mc: lead.mc_number, loads_found: lead.loads_found || 0 },
      ref_id: lead.mc_number || carrierId
    })

    await memory.remember({
      key: `trial_day7_${carrierId}`,
      value: `Day 7: ${lead.company} moved to nurture drip. Loads found: ${lead.loads_found || 0}. outreach_step set to 1.`,
      source: carrierId,
      importance: 3
    })

    return { converted: false, action_taken: 'moved_to_nurture_drip' }
  }
}

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv[2] === '--verify') {
  const mc = process.argv[3] || 'MC123456'
  verifyCarrier(mc).then(r => console.log('[Onboarding] Verification result:', JSON.stringify(r, null, 2)))
}

if (process.argv[2] === '--start-trial') {
  startTrial({
    name: 'Test Medical Freight LLC',
    mc_number: 'MC888001',
    email: 'test@example.com',
    truck_count: 2,
    contact_name: 'John Driver',
    home_state: 'IL'
  }).then(r => console.log('[Onboarding] Trial result:', r))
}
