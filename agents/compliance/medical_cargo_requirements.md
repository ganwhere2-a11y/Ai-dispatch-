# Medical Cargo Compliance Requirements

This file is Compliance's medical freight rulebook.
DOT/FMCSA rules are the floor. Medical freight adds a second layer on top.
Both layers must pass before any medical load is approved.

---

## Why Medical Freight Has Extra Rules

Regular freight (paper, furniture, auto parts) only needs DOT compliance.
Medical freight — supplies, devices, pharmaceuticals — touches patient safety.
If it's handled wrong, patients get hurt. That's why the FDA and GDP rules exist.

**Our niche is dry van medical freight.** That means:
- Medical supplies (bandages, gloves, disposables)
- Medical devices (equipment, instruments, implants)
- Pharmaceuticals (dry — no cold chain required, but still GDP rules apply)
- Hospital consumables (IV bags, tubing, packaging)

---

## Layer 1 — Standard DOT/FMCSA (Always Required)

See `usa_requirements.md` for full detail. Summary:
- Valid MC authority (180+ days)
- Satisfactory or Unrated safety rating
- Active insurance (cargo + liability)
- No active out-of-service orders

---

## Layer 2 — Medical Freight (Required for All Our Loads)

### FDA Shipper Requirements
The shipper (hospital, pharma company, medical distributor) must be:
- FDA-registered if shipping prescription devices or drugs
- Able to provide product lot numbers on the BOL for traceability
- Compliant with 21 CFR Part 211 if pharmaceutical manufacturer

**Maya's check:** Ask shipper at onboarding — "Are you FDA-registered for this product type?" If yes, get registration number. If unsure, escalate to owner (Tier 3).

### GDP — Good Distribution Practice
GDP is the standard for how medical goods must be handled in transit.
Think of it like "clean hands" rules — specific, non-negotiable.

**GDP requirements for our dry van medical loads:**

| Requirement | What Compliance Checks |
|---|---|
| Temperature monitoring | Carrier must have a thermometer in the trailer. Range: 59°F–77°F (15°C–25°C) for most dry medical. |
| No co-loading with food or chemicals | Dry van must not co-load medical with food, pesticides, or hazmat |
| Clean trailer inspection | Driver confirms trailer is clean, dry, odor-free before loading |
| Chain of custody | Every handoff is documented: who loaded, who received, timestamp |
| Tamper evidence | Packaging must arrive sealed. Any tampering = immediate report to shipper and Maya |

### Cargo-Specific Rules

| Cargo Type | Additional Requirement |
|---|---|
| Prescription drugs (dry) | DEA registration check on shipper + GDP carrier cert preferred |
| Medical devices (Class II/III) | FDA 510(k) clearance on file with shipper — ask for device classification |
| Biologics / tissue / blood | **AUTO-ESCALATE TO TIER 3** — these are not standard dry van loads |
| Controlled substances | **AUTO-REJECT** — requires DEA Schedule handling we do not provide |
| Radiopharmaceuticals | **AUTO-REJECT** — requires radioactive materials handling license |
| Specimens / samples | **AUTO-ESCALATE TO TIER 3** — chain of custody requirements extreme |

---

## Iron Rule Addition — Medical Cargo Gate

The existing 8 Iron Rules cover load and carrier basics.
Medical cargo adds these additional auto-reject triggers:

```
MEDICAL IRON RULES:
1. Controlled substances → AUTO-REJECT, no exceptions
2. Radiopharmaceuticals → AUTO-REJECT, no exceptions
3. Biologics / human tissue / blood → AUTO-ESCALATE Tier 3 before any action
4. Specimens → AUTO-ESCALATE Tier 3 before any action
5. Carrier with active cargo contamination violation → AUTO-BLOCK
6. Trailer without clean inspection confirmation → DO NOT DISPATCH
```

---

## EU Medical Freight (Context: EUROPE — when active)

GDP in Europe is regulated by the European Medicines Agency (EMA).
Requirements when ACTIVE_CONTEXT=EUROPE:
- Carrier must hold a GDP certificate from a national competent authority
- Wholesale distribution authorization (WDA) for pharma loads
- Temperature mapping report for trailers used on pharma routes
- Qualified Person for Distribution (QPD) named on carrier's GDP cert

**These are Iron Rules for EU medical loads — no GDP cert = no dispatch.**

See `eu_requirements.md` for full EU compliance stack.

---

## Compliance Checklist — Medical Load Sign-Off

Before Erin books any medical load, Compliance runs this check:

```
☐ Carrier has valid MC authority (180+ days)
☐ Carrier safety rating: Satisfactory or Unrated
☐ Cargo type is NOT on auto-reject list
☐ Trailer clean inspection confirmed by driver
☐ Temperature monitoring in place (if required)
☐ No co-loading with food/chemicals
☐ BOL includes lot numbers / product description
☐ Chain of custody form ready
☐ Shipper FDA-registered (if prescription product)
```

8/8 = Green light for Erin to book.
Any ☐ unchecked = hold load, flag to Maya, wait for resolution.
Any auto-reject trigger hit = immediate block, log to decisions, notify Maya.
