# Airtable Schema — AI Dispatch OS

Create these tables in your Airtable base. All agents read and write to these.

## Table 1: Carriers

| Field | Type | Notes |
|---|---|---|
| Name | Single line text | Primary field |
| MC Number | Single line text | |
| DOT Number | Single line text | |
| Company Name | Single line text | |
| Contact Name | Single line text | |
| Phone | Phone number | |
| Email | Email | |
| Equipment Types | Multiple select | Dry Van 53ft, Dry Van 48ft |
| Preferred Lanes | Long text | e.g. "IL→GA, TX→TN" |
| Safety Rating | Single select | Satisfactory, Unrated, Conditional, Unsatisfactory |
| Insurance Exp Date | Date | Alert when <30 days away |
| Authority Start Date | Date | Must be 180+ days ago |
| Authority Active | Checkbox | |
| Commission Rate | Number | 0.08 or 0.10 |
| First Load Date | Date | When they completed first paid load |
| Status | Single select | Active, Trial, Blocked, Inactive |
| Compliance Passed | Checkbox | Compliance agent sets this |
| Compliance Check Date | Date | |
| Notes | Long text | |
| Loads (linked) | Link to Loads table | |

## Table 2: Clients (Shippers)

| Field | Type | Notes |
|---|---|---|
| Name | Single line text | Primary |
| Company Name | Single line text | |
| Contact Name | Single line text | |
| Phone | Phone number | |
| Email | Email | |
| Facility Type | Single select | Hospital, Clinic, Distributor, Pharma, DME, Other |
| Preferred Lanes | Long text | |
| Special Requirements | Long text | |
| Account Status | Single select | Active, Trial, Prospect, Inactive |
| Contract Signed | Checkbox | |
| Total Loads | Count | |
| Total Revenue | Currency | |
| Notes | Long text | |

## Table 3: Prospects (Free Trial Pipeline)

| Field | Type | Notes |
|---|---|---|
| Name | Single line text | |
| Company | Single line text | |
| Email | Email | |
| Phone | Phone number | |
| Type | Single select | Carrier, Shipper |
| MC Number | Single line text | Carriers only |
| Truck Count | Number | |
| Trial Start | Date | |
| Trial End | Date | |
| Loads In Trial | Number | |
| Trial Status | Single select | Pre-Check, Active, Converted, Expired |
| Conversion Date | Date | |
| Pre-Check MC | Checkbox | |
| Pre-Check Insurance | Checkbox | |
| Pre-Check Authority | Checkbox | |
| Pre-Check Safety | Checkbox | |
| Source | Single select | Receptionist, Sales Outreach, LinkedIn, Referral |
| Notes | Long text | |

## Table 4: Loads

| Field | Type | Notes |
|---|---|---|
| Load ID | Formula | Auto-generated |
| Client (linked) | Link to Clients | |
| Carrier (linked) | Link to Carriers | |
| Origin | Single line text | |
| Destination | Single line text | |
| Pickup Date | Date | |
| Delivery Date | Date | |
| Freight Type | Single select | Medical Supplies, DME, Pharma, General Dry Van |
| Weight (lbs) | Number | |
| Loaded Miles | Number | |
| Deadhead Miles | Number | |
| Carrier Rate Per Mile | Currency | |
| Carrier Rate Total | Currency | |
| Client Rate Total | Currency | |
| Commission | Currency | |
| Commission Rate | Number | |
| Profit | Formula | Client Rate - Carrier Rate |
| Load Status | Single select | Quoted, Confirmed, In Transit, Delivered, Invoiced, Paid, Cancelled |
| BOL Number | Single line text | |
| Tracking ID | Single line text | |
| POD Received | Checkbox | |
| Invoice ID | Single line text | |
| Factored | Checkbox | |
| Iron Rule Flags | Multiple select | No FL, Low RPM, Max DH, Max Weight |
| Notes | Long text | |

## Table 5: Invoices

| Field | Type | Notes |
|---|---|---|
| Invoice Number | Single line text | |
| Load (linked) | Link to Loads | |
| Client (linked) | Link to Clients | |
| Amount | Currency | |
| Issued Date | Date | |
| Due Date | Date | |
| Paid Date | Date | |
| Status | Single select | Draft, Sent, Factored, Paid, Overdue |
| Factoring Submitted | Checkbox | |
| Factoring Date | Date | |
| Notes | Long text | |
