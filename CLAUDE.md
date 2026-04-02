# CLAUDE.md — AI Dispatch Operating System

This is Claude Code's operating manual for this repository. Read this before touching anything.

---

## What This Repo Is

**AI Dispatch** is a 1-person AI-native medical freight dispatch operating system. It runs 10 autonomous AI agents that handle all business operations: dispatching, compliance, sales, customer support, onboarding, content, and executive reporting. The owner only makes Tier 3 (high-stakes) decisions.

**Stack:** Node.js 20+, ESM modules (`import`/`export` only — no `require`), Anthropic Claude API, Airtable, Retell AI, Telegram, Twilio.

**Entry points:** `package.json` scripts are the canonical way to run anything.

---

## THE ONE NAMING RULE THAT OVERRIDES EVERYTHING

```
THE EXECUTIVE ASSISTANT AGENT IS NAMED MAYA.
THIS NAME DOES NOT CHANGE. EVER.
NOT IN CODE. NOT IN COMMENTS. NOT IN DOCS. NOT IN PROMPTS.
```

She was previously named Daniel. That name is gone. Zero references to Daniel exist in this repo (verified). If you see "Daniel" anywhere, replace it with "Maya" immediately before doing anything else.

**Do not rename Maya to:**
- Daniel (was the old name — permanently retired)
- Nova, Assistant, EA, Bot, or any generic name
- Anything else without explicit owner instruction in writing

---

## OWNER INSTRUCTION GUARDRAILS — READ BEFORE EVERY ACTION

```
WHEN THE OWNER SAYS "NEVER DO X" OR "DON'T DO X" — THAT IS A PERMANENT RULE.
NOT A SUGGESTION. NOT A PREFERENCE. A HARD BLOCK.
LOG IT. ENFORCE IT. NEVER DO IT.
```

**Active permanent prohibitions (owner-set):**
1. Never rename Maya to any other name
2. Never create an agent, file, or feature that manages a specific person's personal truck UNLESS explicitly approved by the owner. **Exception: Uncle Kenneth's truck is approved** — his carrier profile lives in `data/kenneth/`. Do not create any other personal truck space without explicit owner instruction.
3. Never create new agents without following the 6-step checklist in "How to Add a New Agent"
4. Never modify Iron Rule thresholds in code — they live in `.env` only
5. Never bypass the Tier system — all Tier 2+ actions must call `evaluateEscalation()` from maya.js
6. Never push to a branch other than `main` without explicit owner instruction

**If the owner says "never do X" about anything new during a session: add it to this list immediately.**

---

## What Was Removed — Do Not Recreate

**FamilyDesk** — a family/personal truck management agent that was added without owner request. It has been permanently deleted. Do not add it back under that name or concept.

Removed items:
- `agents/family_desk/` (entire directory)
- `data/family/` (entire directory)
- Any reference to "FamilyDesk", "family_desk", or "family desk"

**Exception approved by owner:** Uncle Kenneth's truck has a dedicated carrier profile at `data/kenneth/kenneth_profile.md`. This is a carrier record inside the existing dispatch system — NOT a new agent. Erin dispatches for him like any other carrier. Maya tracks his loads in morning reports.

---

## Directory Structure

