# Sales Agent — Lead Sources & Targeting Guide

**Version:** 1.0  
**Last Updated:** 2026-04-01  
**Agent:** Sales  
**Scope:** USA (Phase 1) — Canada and EU sourcing to be added during respective expansion phases

---

## Part 1: Who to Target

### Shipper Leads — Ideal Customer Profile

Shippers are organizations that have medical freight to move and need a reliable dispatch partner. The target profile is an organization that ships frequently (not one-off), ships dry van compatible cargo, and values reliability over lowest-possible-price.

**Priority Tier 1 — Best fit:**

| Prospect Type | Why They're a Good Fit | Key Pain Point |
|---|---|---|
| Hospital supply chain managers | High-volume, consistent freight, understands logistics complexity | Hard to find reliable carriers for medical supplies; needs on-time delivery |
| Surgical center supply coordinators | Time-sensitive loads, often expedited, willing to pay premium | Last-minute orders, small windows for delivery |
| Medical device distributors | Multi-location distribution, consistent lane needs | Managing multiple carriers is inefficient; needs consolidated dispatch |
| Pharma 3PL (third-party logistics for pharma) | Large volume, willing to pay for specialization | Compliance requirements make carrier vetting critical |
| Clinic chains (multi-location) | Recurring weekly supply runs | Inconsistent carrier quality; billing complexity |

**Priority Tier 2 — Good fit:**

| Prospect Type | Why They're Viable | Consideration |
|---|---|---|
| Independent medical equipment suppliers | Frequent shipping, need dependability | Smaller volume than hospital systems |
| Dental supply distributors | Regular dry van loads, good lane density | Slightly outside core medical identity |
| Lab supply companies | Consistent loads, price-conscious but reliable | May have some temperature-sensitive items — verify dry van compatibility |
| Home health supply distributors | Growing segment, underserved by quality dispatch | Mixed load sizes; may need LTL coordination |

**Do NOT pursue (shippers):**
- Retail pharmacy chains (they have national 3PLs locked in)
- General merchandise shippers who mention "medical" as a minor portion
- Shippers whose primary cargo is refrigerated/frozen (outside dry van scope)
- Shippers whose load weights routinely exceed 48,000 lbs

---

### Carrier Leads — Ideal Profile

Carriers are trucking operators who have dry van equipment and are looking for quality loads and dispatch support. Our core carrier model relies on attracting owner-operators and small fleets who lack internal load sourcing capabilities.

**Priority Tier 1 — Best fit:**

| Profile | Signals | Why They're Ideal |
|---|---|---|
| Owner-operator, 1–3 trucks | Solo operator or husband-wife team; MC 180+ days old | Full dependence on external dispatch; no internal brokerage |
| Small fleet, 4–10 trucks | Growing operation, stretched thin on admin | Needs dispatch scale without hiring staff |
| Experienced dry van drivers new to OTR | Recently obtained MC; has driving experience | Motivated, trainable, wants to build book of business |
| Carriers in high-demand lanes (Midwest, Southeast, Northeast med corridors) | Based in IL, OH, PA, TN, TX, NC | Strong lane alignment with medical facility density |

**Priority Tier 2 — Viable:**

| Profile | Consideration |
|---|---|
| Small fleet, 11–20 trucks | Higher revenue potential; may have some in-house dispatch capacity; more resistant to full outsourcing |
| Carriers who have hauled medical before | Pre-qualified for medical freight norms; may already have shipper relationships |
| Owner-operators switching dispatchers | Motivated; understand value of dispatch; need re-pitching carefully |

**Do NOT pursue (carriers):**
- Carriers with FMCSA Conditional or Unsatisfactory rating
- Carriers with MC less than 180 days active
- Carriers without dry van equipment
- Carriers whose insurance has lapsed or is below minimums ($1M liability, $100K cargo)
- Florida-only carriers (we cannot book loads to/from Florida — misaligned from day one)

---

## Part 2: Lead Sources

### Source 1: FMCSA SAFER System

**What it is:** FMCSA SAFER (Safety and Fitness Electronic Records) is a public database of all registered US motor carriers. It is the primary source for verified carrier leads with confirmed authority, equipment type, insurance, and safety rating.

**URL:** `https://safer.fmcsa.dot.gov/`

**Direct carrier search URL format:**
```
https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=CARRIER_NAME&original_query_param=CARRIER_NAME&query_string=[CARRIER_NAME]
```

**Bulk search by state and equipment:**
Use the SAFER Company Snapshot bulk data download available at:
`https://ai.fmcsa.dot.gov/SMS/Carrier/[MC_NUMBER]/CompleteProfile.aspx`

