# /prime — Session Brief

You are being briefed on the AI Dispatch business OS. Read everything below and hold it as active context for this session.

---

## What This Business Is

AI Dispatch is a 1-person AI-native medical freight dispatch company. 10 autonomous agents run all operations. The owner only makes Tier 3 decisions. Target: 200 trucks under management by Month 12.

**Active market:** $ACTIVE_CONTEXT (default: USA)
**Stack:** Node.js 20, ESM, Claude API, Airtable, Retell AI, Telegram, Twilio

---

## Current Agent Roster

| Agent | Role | Run Command |
|---|---|---|
| **Maya** | Executive Assistant — 6AM reports, escalation routing | `npm run maya` |
| **Erin** | Dispatcher — loads, Iron Rules, profit formula | `npm run erin` |
| **Compliance** | Carrier/load gating — vets everything before it moves | `npm run compliance` |
| **Sales** | Lead gen — FMCSA scraping, 4-email outreach sequence | `npm run sales` |
| **Onboarding** | 7-day free trial funnel + carrier setup | `npm run onboarding` |
| **Support** | Client/carrier retention, complaint handling | (node direct) |
| **Receptionist** | 24/7 Retell AI voice — call routing | `npm run receptionist` |
| **Marketer** | TikTok/YouTube content calendar | (node direct) |
| **Shadow** | CEO observer — learns decision patterns, never acts | (node direct) |
| **Maya Intelligence** | Carrier packet knowledge, BDR qualification, kill switch | `/maya intelligence` |

---

## The 8 Iron Rules (never violated)

1. No Florida loads — ever
2. RPM < $2.51 = reject | $2.51–$2.74 = counter at $2.75 | $2.75+ = accept | $3.00+ = prioritize
3. Deadhead max: 50 miles OR 25% of loaded miles (stricter wins)
4. Max cargo weight: 48,000 lbs
5. Safety rating: Satisfactory or Unrated only
6. Authority age: 180+ days minimum
7. Cargo type: dry van only
8. Direct shipper contracts also meet $2.51/mile floor

---

## Governance Tiers

- **Tier 0** — Read, search, calculate → auto, no notification
- **Tier 1** — Send emails, update Airtable → auto + logged
- **Tier 2** — Quote >$5K, new carrier first load, trial conversion → Maya → owner SMS
- **Tier 3** — Contracts, pricing changes, new markets → owner only, Maya blocks

---

## Key Files

- `CLAUDE.md` — full operating manual (always current)
- `config/env.example` → `.env` — all credentials and thresholds
- `data/sops/library.json` — agent long-term memory
- `data/decisions/decisions.json` — Decision Engine log
- `npm run health` — check which agents are ready to run

---

## What To Do Now

Run `git log --oneline -5` to see recent changes, then tell me what you see and ask what I need.

If I give you a task, start immediately. No confirmation needed unless it's a Tier 3 action (contracts, pricing changes, new markets, legal).
