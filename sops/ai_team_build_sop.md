# AI Team Build SOP
## How to Build a Fully Autonomous AI Employee System

**Source:** Jordan Platin — Agency OSX Framework (adapted for AI Dispatch)
**Adapted by:** Claude Code — all workflow references translated to Node.js / Claude Code
**No make.com. No n8n. All workflows are built in Claude Code.**

---

## The Core Premise

Building an AI employee system is not about using the best tools. The tools are accessible to everyone. The differentiator is **your knowledge, your way of doing things, your hard-won experience.**

Anyone can spin up an AI agent in an afternoon. What they cannot copy is your IP — your SOPs, your decision patterns, your pricing logic, your carrier relationships, your freight knowledge. That is the moat.

> "The system itself doesn't have intrinsic value. The data, the intellectual property — that is the valuable element. The brain is the value."

For AI Dispatch: the Iron Rules, the 8-agent hierarchy, Maya's escalation logic, Erin's RPM thresholds, the CEO Shadow's pattern library — this is the IP no competitor can replicate. Build it deep. Guard it.

---

## The Tech Stack (AI Dispatch Version)

| Component | Agency OSX Original | AI Dispatch Equivalent |
|---|---|---|
| Code Editor / AI Interface | VS Code + Claude Code | Claude Code (primary interface) |
| AI Brain | Claude Opus 4.6 | claude-sonnet-4-6 (agents), claude-opus-4-6 (CEO Shadow) |
| Database | Supabase | Airtable (primary) + `data/` JSON stores |
| Frontend Deployment | Vercel | Railway (Commander Dashboard) |
| Version Control | GitHub | GitHub (`main` branch) |
| Workflows | make.com / n8n | Node.js ESM workflows in `workflows/` |
| Voice | — | Retell AI (Receptionist) |
| Alerts | — | Telegram (Maya → owner) |

**You do not need a deployed frontend on day one.** Run everything locally until you are ready to deploy the Commander Dashboard to Railway.

---

## The 6 Layers — Build In This Order

Every system, every agent, every workflow maps back to one of these six layers. Build them in sequence. Skipping ahead breaks the architecture.

---

### Layer 1 — Context (The Brain: Who You Are)

Before the AI knows your industry, it must know **you**.

No context = generic responses.
Context = tailored decisions that sound like you made them.

**Three context files to build:**

**1. Personal Context**
- Who you are as a person
- Your non-negotiables and values
- How you think and make decisions
- What you refuse to compromise on
- The lifestyle you are building toward (this is why you started the business)
- Your north star

*The founder must write this. Do not delegate it. If someone else writes it, the system thinks like someone else.*

**2. Business Context**
- What you do and who you serve
- How you make money (services, pricing model)
- Current revenue, client count, team structure
- Your ICP (Ideal Customer Profile)
- How you acquire customers (what's working, what's broken)
- Capacity, bottlenecks, constraints

*Brain dump voice notes, documents, videos into Claude Code. Let it condense them into a structured context document. Feed that document into your agents as system prompt context.*

**3. Strategic Context**
- Where the business is heading (not just where it is now)
- What you want the system to achieve: fewer hires? more efficiency? both?
- The end state: at what point is this system "done"?
- What you want to automate yourself out of

**For AI Dispatch:**
- Personal context → owner's decision philosophy, Iron Rule origin, non-negotiable standards
- Business context → current truck count, target markets, RPM targets, active corridors
- Strategic context → 200 trucks Month 12, $68K/week, CEO Shadow eventually proxying owner decisions

**Where this lives in AI Dispatch:**
- `agents/maya/system_prompt.md` (Maya carries the full business context)
- `config/contexts.md` (USA / Canada / EU market context)
- `ai-os/01_architecture/AI_OS_Blueprint.md` (strategic vision)

---

### Layer 2 — Identity (Who Your AI Employees Are)

This is where you design the team. Do this before writing a single line of agent code.

