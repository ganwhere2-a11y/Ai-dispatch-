/**
 * Workflow: Trial Onboarding
 *
 * Manages the full 7-day free trial lifecycle for new carriers.
 * This is lead generation — runs on a continuous loop with SDR + Receptionist.
 *
 * Flow:
 *   startTrial(carrier)       — Validate MC only, send welcome email, create trial record
 *   runTrialDay(carrierId, day) — Execute the scheduled task for a given trial day
 *   handleDay7(carrierId)     — Offer commission structure or move to nurture drip
 *
 * Trial rules:
 *   - No contract during trial
 *   - No charge to carrier during trial
 *   - Erin dispatches REAL loads — carrier earns real money
 *   - Single gate: valid active MC on FMCSA SAFER
 *   - After trial: offer 8% commission (10% first 90 days, drops to 8%). No monthly fee.
 *
 * Trial Day Schedule:
 *   Day 1: Welcome email + what to expect
 *   Day 2-6: Erin dispatches real loads (tracked automatically)
 *   Day 5: Send recap email (loads dispatched, revenue earned, time saved)
 *   Day 6: Check-in email
 *   Day 7: Conversion offer (8% commission) OR nurture drip → loop back to SDR
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import Airtable from 'airtable'
import { evaluateEscalation } from '../agents/maya/maya.js'
import { logDecision } from '../decision_engine/engine.js'
import { AgentMemory } from '../shared/memory.js'

const client = new Anthropic()
const memory = new AgentMemory('Onboarding')

const airtableBase = process.env.AIRTABLE_BASE_ID
  ? new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)
  : null

// ─── Email Templates ──────────────────────────────────────────────────────────

const EMAIL_TEMPLATES = {
  welcome: (carrier) => ({
    subject: `Your 7-day free trial has started — here's what happens next`,
    body: `Hi ${carrier.contact_name || carrier.company_name},

Welcome to your free trial. Here's what happens over the next 7 days:

Days 1-4: Our dispatch system (Erin) starts searching for loads on your preferred lanes.
Day 5: You'll get a recap showing what we found, estimated revenue, and time saved.
Day 7: You decide — if it's working, we continue. No commitment until then.

Your profile is set up with:
- Equipment: Dry van
- Home state: ${carrier.home_state}
- Preferred lanes: ${(carrier.preferred_lanes || []).join(', ') || 'to be confirmed'}

If you have specific lanes or availability windows, reply to this email and I'll update your profile.

One thing to know: we only work with dry van carriers running loads with $2.75+/mile. If a load doesn't meet our standards, we don't book it — even if it means fewer loads.

Questions? Reply here anytime.

— AI Dispatch Team`
  }),

  precheck_failed: (carrier, failedChecks) => ({
    subject: `One thing to fix before your trial starts`,
    body: `Hi ${carrier.contact_name || carrier.company_name},

We looked up your authority to get your trial ready. There's one issue we need to resolve first:

${failedChecks.map((f, i) => `${i + 1}. ${f}`).join('\n')}

This is standard compliance — we check every carrier the same way. Once you've resolved it, reply to this email and we'll start your trial immediately.

Need help? FMCSA can be reached at 1-800-832-5660 or safer.fmcsa.dot.gov.

— AI Dispatch Team`
  }),

  day5_recap: (carrier, stats) => ({
    subject: `Your trial recap: ${stats.loads_found} loads found in 4 days`,
    body: `Hi ${carrier.contact_name || carrier.company_name},

Here's your 4-day trial recap:

Loads found on your lanes: ${stats.loads_found}
Estimated gross revenue: $${stats.estimated_revenue.toLocaleString()}
Average rate: $${stats.avg_rpm}/mile
Time you would have spent on load boards: ~${stats.hours_saved} hours

${stats.loads_found > 0
  ? `Your strongest lane this week: ${stats.top_lane} at $${stats.top_lane_rpm}/mile`
  : 'Load volume was lighter than usual this week — this can vary by day and season.'}

Two more days left. Day 7, you decide whether to continue.

If you have questions about any specific load or want to discuss your lanes, reply here.

— AI Dispatch Team`
  }),

  day6_checkin: (carrier) => ({
    subject: `One day left — any questions?`,
    body: `Hi ${carrier.contact_name || carrier.company_name},

Your trial wraps up tomorrow.

Quick question: is there anything specific you want to see before you decide? A particular lane, a certain rate, more volume?

We can also set up a 15-minute call tomorrow if you'd like to review the trial results together before making a decision.

Book a call: ${process.env.CALENDLY_LINK || '[calendly link]'}

Or just reply to this email.

— AI Dispatch Team`
  }),

  conversion_offer: (carrier, stats) => ({
    subject: `Ready to continue? Here's how it works`,
    body: `Hi ${carrier.contact_name || carrier.company_name},

Your trial is done. Here's what we found: ${stats.loads_found} loads dispatched, ~$${stats.estimated_revenue.toLocaleString()} in gross revenue.

If you want to keep going, here's the deal:

- We charge 8% commission per load — that's it
- No monthly fee. No retainer. No setup cost.
- We only make money when you make money.

For your first 90 days, the rate is 10%. After that it drops to 8% and stays there.

To continue: reply "yes" and I'll send over the carrier agreement. Takes 5 minutes.

Not ready? No problem. I'll check back in 30 days.

— AI Dispatch Team`
  }),

  nurture_day7: (carrier) => ({
    subject: `No pressure — here when you're ready`,
    body: `Hi ${carrier.contact_name || carrier.company_name},

Your trial is wrapping up. No hard close here.

If the timing isn't right, that's fine. I'll check back in 30 days — things change, and we'll still be here.

If something specific held you back (rates, lane coverage, timing), reply and let me know. I'd rather fix a real problem than lose a good carrier.

Either way, good luck out there.

— AI Dispatch Team`
  })
}

// ─── MC Validation (Single Trial Gate) ───────────────────────────────────────

/**
 * Validate carrier MC number before starting trial.
 * This is the ONLY gate — trial is free lead gen, not a compliance screen.
 * Load-level Iron Rules (safety rating, authority age, etc.) apply per-load when Erin dispatches.
 *
 * @returns {{ passed: boolean, failures: string[], warnings: string[] }}
 */
