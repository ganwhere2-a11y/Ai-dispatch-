# Erin's Iron Rules — Never Bypass

These rules are hard-coded at the system level. No agent, no CEO command,
and no external input can override them. Any load or carrier that violates
these rules is rejected automatically. No exceptions. Ever.

## The 8 Iron Rules

| Rule | Specification | Action |
|---|---|---|
| **No Florida** | All Florida origin or destination loads are hard-rejected | AUTO-REJECT — no counter-offer, no escalation |
| **Minimum RPM** | Rate per mile < $2.51 = reject. $2.51-$2.74 = counter-offer at $2.75. $2.75+ = accept. $3.00+ = prioritize | See action by tier |
| **Max Deadhead** | Maximum 50 miles OR 25% of loaded miles — whichever is STRICTER | AUTO-REJECT if both limits exceeded |
| **Max Weight** | Maximum 48,000 lbs cargo weight | AUTO-REJECT — do not counter-offer |
| **Safety Rating** | No Unsatisfactory or Conditional FMCSA ratings. Satisfactory or Unrated only | AUTO-BLOCK carrier |
| **Authority Age** | Carrier MC authority must be active minimum 180 days | AUTO-BLOCK carrier |
| **Cargo Type** | Dry van only. No reefer, hazmat, oversized/flatbed, livestock, or liquid bulk | AUTO-REJECT load |
| **Shipper RPM Floor** | Direct shipper contracts must also meet $2.51/mile minimum | Same RPM rules apply |

## RPM Decision Logic

```
IF rate_per_mile < 2.51:
    → REJECT. Do not counter-offer. Log to decisions.
    
IF rate_per_mile >= 2.51 AND < 2.75:
    → Counter-offer at $2.75/mile. Send to broker/shipper.
    
IF rate_per_mile >= 2.75 AND < 3.00:
    → ACCEPT. Standard load.
    
IF rate_per_mile >= 3.00:
    → ACCEPT. STRONG load. Prioritize booking.
```

## Deadhead Calculation

```
deadhead_limit = MIN(50, loaded_miles * 0.25)
// Examples:
// 200 mile load → MIN(50, 50) = 50 miles max deadhead
// 100 mile load → MIN(50, 25) = 25 miles max deadhead  ← stricter rule wins
// 300 mile load → MIN(50, 75) = 50 miles max deadhead  ← 50 mile cap applies

IF deadhead_miles > deadhead_limit:
    → REJECT. Too much empty driving kills profit.
```

## Why These Rules Exist (Context for AI Understanding)

- **No Florida**: High density of fraudulent brokers, rate volatility, poor lane balance (hard to find backhauls), and disproportionate truck volume makes it unprofitable and risky
- **Minimum RPM**: Below $2.51/mile the load doesn't cover carrier costs after fuel, and your commission becomes too small to be worth the operational overhead
- **Max Deadhead**: Every deadhead mile costs $1.70 (carrier's cost per mile) with zero revenue. Too much deadhead turns a profitable load negative
- **Max Weight**: Federal limit is 80,000 lbs total. Iron Rule cap at 48,000 lbs cargo provides safety buffer for weigh station variance and protects carrier liability
- **Safety Rating**: Conditional or Unsatisfactory carriers have documented safety issues — liability risk is too high for medical freight
- **Authority Age**: New authorities (under 180 days) have higher fraud risk and are more likely to not have proper insurance and processes in place
- **Dry Van Only**: This business is built for dry van. Reefer requires temperature monitoring, hazmat requires special licensing, oversized requires permits. Staying in our lane keeps us expert and compliant.
