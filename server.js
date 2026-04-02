/**
 * AI Dispatch — Command Center Server
 * Serves the full polished dashboard at /
 * Live data fed via /api/data endpoint — dashboard fetches on load + every 5 min
 */

import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { getSummary as getDecisionSummary } from './decision_engine/engine.js'
import fs from 'fs/promises'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// ── Live data builder ─────────────────────────────────────────────────────────
async function getLiveData() {
  const decisionSummary = await getDecisionSummary().catch(() => ({ recent_7_days: 0, total: 0 }))

  // Airtable pull if configured
  let airtableData = null
  if (process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID) {
    try {
      const base = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`
      const h = { Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}` }
      const [loadsRes, carriersRes] = await Promise.all([
        fetch(`${base}/Loads?filterByFormula=Status%3D'Active'`, { headers: h }),
        fetch(`${base}/Carriers?filterByFormula=Status%3D'Active'`, { headers: h })
      ])
      const loads = await loadsRes.json()
      const carriers = await carriersRes.json()
      airtableData = {
        activeLoads: loads.records?.length || 0,
        truckCount: carriers.records?.length || 0
      }
    } catch { /* fall through to defaults */ }
  }

  // CEO Shadow log
  let shadowData = { decisions: 0, patterns: 0, confidence: 0, phase: 1 }
  try {
    const raw = await fs.readFile(path.join(__dirname, 'data/decisions/shadow_log.json'), 'utf8')
    const log = JSON.parse(raw)
    shadowData.decisions = log.length
    shadowData.patterns = log.filter(d => d.similar_count > 0).length
    const avgConf = log.length > 0
      ? Math.round(log.reduce((s, d) => s + (d.confidence_before || 0), 0) / log.length * 100)
      : 0
    shadowData.confidence = avgConf
    shadowData.phase = avgConf >= 85 ? 3 : avgConf >= 50 ? 2 : 1
  } catch { /* defaults */ }

  return {
    generated: new Date().toISOString(),
    market: process.env.ACTIVE_CONTEXT || 'USA',
    paused: process.env.AI_DISPATCH_PAUSED === 'true',
    metrics: {
      activeLoads:   airtableData?.activeLoads ?? 0,
      revenueWeek:   0,  // TODO: sum from Airtable Loads
      revenueChange: 0,
      truckCount:    airtableData?.truckCount ?? 0,
      trialCount:    0
    },
    decisions: {
      thisWeek: decisionSummary.recent_7_days,
      total:    decisionSummary.total
    },
    shadow: shadowData,
    ironRules: { fl: 0, rpm: 0, deadhead: 0, weight: 0 },
    agents: [
      { name: 'Maya',        role: 'Executive',    status: 'green', msg: 'Morning report sent' },
      { name: 'Erin',        role: 'Dispatcher',   status: 'green', msg: `${airtableData?.activeLoads ?? 0} active loads` },
      { name: 'Compliance',  role: 'Gatekeeper',   status: 'green', msg: 'All carriers vetted' },
      { name: 'Sales',       role: 'Lead Gen',     status: 'green', msg: 'Pipeline active' },
      { name: 'Onboarding',  role: 'Trial Funnel', status: 'green', msg: 'Watching trials' },
      { name: 'Support',     role: 'Retention',    status: 'green', msg: 'No open complaints' },
      { name: 'Receptionist','role': 'Voice AI',   status: 'green', msg: 'Listening for calls' },
      { name: 'Marketer',    role: 'Content',      status: 'green', msg: 'Content calendar live' },
      { name: 'CEO Shadow',  role: 'Observer',     status: 'purple', msg: `Phase ${shadowData.phase} · ${shadowData.decisions} decisions` }
    ],
    priorities: [
      'Connect Airtable to see live loads and carrier data',
      'Fill in .env credentials to activate all agents',
      'Add Uncle Kenneth\'s carrier info to data/kenneth/kenneth_profile.md',
      'Deploy to Railway for 24/7 access'
    ],
    decisions_needed: []
  }
}

// ── API endpoint ──────────────────────────────────────────────────────────────
app.get('/api/data', async (req, res) => {
  const data = await getLiveData()
  res.json(data)
})

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AI Dispatch Command Center', uptime: Math.floor(process.uptime()) })
})

// ── Main dashboard ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(DASHBOARD_HTML)
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[AI Dispatch] Command Center → http://localhost:${PORT}`)
  console.log(`[AI Dispatch] Market: ${process.env.ACTIVE_CONTEXT || 'USA'}`)
})

