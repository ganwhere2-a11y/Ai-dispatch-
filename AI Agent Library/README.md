# AI Agent Library
**AI-Dispatch | Internal Use Only**

This library holds AI agents that are built, documented, and ready to deploy.
Each agent sits on the shelf until activated. When you need one, pull it off,
connect the API keys, and add it to the team.

---

## Agents on the Shelf

| Agent | Status | Purpose | Activate With |
|---|---|---|---|
| [Collette — AI Receptionist](./collette/) | ✅ Ready | 24/7 voice intake, caller routing, escalation | Retell AI + API keys |
| [Lead Qualification Agent](./lead_qualification_agent/) | ✅ Ready | Scores and qualifies inbound leads automatically | OpenAI or Claude API key |

---

## How to Activate an Agent

1. Open the agent's folder
2. Read the `README.md` — it lists exactly what API keys and setup steps are needed
3. Set the required `.env` variables in Railway
4. Connect to the relevant workflow (see `workflows/` in the main repo)
5. Train on SOPs via the dashboard Knowledge Base

---

## Adding a New Agent to the Library

Follow the 6-step checklist in `CLAUDE.md → How to Add a New Agent`.
Every agent in this library must have:
- `README.md` — what it does, what it needs, how to activate
- `system_prompt.md` — the agent's identity, rules, and behavior
- Any supporting docs (SOPs, scripts, templates)

---

*This library grows as the business grows. Every agent here was built to solve a real problem.*
