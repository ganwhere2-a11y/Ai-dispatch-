/**
 * Workflow: Carrier Development
 *
 * Weekly carrier outreach run every Monday at 8AM.
 * Refreshes FMCSA scores for all active carriers, analyzes lane gaps,
 * generates 10 targeted outreach emails, and updates Airtable.
 *
 * Stages:
 *   1. Load all active carriers from Airtable
 *   2. Refresh FMCSA SAFER score for each carrier
 *   3. Identify lane gaps (routes we need but don't have coverage for)
 *   4. Score carriers by lane fit and activity
 *   5. Generate 10 personalized outreach emails via Claude
 *   6. Update Airtable with refresh results + queue emails
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import cron from 'node-cron'
import Airtable from 'airtable'
import { vetCarrier } from '../agents/compliance/compliance.js'
import { logDecision } from '../decision_engine/engine.js'
import { evaluateEscalation } from '../agents/daniel/daniel.js'

const client = new Anthropic()

// Airtable setup
const airtableBase = process.env.AIRTABLE_BASE_ID
  ? new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)
  : null

// Priority lanes the business needs covered
const PRIORITY_LANES = [
  { origin_state: 'IL', dest_state: 'GA', avg_rpm: 2.60, priority: 'HIGH' },
  { origin_state: 'IL', dest_state: 'OH', avg_rpm: 2.55, priority: 'HIGH' },
  { origin_state: 'TX', dest_state: 'GA', avg_rpm: 2.65, priority: 'HIGH' },
  { origin_state: 'TX', dest_state: 'TN', avg_rpm: 2.58, priority: 'MEDIUM' },
  { origin_state: 'CA', dest_state: 'AZ', avg_rpm: 2.75, priority: 'HIGH' },
  { origin_state: 'NY', dest_state: 'OH', avg_rpm: 2.60, priority: 'MEDIUM' },
  { origin_state: 'PA', dest_state: 'MI', avg_rpm: 2.55, priority: 'MEDIUM' },
  { origin_state: 'GA', dest_state: 'TN', avg_rpm: 2.52, priority: 'MEDIUM' }
]

// ─── Stage Helpers ────────────────────────────────────────────────────────────

/**
 * Stage 1: Load active carriers from Airtable.
 * Falls back to a mock list if Airtable is not configured.
 */
async function loadActiveCarriers() {
  if (!airtableBase) {
    console.log('[carrier_dev] No Airtable configured — using mock carrier list')
    return [
      { id: 'mock_1', mc_number: 'MC100001', company_name: 'Atlas Medical Freight LLC', home_state: 'IL', dot_number: '1000001', safety_rating: 'Satisfactory', authority_start_date: '2022-06-01', insurance_exp_date: '2026-08-01', preferred_lanes: ['IL→GA', 'IL→OH'] },
      { id: 'mock_2', mc_number: 'MC100002', company_name: 'Lone Star Medical Transport', home_state: 'TX', dot_number: '1000002', safety_rating: 'Satisfactory', authority_start_date: '2023-01-15', insurance_exp_date: '2026-10-01', preferred_lanes: ['TX→GA', 'TX→TN'] },
      { id: 'mock_3', mc_number: 'MC100003', company_name: 'Great Lakes Freight Inc', home_state: 'OH', dot_number: '1000003', safety_rating: 'Unrated', authority_start_date: '2021-09-10', insurance_exp_date: '2026-12-01', preferred_lanes: ['OH→PA', 'OH→NY'] }
    ]
  }

  try {
    const records = await airtableBase('Carriers').select({
      filterByFormula: "{Status} = 'Active'",
      fields: ['MC Number', 'Company Name', 'Home State', 'DOT Number', 'Safety Rating', 'Authority Start Date', 'Insurance Exp Date', 'Preferred Lanes']
    }).all()

    return records.map(r => ({
      id: r.id,
      mc_number: r.get('MC Number'),
      company_name: r.get('Company Name'),
      home_state: r.get('Home State'),
      dot_number: r.get('DOT Number'),
      safety_rating: r.get('Safety Rating'),
      authority_start_date: r.get('Authority Start Date'),
      insurance_exp_date: r.get('Insurance Exp Date'),
      preferred_lanes: (r.get('Preferred Lanes') || '').split(',').map(l => l.trim())
    }))
  } catch (err) {
    console.error('[carrier_dev] Airtable load failed:', err.message)
    return []
  }
}

