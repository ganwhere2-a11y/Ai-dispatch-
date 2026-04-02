# /maya — Maya Command Center

Maya is your executive assistant. She runs reports, routes escalations, and holds carrier intelligence.
Use this command to control Maya and access her intelligence.

---

## Commands

### `/maya start`
Start Maya and her morning report scheduler.
Run: `npm run maya`
Then confirm: Maya is running and Telegram is connected.

---

### `/maya halt`
Pause Maya only — other agents keep running.
Run: Set `AI_DISPATCH_PAUSED=false` (agents run) but stop the Maya process.
Confirm: Morning reports pause. Escalations queue until resumed.
Note: This is NOT the same as halting all agents. Use `/maya halt-all` for a full stop.

---

### `/maya brief`
Get a manual briefing right now — don't wait for 6AM.
Run:
```bash
node -e "
import('./agents/maya/maya.js').then(m =>
  m.sendMorningReport({
    activeLoads: 0,
    weekRevenue: 0,
    trucksManaged: 0,
    trialProspects: 0
  })
).then(r => console.log(r))
"
```
Maya generates the report and prints it. If Telegram is connected, it also sends there.

---

### `/maya resume`
Resume Maya after a halt.
Run: `npm run maya`
Confirm: Morning report scheduler restarts. Escalation queue processes.

---

### `/maya halt-all`
**Full system stop.** Triggers the kill switch.
Steps:
1. Check what loads are currently in flight: run `node -e "import('./shared/memory_router.js').then(m => m.getInFlightLoads()).then(console.log)"`
2. Set `AI_DISPATCH_PAUSED=true` in `.env`
3. Maya sends owner a Telegram alert with: what's paused, what's still moving, ref IDs
4. Stop all agent processes
5. Report to owner: "All agents halted. [N] loads still in flight — they will complete. No new actions until you resume."

To resume after halt-all: set `AI_DISPATCH_PAUSED=false` in `.env`, then restart agents one by one starting with Maya.

---

### `/maya intelligence`
Show Maya's carrier intelligence — what she knows about carrier packets and what to look for.

Read and summarize `agents/maya/carrier_packet_intelligence.md`.

Key sections to highlight:
- Required documents checklist (8 items for USA carriers)
- Medical freight additional requirements
- Strong vs weak vs instant-disqualify carrier profiles
- Packet status tracking fields in Airtable

---

### `/maya status`
Quick Maya health check. Run:
```bash
node -e "
import('./decision_engine/engine.js').then(m =>
  m.getSummary()
).then(s => {
  console.log('Maya status:')
  console.log('Decisions logged:', s.total)
  console.log('Last 7 days:', s.recent_7_days)
  console.log('Autonomous eligible:', s.autonomous_eligible)
  console.log('AI_DISPATCH_PAUSED:', process.env.AI_DISPATCH_PAUSED || 'false')
})
" 2>&1 | cat
```

---

## Maya's Intelligence Files

| File | What It Contains |
|---|---|
| `agents/maya/carrier_packet_intelligence.md` | Carrier packet requirements, BDR qualification criteria |
| `agents/maya/daily_report_template.md` | Morning report format |
| `agents/maya/escalation_rules.md` | What triggers an escalation and at what tier |
| `agents/maya/system_prompt.md` | Maya's full role definition |
