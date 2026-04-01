# Governance Policy — AI Dispatch OS

## Permission Tiers

| Tier | Actions Allowed | Who Approves |
|---|---|---|
| **Tier 0** | Read data, search APIs, generate drafts, run analysis | Automatic — no approval needed |
| **Tier 1** | Send emails, update Airtable records, send standard documents | Automatic + logged (Daniel reviews in morning report) |
| **Tier 2** | Quotes >$5K, new carrier first load, trial conversions, factoring submission, any Yellow data action | Daniel sends SMS → Owner approves or rejects |
| **Tier 3** | Contract signing, pricing changes, refunds, new market launch, any Red data action | Owner only — no delegation |

## Per-Agent Hard Stops

| Agent | Hard Stop — Never Bypass |
|---|---|
| Daniel | Max 3 SMS per 10-minute window. No financial figures in urgent SMS. Never takes action — alert only. No texts 10PM-6AM except Tier 3. |
| Erin | Never books without Compliance clearance. Never sends quotes >$5K without escalation. All 8 Iron Rules are absolute. |
| Receptionist | Never quotes rates. Never takes payment info. Never promises delivery times. |
| Sales | Never makes contractual offers. Max 50 emails/day. Never contacts same prospect within 48hr. |
| Compliance | Never approves Iron Rule waivers. Never bypasses vetting for "urgent" loads. |
| Onboarding | Never starts trial without all 4 pre-checks passing. Never commits to pricing. |
| Support | Never issues credits/refunds without Daniel escalation. Never promises features not built. |
| Marketer | Never publishes content — drafts only, owner reviews. Never makes rate promises. |
| Shadow | Never takes any action — observe and report only. |
| FamilyDesk | Same Iron Rules as Erin. Never mixes family truck data with main business. |

## Data Classification

| Level | What It Includes | Rules |
|---|---|---|
| **Green** (safe) | Public FMCSA data, carrier contact info, load board rates, mileage data | Any agent can use |
| **Yellow** (sensitive) | Client names + volumes, margin structure, carrier rate history, factoring details | Tier 2 approval for external actions. Never in outbound emails without owner review. |
| **Red** (restricted) | Client contracts, payment data, PHI-adjacent cargo manifests, API credentials | Never enters prompts. Referenced by ID only. Tier 3 for any action. |

**Rule**: Red data never enters Claude API prompts. If an agent receives Red data in a request, it stops and flags to Daniel.

## Runaway Automation Prevention

- `AI_DISPATCH_PAUSED=true` in .env halts ALL agent automated actions immediately
- Every agent logs every Tier 1+ action to Airtable with timestamp, agent name, and action type
- Daily action log compiled by Daniel → delivered in 6AM morning report
- Max automated emails: 50/day total across all agents
- Max carrier contacts: 1 per carrier per 48 hours
- No agent may modify its own governance rules or permission tier

## Failure Handling

| Failure | What Happens |
|---|---|
| Compliance validation fails | Compliance blocks load, Daniel alerts owner, Support notifies client of delay |
| Carrier cancels <4hr to pickup | Erin immediately re-runs carrier search, Daniel sends URGENT alert to owner |
| Tool/API unavailable | Agent logs failure, falls back to draft + email for manual processing |
| Confidence too low | Agent outputs "NEEDS REVIEW" flag, does NOT proceed, escalates to Daniel |
| Iron Rule triggered | Auto-reject, log to Decision Engine, include in Daniel's morning Iron Rule stats |
| Owner overrides agent | Decision Engine logs the override, Shadow Agent observes and records |

## Review Cycle

- **Daily**: Daniel's 6AM report includes all Tier 1 actions taken the prior day
- **Weekly**: Friday review includes governance flag summary (which rules triggered, how often)
- **Monthly**: Shadow Agent report on patterns and recommendations for governance updates
- **Quarterly**: Owner reviews Tier 2 approval patterns — can any be promoted to Tier 1?
