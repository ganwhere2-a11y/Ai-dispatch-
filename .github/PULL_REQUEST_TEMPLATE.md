## Summary

<!-- What does this PR do? Which agent(s) or workflow(s) are affected? -->

## Agents Affected

- [ ] Maya (Executive Assistant)
- [ ] Erin (Dispatcher)
- [ ] Compliance
- [ ] Receptionist
- [ ] Sales
- [ ] Onboarding
- [ ] Support
- [ ] Shadow
- [ ] Marketer
- [ ] Workflow / Decision Engine
- [ ] Shared / Config

## Iron Rules Checked

- [ ] No Florida rule unaffected
- [ ] RPM thresholds unchanged or updated via `.env` only
- [ ] Deadhead / weight / authority age rules intact
- [ ] Cargo type restriction intact

## Tests Run

```bash
npm run test:iron-rules
npm run test:pricing
npm run test:decision-engine
```

- [ ] All tests pass locally

## Governance Tier

Highest tier action this PR introduces:
- [ ] Tier 0 — Read/draft/calculate (auto)
- [ ] Tier 1 — Send/update/log (auto + logged)
- [ ] Tier 2 — Quotes >$5K, new carrier first load (Maya → Owner SMS)
- [ ] Tier 3 — Contracts, pricing changes, new markets (Owner only)
