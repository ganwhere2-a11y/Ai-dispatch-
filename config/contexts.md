# Market Contexts

This file defines the three operating markets. Each agent loads the active context
from the ACTIVE_CONTEXT environment variable. Switch contexts with one tap in the
Command Center or by updating .env.

## USA (Active — Phase 1)

- **Regulations**: FMCSA, DOT, federal trucking regs
- **Carrier vetting**: FMCSA SAFER API, MC authority, DOT number
- **Currency**: USD
- **Load boards**: DAT, Truckstop.com
- **Cargo focus**: Dry van, medical supplies, DME
- **Iron Rules**: All 8 rules apply (see agents/erin/iron_rules.md)
- **Commission**: 8% existing carriers, 10% new (after 90 days)
- **Invoicing**: Standard US net-30/net-60, factoring via OTR Capital/TBS
- **Status**: LIVE

## Canada (Phase 3 — Months 6-8)

- **Regulations**: Transport Canada, CFIA for cross-border, CUSMA/USMCA docs
- **Carrier vetting**: National Safety Code (NSC), CVOR (Ontario), carrier safety ratings
- **Currency**: CAD (converted to USD for reporting)
- **Load boards**: DAT (Canada), Loadlink
- **Cargo focus**: Dry van, medical supplies
- **Iron Rules**: All 8 rules apply. No Florida equivalent = no territories with poor lane volume.
- **Cross-border**: CUSMA paperwork, customs broker integration required
- **Status**: NOT YET ACTIVE — build compliance module first

## Europe (Phase 4 — Months 10-12)

- **Regulations**: EU GDP (Good Distribution Practice) for pharma, CMR Convention for freight docs
- **Carrier vetting**: Euro Carrier database, VAT registration, ADR cert for hazmat
- **Currency**: EUR (converted to USD for reporting)
- **Load boards**: Timocom, Teleroute, CargoX
- **Cargo focus**: Dry van, medical devices, pharma (GDP-compliant)
- **Language**: English primary, local language templates for key markets (DE, FR, NL)
- **Iron Rules**: All 8 rules apply with European equivalents
- **Entity**: EU LLC / subsidiary structure needed (consult legal)
- **Status**: NOT YET ACTIVE — research phase

## Context Switching

To switch context, update .env:
```
ACTIVE_CONTEXT=USA   # or CANADA or EUROPE
```

All agents read process.env.ACTIVE_CONTEXT at startup and load the appropriate
rules, rate benchmarks, and compliance requirements for that market.
