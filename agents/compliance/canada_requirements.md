# Canada Compliance Requirements — Erin & Compliance Agent Reference

**Version:** 1.0  
**Last Updated:** 2026-04-01  
**Applies To:** All cross-border Canada loads dispatched by Erin or reviewed by Compliance Agent  
**Authority:** Transport Canada, CBSA, CFIA, Provincial Transport Ministries

---

## 1. Transport Canada Overview

Transport Canada is the federal department responsible for transportation policies, programs, and safety regulations across Canada. For freight carriers operating in or into Canada, the relevant division is the **Motor Carrier Safety** unit, which works alongside provincial governments because road transport in Canada operates under a dual-jurisdiction model (federal framework, provincial enforcement).

**Key federal legislation:**
- *Motor Vehicle Transport Act (MVTA)* — establishes federal oversight framework
- *Transportation of Dangerous Goods Act (TDGA)* — governs hazmat transport
- *Commercial Vehicle Drivers Hours of Service Regulations* (SOR/2005-313)
- *Vehicle Weights and Dimensions for Interprovincial Operations* regulations

**Important distinction for Erin:** Unlike the USA where FMCSA is a single federal authority, Canadian carrier regulation is shared between Transport Canada (federal standards) and provincial transport ministries (registration, enforcement, licensing). A carrier operating across multiple provinces must comply with each province's rules AND federal standards. Cross-border US carriers must comply with both their FMCSA authority AND relevant Canadian provincial/federal rules.

---

## 2. CVOR — Commercial Vehicle Operator's Registration

### What It Is

