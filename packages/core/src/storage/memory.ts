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
 * Intended for unit tests and local development only.
 * All data is lost on process exit.
 *
 * TODO: implement all StorageAdapter methods
 */
export class InMemoryAdapter implements StorageAdapter {
  // TODO: declare private Map fields for each entity type

  async getTenant(_tenantId: TenantId): Promise<Tenant | null> {
    throw new Error('Not implemented: InMemoryAdapter.getTenant')
  }

  async upsertTenant(_tenant: Tenant): Promise<void> {
    throw new Error('Not implemented: InMemoryAdapter.upsertTenant')
  }

  async getUser(_tenantId: TenantId, _userId: UserId): Promise<User | null> {
    throw new Error('Not implemented: InMemoryAdapter.getUser')
  }

  async upsertUser(_user: User): Promise<void> {
    throw new Error('Not implemented: InMemoryAdapter.upsertUser')
  }

  async getBalance(_tenantId: TenantId, _userId?: UserId): Promise<CreditBalance | null> {
    throw new Error('Not implemented: InMemoryAdapter.getBalance')
  }

  async setBalance(_balance: CreditBalance): Promise<void> {
    throw new Error('Not implemented: InMemoryAdapter.setBalance')
  }

  async recordEvent(_event: UsageEvent): Promise<void> {
    throw new Error('Not implemented: InMemoryAdapter.recordEvent')
  }

  async queryEvents(_params: ExportParams): Promise<UsageEvent[]> {
    throw new Error('Not implemented: InMemoryAdapter.queryEvents')
  }
}
