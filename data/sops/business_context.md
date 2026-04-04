# Business Context
## What AI Dispatch Is and How It Operates Today

**Last updated:** 2026-04-02

---

## What We Do

AI Dispatch is an AI-native freight dispatch company. We dispatch dry van carriers across the USA. We find loads, negotiate rates, handle paperwork, and manage carrier relationships — all through autonomous AI agents.

The owner does not dispatch manually. The agents do it. The owner only makes Tier 2+ decisions (quotes over $5K, new carrier first loads, trial conversions, contracts).

---

## Who We Serve

**Primary ICP:** Dry Van carriers, 1–5 trucks, USA-based  
- MC authority active 30+ days  
- Satisfactory or Unrated safety rating  
- Running dry van (no reefer, hazmat, flatbed, oversized)  
- Looking for consistent loads without managing a broker relationship themselves  

**Secondary:** Fleet companies with 5–20 trucks ready to outsource dispatch entirely

**Special account:** Uncle Kenneth — personal truck, dedicated carrier profile at `data/kenneth/kenneth_profile.md`

---

## How We Make Money

| Revenue Type | Rate | Trigger |
|---|---|---|
| Dispatch commission (existing carrier) | 8% of gross load rate | Per load booked |
| Dispatch commission (new carrier, first 90 days) | 10% of gross load rate | Per load booked |
| Monthly dispatch retainer (paid tier) | $350/month | After 7-day trial converts |

**Revenue target:** $68,000/week = $272,000/month at full scale

---

## Current Business State (update regularly)

- Active market: USA
- Trucks under management: 4
- Trial prospects active: 3
- Weekly revenue: ~$11,240 (early stage)
- Agents running: 9 (Maya, Erin, Compliance, Sales, Onboarding, Support, Receptionist, Marketer, CEO Shadow)

---

## How We Acquire Carriers

1. **FMCSA scraping** — Sales agent scrapes FMCSA database for qualifying carriers (dry van, 30+ days authority, satisfactory rating)
2. **Outreach sequence** — 4-email sequence over 10 days, personalized per carrier profile
3. **Inbound calls** — Receptionist handles 24/7 via Retell AI, routes qualified leads to Onboarding
4. **Ads (future)** — SDR agents targeting 500–1,000 carrier prospects via paid ads

---

## What Is Working

- Iron Rules enforcement — zero bad loads getting through
- FMCSA scraping pipeline — consistent lead flow
- Maya morning reports — owner gets full picture in under 60 seconds
- 7-day trial funnel — low friction entry point for new carriers

---

## What Needs Work

- Airtable fully populated (currently partial data)
- Retell AI live call handling (configured, not fully tested)
- Telegram alert delivery (configured, needs live test)
- Revenue tracking from load records (currently manual)
- Canada, EU, and UK compliance layers not yet built (Year 2)

---

## The 8 Iron Rules (enforced by Erin + Compliance, non-negotiable)

1. No Florida — any FL origin or destination → auto-reject
2. Minimum RPM: below $2.51 → reject; $2.51–$2.74 → counter at $2.75; $2.75+ → accept; $3.00+ → prioritize
3. Max deadhead: max(50 miles, 25% of loaded miles) — stricter rule wins
4. Max weight: 48,000 lbs cargo maximum
5. Safety rating: Satisfactory or Unrated only
6. Authority age: MC active 30+ days minimum
7. Cargo type: dry van only
8. Shipper RPM floor: direct contracts also meet $2.51/mile minimum

---

## Team Structure (AI agents, no human employees)

| Agent | Role |
|---|---|
| Maya | Executive assistant, morning reports, escalation routing |
| Erin | Dispatcher, Iron Rules enforcer, load pipeline |
| Compliance | Carrier vetting, FMCSA, authority verification |
| Sales | Lead gen, FMCSA scraping, 4-email outreach |
| Onboarding | 7-day trial funnel, carrier setup |
| Support | Retention, complaint triage |
| Receptionist | 24/7 voice AI, call routing, lead capture |
| Marketer | TikTok/YouTube scripts, content calendar |
| CEO Shadow | Decision pattern learning, Phase 1 → proxy |

**Human decisions:** Owner only — Tier 2+ (quotes >$5K, new carrier first load, trial conversion, contracts, new markets)
