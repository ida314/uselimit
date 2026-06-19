import express from 'express'
import { InMemoryAdapter, UseLimitClient } from '@uselimit/core'

const COST_PER_SUMMARY = 5

// ── Seed storage ──────────────────────────────────────────────────────────────
// In a real app this lives in your database and is populated on signup. Here we
// seed two tenants so you can see both the allowed and the blocked path.
const storage = new InMemoryAdapter()

const now = Date.now()
const periodStart = new Date(now).toISOString()
const resetAt = new Date(now + 30 * 86_400_000).toISOString()

await storage.upsertTenant({ id: 'team_funded', planId: 'free', periodStart, createdAt: periodStart })
await storage.setBalance({ tenantId: 'team_funded', remaining: 100, allocated: 100, resetAt })

await storage.upsertTenant({ id: 'team_broke', planId: 'free', periodStart, createdAt: periodStart })
await storage.setBalance({ tenantId: 'team_broke', remaining: 2, allocated: 100, resetAt })

const usage = new UseLimitClient({
  storage,
  plans: [
    { id: 'free', monthlyCredits: 100, limits: { summaries: { max: 20, resetPeriod: 'monthly' } } },
  ],
})

// ── A mocked "expensive" operation (pretend this calls an LLM) ─────────────────
async function summarize(text: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 50))
  return `Summary (${text.length} chars): ${text.slice(0, 40)}...`
}

// ── Server ────────────────────────────────────────────────────────────────────
const app = express()
app.use(express.json())

app.post('/summarize', async (req, res) => {
  const tenantId = req.header('x-tenant-id')
  if (!tenantId) {
    res.status(400).json({ error: 'Missing x-tenant-id header' })
    return
  }

  // 1. Pre-flight: refuse before doing any expensive work.
  const pre = await usage.check({ tenantId, feature: 'summaries', cost: COST_PER_SUMMARY })
  if (!pre.allowed) {
    // 402 Payment Required maps cleanly to "out of credits / quota".
    res.status(402).json({ error: pre.reason, resetAt: pre.resetAt })
    return
  }

  // 2. Do the expensive operation.
  const summary = await summarize(req.body?.text ?? '')

  // 3. Charge only after success.
  const result = await usage.consume({ tenantId, feature: 'summaries', amount: COST_PER_SUMMARY })

  res.json({ summary, creditsRemaining: result.remaining })
})

const port = Number(process.env.PORT ?? 3000)
app.listen(port, () => {
  console.log(`uselimit express example → http://localhost:${port}`)
  console.log('Try:')
  console.log(
    `  curl -sXPOST localhost:${port}/summarize -H 'x-tenant-id: team_funded' -H 'content-type: application/json' -d '{"text":"hello world"}'`,
  )
  console.log(
    `  curl -sXPOST localhost:${port}/summarize -H 'x-tenant-id: team_broke'  -H 'content-type: application/json' -d '{"text":"hello world"}'  # 402`,
  )
})
