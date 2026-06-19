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
 * Implemented: InMemoryAdapter (./memory.ts) — for tests and local dev.
 * Planned: PostgresAdapter and RedisAdapter as separate @uselimit/storage-*
 * packages. A production adapter must make credit consumption atomic
 * (a transaction or compare-and-swap on the balance) — see consume().
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