/**
 * Stage 2: Refresh FMCSA scores for all carriers.
 * Uses the compliance agent's vetCarrier function.
 * Flags any carriers that need immediate attention.
 */
async function refreshFmcsaScores(carriers) {
  console.log(`[carrier_dev] Stage 2 — Refreshing FMCSA scores for ${carriers.length} carriers`)
  const results = []

  for (const carrier of carriers) {
    try {
      const vetResult = await vetCarrier({
        mc_number: carrier.mc_number,
        dot_number: carrier.dot_number,
        company_name: carrier.company_name,
        safety_rating: carrier.safety_rating,
        authority_start_date: carrier.authority_start_date,
        insurance_exp_date: carrier.insurance_exp_date
      })

      results.push({
        carrier,
        vet: vetResult,
        status: vetResult.passed ? 'ACTIVE' : 'FLAGGED',
        flags: vetResult.flags
      })

      // Escalate any newly flagged carriers
      if (!vetResult.passed) {
        await evaluateEscalation({
          type: 'carrier_vetting_failed',
          agent: 'workflow/carrier_development',
          data: { carrier: carrier.company_name, mc: carrier.mc_number, flags: vetResult.flags },
          ref_id: carrier.mc_number
        })
      }
    } catch (err) {
      console.error(`[carrier_dev] Vet failed for ${carrier.company_name}:`, err.message)
      results.push({ carrier, vet: null, status: 'ERROR', flags: [err.message] })
    }
  }

  const activeCount = results.filter(r => r.status === 'ACTIVE').length
  const flaggedCount = results.filter(r => r.status === 'FLAGGED').length
  console.log(`[carrier_dev] FMCSA refresh complete — ${activeCount} active, ${flaggedCount} flagged`)
  return results
}

/**
 * Stage 3: Analyze lane gaps.
 * Compare priority lanes against what active carriers cover.
 * Returns lanes that need more carrier coverage.
 */
function analyzeLaneGaps(carrierResults) {
  console.log('[carrier_dev] Stage 3 — Analyzing lane gaps')
  const activeCarriers = carrierResults.filter(r => r.status === 'ACTIVE').map(r => r.carrier)

  const gaps = PRIORITY_LANES.map(lane => {
    const covering = activeCarriers.filter(c =>
      c.preferred_lanes.some(l => l.includes(lane.origin_state) && l.includes(lane.dest_state))
    )

    return {
      lane: `${lane.origin_state}→${lane.dest_state}`,
      avg_rpm: lane.avg_rpm,
      priority: lane.priority,
      carriers_covering: covering.length,
      needs_more: covering.length < 2,
      carriers: covering.map(c => c.company_name)
    }
  })

  const criticalGaps = gaps.filter(g => g.needs_more && g.priority === 'HIGH')
  console.log(`[carrier_dev] Found ${criticalGaps.length} critical lane gaps, ${gaps.filter(g => g.needs_more).length} total gaps`)
  return gaps
}

/**
 * Stage 4: Score carriers by activity and lane coverage.
 * Returns ranked list for targeted outreach.
 */
function scoreCarriersForOutreach(carrierResults, laneGaps) {
  const criticalGapLanes = laneGaps.filter(g => g.needs_more).map(g => g.lane)

  return carrierResults
    .filter(r => r.status === 'ACTIVE')
    .map(r => {
      const carrier = r.carrier
      let score = 50 // base score

      // Bonus for covering gap lanes
      const gapLanesCovered = carrier.preferred_lanes.filter(l =>
        criticalGapLanes.some(gl => l.includes(gl.split('→')[0]) || l.includes(gl.split('→')[1]))
      ).length
      score += gapLanesCovered * 15

      // Bonus for established carriers (lower risk)
      if (carrier.authority_start_date) {
        const ageDays = (Date.now() - new Date(carrier.authority_start_date)) / (1000 * 60 * 60 * 24)
        if (ageDays > 365) score += 10
        if (ageDays > 730) score += 10
      }

      return { ...r, outreach_score: score, gap_lanes_covered: gapLanesCovered }
    })
    .sort((a, b) => b.outreach_score - a.outreach_score)
}

