/**
 * Command Center Generator
 *
 * Maya calls this every morning at 6AM to build the HTML dashboard.
 * Pulls live data from Airtable, formats it, and generates index.html.
 *
 * Simple version: Like a newspaper printing press — every morning it
 * takes fresh data, fills in the template, and produces today's edition.
 */

import 'dotenv/config'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { getSummary as getDecisionSummary } from '../decision_engine/engine.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Generate the command center HTML with live data.
 */
export async function generateCommandCenter(data = {}) {
  const template = await fs.readFile(path.join(__dirname, 'template.html'), 'utf8')

  const now = new Date()
  const context = process.env.ACTIVE_CONTEXT || 'USA'

  // Fetch data from Airtable if configured, otherwise use passed data
  const businessData = data.fromAirtable ? await fetchAirtableData() : {
    activeLoads: data.activeLoads || 0,
    revenueWeek: data.revenueWeek || 0,
    revenueLastWeek: data.revenueLastWeek || 0,
    truckCount: data.truckCount || 0,
    trialCount: data.trialCount || 0,
    priorities: data.priorities || ['No priorities queued — business is running smoothly.'],
    actionItems: data.actionItems || [],
    agentStatuses: data.agentStatuses || [],
    issues: data.issues || [],
    ironRuleRejections: data.ironRuleRejections || { fl: 0, rpm: 0, deadhead: 0, weight: 0 }
  }

  const decisionSummary = await getDecisionSummary()

  // Build priority items HTML
  const priorityHTML = businessData.priorities.slice(0, 5).map((p, i) =>
    `<li class="priority-item">
      <div class="priority-num">${i + 1}</div>
      <div class="priority-text">${p}</div>
    </li>`
  ).join('\n')

  // Build action items HTML
  const actionHTML = businessData.actionItems.length > 0
    ? businessData.actionItems.map(item =>
      `<div class="action-item">
        <div class="action-text">${item.description}</div>
        <div class="action-btns">
          <button class="btn btn-approve" onclick="approve('${item.id}')">Approve</button>
          <button class="btn btn-reject" onclick="reject('${item.id}')">Reject</button>
        </div>
      </div>`
      ).join('\n')
    : '<div class="all-good">No decisions needed today</div>'

  // Build agent status HTML
  const agentNames = ['Maya', 'Erin', 'Receptionist', 'Sales', 'Compliance', 'Onboarding', 'Support']
  const agentStatusHTML = agentNames.map(name => {
    const status = businessData.agentStatuses.find(s => s.name === name)
    const statusColor = status?.ok !== false ? 'dot-green' : 'dot-red'
    const statusText = status?.message || 'Running'
    return `<div class="status-row">
      <span><span class="status-dot ${statusColor}"></span>${name}</span>
      <span style="color: #888; font-size: 12px;">${statusText}</span>
    </div>`
  }).join('\n')

  // Issues section
  const issuesHTML = businessData.issues.length > 0
    ? businessData.issues.map(i => `<div class="status-row">${i}</div>`).join('\n')
    : '<div class="all-good">All systems running. No flags.</div>'

  // Revenue trend
  const revenueDiff = businessData.revenueWeek - businessData.revenueLastWeek
  const revenueTrend = revenueDiff >= 0
    ? `↑ $${Math.abs(revenueDiff).toLocaleString()} vs last week`
    : `↓ $${Math.abs(revenueDiff).toLocaleString()} vs last week`
  const revenueTrendClass = revenueDiff >= 0 ? 'trend-up' : 'trend-down'

  // Fill template
  const html = template
    .replace('{{DATE}}', now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
    .replace('{{TIME}}', now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
    .replace('{{USA_ACTIVE}}', context === 'USA' ? 'active' : '')
    .replace('{{CANADA_ACTIVE}}', context === 'CANADA' ? 'active' : '')
    .replace('{{EU_ACTIVE}}', context === 'EUROPE' ? 'active' : '')
    .replace('{{ACTIVE_LOADS}}', businessData.activeLoads)
    .replace('{{REVENUE_WEEK}}', businessData.revenueWeek.toLocaleString())
    .replace('{{REVENUE_TREND}}', revenueTrend)
    .replace('{{REVENUE_TREND_CLASS}}', revenueTrendClass)
    .replace('{{LOADS_TREND}}', `${decisionSummary.recent_7_days} decisions this week`)
    .replace('{{LOADS_TREND_CLASS}}', 'trend-up')
    .replace('{{TRUCK_COUNT}}', businessData.truckCount)
    .replace('{{TRIAL_COUNT}}', businessData.trialCount)
    .replace('{{TRIAL_TREND}}', businessData.trialCount > 0 ? `${businessData.trialCount} active` : 'None active')
    .replace('{{TRIAL_TREND_CLASS}}', businessData.trialCount > 0 ? 'trend-up' : '')
    .replace('{{PRIORITY_ITEMS}}', priorityHTML)
    .replace('{{ACTION_ITEMS}}', actionHTML)
    .replace('{{REJECT_FL}}', businessData.ironRuleRejections.fl)
    .replace('{{REJECT_RPM}}', businessData.ironRuleRejections.rpm)
    .replace('{{REJECT_DH}}', businessData.ironRuleRejections.deadhead)
    .replace('{{REJECT_WT}}', businessData.ironRuleRejections.weight)
    .replace('{{AGENT_STATUS_ROWS}}', agentStatusHTML)
    .replace('{{ISSUES_SECTION}}', issuesHTML)
    .replace('{{GENERATED_TIME}}', now.toLocaleTimeString())

  // Write to index.html
  await fs.writeFile(path.join(__dirname, 'index.html'), html)
  console.log(`[CommandCenter] Generated at ${now.toISOString()}`)

  return html
}

async function fetchAirtableData() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    return { activeLoads: 0, revenueWeek: 0, truckCount: 0, trialCount: 0, priorities: [], actionItems: [], agentStatuses: [], issues: [], ironRuleRejections: { fl: 0, rpm: 0, deadhead: 0, weight: 0 } }
  }

  const baseUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
  const headers = { 'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}` }

  try {
    const [loadsRes, carriersRes] = await Promise.all([
      fetch(`${baseUrl}/Loads?filterByFormula=Status%3D'Active'`, { headers }),
      fetch(`${baseUrl}/Carriers?filterByFormula=Status%3D'Active'`, { headers })
    ])
    const loads = await loadsRes.json()
    const carriers = await carriersRes.json()

    return {
      activeLoads: loads.records?.length || 0,
      revenueWeek: 0, // TODO: calculate from load records
      revenueLastWeek: 0,
      truckCount: carriers.records?.length || 0,
      trialCount: 0,
      priorities: ['Check dashboard for today\'s loads'],
      actionItems: [],
      agentStatuses: [],
      issues: [],
      ironRuleRejections: { fl: 0, rpm: 0, deadhead: 0, weight: 0 }
    }
  } catch (err) {
    console.error('[CommandCenter] Airtable fetch failed:', err.message)
    return { activeLoads: 0, revenueWeek: 0, truckCount: 0, trialCount: 0, priorities: ['Airtable connection issue — check config'], actionItems: [], agentStatuses: [], issues: ['Airtable connection failed'], ironRuleRejections: { fl: 0, rpm: 0, deadhead: 0, weight: 0 } }
  }
}

// Run standalone
if (process.argv[1].includes('generator.js')) {
  await generateCommandCenter({ fromAirtable: true })
}
