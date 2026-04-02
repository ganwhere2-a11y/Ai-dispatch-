/**
 * Workflow: Weekly Review
 *
 * Runs every Sunday (or on demand). Pulls all load and financial data from
 * data/finance/pnl.json and data/decisions/decisions.json, calculates key
 * performance metrics, generates a plain-English summary via Claude, and
 * sends it to the owner via Maya's Telegram.
 *
 * Metrics calculated:
 *   - total_revenue
 *   - total_loads
 *   - avg_profit_per_load
 *   - top_lane (highest profit lane)
 *   - worst_lane (lowest profit or most rejections)
 *   - loads_auto_rejected (Iron Rule rejections this week)
 *   - conversion_rate (trials that converted this week)
 *
 * Cron: 0 8 * * 0 (8AM every Sunday, America/Chicago)
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { AgentMemory } from '../shared/memory.js'
import { getSummary as getDecisionSummary } from '../decision_engine/engine.js'
import { sendMorningReport } from '../agents/maya/maya.js'
import { evaluateEscalation } from '../agents/maya/maya.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PNL_FILE = path.join(__dirname, '../data/finance/pnl.json')
const DECISIONS_FILE = path.join(__dirname, '../data/decisions/decisions.json')
const LEADS_FILE = path.join(__dirname, '../data/sales/leads.json')

const client = new Anthropic()
const memory = new AgentMemory('WeeklyReview')

// ─── Data Loaders ─────────────────────────────────────────────────────────────

async function loadPnl() {
  try {
    const raw = await fs.readFile(PNL_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { weekly: [], loads: [], invoices: [] }
  }
}

async function loadDecisions() {
  try {
    const raw = await fs.readFile(DECISIONS_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
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

// ─── Metric Calculators ───────────────────────────────────────────────────────

function getWeekBoundaries() {
  const now = new Date()
  const endOfWeek = new Date(now)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)
  startOfWeek.setHours(0, 0, 0, 0)
  endOfWeek.setHours(23, 59, 59, 999)
  return { startOfWeek, endOfWeek }
}

function calculateLaneStats(loads) {
  const laneMap = {}

  for (const load of loads) {
    const lane = load.route || `${load.origin || '?'} → ${load.destination || '?'}`
    if (!laneMap[lane]) {
      laneMap[lane] = { lane, loads: 0, total_profit: 0, total_revenue: 0, rejections: 0 }
    }
    if (load.status === 'Rejected' || load.status === 'rejected' || load.accepted === false) {
      laneMap[lane].rejections++
    } else {
      laneMap[lane].loads++
      laneMap[lane].total_profit += load.profit?.profit || load.profit || 0
      laneMap[lane].total_revenue += load.client_rate || load.rate_calc?.clientRate || 0
    }
  }

  const laneArray = Object.values(laneMap)
  if (laneArray.length === 0) return { top_lane: null, worst_lane: null }

  // Top lane: highest total profit on accepted loads
  const acceptedLanes = laneArray.filter(l => l.loads > 0)
  const topLane = acceptedLanes.length > 0
    ? acceptedLanes.reduce((best, l) => l.total_profit > best.total_profit ? l : best)
    : null

  // Worst lane: lowest profit per load OR most rejections
  const worstByProfit = acceptedLanes.length > 1
    ? acceptedLanes.reduce((worst, l) => {
        const profitPerLoad = l.loads > 0 ? l.total_profit / l.loads : 0
        const worstPpl = worst.loads > 0 ? worst.total_profit / worst.loads : 0
        return profitPerLoad < worstPpl ? l : worst
      })
    : null

  const worstByRejections = laneArray.reduce((worst, l) => l.rejections > worst.rejections ? l : worst, laneArray[0])
  const worstLane = worstByProfit || (worstByRejections.rejections > 0 ? worstByRejections : null)

  return { top_lane: topLane, worst_lane: worstLane }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Run the full weekly review.
 * Calculates all metrics, generates summary via Claude, sends via Maya.
 *
 * @returns {Promise<object>} The complete weekly summary object
 */