/**
 * Stage 5: Generate 10 outreach emails via Claude.
 * Personalizes each email based on carrier's lanes and business profile.
 */
async function generateOutreachEmails(scoredCarriers, laneGaps) {
  console.log('[carrier_dev] Stage 5 — Generating outreach emails')

  const topCarriers = scoredCarriers.slice(0, 10)
  const criticalGapSummary = laneGaps.filter(g => g.needs_more).map(g => `${g.lane} (avg $${g.avg_rpm}/mile)`).join(', ')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are the Sales Agent for an AI-native medical freight dispatch business.
Generate 10 short, personalized carrier outreach emails. These go to active carriers we want to offer more loads.

Lane gaps we need coverage for: ${criticalGapSummary}

Target carriers (top 10 by score):
${topCarriers.map((c, i) => `${i + 1}. ${c.carrier.company_name} | Home: ${c.carrier.home_state} | Lanes: ${c.carrier.preferred_lanes.join(', ')} | Score: ${c.outreach_score}`).join('\n')}

For each carrier, write:
- Subject line
- 3-4 sentence email body (friendly, direct, specific to their lanes)
- Reference specific lane opportunities we have at current rates

Return a JSON array of objects with: carrier_name, mc_number, subject, body

Keep each email under 100 words. Mention the 7-day free trial if they are not yet on paid plan.`
    }]
  })

  try {
    const text = response.content[0].text
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const emails = JSON.parse(jsonMatch[0])
    console.log(`[carrier_dev] Generated ${emails.length} outreach emails`)
    return emails
  } catch {
    console.warn('[carrier_dev] Email generation parse failed — using fallback')
    return topCarriers.map(c => ({
      carrier_name: c.carrier.company_name,
      mc_number: c.carrier.mc_number,
      subject: `Load opportunities on your lanes — ${c.carrier.home_state} region`,
      body: `Hi ${c.carrier.company_name} team, we have consistent dry van loads on ${c.carrier.preferred_lanes[0] || 'your preferred lanes'}. We're actively looking for reliable carriers in this region. Rates are averaging $2.60-$2.75/mile. Interested in steady freight? Reply or book a quick call.`
    }))
  }
}

/**
 * Stage 6: Update Airtable with FMCSA refresh results and queue emails.
 */
async function updateAirtable(carrierResults, emails) {
  console.log('[carrier_dev] Stage 6 — Updating Airtable')

  if (!airtableBase) {
    console.log('[carrier_dev] No Airtable configured — logging results to console')
    console.log(`  Carriers refreshed: ${carrierResults.length}`)
    console.log(`  Flagged: ${carrierResults.filter(r => r.status === 'FLAGGED').length}`)
    console.log(`  Emails queued: ${emails.length}`)
    return { updated: 0, emails_queued: emails.length, simulated: true }
  }

  let updatedCount = 0
  for (const result of carrierResults) {
    if (!result.carrier.id) continue
    try {
      await airtableBase('Carriers').update(result.carrier.id, {
        'FMCSA Last Check': new Date().toISOString().split('T')[0],
        'FMCSA Status': result.status,
        'FMCSA Flags': result.flags.join('; ') || 'None'
      })
      updatedCount++
    } catch (err) {
      console.error(`[carrier_dev] Failed to update ${result.carrier.company_name}:`, err.message)
    }
  }

  // Queue emails in Airtable outreach table
  let emailsQueued = 0
  for (const email of emails) {
    try {
      await airtableBase('Outreach Queue').create({
        'Carrier Name': email.carrier_name,
        'MC Number': email.mc_number,
        'Subject': email.subject,
        'Body': email.body,
        'Send Date': new Date().toISOString().split('T')[0],
        'Status': 'QUEUED',
        'Source': 'weekly_carrier_development'
      })
      emailsQueued++
    } catch (err) {
      console.error(`[carrier_dev] Failed to queue email for ${email.carrier_name}:`, err.message)
    }
  }

  return { updated: updatedCount, emails_queued: emailsQueued }
}

