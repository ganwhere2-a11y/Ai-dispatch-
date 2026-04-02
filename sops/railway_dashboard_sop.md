# SOP: Railway Commander Dashboard
## Training Reference — AI Dispatch OS

**What this is:** Standard operating procedure for building and deploying the AI Dispatch Commander Dashboard on Railway — a live web interface showing all 10 agents, their status, recent activity, and business metrics. Modeled after Jordan Platin's Agency OSX interface style.

**What this is NOT:** A generic agency app. This is purpose-built for a 1-person medical freight dispatch company running autonomous AI agents.

---

## Why We're Building This

Jordan Platin's Agency OSX shows one key insight:

> "Each one of these agents has deep specific knowledge. This isn't some generic AI with a different skin. I'm talking about tens of thousands of words of compiled expertise per employee built from eight years of running and coaching agencies."

That's exactly what AI Dispatch is — but for freight. 10 agents. Deep expertise in Iron Rules, compliance, carrier vetting, outreach. The Commander Dashboard makes that visible. You can see your business running in real time without being in it.

**The bottleneck Jordan describes — too many people, inconsistency, margin shrinking — you solved it before you even hired anyone.** The dashboard is proof of that.

---

## What the Commander Dashboard Shows

Modeled on Jordan's 4-department layout. AI Dispatch has 4 departments too:

### Department 1 — Operations
| Agent | What It Shows |
|---|---|
| **Maya** | Last report sent, escalations today, kill switch status |
| **Erin** | Loads evaluated today, loads booked, revenue generated |
| **Compliance** | Carriers vetted today, flags raised, any blocked loads |

### Department 2 — Business Development
| Agent | What It Shows |
|---|---|
| **Sales** | Leads in pipeline, emails sent this week, trial conversions |
| **Onboarding** | Active trials, day of trial (Day 1–7), conversion rate |
| **Receptionist** | Calls today, leads captured, escalations routed |

### Department 3 — Intelligence & Learning
| Agent | What It Shows |
|---|---|
| **Shadow** | Decisions observed this week, patterns identified, autonomy promotions |
| **Maya Intelligence** | Carrier packets reviewed, BDR prospects qualified |
| **Decision Engine** | Total decisions logged, confidence levels, autonomous eligible |

### Department 4 — Brand & Finance
| Agent | What It Shows |
|---|---|
| **Marketer** | Content published this week, next scheduled post, platform |
| **Finance (via Airtable)** | Revenue this week, commission earned, invoices pending |

---

## Tech Stack for the Dashboard

```
Frontend:   HTML + CSS + vanilla JS (no framework — keep it simple)
Backend:    Node.js + Express (already in our stack)
Data:       Reads from data/ JSON files + Airtable API
Deploy:     Railway (one-click, auto-deploy from GitHub main branch)
URL:        commander.yourdomain.com (custom domain in Railway)
Auth:       Single password (environment variable) — owner-only access
```

The `command_center/generator.js` already exists in the repo. This SOP builds on top of it and upgrades it to a live Railway-deployed version.

---

## Build Order (6 Steps)

### Step 1 — Design the Layout (30 minutes)
Replicate Jordan's Agency OSX layout structure:
- Left sidebar: department names + agent list (click to expand)
- Main panel: selected agent's live stats + recent activity
- Top bar: system status (ACTIVE/PAUSED), context (USA/Canada/EU), last updated timestamp
- Bottom bar: quick actions (Run Morning Report, Run Health Check, Pause System)

**Reference:** Look at `command_center/template.html` — it has the 3-tab USA/Canada/EU structure. Upgrade it to the full agent-by-department layout.

### Step 2 — Build the Data API (1 hour)
Create `command_center/api.js` — an Express endpoint that reads live data:

```javascript
// GET /api/status
// Returns: all agent stats, system health, recent decisions
// Reads from: data/ JSON files + Airtable (if keys are set)
// Refresh: every 30 seconds on the frontend
```

Data sources per agent:
- Erin: `data/decisions/decisions.json` (filter by agent: Erin, today)
- Sales: `data/emails/index.json` + `data/sales/leads.json`
- Receptionist: `data/calls/transcripts.json`
- Marketer: `data/content/calendar.json`
- All agents: `data/sops/library.json` (memory store)
- System health: reads `.env` vars (masked) via health check script

### Step 3 — Build the Frontend (2 hours)
Upgrade `command_center/index.html` to the live layout:

```
Commander Dashboard
├── Header: "AI DISPATCH | COMMANDER" + status badge
├── Sidebar
│   ├── OPERATIONS
│   │   ├── Maya ●
│   │   ├── Erin ●
│   │   └── Compliance ●
│   ├── BUSINESS DEVELOPMENT
│   │   ├── Sales ●
│   │   ├── Onboarding ●
│   │   └── Receptionist ●
│   ├── INTELLIGENCE
│   │   ├── Shadow ●
│   │   ├── Maya Intelligence ●
│   │   └── Decision Engine ●
│   └── BRAND & FINANCE
│       ├── Marketer ●
│       └── Finance ●
└── Main Panel: selected agent stats
```

