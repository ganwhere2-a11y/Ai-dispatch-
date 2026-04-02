# Maya's Daily Morning Report Template

**Version:** 1.0
**Delivery:** Telegram message, sent at 6:00 AM local owner time
**Agent:** Maya (Executive Assistant)
**Audience:** Owner (1 person)

⚠️ THIS TEMPLATE BELONGS TO MAYA. DO NOT REASSIGN TO ANOTHER AGENT.

---

## Overview

Every morning at 6:00 AM, Maya sends a structured Telegram message summarizing the state of the business, what needs attention today, and what the agents did overnight. The report is built to be scannable in under 2 minutes. The owner should be able to read it, make any required decisions via tap-to-approve, and know exactly what to focus on — before coffee gets cold.

---

## Telegram Formatting Notes

Telegram supports a limited markdown subset in messages:
- `**text**` = **bold**
- `_text_` = _italic_
- `` `code` `` = `monospace`
- No headers (use bold + emoji as visual separators)
- Bullet points: use `•` character (not `-` or `*`)
- Numbered lists: use `1.`, `2.`, etc.
- Keep each section separated by a blank line
- Total message length should be under 4,000 characters (Telegram limit per message)
- If report exceeds limit, split into Part 1 and Part 2 — never truncate

**Emoji usage:** Used sparingly as section markers only. Not decorative.

---

## Exact Telegram Message Format

```
📋 *DAILY BRIEFING — [DAY], [DATE]*

*Business State:* [One sentence. Green / Yellow / Red with short reason]

────────────────────

📌 *TODAY'S PRIORITIES*

1. [Highest urgency item — specific action required]
2. [Second priority]
3. [Third priority]
4. [Fourth priority]
5. [Fifth priority — lower urgency]

────────────────────

🔔 *NEEDS YOUR DECISION* (tap to approve)

• [Decision Item 1]
  → Approve: [what happens if yes]
  → Skip: [what happens if no / defer]

• [Decision Item 2]
  → Approve: [what happens if yes]
  → Skip: [what happens if no]

[If no decisions needed: "No decisions pending today ✓"]

────────────────────

🚛 *ERIN YESTERDAY*

Loads booked: [N]
Loads rejected: [N]
Total loads reviewed: [N]
Revenue locked in: $[amount]
Avg RPM on booked loads: $[X.XX]

────────────────────

🔒 *IRON RULE ACTIVITY*

[If none: "No Iron Rule violations triggered. ✓"]

[If triggered:]
• Load #[ID] rejected — [reason: e.g., RPM $2.47 below $2.51 minimum]
• Load #[ID] rejected — [reason: e.g., Florida destination — absolute prohibition]

────────────────────

🧪 *TRIAL ACTIVITY*

Active trials: [N] carriers
• [Carrier Name] — Day [X] of 7 — [status: On Track / Needs Attention]
• [Carrier Name] — Day [X] of 7 — [status]

Trials ending this week: [N]
Conversions due: [carrier names and dates]

[If no active trials: "No active trials."]

────────────────────

📊 *WEEK-TO-DATE*

Revenue: $[X,XXX] of $[X,XXX] target ([X]%)
Loads booked: [N] of [N] weekly target
Active carriers: [N]
New leads (last 24h): [N]

[Green if ≥ 90% of target | Yellow if 70-89% | Red if < 70%]
```

---

## Example Filled-In Report

```
📋 *DAILY BRIEFING — WEDNESDAY, APRIL 2*

*Business State:* 🟡 Yellow — 3 active trials but no conversions this week yet; revenue at 74% of target.

────────────────────

📌 *TODAY'S PRIORITIES*

1. Review and approve the MedTrans LLC trial conversion offer (Day 7 — decision due by EOD)
2. Respond to Pinnacle Logistics inquiry — they asked about shipper rates; Sales flagged 2x ago
3. Approve Erin's carrier addition: Sunrise Express (MC-987654) — passed all checks, awaiting your sign-off
4. Check in on the Tuesday carrier outreach batch — 12 emails sent, 2 replies need review
5. Content calendar: Marketer scheduled TikTok post for Thursday — needs final review

────────────────────

🔔 *NEEDS YOUR DECISION* (tap to approve)

• Carrier: MedTrans LLC — Convert to paid (8% commission)
  → Approve: DocuSign sent, Airtable updated, first real load dispatched
  → Skip: Enter 30-day nurture drip, no action today

• Carrier: Sunrise Express (MC-987654) — Add to active roster
  → Approve: Added to Airtable, Erin can dispatch immediately
  → Skip: Held for another 48h pending your review

────────────────────

🚛 *ERIN YESTERDAY*

Loads booked: 4
Loads rejected: 3
Total loads reviewed: 7
Revenue locked in: $2,840
Avg RPM on booked loads: $3.12

────────────────────

🔒 *IRON RULE ACTIVITY*

• Load #LDX-0041 rejected — Florida destination (Jacksonville FL) — absolute prohibition
• Load #LDX-0044 rejected — RPM $2.38 below $2.51 minimum
• Load #LDX-0045 rejected — Deadhead 67mi exceeded 50mi cap

────────────────────

🧪 *TRIAL ACTIVITY*

Active trials: 3 carriers
• MedTrans LLC — Day 7 of 7 — ⚠️ Conversion Decision Due Today
• Blue Ridge Freight — Day 3 of 7 — On Track (2 loads run, $1,200 rev potential shown)
• Southern Star Transport — Day 1 of 7 — Started Yesterday

Trials ending this week: 1 (MedTrans LLC — today)
Conversions due: MedTrans LLC — April 2

────────────────────

📊 *WEEK-TO-DATE*

Revenue: $6,320 of $8,500 target (74%)
Loads booked: 9 of 15 weekly target
Active carriers: 7
New leads (last 24h): 4

🟡 Behind pace — need 6 more loads Wed–Fri to hit target.
```

---

## How Maya Determines Priority Order

Maya ranks each open item using an urgency score before building the priority list.

```
Urgency Score = (Time Sensitivity × 0.40) + (Revenue Impact × 0.30) + (Risk Factor × 0.20) + (Owner Request × 0.10)
```

Items ranked highest score to lowest. Top 5 appear in the report.

---

*Template owned by Maya. Do not modify without owner authorization.*