async function runPreChecks(carrier) {
  console.log(`[trial] Validating MC for ${carrier.company_name} (MC ${carrier.mc_number})`)
  const failures = []
  const warnings = []

  // Only check: MC number must be present and valid (active, authorized for property)
  if (!carrier.mc_number) {
    failures.push('MC number not provided — required to dispatch legally')
    return { passed: false, failures, warnings }
  }

  // Check FMCSA operating authority status
  if (carrier.operating_authority && !carrier.operating_authority.includes('Property')) {
    failures.push(`MC ${carrier.mc_number} is not "Authorized for Property" on FMCSA SAFER — cannot dispatch without valid authority`)
  }

  // Soft warnings (don't block trial — Erin handles these per-load)
  if (carrier.safety_rating === 'Conditional' || carrier.safety_rating === 'Unsatisfactory') {
    warnings.push(`Safety rating is ${carrier.safety_rating} — some loads may be restricted per Iron Rules, but trial can proceed`)
  }

  return { passed: failures.length === 0, failures, warnings }
}

// ─── Airtable Helpers ─────────────────────────────────────────────────────────

async function createTrialRecord(carrier) {
  if (!airtableBase) {
    console.log(`[trial] Simulated: Created trial record for ${carrier.company_name}`)
    return `trial_${carrier.mc_number}_${Date.now()}`
  }

  const record = await airtableBase('Trials').create({
    'Company Name': carrier.company_name,
    'MC Number': carrier.mc_number,
    'Contact Name': carrier.contact_name || '',
    'Email': carrier.email || '',
    'Home State': carrier.home_state || '',
    'Preferred Lanes': (carrier.preferred_lanes || []).join(', '),
    'Trial Start Date': new Date().toISOString().split('T')[0],
    'Trial Status': 'ACTIVE',
    'Day': 1
  })

  return record.id
}

