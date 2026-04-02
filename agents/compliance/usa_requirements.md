# USA Compliance Requirements

## Federal Motor Carrier Safety Administration (FMCSA)

### Required for All Carriers
- Operating Authority (MC number) — must be ACTIVE, not revoked or suspended
- DOT Number — must be registered
- Safety Rating — Satisfactory or Unrated ONLY (Iron Rule: no Conditional, no Unsatisfactory)
- Authority Age — MC must be active minimum 180 days (Iron Rule)
- Insurance on file with FMCSA (Form MCS-90)

### Insurance Minimums (Dry Van)
- Cargo insurance: $100,000 minimum
- Public liability: $750,000 minimum (most carriers carry $1M)
- No self-insured carriers without explicit owner approval (Tier 3)

### FMCSA SAFER API
- Use SAFER to verify carrier at: https://safer.fmcsa.dot.gov/
- API endpoint: https://mobile.fmcsa.dot.gov/qc/services/carriers/{DOT_NUMBER}
- Check fields: entity_type, operating_status, cargo_carried, safety_rating, insurance_on_file

### Drug & Alcohol Testing
- Carrier must have a drug & alcohol testing program in place
- Verify via FMCSA Drug & Alcohol Clearinghouse if suspected issue

## DOT Weight Limits

| Configuration | Max Gross Weight |
|---|---|
| Interstate highway | 80,000 lbs total (truck + trailer + cargo) |
| Dry van trailer alone | 14,000-16,000 lbs |
| Max cargo (Iron Rule) | 48,000 lbs |
| Typical safe max cargo | 44,000-45,000 lbs |

Note: Iron Rule max is 48,000 lbs, which is below federal limit — gives buffer for weigh station variance.

## Bills of Lading Requirements

A valid BOL must include:
- Shipper name and address
- Consignee (receiver) name and address
- Description of goods (be specific — "medical supplies" is acceptable, "controlled substance" requires escalation)
- Weight (estimated or actual)
- Number of pieces/pallets
- Freight charges and terms (prepaid/collect/3rd party)
- Date of shipment
- Carrier name and MC/DOT numbers
- Shipper signature

## Medical Freight Specifics

- Medical devices (FDA Class I/II): standard dry van, no special handling required
- Pharmaceuticals (non-controlled): standard dry van, chain-of-custody recommended
- Controlled substances: DO NOT DISPATCH without Tier 3 owner approval and specialized carrier
- Patient samples/biohazard: DO NOT DISPATCH — outside scope of this business
- DME (Durable Medical Equipment): standard dry van

## What Triggers a Hold

Any of these puts the load on hold immediately (Compliance blocks it, Maya alerts owner):
1. Carrier safety rating is Conditional or Unsatisfactory
2. Carrier insurance expired or about to expire (<30 days)
3. Carrier has active out-of-service order
4. Load weight exceeds 48,000 lbs
5. Florida origin or destination
6. Cargo type is controlled substance or biohazard
7. BOL missing required fields
8. Rate confirmation not signed before scheduled pickup
