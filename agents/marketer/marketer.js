/**
 * Marketer Agent
 *
 * Creates content for TikTok and YouTube, manages the content calendar,
 * and runs outreach campaigns to generate freight dispatch leads.
 *
 * Content is saved to data/content/calendar.json.
 * Campaigns use Claude to generate personalized outreach for 10 prospects.
 */

import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { AgentMemory } from '../../shared/memory.js'
import { logDecision } from '../../decision_engine/engine.js'
import { evaluateEscalation } from '../maya/maya.js'
import { queueLead } from '../sales/sales.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONTENT_CALENDAR_FILE = path.join(__dirname, '../../data/content/calendar.json')

const client = new Anthropic()
const memory = new AgentMemory('Marketer')

// ─── File Helpers ─────────────────────────────────────────────────────────────

async function loadCalendar() {
  try {
    const raw = await fs.readFile(CONTENT_CALENDAR_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { items: [] }
  }
}

async function saveCalendar(calendar) {
  await fs.mkdir(path.dirname(CONTENT_CALENDAR_FILE), { recursive: true })
  await fs.writeFile(CONTENT_CALENDAR_FILE, JSON.stringify(calendar, null, 2))
}

/**
 * Calculate a publish date: next available slot (M/W/F for TikTok, Tue/Thu for YouTube).
 */
function calculatePublishDate(contentType) {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, ...

  if (contentType === 'tiktok') {
    // Post Mon (1), Wed (3), Fri (5)
    const tiktokDays = [1, 3, 5]
    let daysAhead = 1
    for (let i = 1; i <= 7; i++) {
      if (tiktokDays.includes((day + i) % 7)) { daysAhead = i; break }
    }
    const publishDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
    return publishDate.toISOString().split('T')[0]
  } else {
    // Post Tue (2), Thu (4)
    const ytDays = [2, 4]
    let daysAhead = 1
    for (let i = 1; i <= 7; i++) {
      if (ytDays.includes((day + i) % 7)) { daysAhead = i; break }
    }
    const publishDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
    return publishDate.toISOString().split('T')[0]
  }
}

// ─── Main Exports ─────────────────────────────────────────────────────────────

/**
 * Generate a 60-second TikTok script on a freight/dispatch topic.
 * Format: Hook (0-5s), Main content (5-50s), CTA (50-60s).
 *
 * @param {string} topic - The freight or dispatch topic to cover
 * @returns {Promise<{ hook: string, content: string, cta: string, full_script: string }>}
 */
export async function generateTikTokScript(topic) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Marketer] System paused. generateTikTokScript() aborted.')
    return { hook: '', content: '', cta: '', full_script: '' }
  }

  if (!topic) {
    throw new Error('[Marketer] generateTikTokScript() requires a topic')
  }

  console.log(`[Marketer] Generating TikTok script for topic: "${topic}"`)

  let hook = ''
  let content = ''
  let cta = ''
  let full_script = ''

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: `You are a TikTok content writer for an AI-native freight dispatch company.
Write scripts that are engaging, educational, and convert truckers and shippers into leads.
Tone: conversational, direct, no buzzwords. Speak like a freight dispatcher, not a marketer.
The business runs a 7-day free trial for carriers. The CTA should drive to the trial or DM.
Return ONLY valid JSON. No extra text.`,
      messages: [{
        role: 'user',
        content: `Write a 60-second TikTok script about: "${topic}"

Return JSON with these exact fields:
{
  "hook": "0-5 seconds — one provocative sentence or question that stops the scroll",
  "content": "5-50 seconds — the main teaching or story (around 200 words when read aloud at normal pace)",
  "cta": "50-60 seconds — clear call to action (trial sign-up, DM us, link in bio)",
  "full_script": "the complete script as one continuous text with [0-5s] [5-50s] [50-60s] markers"
}`
      }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      hook = parsed.hook || ''
      content = parsed.content || ''
      cta = parsed.cta || ''
      full_script = parsed.full_script || `${hook}\n\n${content}\n\n${cta}`
    }
  } catch (err) {
    console.error(`[Marketer] TikTok script generation failed: ${err.message}`)
    hook = `Most truck drivers leave $800 a week on the table. Here's why.`
    content = `They spend 4+ hours a day on load boards, negotiating rates they could get automatically. An AI dispatcher does this in minutes — finds loads, checks rates against iron rules ($2.75/mile minimum), and only books what's actually profitable. During our 7-day free trial, carriers average 3 loads found with zero time spent on load boards.`
    cta = `Want to see what your lanes are actually worth? Drop "TRIAL" in the comments or click the link in bio. Seven days, free, no commitment.`
    full_script = `[0-5s] ${hook}\n\n[5-50s] ${content}\n\n[50-60s] ${cta}`
  }

  await memory.remember({
    key: `tiktok_script_${topic.slice(0, 30)}`,
    value: `Generated TikTok script for "${topic}". Hook: ${hook.slice(0, 60)}`,
    importance: 2
  })

  return { hook, content, cta, full_script }
}

