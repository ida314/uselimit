import type { ConsumeParams, ConsumeResult, UseLimitConfig } from './types.js'

/**
 * consume() — deduct credits and record a usage event atomically.
 *
 * This is the write path. Call this after (or just before) the actual
 * AI/API call succeeds. For pre-flight checks use check() instead.
 *
 * TODO: implement the following steps in order:
 *   1. Run a check() to determine if the action is allowed
 *   2. If not allowed, return ConsumeResult with allowed=false immediately
 *   3. Deduct `amount` from the tenant/user CreditBalance in storage
 *   4. Decrement the per-feature quota counter for the current period
 *   5. Write a UsageEvent record via storage.recordEvent()
 *   6. Return ConsumeResult with allowed=true, updated remaining, and the event
 *
 * Atomicity note:
 *   TODO: decide how to handle partial failure between steps 3-5.
 *         Options: optimistic locking, idempotency keys, compensating writes.
 */
export async function consume(
  params: ConsumeParams,
  config: UseLimitConfig,
): Promise<ConsumeResult> {
  // TODO: remove this stub and implement logic
  void params
  void config
  throw new Error('Not implemented: consume()')
}
