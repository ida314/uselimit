import { InMemoryAdapter, UseLimitClient } from '@uselimit/core'

let client: UseLimitClient | null = null

/**
 * Lazily build and seed a single usage client.
 *
 * NOTE: InMemoryAdapter is per-process and resets on reload — fine for a demo.
 * In a real app, construct the client ONCE at startup with a persistent
 * StorageAdapter, and provision tenants/balances from your database instead of
 * seeding them here.
 */
export async function getUsage(): Promise<UseLimitClient> {
  if (client) return client

  const storage = new InMemoryAdapter()
  const now = Date.now()
  const periodStart = new Date(now).toISOString()
  const resetAt = new Date(now + 30 * 86_400_000).toISOString()

  await storage.upsertTenant({
    id: 'team_demo',
    planId: 'free',
    periodStart,
    createdAt: periodStart,
  })
  await storage.setBalance({ tenantId: 'team_demo', remaining: 50, allocated: 50, resetAt })

  client = new UseLimitClient({
    storage,
    plans: [
      {
        id: 'free',
        monthlyCredits: 50,
        limits: { 'generate-text': { max: 10, resetPeriod: 'monthly' } },
      },
    ],
  })

  return client
}