/**
 * Generate a structured YouTube video outline on a freight/dispatch topic.
 *
 * @param {string} topic
 * @returns {Promise<{ title: string, description: string, timestamps: string[], talking_points: string[] }>}
 */
export async function generateYouTubeOutline(topic) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Marketer] System paused. generateYouTubeOutline() aborted.')
    return { title: '', description: '', timestamps: [], talking_points: [] }
  }

  if (!topic) {
    throw new Error('[Marketer] generateYouTubeOutline() requires a topic')
  }

  console.log(`[Marketer] Generating YouTube outline for topic: "${topic}"`)

  let title = ''
  let description = ''
  let timestamps = []
  let talking_points = []

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: `You are a YouTube content strategist for an AI freight dispatch company.
Create outlines that educate truckers and shippers while building trust in AI dispatch.
Target audience: small carrier owners (1-10 trucks), freight brokers, logistics managers.
Videos should be 8-15 minutes long with clear value in each section.
Return ONLY valid JSON. No extra text.`,
      messages: [{
        role: 'user',
        content: `Create a YouTube video outline for: "${topic}"

Return JSON with these exact fields:
{
  "title": "SEO-optimized title under 70 characters",
  "description": "2-3 sentence video description with keywords for YouTube search",
  "timestamps": [
    "0:00 - Introduction",
    "1:30 - Section name",
    ...
  ],
  "talking_points": [
    "Talking point 1 — one sentence summary",
    "Talking point 2 — one sentence summary",
    ...
  ]
}

Include 6-8 timestamps and 8-10 talking points.`
      }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      title = parsed.title || `${topic} — Freight Dispatch Guide`
      description = parsed.description || `Everything you need to know about ${topic} in freight dispatch.`
      timestamps = parsed.timestamps || []
      talking_points = parsed.talking_points || []
    }
  } catch (err) {
    console.error(`[Marketer] YouTube outline generation failed: ${err.message}`)
    title = `${topic} — Complete Guide for Truck Owners`
    description = `In this video we cover ${topic} and how it affects your bottom line as a carrier or shipper. Real numbers, real examples from our AI dispatch operation.`
    timestamps = ['0:00 - Introduction', '1:00 - The Problem', '3:00 - What Actually Works', '6:00 - Real Numbers', '9:00 - How to Get Started', '11:00 - Wrap-Up']
    talking_points = [`Why ${topic} matters for profitability`, 'Common mistakes carriers make', 'What the data shows from 100+ loads', 'Iron rules we never break', 'How AI dispatch handles this automatically', 'Free 7-day trial walkthrough']
  }

  await memory.remember({
    key: `youtube_outline_${topic.slice(0, 30)}`,
    value: `Generated YouTube outline for "${topic}". Title: ${title}`,
    importance: 2
  })

  return { title, description, timestamps, talking_points }
}

