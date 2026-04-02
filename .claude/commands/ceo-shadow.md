# /ceo-shadow — CEO Shadow Intelligence Brief

Pull CEO Shadow's current learning summary. Shows what patterns have been observed, confidence levels by decision type, and what CEO Shadow would recommend right now if asked.

---

## Step 1 — Run the Daily Insight

Run this command and capture output:

```bash
node agents/shadow/shadow.js --daily-insight 2>&1 | cat
```

Report the full output. If no output or error, report that clearly.

---

## Step 2 — Check Shadow Log

Read `data/decisions/shadow_log.json` and report:
- Total observations logged
- Most recent 3 observations (what happened, what pattern was noted)
- Any observations with `owner_override: true` (these are the most valuable learning moments)

---

## Step 3 — Check Memory

Run:
```bash
node -e "
import('./shared/memory.js').then(m => {
  const mem = new m.AgentMemory('Shadow')
  return mem.getAllMemories()
}).then(memories => {
  console.log(JSON.stringify(memories.slice(-5), null, 2))
}).catch(e => console.error(e.message))
" 2>&1 | cat
```

Report the last 5 memories stored by CEO Shadow.

---

## Step 4 — Phase Status

Based on `data/decisions/decisions.json`:
- Count total decisions logged
- If < 30 decisions: "Phase 1 — CEO Shadow is observing. Not enough data for pattern analysis yet."
- If 30–99 decisions: "Phase 1 → Phase 2 transition. CEO Shadow is starting to see patterns."
- If 100+ decisions: "Phase 2 active. CEO Shadow has enough data to suggest in Maya's report."
- If 200+ decisions with 85%+ confidence on any type: "Phase 3 eligible. CEO Shadow can be granted proxy rights on [decision type]."

---

## Output Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CEO SHADOW BRIEF — [date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase: [1 / 2 / 3]
Observations logged: [N]
Owner overrides: [N] (these are the most important lessons)
Top pattern: [one sentence if exists, "Not enough data yet" if not]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Last 3 observations:
[brief summary of each]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
