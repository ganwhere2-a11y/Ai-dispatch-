/**
 * Workflow: Lead Gen + Outreach
 *
 * Finds new leads (carriers via FMCSA API, shippers via Google Maps),
 * filters them against quality criteria, queues them into the 4-email
 * outreach sequence, and sends the appropriate email based on where
 * each lead is in the sequence.
 *
 * Exports:
 *   findLeads(options)        — Discover new leads from FMCSA/Google Maps
 *   runOutreachSequence()     — Process all leads in queue, send due emails
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import Airtable from 'airtable'
import fetch from 'node-fetch'
import { AgentMemory } from '../shared/memory.js'
import { logDecision } from '../decision_engine/engine.js'
import { evaluateEscalation } from '../agents/maya/maya.js'

const client = new Anthropic()
const memory = new AgentMemory('Sales')

const airtableBase = process.env.AIRTABLE_BASE_ID
  ? new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)
  : null

// FMCSA API base URL
const FMCSA_API = 'https://mobile.fmcsa.dot.gov/qc/services/carriers'
const FMCSA_KEY = process.env.FMCSA_API_KEY

// States with strong medical freight corridors
const TARGET_STATES = ['IL', 'TX', 'CA', 'GA', 'NY', 'PA', 'OH', 'TN', 'NC', 'NJ']

// Medical shipper types to search for (Google Maps queries)
const MEDICAL_SHIPPER_TYPES = [
  'medical supply distributor',
  'hospital supply chain',
  'pharmaceutical distributor',
  'medical device distributor',
  'home health equipment',
  'dental supply company'
]

// 4-email sequence timing (days from first contact)
const SEQUENCE_DAYS = { email1: 0, email2: 4, email3: 8, email4: 14 }
const ARCHIVE_DAY = 21

// ─── Email Sequence Templates ─────────────────────────────────────────────────

const CARRIER_EMAILS = {
  email1: (lead) => ({
    subject: `Dispatch for your dry van — 7 days free`,
    body: `Hi ${lead.contact_name || lead.company_name},

I help dry van carriers find consistent medical freight loads without spending hours on load boards.

We specialize in medical supply freight — clean cargo, consistent lanes, rates averaging $2.75+/mile.

I'm offering a 7-day free dispatch trial — real loads, your lanes, no fees until you see results.

Interested? Reply to this email or book 15 minutes: ${process.env.CALENDLY_LINK || '[calendly link]'}`
  }),

  email2: (lead) => ({
    subject: `One example from this week`,
    body: `Hi ${lead.contact_name || lead.company_name},

Quick follow-up. Here's a real load we booked this week:

Chicago, IL → Atlanta, GA | 600 miles | $2.60/mile | Medical supplies
Carrier cleared $472 profit after costs. Total time to book: under 2 hours.

If that's the kind of freight you want, the 7-day free trial shows you what we can do on your specific lanes.

Worth a conversation? ${process.env.CALENDLY_LINK || '[calendly link]'}`
  }),

  email3: (lead) => ({
    subject: `Free trial — real loads, no commitment`,
    body: `Hi ${lead.contact_name || lead.company_name},

Third and final intro from me. I'll keep it simple.

7-day free dispatch trial:
- We find loads on your lanes
- You see real rates and real results
- No fee until you decide to continue

If it doesn't work, you owe nothing. If it works, we talk.

Ready to start? ${process.env.CALENDLY_LINK || '[calendly link]'}`
  }),

  email4: (lead) => ({
    subject: `Last one — then I'll leave you alone`,
    body: `Hi ${lead.contact_name || lead.company_name},

Last email from me.

If the timing isn't right, no problem. I'll add you to our quarterly check-in list — we reach out every 90 days in case things change.

If you want to talk before then, you know where to find me.

Good luck on the road.

— AI Dispatch Team`
  })
}

const SHIPPER_EMAILS = {
  email1: (lead) => ({
    subject: `Faster medical freight with guaranteed delivery windows`,
    body: `Hi ${lead.contact_name || lead.company_name},

Medical facilities like yours move time-sensitive supplies regularly. Delays hurt patient care and staff schedules.

We specialize in dry van medical freight — same-day dispatch, real-time tracking, consistent carrier network.

Worth a 15-minute call to see if we're a fit? ${process.env.CALENDLY_LINK || '[calendly link]'}`
  }),

  email2: (lead) => ({
    subject: `How we handle medical freight differently`,
    body: `Hi ${lead.contact_name || lead.company_name},

Quick follow-up. What makes us different:

1. Every carrier is vetted against FMCSA — no provisional authorities, no lapsed insurance
2. We only move dry van medical cargo — no hazmat, no temperature-sensitive, no exceptions
3. Tracking and confirmation on every load

Most facilities we work with see fewer "where is my shipment" calls within the first month.

Interested? ${process.env.CALENDLY_LINK || '[calendly link]'}`
  }),

  email3: (lead) => ({
    subject: `Try us on one load`,
    body: `Hi ${lead.contact_name || lead.company_name},

Simple offer: let us handle one load for you. No long-term commitment, no setup fees.

If it goes well, we talk about volume. If not, you've lost nothing.

What's your next scheduled shipment? Reply and I'll get Erin on it.`
  }),

  email4: (lead) => ({
    subject: `Closing the loop`,
    body: `Hi ${lead.contact_name || lead.company_name},

Last note from me. If this isn't a priority right now, no problem.

I'll follow up in 90 days. In the meantime, if you have a shipment come up that needs reliable dry van coverage, reply here — we can usually turn around a quote in under an hour.

— AI Dispatch Team`
  })
}

// ─── Lead Discovery ───────────────────────────────────────────────────────────

/**
 * Find carrier leads via FMCSA SAFER API.
 * Searches active dry van carriers by state.
 */
