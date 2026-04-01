# AI OS Blueprint — Medical Freight Dispatch

## OS Shape: AI Team OS

Claude is the orchestrator. 10 named AI agents run all operations. Owner only intervenes on Tier 2+ decisions.

## Primary Use Cases

1. **Dispatch Operations** — find loads, match carriers, book freight, generate docs, track deliveries
2. **Business Development** — find new clients and carriers, run free trial funnel, convert to paid
3. **Finance** — invoice generation, factoring, P&L tracking, commission calculation

## Primary Inputs

- Load requests (email, Receptionist call, web form)
- Carrier sign-ups (inbound calls, outreach responses, referrals)
- Market data (DAT load boards, FMCSA carrier database)

## Primary Outputs

- Booked loads (rate confirmations, BOLs, POD confirmations)
- Invoices (submitted for factoring or sent directly to clients)
- Daniel's 6AM report (owner's daily briefing)
- Weekly client summaries (from Support agent)

## 5-Layer Stack

| Layer | What It Does | Tools |
|---|---|---|
| **Input** | Load requests, carrier sign-ups, inbound calls | Retell AI, email, web forms |
| **Processing** | Route analysis, carrier matching, rate calculation, compliance check | Claude API (Erin + Compliance) |
| **Action** | Book load, send confirmation, generate docs, submit invoice | Email, DocuSign, Airtable |
| **Memory** | Carrier DB, client history, lane rates, decision history | Airtable, data/ JSON stores, Decision Engine |
| **Feedback** | Delivery outcomes, revenue review, decision learning, Shadow Agent | Daniel reports, weekly review, Decision Engine |

## Model Routing

| Model | Used For |
|---|---|
| claude-opus-4-6 | Shadow Agent learning, complex compliance edge cases, international routing |
| claude-sonnet-4-6 | Erin (dispatch), Daniel (reports), Sales outreach, Support responses, Receptionist LLM |
| claude-haiku-4-5 | Iron Rule checks, duplicate detection, format validation, quick compliance flags |

## Agent Hierarchy

```
Owner
  └── Daniel (Executive Assistant)
        ├── Erin (Dispatcher)
        │     └── Compliance (gates every load)
        ├── Receptionist (24/7 calls)
        ├── Sales (lead gen + outreach)
        ├── Onboarding (trial + setup)
        ├── Support (client retention)
        ├── Marketer (content OS)
        ├── Shadow (CEO observer)
        └── FamilyDesk (uncle's truck — isolated)
```

## Governance Tiers

| Tier | Action | Approver |
|---|---|---|
| 0 | Read, search, draft | Auto |
| 1 | Send emails, update records, standard docs | Auto + logged |
| 2 | Quotes >$5K, new carrier first load, trial conversions | Daniel → Owner SMS |
| 3 | Contracts, pricing changes, new market launch | Owner only |

## Kill Switch

Set `AI_DISPATCH_PAUSED=true` in .env → all agents stop immediately.
Daniel sends one alert: "All systems paused."