export async function runWeeklyReview() {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[WeeklyReview] System paused. runWeeklyReview() aborted.')
    return null
  }

  console.log('[WeeklyReview] Starting weekly review...')

  const { startOfWeek, endOfWeek } = getWeekBoundaries()

  // Load all data sources in parallel
  const [pnl, allDecisions, leads, decisionSummary] = await Promise.all([
    loadPnl(),
    loadDecisions(),
    loadLeads(),
    getDecisionSummary()
  ])

  // Filter to this week's loads
  const weekLoads = (pnl.loads || []).filter(l => {
    const loadDate = new Date(l.delivery_date || l.booked_at || l.accepted_at || l.created_at || 0)
    return loadDate >= startOfWeek && loadDate <= endOfWeek
  })

  // Filter to this week's decisions
  const weekDecisions = allDecisions.filter(d => {
    const decDate = new Date(d.timestamp || 0)
    return decDate >= startOfWeek && decDate <= endOfWeek
  })

  // ── Core Metrics ────────────────────────────────────────────────────────────

  const acceptedLoads = weekLoads.filter(l =>
    l.status !== 'Rejected' && l.status !== 'rejected' && l.accepted !== false
  )

  const total_revenue = acceptedLoads.reduce((sum, l) =>
    sum + (l.client_rate || l.rate_calc?.clientRate || 0), 0
  )

  const total_loads = acceptedLoads.length

  const total_profit = acceptedLoads.reduce((sum, l) =>
    sum + (l.profit?.profit || l.profit || 0), 0
  )

  const avg_profit_per_load = total_loads > 0
    ? Math.round((total_profit / total_loads) * 100) / 100
    : 0

  // ── Lane Analysis ────────────────────────────────────────────────────────────

  const { top_lane, worst_lane } = calculateLaneStats(weekLoads)

  // ── Iron Rule Rejections (from decision engine) ───────────────────────────

  const loads_auto_rejected = weekDecisions.filter(d =>
    d.situation_type === 'load_evaluation' &&
    (d.owner_decision === 'REJECTED_AUTO' || d.recommendation?.includes('REJECT'))
  ).length

  // ── Trial Conversion Rate ─────────────────────────────────────────────────

  const trialsStartedThisWeek = leads.filter(l => {
    const startDate = new Date(l.trial_start_date || l.queued_at || 0)
    return l.trial_status && startDate >= startOfWeek
  }).length

  const trialsConvertedThisWeek = leads.filter(l => {
    const convertDate = new Date(l.converted_at || 0)
    return l.converted && convertDate >= startOfWeek
  }).length

  const conversion_rate = trialsStartedThisWeek > 0
    ? Math.round((trialsConvertedThisWeek / trialsStartedThisWeek) * 100)
    : 0

  // ── Active Trials ────────────────────────────────────────────────────────

  const active_trials = leads.filter(l => l.trial_status === 'active').length

  // ── Revenue Trend (vs previous week) ─────────────────────────────────────

  const twoWeeksAgo = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000)
  const prevWeekLoads = (pnl.loads || []).filter(l => {
    const loadDate = new Date(l.delivery_date || l.booked_at || l.accepted_at || 0)
    return loadDate >= twoWeeksAgo && loadDate < startOfWeek
  })
  const prev_week_revenue = prevWeekLoads.reduce((sum, l) =>
    sum + (l.client_rate || l.rate_calc?.clientRate || 0), 0
  )
  const revenue_change_pct = prev_week_revenue > 0
    ? Math.round(((total_revenue - prev_week_revenue) / prev_week_revenue) * 100)
    : null

  // ── Compile Summary Object ────────────────────────────────────────────────

  const summaryData = {
    period: {
      start: startOfWeek.toISOString().split('T')[0],
      end: endOfWeek.toISOString().split('T')[0]
    },
    total_revenue: Math.round(total_revenue * 100) / 100,
    total_loads,
    total_profit: Math.round(total_profit * 100) / 100,
    avg_profit_per_load,
    top_lane: top_lane ? {
      lane: top_lane.lane,
      loads: top_lane.loads,
      total_profit: Math.round(top_lane.total_profit * 100) / 100
    } : null,
    worst_lane: worst_lane ? {
      lane: worst_lane.lane,
      loads: worst_lane.loads,
      rejections: worst_lane.rejections,
      total_profit: Math.round(worst_lane.total_profit * 100) / 100
    } : null,
    loads_auto_rejected,
    active_trials,
    trials_started_this_week: trialsStartedThisWeek,
    trials_converted_this_week: trialsConvertedThisWeek,
    conversion_rate,
    revenue_change_pct,
    prev_week_revenue: Math.round(prev_week_revenue * 100) / 100,
    decision_engine: {
      total_decisions: decisionSummary.total,
      this_week: decisionSummary.recent_7_days,
      autonomous_eligible: decisionSummary.autonomous_eligible
    }
  }

  // ── Generate Summary Text via Claude ─────────────────────────────────────

  let summaryText = ''

  try {
    const memContext = await memory.buildContext('weekly_review')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `You are Maya, the executive assistant for an AI-native medical freight dispatch business.
Write the weekly review summary for the owner.
${memContext}
Tone: direct, business-like, plain English. No jargon. No bullet points — write in short paragraphs.
Highlight wins, flag concerns, and give one clear priority for next week.
Keep it under 300 words.`,
      messages: [{
        role: 'user',
        content: `Weekly performance data:
${JSON.stringify(summaryData, null, 2)}

Write the weekly review. Cover:
1. Revenue and load volume (compare to last week if data available)
2. Top and worst performing lanes
3. How many loads were auto-rejected by Iron Rules and why that's good discipline
4. Trial pipeline (active, converted, conversion rate)
5. One priority action for next week`
      }]
    })

    summaryText = response.content[0].text.trim()
  } catch (err) {
    console.error(`[WeeklyReview] Claude summary generation failed: ${err.message}`)

    // Fallback plain-text summary
    summaryText = `WEEKLY REVIEW — ${summaryData.period.start} to ${summaryData.period.end}\n\n` +
      `Revenue: $${total_revenue.toLocaleString()} across ${total_loads} loads. ` +
      `Average profit per load: $${avg_profit_per_load}. ` +
      (revenue_change_pct !== null ? `${revenue_change_pct >= 0 ? '+' : ''}${revenue_change_pct}% vs last week. ` : '') +
      `\n\n` +
      (top_lane ? `Best lane: ${top_lane.lane} — $${top_lane.total_profit} profit on ${top_lane.loads} loads. ` : '') +
      (worst_lane ? `Watch lane: ${worst_lane.lane} — ${worst_lane.rejections} rejections this week. ` : '') +
      `\n\n` +
      `Iron Rule rejections this week: ${loads_auto_rejected} (system working correctly). ` +
      `\n\n` +
      `Trial pipeline: ${active_trials} active. ${trialsConvertedThisWeek} converted this week (${conversion_rate}% rate). ` +
      `\n\nDecision Engine: ${decisionSummary.total} total decisions logged. ${decisionSummary.autonomous_eligible} autonomous capabilities unlocked.`
  }

  summaryData.summary_text = summaryText

  // ── Send via Maya's Telegram ─────────────────────────────────────────────

  try {
    await sendMorningReport({
      isWeeklyReview: true,
      date: `Week of ${summaryData.period.start}`,
      weekRevenue: total_revenue,
      weekLoads: total_loads,
      weekProfit: total_profit,
      avgProfitPerLoad: avg_profit_per_load,
      activeTrials: active_trials,
      conversionRate: conversion_rate,
      autoRejections: loads_auto_rejected,
      decisionEngine: summaryData.decision_engine,
      customReport: summaryText
    })
    summaryData.sent_via_telegram = true
  } catch (err) {
    console.error(`[WeeklyReview] Failed to send via Maya: ${err.message}`)
    summaryData.sent_via_telegram = false
    summaryData.send_error = err.message

    // Escalate if we can't send the report
    await evaluateEscalation({
      type: 'morning_report_failed',
      agent: 'workflow/weekly_review',
      data: { error: err.message, week: summaryData.period.start },
      ref_id: 'weekly_review'
    }).catch(() => {})
  }

  // ── Store in memory for future context ────────────────────────────────────

  await memory.remember({
    key: 'weekly_review',
    value: `Week ${summaryData.period.start}: Revenue $${total_revenue.toLocaleString()}, ${total_loads} loads, ${conversion_rate}% trial conversion, ${loads_auto_rejected} iron rule rejections`,
    importance: 4
  })

  console.log(`[WeeklyReview] Complete — Revenue: $${total_revenue.toLocaleString()}, Loads: ${total_loads}, Trials: ${active_trials}`)
  return summaryData
}

// ─── Cron Schedule ────────────────────────────────────────────────────────────

// Dynamic import to avoid crashing if node-cron is not installed
import('node-cron').then(({ default: cron }) => {
  cron.schedule('0 8 * * 0', async () => {
    console.log('[WeeklyReview] Cron triggered — Sunday 8AM review')
    try {
      await runWeeklyReview()
    } catch (err) {
      console.error('[WeeklyReview] Cron run failed:', err)
    }
  }, { timezone: 'America/Chicago' })

  console.log('[WeeklyReview] Cron scheduled — runs Sunday 8AM America/Chicago')
}).catch(() => {
  // node-cron not available — skip scheduling
})

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv.includes('--now')) {
  console.log('Running weekly review now...')
  runWeeklyReview().then(result => {
    if (!result) { console.log('Review aborted.'); process.exit(1) }
    console.log('\n--- WEEKLY REVIEW SUMMARY ---\n')
    console.log(result.summary_text)
    console.log('\n--- METRICS ---\n')
    const { summary_text, ...metrics } = result
    console.log(JSON.stringify(metrics, null, 2))
  })
}