Green dot = agent has run today. Yellow = no activity. Red = error or blocked.

### Step 4 — Deploy to Railway (20 minutes)
Railway is a hosting platform. Think of it like parking your car in a garage that never closes — your dashboard runs 24/7 without your computer being on.

**One-time setup:**
1. Go to railway.app — create account
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `ganwhere2-a11y/Ai-dispatch-`
4. Railway auto-detects Node.js and deploys
5. Set environment variables in Railway dashboard (copy from your `.env` file)
6. Railway gives you a URL like `ai-dispatch-production.up.railway.app`
7. Add custom domain in Railway settings (optional: `commander.yourdomain.com`)

**Railway config file** — create `railway.toml` in root:
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node command_center/api.js"
healthcheckPath = "/api/health"
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**Auto-deploy:** Every time you push to `main`, Railway automatically redeploys. Zero manual work.

### Step 5 — Add Password Protection (15 minutes)
The dashboard is owner-only. Simple password gate:

```javascript
// In api.js — middleware
app.use((req, res, next) => {
  const token = req.headers['x-dashboard-token'] || req.query.token
  if (token !== process.env.DASHBOARD_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
})
```

Add `DASHBOARD_TOKEN=yourpassword` to `.env` and Railway environment.

### Step 6 — Wire to Google Drive Brain (Future)
From Jordan's system: "tens of thousands of words of compiled expertise per employee."
For AI Dispatch, this lives in:
- `agents/*/system_prompt.md` — each agent's knowledge base
- `agents/maya/carrier_packet_intelligence.md` — Maya's carrier knowledge
- `data/sops/library.json` — learned memory

**Google Drive integration (Phase 2):**
- Create Google Drive folder: "AI Dispatch / Brain"
- Upload all system_prompt.md files, SOPs, carrier intelligence
- Set `GOOGLE_DRIVE_BRAIN_ID` in `.env`
- Maya can reference Drive docs in her morning reports
- Commander Dashboard shows "Brain documents: 47 files, last updated: [date]"

---

## What Jordan's System Has That We Already Beat

| Jordan's Agency OSX | AI Dispatch |
|---|---|
| 15 agents across 4 departments | 10 agents + Maya Intelligence across 4 departments |
| Built for marketing agency | Purpose-built for medical freight |
| Generic AI knowledge base | Iron Rules, FMCSA compliance, medical cargo rules hardcoded |
| No autonomous decision system | Decision Engine — 85% confidence threshold for autonomy |
| Manual workshop/training | `/workshop:` commands + Shadow Agent tracks your progress |
| No kill switch | `AI_DISPATCH_PAUSED` + kill switch layer 2 in maya.js |

**The difference:** Jordan's system requires him to talk to AI employees. Your system dispatches loads, vets carriers, and sends morning reports without you saying a word.

---

## Files to Create/Modify for This Build

```
New files:
  command_center/api.js              ← Express server with /api/status endpoint
  railway.toml                       ← Railway deployment config
  command_center/dashboard.js        ← Frontend JS (data fetching + rendering)

Modify:
  command_center/index.html          ← Full 4-department layout upgrade
  command_center/generator.js        ← Update to use new data API
  package.json                       ← Add "dashboard" script: node command_center/api.js
```

---

## Commander Dashboard Rules (Non-Negotiable)

1. **No credentials in the dashboard** — never show API keys, tokens, or passwords. Masked display only.
2. **Read-only by default** — dashboard shows data, never triggers agent actions directly. Actions go through Maya.
3. **Kill switch visible at all times** — AI_DISPATCH_PAUSED status always in the top bar, always one click to toggle.
4. **Mobile-first** — owner checks this from a phone. Every panel must work on a small screen.
5. **Auto-refresh every 30 seconds** — data stays live without manual page reload.

---

## What To Say to Claude When Building This

When you're ready to build the dashboard, start a new session and say:

```
/prime

Build the Commander Dashboard Railway deployment from sops/railway_dashboard_sop.md.
Start with Step 2 (the data API in command_center/api.js), then Step 3 (frontend layout),
then Step 4 (railway.toml). Do not push until I approve the frontend design.
```

That's it. Claude reads this SOP, knows exactly what to build, and does it.

---

## Reference: Jordan Platin's Agency OSX
**Source:** Video transcript — "How I Built a Team of 15 AI Employees"
**Key takeaway:** The interface makes the AI team *visible* and *trusted*. A business owner who can see their AI system working is a business owner who uses it every day.
**Applied to AI Dispatch:** Commander Dashboard = Jordan's Agency OSX, built for medical freight, deployed on Railway, accessible from your phone, 24/7.

*This SOP was created for AI Dispatch training purposes. Jordan Platin's framework is credited as the interface inspiration.*
