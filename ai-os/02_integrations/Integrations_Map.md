# Integrations Map

## All Tools, Purposes, Permissions, and Data Exchanged

| Tool | Agent(s) | Purpose | Data In | Data Out | Permission Tier | Status |
|---|---|---|---|---|---|---|
| **Retell AI** | Receptionist | 24/7 voice agent | Caller voice | Call transcript, lead data | Tier 1 | Required Day 1 |
| **Telegram Bot API** | Daniel | Morning reports + urgent alerts | Agent events | Text messages + buttons | Tier 1 | Required Day 1 |
| **Twilio** | Daniel (backup SMS), Receptionist (phone number) | SMS fallback + inbound calls | Events | SMS | Tier 1 | Required Day 1 |
| **Anthropic Claude API** | All agents | AI reasoning and generation | Text prompts | Text responses | Tier 0 | Required Day 1 |
| **Airtable** | All agents | CRM + all operational data | All records | Read/write records | Tier 0-1 | Required Day 1 |
| **FMCSA SAFER API** | Compliance, Onboarding | Carrier vetting | MC#, DOT# | Safety rating, authority status, insurance | Tier 0 | Required Day 1 |
| **DAT Load Board** | Erin | Find loads | Lane/equipment criteria | Load postings with rates | Tier 0 | Required Day 1 |
| **Truckstop.com** | Erin | Secondary load board | Lane criteria | Load postings | Tier 0 | Month 2 |
| **Gmail/SMTP** | Sales, Support, Onboarding, Marketer | Outreach and client comms | Templates + data | Sent emails | Tier 1 | Required Day 1 |
| **Calendly** | Receptionist, Sales | Call booking | Caller details | Calendar booking | Tier 1 | Required Day 1 |
| **DocuSign / PandaDoc** | Onboarding, Support | Contracts + agreements | Unsigned docs | Signed docs | Tier 3 | Month 2 |
| **OTR Capital / TBS Factoring** | Erin (Finance workflow) | Invoice factoring | Invoice + BOL + POD | Advance payment | Tier 2 | Month 2 |
| **QuickBooks / Wave** | Finance workflow | Accounting + P&L | Revenue, expenses | Reports | Tier 2 | Month 3 |
| **Google Maps / PC Miler** | Erin | Mileage + route calculation | Origin, destination | Miles, route | Tier 0 | Required Day 1 |
| **LinkedIn Sales Navigator** | Sales | Shipper lead generation | Search queries | Contact profiles | Tier 0 | Month 2 |

## MCP Integration Map (Claude Code)

```
Claude (Orchestrator)
  → Airtable MCP (Read/Write — Tier 1)
  → FMCSA API (Read-only — Tier 0)
  → Gmail (Write with rate limits — Tier 1)
  → Telegram (Write — Tier 1)
  → DAT API (Read-only — Tier 0)
  → DocuSign (Write only with owner approval — Tier 3)
  → Factoring API (Write with Daniel approval — Tier 2)
```

## Data Flow

```
Load Request (email/call/form)
  → Receptionist captures details
  → Onboarding creates prospect record (Airtable)
  → Erin pulls load board data (DAT)
  → Compliance vets carrier (FMCSA SAFER API)
  → Erin calculates rate + commission
  → Daniel escalates if >$5K (Telegram)
  → Owner approves (Telegram button)
  → Erin generates docs (templates → email)
  → Carrier confirms (email/call)
  → Load tracked to delivery
  → Finance workflow creates invoice (Airtable → DocuSign → Factoring API)
  → Revenue logged to P&L (data/finance/)
  → Decision Engine logs outcome
```

## Auth Boundaries

All API keys stored in `.env` only. Never hardcoded. Never logged. Never passed to agents as text.
All agents access keys via `process.env.KEY_NAME` at runtime.
`.env` is in `.gitignore` — never committed to the repository.
