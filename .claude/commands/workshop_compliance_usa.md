# Workshop: US DOT & FMCSA Compliance Basics

## What You'll Learn
What makes a carrier legally allowed to haul freight in the USA, how to read a FMCSA SAFER report in under 2 minutes, and what Erin's Compliance check does automatically on every carrier before a load is dispatched.

---

## The Lesson

**Two numbers every carrier must have:**

1. **DOT Number** — Issued by the US Department of Transportation. Required for any commercial vehicle over 10,001 lbs. This is their federal ID number.

2. **MC Number (Motor Carrier number)** — Issued by FMCSA (Federal Motor Carrier Safety Administration). Required for carriers hauling freight for hire across state lines. This is their operating authority.

**The FMCSA SAFER System:**
Every carrier's safety record is public at `safer.fmcsa.dot.gov`. You can search by DOT# or MC#. Compliance pulls this automatically. Here's how to read it:

**Authority Status** (the most important field):
- **Active** = legal to haul. Good.
- **Inactive** = cannot haul for hire. Do not use.
- **Revoked** = authority has been pulled. Never use.

**Safety Rating:**
- **Satisfactory** = passed a DOT compliance review. Best.
- **Unrated** = no review yet (common for newer carriers). Acceptable.
- **Conditional** = has violations but still operating. Erin's Iron Rule: **never dispatch a Conditional carrier.**
- **Unsatisfactory** = failed review. Automatically rejected.

**Operating Authority Age — Iron Rule: 180 days minimum**
New carriers are high-risk. They haven't proven themselves. Erin will not dispatch any carrier whose MC authority is less than 180 days old. No exceptions.

**Insurance Requirements (dry van medical freight):**
- **Auto Liability**: Minimum $1,000,000 per occurrence
- **Cargo Insurance**: Minimum $100,000 per occurrence
- Check the expiration date — Compliance tracks this and alerts Maya 30 days before expiry

**Out-of-Service (OOS) Rates:**
These show what percentage of inspections led to the vehicle or driver being taken off the road.
- Vehicle OOS rate: national average ~20%. Stay below 30%.
- Driver OOS rate: national average ~5%. Stay below 8%.
High OOS rates = bad maintenance or tired drivers. Avoid.

**What Compliance does on every new carrier:**
1. Looks up MC# in FMCSA SAFER
2. Confirms authority is Active
3. Checks safety rating (Satisfactory or Unrated only)
4. Verifies authority age ≥ 180 days
5. Reads insurance certificates (requests from carrier)
6. Checks OOS rates
7. Returns a PASS/FAIL with detailed report

---

## Practice Questions

**Question 1:** A carrier has MC# 1234567 with Active authority, Unrated safety status, authority issued 60 days ago, $1M auto liability, $100K cargo. Does Erin dispatch them?

*Expected: NO. Authority is only 60 days old — Iron Rule requires 180 days minimum.*

**Question 2:** What's the difference between a DOT number and an MC number?

*Expected: DOT = federal safety ID for any large commercial vehicle. MC = operating authority to haul freight for hire across state lines. Both are required. A carrier can have a DOT# but no MC# (intrastate only).*

**Question 3:** A carrier's SAFER report shows Vehicle OOS Rate: 41%. Everything else looks fine. Should you use them?

*Expected: No — 41% means nearly half their trucks fail inspection. That's 2x the national average. Compliance would flag this. Medical freight especially cannot risk a breakdown en route to a hospital.*

**Question 4:** Why does Erin check insurance BEFORE every load, not just once during onboarding?

*Expected: Insurance can lapse. A carrier might be active in the database with expired insurance. If cargo is lost or damaged on an uninsured load, there's no coverage. Compliance tracks expiration dates and alerts 30 days out, but always verify before a new load.*

**Question 5:** What happens if Compliance flags a load mid-process (after Erin already found a carrier)?

*Expected: Erin stops. The load goes on hold. Compliance reports the issue to Maya. Maya escalates to owner if Tier 2. No carrier rolls until the issue is resolved or a new carrier is found.*

---

## Mastery Check

You're reviewing a carrier for a medical device load from Chicago to Nashville. Here's their SAFER data:

```
MC Status: Active
Safety Rating: Conditional
Authority Age: 220 days
Auto Liability: $750,000
Cargo: $100,000
Vehicle OOS Rate: 18%
Driver OOS Rate: 4%
```

List every problem with this carrier and what Erin does about each one.

*Expected:*
*1. Safety Rating is Conditional → Iron Rule violation. Auto-rejected. No dispatch.*
*2. Auto Liability is $750,000 → below $1M minimum. Rejected.*
*Authority age and OOS rates are acceptable, but the other two failures mean this carrier never makes it to the load.*

---

## You're Done

Your answers have been logged to `data/sops/library.json` under `compliance_usa`.

**Next workshop:** `/workshop:compliance-canada` — what changes when freight crosses the border.