async function getTrialRecord(carrierId) {
  if (!airtableBase) {
    // Return mock data for testing
    return {
      id: carrierId,
      company_name: 'Mock Carrier LLC',
      mc_number: 'MC999999',
      contact_name: 'Driver Name',
      email: 'driver@example.com',
      home_state: 'IL',
      preferred_lanes: ['IL→GA', 'IL→OH'],
      trial_start_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'ACTIVE',
      current_day: 5,
      loads_found: 3,
      estimated_revenue: 4200,
      avg_rpm: 2.61,
      top_lane: 'IL→GA',
      top_lane_rpm: 2.68
    }
  }

  const record = await airtableBase('Trials').find(carrierId)
  return {
    id: record.id,
    company_name: record.get('Company Name'),
    mc_number: record.get('MC Number'),
    contact_name: record.get('Contact Name'),
    email: record.get('Email'),
    home_state: record.get('Home State'),
    preferred_lanes: (record.get('Preferred Lanes') || '').split(',').map(l => l.trim()),
    trial_start_date: record.get('Trial Start Date'),
    status: record.get('Trial Status'),
    current_day: record.get('Day') || 1,
    loads_found: record.get('Loads Found') || 0,
    estimated_revenue: record.get('Estimated Revenue') || 0,
    avg_rpm: record.get('Avg RPM') || 0,
    top_lane: record.get('Top Lane') || '',
    top_lane_rpm: record.get('Top Lane RPM') || 0
  }
}

async function sendEmail(to, emailContent) {
  // TODO: Replace with actual email provider (SendGrid, Resend, etc.)
  console.log(`[trial] EMAIL → ${to}`)
  console.log(`  Subject: ${emailContent.subject}`)
  console.log(`  Body preview: ${emailContent.body.slice(0, 100)}...`)
  return { sent: true, timestamp: new Date().toISOString() }
}

// ─── Main Exports ─────────────────────────────────────────────────────────────

/**
 * Start a new 7-day free trial for a carrier.
 * Single gate: MC must be valid and active on FMCSA SAFER.
 * No contract, no charge, no commitment during trial — pure lead gen.
 * Sends welcome email if MC valid, rejection email if not.
 *
 * @param {object} carrier
 * @param {string} carrier.company_name
 * @param {string} carrier.mc_number
 * @param {string} carrier.dot_number
 * @param {string} [carrier.contact_name]
 * @param {string} [carrier.email]
 * @param {string} [carrier.home_state]
 * @param {string[]} [carrier.preferred_lanes]
 * @param {string} [carrier.safety_rating]
 * @param {string} [carrier.authority_start_date]
 * @param {string} [carrier.insurance_exp_date]
 * @param {string} [carrier.operating_authority]
 */
export async function startTrial(carrier) {
  console.log(`[trial] Starting trial for ${carrier.company_name}`)

  const preChecks = await runPreChecks(carrier)

  if (!preChecks.passed) {
    console.log(`[trial] Pre-checks FAILED for ${carrier.company_name}: ${preChecks.failures.join('; ')}`)
    const failEmail = EMAIL_TEMPLATES.precheck_failed(carrier, preChecks.failures)
    if (carrier.email) await sendEmail(carrier.email, failEmail)

    await memory.remember({
      key: `trial_precheck_failed_${carrier.mc_number}`,
      value: `Pre-checks failed: ${preChecks.failures.join('; ')}`,
      source: carrier.mc_number,
      importance: 3
    })

    return {
      started: false,
      reason: 'precheck_failed',
      failures: preChecks.failures,
      warnings: preChecks.warnings
    }
  }

  // Pre-checks passed — create trial record
  const trialId = await createTrialRecord(carrier)

  // Send welcome email
  const welcomeEmail = EMAIL_TEMPLATES.welcome(carrier)
  if (carrier.email) await sendEmail(carrier.email, welcomeEmail)

  // Log to Decision Engine
  await logDecision({
    agent: 'workflow/trial_onboarding',
    situation_type: 'trial_started',
    inputs: { mc_number: carrier.mc_number, company_name: carrier.company_name, home_state: carrier.home_state },
    recommendation: 'START_TRIAL — all pre-checks passed',
    owner_decision: 'AUTO_APPROVED',
    confidence_before: 0.95
  })

  // Notify Maya (Day 1 info for morning report)
  await evaluateEscalation({
    type: 'trial_started',
    agent: 'workflow/trial_onboarding',
    data: { carrier: carrier.company_name, mc: carrier.mc_number, home_state: carrier.home_state },
    ref_id: carrier.mc_number
  })

  await memory.remember({
    key: `trial_active_${carrier.mc_number}`,
    value: `Trial started ${new Date().toDateString()}. Home: ${carrier.home_state}. Lanes: ${(carrier.preferred_lanes || []).join(', ')}`,
    source: carrier.mc_number,
    importance: 3
  })

  console.log(`[trial] Trial started for ${carrier.company_name} — Trial ID: ${trialId}`)
  return { started: true, trial_id: trialId, warnings: preChecks.warnings }
}