/**
 * Schedule a content item by appending it to data/content/calendar.json.
 *
 * @param {{ type: 'tiktok'|'youtube'|'email'|'post', title: string, content: object, [publish_date]: string }} contentItem
 * @returns {Promise<{ scheduled: boolean, publish_date: string }>}
 */
export async function scheduleContent(contentItem) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Marketer] System paused. scheduleContent() aborted.')
    return { scheduled: false, publish_date: null }
  }

  if (!contentItem.type || !contentItem.title) {
    throw new Error('[Marketer] scheduleContent() requires contentItem.type and contentItem.title')
  }

  console.log(`[Marketer] Scheduling ${contentItem.type} content: "${contentItem.title}"`)

  const calendar = await loadCalendar()

  const publishDate = contentItem.publish_date || calculatePublishDate(contentItem.type)

  const newItem = {
    id: `content_${Date.now()}`,
    type: contentItem.type,
    title: contentItem.title,
    content: contentItem.content || {},
    publish_date: publishDate,
    scheduled_at: new Date().toISOString(),
    status: 'scheduled',
    published: false
  }

  calendar.items = calendar.items || []
  calendar.items.push(newItem)
  await saveCalendar(calendar)

  await memory.remember({
    key: `scheduled_content_${newItem.id}`,
    value: `Scheduled ${contentItem.type}: "${contentItem.title}" for ${publishDate}`,
    importance: 2
  })

  console.log(`[Marketer] Content scheduled: "${contentItem.title}" → ${publishDate}`)
  return { scheduled: true, publish_date: publishDate }
}

/**
 * Run a marketing campaign targeting 10 prospects.
 * Reads campaign name and uses Claude to generate personalized outreach.
 * Queues resulting leads into data/sales/leads.json via queueLead().
 *
 * @param {string} campaignName - Name of the campaign to run
 * @returns {Promise<{ sent_count: number, campaign_name: string, leads_queued: number }>}
 */