```
agents/          Each agent is a self-contained folder:
                 agents/[name]/[name].js           main implementation
                 agents/[name]/system_prompt.md    role definition
                 agents/[name]/*.md                supporting docs

  maya/          Executive Assistant — morning reports, escalation routing
  erin/          Dispatcher — core freight engine, Iron Rules enforced here
  compliance/    Gatekeeper — vets every carrier and load before booking
  receptionist/  24/7 voice AI (Retell) — call routing and lead capture
  sales/         Lead generation — FMCSA API scraping, email sequences
  onboarding/    7-day free trial funnel + paid carrier setup
  support/       Client/carrier retention, complaint triage
  shadow/        CEO observer — learns owner decision patterns, never acts
  marketer/      Content strategy — TikTok/YouTube scripts, content calendar

workflows/       Multi-agent sequences that run in order:
                 daily_morning_report.js    triggers Maya's 6AM briefing
                 load_to_book.js            full dispatch pipeline
                 trial_onboarding.js        7-day trial automation
                 lead_gen_outreach.js       sales sequence runner
                 carrier_development.js     carrier relationship management
                 escalation_routing.js      event → Maya → owner routing
                 weekly_review.js           week-over-week analytics

decision_engine/ Learning system:
                 engine.js      logs every decision, calculates confidence
                 matcher.js     finds similar past decisions
                 promoter.js    delegates autonomy when confidence ≥ 85%
                 schema.json    all situation type categories

shared/
  memory.js      AgentMemory class — each agent's persistent notebook
                 Data stored in data/sops/library.json

data/            JSON persistence stores (not the primary DB — Airtable is)
  calls/         Receptionist transcripts
  content/       Marketer content calendar
  decisions/     Decision Engine learning log
  emails/        Outreach log
  finance/       P&L tracking
  sales/         Lead pipeline
  sops/          Agent memory store (library.json — read/write by all agents)

config/
  airtable_schema.md   5-table operational DB definition (Carriers, Clients, Prospects, Loads, Invoices)
  contexts.md          USA / Canada / EU market definitions
  env.example          All environment variables with descriptions

sops/            Human-readable standard operating procedures per agent
  maya_sop.md
  erin_sop.md
  compliance_sop.md
  receptionist_sop.md
  sales_sop.md

templates/       Email and document templates (BOL, rate confirmation, invoice, carrier emails)

roadmap/
  200_trucks_roadmap.md   Month-by-month growth targets to 200 trucks

command_center/
  generator.js   Generates index.html from live data
  index.html     Mobile-first owner dashboard (3 tabs: USA / Canada / EU)
  template.html  Base HTML template

.claude/commands/   Workshop slash commands for owner education
                    Invoked as /workshop:[name] in Claude Code

ai-os/          System architecture documentation (blueprint, integrations, governance, metrics)
```

---

## npm Scripts — How to Run Things

```bash
npm run maya              # Start Maya (executive assistant)
npm run erin              # Start Erin (dispatcher)
npm run receptionist      # Start Retell webhook handler
npm run sales             # Start Sales outreach agent
npm run compliance        # Start Compliance agent
npm run onboarding        # Start Onboarding agent
npm run morning-report    # Trigger Maya's 6AM report manually
npm run load-to-book      # Run full load pipeline
npm run trial             # Run trial onboarding workflow
npm run leads             # Run lead gen outreach
npm run weekly            # Run weekly review
npm run command-center    # Generate command_center/index.html (open in browser)

# Test modes
npm run test:iron-rules   # Test Erin's Iron Rule enforcement
npm run test:pricing      # Test profit formula calculations
npm run test:decision-engine  # Test Decision Engine pattern matching
npm run test:maya-sms     # Test Maya's escalation alert system
```

---

## Environment Setup

Copy `config/env.example` to `.env` and fill in all values before running anything.

**Critical variables:**
```
ANTHROPIC_API_KEY            — Claude API access (required for all agents)
TELEGRAM_BOT_TOKEN           — Maya's morning reports
TELEGRAM_OWNER_CHAT_ID       — Owner's Telegram chat ID
AIRTABLE_API_KEY             — Primary operational database
AIRTABLE_BASE_ID             — Your Airtable base
RETELL_API_KEY               — Voice receptionist
FMCSA_API_KEY                — Carrier vetting (Compliance + Onboarding)
AI_DISPATCH_PAUSED           — Set to "true" to kill all agents immediately
ACTIVE_CONTEXT               — USA | CANADA | EUROPE (controls which market is live)
```

