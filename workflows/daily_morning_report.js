/**
 * Workflow: Daily Morning Report
 *
 * Runs every day at 6AM. Pulls live Airtable data (active loads, revenue,
 * trials), gets a Decision Engine summary, generates the report via Claude,
 * and sends it to the owner via Telegram.
 *
 * This is the owner's daily briefing. Daniel generates it.
 *
 * Cron: 0 6 * * * (6AM every day, America/Chicago)
 */

import 'dotenv/config'
import cron from 'node-cron'
import Airtable from 'airtable'
import { sendMorningReport } from '../agents/daniel/daniel.js'
import { getSummary as getDecisionSummary } from '../decision_engine/engine.js'
import { evaluateEscalation } from '../agents/daniel/daniel.js'

const airtableBase = process.env.AIRTABLE_BASE_ID
  ? new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)
  : null

// ─── Data Collectors ──────────────────────────────────────────────────────────

/**
 * Pull active loads from Airtable.
 * Returns count, total value, and any that need attention today.
 */
async function getActiveLoadsData() {
  if (!airtableBase) {
    // Return mock data when Airtable is not configured
    return {
      active_count: 3,
      total_value: 8400,
      loads: [
        { load_id: 'LOAD_MOCK_001', route: 'IL→GA', status: 'In Transit', client_rate: 2800, profit: 472 },
        { load_id: 'LOAD_MOCK_002', route: 'TX→TN', status: 'Confirmed', client_rate: 3100, profit: 390 },
        { load_id: 'LOAD_MOCK_003', route: 'OH→PA', status: 'Pending Pickup', client_rate: 2500, profit: 310 }
      ],
      awaiting_pickup: 1,
      in_transit: 1,
      needs_attention: []
    }
  }

  try {
    const records = await airtableBase('Loads').select({
      filterByFormula: "AND({Status} != 'Delivered', {Status} != 'Invoiced', {Status} != 'Cancelled')",
      fields: ['Load ID', 'Route', 'Status', 'Client Rate', 'Profit', 'Pickup Date', 'Delivery Date', 'Carrier Name']
    }).all()

    const loads = records.map(r => ({
      load_id: r.get('Load ID'),
      route: r.get('Route'),
      status: r.get('Status'),
      client_rate: r.get('Client Rate') || 0,
      profit: r.get('Profit') || 0,
      pickup_date: r.get('Pickup Date'),
      delivery_date: r.get('Delivery Date'),
      carrier: r.get('Carrier Name')
    }))

    const totalValue = loads.reduce((sum, l) => sum + (l.client_rate || 0), 0)

    // Flag loads with pickup today that aren't confirmed
    const today = new Date().toISOString().split('T')[0]
    const needsAttention = loads.filter(l =>
      l.pickup_date === today && l.status === 'Pending Pickup'
    )

    return {
      active_count: loads.length,
      total_value: totalValue,
      loads,
      awaiting_pickup: loads.filter(l => l.status === 'Pending Pickup').length,
      in_transit: loads.filter(l => l.status === 'In Transit').length,
      needs_attention: needsAttention
    }
  } catch (err) {
    console.error('[morning_report] Failed to load Airtable loads:', err.message)
    return { active_count: 0, total_value: 0, loads: [], awaiting_pickup: 0, in_transit: 0, needs_attention: [] }
  }
}

/**
 * Pull weekly revenue and load stats.
 */
async function getRevenueData() {
  if (!airtableBase) {
    return {
      this_week_revenue: 18400,
      this_week_loads: 7,
      this_week_profit: 3210,
      this_month_revenue: 58000,
      avg_profit_per_load: 458,
      loads_rejected_this_week: 4
    }
  }

  try {
    const monday = new Date()
    monday.setDate(monday.getDate() - monday.getDay() + 1)
    monday.setHours(0, 0, 0, 0)
    const mondayISO = monday.toISOString()

    const records = await airtableBase('Loads').select({
      filterByFormula: `AND({Status} = 'Delivered', {Delivery Date} >= '${mondayISO}')`,
      fields: ['Client Rate', 'Profit', 'Load ID']
    }).all()

    const weekRevenue = records.reduce((sum, r) => sum + (r.get('Client Rate') || 0), 0)
    const weekProfit = records.reduce((sum, r) => sum + (r.get('Profit') || 0), 0)

    return {
      this_week_revenue: weekRevenue,
      this_week_loads: records.length,
      this_week_profit: weekProfit,
      avg_profit_per_load: records.length > 0 ? Math.round(weekProfit / records.length) : 0
    }
  } catch (err) {
    console.error('[morning_report] Failed to load revenue data:', err.message)
    return { this_week_revenue: 0, this_week_loads: 0, this_week_profit: 0, avg_profit_per_load: 0 }
  }
}

/**
 * Pull active trial carriers.
 */
async function getTrialData() {
  if (!airtableBase) {
    return {
      active_trials: 2,
      day7_today: 1,
      trials: [
        { company: 'Atlas Medical Freight LLC', day: 5, loads_found: 3, state: 'IL' },
        { company: 'Southern Cargo Partners', day: 7, loads_found: 1, state: 'GA' }
      ]
    }
  }

  try {
    const records = await airtableBase('Trials').select({
      filterByFormula: "{Trial Status} = 'ACTIVE'",
      fields: ['Company Name', 'Day', 'Loads Found', 'Home State', 'Trial Start Date']
    }).all()

    const trials = records.map(r => ({
      company: r.get('Company Name'),
      day: r.get('Day') || 1,
      loads_found: r.get('Loads Found') || 0,
      state: r.get('Home State')
    }))

    return {
      active_trials: trials.length,
      day7_today: trials.filter(t => t.day === 7).length,
      trials
    }
  } catch (err) {
    console.error('[morning_report] Failed to load trial data:', err.message)
    return { active_trials: 0, day7_today: 0, trials: [] }
  }
}

