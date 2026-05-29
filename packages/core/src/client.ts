import type {
  CheckParams,
  CheckResult,
  ConsumeParams,
  ConsumeResult,
  ExportParams,
  ExportResult,
  UseLimitConfig,
} from './types.js'
import { check } from './check.js'
import { consume } from './consume.js'
import { exportUsage } from './export.js'

/**
 * UseLimitClient — the primary entry point for library consumers.
 *
 * Instantiate once (e.g. at app startup) and reuse across requests.
 *
 * @example
 * ```ts
 * import { UseLimitClient } from '@uselimit/core'
 *
 * const usage = new UseLimitClient({ plans: [...] })
 *
 * const result = await usage.consume({
 *   tenantId: 'team_abc',
 *   userId: 'user_123',
 *   feature: 'generate-image',
 *   amount: 12,
 * })
 *
 * if (!result.allowed) throw new Error('Usage limit exceeded')
 * ```
 */
export class UseLimitClient {
  private readonly config: UseLimitConfig

  constructor(config: UseLimitConfig = {}) {
    this.config = config
    // TODO: validate config (plans, storage adapter) on construction
    // TODO: call storage.initialize() if defined
  }

  /**
   * Read-only pre-flight: "is this action allowed right now?"
   * Does not record any usage event or deduct credits.
   */
  async check(params: CheckParams): Promise<CheckResult> {
    return check(params, this.config)
  }

  /**
   * Deduct credits and record a usage event.
   * Call this when the chargeable action is about to happen (or just completed).
   */
  async consume(params: ConsumeParams): Promise<ConsumeResult> {
    return consume(params, this.config)
  }

  /**
   * Export usage events as JSON or CSV.
   * Suitable for feeding into Stripe, a data warehouse, or user-facing dashboards.
   */
  async exportUsage(params: ExportParams): Promise<ExportResult> {
    return exportUsage(params, this.config)
  }
}
