# Workshop: Carrier Vetting — Reading FMCSA Like a Pro

## What You'll Learn
How to read a full FMCSA SAFER record in under 2 minutes, what each field actually means, how to spot red flags that aren't obvious, and how to make a fast pass/fail call on any carrier.

---

## The Lesson

**Where to look:** `safer.fmcsa.dot.gov` — search by MC# or DOT#.

**The 7 fields that matter:**

### 1. Operating Authority Status
First thing you check. One of:
- `ACTIVE` → can haul. Continue reviewing.
- `INACTIVE` → cannot haul for hire. Stop here. Reject.
- `REVOKED` → authority pulled by FMCSA. Never use. Ever.
- `SUSPENDED` → temporary hold, often for unpaid fees. Reject until resolved.

### 2. Safety Rating
- `Satisfactory` → passed a DOT compliance review. Best possible.
- `Unrated` → never been reviewed. Common for carriers under 2 years old. Acceptable.
- `Conditional` → reviewed and found deficient but still operating. **Erin's Iron Rule: never dispatch.**
- `Unsatisfactory` → failed the review. Auto-reject.

### 3. Entity Type
Should be `CARRIER`. Not `BROKER`. Not `FREIGHT FORWARDER`. If it says Broker, they don't have trucks — they're a middleman like you. Do not dispatch freight to a broker as if they're a carrier.

### 4. Authority Age (Date of Authority Issuance)
Calculate: today's date minus the "Operating Authority Effective Date."
- Under 180 days: **Reject.** Iron Rule.
- 180–365 days: Acceptable, but monitor closely.
- 1–3 years: Good.
- 3+ years: Established carrier.

### 5. Vehicle Out-of-Service Rate
The % of roadside inspections where the truck was pulled off the road.
- Industry average: ~20%
- Acceptable: under 30%
- Yellow flag: 30–40%
- Red flag: 40%+

### 6. Driver Out-of-Service Rate
The % of inspections where the driver was pulled off the road (fatigue, log violations, substance).
- Industry average: ~5%
- Acceptable: under 8%
- Red flag: 10%+

### 7. Crashes (Last 24 months)
Shows total crashes. More important: **fault vs. non-fault.**
- Non-fault (e.g., someone rear-ended them): less concerning
- At-fault crashes: major red flag for medical freight
- 2+ at-fault crashes in 24 months: recommend rejection, escalate to owner

---

## Mock SAFER Record — Read This and Score It

```
COMPANY: Blue Horizon Transport LLC
MC NUMBER: MC-8842361
DOT NUMBER: 4129873
OPERATING STATUS: ACTIVE
ENTITY TYPE: CARRIER
SAFETY RATING: UNRATED
AUTHORITY EFFECTIVE DATE: September 14, 2024
CARGO CARRIED: General Freight, Medical Devices, Household Goods

INSURANCE ON FILE:
  Auto Liability: $1,000,000 (expires March 2027)
  Cargo: $75,000 (expires March 2027)

INSPECTIONS (24 months):
  Total vehicle inspections: 12
  Vehicle OOS: 2 (16.7%)
  Driver OOS: 1 (8.3%)

CRASHES (24 months):
  Total: 1
  Fatal: 0
  Injury: 0
  Tow-away: 1 (tow-away means vehicle couldn't drive away)
  Fault: Non-reportable (weather event)
```

---

## Practice Questions

**Question 1:** What is today's date (use April 2, 2026)? How many days has Blue Horizon had active authority?

*Expected: Sept 14, 2024 to April 2, 2026 = ~566 days. That's over 180 days. Authority age passes.*

**Question 2:** Look at the cargo insurance. What's wrong?

*Expected: Cargo insurance is $75,000. Erin's minimum is $100,000. This is $25,000 short. Compliance would flag this. Cannot dispatch until carrier increases coverage or you get a certificate showing higher coverage.*

**Question 3:** The crash was classified "non-reportable (weather event)" — does that change your assessment?

*Expected: Somewhat. A weather-related, non-fault tow-away is less concerning than a driver-error crash. However, it still happened. For medical freight where on-time delivery matters, this would be noted in the carrier's file but probably wouldn't block dispatch. Flag it in Airtable.*

**Question 4:** The driver OOS rate is 8.3% — just above the 8% threshold. What do you do?

*Expected: Flag it in the carrier profile. It doesn't automatically disqualify, but it means one driver had a violation in 12 inspections. If this carrier runs consistent lanes for you, monitor the next 90 days for any new violations.*

**Question 5:** Given everything above, is Blue Horizon a Pass or Fail for dispatch? What needs to happen first?

*Expected: Conditional pass — the carrier passes most checks (authority active, age OK, safety rating OK, crashes non-fault, OOS rates borderline acceptable), but the cargo insurance must be increased to at least $100K before first dispatch. Request updated certificate of insurance.*

---

## Mastery Check

You receive a new carrier application. Here's their SAFER data:

```
Status: ACTIVE
Entity Type: CARRIER
Safety Rating: CONDITIONAL
Authority Age: 847 days
Auto Liability: $1,000,000
Cargo: $100,000
Vehicle OOS: 11%
Driver OOS: 3%
Crashes (24mo): 0
```

This carrier has zero crashes, good insurance, and strong OOS rates. Should Erin dispatch them?

*Expected: NO. The safety rating is CONDITIONAL. This is an Iron Rule — Erin never dispatches a Conditional carrier regardless of how good everything else looks. A Conditional rating means FMCSA found real safety deficiencies during an audit. Even with zero crashes, the underlying issues that caused the Conditional rating are still present. Escalate to owner if the carrier insists they've resolved the issues — owner decides whether to wait for the rating to be upgraded to Satisfactory.*

---

## You're Done

Your answers are logged to `data/sops/library.json` under `carrier_vetting`.

**Next:** `/workshop:trial-to-paid` — converting a free trial carrier into a paying client.