/**
 * Pull yesterday's Erin activity.
 * Loads booked, rejected, and total revenue generated.
 */
async function getErinYesterdayData() {
  if (!airtableBase) {
    return {
      booked: 2,
      rejected: 3,
      revenue: 5900,
      profit: 860,
      top_load: { route: 'IL→GA', profit: 472 }
    }
  }

  try {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    const yesterdayISO = yesterday.toISOString().split('T')[0]

    const records = await airtableBase('Loads').select({
      filterByFormula: `AND({Date Booked} = '${yesterdayISO}', {Status} != 'Cancelled')`,
      fields: ['Client Rate', 'Profit', 'Route', 'Status']
    }).all()

    const booked = records.filter(r => r.get('Status') !== 'Rejected')
    const revenue = booked.reduce((sum, r) => sum + (r.get('Client Rate') || 0), 0)
    const profit = booked.reduce((sum, r) => sum + (r.get('Profit') || 0), 0)

    const topLoad = booked.reduce((top, r) => {
      const p = r.get('Profit') || 0
      return p > (top?.profit || 0) ? { route: r.get('Route'), profit: p } : top
    }, null)

    return {
      booked: booked.length,
      rejected: records.filter(r => r.get('Status') === 'Rejected').length,
      revenue,
      profit,
      top_load: topLoad
    }
  } catch (err) {
    console.error('[morning_report] Failed to load Erin yesterday data:', err.message)
    return { booked: 0, rejected: 0, revenue: 0, profit: 0, top_load: null }
  }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Generate and send Daniel's morning report.
 * Pulls all data, generates report via Claude, sends via Telegram.
 */
export async function generateAndSendReport() {
  console.log('[morning_report] Starting 6AM report generation')

  // Pull all data in parallel
  const [activeLoads, revenue, trials, erinYesterday, decisionSummary] = await Promise.all([
    getActiveLoadsData(),
    getRevenueData(),
    getTrialData(),
    getErinYesterdayData(),
    getDecisionSummary()
  ])

  // Compile business data for Daniel
  const businessData = {
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    activeLoads: activeLoads.active_count,
    activeLoadValue: activeLoads.total_value,
    loadsAwaitingPickup: activeLoads.awaiting_pickup,
    loadsInTransit: activeLoads.in_transit,
    loadsNeedingAttention: activeLoads.needs_attention,
    weekRevenue: revenue.this_week_revenue,
    weekLoads: revenue.this_week_loads,
    weekProfit: revenue.this_week_profit,
    avgProfitPerLoad: revenue.avg_profit_per_load,
    activeTrials: trials.active_trials,
    trialsEndingToday: trials.day7_today,
    trialDetails: trials.trials,
    erinYesterday: {
      booked: erinYesterday.booked,
      rejected: erinYesterday.rejected,
      revenue: erinYesterday.revenue,
      profit: erinYesterday.profit,
      topLoad: erinYesterday.top_load
    },
    decisionEngine: {
      totalDecisions: decisionSummary.total,
      autonomousCapabilities: decisionSummary.autonomous_eligible,
      recentActivity: decisionSummary.recent_7_days
    }
  }

  // Flag anything that needs immediate attention
  if (activeLoads.needs_attention.length > 0) {
    await evaluateEscalation({
      type: 'loads_need_pickup_today',
      agent: 'workflow/daily_morning_report',
      data: { count: activeLoads.needs_attention.length, loads: activeLoads.needs_attention.map(l => l.load_id) },
      ref_id: 'morning_check'
    })
  }

  if (trials.day7_today > 0) {
    await evaluateEscalation({
      type: 'trial_day7_conversion',
      agent: 'workflow/daily_morning_report',
      data: { count: trials.day7_today, carriers: trials.trials.filter(t => t.day === 7).map(t => t.company) },
      ref_id: 'morning_check'
    })
  }

  // Send report via Daniel
  const report = await sendMorningReport(businessData)

  console.log('[morning_report] Report sent successfully')
  return { sent: true, report, data: businessData }
}

// ─── Cron Schedule — 6AM Every Day ───────────────────────────────────────────

cron.schedule('0 6 * * *', async () => {
  console.log('[morning_report] Cron triggered — 6AM daily report')
  try {
    await generateAndSendReport()
  } catch (err) {
    console.error('[morning_report] Report generation failed:', err)
    // Even if report fails, try to alert the owner
    await evaluateEscalation({
      type: 'morning_report_failed',
      agent: 'workflow/daily_morning_report',
      data: { error: err.message },
      ref_id: 'cron_6am'
    }).catch(() => {})
  }
}, {
  timezone: 'America/Chicago'
})

console.log('[morning_report] Cron scheduled — daily report runs at 6AM America/Chicago')

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv.includes('--now')) {
  console.log('Generating morning report now...')
  const result = await generateAndSendReport()
  console.log('\nReport generation complete.')
  console.log('\n--- REPORT ---')
  console.log(result.report)
}
