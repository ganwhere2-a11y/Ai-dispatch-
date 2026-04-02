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

Keep it tight. No fluff. End with: "Ready. What are we building?"