**Step 1: Write down every function your business needs covered.**
Think with unlimited budget. Who would you hire tomorrow if money were no object? That blueprint becomes your agent roster.

**Step 2: Do a 2-week time audit.**
Write down everything you and your team work on daily over 2 weeks. The tasks you hate become your first AI employees.

**Step 3: Group tasks into roles.**
Ad management → media buyer. Copy → copywriter. Outreach → sales specialist. Carrier vetting → compliance agent.

**Step 4: Define each employee individually.**

For each agent, define:

| Attribute | What to Define |
|---|---|
| Name | Permanent. Never changes after set. |
| Communication style | Direct? Nurturing? Formal? Casual? |
| Expertise domain | What they handle and what they don't |
| Escalation rules | When do they hand off? To whom? |
| Quality gate | They must have complete info before producing output |
| Boundaries | What they refuse to do (refer to specialist instead) |

**The quality gate rule is critical:**
Bake into every agent that it must refuse to deliver output if the input is insufficient. It must ask clarifying questions first. Teams will always look for shortcuts — agents that accept bad prompts reinforce bad habits.

**Step 5: Define team dynamics.**
Each agent must know every other agent exists and what they handle. When out of domain, they redirect — and pass context to the receiving agent.

*Example from Agency OSX:*
> Leo (legal) is asked to build a lead list. Leo says: "That's not my domain — that belongs to Kai. Shall I hand you over?" Kai then receives the context from Leo and picks up immediately.

**For AI Dispatch — current agent roster:**

| Agent | Role | Escalates To |
|---|---|---|
| Maya | Executive Assistant, escalation router, morning reports | Owner (Tier 2/3) |
| Erin | Dispatcher, Iron Rule enforcer, load pipeline | Maya (Tier 2+) |
| Compliance | Carrier and load vetting, FMCSA checks | Erin, Maya |
| Receptionist | 24/7 voice AI, call routing, lead capture | Maya (hard escalation) |
| Sales | Lead gen, FMCSA scraping, email sequences | Maya |
| Onboarding | 7-day trial funnel, carrier setup | Maya |
| Support | Retention, complaint triage | Maya |
| CEO Shadow | Observer, pattern learner, decision proxy (Phase 3) | Owner |
| Marketer | Content strategy, TikTok/YouTube scripts | Maya |

**Where this lives in AI Dispatch:**
- `agents/[name]/system_prompt.md` — each agent's identity definition
- `agents/[name]/[name].js` — implementation

---

### Layer 3 — Knowledge (What Your Agents Actually Know)

Context tells the AI who you are. Knowledge tells it what it knows.

**This layer is your moat.** The tools are available to everyone. This is not.

**What goes into a knowledge base:**

| Type | Examples |
|---|---|
| Frameworks | Your pricing model, RPM formula, commission structure |
| Methodologies | How you vet carriers, how you quote loads, how you close trials |
| Industry benchmarks | RPM ranges, deadhead tolerances, authority age standards |
| Case studies | Real loads you've dispatched, real carrier decisions |
| Transcribed content | Videos, podcasts, calls, meetings you found useful |
| SOPs | Documented processes for every repeatable task |
| Historical data | Past decisions, patterns, outcomes |
| Hard-won lessons | What failed, why, what you changed |

**The barrier to entry is dropping to zero. The only differentiator is your knowledge.**

Scrape everything:
- All your calls (load confirmations, carrier calls, client complaints)
- All your emails and outreach sequences
- Every SOP you've written or used
- Every decision you've made with context and outcome
- Every lesson from a carrier that went wrong

Turn it all into agent knowledge. That is the IP. That is what you would eventually sell.

**For AI Dispatch — knowledge files already built:**

