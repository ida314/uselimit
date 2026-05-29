// ─── Domain types ────────────────────────────────────────────────────────────
// These are the core building blocks. Implement behavior in other modules;
// keep this file as a pure type/interface definition.

/** ISO-8601 datetime string */
export type ISODateString = string

/** Uniquely identifies a tenant (team, org, or project) */
export type TenantId = string

/** Uniquely identifies an end user within a tenant */
export type UserId = string

/** A named capability or resource that can be metered (e.g. "generate-image", "summaries") */
export type FeatureKey = string

/** A named billing / entitlement plan (e.g. "free", "pro", "enterprise") */
export type PlanId = string

// ─── Quota + limit config ────────────────────────────────────────────────────

export type ResetPeriod = 'daily' | 'monthly' | 'rolling_24h' | 'rolling_30d' | 'never'

export interface FeatureLimit {
  /** Maximum allowed usage per reset period. null = unlimited */
  max: number | null
  resetPeriod: ResetPeriod
}

export interface Plan {
  id: PlanId
  /** Credits allocated at the start of each monthly period */
  monthlyCredits: number | null
  /** Per-feature limits keyed by FeatureKey */
  limits: Record<FeatureKey, FeatureLimit>
}

// ─── Tenant / user ───────────────────────────────────────────────────────────

export interface Tenant {
  id: TenantId
  planId: PlanId
  /** When the current billing/credit period started */
  periodStart: ISODateString
  createdAt: ISODateString
}

export interface User {
  id: UserId
  tenantId: TenantId
  /** Optional per-user plan override; falls back to tenant plan when absent */
  planId?: PlanId
  createdAt: ISODateString
}

// ─── Credit balance ──────────────────────────────────────────────────────────

export interface CreditBalance {
  tenantId: TenantId
  userId?: UserId
  /** Credits remaining in the current period */
  remaining: number
  /** Credits allocated for the current period */
  allocated: number
  /** When the balance resets to the allocated amount */
  resetAt: ISODateString
}

// ─── Usage events ────────────────────────────────────────────────────────────

export interface UsageEvent {
  id: string
  tenantId: TenantId
  userId?: UserId
  feature: FeatureKey
  /** Cost in credits */
  amount: number
  metadata?: Record<string, unknown>
  timestamp: ISODateString
}

// ─── Check / consume API shapes ──────────────────────────────────────────────

export interface CheckParams {
  tenantId: TenantId
  userId?: UserId
  feature: FeatureKey
  /** Estimated cost in credits for the pending operation */
  cost?: number
}

export interface CheckResult {
  allowed: boolean
  /** Credits remaining after a hypothetical consume of `cost` */
  remaining: number
  /** When the limit/balance resets */
  resetAt: ISODateString
  /** Human-readable reason when allowed=false */
  reason?: string
}

export interface ConsumeParams {
  tenantId: TenantId
  userId?: UserId
  feature: FeatureKey
  /** Actual credits to deduct */
  amount: number
  metadata?: Record<string, unknown>
}

export interface ConsumeResult {
  allowed: boolean
  /** Credits remaining after this consume */
  remaining: number
  resetAt: ISODateString
  /** The usage event that was recorded, if allowed=true */
  event?: UsageEvent
  /** Human-readable reason when allowed=false */
  reason?: string
}

// ─── Export ──────────────────────────────────────────────────────────────────

export type ExportFormat = 'json' | 'csv'

export interface ExportParams {
  tenantId?: TenantId
  userId?: UserId
  feature?: FeatureKey
  from?: ISODateString
  to?: ISODateString
  format?: ExportFormat
}

export interface ExportResult {
  format: ExportFormat
  /** Raw payload — string for csv, object[] for json */
  data: string | UsageEvent[]
  count: number
}

// ─── Storage adapter interface ────────────────────────────────────────────────
// Implemented in packages/core/src/storage/. See storage/types.ts.
export type { StorageAdapter } from './storage/types.js'

// ─── Client config ───────────────────────────────────────────────────────────

export interface UseLimitConfig {
  /** Storage adapter instance. Defaults to in-memory if omitted. */
  storage?: import('./storage/types.js').StorageAdapter
  /** Plan definitions. Can be loaded from a YAML/JSON config file. */
  plans?: Plan[]
  /** Default plan to apply when no plan is found for a tenant */
  defaultPlanId?: PlanId
}
