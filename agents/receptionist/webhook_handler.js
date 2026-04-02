/**
 * Receptionist Webhook Handler — Express server for Retell AI events
 *
 * Handles all Retell AI webhook events and custom function calls.
 * Runs as a web server that Retell sends data to after each call.
 */

import 'dotenv/config'
import express from 'express'
import { AgentMemory } from '../../shared/memory.js'
import { evaluateEscalation } from '../maya/maya.js'

const app = express()
app.use(express.json())

const memory = new AgentMemory('Receptionist')

// ─── Retell Webhook Events ────────────────────────────────────────────────────

app.post('/webhooks/retell', async (req, res) => {
  const { event, call } = req.body
  res.sendStatus(200) // Always respond quickly to Retell

  if (!call) return

  switch (event) {
    case 'call_started':
      console.log(`[Receptionist] Call started: ${call.call_id}`)
      await memory.remember({
        key: 'call_started',
        value: `Inbound call from ${call.from_number || 'unknown'} at ${new Date().toISOString()}`,
        source: call.call_id,
        importance: 1
      })
      break

    case 'call_ended':
      console.log(`[Receptionist] Call ended: ${call.call_id} | Duration: ${call.duration_ms}ms`)
      await handleCallEnded(call)
      break

    case 'call_analyzed':
      await handleCallAnalyzed(call)
      break
  }
})

// ─── Custom Function Endpoints ────────────────────────────────────────────────

// Calendly booking
app.post('/functions/book-calendly', async (req, res) => {
  const { caller_name, caller_email, caller_phone, call_type, notes } = req.body

  try {
    // If Calendly API key is configured, create real booking
    if (process.env.CALENDLY_API_KEY && process.env.CALENDLY_EVENT_TYPE_UUID) {
      const response = await fetch('https://api.calendly.com/scheduling_links', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CALENDLY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          max_event_count: 1,
          owner: `https://api.calendly.com/event_types/${process.env.CALENDLY_EVENT_TYPE_UUID}`,
          owner_type: 'EventType'
        })
      })
      const data = await response.json()

      await memory.remember({
        key: 'calendly_booking',
        value: `Booked ${call_type} call for ${caller_name} (${caller_email}). Link: ${data.resource?.booking_url}`,
        source: caller_phone,
        importance: 3
      })

      res.json({ booked: true, booking_url: data.resource?.booking_url, message: `Your call has been booked. You'll receive a confirmation at ${caller_email}.` })
    } else {
      // Fallback: just log it
      console.log(`[Receptionist] Calendly booking requested: ${caller_name} | ${call_type} | ${caller_email}`)
      res.json({ booked: true, message: 'Your request has been logged. We will reach out within 2 hours to confirm your appointment.' })
    }
  } catch (err) {
    console.error('[Receptionist] Calendly booking failed:', err.message)
    res.json({ booked: false, message: 'We had a technical issue. Someone will call you back to book your appointment.' })
  }
})

// Maya escalation
app.post('/functions/escalate', async (req, res) => {
  const { caller_name, caller_phone, urgency_reason, issue_description } = req.body

  await evaluateEscalation({
    type: 'receptionist_urgent_call',
    agent: 'Receptionist',
    data: { caller_name, caller_phone, urgency_reason, issue_description },
    ref_id: caller_phone
  })

  res.json({ escalated: true, message: 'I have flagged this as urgent. Someone will call you back within 15 minutes.' })
})

// Create Airtable lead
app.post('/functions/create-lead', async (req, res) => {
  const leadData = req.body

  try {
    if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
      const tableName = leadData.lead_type === 'carrier'
        ? process.env.AIRTABLE_CARRIERS_TABLE
        : process.env.AIRTABLE_CLIENTS_TABLE

      const airtableBody = {
        fields: {
          'Name': leadData.contact_name,
          'Company': leadData.company_name,
          'Email': leadData.email,
          'Phone': leadData.phone,
          'Source': 'Receptionist Call',
          'Status': 'New Lead',
          'Notes': leadData.load_details || '',
          ...(leadData.mc_number && { 'MC Number': leadData.mc_number }),
          ...(leadData.truck_count && { 'Truck Count': leadData.truck_count }),
          ...(leadData.interested_in_trial && { 'Interested in Trial': true })
        }
      }

      await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(airtableBody)
      })
    }

    await memory.remember({
      key: `lead_created_${leadData.lead_type}`,
      value: `${leadData.lead_type} lead created: ${leadData.contact_name} at ${leadData.company_name}`,
      source: leadData.phone,
      importance: 3
    })

    res.json({ created: true })
  } catch (err) {
    console.error('[Receptionist] Lead creation failed:', err.message)
    res.json({ created: false })
  }
})

// ─── Internal Handlers ────────────────────────────────────────────────────────

async function handleCallEnded(call) {
  await memory.remember({
    key: 'call_completed',
    value: `Call ${call.call_id} ended. Duration: ${Math.round((call.duration_ms || 0) / 1000)}s. Disposition: ${call.call_analysis?.call_successful ? 'successful' : 'unclear'}`,
    source: call.call_id,
    importance: 2
  })
}

async function handleCallAnalyzed(call) {
  const analysis = call.call_analysis
  if (!analysis) return

  const transcript = call.transcript || ''
  const transcriptLower = transcript.toLowerCase()

  // HARD ESCALATION — legal/safety trigger words
  // If ANY of these appear, immediately escalate to Maya → owner. No exceptions.
  const legalTriggers = ['lawsuit', 'attorney', 'lawyer', 'sue', 'legal action', 'dot audit', 'accident', 'injury', 'fatality', 'attorney general', 'litigation', 'claim against']
  const legalHit = legalTriggers.find(k => transcriptLower.includes(k))

  if (legalHit) {
    await evaluateEscalation({
      type: 'legal_threat_on_call',
      agent: 'Receptionist',
      data: {
        call_id: call.call_id,
        trigger_word: legalHit,
        transcript_summary: analysis.call_summary,
        caller_number: call.from_number
      },
      ref_id: call.call_id
    })
    // Do NOT continue processing — this is Tier 3, owner must handle
    return
  }

  // Standard urgent flag
  const urgentKeywords = ['emergency', 'urgent', 'surgery', 'patient', 'critical', 'tonight']
  const isUrgent = urgentKeywords.some(k => transcriptLower.includes(k))

  if (isUrgent) {
    await evaluateEscalation({
      type: 'receptionist_urgent_call',
      agent: 'Receptionist',
      data: { call_id: call.call_id, transcript_summary: analysis.call_summary },
      ref_id: call.call_id
    })
  }
}

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`[Receptionist] Webhook server running on port ${PORT}`)
  console.log(`[Receptionist] Retell events: POST /webhooks/retell`)
})

export default app