| File | Knowledge Content |
|---|---|
| `agents/maya/carrier_packet_intelligence.md` | 8-doc carrier packet requirements, BDR qualification, medical freight addons |
| `agents/compliance/medical_cargo_requirements.md` | FDA/GDP compliance, controlled substances rules, 8-point load sign-off |
| `agents/erin/system_prompt.md` | Full Iron Rules, pricing logic, deadhead calculation |
| `decision_engine/schema.json` | Every decision situation category |
| `data/decisions/shadow_log.json` | CEO Shadow pattern library (grows with every decision) |
| `sops/` | Plain-English SOPs per agent |
| `config/airtable_schema.md` | 5-table operational database definition |

**The knowledge loop: every decision teaches the system.**
This is what the Decision Engine and CEO Shadow are for. Every Tier 2+ decision logged by Maya, every load booked by Erin, every carrier vetted by Compliance — it all feeds back into the knowledge base. The system gets smarter with every dispatch.

---

### Layer 4 — Capabilities (What Your Agents Can Actually Do)

An AI that only answers questions is a glorified FAQ. An employee **produces work.**

**Core capabilities to build:**

| Capability | What It Means | AI Dispatch Implementation |
|---|---|---|
| File generation | SOPs, contracts, BOLs, rate confirmations, email sequences | `templates/` directory, agent output functions |
| Web search | Real-time data, company research, lead sourcing | FMCSA API (`agents/sales/sales.js`), carrier lookups |
| Document analysis | Review PDFs, images, uploaded files | Compliance agent carrier packet review |
| Workflow chaining | One agent's output = next agent's input | `workflows/` directory — all in Node.js |
| Integrations | CRM, email, voice, alerts | Airtable, Twilio, Retell, Telegram |
| Image/media | Analyze documents, generate content | Marketer agent |

**Workflow principle:**
> The lead researcher finds 50 prospects. The sales agent writes sequences. Erin receives qualified loads. Compliance vets the carrier. Maya books or escalates. All automatic. One person, entire team output.

**For AI Dispatch — built workflows:**

```
workflows/
  daily_morning_report.js    → Maya → Telegram → owner
  load_to_book.js            → Erin → Compliance → Maya → book/escalate
  trial_onboarding.js        → Onboarding → 7-day funnel
  lead_gen_outreach.js       → Sales → FMCSA → email sequence
  carrier_development.js     → Support → carrier retention
  escalation_routing.js      → any agent → Maya → owner
  weekly_review.js           → CEO Shadow + Maya → week analytics
```

**No make.com. No n8n. These are plain Node.js ESM files that Claude Code writes and maintains.**

---

### Layer 5 — Infrastructure (How You and Your Team Use It)

Three levels. Build in order. Do not jump to Level 3 before Level 1 is solid.

**Level 1 — Conversational (Start Here)**
- Talk to your agents through Claude Code
- No frontend, no deployment
- Just Claude Code + your `agents/` directory
- Fastest way to start
- You learn more in a week than a month of tutorials
- Run via `npm run [agent-name]`

**Level 2 — Local Dashboard**
- Generate the Commander Dashboard locally: `npm run command-center`
- Opens `command_center/index.html` in browser
- Mobile-first, 3 tabs: USA / Canada / EU
- No deployment needed — static snapshot you regenerate on demand

**Level 3 — Deployed (Railway)**
- Deploy Commander Dashboard to Railway
- Team can access from anywhere
- `railway.toml` config in project root
- Only do this when Level 1 and 2 are fully working

**Infrastructure checklist before deploying:**
- [ ] All agents running locally without errors (`npm run health`)
- [ ] Decision Engine logging correctly (`data/decisions/`)
- [ ] CEO Shadow receiving Tier 2+ triggers (check `data/decisions/shadow_log.json`)
- [ ] Airtable connected and all 5 tables populated
- [ ] Telegram alerts reaching owner from Maya
- [ ] Iron Rules passing all tests (`npm run test:iron-rules`)

---

### Layer 6 — Deployment and Scaling

The final layer is taking what works locally and making it production-grade and accessible.