async function findCarrierLeads(states = TARGET_STATES, limit = 20) {
  const leads = []

  if (!FMCSA_KEY) {
    console.log('[lead_gen] No FMCSA API key — generating mock carrier leads')
    // Mock leads for development
    return states.slice(0, 3).map((state, i) => ({
      type: 'carrier',
      company_name: `${state} Medical Transport LLC`,
      mc_number: `MC${700000 + i}`,
      dot_number: `${7000000 + i}`,
      home_state: state,
      safety_rating: 'Satisfactory',
      authority_start_date: '2022-06-01',
      insurance_on_file: true,
      source: 'fmcsa_mock'
    }))
  }

  for (const state of states.slice(0, 5)) {
    try {
      const url = `${FMCSA_API}/snapshot?state=${state}&carrierOperation=A&hazmatFlag=N&entityType=C&safetyRating=S&key=${FMCSA_KEY}`
      const response = await fetch(url)
      if (!response.ok) continue

      const data = await response.json()
      const carriers = (data.content || []).slice(0, Math.ceil(limit / 5))

      for (const c of carriers) {
        leads.push({
          type: 'carrier',
          company_name: c.legalName || c.dbaName,
          mc_number: c.mcNumber,
          dot_number: c.dotNumber,
          home_state: state,
          safety_rating: c.safetyRating || 'Unrated',
          authority_start_date: c.authorityStartDate,
          insurance_on_file: c.insuranceOnFile === 'Y',
          source: 'fmcsa_api'
        })
      }
    } catch (err) {
      console.error(`[lead_gen] FMCSA API failed for ${state}:`, err.message)
    }
  }

  return leads
}

/**
 * Find shipper leads via Google Maps Places API.
 * Searches for medical facilities by type and zip code.
 */
