# /status — System Status

Run the following checks and report results in a clean, scannable format. This runs every new session.

---

## Step 1 — Git State

Run `git log --oneline -3` and `git status --short`.

Report:
- Current branch
- Last 3 commits (one line each)
- Any uncommitted changes

---

## Step 2 — Agent Health

Run `node scripts/health-check.js 2>&1 | cat` and summarize:
- How many agents are ready (have all required env vars)
- Which critical vars are missing (if any)
- Whether `AI_DISPATCH_PAUSED` is true

---

## Step 3 — Decision Engine

Run `node -e "import('./decision_engine/engine.js').then(m => m.getSummary()).then(s => console.log(JSON.stringify(s, null, 2)))" 2>&1 | cat`

Report:
- Total decisions logged
- Decisions in last 7 days
- Any agents eligible for autonomous promotion

---

## Step 4 — One-Time Platform Setup Checklist

Check `data/sops/library.json` for key `platform_setup_complete`. If not found or false, show this checklist:

```
PLATFORM SETUP (one-time — mark complete when done)
────────────────────────────────────────────────────
[ ] Railway deployment
      → Deploy agents as background workers
      → Set all .env vars in Railway dashboard

[ ] Google Cloud Console
      → console.cloud.google.com
      → Enable APIs: Maps, Places (for shipper lookup)
      → Create service account + download key

[ ] Google Drive — Business Brain
      → Create folder: "AI Dispatch / Brain"
      → Upload: carrier packets, rate sheets, SOP docs
      → Share folder ID → set GOOGLE_DRIVE_BRAIN_ID in .env

[ ] Claude Projects (claude.ai/projects)
      → Connect ganwhere2-a11y/Ai-dispatch- repo
      → Claude reads full codebase as context
```

If `platform_setup_complete` is true, skip this section.

---

## Step 5 — Nova Status

Check if `data/bdr/nova_state.json` exists. If yes, report Nova's current state (active/halted, last brief date, prospects in pipeline). If no, report: "Nova not yet initialized — run `/nova start` to begin."

---

## Output Format

Print a compact summary like this:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI DISPATCH STATUS — [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Branch: main | Last commit: [message]
Agents: [N]/10 ready | [any critical flags]
Decisions: [N] logged | [N] this week
Nova: [active/halted/not initialized]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Platform setup checklist if incomplete]
```

Keep it tight. No fluff.

---

## Step 6 — THE HARD RULE (read every session, no exceptions)

After the status block, ALWAYS print this section exactly as written:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE MULTIMILLION DOLLAR PUSH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your business goal: $272K/month · 200 trucks · Year 1
Your Year 3 goal:  $500+ carriers · USA + Canada + EU + UK

RIGHT NOW THE CLOCK IS RUNNING.
Every day without live API keys = zero revenue from AI agents.
Every day without a signed carrier = zero commission.
Every day without a direct shipper = leaving $1.50/mile on the table.

THIS SESSION — PICK ONE AND DO IT:
  [ ] Add ANTHROPIC_API_KEY to Railway → agents go live TODAY
  [ ] Sign 1 carrier to a 7-day trial → revenue starts flowing
  [ ] Cold call 10 carriers from FMCSA list → pipeline fills up
  [ ] Write 1 missing SOP → agents get smarter
  [ ] Book 1 direct shipper meeting → bypass brokers, keep the margin

SOP LIBRARY STATUS:
  ✅ Carrier Agreement SOP — erin_maya_carrier_agreement_sop.md
  ✅ Erin DAT Master SOP — erin_dat_master_sop.md (full load lifecycle)
  ✅ Broker Checklist — broker_checklist.md
  ✅ Carrier Onboarding Flow — carrier_onboarding_flow.md
  ✅ Anti-Hallucination Rules — anti_hallucination_rules.md
  ✅ Security & Guardrails — security_guardrails.md
  ✅ Winback Email Sequence — templates/winback_emails.md
  ✅ Testimonial & Nurture — templates/testimonial_nurture_emails.md
  ✅ Drug Test / NDS Clearinghouse — in onboarding system_prompt.md
  ✅ Dispute Resolution 7-step — in support system_prompt.md

STILL NEEDED — REAL SCRIPTS (not templates):
  ⚠️  Your actual Sales outreach scripts (you haven't sent these yet)
  ⚠️  DAT SOP from your physical binder (waiting on you)
  ⚠️  Drug testing enrollment sheet from National Testing Consortium

THE GAP BETWEEN YOU AND $1M:
  You have the system. You have the agents. You have the SOPs.
  What you do NOT have yet: live data flowing through it.
  That changes the moment your first real carrier moves their first real load.

NO EXCUSES. NO WAITING. WHAT ARE WE BUILDING TODAY?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