**Iron Rule thresholds (configurable in .env — not hardcoded):**
```
COST_PER_MILE                — Default $1.70
MIN_RPM_REJECT               — Default $2.51
MIN_RPM_ACCEPT               — Default $2.75
MIN_RPM_PRIORITY             — Default $3.00
MAX_DEADHEAD_MILES           — Default 50
MAX_DEADHEAD_PCT             — Default 0.25 (25% of loaded miles)
MAX_LOAD_WEIGHT              — Default 48000
AUTHORITY_MIN_AGE_DAYS       — Default 180
QUOTE_ESCALATION_THRESHOLD   — Default $5000
COMMISSION_RATE_EXISTING     — Default 0.08
COMMISSION_RATE_NEW          — Default 0.10
NEW_CARRIER_THRESHOLD_DAYS   — Default 90
```

---

## Tech Conventions

**Module system:** ESM only. All files use `import`/`export`. Never use `require()`.

**Agent pattern (follow this for any new agent):**
```javascript
import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { AgentMemory } from '../../shared/memory.js'

const client = new Anthropic()
const memory = new AgentMemory('AgentName')  // matches the agent's display name

export async function mainFunction(input) {
  const memContext = await memory.buildContext(input.type)
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',   // primary model for most agents
    // ...
  })
  await memory.remember({ key: '...', value: '...', importance: 1-5 })
  return result
}
```

**Kill Switch Rules — `AI_DISPATCH_PAUSED=true`:**

Setting `AI_DISPATCH_PAUSED=true` in `.env` triggers the following protocol:
1. **Block all new actions** — no new loads booked, no new emails sent, no new carrier onboarding
2. **Finish in-flight loads** — any load already picked up continues to delivery (abandoning mid-route damages carrier relationship and violates contracts)
3. **Maya alerts owner immediately** — Telegram message: what was paused, what is still in motion, ref IDs of in-flight loads
4. **Resume** — Set `AI_DISPATCH_PAUSED=false` and restart agents

This is implemented in `agents/maya/maya.js` → `evaluateEscalation()`.

---

**Model selection:**
- `claude-sonnet-4-6` — default for all agents (Erin, Maya, Sales, Support, Receptionist, Onboarding, Compliance, Marketer)
- `claude-opus-4-6` — Shadow Agent learning, complex compliance edge cases
- `claude-haiku-4-5-20251001` — quick checks only (Iron Rule validation, format checks, duplicate detection)

**Memory module:**
```javascript
const memory = new AgentMemory('AgentName')
await memory.remember({ key, value, source, importance })    // importance 1-5
await memory.recall(query)                                    // returns relevant memories
await memory.buildContext(situationType)                      // formatted string for system prompt
```
All memories stored in `data/sops/library.json`. Each agent has an isolated namespace.

**Data classification — enforce before any API call:**
- Green (safe for prompts): Public FMCSA data, mileage, load board rates, publicly available info
- Yellow (internal only): Client names/volumes, margin data, carrier rate history
- Red (never in prompts): Contracts, payment data, credentials, PHI-adjacent documents — reference by ID only

---

## The Governance Tier System — Never Break This

Every agent action must respect the tier system. Do not write code that bypasses it.

| Tier | Action | Who Approves | How |
|---|---|---|---|
| 0 | Read, search, draft, calculate | Auto | No notification |
| 1 | Send emails, update Airtable, send docs | Auto + logged | Morning report stats |
| 2 | Quotes >$5K, new carrier first load, trial conversion | Maya → Owner SMS | `evaluateEscalation()` call |
| 3 | Contracts, pricing changes, new markets, legal | Owner only | Maya blocks all until response |

**In code:** Every agent that performs a Tier 2+ action must call `evaluateEscalation()` from `agents/maya/maya.js` — not implement its own notification logic.

```javascript
import { evaluateEscalation } from '../maya/maya.js'

await evaluateEscalation({
  type: 'load_value_exceeded',
  agent: 'Erin',
  data: { load_id, client_rate, route },
  ref_id: load_id
})
```

