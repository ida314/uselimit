import { describe, expect, it } from 'vitest'
import { InMemoryAdapter, UseLimitClient } from '../src/index.js'
import type { Plan } from '../src/index.js'

const TENANT = 'team_abc'

interface SetupOptions {
  remaining?: number
  monthlyCredits?: number | null
  limits?: Plan['limits']
  seedTenant?: boolean
  seedBalance?: boolean
}

/** Seed a fresh in-memory adapter with a tenant, balance, and plan. */
async function setup(options: SetupOptions = {}) {
  const {
    remaining = 100,
    monthlyCredits = 100,
    limits = {},
    seedTenant = true,
    seedBalance = true,
  } = options

  const now = Date.now()
  // Period started yesterday so "now" always falls inside it, regardless of
  // the machine clock.
  const periodStart = new Date(now - 86_400_000).toISOString()
  const resetAt = new Date(now + 30 * 86_400_000).toISOString()

  const storage = new InMemoryAdapter()
  const plans: Plan[] = [{ id: 'free', monthlyCredits, limits }]

  if (seedTenant) {
    await storage.upsertTenant({
      id: TENANT,
      planId: 'free',
      periodStart,
      createdAt: periodStart,
    })
    if (seedBalance) {
      await storage.setBalance({ tenantId: TENANT, remaining, allocated: 100, resetAt })
    }
  }

  return { storage, usage: new UseLimitClient({ storage, plans }) }
}

describe('check()', () => {
  it('returns allowed=true and the post-deduction remaining when credits are sufficient', async () => {
    const { usage } = await setup({ remaining: 100 })

    const result = await usage.check({ tenantId: TENANT, feature: 'generate', cost: 5 })

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(95)
  })

  it('returns allowed=false with a reason when credits are exhausted', async () => {
    const { usage } = await setup({ remaining: 2 })

    const result = await usage.check({ tenantId: TENANT, feature: 'generate', cost: 5 })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Insufficient credits')
    expect(result.remaining).toBe(2)
  })

  it('returns allowed=false when the per-feature quota is exceeded', async () => {
    const { storage, usage } = await setup({
      remaining: 100,
      limits: { summaries: { max: 3, resetPeriod: 'monthly' } },
    })

    // Burn the whole quota by recording events directly.
    for (let i = 0; i < 3; i++) {
      await storage.recordEvent({
        id: `evt_${i}`,
        tenantId: TENANT,
        feature: 'summaries',
        amount: 1,
        timestamp: new Date().toISOString(),
      })
    }

    const result = await usage.check({ tenantId: TENANT, feature: 'summaries', cost: 1 })

    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('quota')
  })

  it('returns allowed=true for an unlimited plan regardless of balance', async () => {
    const { usage } = await setup({
      monthlyCredits: null,
      seedBalance: false,
      limits: { summaries: { max: null, resetPeriod: 'monthly' } },
    })

    const result = await usage.check({ tenantId: TENANT, feature: 'summaries', cost: 9999 })

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(Infinity)
  })

  it('returns allowed=false with reason "Tenant not found" when the tenant is unseeded', async () => {
    const { usage } = await setup({ seedTenant: false })

    const result = await usage.check({ tenantId: 'missing', feature: 'generate', cost: 1 })

    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Tenant not found')
  })

  it('returns a parseable ISO-8601 resetAt', async () => {
    const { usage } = await setup({ remaining: 100 })

    const result = await usage.check({ tenantId: TENANT, feature: 'generate', cost: 1 })

    expect(typeof result.resetAt).toBe('string')
    expect(Number.isNaN(Date.parse(result.resetAt))).toBe(false)
  })

  // Still to cover:
  it.todo('falls back to defaultPlanId when the tenant has no plan record')
  it.todo('returns the correct resetAt for a daily reset period')
})