async function findShipperLeads(searchTerms = MEDICAL_SHIPPER_TYPES, limit = 20) {
  const leads = []

  const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY
  if (!GMAPS_KEY) {
    console.log('[lead_gen] No Google Maps API key — generating mock shipper leads')
    return searchTerms.slice(0, 3).map((term, i) => ({
      type: 'shipper',
      company_name: `Metro ${term.split(' ')[0]} Supply Co.`,
      address: `${i + 1}00 Medical Drive, Chicago, IL 6060${i}`,
      phone: `312-555-00${String(i).padStart(2, '0')}`,
      source: 'google_maps_mock',
      search_term: term
    }))
  }

  const targetZips = process.env.TARGET_ZIP_CODES
    ? process.env.TARGET_ZIP_CODES.split(',')
    : ['60601', '77001', '90001', '30301', '10001'] // Chicago, Houston, LA, Atlanta, NYC

  for (const term of searchTerms.slice(0, 3)) {
    for (const zip of targetZips.slice(0, 2)) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(term + ' ' + zip)}&key=${GMAPS_KEY}`
        const response = await fetch(url)
        if (!response.ok) continue

        const data = await response.json()
        const places = (data.results || []).slice(0, 3)

        for (const place of places) {
          leads.push({
            type: 'shipper',
            company_name: place.name,
            address: place.formatted_address,
            source: 'google_maps',
            search_term: term,
            place_id: place.place_id
          })
        }
      } catch (err) {
        console.error(`[lead_gen] Google Maps failed for "${term}":`, err.message)
      }
    }
  }

  return leads.slice(0, limit)
}

/**
 * Filter leads against quality criteria.
 * Removes leads we've already contacted or that fail basic checks.
 */
async function filterLeads(leads) {
  const filtered = []

  for (const lead of leads) {
    // Check memory — have we already contacted this company?
    const pastContact = await memory.recall(`outreach_${lead.mc_number || lead.company_name}`, 1)
    if (pastContact.length > 0) {
      console.log(`[lead_gen] Skip — already contacted: ${lead.company_name}`)
      continue
    }

    // Carrier-specific filters
    if (lead.type === 'carrier') {
      if (!lead.insurance_on_file) continue
      if (lead.safety_rating === 'Unsatisfactory' || lead.safety_rating === 'Conditional') continue

      // Authority age check (180 days minimum — Iron Rule)
      if (lead.authority_start_date) {
        const ageDays = (Date.now() - new Date(lead.authority_start_date)) / (1000 * 60 * 60 * 24)
        if (ageDays < 180) {
          console.log(`[lead_gen] Skip — authority too new (${Math.round(ageDays)} days): ${lead.company_name}`)
          continue
        }
      }
    }

    filtered.push(lead)
  }

  return filtered
}

/**
 * Save qualified leads to Airtable.
 */
async function saveLeadsToQueue(leads) {
  if (!airtableBase) {
    console.log(`[lead_gen] Simulated: Queued ${leads.length} leads`)
    return leads.map((l, i) => ({ ...l, id: `mock_lead_${i}`, sequence_day: 0, last_contact: null }))
  }

  const saved = []
  for (const lead of leads) {
    try {
      const record = await airtableBase('Leads').create({
        'Company Name': lead.company_name,
        'Type': lead.type === 'carrier' ? 'Carrier' : 'Shipper',
        'MC Number': lead.mc_number || '',
        'Home State': lead.home_state || '',
        'Source': lead.source,
        'Sequence Day': 0,
        'Status': 'QUEUED',
        'Date Added': new Date().toISOString().split('T')[0]
      })
      saved.push({ ...lead, id: record.id })
    } catch (err) {
      console.error(`[lead_gen] Failed to save lead ${lead.company_name}:`, err.message)
    }
  }

  return saved
}

// ─── Outreach Sequence ────────────────────────────────────────────────────────

/**
 * Get all leads that are due for their next email today.
 */
async function getLeadsDueForOutreach() {
  if (!airtableBase) {
    console.log('[lead_gen] Simulated outreach queue check')
    return []
  }

  try {
    const records = await airtableBase('Leads').select({
      filterByFormula: "AND({Status} = 'QUEUED', {Sequence Day} < 14)",
      fields: ['Company Name', 'Type', 'Email', 'Contact Name', 'MC Number', 'Sequence Day', 'Last Contact Date', 'Home State']
    }).all()

    const today = new Date()
    const due = []

    for (const r of records) {
      const sequenceDay = r.get('Sequence Day') || 0
      const lastContact = r.get('Last Contact Date')

      if (!lastContact && sequenceDay === 0) {
        // Never contacted — send Email 1
        due.push({ id: r.id, company_name: r.get('Company Name'), type: r.get('Type'), email: r.get('Email'), contact_name: r.get('Contact Name'), mc_number: r.get('MC Number'), home_state: r.get('Home State'), next_email: 'email1' })
        continue
      }

      if (lastContact) {
        const daysSince = (today - new Date(lastContact)) / (1000 * 60 * 60 * 24)
        if (sequenceDay === 1 && daysSince >= 4) due.push({ ...r.fields, id: r.id, next_email: 'email2' })
        else if (sequenceDay === 2 && daysSince >= 4) due.push({ ...r.fields, id: r.id, next_email: 'email3' })
        else if (sequenceDay === 3 && daysSince >= 6) due.push({ ...r.fields, id: r.id, next_email: 'email4' })
      }
    }

    return due
  } catch (err) {
    console.error('[lead_gen] Failed to load outreach queue:', err.message)
    return []
  }
}

async function sendEmail(to, emailContent, leadName) {
  // TODO: Replace with actual email provider (SendGrid, Resend, etc.)
  console.log(`[lead_gen] EMAIL → ${to || leadName}`)
  console.log(`  Subject: ${emailContent.subject}`)
  console.log(`  Preview: ${emailContent.body.slice(0, 80)}...`)
  return { sent: true, timestamp: new Date().toISOString() }
}

// ─── Main Exports ─────────────────────────────────────────────────────────────

/**
 * Find new leads from FMCSA API (carriers) and Google Maps (shippers).
 * Filters duplicates and quality failures, then saves to Airtable queue.
 *
 * @param {object} [options]
 * @param {string[]} [options.states] - Target states for carrier search
 * @param {string[]} [options.searchTerms] - Google Maps search terms for shippers
 * @param {number} [options.limit] - Max leads per source
 * @param {'carriers'|'shippers'|'both'} [options.type] - Which type to find
 */
export async function findLeads(options = {}) {
  const { states = TARGET_STATES, searchTerms = MEDICAL_SHIPPER_TYPES, limit = 20, type = 'both' } = options

  console.log(`[lead_gen] Starting lead discovery — type: ${type}`)
  const allLeads = []

  if (type === 'carriers' || type === 'both') {
    const carrierLeads = await findCarrierLeads(states, limit)
    console.log(`[lead_gen] Found ${carrierLeads.length} raw carrier leads`)
    allLeads.push(...carrierLeads)
  }

  if (type === 'shippers' || type === 'both') {
    const shipperLeads = await findShipperLeads(searchTerms, limit)
    console.log(`[lead_gen] Found ${shipperLeads.length} raw shipper leads`)
    allLeads.push(...shipperLeads)
  }

  // Filter duplicates and quality failures
  const filteredLeads = await filterLeads(allLeads)
  console.log(`[lead_gen] ${filteredLeads.length} leads passed filters (from ${allLeads.length} raw)`)

  // Save to queue
  const savedLeads = await saveLeadsToQueue(filteredLeads)

  // Log to Decision Engine
  await logDecision({
    agent: 'workflow/lead_gen_outreach',
    situation_type: 'lead_discovery',
    inputs: { type, raw_count: allLeads.length, filtered_count: filteredLeads.length },
    recommendation: `Found and queued ${savedLeads.length} new leads`,
    owner_decision: 'AUTO_QUEUED',
    confidence_before: 0.9
  })

  return {
    found: allLeads.length,
    qualified: filteredLeads.length,
    queued: savedLeads.length,
    leads: savedLeads
  }
}

/**
 * Process all leads due for outreach today.
 * Sends the appropriate email in their sequence.
 * Respects the 50 emails/day limit.
 */
export async function runOutreachSequence() {
  console.log('[lead_gen] Running outreach sequence')
  const MAX_EMAILS_PER_DAY = parseInt(process.env.MAX_OUTREACH_PER_DAY || '50')
  const dueleads = await getLeadsDueForOutreach()

  console.log(`[lead_gen] ${dueleads.length} leads due for outreach today`)

  let sent = 0
  const results = []

  for (const lead of dueleads) {
    if (sent >= MAX_EMAILS_PER_DAY) {
      console.log(`[lead_gen] Daily limit reached (${MAX_EMAILS_PER_DAY}). Remaining leads deferred.`)
      break
    }

    // Check memory — last contact time (respect 48hr rule)
    const lastOutreach = await memory.recall(`outreach_${lead.mc_number || lead.company_name}`, 1)
    if (lastOutreach.length > 0) {
      const lastTime = new Date(lastOutreach[0].timestamp)
      const hoursSince = (Date.now() - lastTime) / (1000 * 60 * 60)
      if (hoursSince < 48) {
        console.log(`[lead_gen] Skip — contacted ${Math.round(hoursSince)}h ago: ${lead.company_name}`)
        continue
      }
    }

    // Select email template
    const isCarrier = lead.type === 'Carrier' || lead.type === 'carrier'
    const templates = isCarrier ? CARRIER_EMAILS : SHIPPER_EMAILS
    const template = templates[lead.next_email]

    if (!template) {
      console.warn(`[lead_gen] No template for ${lead.next_email}`)
      continue
    }

    const emailContent = template(lead)
    const emailResult = await sendEmail(lead.email, emailContent, lead.company_name)

    if (emailResult.sent) {
      sent++

      // Remember this outreach
      await memory.remember({
        key: `outreach_${lead.mc_number || lead.company_name}`,
        value: `Sent ${lead.next_email} on ${new Date().toDateString()}`,
        source: lead.id,
        importance: 2
      })

      results.push({ lead: lead.company_name, email: lead.next_email, sent: true })
    }
  }

  console.log(`[lead_gen] Outreach sequence complete — sent ${sent} emails`)

  // Notify Maya if we sent emails (Tier 1 — morning report)
  if (sent > 0) {
    await evaluateEscalation({
      type: 'outreach_batch_sent',
      agent: 'workflow/lead_gen_outreach',
      data: { emails_sent: sent, total_in_queue: dueleads.length },
      ref_id: 'daily_outreach'
    })
  }

  return { sent, total_due: dueleads.length, results }
}

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv.includes('--find')) {
  console.log('Finding new leads...')
  const result = await findLeads({ type: 'both', limit: 10 })
  console.log('\nLead discovery result:', JSON.stringify(result, null, 2))
}

if (process.argv.includes('--outreach')) {
  console.log('Running outreach sequence...')
  const result = await runOutreachSequence()
  console.log('\nOutreach result:', JSON.stringify(result, null, 2))
}
