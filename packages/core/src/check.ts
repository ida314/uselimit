import type { CheckParams, CheckResult, ResetPeriod, UseLimitConfig } from './types.js'
import { InMemoryAdapter } from './storage/memory.js'

function periodStart(resetPeriod: ResetPeriod, tenantPeriodStart: string): string {
  const now = new Date()
  switch (resetPeriod) {
    case 'daily': {
      const d = new Date(now)
      d.setUTCHours(0, 0, 0, 0)
      return d.toISOString()
    }
    case 'monthly':
      return tenantPeriodStart
    case 'rolling_24h':
      return new Date(now.getTime() - 86_400_000).toISOString()
    case 'rolling_30d':
      return new Date(now.getTime() - 2_592_000_000).toISOString()
    case 'never':
      return new Date(0).toISOString()
  }
}

function nextReset(resetPeriod: ResetPeriod, tenantPeriodStart: string): string {
  const now = new Date()
  switch (resetPeriod) {
    case 'daily': {
      const d = new Date(now)
      d.setUTCHours(0, 0, 0, 0)
      d.setUTCDate(d.getUTCDate() + 1)
      return d.toISOString()
    }
    case 'monthly': {
      const start = new Date(tenantPeriodStart)
      start.setUTCMonth(start.getUTCMonth() + 1)
      return start.toISOString()
    }
    case 'rolling_24h':
      return new Date(now.getTime() + 86_400_000).toISOString()
    case 'rolling_30d':
      return new Date(now.getTime() + 2_592_000_000).toISOString()
    case 'never':
      return new Date(8640000000000000).toISOString()
  }
}

export async function check(
  params: CheckParams,
  config: UseLimitConfig,
): Promise<CheckResult> {
  const storage = config.storage ?? new InMemoryAdapter()
  const cost = params.cost ?? 0

  const tenant = await storage.getTenant(params.tenantId)
  if (!tenant) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date().toISOString(),
      reason: 'Tenant not found',
    }
  }

  const user = params.userId
    ? await storage.getUser(params.tenantId, params.userId)
    : null

  const planId = user?.planId ?? tenant.planId ?? config.defaultPlanId
  const plan = config.plans?.find(p => p.id === planId) ?? null

  const balance = await storage.getBalance(params.tenantId, params.userId)

  // Check per-feature quota
  if (plan) {
    const limit = plan.limits[params.feature]
    if (limit && limit.max !== null) {
      const from = periodStart(limit.resetPeriod, tenant.periodStart)
      const events = await storage.queryEvents({
        tenantId: params.tenantId,
        userId: params.userId,
        feature: params.feature,
        from,
      })
      const used = events.reduce((sum, e) => sum + e.amount, 0)
      const quotaRemaining = limit.max - used
      if (quotaRemaining < cost) {
        return {
          allowed: false,
          remaining: balance?.remaining ?? 0,
          resetAt: nextReset(limit.resetPeriod, tenant.periodStart),
          reason: `Feature quota exceeded for '${params.feature}'`,
        }
      }
    }
  }

  // Check credit balance (skip if plan grants unlimited credits)
  const hasUnlimitedCredits = plan !== null && plan.monthlyCredits === null
  if (!hasUnlimitedCredits && balance !== null && balance.remaining < cost) {
    return {
      allowed: false,
      remaining: balance.remaining,
      resetAt: balance.resetAt,
      reason: 'Insufficient credits',
    }
  }

  return {
    allowed: true,
    remaining: balance !== null ? balance.remaining - cost : Infinity,
    resetAt: balance?.resetAt ?? new Date(8640000000000000).toISOString(),
  }
}