**Fields to extract for each carrier lead:**

| Field | SAFER Field Name | Use |
|---|---|---|
| Company name | Legal Name | Lead name |
| MC number | USDOT/MC | Verification |
| DOT number | USDOT | Verification |
| Address / home state | Physical Address | Geographic targeting |
| Equipment type | Carrier Operation (look for "Authorized For Hire," trailer type) | Dry van filter |
| Safety rating | Safety Rating | Must be Satisfactory or Unrated |
| Insurance status | BIPD Insurance On File | Must be current |
| MC active date | MCS-150 date or authority grant date | Must be 180+ days |
| Truck count | Power Units | Fleet size filter |
| Driver count | Drivers | Cross-reference with truck count |

**Search strategy for Sales agent:**
1. Filter by state (start with high-density medical corridor states: IL, OH, PA, TN, TX, NC, GA, IN)
2. Filter for "Authorized For Hire" carrier operation
3. Filter for Safety Rating = "Satisfactory" OR "None" (Unrated)
4. Filter for Power Units = 1–20 (target owner-ops to small fleets)
5. Export results, cross-reference insurance status
6. Score leads using quality rubric below

---

### Source 2: Google Maps API — Finding Medical Facility Shipper Leads

**What it is:** Google Maps Places API allows search for businesses by type and location. Used to identify hospitals, clinics, medical suppliers, and surgical centers in target zip codes.

**Search terms to use (Google Maps / Google Places API):**

```
"hospital supply chain" [city, state]
"medical supplies distributor" [zip code]
"surgical center" [city, state]
"medical device company" [city, state]
"medical equipment distributor" [zip code]
"healthcare logistics" [city, state]
"pharmacy distributor" [state]
"hospital distribution center" [city]
"clinical supply" [city, state]
"IV supplies" OR "IV distributor" [state]
```

**API endpoint format:**
```
https://maps.googleapis.com/maps/api/place/textsearch/json?query=[SEARCH_TERM]&key=[API_KEY]
```

**Fields to capture from each result:**
- Business name
- Address (full, including zip code)
- Phone number
- Website (for further research)
- Business type / category
- Rating and review count (proxy for business size and legitimacy)

**Workflow:**
1. Define target ZIP codes (within 200-mile radius of major medical device hubs: Chicago, Columbus, Nashville, Dallas, Philadelphia, Charlotte)
2. Run search queries per ZIP code
3. Export: name, address, phone, website
4. Enrich with LinkedIn (see Source 3) to find decision-maker contact
5. Score and queue for outreach

---

### Source 3: LinkedIn — Finding Decision-Maker Contacts

**What it is:** LinkedIn Sales Navigator (or free LinkedIn search) to identify specific decision-makers at target shipper companies and medical facilities.

**Search strings for shipper decision-makers:**

```
"supply chain manager" "hospital" [state]
"supply chain director" "medical" OR "healthcare"
"logistics coordinator" "clinic" OR "surgical center"
"procurement manager" "medical device"
"distribution manager" "pharma" OR "pharmaceutical"
"operations manager" "medical supplies"
"materials manager" hospital
"VP of supply chain" healthcare
```

**Search strings for carrier owner-operators (rare on LinkedIn but useful for small fleet owners):**

```
"owner operator" "trucking" [state]
"freight carrier" "dry van"
"trucking company owner" [state]
"logistics" "owner" "dry van"
```

**Fields to capture:**
- Full name
- Title
- Company name
- Location (city/state)
- LinkedIn profile URL
- Email (use LinkedIn InMail or enrichment tool like Hunter.io or Apollo.io)
- Company size (employee count — proxy for shipping volume)

**Connection request note template (LinkedIn):**
> "Hi [First Name] — I work with medical freight shippers who need reliable dry van dispatch. We specialize in hospital supply chain logistics across the US. Happy to share what we do in 2 minutes if it's relevant. No pitch — just a quick connection."

---

### Source 4: DAT Load Board — Carrier Database

**What it is:** DAT (formerly Dial-A-Truck) is the largest load board in the trucking industry. DAT One and DAT Power subscribers have access to a carrier database in addition to load listings.

**How to use DAT to find carriers:**

1. Log into DAT Power / DAT One with carrier search access
2. Use "Find Carriers" (DAT Carrier Search) feature
3. Filter by:
   - Equipment type: Dry Van
   - Operating region: Start with top 10 medical corridor states
   - Carrier status: Active
4. Export contact information for carriers matching profile
5. Cross-reference MC numbers against FMCSA SAFER before adding to outreach list