**For AI Dispatch this means:**
1. Railway deployment of Commander Dashboard
2. Retell AI live (Receptionist handling inbound calls 24/7)
3. All workflows on schedule (Maya's 6AM report, weekly review)
4. CEO Shadow Phase 2 active (suggestions, not just observation)
5. Decision Engine confidence ≥ 85% on core dispatch decisions → Promoter delegates autonomously

**Production checklist:**
- [ ] `AI_DISPATCH_PAUSED` kill switch tested
- [ ] All Tier 2 escalations routing through `evaluateEscalation()` in `maya.js`
- [ ] CEO Shadow Phase tracker updated in `agents/shadow/observation_rules.md`
- [ ] `npm run health` shows all GREEN
- [ ] GitHub CI passing on all 3 tests

---

## The "Vibe" vs. Reality Rule

> "That 16-year-old kid built an incredible system. But it has no tangible benefit in a real business. It hasn't been proved in an actual setting."

Building a system that looks impressive is easy. Building a system that runs a real business is hard. The difference:

- Real business context (not generic prompts)
- Real data fed back into knowledge (not synthetic examples)
- Real decisions logged and learned from (CEO Shadow)
- Real IP — your SOPs, your rates, your carrier relationships

AI Dispatch is already on the right side of this line. The Iron Rules are real business rules. The carrier packet requirements are real compliance requirements. The RPM thresholds are real market data. The CEO Shadow is logging real decisions.

**Keep feeding it real data. That is the compounding advantage.**

---

## Build Order Checklist

Use this when onboarding a new agent or rebuilding the system from scratch:

- [ ] **Layer 1 — Context:** Personal, business, and strategic context written by owner
- [ ] **Layer 2 — Identity:** Agent roster defined, system prompts written, team dynamics mapped
- [ ] **Layer 3 — Knowledge:** SOPs loaded, historical data ingested, benchmarks defined per agent
- [ ] **Layer 4 — Capabilities:** Workflows built in Node.js, APIs connected, output functions tested
- [ ] **Layer 5 — Infrastructure:** Running conversationally → local dashboard → Railway deploy
- [ ] **Layer 6 — Scale:** CEO Shadow Phase 2+, Decision Engine at 85%+ confidence, kill switch tested

---

## Key Principles to Internalize

1. **Context before knowledge.** An agent without context gives generic answers. Generic answers have zero competitive value.

2. **Each agent is a different person.** Not the same chatbot in a different costume. Communication style, domain expertise, and escalation rules must differ.

3. **Agents demand good input.** Build in the quality gate. An agent that accepts a bad prompt is a liability, not an asset.

4. **Team dynamics are baked in.** Agents must know what other agents do and redirect accordingly. That is what makes it a team.

5. **Your IP is the moat.** The tools will be free for everyone within 12 months. Your SOPs, your decision patterns, your carrier relationships — that is what no one can replicate.

6. **The knowledge loop never stops.** Every decision, every call, every load teaches the system. CEO Shadow captures this. Feed it everything.

7. **Build for autonomy, not for input.** Every feature you add should remove owner involvement, not require it. If a step needs owner input for something rule-based, redesign it.

---

## Quick Reference: AI Dispatch vs. Agency OSX

| Concept | Agency OSX | AI Dispatch |
|---|---|---|
| Personal context | Founder goals, lifestyle | Owner decision philosophy, Iron Rule origin |
| Business context | Agency clients, revenue | Truck count, corridors, RPM targets |
| Strategic context | Scale agency, sell company | 200 trucks, $68K/week, CEO Shadow proxy |
| Team lead | Clara (marketing lead) | Maya (executive assistant) |
| Compliance specialist | Leo (legal) | Compliance Agent + Erin Iron Rules |
| Sales specialist | Kai (outreach) | Sales Agent (FMCSA scraper) |
| Observer / learner | Not present | CEO Shadow (Phase 3: full proxy) |
| Deployment | Vercel | Railway |
| Workflows | make.com / n8n | Node.js ESM (`workflows/`) |
| Database | Supabase | Airtable + `data/` JSON |
| Knowledge store | Per-agent knowledge base | `AgentMemory` class → `data/sops/library.json` |