---

## The 8 Iron Rules — The Compliance Gate

Erin enforces these in `agents/erin/erin.js`. Compliance validates them in `agents/compliance/compliance.js`. They are never bypassed.

1. **No Florida** — Any FL origin or destination → auto-reject
2. **Minimum RPM** — Below $2.51 → reject; $2.51–$2.74 → counter at $2.75; $2.75+ → accept; $3.00+ → prioritize
3. **Max Deadhead** — Max(50 miles, 25% of loaded miles), stricter rule wins → auto-reject if exceeded
4. **Max Weight** — 48,000 lbs cargo maximum → auto-reject if over
5. **Safety Rating** — Satisfactory or Unrated ONLY → auto-block Conditional/Unsatisfactory
6. **Authority Age** — MC authority active 180+ days minimum → auto-block if under
7. **Cargo Type** — Dry van only → auto-reject reefer, hazmat, oversized, flatbed
8. **Shipper RPM Floor** — Direct contracts also meet $2.51/mile minimum

Do not modify thresholds in code. They live in `.env`. Changing a threshold requires owner approval (Tier 3).

---

## How to Add a New Agent

Follow this checklist exactly:

1. Create `agents/[name]/[name].js` — use the agent pattern above
2. Create `agents/[name]/system_prompt.md` — define role, constraints, escalation rules
3. Add npm script to `package.json`: `"[name]": "node agents/[name]/[name].js"`
4. Create `sops/[name]_sop.md` — plain English operating procedure
5. Update `ai-os/01_architecture/AI_OS_Blueprint.md` — add to agent hierarchy
6. If the agent escalates anything: import `evaluateEscalation` from maya.js — do not build a custom notification path

---

## Git

**Active branch:** `main`

All work goes on main. It is the only branch.

```bash
git push -u origin main
```

If push fails due to network error: retry up to 4 times with exponential backoff (2s, 4s, 8s, 16s).

---

## Workshop Commands

Located in `.claude/commands/`. These are interactive learning modules for the owner. Invoked as `/workshop:[name]`.

| Command | Topic |
|---|---|
| `/workshop:dispatch-basics` | How freight dispatch works |
| `/workshop:compliance-usa` | FMCSA, DOT, safety ratings |
| `/workshop:compliance-canada` | Transport Canada, CVOR, CUSMA |
| `/workshop:compliance-eu` | EU GDP, CMR docs, cabotage |
| `/workshop:pricing-strategy` | Profit formula, RPM, commissions |
| `/workshop:carrier-vetting` | Reading FMCSA SAFER reports |
| `/workshop:trial-to-paid` | 7-day free trial conversion |
| `/workshop:sales-outreach` | Lead gen, 4-email sequence |
| `/workshop:command-center` | Maya's daily report, dashboard |

Do not modify these without owner direction. They are owner education tools.

---

## Command Center Dashboard

```bash
npm run command-center    # Regenerates command_center/index.html
```

Open `command_center/index.html` in a browser. Mobile-first design. Three tabs: USA (active) | Canada (coming) | EU (coming).

The generator (`command_center/generator.js`) pulls live data from agent logs and renders the dashboard. The `index.html` is a static snapshot — regenerate to refresh.

---

## What This System Is Building Toward

Month 12 target: **200 trucks under management, $68K/week ($272K/month) revenue, 3 active markets (USA, Canada, EU).**

Year 2 target: **Clone system to Canada, EU, UK. 500+ carriers across all countries.**

Year 3 target: **500+ carrier/fleet companies globally, CEO Shadow fully operational (owner makes minimal decisions), agents handle 90%+ of all actions autonomously. "Guardrails" system — fully unbreakable AI rules across all markets.**

Every line of code you write should make the system more autonomous, not less. If you're adding a step that requires owner input for something that could be rule-based, redesign it.
