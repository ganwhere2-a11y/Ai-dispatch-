# AI Dispatch — Claude Project Context

This file gives Claude Projects full context on this codebase. Read this before every session.

---

## What This Is

AI Dispatch is a **1-person AI-native international trucking dispatch business**. The owner runs 9 autonomous AI agents that handle all business operations — dispatching, compliance, sales, onboarding, support, content, and executive reporting. The owner only makes Tier 2+ decisions.

**Live URL:** https://ai-dispatch-production.up.railway.app  
**Repo:** ganwhere2-a11y/Ai-dispatch-  
**Branch:** main (only branch — always push here)

---

## Owner Context

- **Goal:** $272K/month ($68K/week) across USA, Canada, EU, UK markets
- **Year 1:** Master USA, 200+ carriers
- **Year 2:** Clone to Canada, EU, UK — 500+ carriers
- **Year 3:** "Guardrails" — fully unbreakable AI system, CEO Shadow proxying decisions
- **Operation:** 1 person. Every workflow must be simple enough for just the owner.
- **Uncle Kenneth:** Owner's family carrier — USA only. Profile at `data/kenneth/kenneth_profile.md`.

---

## Stack

- **Runtime:** Node.js 20+, ESM only (`import`/`export` — never `require`)
- **AI:** Anthropic Claude API (`claude-sonnet-4-6` default, `claude-opus-4-6` for CEO Shadow)
- **Database:** Airtable (primary) + `data/` JSON stores (memory/decisions)
- **Voice:** Retell AI (Receptionist agent)
- **Alerts:** Telegram (Maya → owner) + Twilio (SMS escalation)
- **Deployment:** Railway (auto-deploys from GitHub main)
- **Dashboard:** `server.js` → `ai-dispatch-production.up.railway.app`

---

## The 9 Agents

| Agent | File | Role |
|---|---|---|
| Maya | `agents/maya/maya.js` | Executive assistant, morning reports, escalation routing |
| Erin | `agents/erin/erin.js` | Dispatcher, 8 Iron Rules enforcer, load pipeline |
| Compliance | `agents/compliance/compliance.js` | Carrier vetting, FMCSA, authority verification |
| Sales | `agents/sales/sales.js` | Lead gen, FMCSA scraping, 4-email outreach |
| Onboarding | `agents/onboarding/onboarding.js` | 7-day trial funnel, carrier setup |
| Support | `agents/support/support.js` | Retention, complaint triage |
| Receptionist | `agents/receptionist/webhook_handler.js` | 24/7 voice AI via Retell |
| Marketer | `agents/marketer/marketer.js` | TikTok/YouTube scripts, content calendar |
| CEO Shadow | `agents/shadow/shadow.js` | Decision pattern learning, Phase 1→3 proxy |

---

## The 8 Iron Rules (never bypass)

1. No Florida — auto-reject any FL origin or destination
2. Min RPM: <$2.51 reject | $2.51–$2.74 counter at $2.75 | $2.75+ accept | $3.00+ priority
3. Max deadhead: max(50mi, 25% of loaded miles) — stricter rule wins
4. Max weight: 48,000 lbs
5. Safety rating: Satisfactory or Unrated only
6. Authority age: 180+ days
7. Cargo type: dry van only
8. Shipper RPM floor: $2.51/mile minimum on direct contracts

---

## Governance Tiers

| Tier | Action | Approval |
|---|---|---|
| 0 | Read, draft, calculate | Auto |
| 1 | Send emails, update Airtable | Auto + logged |
| 2 | Quotes >$5K, new carrier first load, trial conversion | Maya → owner SMS |
| 3 | Contracts, pricing changes, new markets | Owner only |

Every Tier 2+ action calls `evaluateEscalation()` from `agents/maya/maya.js`.

---

## Key Files

```
server.js                    → Railway web server, serves command center dashboard
agents/maya/system_prompt.md → Maya's full operating context (read this)
data/sops/owner_personal_context.md  → Owner philosophy and non-negotiables
data/sops/business_context.md        → Business state, ICP, commission rates
data/sops/strategic_context.md       → 3-year roadmap, Guardrails goal
data/kenneth/kenneth_profile.md      → Uncle Kenneth's carrier profile (USA only)
data/decisions/                      → Decision Engine logs
decision_engine/engine.js            → Logs decisions, calculates confidence
agents/shadow/shadow.js              → CEO Shadow (observes all Tier 2+ decisions)
CLAUDE.md                            → Full operating rules for Claude Code
```

---

## Permanent Rules (never break)

1. Maya's name never changes — not to Daniel, Nova, or anything else
2. Uncle Kenneth's truck: USA only, no exceptions
3. Never bypass the Tier system — always call `evaluateEscalation()` for Tier 2+
4. Iron Rule thresholds live in `.env` only — never hardcode
5. ESM only — no `require()`
6. Push to `main` only

---

## npm Scripts

```bash
npm start              # Start Railway server (command center dashboard)
npm run maya           # Start Maya
npm run erin           # Start Erin
npm run health         # Full system health check
npm run morning-report # Trigger Maya's 6AM report manually
npm run load-to-book   # Run full load pipeline
npm run ceo-shadow     # CEO Shadow daily insight
npm run command-center # Regenerate command_center/index.html
```