// ─── Main Workflow ────────────────────────────────────────────────────────────

/**
 * Run the full carrier development workflow.
 * Called by cron every Monday at 8AM or triggered manually.
 */
export async function runCarrierDevelopment() {
  console.log('[carrier_dev] Starting weekly carrier development workflow')
  const startedAt = new Date().toISOString()

  const result = {
    started_at: startedAt,
    carriers_loaded: 0,
    fmcsa_refreshed: 0,
    flagged: 0,
    lane_gaps: [],
    emails_generated: 0,
    airtable_updated: 0
  }

  // Stage 1: Load active carriers
  const carriers = await loadActiveCarriers()
  result.carriers_loaded = carriers.length
  console.log(`[carrier_dev] Stage 1 — Loaded ${carriers.length} active carriers`)

  if (carriers.length === 0) {
    console.log('[carrier_dev] No carriers found. Workflow complete.')
    return result
  }

  // Stage 2: Refresh FMCSA scores
  const vetResults = await refreshFmcsaScores(carriers)
  result.fmcsa_refreshed = vetResults.length
  result.flagged = vetResults.filter(r => r.status === 'FLAGGED').length

  // Stage 3: Lane gap analysis
  const laneGaps = analyzeLaneGaps(vetResults)
  result.lane_gaps = laneGaps.filter(g => g.needs_more)

  // Stage 4: Score carriers for outreach
  const scoredCarriers = scoreCarriersForOutreach(vetResults, laneGaps)

  // Stage 5: Generate outreach emails
  const emails = await generateOutreachEmails(scoredCarriers, laneGaps)
  result.emails_generated = emails.length

  // Stage 6: Update Airtable
  const airtableResult = await updateAirtable(vetResults, emails)
  result.airtable_updated = airtableResult.updated
  result.emails_queued = airtableResult.emails_queued

  // Log this run to Decision Engine
  await logDecision({
    agent: 'workflow/carrier_development',
    situation_type: 'weekly_carrier_development',
    inputs: {
      carriers_checked: result.carriers_loaded,
      flagged: result.flagged,
      critical_gaps: result.lane_gaps.filter(g => g.priority === 'HIGH').length,
      emails_generated: result.emails_generated
    },
    recommendation: `Ran weekly development: ${result.flagged} flagged, ${result.lane_gaps.length} gaps, ${result.emails_generated} emails`,
    owner_decision: 'AUTO_RUN',
    confidence_before: 1.0
  })

  result.completed_at = new Date().toISOString()
  console.log(`[carrier_dev] Complete — ${result.fmcsa_refreshed} refreshed, ${result.flagged} flagged, ${result.emails_generated} emails generated`)
  return result
}

// ─── Cron Schedule — Every Monday 8AM ────────────────────────────────────────

cron.schedule('0 8 * * 1', async () => {
  console.log('[carrier_dev] Cron triggered — Monday 8AM carrier development run')
  try {
    await runCarrierDevelopment()
  } catch (err) {
    console.error('[carrier_dev] Cron run failed:', err)
    await evaluateEscalation({
      type: 'workflow_failure',
      agent: 'workflow/carrier_development',
      data: { workflow: 'carrier_development', error: err.message },
      ref_id: 'cron_monday_8am'
    })
  }
}, {
  timezone: 'America/Chicago'
})

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv.includes('--run')) {
  console.log('Running carrier development workflow manually...')
  const result = await runCarrierDevelopment()
  console.log('\nResult:', JSON.stringify(result, null, 2))
}
