/**
 * AI Dispatch — SOP Seeder
 * Loads all agent SOPs from sops/ and agents/ into data/sops/uploaded/
 * so every agent gets their training injected automatically on startup.
 *
 * Run: node scripts/seed-sops.js
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SOP_DIR = path.join(ROOT, 'data/sops/uploaded')

// Map every SOP file to the agent(s) it belongs to
const SOP_MAP = [
  // ── Agent-specific SOPs ──────────────────────────────────────────────
  {
    file: 'sops/maya_sop.md',
    title: 'Maya — Standard Operating Procedure',
    scope: 'Maya only',
  },
  {
    file: 'sops/erin_sop.md',
    title: 'Erin — Dispatcher SOP',
    scope: 'Erin only',
  },
  {
    file: 'sops/compliance_sop.md',
    title: 'Compliance Agent — SOP',
    scope: 'Compliance only',
  },
  {
    file: 'sops/receptionist_sop.md',
    title: 'Receptionist Agent — SOP',
    scope: 'Receptionist only',
  },
  {
    file: 'sops/sales_sop.md',
    title: 'Sales Agent — SOP',
    scope: 'Sales only',
  },

  // ── CEO Shadow — system prompt + observation rules ───────────────────
  {
    file: 'agents/shadow/system_prompt.md',
    title: 'CEO Shadow — System Prompt & Role',
    scope: 'CEO Shadow only',
  },
  {
    file: 'agents/shadow/observation_rules.md',
    title: 'CEO Shadow — Observation Rules',
    scope: 'CEO Shadow only',
  },

  // ── Global training — all agents ────────────────────────────────────
  {
    file: 'sops/training/dispatching_fundamentals.md',
    title: 'Dispatching Fundamentals — Full Training Course',
    scope: 'All agents (global)',
  },
  {
    file: 'sops/ai_team_build_sop.md',
    title: 'AI Team Build SOP — System Architecture & Principles',
    scope: 'All agents (global)',
  },
]

async function seedSops() {
  await fs.mkdir(SOP_DIR, { recursive: true })

  // Clear old seeded entries to avoid duplicates on re-run
  const existing = (await fs.readdir(SOP_DIR)).filter(f => f.endsWith('.json'))
  let cleared = 0
  for (const f of existing) {
    const raw = await fs.readFile(path.join(SOP_DIR, f), 'utf8').catch(() => '{}')
    const entry = JSON.parse(raw)
    if (entry.seeded) {
      await fs.unlink(path.join(SOP_DIR, f))
      cleared++
    }
  }
  if (cleared > 0) console.log(`🧹 Cleared ${cleared} old seeded SOP(s)`)

  let seeded = 0
  let skipped = 0

  for (const sop of SOP_MAP) {
    const filePath = path.join(ROOT, sop.file)
    let content

    try {
      content = await fs.readFile(filePath, 'utf8')
    } catch {
      console.warn(`⚠️  File not found — skipping: ${sop.file}`)
      skipped++
      continue
    }

    // Trim to 10,000 chars (server limit)
    const trimmed = content.slice(0, 10000)
    const safeName = sop.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md'
    const id = Date.now() + '_' + safeName + '_seeded'

    const meta = {
      id,
      title: sop.title,
      scope: sop.scope,
      content: trimmed,
      filename: safeName,
      type: 'md',
      saved: new Date().toISOString(),
      seeded: true,          // marks this as auto-seeded (so re-runs can clear it cleanly)
      source: sop.file,
    }

    await fs.writeFile(path.join(SOP_DIR, id + '.json'), JSON.stringify(meta, null, 2))
    console.log(`✓ ${sop.scope.padEnd(25)} ← ${sop.title}`)
    seeded++

    // Small delay so timestamps are unique
    await new Promise(r => setTimeout(r, 5))
  }

  console.log(`\n✅ Seeded ${seeded} SOP(s) into data/sops/uploaded/`)
  if (skipped > 0) console.log(`⚠️  ${skipped} file(s) skipped (not found)`)
  console.log(`\nAll agents now have their training. Scope routing:`)
  console.log(`  🌐 All agents  → Dispatching Fundamentals + AI Team Build SOP`)
  console.log(`  🎯 Maya        → maya_sop.md`)
  console.log(`  🎯 Erin        → erin_sop.md`)
  console.log(`  🎯 Compliance  → compliance_sop.md`)
  console.log(`  🎯 Receptionist → receptionist_sop.md`)
  console.log(`  🎯 Sales       → sales_sop.md`)
  console.log(`  🎯 CEO Shadow  → system_prompt.md + observation_rules.md`)
}

seedSops().catch(e => { console.error('Seed failed:', e.message); process.exit(1) })
