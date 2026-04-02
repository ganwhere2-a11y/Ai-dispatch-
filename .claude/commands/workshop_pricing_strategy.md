# Workshop: Erin's Pricing Strategy & Profit Formula

## What You'll Learn
How Erin evaluates every load using a real profit formula — not just rate per mile. Why a high RPM load can still be a money-loser. How the 8%/10% commission structure works. And how to spot a load that looks good but isn't.

---

## The Lesson

**The Core Formula:**

```
Revenue   = Loaded Miles × Rate Per Mile
Cost      = (Loaded Miles + Deadhead Miles) × $1.70
Profit    = Revenue − Cost
True RPM  = Profit ÷ Loaded Miles
```

**Why $1.70/mile?**
That's the all-in cost estimate for operating a dry van truck: fuel, maintenance, insurance, driver pay. It's a conservative industry estimate. Erin uses this as the cost baseline for every load.

**Why does deadhead matter?**
The carrier drives empty to pick up the load. That costs money but generates zero revenue. A 400-mile loaded trip with 200 miles of deadhead means the carrier actually drove 600 miles — but only got paid for 400.

**Erin's Four Profit Tiers:**
| Profit | Tier | Erin's Action |
|---|---|---|
| Negative | LOSS | Auto-reject. Always. |
| $0–$199 | BORDERLINE | Reject unless nothing better available |
| $200–$399 | DECENT | Book if carrier wants it |
| $400+ | STRONG | Prioritize. Book first. |

**The Iron Rule for RPM:**
- Below $2.51/mile (True RPM): **Auto-reject**
- $2.51–$2.74: Acceptable
- $2.75–$2.99: Good
- $3.00+: Priority load

**The 8%/10% Commission:**
```
carrier_quote = what the carrier will accept for the lane
commission    = carrier_quote × 0.08 (existing) or × 0.10 (new carrier after 3 months)
client_rate   = carrier_quote + commission
your_gross    = commission
```

Erin builds this in automatically. The carrier sees their number. The client sees their number. You keep the spread.

---

## Practice Examples

**Example A: The Deceptive High-RPM Load**

Load details:
- Loaded miles: 150
- Deadhead miles: 120
- Rate per mile: $3.50

```
Revenue = 150 × $3.50 = $525
Cost    = (150 + 120) × $1.70 = 270 × $1.70 = $459
Profit  = $525 − $459 = $66
True RPM = $66 ÷ 150 = $0.44/mile
```

**Result: LOSS tier (profit $66 is actually decent, wait — recalculate)**

Wait — $66 profit puts this in BORDERLINE. But look at the True RPM: $0.44. That's nowhere near $2.51. Why? Because the carrier is driving 120 miles empty to get 150 miles of work. The deadhead is 80% of the loaded miles — that's extreme.

**Erin's verdict: Reject.** The deadhead also exceeds the Iron Rule (max 50mi deadhead AND max 25% of loaded miles — 120mi is way over both).

---

**Example B: The Solid Load**

Load details:
- Loaded miles: 380
- Deadhead miles: 35
- Rate per mile: $2.95

```
Revenue = 380 × $2.95 = $1,121
Cost    = (380 + 35) × $1.70 = 415 × $1.70 = $705.50
Profit  = $1,121 − $705.50 = $415.50
True RPM = $415.50 ÷ 380 = $1.09/mile
```

Profit: $415.50 → **STRONG tier**
Deadhead: 35 miles ✓ (under 50mi cap)
Deadhead %: 35 ÷ 380 = 9.2% ✓ (under 25%)
Rate per mile: $2.95 ✓ (above $2.51 minimum)

**Erin's verdict: Book it. Strong load.**

---

**Example C: The Trap**

Load details:
- Loaded miles: 620
- Deadhead miles: 45
- Rate per mile: $2.10

```
Revenue = 620 × $2.10 = $1,302
Cost    = (620 + 45) × $1.70 = 665 × $1.70 = $1,130.50
Profit  = $1,302 − $1,130.50 = $171.50
True RPM = $171.50 ÷ 620 = $0.28/mile
```

Rate per mile is $2.10 — **below the $2.51 Iron Rule minimum.**

**Erin's verdict: Auto-reject.** The rate per mile alone fails the Iron Rule before Erin even runs the profit formula.

---

## Practice Questions

**Question 1:** Calculate profit for: 280 loaded miles, 40 deadhead, $3.20/mile rate. What profit tier?

*Expected: Revenue = $896. Cost = (280+40) × $1.70 = $544. Profit = $352. DECENT tier.*

**Question 2:** A carrier quotes $2,400 for a load. You charge 8% commission. What does the client pay? What's your cut?

*Expected: Commission = $192. Client pays $2,592. Your gross = $192.*

**Question 3:** Same carrier but it's a new carrier 4 months into the relationship. What commission rate applies?

*Expected: 10%. They're past the 3-month mark, so the new carrier rate applies. Commission = $240. Client pays $2,640.*

**Question 4:** Why does Erin run the profit formula BEFORE checking if the load matches a carrier?

*Expected: No point finding a carrier for a load that doesn't make money. The profit check is the first gate — if it fails, the load never moves forward. This saves time and keeps the carrier network trusted.*

---

## Mastery Check

A medical supply shipper needs 2 pallets moved from Indianapolis to Columbus OH (175 miles). Carrier is 25 miles from the shipper (deadhead). Carrier quotes $2.85/mile. This carrier has been with you for 6 months.

Calculate:
1. Revenue, Cost, Profit, Profit Tier
2. Does this pass all Iron Rules? (RPM, deadhead cap, deadhead %)
3. What does the client pay (with correct commission rate)?
4. What's your gross commission?

*Expected:*
*1. Revenue = $498.75. Cost = (175+25) × $1.70 = $340. Profit = $158.75. BORDERLINE tier.*
*2. RPM = $2.85 ✓. Deadhead 25mi ✓. Deadhead % = 25/175 = 14.3% ✓. All Iron Rules pass.*
*3. Carrier has been active 6 months → 10% rate. Client pays $498.75 × 1.10 = $548.63*
*4. Commission = $49.88*

---

## You're Done

Your answers are logged to `data/sops/library.json` under `pricing_strategy`.

**Next:** `/workshop:carrier-vetting` — how to read a full FMCSA record and spot red flags fast.