**DAT also shows:**
- Preferred lanes (historical load history where available)
- Credit score / broker payment history (relevant for shippers evaluating us, not directly for carrier leads)
- Fleet size indicators

**Note:** DAT carrier data is self-reported and not verified. Always verify against FMCSA SAFER before qualifying a carrier lead.

---

### Source 5: Inbound from Receptionist Calls

**What it is:** The Receptionist captures inbound caller information and routes it to the Sales agent for follow-up. These are the warmest leads in the system.

**Process:**
1. Receptionist call ends with `submit_load_request`, `route_to_onboarding`, `book_calendly_call`, or `capture_general_inquiry` function trigger
2. Lead data is written to Airtable (Sales Leads table) with source = "inbound_call"
3. Sales agent is notified within 5 minutes of lead creation
4. Sales agent must attempt first follow-up contact within **2 hours** of inbound call
5. Inbound leads are automatically scored at 8/10 base (highest source quality) — adjust down based on rubric below

**Priority:** Inbound leads always jump the queue. A carrier who called in is 3–5x more likely to convert than a cold outreach lead.

---

## Part 3: Lead Quality Scoring Rubric

Score each lead 0–10 before adding to an outreach sequence. Scores determine outreach priority and which sequence to use.

### Carrier Lead Scoring

| Criterion | 0 Points | 1–3 Points | 4–6 Points | 7–10 Points |
|---|---|---|---|---|
| **Truck count** (max 3 pts) | 0 (no trucks) | 1 truck (risk: single truck = total dependence) | 2–5 trucks | 6–20 trucks |
| **Medical experience** (max 2 pts) | Never hauled medical | Has hauled medical-adjacent (food, pharma) | 1–5 medical loads in past | Regular medical freight history |
| **Lane match** (max 2 pts) | No overlap with medical corridors | Some overlap (1–2 states) | Good overlap (3–5 states) | Direct overlap with our top 5 lanes |
| **FMCSA status** (max 2 pts) | Conditional or Unsatisfactory | — | Unrated (Satisfactory-Unaudited) | Satisfactory |
| **Response rate / warmth** (max 1 pt) | No signal | Cold / no prior contact | Referred or visited our content | Inbound / responded to prior outreach |

**Score interpretation:**
- 8–10: Hot lead — prioritize, call within 24 hours, fast-track to trial
- 5–7: Warm lead — include in standard sequence, monitor
- 3–4: Cool lead — lower sequence priority, longer follow-up cadence
- 0–2: Do not pursue — disqualify

### Shipper Lead Scoring

| Criterion | 0 Points | 1–3 Points | 4–6 Points | 7–10 Points |
|---|---|---|---|---|
| **Shipping volume** (max 3 pts) | Unknown / one-off | 1–2 loads/month | 3–10 loads/month | 10+ loads/month |
| **Medical specificity** (max 2 pts) | General goods, medical is incidental | Mixed freight, medical is significant portion | Primarily medical, dry van compatible | Exclusively medical, dry van, consistent |
| **Decision-maker identified** (max 2 pts) | No contact found | General company contact | Supply chain / logistics title found | Named VP/Director with direct contact |
| **Geography fit** (max 2 pts) | Outside our coverage area | Fringe coverage area | Good lane density | Prime medical corridor coverage |
| **Inbound vs. outbound** (max 1 pt) | Cold outreach | Warm (visited content, LinkedIn) | Referred | Inbound inquiry |

---

## Part 4: Lead Disqualification Criteria

Stop pursuing a lead and move to cold archive (90 days) when ANY of the following apply:

**Automatic disqualification (stop immediately):**
- Carrier: FMCSA Conditional or Unsatisfactory rating
- Carrier: MC less than 180 days active
- Carrier: No dry van equipment
- Carrier: Insurance lapsed or below minimums
- Shipper: Explicit statement that freight is refrigerated only
- Shipper: Loads routinely exceed 48,000 lbs
- Any party: Requests illegal, unethical, or non-compliant arrangements

**Soft disqualification (complete sequence then cold archive):**
- 4 outreach touches with zero response
- Lead responds but expresses no interest twice
- Lead is a fit but their timeline is beyond 6 months
- Carrier is Florida-based with Florida-only lanes (cannot book Florida loads)

**Cold archive process:**
1. Update Airtable record status to "Cold - [date]"
2. Add to 90-day re-engagement list
3. At 90 days: Sales agent re-evaluates and either re-sequences or permanently disqualifies
4. Permanently disqualified leads: status = "Closed - Not a Fit" — do not contact again

---

*Lead source guide maintained by Sales Agent. Updates require Maya's review when adding new data sources or changing scoring criteria.*
