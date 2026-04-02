# Maya's Intelligence — Carrier Packet Requirements

Maya knows exactly what every carrier must submit before their first load is dispatched.
She uses this to vet onboarding packets, flag missing documents, and brief the owner.

---

## What a Carrier Packet Is

A carrier packet is the set of documents a carrier submits to work with us.
Think of it like a job application — if any required document is missing or expired, the carrier cannot haul.
Maya reviews every packet before Erin dispatches a single load.

---

## Required Documents — USA Carriers

| Document | What It Is | Red Flags |
|---|---|---|
| MC Authority Certificate | Proof the carrier is legally registered to haul freight for hire | Under 180 days old = Iron Rule violation |
| USDOT Certificate | Federal operating authority number | Must match FMCSA SAFER database |
| Certificate of Insurance — Cargo | Covers the freight being hauled | Min $100,000 cargo coverage |
| Certificate of Insurance — Liability | Covers accidents on the road | Min $750,000 auto liability (medical freight: $1M recommended) |
| W-9 | Tax form for IRS reporting | Must match carrier legal name exactly |
| Void Check or Bank Letter | For direct deposit payment | Name on account must match carrier entity |
| Driver's License (copy) | For primary driver on account | Must be current, not expired |
| Truck Registration | Proof of ownership or lease | VIN must match what carrier listed |

---

## Required Documents — Cross-Border (USA ↔ Canada)

Everything in USA list PLUS:
| Document | What It Is |
|---|---|
| NSC Number | National Safety Code — Canada's version of MC# |
| PARS Number | Pre-Arrival Review System — customs for Canada-bound loads |
| PAPS Number | Pre-Arrival Processing System — customs for USA-bound loads |
| FAST Card (preferred) | Free and Secure Trade — speeds border crossing |

---

## Medical Freight Additional Requirements

For carriers hauling medical supplies, pharma, or devices:
| Requirement | Why |
|---|---|
| GDP Certification (if pharma) | Good Distribution Practice — FDA/EU requirement |
| Temperature log capability | Even dry van medical needs temp monitoring for some cargo |
| Chain of custody procedure | Who had the freight and when — required for pharma |
| Clean inspection history | No cargo contamination violations in last 2 years |

---

## Maya's Packet Review Protocol

When a carrier submits a packet, Maya checks in this order:

1. **MC# age check** — FMCSA SAFER lookup → under 180 days = instant block (Iron Rule #6)
2. **Safety rating** — Satisfactory or Unrated only → Conditional/Unsatisfactory = instant block (Iron Rule #5)
3. **Insurance currency** — All policies must be active, not expired
4. **Document completeness** — All 8 required docs present
5. **Name consistency** — Legal name matches across W-9, insurance, registration
6. **Medical addons** — If carrier will haul medical, check GDP and inspection history

**Score:** 8/8 = Approved. 6-7/8 = Conditional (missing items, 48hr grace). Under 6/8 = Rejected, notify owner via Telegram.

---

## Carrier Packet Status Tracking (Airtable)

Each carrier in Airtable Carriers table has:
- `packet_status`: pending | incomplete | complete | expired
- `packet_expiry_date`: insurance renewal date (Maya alerts 30 days before)
- `packet_last_reviewed`: last review timestamp
- `packet_flags`: any open issues

Maya checks expiry dates every morning and flags renewals in her 6AM report.

---

## BDR Intelligence — What Makes a Strong Carrier

Maya also uses this knowledge when qualifying new prospects:

**Strong carrier profile:**
- 2+ years in operation (authority > 730 days)
- Satisfactory safety rating
- 1-3 trucks (sweet spot for dispatch relationships)
- Dry van equipment only
- Runs regular lanes (not random nationwide)
- No cargo claims in last 12 months

**Weak carrier profile (proceed with caution):**
- Authority 180-365 days (newer — higher risk)
- Unrated safety (not bad, but unknown)
- More than 10 trucks (harder to control lane consistency)
- Previous cargo claims or violations

**Instant disqualify (never onboard):**
- Conditional or Unsatisfactory safety rating
- Authority under 180 days
- Expired or insufficient insurance
- Active DOT out-of-service order
