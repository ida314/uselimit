import type { CheckParams, CheckResult, UseLimitConfig } from './types.js'

/**
 * check() — read-only pre-flight: answers "is this action allowed?"
 *           without recording any usage.
 *
 * Callers use this to gate expensive AI/API calls before they happen.
 *
 * TODO: implement the following steps in order:
 *   1. Resolve the tenant and user records from storage
 *   2. Resolve the applicable Plan (tenant plan → default plan)
 *   3. Resolve the FeatureLimit for the requested feature
 *   4. Load the current CreditBalance from storage
 *   5. Check credit balance against cost
 *   6. Check per-feature quota against current period usage
 *   7. Return CheckResult with allowed, remaining, resetAt, reason
 */
export async function check(
  params: CheckParams,
  config: UseLimitConfig,
): Promise<CheckResult> {
  // TODO: remove this stub and implement logic
  void params
  void config
  throw new Error('Not implemented: check()')
}
