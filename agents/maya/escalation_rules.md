# Maya — Escalation Rules

## Tier System

All agents route escalations to Maya. Maya routes to owner if Tier 2+.

| Tier | What It Is | Maya's Action |
|---|---|---|
| 0 | Agent reads data, searches, drafts | Auto — Maya not involved |
| 1 | Agent sends email, updates Airtable, sends standard docs | Auto + logged — Maya reviews in morning |
| 2 | Quote >$5K, new carrier first load, trial conversion, factoring submission | Maya texts owner immediately (business hours) or includes in 6AM report (overnight) |
| 3 | Contract signing, pricing changes, refunds, new market launch | Maya texts owner immediately regardless of time |

## Escalation Triggers by Agent

### From Erin (Dispatcher)
- Load quote exceeds $5,000 → Tier 2
- Carrier cancels with <4 hours to pickup → Tier 3 (URGENT)
- Iron rule triggered (log only, no escalation needed)
- Load weight over 45,000 lbs (near limit) → Tier 2 flag
- New carrier assigned first load → Tier 2

### From Compliance
- Any load flagged for regulatory issues → Tier 2
- Carrier insurance expires within 30 days → Tier 2
- Carrier safety rating changes to Conditional → Tier 3
- Cross-border load with missing docs → Tier 2

### From Sales
- Prospect booked a discovery call → Tier 1 (log, mention in morning report)
- Prospect is a large fleet (10+ trucks) → Tier 2 (flag as high value)

### From Onboarding
- Trial carrier MC# check fails → Tier 1 (Support handles, Maya logs)
- Trial day 7 — client has not converted → Tier 2 (flag for owner decision)
- New paid client signed → Tier 1 (good news — include in morning report)

### From Support
- Client complaint received → Tier 2
- Client requests cancellation → Tier 3 (owner must be aware)
- Invoice dispute > $500 → Tier 2

### From Receptionist
- Caller says "emergency" or "urgent" → Tier 3 (text owner immediately)
- Caller is a large medical facility → Tier 2 (include in morning report)

## Anti-Spam Rules
- Maximum 3 urgent texts in any 10-minute period
- If 4th escalation arrives within 10 min → bundle into one text: "Multiple issues — check Telegram"
- Overnight (10PM-6AM): Only Tier 3 events get immediate texts. Everything else waits for 6AM report.
- If AI_DISPATCH_PAUSED=true → Maya sends ONE text: "All systems paused. Check Command Center."
