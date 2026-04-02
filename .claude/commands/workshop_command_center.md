# Workshop: Using Your Command Center & Maya's Daily Report

## What You'll Learn
How to read Maya's morning report in under 60 seconds, what each section means, how to approve or reject things from your phone, what "Tier 2" means in practice, and how to use the Command Center dashboard.

---

## The Lesson

**Maya sends you a Telegram message every morning at 6AM.**

This is your whole business in a 60-second read. You don't need to log into anything, check spreadsheets, or call anyone. Everything you need to know is in that message.

**Reading the Report (section by section):**

### Business State — First line, most important
Green / Yellow / Red tells you the health of the business at a glance.
- Green: on track, no issues, loads moving
- Yellow: behind on revenue target, or a trial expiring, or a flag that needs attention soon
- Red: something is broken — a compliance issue, a client problem, a revenue gap over 30%

If it's Red when you wake up, that's the only thing that matters until it's fixed.

### Today's Priority List (1–5 items)
Maya already ranked these for you by urgency. Item 1 is the most important thing in your business today. Start there.

Don't skip to item 3 because it looks easier. Do item 1 first.

### Needs Your Decision
These are the ONLY things that require your actual response. Maya has handled everything else.

Typical items:
- **Quote approval**: Erin found a load worth over $5K. Maya needs a YES to send the quote.
- **New carrier first load**: A carrier is new to your roster. Maya needs your OK for the first dispatch.
- **Trial conversion**: A carrier's 7-day trial ends today. Do they convert or not?

**How to respond:**
- Reply to Maya's Telegram with the load/carrier ID + APPROVE or REJECT
- Example: "LOAD_047 APPROVE" or "MC-8812 REJECT"
- Maya routes your decision to Erin and handles the rest

### Erin Yesterday
A quick summary of what the dispatcher did. Loads booked, loads rejected, revenue locked in.

The "Iron Rule Rejections" line tells you how many bad loads Erin turned away automatically. That number is your quality filter working. If you see zero rejections for many days in a row, that's unusual — it means either the load board was slow or Erin isn't seeing enough loads.

### Trial Activity
Your pipeline. This is where 200 trucks comes from — one trial at a time.

Pay attention to carriers on Day 6 or 7. Those need decisions soon.

### Week-to-Date
Revenue vs. target. Simple math. Green is ≥90%, Yellow is 70–89%, Red is below 70%.

If you're Yellow by Wednesday, Sales and Marketer need to run harder. Maya will flag it.

---

## Understanding the Tier System

When Maya texts you during the day (not just the morning report), it means one of two things:

**Tier 2 — "You should know about this"**
Something happened that needs your awareness. Maya texts with a recommendation. You can approve, reject, or ignore. The business continues running while you decide.

Example: "MAYA: [HIGH] New carrier first load — Sunrise Express (MC-987654) ready to dispatch. Approve to proceed. | Ref: LOAD_052"

**Tier 3 — "Stop. I need your answer before anything moves."**
A decision that the agents cannot make without you. Until you respond, that specific action is blocked.

Example: "MAYA: [TIER-3 — ACTION REQUIRED] Client MedCore disputes $1,800 invoice from March. Legal threat mentioned. Options: A) Escalate to owner lawyer B) Issue credit and close | Reply: A or B or CALL ME"

For Tier 3: respond within 30 minutes during business hours. Maya will send a second notice at 30 min, 60 min.

---

## Using the Command Center Dashboard

Run: `npm run command-center`

This generates an HTML file at `command_center/index.html`. Open it in your browser.

**The dashboard has 3 tabs: USA | Canada | EU**
Currently only USA is active. Canada and EU tabs will populate as you expand.

**5 sections on the dashboard:**

1. **Business State** — big numbers: active loads, revenue this week, trucks under management, trial prospects
2. **Needs Your Attention** — the same items from Maya's morning report, with colored dots:
   - Red dot = URGENT (act now)
   - Yellow dot = REVIEW (act today)
   - Green dot = INFO (no action needed, just awareness)
3. **Erin Yesterday** — yesterday's dispatch stats
4. **Iron Rule Activity** — rejected loads and why
5. **Maya's Note** — a plain English paragraph from Maya about the state of the business

**Refresh:** Run `npm run command-center` again. The data updates from your agent logs.

---

## Practice Questions

**Question 1:** Maya's morning report says Business State is "Red — revenue at 52% of weekly target on Thursday." What's the first thing you do?

*Expected: Check the Priority List. Item 1 will tell you why revenue is low. Likely: Erin rejected more loads than usual (Iron Rule activity spiked), or a trial carrier didn't convert, or a client hasn't submitted loads. Don't guess — read the report.*

**Question 2:** You see a Tier 2 text at 11AM: "Load value $6,200 for a Chicago to Atlanta medical supply run. Awaiting approval." You're in a meeting. What do you do?

*Expected: Reply "LOAD_ID APPROVE" (or REJECT) from your phone. It takes 5 seconds. Maya routes it. If you miss it for 2 hours, Maya sends a second notice. The load might time-out on the board if you wait too long — medical loads are time-sensitive.*

**Question 3:** What does it mean when Maya sends a message at 2AM?

*Expected: It's a Tier 3 event. Only Tier 3 escalations go out between 10PM and 6AM. Something serious happened: carrier cancelled <4 hours before pickup, a client threatened legal action, or a compliance emergency. Read it.*

**Question 4:** The "Needs Your Decision" section shows: "Carrier: Blue Ridge Freight — Convert to paid (8% commission). Trial Day 7." You've never heard anything bad about them. What do you do?

*Expected: Approve. They passed their trial, Erin ran their loads, Compliance cleared them. If there were issues, they'd be in the Priority List above. Reply "BLUE_RIDGE_001 APPROVE" and Maya handles the rest — DocuSign goes out, Airtable updates, Erin can dispatch their next load.*

---

## Mastery Check

It's 6:05 AM. You open Maya's message. Here's what you see:

```
Business State: 🔴 Red — Carrier cancellation 3 hours before pickup on LOAD_071
                Medical device delivery to St. Luke's Hospital (Chicago) at 8AM

TODAY'S PRIORITIES
1. URGENT: Find replacement carrier for LOAD_071 — pickup in 3 hours
2. Approve Sunrise Express for their first load (low urgency, can wait)
3. Review Tuesday's outreach batch — 2 replies need response

NEEDS YOUR DECISION
• LOAD_071 — Emergency carrier needed. Erin has 2 options ready. Approve?
  → Option A: MedTrans LLC (known carrier, slightly higher rate — $2,840 client rate)
  → Option B: Sunrise Express (new carrier, first load, needs your sign-off — $2,680 client rate)
```

What is the right sequence of actions and why?

*Expected:*
*1. Reply "LOAD_071 OPTION_A APPROVE" immediately. MedTrans LLC is a known carrier — no new carrier review needed, faster to dispatch. The slightly higher rate is fine for an emergency. Sunrise Express being new requires extra verification which takes time you don't have with a 3-hour window.*
*2. After LOAD_071 is handled (Maya confirms), then approve Sunrise Express for their NEXT load (not this one) via separate reply.*
*3. Tuesday outreach replies are lowest priority — handle those after the emergency is resolved.*

---

## You're Done

Your answers are logged to `data/sops/library.json` under `command_center`.

**You've completed all workshops.** Type `/workshop:dispatch-basics` to review any topic, or ask Maya to generate a custom scenario based on your live business data.
