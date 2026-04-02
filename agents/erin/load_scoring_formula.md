# Erin's Load Profit Formula

## The Core Formula

```
Revenue     = loaded_miles × rate_per_mile
Cost        = (loaded_miles + deadhead_miles) × cost_per_mile
Profit      = Revenue - Cost
True RPM    = Profit ÷ loaded_miles
```

**Cost per mile default = $1.70**
This is the carrier's all-in cost: fuel + driver pay + maintenance + insurance.
Stored in env as COST_PER_MILE. Can be updated if fuel prices change significantly.

## Load Score Tiers

| Profit | Score | Erin's Action |
|---|---|---|
| Negative | LOSS | Auto-reject. Log reason. Do NOT present to owner or carrier. |
| $0 - $199 | BORDERLINE | Reject. Only accept if it's part of a multi-load deal or strategic lane. |
| $200 - $399 | DECENT | Accept. Standard load. Log and proceed. |
| $400+ | STRONG | Prioritize. Book first. Flag as high-value to Maya's morning report. |

## The Three Worked Examples (From Training)

### Example 1 — Borderline Load
```
500 loaded miles
50 deadhead miles
$2.30/mile rate

Revenue = 500 × $2.30 = $1,150
Cost    = 550 × $1.70 = $935
Profit  = $1,150 - $935 = $215

Score: BORDERLINE → proceed with caution or reject
```

### Example 2 — Strong Load
```
600 loaded miles
40 deadhead miles  
$2.60/mile rate

Revenue = 600 × $2.60 = $1,560
Cost    = 640 × $1.70 = $1,088
Profit  = $1,560 - $1,088 = $472

Score: STRONG → book it immediately
```

### Example 3 — Bad Load Disguised as Good RPM
```
400 loaded miles
200 deadhead miles    ← This is the problem
$2.50/mile rate       ← Looks OK on surface

Revenue = 400 × $2.50 = $1,000
Cost    = 600 × $1.70 = $1,020
Profit  = $1,000 - $1,020 = -$20

Score: LOSS → auto-reject
```

**KEY LESSON**: A load with a $2.50 RPM sounds decent, but 200 deadhead miles
turns it into a loss. Always run the full profit formula. Never judge a load
by RPM alone.

## Commission Calculation

Erin calculates rates from the carrier's perspective, then adds commission:

```
carrier_rate  = what the carrier wants per mile
client_rate   = carrier_rate + (carrier_rate × commission_rate)
commission    = client_rate - carrier_rate

commission_rate = 0.08 (existing carriers — been with us 90+ days)
commission_rate = 0.10 (new carriers — first 90 days)

Example:
  Carrier wants $2.30/mile on 500 miles
  Carrier rate = $1,150
  Commission = $1,150 × 0.08 = $92
  Client rate = $1,242
```

## Weight Scoring (From Training Notes)

Erin also evaluates loads by weight against the trailer:
- Under 20,000 lbs = light load — check if shipper is willing to add more
- 20,000-40,000 lbs = standard load — proceed
- 40,000-45,000 lbs = heavy but OK — verify trailer axle weight distribution
- 45,001-48,000 lbs = near Iron Rule limit — confirm weight cert before booking
- Over 48,000 lbs = IRON RULE VIOLATION — auto-reject immediately

Dry van capacity: 26 standard pallets (48" × 40"). Always confirm pallet count.
