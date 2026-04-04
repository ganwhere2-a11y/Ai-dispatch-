# Lead Qualification Agent
**Status: Ready to Deploy | Language: Python | Model: GPT-4.1-mini (or Claude)**

---

## What This Agent Does

Evaluates inbound lead information and assigns a qualification score. Takes a text description
of a lead (name, company, role, inquiry, engagement signals) and returns structured JSON with:

- Qualification status
- Fit summary
- Intent level
- Priority score
- Recommended action
- Confidence level
- Flags (risks or gaps)

## Use Case for AI-Dispatch

Use this agent to pre-qualify carriers and shippers before routing to Collette or the Onboarding
agent. Feed it the lead data captured from FMCSA scraping, Retell call logs, or web form submissions.

Score A/B/C leads automatically so Erin and Onboarding only spend time on hot prospects.

## What It Needs

| Requirement | Details |
|---|---|
| Python 3.8+ | Install from python.org |
| OpenAI API key | Set as `OPENAI_API_KEY` env var — OR swap model to Claude (see note below) |
| `openai` package | `pip install openai` |

**To use Claude instead of OpenAI:** Replace the OpenAI client with Anthropic SDK.
The system prompt and output schema work with any model. See `agent.py` for swap instructions.

## Files in This Folder

| File | Purpose |
|---|---|
| `agent.py` | Full Python implementation — run directly |
| `system_prompt.md` | The agent's qualification rules and output schema |
| `input_example.txt` | Example lead input to test with |
| `output_example.json` | Example of what the agent returns |

## Quick Start

```bash
# 1. Install dependency
pip install openai

# 2. Set your API key
export OPENAI_API_KEY=your_key_here

# 3. Add your lead data to input.txt
# (see input_example.txt for format)

# 4. Run the agent
python agent.py

# 5. Check outputs
cat lead_qualification.json
cat lead_qualification.txt
```

## Output Schema

```json
{
  "lead_name": "Mark Johnson",
  "qualification_status": "QUALIFIED",
  "fit_summary": "Strong fit — SaaS operations leader at 500-person company...",
  "intent_level": "HIGH",
  "priority": "A",
  "recommended_action": "Book demo within 24 hours",
  "confidence": "0.87",
  "flags": []
}
```

## Validation Checklist (after running)

- [ ] Fit and intent are clearly explained — not vague
- [ ] Priority aligns with engagement signals in the input
- [ ] Confidence reflects data completeness (low confidence if data is sparse)
- [ ] No absolute predictions — agent flags uncertainty rather than guessing

---

*Lead Qualification Agent v1.0 | April 2026 | AI-Dispatch Agent Library*
