/**
 * AI Dispatch — Synthetic Training Data Seeder
 * Seeds Decision Engine + Agent Memory with realistic scenarios from SOPs
 * so CEO Shadow has patterns to learn from on day one.
 *
 * Run: node scripts/seed-training-data.js
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DECISIONS_FILE = path.join(ROOT, 'data/decisions/decisions.json')
const LIBRARY_FILE = path.join(ROOT, 'data/sops/library.json')

// ── SYNTHETIC DECISIONS ───────────────────────────────────────────────────────
// Each one maps to a real scenario from the SOPs.
// All have outcomes set so confidence scores actually improve.

const SYNTHETIC_DECISIONS = [

  // ── ERIN: Load Evaluation ─────────────────────────────────────────────────

  { agent:'Erin', situation_type:'iron_rule_trigger',
    inputs:{ rpm:2.48, origin:'Chicago, IL', destination:'Nashville, TN', loaded_miles:470, rule:'RPM below $2.51 floor' },
    recommendation:'REJECT — Iron Rule 2 violation. RPM $2.48 < $2.51 minimum.',
    owner_decision:'ACCEPT', outcome:'Correct rejection. Shipper never called back — load was a trap rate.',
    lesson:'Always reject below $2.51. No exceptions. Even Chicago→Nashville which is a good lane.',
    confidence_before:0.99, confidence_after:0.99, autonomous_eligible:true },

  { agent:'Erin', situation_type:'iron_rule_trigger',
    inputs:{ origin:'Orlando, FL', destination:'Atlanta, GA', rpm:3.10, rule:'Florida origin' },
    recommendation:'REJECT — Iron Rule 1. Florida origin. Do not calculate profit.',
    owner_decision:'ACCEPT', outcome:'Correct. Florida is permanently excluded.',
    lesson:'Reject Florida immediately. Do not run profit formula. Do not check carrier.',
    confidence_before:0.99, confidence_after:0.99, autonomous_eligible:true },

  { agent:'Erin', situation_type:'load_evaluation',
    inputs:{ origin:'Chicago, IL', destination:'Nashville, TN', loaded_miles:470, deadhead_miles:38, rpm:2.75, revenue:1292.50, cost:863.60, profit:428.90, profit_pct:33.2 },
    recommendation:'ACCEPT — Profit 33.2%. Excellent. Book it.',
    owner_decision:'ACCEPT', outcome:'Load delivered on time. Carrier paid. $428 profit realized.',
    lesson:'Chicago→Nashville at $2.75/mi with <40mi deadhead is a reliable profitable lane.',
    confidence_before:0.92, confidence_after:0.97, autonomous_eligible:true },

  { agent:'Erin', situation_type:'iron_rule_trigger',
    inputs:{ carrier_dot:'DOT-8821334', deadhead_miles:62, loaded_miles:280, max_allowed:50, rule:'Deadhead exceeds 50mi hard cap' },
    recommendation:'REJECT carrier match — deadhead 62mi exceeds 50mi hard cap. Seek next carrier.',
    owner_decision:'ACCEPT', outcome:'Found closer carrier at 31mi deadhead. Load booked profitably.',
    lesson:'Never expand deadhead. Always find a closer carrier instead.',
    confidence_before:0.97, confidence_after:0.98, autonomous_eligible:true },

  { agent:'Erin', situation_type:'iron_rule_trigger',
    inputs:{ weight_lbs:48200, max_allowed:48000, rule:'Cargo weight exceeds 48,000 lb limit' },
    recommendation:'REJECT — Iron Rule 4. 48,200 lbs exceeds 48,000 lb maximum.',
    owner_decision:'ACCEPT', outcome:'Correct. Checked next carrier — load was within limits on alternate equipment.',
    lesson:'200 lbs over is still over. Weight rule is absolute.',
    confidence_before:0.98, confidence_after:0.99, autonomous_eligible:true },

  { agent:'Erin', situation_type:'load_evaluation',
    inputs:{ origin:'Dallas, TX', destination:'Memphis, TN', loaded_miles:470, deadhead_miles:22, rpm:3.15, profit_pct:38.7 },
    recommendation:'ACCEPT — Priority load. RPM $3.15 exceeds $3.00 priority threshold. Profit 38.7%.',
    owner_decision:'ACCEPT', outcome:'Delivered. $512 profit. Broker booked us again same week.',
    lesson:'Dallas→Memphis at $3.00+ is a priority lane. Always chase it.',
    confidence_before:0.94, confidence_after:0.97, autonomous_eligible:true },

  { agent:'Erin', situation_type:'load_evaluation',
    inputs:{ origin:'Atlanta, GA', destination:'Charlotte, NC', loaded_miles:245, deadhead_miles:55, rpm:2.80, note:'Deadhead 55mi exceeds 50mi hard cap' },
    recommendation:'REJECT — deadhead 55mi violates Iron Rule 3 hard cap of 50mi.',
    owner_decision:'ACCEPT', outcome:'Correct rejection. Load went to another broker at lower rate anyway.',
    lesson:'Even good RPM does not override deadhead rule.',
    confidence_before:0.96, confidence_after:0.98, autonomous_eligible:true },

  { agent:'Erin', situation_type:'carrier_selection',
    inputs:{ two_loads_available:true, load_a:{ rpm:2.75, profit:428 }, load_b:{ rpm:3.10, profit:612 }, carriers_available:1 },
    recommendation:'Assign carrier to Load B ($3.10 RPM, $612 profit). Hold Load A while searching pool.',
    owner_decision:'ACCEPT', outcome:'Load B booked. Load A filled by second carrier found 20min later.',
    lesson:'Always assign one carrier to highest-profit load first. Keep searching for Load A.',
    confidence_before:0.88, confidence_after:0.93, autonomous_eligible:true },

  { agent:'Erin', situation_type:'load_evaluation',
    inputs:{ profit:-45, origin:'Phoenix, AZ', destination:'Denver, CO', rpm:2.53, deadhead_miles:49, loaded_miles:600 },
    recommendation:'REJECT — negative profit (-$45). Do not book. Escalate to Maya as Tier 2.',
    owner_decision:'ACCEPT', outcome:'Correct. Negative profit loads destroy margin.',
    lesson:'Never book a negative-profit load regardless of RPM or relationship.',
    confidence_before:0.95, confidence_after:0.99, autonomous_eligible:true },

  { agent:'Erin', situation_type:'iron_rule_trigger',
    inputs:{ carrier_authority_days:155, minimum_required:180, carrier_dot:'DOT-9912844' },
    recommendation:'REJECT carrier — authority age 155 days, 25 days short of 180-day minimum.',
    owner_decision:'ACCEPT', outcome:'Correct. Flagged for re-check at 180-day mark in 25 days.',
    lesson:'New authority = higher risk. 180-day rule is firm.',
    confidence_before:0.97, confidence_after:0.99, autonomous_eligible:true },

  // ── COMPLIANCE: Carrier Vetting ───────────────────────────────────────────

  { agent:'Compliance', situation_type:'carrier_vetting',
    inputs:{ carrier:'ABC Trucking LLC', authority_days:140, minimum:180, check:'authority_age' },
    recommendation:'INELIGIBLE — authority age 140 days. 40 days short. Eligible 2026-05-15.',
    owner_decision:'ACCEPT', outcome:'Correct. Carrier onboarded at 180-day mark with clean record.',
    lesson:'Log pending-eligibility carriers with exact re-check date.',
    confidence_before:0.99, confidence_after:0.99, autonomous_eligible:true },

  { agent:'Compliance', situation_type:'compliance_flag',
    inputs:{ carrier:'FastMove Inc', insurance_expiry_days:6, coverage:150000, minimum_coverage:100000 },
    recommendation:'TIER-2 ALERT — insurance expires in 6 days. Reduce load assignments. Contact carrier.',
    owner_decision:'ACCEPT', outcome:'Carrier renewed insurance on day 4. No dispatch gap.',
    lesson:'7-day warning works. Early alert gives carrier time to renew.',
    confidence_before:0.97, confidence_after:0.98, autonomous_eligible:true },

  { agent:'Compliance', situation_type:'compliance_flag',
    inputs:{ carrier:'QuickHaul LLC', safety_rating_old:'Unrated', safety_rating_new:'Conditional' },
    recommendation:'TIER-3 CRITICAL — safety rating changed to Conditional. Remove from dispatch pool immediately.',
    owner_decision:'ACCEPT', outcome:'Carrier removed. 2 active loads reassigned to compliant carriers within 1 hour.',
    lesson:'Conditional rating = immediate removal. No grace period.',
    confidence_before:0.99, confidence_after:0.99, autonomous_eligible:true },

  { agent:'Compliance', situation_type:'carrier_vetting',
    inputs:{ carrier:'Sunrise Transport', cargo_insurance:75000, minimum_required:100000 },
    recommendation:'INELIGIBLE — cargo insurance $75K below $100K minimum.',
    owner_decision:'ACCEPT', outcome:'Carrier updated policy to $150K. Re-applied and passed.',
    lesson:'Never waive minimum insurance. $75K leaves business exposed.',
    confidence_before:0.99, confidence_after:0.99, autonomous_eligible:true },

  { agent:'Compliance', situation_type:'carrier_vetting',
    inputs:{ carrier:'Midwest Dry Van LLC', authority_days:220, safety_rating:'Unrated', cargo_insurance:120000, liability:1200000, oos_orders:0 },
    recommendation:'ELIGIBLE — all 4 checks pass. Proceed to onboarding.',
    owner_decision:'ACCEPT', outcome:'Carrier onboarded. First load completed successfully.',
    lesson:'220-day authority + Unrated safety + clean record = strong candidate.',
    confidence_before:0.93, confidence_after:0.96, autonomous_eligible:true },

  // ── SALES: Outreach & Pipeline ────────────────────────────────────────────

  { agent:'Sales', situation_type:'lead_outreach_timing',
    inputs:{ lead:'Regional Medical Supply Co', email_step:2, reply:'Tell me more', lead_score:55 },
    recommendation:'Positive reply on Email 2. Book demo immediately. Respond within 2 hours.',
    owner_decision:'ACCEPT', outcome:'Demo booked. Converted to trial carrier within 2 weeks.',
    lesson:'Email 2 positive replies are hot. Drop everything and book same day.',
    confidence_before:0.91, confidence_after:0.96, autonomous_eligible:true },

  { agent:'Sales', situation_type:'lead_outreach_timing',
    inputs:{ lead:'Ontario Freight Solutions', location:'Canada', market:'canada', status:'not_operational' },
    recommendation:'TIER-2 ESCALATE — Canada lead. Market not yet operational. Log, do not sequence.',
    owner_decision:'ACCEPT', outcome:'Lead saved for Canada launch. Responded with launch notification promise.',
    lesson:'Never send USA sequence to Canada leads. Separate pipeline.',
    confidence_before:0.95, confidence_after:0.97, autonomous_eligible:true },

  { agent:'Sales', situation_type:'lead_outreach_timing',
    inputs:{ lead:'Apex Logistics Group', trucks:35, email_step:1, reply:'Tell me about your trial', lead_score:65 },
    recommendation:'HOT LEAD — 35 trucks, direct reply. Book discovery call with Onboarding immediately.',
    owner_decision:'ACCEPT', outcome:'Discovery call booked. 8 trucks enrolled in 7-day trial.',
    lesson:'35+ truck carriers are tier-1 priority. Route to Onboarding same day.',
    confidence_before:0.93, confidence_after:0.97, autonomous_eligible:true },

  { agent:'Sales', situation_type:'lead_outreach_timing',
    inputs:{ lead:'Johnson Medical Distribution', trucks:1200, employees:1200, distribution_centers:8, email_step:2 },
    recommendation:'TIER-2 ESCALATE — enterprise prospect. Pause sequence. Owner handles personally.',
    owner_decision:'ACCEPT', outcome:'Owner took the call. Enterprise contract in negotiation.',
    lesson:'Any prospect with 1000+ employees = stop sequence, escalate immediately.',
    confidence_before:0.94, confidence_after:0.97, autonomous_eligible:true },

  // ── ONBOARDING: Trial Conversion ──────────────────────────────────────────

  { agent:'Onboarding', situation_type:'trial_conversion',
    inputs:{ carrier:'Sunrise Logistics', trial_day:7, loads_completed:3, satisfaction:'positive', conversion_call:true },
    recommendation:'Convert to paid. 3 loads completed, positive feedback. Offer 8% commission (10% first 90 days) — no monthly fee.',
    owner_decision:'ACCEPT', outcome:'Signed same day. Became a regular 2-load/week carrier.',
    lesson:'Day 7 carriers who complete 3+ trial loads convert at 85%+ rate.',
    confidence_before:0.88, confidence_after:0.94, autonomous_eligible:true },

  { agent:'Onboarding', situation_type:'trial_conversion',
    inputs:{ carrier:'Blue Ridge Transport', trial_day:5, loads_completed:0, contact_attempts:3, response:'ghosting' },
    recommendation:'TIER-2 FLAG — carrier not engaging. 0 loads, 3 no-replies on Day 5. Escalate.',
    owner_decision:'ACCEPT', outcome:'Owner called directly. Carrier had a family emergency. Restarted trial.',
    lesson:'Non-engagement by Day 5 needs a direct owner call, not more automation.',
    confidence_before:0.82, confidence_after:0.89, autonomous_eligible:false },

  // ── MAYA: Escalation Routing ──────────────────────────────────────────────

  { agent:'Maya', situation_type:'escalation_routing',
    inputs:{ load_value:6200, threshold:5000, agent:'Erin', load_id:'LOAD_0142' },
    recommendation:'TIER-2 ESCALATE — load value $6,200 exceeds $5,000 threshold. Owner approval required.',
    owner_decision:'ACCEPT', outcome:'Owner approved. Load booked. $1,100 profit.',
    lesson:'$5K+ loads always escalate. Owner approves quickly when data is clean.',
    confidence_before:0.99, confidence_after:0.99, autonomous_eligible:true },

  { agent:'Maya', situation_type:'escalation_routing',
    inputs:{ event:'attorney_contact', caller:'Unknown attorney', agent:'Receptionist', load_id:null },
    recommendation:'TIER-3 BLOCK — legal contact. All outbound comms halted. Owner must respond.',
    owner_decision:'ACCEPT', outcome:'Owner called back. Was a wrong number. All clear.',
    lesson:'Attorney contact always TIER-3. Even false alarms are worth the caution.',
    confidence_before:0.99, confidence_after:0.99, autonomous_eligible:true },

  // ── CEO SHADOW: Pattern Learning ──────────────────────────────────────────

  { agent:'Shadow', situation_type:'escalation_routing',
    inputs:{ decisions_observed:11, pattern:'Owner approves all Erin Iron Rule rejections immediately', confidence_building:true },
    recommendation:'Pattern logged: Owner never overrides Iron Rule rejections. Auto-approve Iron Rule escalations.',
    owner_decision:'ACCEPT', outcome:'Pattern confirmed across 11 decisions.',
    lesson:'Iron Rule rejections have 100% owner agreement rate. Shadow can eventually auto-log these.',
    confidence_before:0.70, confidence_after:0.82, autonomous_eligible:false },
]

// ── SYNTHETIC AGENT MEMORIES ──────────────────────────────────────────────────

const AGENT_MEMORIES = {
  Erin: [
    { key:'profitable_lane', value:'Chicago→Nashville at $2.75+/mi with <40mi deadhead. Consistent broker relationship. Book on sight.', importance:5 },
    { key:'profitable_lane', value:'Dallas→Memphis at $3.00+/mi. Priority lane. Broker books us repeat.', importance:5 },
    { key:'iron_rule_pattern', value:'Florida loads always rejected at Rule 1. Do not calculate profit or check carrier — reject immediately.', importance:5 },
    { key:'carrier_pattern', value:'Carriers with <180-day authority are flagged for re-check at exact 180-day mark. Log date.', importance:4 },
    { key:'negotiation_pattern', value:'Brokers posting $2.48-$2.55 rarely come up to $2.75. Walk away rather than waste time.', importance:4 },
    { key:'dispatch_pattern', value:'Two loads, one carrier: always assign carrier to highest-profit load first. Search for second carrier simultaneously.', importance:4 },
  ],
  Maya: [
    { key:'escalation_pattern', value:'Owner approves Tier-2 load-value escalations within 5 minutes when data package is complete (load ID, route, profit, carrier).', importance:5 },
    { key:'escalation_pattern', value:'Attorney/legal contacts are always Tier-3. Owner responds within 15 minutes on average.', importance:5 },
    { key:'reporting_pattern', value:'Owner reads morning report between 6:05-6:20 AM. High-priority items should be first, not buried.', importance:4 },
    { key:'owner_preference', value:'Owner prefers Telegram over SMS for Tier-2. Uses SMS only for Tier-3.', importance:4 },
  ],
  Compliance: [
    { key:'vetting_pattern', value:'Carriers with SMS Unsafe Driving scores in Alert category — always escalate to Maya even if safety rating is Unrated.', importance:5 },
    { key:'vetting_pattern', value:'Authority briefly revoked and reinstated within 90 days = Tier-2 flag. Do not auto-approve even if currently Active.', importance:5 },
    { key:'insurance_pattern', value:'7-day insurance warning always prompts carrier renewal. 6/6 carriers renewed before expiry when notified.', importance:4 },
    { key:'compliance_pattern', value:'FMCSA SAFER system outages: always return HOLD to Erin. Never approve on last known status.', importance:5 },
  ],
  Sales: [
    { key:'conversion_pattern', value:'Email 2 positive replies ("tell me more") have 70%+ demo-to-trial conversion. Respond same day.', importance:5 },
    { key:'lead_pattern', value:'35+ truck carriers who reply to Email 1 are hot leads. Skip Email 2, go straight to discovery call.', importance:5 },
    { key:'pipeline_pattern', value:'Canada leads: never enter USA sequence. Log separately for Year 2 launch.', importance:4 },
    { key:'enterprise_pattern', value:'1000+ employee companies = pause all automation, escalate to owner. Standard sequence will not close them.', importance:5 },
    { key:'sequence_pattern', value:'Email 4 (breakup email) gets 15% reply rate. "Should I stop reaching out?" subject line has highest open rate.', importance:4 },
  ],
  Onboarding: [
    { key:'conversion_pattern', value:'Carriers who complete 3+ loads in 7-day trial convert to paid at 85%+ rate. Day 7 conversion call is formality.', importance:5 },
    { key:'engagement_pattern', value:'Zero contact by Day 5 = personal owner call needed. Automation alone does not recover ghosting carriers.', importance:4 },
    { key:'trial_pattern', value:'Best conversion window: Day 6 afternoon. Carrier has completed loads, confidence is high, commitment is fresh.', importance:4 },
  ],
  Receptionist: [
    { key:'caller_pattern', value:'FMCSA/DOT callers always give badge numbers. Collect full details, never confirm carrier relationships on the call.', importance:5 },
    { key:'caller_pattern', value:'Carriers asking about load availability at 11PM are planning next-day moves. Log for Erin morning review.', importance:3 },
    { key:'routing_pattern', value:'Callers who ask "is this the AI dispatching company" are usually media or competitors. Route to Sales, not Erin.', importance:4 },
  ],
  Shadow: [
    { key:'owner_pattern', value:'Owner approves all Iron Rule rejections without modification. 11/11 decisions confirmed. Confidence: 99%.', importance:5 },
    { key:'owner_pattern', value:'Owner responds to Tier-3 escalations in under 15 minutes during business hours. After hours: 45min average.', importance:4 },
    { key:'owner_pattern', value:'Owner never books negative-profit loads regardless of relationship. 0 exceptions observed.', importance:5 },
    { key:'phase_status', value:'Phase 1 (observe only). 23 decisions logged. Approaching Phase 2 threshold at 90 decisions.', importance:3 },
  ],
}

// ── SEEDER ────────────────────────────────────────────────────────────────────

async function seedTrainingData() {
  // Load existing decisions
  let decisions = []
  try {
    decisions = JSON.parse(await fs.readFile(DECISIONS_FILE, 'utf8'))
  } catch { decisions = [] }

  // Remove previously seeded synthetic decisions
  const real = decisions.filter(d => !d.synthetic)
  const removed = decisions.length - real.length
  if (removed > 0) console.log(`🧹 Removed ${removed} old synthetic decisions`)
  decisions = real

  // Build timestamps spread over last 90 days
  const now = Date.now()
  const day = 86400000

  let added = 0
  for (let i = 0; i < SYNTHETIC_DECISIONS.length; i++) {
    const d = SYNTHETIC_DECISIONS[i]
    const daysAgo = Math.floor((SYNTHETIC_DECISIONS.length - i) * 2.5) // spread over 90 days
    const ts = new Date(now - daysAgo * day).toISOString()
    const outcomeTs = new Date(now - (daysAgo - 1) * day).toISOString()
    const id = `dec_${String(decisions.length + 1).padStart(4, '0')}`

    decisions.push({
      id,
      timestamp: ts,
      agent: d.agent,
      context: 'USA',
      situation_type: d.situation_type,
      inputs: d.inputs,
      recommendation: d.recommendation,
      owner_decision: d.owner_decision,
      modification_notes: null,
      outcome: d.outcome,
      outcome_date: outcomeTs,
      lesson: d.lesson,
      confidence_before: d.confidence_before,
      confidence_after: d.confidence_after,
      autonomous_eligible: d.autonomous_eligible,
      synthetic: true,   // marks as seeded — easy to remove/replace
    })
    added++
  }

  await fs.writeFile(DECISIONS_FILE, JSON.stringify(decisions, null, 2))
  console.log(`✓ Decision Engine: ${added} synthetic decisions added (${decisions.length} total)`)

  // Count autonomous-eligible by agent
  const eligible = decisions.filter(d => d.autonomous_eligible)
  const byAgent = {}
  eligible.forEach(d => { byAgent[d.agent] = (byAgent[d.agent] || 0) + 1 })
  console.log(`\n  Autonomous-eligible decisions:`)
  Object.entries(byAgent).forEach(([agent, count]) => {
    console.log(`    ${agent.padEnd(12)} ${count} decisions`)
  })

  // Seed agent memories
  let library = {}
  try {
    library = JSON.parse(await fs.readFile(LIBRARY_FILE, 'utf8'))
  } catch { library = {} }
  if (!library.agent_memories) library.agent_memories = {}

  let memAdded = 0
  for (const [agentName, memories] of Object.entries(AGENT_MEMORIES)) {
    // Keep real memories, replace synthetic ones
    const existing = (library.agent_memories[agentName] || []).filter(m => !m.synthetic)
    const newMems = memories.map((m, i) => ({
      id: `mem_${agentName}_synthetic_${i}`,
      timestamp: new Date(now - (memories.length - i) * day * 3).toISOString(),
      key: m.key,
      value: m.value,
      source: 'seed-training-data',
      importance: m.importance,
      recall_count: Math.floor(Math.random() * 8) + 1,
      last_recalled: new Date(now - Math.floor(Math.random() * 5) * day).toISOString(),
      synthetic: true,
    }))
    library.agent_memories[agentName] = [...existing, ...newMems]
    memAdded += newMems.length
    console.log(`  ✓ ${agentName.padEnd(12)} ${newMems.length} memories seeded`)
  }

  await fs.writeFile(LIBRARY_FILE, JSON.stringify(library, null, 2))
  console.log(`\n✅ Agent Memory: ${memAdded} memories seeded across ${Object.keys(AGENT_MEMORIES).length} agents`)
  console.log(`\nRun 'npm run health' to see updated confidence scores.`)
}

seedTrainingData().catch(e => { console.error('Seed failed:', e.message); process.exit(1) })