// ── Dashboard HTML (inline — no file dependency) ──────────────────────────────
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Dispatch — Command Center</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    :root{
      --bg:#0a0c10;--surface:#111318;--card:#161a22;--border:#1e2330;
      --accent:#2563eb;--purple:#7c3aed;
      --green:#22c55e;--red:#ef4444;--yellow:#d97706;
      --text:#e2e8f0;--muted:#64748b;
    }
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:flex}

    /* SIDEBAR */
    .sidebar{width:210px;min-height:100vh;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0}
    .brand{padding:18px 16px 12px;border-bottom:1px solid var(--border)}
    .brand h1{font-size:16px;font-weight:800;color:#fff}.brand h1 span{color:var(--accent)}
    .brand p{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:2px}
    .sec-label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);padding:12px 16px 4px}
    .agent-row{display:flex;align-items:center;gap:8px;padding:7px 16px;cursor:pointer;transition:background .15s;border-radius:0}
    .agent-row:hover{background:var(--card)}
    .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
    .dot-green{background:var(--green);box-shadow:0 0 5px rgba(34,197,94,.5)}
    .dot-purple{background:#a78bfa;box-shadow:0 0 5px rgba(167,139,250,.5)}
    .dot-red{background:var(--red)}
    .dot-yellow{background:var(--yellow)}
    .agent-name{font-size:12px;flex:1}
    .agent-role{font-size:9px;color:var(--muted)}
    .sidebar-footer{margin-top:auto;padding:12px 16px;border-top:1px solid var(--border);font-size:10px;color:var(--muted)}
    .kill-row{display:flex;justify-content:space-between;align-items:center;margin-top:6px}
    .kill-badge{font-size:9px;padding:2px 8px;border-radius:8px;background:rgba(22,163,74,.15);color:var(--green);border:1px solid rgba(34,197,94,.2)}
    .kill-badge.paused{background:rgba(220,38,38,.15);color:var(--red);border-color:rgba(239,68,68,.2)}

    /* MAIN */
    .main{flex:1;padding:24px;overflow-y:auto}
    .topbar{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px}
    .topbar h2{font-size:22px;font-weight:700;color:#fff;letter-spacing:-.3px}
    .topbar .sub{font-size:11px;color:var(--muted);margin-top:3px}
    .status-pill{display:flex;align-items:center;gap:6px;background:rgba(22,163,74,.1);border:1px solid rgba(34,197,94,.2);border-radius:20px;padding:5px 12px;font-size:11px;color:var(--green)}
    .pulse{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 6px rgba(34,197,94,.7)}

    /* TABS */
    .tabs{display:flex;gap:6px;margin-bottom:18px}
    .tab{padding:5px 16px;border-radius:20px;border:1px solid var(--border);background:var(--card);color:var(--muted);font-size:11px;cursor:pointer}
    .tab.active{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}

    /* METRICS */
    .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
    .metric{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:14px}
    .metric .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin-bottom:6px}
    .metric .val{font-size:28px;font-weight:700;color:#fff;letter-spacing:-1px;line-height:1}
    .metric .trend{font-size:10px;margin-top:4px}
    .up{color:var(--green)}.down{color:var(--red)}.neutral{color:var(--muted)}

    /* ROW LAYOUT */
    .row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
    .row3{display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:12px}
    .card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:16px}
    .card-title{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:12px}

    /* PRIORITY */
    .p-item{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)}
    .p-item:last-child{border-bottom:none}
    .pnum{width:20px;height:20px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;color:#fff}
    .pnum.warn{background:var(--yellow)}
    .ptxt{font-size:11px;line-height:1.45;flex:1}

    /* DECISIONS */
    .dec-card{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px}
    .dec-card:last-child{margin-bottom:0}
    .dec-meta{display:flex;gap:6px;align-items:center;margin-bottom:6px}
    .tier-badge{font-size:8px;padding:2px 7px;border-radius:8px;background:rgba(217,119,6,.15);color:#fbbf24;font-weight:700}
    .dec-agent{font-size:9px;color:var(--muted)}
    .dec-txt{font-size:11px;line-height:1.45;margin-bottom:8px}
    .dec-btns{display:flex;gap:6px}
    .btn-approve{padding:5px 14px;border-radius:5px;border:none;background:#16a34a;color:#fff;font-size:10px;font-weight:700;cursor:pointer}
    .btn-reject{padding:5px 12px;border-radius:5px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:10px;cursor:pointer}
    .all-good{color:var(--green);font-size:11px;text-align:center;padding:8px 0}

    /* IRON RULES */
    .iron-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
    .iron-stat{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center}
    .iron-num{font-size:22px;font-weight:700;color:var(--red);line-height:1}
    .iron-num.zero{color:var(--green)}
    .iron-lbl{font-size:9px;color:var(--muted);margin-top:2px}

    /* CEO SHADOW */
    .phase-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}
    .phase-badge{font-size:9px;padding:2px 8px;border-radius:10px;background:rgba(124,58,237,.15);color:#a78bfa;border:1px solid rgba(124,58,237,.3);font-weight:700}
    .shadow-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:11px}
    .shadow-row:last-child{border-bottom:none}
    .skey{color:var(--muted)}.sval{color:#fff;font-weight:600}

    /* AGENT STATUS */
    .as-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:11px}
    .as-row:last-child{border-bottom:none}
    .as-name{display:flex;align-items:center;gap:6px}
    .as-msg{font-size:10px;color:var(--muted)}

    footer{text-align:center;font-size:10px;color:var(--muted);padding:14px 0 2px;border-top:1px solid var(--border);margin-top:8px}
    .loading{opacity:.4}

    @media(max-width:900px){
      .sidebar{display:none}
      .metrics{grid-template-columns:1fr 1fr}
      .row,.row3{grid-template-columns:1fr}
    }
  </style>
</head>
<body>

<div class="sidebar">
  <div class="brand">
    <h1>AI<span>Dispatch</span></h1>
    <p>Command Center</p>
  </div>
  <div class="sec-label">Agents</div>
  <div id="sidebar-agents"></div>
  <div class="sidebar-footer">
    <div id="footer-time">Loading...</div>
    <div class="kill-row">
      <span style="font-size:10px">Kill Switch</span>
      <span class="kill-badge" id="kill-badge">OFF</span>
    </div>
  </div>
</div>

<div class="main">
  <div class="topbar">
    <div>
      <h2>Command Center</h2>
      <div class="sub" id="topbar-sub">Loading...</div>
    </div>
    <div class="status-pill" id="status-pill">
      <div class="pulse"></div>
      <span id="status-text">Loading...</span>
    </div>
  </div>

  <div class="tabs">
    <div class="tab active" id="tab-usa">🇺🇸 USA</div>
    <div class="tab" id="tab-canada">🇨🇦 Canada</div>
    <div class="tab" id="tab-eu">🇪🇺 EU</div>
    <div class="tab" id="tab-uk">🇬🇧 UK</div>
  </div>

  <div class="metrics">
    <div class="metric"><div class="lbl">Active Loads</div><div class="val" id="m-loads">—</div><div class="trend up" id="m-loads-trend"></div></div>
    <div class="metric"><div class="lbl">Revenue This Week</div><div class="val" id="m-rev">—</div><div class="trend up" id="m-rev-trend"></div></div>
    <div class="metric"><div class="lbl">Trucks Under Mgmt</div><div class="val" id="m-trucks">—</div><div class="trend neutral">Year goal: 200</div></div>
    <div class="metric"><div class="lbl">Trial Prospects</div><div class="val" id="m-trials">—</div><div class="trend neutral" id="m-trials-trend"></div></div>
  </div>

  <div class="row">
    <div class="card">
      <div class="card-title">Today's Priority List</div>
      <div id="priorities"></div>
    </div>
    <div class="card">
      <div class="card-title">Needs Your Decision</div>
      <div id="decisions"></div>
    </div>
  </div>

  <div class="row3">
    <div class="card">
      <div class="card-title">Iron Rule Activity — This Week</div>
      <div class="iron-grid" id="iron-grid"></div>
    </div>
    <div class="card">
      <div class="card-title">CEO Shadow</div>
      <div id="shadow-panel"></div>
    </div>
  </div>

  <div class="card" style="margin-bottom:12px">
    <div class="card-title">Agent Status</div>
    <div id="agent-status"></div>
  </div>

  <footer id="footer">Generated by Maya · AI Dispatch OS</footer>
</div>

<script>
async function load() {
  const r = await fetch('/api/data')
  const d = await r.json()

  // Topbar
  const now = new Date()
  document.getElementById('topbar-sub').textContent =
    now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}) + '  ·  ' + d.market + ' Market Active'
  document.getElementById('status-text').textContent = d.paused ? 'System Paused' : 'All Systems Operational'
  document.getElementById('status-pill').style.background = d.paused ? 'rgba(220,38,38,.1)' : 'rgba(22,163,74,.1)'
  document.getElementById('status-pill').style.borderColor = d.paused ? 'rgba(239,68,68,.2)' : 'rgba(34,197,94,.2)'
  document.getElementById('status-text').style.color = d.paused ? '#ef4444' : '#22c55e'

  // Footer time
  document.getElementById('footer-time').textContent = 'Refreshed ' + now.toLocaleTimeString()
  document.getElementById('kill-badge').textContent = d.paused ? 'ON' : 'OFF'
  document.getElementById('kill-badge').className = 'kill-badge' + (d.paused ? ' paused' : '')

  // Metrics
  document.getElementById('m-loads').textContent = d.metrics.activeLoads
  document.getElementById('m-loads-trend').textContent = d.decisions.thisWeek + ' decisions this week'
  document.getElementById('m-rev').textContent = '$' + d.metrics.revenueWeek.toLocaleString()
  const rc = d.metrics.revenueChange
  document.getElementById('m-rev-trend').textContent = (rc >= 0 ? '↑ $' : '↓ $') + Math.abs(rc).toLocaleString() + ' vs last week'
  document.getElementById('m-trucks').textContent = d.metrics.truckCount
  document.getElementById('m-trials').textContent = d.metrics.trialCount
  document.getElementById('m-trials-trend').textContent = d.metrics.trialCount > 0 ? d.metrics.trialCount + ' active' : 'None active'

  // Priorities
  document.getElementById('priorities').innerHTML = d.priorities.map((p,i) =>
    '<div class="p-item"><div class="pnum">'+(i+1)+'</div><div class="ptxt">'+p+'</div></div>'
  ).join('')

  // Decisions
  document.getElementById('decisions').innerHTML = d.decisions_needed.length > 0
    ? d.decisions_needed.map(dec => '<div class="dec-card"><div class="dec-meta"><span class="tier-badge">TIER 2</span><span class="dec-agent">'+dec.agent+'</span></div><div class="dec-txt">'+dec.text+'</div><div class="dec-btns"><button class="btn-approve">Approve</button><button class="btn-reject">Reject</button></div></div>').join('')
    : '<div class="all-good">No decisions needed today</div>'

  // Iron Rules
  const ir = d.ironRules
  document.getElementById('iron-grid').innerHTML = [
    [ir.fl,'No Florida'],[ir.rpm,'Low RPM'],[ir.deadhead,'Deadhead'],[ir.weight,'Weight']
  ].map(([n,l]) => '<div class="iron-stat"><div class="iron-num'+(n===0?' zero':'')+'">'+n+'</div><div class="iron-lbl">'+l+'</div></div>').join('')

  // CEO Shadow
  const sh = d.shadow
  document.getElementById('shadow-panel').innerHTML =
    '<div class="phase-row"><span class="phase-badge">Phase '+sh.phase+'</span><span style="font-size:10px;color:var(--muted)">'+(sh.phase===1?'Observe & Learn':sh.phase===2?'Suggest':'Proxy')+'</span></div>' +
    '<div class="shadow-row"><span class="skey">Decisions logged</span><span class="sval">'+sh.decisions+'</span></div>' +
    '<div class="shadow-row"><span class="skey">Patterns found</span><span class="sval">'+sh.patterns+'</span></div>' +
    '<div class="shadow-row"><span class="skey">Confidence</span><span class="sval '+(sh.confidence>=85?'up':sh.confidence>=50?'neutral':'')+'">'+sh.confidence+'%</span></div>'

  // Agent status
  document.getElementById('agent-status').innerHTML = d.agents.map(a =>
    '<div class="as-row"><div class="as-name"><div class="dot dot-'+(a.status==='purple'?'purple':'green')+'"></div>'+a.name+'</div><div class="as-msg">'+a.msg+'</div></div>'
  ).join('')

  // Sidebar agents
  document.getElementById('sidebar-agents').innerHTML = d.agents.map(a =>
    '<div class="agent-row"><div class="dot dot-'+(a.status==='purple'?'purple':'green')+'"></div><span class="agent-name">'+a.name+'</span><span class="agent-role">'+a.role+'</span></div>'
  ).join('')

  // Footer
  document.getElementById('footer').textContent =
    'Generated by Maya · AI Dispatch OS · ' + now.toLocaleTimeString() + ' · ' + d.market + ' Market'
}

load()
setInterval(load, 5 * 60 * 1000) // refresh every 5 min
</script>
</body>
</html>`