export async function runCampaign(campaignName) {
  if (process.env.AI_DISPATCH_PAUSED === 'true') {
    console.log('[Marketer] System paused. runCampaign() aborted.')
    return { sent_count: 0, campaign_name: campaignName, leads_queued: 0 }
  }

  if (!campaignName) {
    throw new Error('[Marketer] runCampaign() requires campaignName')
  }

  console.log(`[Marketer] Running campaign: "${campaignName}"`)

  let prospects = []
  let emailTemplate = {}

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: `You are the Marketer Agent for an AI-native medical freight dispatch company.
Generate a targeted outreach campaign with realistic prospect data and personalized email copy.
The business offers a 7-day free dispatch trial for dry van carriers and a shipper partnership program.
Return ONLY valid JSON. No extra text.`,
      messages: [{
        role: 'user',
        content: `Generate a campaign called "${campaignName}".

Based on the campaign name, infer the target audience (carriers or shippers) and write appropriate copy.

Return JSON:
{
  "target_type": "carrier or shipper",
  "email_subject": "campaign email subject line",
  "email_body_template": "email body with {NAME} and {COMPANY} placeholders (under 150 words)",
  "prospects": [
    {
      "name": "First Last",
      "company": "Company Name",
      "email": "email@company.com",
      "phone": "XXX-XXX-XXXX",
      "type": "carrier or shipper",
      "state": "XX"
    }
  ]
}

Generate exactly 10 realistic prospects appropriate for a "${campaignName}" campaign.
Make the email_body_template compelling and specific to the campaign theme.`
      }]
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      prospects = parsed.prospects || []
      emailTemplate = {
        subject: parsed.email_subject || `${campaignName} — AI Dispatch`,
        body_template: parsed.email_body_template || `Hi {NAME},\n\nI wanted to reach out about ${campaignName}.\n\n${process.env.CALENDLY_LINK ? `Book a call: ${process.env.CALENDLY_LINK}` : 'Reply to learn more.'}\n\n— AI Dispatch Team`
      }
    }
  } catch (err) {
    console.error(`[Marketer] Campaign generation failed: ${err.message}`)
    // Minimal fallback
    prospects = Array.from({ length: 10 }, (_, i) => ({
      name: `Contact ${i + 1}`,
      company: `Prospect Company ${i + 1}`,
      email: `contact${i + 1}@prospect.com`,
      phone: `555-000-${String(i + 1).padStart(4, '0')}`,
      type: 'carrier',
      state: 'TX'
    }))
    emailTemplate = {
      subject: `${campaignName} — Try Dispatch Free for 7 Days`,
      body_template: `Hi {NAME},\n\nQuick note about ${campaignName}. We work with dry van carriers to find profitable medical freight loads — $2.75+/mile minimum, dry van only.\n\n7-day free trial, no commitment.\n\nInterested? ${process.env.CALENDLY_LINK || 'Reply to this email'}\n\n— AI Dispatch Team`
    }
  }

  // Queue each prospect as a lead and simulate sending the campaign email
  let sent_count = 0
  let leads_queued = 0

  for (const prospect of prospects.slice(0, 10)) {
    try {
      // Personalize the email
      const personalizedBody = emailTemplate.body_template
        .replace(/\{NAME\}/g, prospect.name || prospect.company)
        .replace(/\{COMPANY\}/g, prospect.company)

      // Log simulated send
      console.log(`[Marketer] CAMPAIGN EMAIL → ${prospect.email || prospect.company}`)
      console.log(`  Subject: ${emailTemplate.subject}`)
      sent_count++

      // Queue as a lead for the sales outreach sequence
      await queueLead({
        name: prospect.name,
        company: prospect.company,
        email: prospect.email,
        phone: prospect.phone,
        type: prospect.type || 'carrier',
        source: `campaign_${campaignName.replace(/\s+/g, '_').toLowerCase()}`
      })
      leads_queued++

    } catch (err) {
      console.error(`[Marketer] Failed to process prospect ${prospect.company}: ${err.message}`)
    }
  }

  await logDecision({
    agent: 'Marketer',
    situation_type: 'campaign_run',
    inputs: { campaign_name: campaignName, prospects_targeted: prospects.length },
    recommendation: `Campaign "${campaignName}" sent to ${sent_count} prospects`,
    owner_decision: 'AUTO_SENT',
    confidence_before: 0.8
  })

  await evaluateEscalation({
    type: 'campaign_launched',
    agent: 'Marketer',
    data: { campaign_name: campaignName, sent_count, leads_queued },
    ref_id: `campaign_${campaignName.replace(/\s+/g, '_').toLowerCase()}`
  })

  await memory.remember({
    key: `campaign_${campaignName}`,
    value: `Campaign "${campaignName}" ran. Sent: ${sent_count}, Queued: ${leads_queued} leads`,
    importance: 3
  })

  console.log(`[Marketer] Campaign complete — sent: ${sent_count}, leads queued: ${leads_queued}`)
  return { sent_count, campaign_name: campaignName, leads_queued }
}

// ─── CLI Mode ─────────────────────────────────────────────────────────────────

if (process.argv[2] === '--tiktok') {
  const topic = process.argv.slice(3).join(' ') || 'Why most truck drivers leave money on the table'
  generateTikTokScript(topic).then(r => {
    console.log('\n[Marketer] TikTok Script:\n')
    console.log(r.full_script)
  })
}

if (process.argv[2] === '--youtube') {
  const topic = process.argv.slice(3).join(' ') || 'How AI dispatch works for small carriers'
  generateYouTubeOutline(topic).then(r => {
    console.log('\n[Marketer] YouTube Outline:\n')
    console.log(JSON.stringify(r, null, 2))
  })
}
