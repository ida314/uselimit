import type {
  Tenant,
  TenantId,
  User,
  UserId,
  CreditBalance,
  UsageEvent,
  ExportParams,
} from '../types.js'

/**
 * StorageAdapter defines the persistence contract.
 *
 * Implement this interface to add a new storage backend
 * (e.g. Postgres, Redis, SQLite, DynamoDB).
 *
 * TODO: implement InMemoryAdapter in ./memory.ts (for tests)
 * TODO: implement PostgresAdapter in a separate @uselimit/storage-postgres package
 * TODO: implement RedisAdapter in a separate @uselimit/storage-redis package
 */
export interface StorageAdapter {
  // ── Tenants ───────────────────────────────────────────────────────────────

  getTenant(tenantId: TenantId): Promise<Tenant | null>
  upsertTenant(tenant: Tenant): Promise<void>

  // ── Users ─────────────────────────────────────────────────────────────────

  getUser(tenantId: TenantId, userId: UserId): Promise<User | null>
  upsertUser(user: User): Promise<void>

  // ── Credit balances ───────────────────────────────────────────────────────

  getBalance(tenantId: TenantId, userId?: UserId): Promise<CreditBalance | null>
  setBalance(balance: CreditBalance): Promise<void>

  // ── Usage events ──────────────────────────────────────────────────────────

  recordEvent(event: UsageEvent): Promise<void>
  queryEvents(params: ExportParams): Promise<UsageEvent[]>

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /** Optional: called once on startup (e.g. run migrations) */
  initialize?(): Promise<void>

  /** Optional: called on graceful shutdown */
  close?(): Promise<void>
}
