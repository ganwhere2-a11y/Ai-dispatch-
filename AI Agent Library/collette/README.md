# Collette — AI Receptionist & Live Voice Dispatcher
**Status: Ready to Deploy | Platform: Retell AI | Available: 24/7/365**

---

## What Collette Does

Collette is the first voice every caller hears. She answers every inbound call in under
3 seconds, identifies the caller type, captures the right information, and routes them
to the correct agent or books a calendar appointment — all without human involvement.

She handles: carriers, shippers, prospects, regulators, emergencies, and billing disputes.

## What She Needs to Go Live

| Requirement | Where to Set It |
|---|---|
| Retell AI account | retell.ai — create agent, assign phone number |
| `RETELL_API_KEY` | Railway .env |
| `RETELL_AGENT_ID` | Railway .env |
| `RETELL_WEBHOOK_SECRET` | Railway .env |
| CRM read access | Airtable API key already in .env |
| Calendar write access | Google Calendar API (see platform setup) |
| Maya Agent webhook | Already wired in server.js |

## Files in This Folder

| File | Purpose |
|---|---|
| `system_prompt.md` | Collette's core identity, guardrails, and moat protection |
| `receptionist_sop.md` | Full 11-section SOP — call flow, intake forms, escalation |
| `faq_guardrails.md` | Company FAQ, caller scripts, 5 moat protection guardrails |

## Quick Activation Checklist

- [ ] Retell AI agent created, phone number assigned
- [ ] Set RETELL_API_KEY, RETELL_AGENT_ID, RETELL_WEBHOOK_SECRET in Railway
- [ ] Upload `system_prompt.md` content as Retell agent system prompt
- [ ] Upload `faq_guardrails.md` as Retell knowledge base
- [ ] Test with a sample call — verify call log writes to shared memory
- [ ] Verify Tier-3 escalation fires correctly to Maya

---

*Collette v1.0 | April 2026 | Powered by Retell AI*
