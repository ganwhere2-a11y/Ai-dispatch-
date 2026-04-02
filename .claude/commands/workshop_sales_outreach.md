# Workshop: Sales Outreach — Finding Carriers and Shippers

## What You'll Learn
Where Sales finds leads, how the 4-email outreach sequence works, what to say in each email, and when to stop chasing a prospect and move on.

---

## The Lesson

**Two types of leads:**

**Carrier Leads** — owner-operators and small fleets (1–20 trucks) who need a dispatcher
- They need: consistent loads, no more searching load boards 4 hours/day, someone to handle the paperwork
- Your pitch: free trial + 8% commission only when you find them loads

**Shipper Leads** — medical facilities and distributors who have freight to move
- They need: reliable carriers for medical supplies, someone who vets the carriers, fast quotes
- Your pitch: specialized medical freight dispatch, vetted carriers, 24/7 receptionist

**Where Sales finds carrier leads:**

1. **FMCSA SAFER Database** — free, public, searchable by state and equipment type.
   Search URL format: `https://safer.fmcsa.dot.gov/CompanySnapshot.aspx`
   Filter for: Active authority, Carrier entity, Dry van equipment, specific states.
   Extract: company name, MC#, DOT#, contact address (find phone/email via DOT lookup).

2. **Load Boards (DAT/Truckstop)** — carriers who post their trucks available are actively looking for loads. These are warm leads.

3. **Inbound from Receptionist** — carriers who call in are the warmest leads. They already found you.

4. **Referrals from existing carriers** — the best source after month 3.

**Where Sales finds shipper leads:**

1. **Google Maps API** — search "hospital", "medical clinic", "surgery center", "medical distributor" by zip code or state. Extract name, address, phone.
   Search terms: "hospital supply chain", "medical device distributor", "pharmacy distribution center"

2. **LinkedIn** — search for "Supply Chain Manager", "Logistics Director", "Transportation Manager" at hospitals, health systems, pharma companies.

3. **Medical industry directories** — GPO (Group Purchasing Organization) member lists, AHRMM (hospital supply chain association), HDMA (healthcare distributor).

---

## The 4-Email Carrier Outreach Sequence

**Timing:** Day 0, Day 3, Day 7, Day 14. Then stop (archive for 90 days).

**Step 0 — Introduction (Day 0)**
Subject: "Free 7-day dispatch trial for {first_name} at {company}"
Tone: Direct, friendly, no fluff.
Content:
- One sentence about who you are
- What the free trial offers (7 days of real dispatch, no commitment)
- One clear CTA: "Reply YES to start your trial" or link to signup form
Length: 5 sentences max.

**Step 1 — Follow-up (Day 3)**
Subject: "Quick follow-up — dispatch trial for {company}"
Tone: Casual, no pressure.
Content:
- Reference the first email (don't pretend they didn't get it)
- Add one piece of social proof: "Other carriers in {state} are averaging $X/load with us"
- Softer CTA: "Worth a 5-minute call?"
Length: 4 sentences.

**Step 2 — Trial Offer (Day 7)**
Subject: "Last reminder — your free trial expires soon"
Tone: Slightly more direct.
Content:
- Remind them what the trial includes
- Address the most common objection pre-emptively: "No commitment. We only make money when you do."
- Clear CTA: "Start your free trial this week"
Length: 6 sentences.

**Step 3 — Last Chance (Day 14)**
Subject: "Closing out your file, {first_name}"
Tone: Honest and brief.
Content:
- Tell them you're closing out your prospect list
- Leave the door open: "If timing changes, reach out — your info stays in our system"
- One last CTA
Length: 3 sentences. No pressure. Just close cleanly.

After Step 3: Move to cold archive. No contact for 90 days, then re-activate with a fresh Step 0.

---

## Lead Quality Scoring (0–10)

Sales scores every lead before sending to the outreach queue:

| Factor | Score Weight | What Good Looks Like |
|---|---|---|
| Truck count | 3 pts | 3–10 trucks = ideal. 1 truck = lower priority. 20+ = high value, escalate to Maya. |
| Medical freight experience | 2 pts | Has "medical" or "pharma" in cargo types on SAFER |
| Lane match | 2 pts | Operates in lanes where you have shipper demand |
| Response rate (past outreach) | 2 pts | Replied to anything before = warm |
| Authority age | 1 pt | 1–3 years = stable and established |

Score 7+: Priority outreach — go to front of queue.
Score 4–6: Standard sequence.
Score below 4: Don't contact. Not a fit.

**Disqualification criteria (stop immediately):**
- Conditional or Unsatisfactory safety rating
- Less than 180 days authority age
- Operates reefer, flatbed, or hazmat only (Erin doesn't dispatch those)
- Located in Florida as home base (Iron Rule extends to FL-centric carriers)

---

## Practice Questions

**Question 1:** Sales found a carrier with 1 truck, dry van, authority age 240 days, no medical experience, operates Texas lanes. What's the lead score?

*Expected: Truck count: 1 truck = 1pt. Medical experience: none = 0pt. Lane match: depends on shipper demand in TX. Authority age: 240 days = 1pt. Response rate: unknown = 0pt. Total: ~2-3 pts. Below threshold — low priority, only contact if queue is thin.*

**Question 2:** A carrier emails back after Step 0 saying "Tell me more." What happens next?

*Expected: They're a warm lead — Sales moves them out of the standard sequence and into a direct conversation flow. Reply with the full trial offer, send the signup link or book a 5-minute call. Do not keep sending the automated sequence — they're engaged.*

**Question 3:** When should Sales escalate a lead to Maya?

*Expected: Carrier with 10+ trucks (high-value), or a major medical facility (hospital system, national distributor). Maya logs it as Tier 2 and flags for owner's attention — these accounts warrant a personal touch from the owner, not just automated outreach.*

**Question 4:** What is Sales NOT allowed to do?

*Expected: Cannot promise specific load volumes, cannot negotiate commission rates, cannot promise the owner will be personally involved, cannot contact international prospects (Canada/EU) without owner's approval, cannot send more than 50 emails per day.*

---

## Mastery Check

Sales has 3 leads in the queue. Rank them and explain why:

**Lead A:** 8 trucks, dry van, SAFER shows "Medical Devices" in cargo types, operates IL/IN/OH lanes, authority 3.5 years, never contacted before.

**Lead B:** 1 truck, dry van, no medical experience, FL-based, authority 200 days.

**Lead C:** 15 trucks, dry van + reefer mix, no medical experience, TX-based, authority 5 years, replied to a cold email 2 months ago.

*Expected ranking:*
*1. Lead A — Score ~8. Medical experience, right equipment, strong lanes, established. Priority outreach.*
*2. Lead C — Score ~6 but with a caveat: 15 trucks = high value, escalate to Maya. However, reefer trucks can't be dispatched by Erin. Check if they have any dry van units. If dry van is in the mix, pursue. If reefer-only, disqualify.*
*3. Lead B — Disqualify. Florida home base = Iron Rule. Don't contact.*

---

## You're Done

Your answers are logged to `data/sops/library.json` under `sales_outreach`.

**Next:** `/workshop:command-center` — how to read Maya's daily report and use your dashboard.
