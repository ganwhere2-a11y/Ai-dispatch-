/**
 * AI Dispatch — Command Center Server
 * Deployed on Railway. Serves the live dashboard at /
 * Maya regenerates the dashboard every 5 minutes automatically.
 */

import 'dotenv/config'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateCommandCenter } from './command_center/generator.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// Regenerate dashboard on startup
let lastGenerated = null
let cachedHTML = null

async function refreshDashboard() {
  try {
    cachedHTML = await generateCommandCenter({ fromAirtable: !!process.env.AIRTABLE_API_KEY })
    lastGenerated = new Date()
    console.log(`[CommandCenter] Refreshed at ${lastGenerated.toISOString()}`)
  } catch (err) {
    console.error('[CommandCenter] Refresh failed:', err.message)
  }
}

// Root — serve live dashboard
app.get('/', async (req, res) => {
  if (!cachedHTML) await refreshDashboard()
  res.setHeader('Content-Type', 'text/html')
  res.send(cachedHTML)
})

// Force refresh
app.get('/refresh', async (req, res) => {
  await refreshDashboard()
  res.redirect('/')
})

// Health check for Railway
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Dispatch Command Center',
    last_generated: lastGenerated,
    market: process.env.ACTIVE_CONTEXT || 'USA',
    uptime_seconds: Math.floor(process.uptime())
  })
})

// Static files (CSS, assets if any)
app.use('/static', express.static(path.join(__dirname, 'command_center')))

// Start server
app.listen(PORT, () => {
  console.log(`[AI Dispatch] Command Center running on port ${PORT}`)
  console.log(`[AI Dispatch] Market: ${process.env.ACTIVE_CONTEXT || 'USA'}`)
  // Initial load
  refreshDashboard()
  // Auto-refresh every 5 minutes
  setInterval(refreshDashboard, 5 * 60 * 1000)
})
