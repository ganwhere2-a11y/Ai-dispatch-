# Strategic Context
## Where AI Dispatch Is Heading

**Last updated:** 2026-04-02

---

## The Vision

A fully autonomous AI dispatch operation running across 4 markets (USA, Canada, EU, UK), managing 500+ carriers, generating $272K/month, with the owner making fewer than 5 decisions per day.

The end state is "Guardrails" — a fully unbreakable AI system where every decision flows through rule-based logic. No bad loads. No bad carriers. No manual work. Just the owner reviewing what needs review and the system handling everything else.

---

## Growth Roadmap

### Year 1 — Master USA
- **Target:** 200+ carriers under management
- **Revenue:** $68K/week ($272K/month)
- **System:** All 9 agents fully operational, Decision Engine at 85%+ confidence on core dispatch
- **CEO Shadow:** Phase 1 complete (observe), beginning Phase 2 (suggest)
- **Milestone:** Owner making fewer than 10 decisions/day

### Year 2 — Clone to Canada, EU, UK
- **Target:** 500+ carriers across all 4 markets
- **System:** Same AI OS, different rule sets per market
  - Canada: Transport Canada, CVOR, CUSMA compliance layer
  - EU: GDP medical freight, CMR docs, cabotage rules
  - UK: Post-Brexit rules, UK operator licenses
- **CEO Shadow:** Phase 2 active (suggestions regularly adopted by owner)
- **Milestone:** System running 3 markets with minimal owner involvement

### Year 3 — Guardrails Complete
- **Target:** Fully unbreakable system, 500+ carriers globally
- **CEO Shadow:** Phase 3 (proxy) — handling Tier 2 decisions autonomously
- **Owner role:** Tier 3 only (contracts, new markets, pricing changes)
- **Exit option:** Business sellable — IP in the system is the asset

---

## What I Want the System to Achieve

1. **Remove me from daily dispatch** — Erin handles all loads without my involvement
2. **Remove me from carrier acquisition** — Sales + Onboarding run the pipeline
3. **Remove me from compliance** — Compliance agent gates every carrier automatically
4. **Keep me for strategy** — I set the rules, I approve the big stuff, I expand to new markets
5. **Eventually: digital CEO** — CEO Shadow proxies Tier 2 decisions, I only do Tier 3

---

## Market Expansion Order

| Market | Status | Key Compliance Layer |
|---|---|---|
| USA | Active | DOT/FMCSA, Iron Rules |
| Canada | Year 2 | Transport Canada, CVOR, CUSMA |
| EU | Year 2 | GDP, CMR, cabotage rules |
| UK | Year 2 | Post-Brexit, UK operator license |

All markets run on the same agent architecture. Only the compliance rules and rate benchmarks change per market. `ACTIVE_CONTEXT` env variable controls which market is live.

---

## The "Guardrails" Goal

The ultimate state: an AI system where it is **architecturally impossible** to make a bad dispatch decision.

This means:
- Every load evaluated against Iron Rules before any human sees it
- Every carrier vetted against FMCSA before any load is offered
- Every Tier 2+ action blocked until owner approval is received
- CEO Shadow has enough pattern data to suggest decisions with 90%+ accuracy
- Kill switch (`AI_DISPATCH_PAUSED=true`) shuts down everything instantly if needed

The system is not finished until a bad decision literally cannot happen.

---

## CEO Shadow — 3-Phase Proxy Roadmap

| Phase | Timeline | Behavior |
|---|---|---|
| Phase 1: Observe | 0–90 days | Logs all Tier 2+ decisions, builds pattern library, never suggests |
| Phase 2: Suggest | 90–180 days | Surfaces pattern-matched recommendations, owner still decides |
| Phase 3: Proxy | 180+ days | Handles Tier 2 decisions autonomously when confidence ≥ 85%, owner reviews logs |

CEO Shadow triggers on every Tier 2+ event from Erin, Maya, or any agent via the Decision Engine.

---

## What This Business Is Worth

The value is not the code. The value is:
- The Iron Rule logic tuned to specific margins and corridors
- The carrier relationship history and vetting patterns
- The CEO Shadow pattern library after years of real decisions
- The SOPs — the specific way this business dispatches, onboards, and retains
- The owner's decision philosophy baked into every agent

When this system reaches 500 carriers and $272K/month with 90%+ autonomous operation — **that is a sellable asset.**
