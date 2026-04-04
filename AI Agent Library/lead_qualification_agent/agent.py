"""
Lead Qualification Agent
AI-Dispatch Agent Library | v1.0 | April 2026

Evaluates lead information and assigns qualification status.
Reads from input.txt, writes to lead_qualification.json and lead_qualification.txt

Requirements:
  pip install anthropic
  export ANTHROPIC_API_KEY=your_key_here
"""

import json
import anthropic
from datetime import date

client = anthropic.Anthropic()  # requires ANTHROPIC_API_KEY

SYSTEM_PROMPT = """
You are a Lead Qualification Agent.

Rules:
- Assess lead fit and intent
- Be transparent and explainable
- Avoid hard predictions
- Flag uncertainty clearly

Return ONLY valid JSON with this schema:
{
  "lead_name": "",
  "qualification_status": "",
  "fit_summary": "",
  "intent_level": "",
  "priority": "",
  "recommended_action": "",
  "confidence": "",
  "flags": []
}

qualification_status options: QUALIFIED | UNQUALIFIED | NEEDS_MORE_INFO
intent_level options: HIGH | MEDIUM | LOW
priority options: A (hot) | B (warm) | C (cold) | X (disqualify)
confidence: decimal between 0.0 and 1.0
flags: list of strings describing risks, gaps, or concerns
"""


def read_input(path="input.txt"):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def qualify_lead(prompt_text):
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": prompt_text}
        ]
    )
    return json.loads(response.content[0].text)


def save_outputs(data):
    # Save structured JSON
    with open("lead_qualification.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    # Save human-readable report
    with open("lead_qualification.txt", "w", encoding="utf-8") as f:
        f.write(f"Lead Qualification Report\n")
        f.write("=" * 50 + "\n")
        f.write(f"Date: {date.today()}\n\n")
        f.write(f"Lead: {data['lead_name']}\n")
        f.write(f"Status: {data['qualification_status']}\n")
        f.write(f"Priority: {data['priority']}\n")
        f.write(f"Intent Level: {data['intent_level']}\n\n")
        f.write(f"Fit Summary:\n{data['fit_summary']}\n\n")
        f.write(f"Confidence: {data['confidence']}\n\n")
        f.write(f"Recommended Action:\n{data['recommended_action']}\n")

        if data["flags"]:
            f.write(f"\nFlags:\n")
            for flag in data["flags"]:
                f.write(f"- {flag}\n")


def main():
    prompt_text = read_input()
    qualification = qualify_lead(prompt_text)
    save_outputs(qualification)
    print("Lead qualification completed successfully.")
    print(f"Status: {qualification['qualification_status']} | Priority: {qualification['priority']} | Confidence: {qualification['confidence']}")


if __name__ == "__main__":
    main()
