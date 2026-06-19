import { describe, expect, it } from 'vitest'
import { InMemoryAdapter, UseLimitClient } from '../src/index.js'
import type { Plan } from '../src/index.js'

const TENANT = 'team_abc'

interface SetupOptions {
  remaining?: number
  monthlyCredits?: number | null
  limits?: Plan['limits']
  seedBalance?: boolean
}

async function setup(options: SetupOptions = {}) {
  const { remaining = 100, monthlyCredits = 100, limits = {}, seedBalance = true } = options

  const now = Date.now()
  const periodStart = new Date(now - 86_400_000).toISOString()
  const resetAt = new Date(now + 30 * 86_400_000).toISOString()

  const storage = new InMemoryAdapter()
  const plans: Plan[] = [{ id: 'free', monthlyCredits, limits }]

  await storage.upsertTenant({ id: TENANT, planId: 'free', periodStart, createdAt: periodStart })
  if (seedBalance) {
    await storage.setBalance({ tenantId: TENANT, remaining, allocated: 100, resetAt })
  }

  return { storage, usage: new UseLimitClient({ storage, plans }) }
}

describe('consume()', () => {
  it('deducts credits, returns allowed=true, and persists the new balance', async () => {
    const { storage, usage } = await setup({ remaining: 100 })

    const result = await usage.consume({ tenantId: TENANT, feature: 'generate', amount: 10 })

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(90)
    expect(result.event).toBeDefined()

    const balance = await storage.getBalance(TENANT)
    expect(balance?.remaining).toBe(90)
  })

  it('records a UsageEvent carrying the feature, amount, tenant, and metadata', async () => {
    const { usage } = await setup({ remaining: 100 })

    const result = await usage.consume({
      tenantId: TENANT,
      feature: 'generate',
      amount: 5,
      metadata: { requestId: 'req_1' },
    })

    expect(result.event?.id).toBeTruthy()
    expect(result.event?.tenantId).toBe(TENANT)
    expect(result.event?.feature).toBe('generate')
    expect(result.event?.amount).toBe(5)
    expect(result.event?.metadata).toEqual({ requestId: 'req_1' })
  })

  it('does not deduct credits or record an event when not allowed', async () => {
    const { storage, usage } = await setup({ remaining: 5 })

    const result = await usage.consume({ tenantId: TENANT, feature: 'generate', amount: 10 })

    expect(result.allowed).toBe(false)
    expect(result.event).toBeUndefined()

    const balance = await storage.getBalance(TENANT)
    expect(balance?.remaining).toBe(5)

    const events = await storage.queryEvents({ tenantId: TENANT })
    expect(events).toHaveLength(0)
  })

  it('still records the event with remaining=Infinity on an unlimited plan', async () => {
    const { storage, usage } = await setup({ monthlyCredits: null, seedBalance: false })

    const result = await usage.consume({ tenantId: TENANT, feature: 'generate', amount: 50 })

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(Infinity)
    expect(result.event).toBeDefined()

    const events = await storage.queryEvents({ tenantId: TENANT })
    expect(events).toHaveLength(1)
  })

  it('blocks the consume that would exceed a per-feature quota, without deducting it', async () => {
    const { storage, usage } = await setup({
      remaining: 100,
      limits: { summaries: { max: 2, resetPeriod: 'monthly' } },
    })

    await usage.consume({ tenantId: TENANT, feature: 'summaries', amount: 1 })
    await usage.consume({ tenantId: TENANT, feature: 'summaries', amount: 1 })
    const third = await usage.consume({ tenantId: TENANT, feature: 'summaries', amount: 1 })

    expect(third.allowed).toBe(false)
    expect(third.reason).toContain('quota')

    // Only the two allowed consumes were charged against the balance.
    const balance = await storage.getBalance(TENANT)
    expect(balance?.remaining).toBe(98)
  })

  // Documented as NOT handled by the in-memory adapter / current contract:
  it.todo('handles concurrent consumes without double-deduction (atomicity)')
  it.todo('resets the quota counter after the reset period elapses')
})
