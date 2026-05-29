// Public API surface for @uselimit/core

export { UseLimitClient } from './client.js'

export type {
  // Config
  UseLimitConfig,
  // Domain types
  Tenant,
  TenantId,
  User,
  UserId,
  FeatureKey,
  Plan,
  PlanId,
  FeatureLimit,
  ResetPeriod,
  CreditBalance,
  UsageEvent,
  // Check / consume
  CheckParams,
  CheckResult,
  ConsumeParams,
  ConsumeResult,
  // Export
  ExportParams,
  ExportResult,
  ExportFormat,
  // Storage
  StorageAdapter,
} from './types.js'

export { InMemoryAdapter } from './storage/memory.js'
