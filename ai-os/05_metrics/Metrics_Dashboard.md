# Metrics Dashboard — AI Dispatch OS

## 8 Core KPIs

| # | Metric | Definition | Source | Frequency | Year 1 Target |
|---|---|---|---|---|---|
| 1 | **Revenue per week** | Sum of all commissions earned in 7-day period | Finance data, Airtable Invoices | Weekly | $2K (M1) → $68K (M12) |
| 2 | **Loads booked per week** | Count of loads with status = Confirmed or In Transit | Airtable Loads | Daily | 5 (M1) → 140 (M12) |
| 3 | **Quote-to-book rate** | Loads booked ÷ quotes sent | Airtable Loads | Weekly | >40% |
| 4 | **Carrier on-time %** | Loads delivered on time ÷ total delivered | Airtable Loads + POD dates | Weekly | >92% |
| 5 | **Time-to-quote** | Minutes from load request to rate confirmation sent | Log timestamps | Daily | <15 minutes |
| 6 | **Trial conversion rate** | Trial carriers converted to paid ÷ total trials started | Airtable Prospects | Monthly | >30% |
| 7 | **Automation coverage** | % of load steps handled without manual owner action | Agent action logs | Monthly | >70% (M6) |
| 8 | **Decision Engine autonomous rate** | % of Tier 2 decision types now handled by agents autonomously | Decision Engine | Monthly | 50% of load types by M6 |

## Iron Rule Stats (Weekly)

Track how often each Iron Rule is triggered. Spikes indicate market changes or data quality issues.

| Rule | Track | Alert If |
|---|---|---|
| No Florida | Count of FL rejections per week | Sudden spike (carrier submitting bad loads?) |
| Minimum RPM | Count of low-RPM rejections | High volume = market rate dropping |
| Max Deadhead | Count of deadhead rejections | Spike = carriers offering wrong lanes |
| Max Weight | Count of weight rejections | Any = investigate immediately |

## Weekly Review Format

Every Friday, the weekly review workflow generates:

1. **Revenue**: This week vs. last week vs. 4-week average
2. **Loads**: Booked, rejected, pending by reason
3. **Iron Rules**: How many of each rule triggered
4. **Trials**: Active trials, new starts, conversions, expirations
5. **Decision Engine**: New autonomous capabilities earned this week
6. **Top Lane**: Which lane generated most revenue this week
7. **Recommendation**: One thing to focus on next week (from Claude analysis)

## Monthly Review

First Monday of each month, Daniel delivers a longer report:

1. Month-over-month revenue growth %
2. Truck count progress toward 200 goal
3. Shadow Agent pattern report
4. Governance review: any Tier 2 types ready to promote to Tier 1?
5. Market expansion readiness score (Canada/EU)

## How to Read the Numbers

- **Revenue growing week-over-week** = Erin is booking good loads, trial funnel is working
- **Quote-to-book below 30%** = rates may be too high, or carrier pool too thin
- **On-time below 90%** = carrier quality issue — Compliance needs to re-vet
- **Automation coverage dropping** = new situation types appearing, agents need more decisions logged
- **Trial conversion below 20%** = Day 5 recap email needs improvement, or pre-check is blocking too many
