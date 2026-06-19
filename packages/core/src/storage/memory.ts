import type { StorageAdapter } from './types.js'
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
 * InMemoryAdapter — volatile, process-local storage.
 *
 * Intended for unit tests and local development only: all data is lost on
 * process exit, and there is no cross-process locking, so it is NOT safe for
 * multi-process or production use. See `consume()` for the concurrency caveats
 * a production-grade adapter must address.
 */
export class InMemoryAdapter implements StorageAdapter {
  private readonly tenants = new Map<TenantId, Tenant>()
  private readonly users = new Map<string, User>()
  private readonly balances = new Map<string, CreditBalance>()
  private readonly events: UsageEvent[] = []

  private makeUserKey(tenantId: TenantId, userId: UserId): string {
    return `${tenantId}:${userId}`
  }

  private makeBalanceKey(tenantId: TenantId, userId?: UserId): string {
    return userId ? `${tenantId}:${userId}` : tenantId
  }

  async getTenant(tenantId: TenantId): Promise<Tenant | null> {
    return this.tenants.get(tenantId) ?? null
  }

  async upsertTenant(_tenant: Tenant): Promise<void> {
    this.tenants.set(_tenant.id, _tenant)
  }

  async getUser(_tenantId: TenantId, _userId: UserId): Promise<User | null> {
    return this.users.get(this.makeUserKey(_tenantId, _userId)) ?? null
  }

  async upsertUser(_user: User): Promise<void> {
    this.users.set(this.makeUserKey(_user.tenantId, _user.id), _user)
  }

  async getBalance(_tenantId: TenantId, _userId?: UserId): Promise<CreditBalance | null> {
    return this.balances.get(this.makeBalanceKey(_tenantId, _userId)) ?? null
  }

  async setBalance(_balance: CreditBalance): Promise<void> {
    this.balances.set(this.makeBalanceKey(_balance.tenantId, _balance.userId), _balance)
  }

  async recordEvent(_event: UsageEvent): Promise<void> {
    this.events.push(_event)
  }

  async queryEvents(params: ExportParams): Promise<UsageEvent[]> {
    return this.events.filter((event) => {
      if (params.tenantId !== undefined && event.tenantId !== params.tenantId) return false
      if (params.userId !== undefined && event.userId !== params.userId) return false
      if (params.feature !== undefined && event.feature !== params.feature) return false
      if (params.from !== undefined && event.timestamp < params.from) return false
      if (params.to !== undefined && event.timestamp > params.to) return false
      return true
    })
  }
}