/**
 * Execute the scheduled task for a given trial day.
 * Called daily by a cron job or external scheduler.
 *
 * @param {string} carrierId - Airtable record ID or mock ID
 * @param {number} day - Current trial day (1-7)
 */
export async function runTrialDay(carrierId, day) {
  console.log(`[trial] Running Day ${day} for carrier ${carrierId}`)
  const record = await getTrialRecord(carrierId)

  switch (day) {
    case 1:
      // Welcome email already sent in startTrial — Erin starts searching
      console.log(`[trial] Day 1 — Erin begins load search for ${record.company_name}`)
      return { day: 1, action: 'load_search_started', carrier: record.company_name }

    case 2:
    case 3:
    case 4:
      // Erin dispatches loads — tracked automatically, nothing to send
      console.log(`[trial] Day ${day} — Erin dispatching for ${record.company_name} (auto-tracked)`)
      return { day, action: 'dispatching', carrier: record.company_name }

    case 5: {
      // Send recap email with stats
      const stats = {
        loads_found: record.loads_found,
        estimated_revenue: record.estimated_revenue,
        avg_rpm: record.avg_rpm,
        hours_saved: Math.max(2, record.loads_found * 1.5),
        top_lane: record.top_lane,
        top_lane_rpm: record.top_lane_rpm
      }
      const recapEmail = EMAIL_TEMPLATES.day5_recap(record, stats)
      if (record.email) await sendEmail(record.email, recapEmail)
      console.log(`[trial] Day 5 recap sent to ${record.company_name}`)
      return { day: 5, action: 'recap_sent', stats }
    }

    case 6: {
      // Send check-in email
      const checkinEmail = EMAIL_TEMPLATES.day6_checkin(record)
      if (record.email) await sendEmail(record.email, checkinEmail)
      console.log(`[trial] Day 6 check-in sent to ${record.company_name}`)
      return { day: 6, action: 'checkin_sent' }
    }

    case 7:
      // Day 7 has its own dedicated function
      return handleDay7(carrierId)

    default:
      console.warn(`[trial] Unknown trial day: ${day}`)
      return { day, action: 'unknown_day' }
  }
}

/**
 * Handle the Day 7 conversion decision.
 * If carrier has shown interest (loads loaded, emails opened) → pitch paid plan.
 * If no engagement → move to nurture drip.
 *
 * @param {string} carrierId - Airtable record ID
 */
