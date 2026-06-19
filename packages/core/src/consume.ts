import type { ConsumeParams, ConsumeResult, UseLimitConfig, CreditBalance, UsageEvent} from './types.js'
import { randomUUID } from 'crypto'
import { check } from './check.js' 
import { InMemoryAdapter } from './storage/memory.js'

/**
 * consume() — deduct credits and record a usage event.
 *
 * This is the write path. Call this after (or just before) the actual
 * AI/API call succeeds. For pre-flight checks use check() instead.
 *
 * Steps:
 *   1. Pre-flight check() to see if the action is allowed
 *   2. If not allowed, return the (denial) result immediately
 *   3. Deduct `amount` from the tenant/user CreditBalance
 *   4. Record a UsageEvent — this is also the per-feature quota source of
 *      truth (check() derives quota usage by summing events), so there is no
 *      separate quota counter to decrement.
 *   5. Return allowed=true with the updated remaining and the event
 *
 * Atomicity — what this does and does NOT guarantee:
 *
 *   Partial failure (HANDLED): steps 3 and 4 are two independent writes. If
 *   the balance is deducted (3) but the event write (4) throws, we'd silently
 *   overcharge the user and lose the audit/quota record. We deduct first, then
 *   record; if the record fails we issue a compensating write to restore the
 *   previous balance. Balance-first is deliberate — the StorageAdapter has no
 *   deleteEvent(), so a recorded event cannot be compensated.
 *
 *   Concurrency / lost update (NOT HANDLED): the read in check() and the write
 *   in setBalance() are not a single atomic operation, so two concurrent
 *   consume() calls can both pass the check and both deduct from the same
 *   starting balance (double-spend). The current StorageAdapter contract
 *   exposes no transaction, atomic-decrement, or optimistic-lock primitive, so
 *   this cannot be fixed here. It is acceptable for the single-process
 *   InMemoryAdapter; a real adapter (Postgres/Redis) must add a transactional
 *   commit or a version/compare-and-swap on CreditBalance, and consume()
 *   should switch to it when available.
 */
export async function consume(
  params: ConsumeParams,
  config: UseLimitConfig,
): Promise<ConsumeResult> {
  const storage = config.storage ?? new InMemoryAdapter()

  // Pre-flight. Pass the consume `amount` as the check `cost` — otherwise
  // check() defaults cost to 0 and would approve any amount, letting the
  // balance go negative.
  const checkResult = await check(
    {
      tenantId: params.tenantId,
      userId: params.userId,
      feature: params.feature,
      cost: params.amount,
    },
    { ...config, storage },
  )
  if (!checkResult.allowed) {
    // CheckResult is structurally a ConsumeResult (event is optional/absent).
    return checkResult
  }

  const usageEvent: UsageEvent = {
    id: randomUUID(),
    tenantId: params.tenantId,
    userId: params.userId,
    feature: params.feature,
    amount: params.amount,
    metadata: params.metadata,
    timestamp: new Date().toISOString(),
  }

  const balance = await storage.getBalance(params.tenantId, params.userId)

  // A null balance means this tenant/user has unlimited credits. We still
  // record the event so the action is metered for quota and usage export.
  if (balance === null) {
    await storage.recordEvent(usageEvent)
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: checkResult.resetAt,
      event: usageEvent,
    }
  }

  const newRemaining = balance.remaining - params.amount
  const updatedBalance: CreditBalance = { ...balance, remaining: newRemaining }

  // ── critical section ────────────────────────────────────────
  await storage.setBalance(updatedBalance)
  try {
    await storage.recordEvent(usageEvent)
  } catch (err) {
    // Compensating write: restore the pre-deduction balance so we don't
    // charge credits for an action we failed to record. Re-throw rather than
    // returning allowed=false — a storage failure is exceptional, not a
    // "limit exceeded" denial.
    await storage.setBalance(balance)
    throw err
  }

  return {
    allowed: true,
    remaining: newRemaining,
    resetAt: balance.resetAt,
    event: usageEvent,
  }
}