CVOR (Commercial Vehicle Operator's Registration) is an **Ontario-specific** carrier safety registration system administered by the Ministry of Transportation Ontario (MTO). It is the primary safety tracking record for commercial vehicles operating in Ontario.

Do not confuse CVOR with a national Canadian carrier registration — it is Ontario-only. Other provinces have equivalent systems:
- **Quebec:** Cote de Securite (Safety Rating) under the SAAQ
- **British Columbia:** NSC (National Safety Code) carrier profile via CVSE
- **Alberta:** NSC carrier profile via Alberta Transportation
- **Other provinces:** NSC carrier safety program administered provincially

### What CVOR Tracks

A CVOR record contains:
- Fleet size and vehicle classification
- Collision history (convictions assigned to operator record)
- Inspection results (roadside inspections, facility audits)
- CVOR certificate status: **Clear, Conditional, or Unsatisfactory**
- Violation convictions (HOS, weight, maintenance, etc.)

### How to Verify a Canadian Carrier's CVOR (Ontario)

1. Go to: `https://www.ontario.ca/page/commercial-vehicle-operator-registration`
2. Use the **"Check a Carrier"** public search tool at MTO's carrier safety portal
3. Enter the CVOR number or company name
4. Confirm status is **"Clear"** — do not accept **"Conditional"** or **"Unsatisfactory"**
5. Verify fleet size matches what the carrier represented
6. Note any collision rate percentage — flag anything above 50% of the provincial average threshold

### NSC Safety Rating (National Safety Code — All Provinces)

For provinces outside Ontario, the equivalent check is the **NSC carrier profile**:
- Administered through each province's transport authority
- Ratings: **Satisfactory-Unaudited, Satisfactory, Conditional, Unsatisfactory**
- **Erin's rule:** Accept only **Satisfactory** or **Satisfactory-Unaudited** (equivalent to FMCSA Unrated + Satisfactory policy)
- Never dispatch to a carrier with **Conditional** or **Unsatisfactory** NSC rating

### Canadian Carrier Safety Lookup Resources

| Province | Resource | URL |
|---|---|---|
| Ontario | CVOR Public Search | mto.gov.on.ca |
| British Columbia | CVSE SafetyNet | cvse.ca |
| Alberta | Alberta Transportation Carrier Profile | alberta.ca/transportation |
| Quebec | SAAQ Carrier Safety | saaq.gouv.qc.ca |
| All provinces (federal FMCSA equivalent) | Transport Canada Carrier Profile | tc.canada.ca |

---

## 3. CUSMA/USMCA Cross-Border Documentation

### Overview

The **Canada-United States-Mexico Agreement (CUSMA)**, known in the US as USMCA, governs cross-border trade between the three nations. It replaced NAFTA in July 2020. For freight purposes, CUSMA affects customs treatment, rules of origin for medical devices and pharmaceuticals, and tariff classifications.

### Key CUSMA Documents for Cross-Border Freight

**1. CUSMA Certificate of Origin**
- Required when goods qualify for preferential tariff treatment under CUSMA
- Can be completed by the exporter, producer, or importer
- Must certify the goods meet CUSMA rules of origin
- No prescribed form — can be a commercial invoice statement or standalone certificate
- Must be retained for **5 years** by all parties

**2. Canada Customs Invoice (CCI)**
- Required for commercial shipments entering Canada valued over **CAD $3,300**
- Fields required: seller, buyer, country of origin, quantity, description, value, currency, terms of sale
- Erin must confirm the shipper has prepared a CCI before dispatching a cross-border load

**3. CBSA Form B3 — Canada Customs Coding Form**
- Filed by the licensed customs broker on entry into Canada
- Erin does not file this, but must confirm the shipper has a customs broker engaged
- Medical devices and pharmaceutical goods fall under specific HS codes — broker must classify correctly

**4. ACE/ACI eManifest**
- **ACI (Advance Commercial Information):** Canadian equivalent of ACE; required for all commercial truck shipments entering Canada
- Must be submitted to CBSA **at least 1 hour before arrival** at the border
- The carrier or their agent must transmit the eManifest through CBSA's eManifest portal
- Erin must confirm the carrier has ACI eManifest capability before booking cross-border loads

### Border Crossing Process (Truck Freight, US to Canada)

1. Shipper/exporter prepares commercial invoice, packing list, CUSMA certificate if applicable
2. Carrier (or broker) submits ACI eManifest at least 1 hour prior
3. Carrier arrives at designated Port of Entry (POE)
4. CBSA officer reviews documents, may inspect cargo
5. If medical/pharmaceutical: additional CFIA or Health Canada checks may apply
6. Entry is recorded; duty/tax assessed (GST/HST)
7. Carrier proceeds to delivery

---

## 4. CFIA — Canadian Food Inspection Agency

### Relevance to Medical Freight

While CFIA primarily governs food and agricultural products, it has regulatory overlap with **medical freight** in the following scenarios:

- **Combination shipments:** If a dry van load contains both medical supplies and any food products (e.g., hospital nutrition products like Ensure, IV glucose, enteral feeding supplies), CFIA rules apply to the food component
- **Biologics and vaccines transported with cold chain requirements:** May require CFIA-equivalent documentation from Health Canada's Biologics and Genetic Therapies Directorate
- **Natural Health Products:** Regulated by Health Canada; require import permits

### CFIA Import Requirements

For shipments containing CFIA-regulated goods:
1. Importer must have a **Safe Food for Canadians licence** (SFCL) if importing food
2. **Prior Notice** must be submitted via CBSA's CFIA Prior Notice system
3. Shipment must arrive at a CFIA-designated point of entry
4. Documentation: commercial invoice, bill of lading, certificate of origin, any applicable import permits

**Erin's action:** If a load contains any food-adjacent medical nutrition products, flag to Compliance Agent before booking. Pure pharmaceutical and medical device loads (no nutritional food content) do not trigger CFIA.

---

## 5. Canadian Carrier Safety Rating System

### National Safety Code (NSC) Framework

Canada's carrier safety system is built on the **National Safety Code (NSC)**, a set of 16 safety standards developed cooperatively by Transport Canada and the provinces/territories. Each province enforces NSC standards through its own carrier registration system.

**NSC Safety Ratings:**

| Rating | Meaning | Erin's Policy |
|---|---|---|
| Satisfactory | Carrier has been audited and meets all NSC standards | APPROVED |
| Satisfactory-Unaudited | Carrier is registered but not yet audited — equivalent to FMCSA "Unrated" | APPROVED |
| Conditional | Carrier has identified deficiencies; under improvement plan | REJECTED |
| Unsatisfactory | Carrier has failed audit; operating authority may be suspended | REJECTED |

### How Canadian Safety Ratings Compare to FMCSA

| FMCSA (USA) | NSC/CVOR (Canada) | Erin's Decision |
|---|---|---|
| Satisfactory | Satisfactory | Accept |
| Unrated | Satisfactory-Unaudited | Accept |
| Conditional | Conditional | Reject |
| Unsatisfactory | Unsatisfactory | Reject |
| Out of Service | Cancelled/Suspended | Reject — never |

### Canadian Carrier Authority Verification

Unlike FMCSA where a carrier's MC number confirms interstate authority, Canadian carriers operating interprovincially need:
- Valid NSC carrier number (provincial registration)
- For Ontario: valid CVOR certificate
- For US-Canada cross-border: must also hold valid FMCSA authority if operating US legs

**Verify at:** Transport Canada Carrier Profile System (federal), or provincial transport ministry portal

---

## 6. Key Differences from USA Regulations

### Hours of Service (HOS)

Canadian HOS is governed by **SOR/2005-313** (Commercial Vehicle Drivers Hours of Service Regulations) and differs meaningfully from FMCSA HOS:

| Rule | USA (FMCSA) | Canada (SOR/2005-313) |
|---|---|---|
| Daily driving limit | 11 hours | 13 hours |
| Daily on-duty limit | 14 hours | 14 hours |
| Off-duty reset | 10 consecutive hours | 10 hours (8 off-duty + 2 sleeper OR 10 consecutive) |
| Weekly cycle options | 60h/7 days or 70h/8 days | Cycle 1: 70h/7 days; Cycle 2: 120h/14 days |
| 30-minute break rule | Required after 8h driving | Not required |
| ELD mandate | Yes (FMCSA ELD rule) | Yes (Canada ELD rule, phased in) |

**Practical implication for Erin:** A Canadian carrier driving a cross-border load is subject to the HOS rules of the country they are currently operating in. On the US leg: FMCSA rules. On the Canadian leg: Canadian federal/provincial rules. Carriers must log both.

### Weight Limits

Canada uses **metric tonnes** for federal weight regulations and has higher allowable gross vehicle weights on some routes compared to the USA:

| Metric | USA (Federal) | Canada (Federal/Interprovincial) |
|---|---|---|
| Gross Vehicle Weight | 80,000 lbs (36,287 kg) | 63,500 kg (~139,993 lbs) on Trans-Canada Highway corridors with permit |
| Standard GVW | 80,000 lbs | 36,000-40,000 kg depending on axle configuration |
| Steer axle | 12,000 lbs | 5,500 kg (12,125 lbs) |
| Drive axle (tandem) | 34,000 lbs | 17,000 kg (37,478 lbs) |
| Trailer axle (tandem) | 34,000 lbs | 17,000 kg (37,478 lbs) |

**Erin's Iron Rule still applies regardless of Canadian limits:** Maximum 48,000 lbs for any load dispatched through this system.

### Provincial vs. Federal Jurisdiction

Unlike the USA where FMCSA is the dominant federal authority for interstate freight, Canada has a more complex split:

- **Federal jurisdiction:** Sets NSC standards, regulates interprovincial and international (cross-border) carriers, administers TDGA for dangerous goods
- **Provincial jurisdiction:** Issues carrier operating licenses, conducts roadside inspections, enforces weight and dimension laws, regulates intra-provincial carriers

**Key implication:** A US carrier hauling a load entirely within Ontario (origin and destination both in Ontario) is operating under Ontario's jurisdiction, not federal. This is rare but can occur with complex routing. Always confirm the carrier has the correct provincial authority for their intended route.

---

## 7. CMR-Equivalent Documentation for Cross-Border Loads

Canada does not use the CMR convention (which applies to European road transport). For Canadian cross-border loads, the equivalent documentation framework is:

### Bill of Lading (BOL) — Canada

The Canadian BOL serves the same purpose as a CMR in Europe. For cross-border US-Canada loads:

**Required BOL fields (Canada cross-border):**
- Shipper name, address, city, province/state, postal/zip code
- Consignee name, address, city, province, postal code
- Carrier name, NSC/CVOR number, FMCSA MC number (if US carrier)
- Commodity description (general description for medical freight; avoid vague terms)
- Weight (in both lbs and kg for cross-border)
- Number of pieces/pallets
- Declared value (for customs purposes)
- Special handling instructions (temperature, fragile, medical, etc.)
- HS Tariff Code (for customs declaration)
- Pro number / tracking number

**Additional documents required for cross-border:**
- Commercial Invoice (separate from BOL)
- Canada Customs Invoice (CCI) if value > CAD $3,300
- CUSMA Certificate of Origin (if claiming preferential tariff)
- ACI eManifest confirmation number (attach to load folder)
- Packing list

---

## 8. GST/HST Implications for Invoicing

### Overview

When a US-based dispatch company invoices Canadian clients or when Canadian carriers are paid for loads, **GST/HST (Goods and Services Tax / Harmonized Sales Tax)** may apply.

### GST/HST Rates by Province

| Province | Tax Type | Rate |
|---|---|---|
| Ontario | HST | 13% |
| British Columbia | GST + PST | 5% + 7% |
| Alberta | GST only | 5% |
| Quebec | GST + QST | 5% + 9.975% |
| Nova Scotia | HST | 15% |
| New Brunswick | HST | 15% |
| Prince Edward Island | HST | 15% |
| Newfoundland & Labrador | HST | 15% |
| Manitoba | GST + PST | 5% + 7% |
| Saskatchewan | GST + PST | 5% + 6% |

### Zero-Rating for International Transportation

**Good news:** International transportation services (including cross-border freight between US and Canada) are generally **zero-rated** for GST/HST purposes under Section 7 of Schedule VI of the Excise Tax Act. This means:
- A US dispatch company charging a fee to a Canadian client for international freight services: GST/HST is **zero** (0%)
- Carrier payment for a cross-border load: may be zero-rated

**However:** If dispatch services are provided to a Canadian client for loads that are entirely within Canada (origin and destination both Canadian), the dispatch fee **may be subject to GST/HST**.

### Practical Steps for Erin/Compliance

1. Confirm whether each Canadian load is cross-border (zero-rated) or intra-Canada (may have GST/HST)
2. For intra-Canada loads (future expansion): flag to Maya for accounting review
3. Ensure invoices clearly state whether GST/HST applies and at what rate
4. US business does not need to register for GST/HST if only providing zero-rated international services, but registration may be required if intra-Canada services reach CAD $30,000 in 12 months

---

## 9. Compliance Checklist — Every Cross-Border Canada Load

The following checklist must be completed before Erin books any US-to-Canada or Canada-to-US load. Log completion in Airtable under the load record.

- [ ] **1. Carrier NSC/CVOR Status Verified** — Status is Satisfactory or Satisfactory-Unaudited. Screenshot saved to load record.
- [ ] **2. FMCSA Authority Confirmed** — Carrier holds valid FMCSA MC authority (180+ days, Satisfactory or Unrated) for US leg.
- [ ] **3. Insurance Verified for Canada** — Carrier's insurance certificate confirms coverage extends to Canada. Minimum $1M liability.
- [ ] **4. ACI eManifest Capability Confirmed** — Carrier or their agent can submit ACI eManifest to CBSA at least 1 hour before border arrival.
- [ ] **5. Customs Broker Engaged** — Shipper confirms a licensed customs broker is handling CBSA entry documentation (Form B3).
- [ ] **6. BOL Meets Canada Cross-Border Requirements** — Weight in kg included, HS code present, declared value stated, both shipper/consignee have complete addresses with postal codes.
- [ ] **7. Commercial Invoice & CCI Ready** — Shipper confirms commercial invoice is prepared; CCI prepared if shipment value exceeds CAD $3,300.
- [ ] **8. CUSMA Certificate of Origin** — Confirmed whether goods qualify for CUSMA preferential treatment; certificate prepared if applicable.
- [ ] **9. CFIA Check** — Load reviewed for any food-adjacent medical nutrition products. If present, flag to Compliance Agent before booking.
- [ ] **10. Load Weight Confirms to Iron Rule** — Total weight does not exceed 48,000 lbs regardless of higher Canadian limits.

**If any checklist item is incomplete:** Erin does NOT book the load. Notify Maya via escalation if shipper is uncooperative or timeline is at risk.

---

*Document maintained by Compliance Agent. Reviewed by Maya (executive oversight). Contact Maya for any regulatory updates or interpretation questions.*