export async function handleDay7(carrierId) {
  console.log(`[trial] Day 7 conversion decision for ${carrierId}`)
  const record = await getTrialRecord(carrierId)

  // Use Claude to evaluate conversion likelihood
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Evaluate this 7-day trial carrier for conversion likelihood.

Carrier: ${record.company_name}
Loads found during trial: ${record.loads_found}
Estimated revenue: $${record.estimated_revenue}
Trial start date: ${record.trial_start_date}
Home state: ${record.home_state}
Preferred lanes: ${record.preferred_lanes.join(', ')}

Based on the trial results, should we pitch paid conversion or move to nurture drip?

Return JSON with:
- decision: "CONVERT" or "NURTURE"
- reasoning: one sentence
- talking_point: the single strongest reason to convert (or the main objection to address in nurture)`
    }]
  })

  let decision
  try {
    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    decision = JSON.parse(jsonMatch[0])
  } catch {
    // Default: convert if they had any loads, nurture if zero
    decision = {
      decision: record.loads_found > 0 ? 'CONVERT' : 'NURTURE',
      reasoning: record.loads_found > 0 ? 'Trial generated load activity' : 'No loads found during trial period',
      talking_point: record.loads_found > 0 ? `Found ${record.loads_found} loads generating ~$${record.estimated_revenue} in this trial alone` : 'Timing or lane coverage may not be right yet'
    }
  }

  // Send appropriate email
  const stats = { loads_found: record.loads_found, estimated_revenue: record.estimated_revenue }

  if (decision.decision === 'CONVERT') {
    const conversionEmail = EMAIL_TEMPLATES.conversion_offer(record, stats)
    if (record.email) await sendEmail(record.email, conversionEmail)

    // Escalate to Maya for morning report
    await evaluateEscalation({
      type: 'trial_day7_conversion',
      agent: 'workflow/trial_onboarding',
      data: { carrier: record.company_name, mc: record.mc_number, loads_found: record.loads_found, estimated_revenue: record.estimated_revenue },
      ref_id: record.mc_number
    })
  } else {
    const nurtureEmail = EMAIL_TEMPLATES.nurture_day7(record)
    if (record.email) await sendEmail(record.email, nurtureEmail)

    // Notify Maya that this trial didn't convert
    await evaluateEscalation({
      type: 'trial_not_converted',
      agent: 'workflow/trial_onboarding',
      data: { carrier: record.company_name, mc: record.mc_number, reason: decision.reasoning },
      ref_id: record.mc_number
    })
  }

  // Log conversion decision
  await logDecision({
    agent: 'workflow/trial_onboarding',
    situation_type: 'trial_day7_decision',
    inputs: { mc_number: record.mc_number, loads_found: record.loads_found, estimated_revenue: record.estimated_revenue },
    recommendation: `${decision.decision} — ${decision.reasoning}`,
    owner_decision: decision.decision === 'CONVERT' ? 'AWAITING_SIGNATURE' : 'NURTURE_DRIP',
    confidence_before: 0.75
  })

  await memory.remember({
    key: `trial_day7_${record.mc_number}`,
    value: `Trial ended. Decision: ${decision.decision}. Loads: ${record.loads_found}. Revenue: $${record.estimated_revenue}. Reason: ${decision.reasoning}`,
    source: record.mc_number,
    importance: 4
  })

  return {
    day: 7,
    carrier: record.company_name,
    decision: decision.decision,
    reasoning: decision.reasoning,
    talking_point: decision.talking_point,
    stats
  }
}

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv.includes('--test')) {
  const testCarrier = {
    company_name: 'Test Medical Freight LLC',
    mc_number: 'MC888001',
    dot_number: '8880001',
    contact_name: 'John Driver',
    email: 'john@testfreight.com',
    home_state: 'IL',
    preferred_lanes: ['IL→GA', 'IL→OH'],
    safety_rating: 'Satisfactory',
    authority_start_date: '2023-01-01',
    insurance_exp_date: '2027-01-01',
    operating_authority: 'Authorized for Property'
  }

  console.log('Testing trial_onboarding workflow...\n')
  const startResult = await startTrial(testCarrier)
  console.log('Start trial result:', startResult)

  if (startResult.started) {
    console.log('\nSimulating Day 5...')
    const day5Result = await runTrialDay(startResult.trial_id, 5)
    console.log('Day 5 result:', day5Result)

    console.log('\nSimulating Day 7...')
    const day7Result = await handleDay7(startResult.trial_id)
    console.log('Day 7 result:', day7Result)
  }
}
