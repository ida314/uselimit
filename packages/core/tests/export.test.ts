import { describe, expect, it } from 'vitest'
import { InMemoryAdapter, UseLimitClient } from '../src/index.js'

const CSV_HEADER = 'id,tenantId,userId,feature,amount,metadata,timestamp'

/** Seed an adapter with a fixed set of events spanning two tenants/users/features. */
async function setup() {
  const storage = new InMemoryAdapter()

  await storage.recordEvent({
    id: 'e1',
    tenantId: 'team_abc',
    userId: 'user_1',
    feature: 'summaries',
    amount: 1,
    timestamp: '2026-06-01T00:00:00.000Z',
  })
  await storage.recordEvent({
    id: 'e2',
    tenantId: 'team_abc',
    userId: 'user_2',
    feature: 'exports',
    amount: 2,
    timestamp: '2026-06-10T00:00:00.000Z',
  })
  await storage.recordEvent({
    id: 'e3',
    tenantId: 'team_abc',
    userId: 'user_1',
    feature: 'summaries',
    amount: 3,
    metadata: { source: 'api' },
    timestamp: '2026-06-20T00:00:00.000Z',
  })
  await storage.recordEvent({
    id: 'e4',
    tenantId: 'team_other',
    feature: 'summaries',
    amount: 5,
    timestamp: '2026-06-15T00:00:00.000Z',
  })

  return { usage: new UseLimitClient({ storage }) }
}

describe('exportUsage()', () => {
  it('returns every event for a tenant when no other filter is applied', async () => {
    const { usage } = await setup()

    const result = await usage.exportUsage({ tenantId: 'team_abc' })

    expect(result.count).toBe(3)
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('filters by feature', async () => {
    const { usage } = await setup()

    const result = await usage.exportUsage({ tenantId: 'team_abc', feature: 'summaries' })

    expect(result.count).toBe(2)
  })

  it('filters by userId', async () => {
    const { usage } = await setup()

    const result = await usage.exportUsage({ tenantId: 'team_abc', userId: 'user_1' })

    expect(result.count).toBe(2)
  })

  it('filters by an inclusive from/to date range', async () => {
    const { usage } = await setup()

    const result = await usage.exportUsage({
      tenantId: 'team_abc',
      from: '2026-06-05T00:00:00.000Z',
      to: '2026-06-15T00:00:00.000Z',
    })

    expect(result.count).toBe(1)
  })

  it('defaults to JSON, returning the events array as data', async () => {
    const { usage } = await setup()

    const result = await usage.exportUsage({ tenantId: 'team_abc' })

    expect(result.format).toBe('json')
    expect(Array.isArray(result.data)).toBe(true)
  })

  it('serializes to RFC 4180 CSV with a header row and escaped metadata', async () => {
    const { usage } = await setup()

    const result = await usage.exportUsage({
      tenantId: 'team_abc',
      feature: 'summaries',
      format: 'csv',
    })

    expect(result.format).toBe('csv')
    expect(typeof result.data).toBe('string')

    const lines = (result.data as string).split('\r\n')
    expect(lines[0]).toBe(CSV_HEADER)
    expect(lines).toHaveLength(3) // header + e1 + e3
    // e3's JSON metadata is CSV-escaped (wrapped + doubled quotes).
    expect(result.data as string).toContain('"{""source"":""api""}"')
  })

  it('returns an empty array (count 0) when nothing matches a JSON export', async () => {
    const { usage } = await setup()

    const result = await usage.exportUsage({ tenantId: 'team_abc', feature: 'nonexistent' })

    expect(result.count).toBe(0)
    expect(result.data).toEqual([])
  })

  it('returns just the header row for an empty CSV export', async () => {
    const { usage } = await setup()

    const result = await usage.exportUsage({
      tenantId: 'team_abc',
      feature: 'nonexistent',
      format: 'csv',
    })

    expect(result.count).toBe(0)
    expect(result.data).toBe(CSV_HEADER)
  })

  it.todo('paginates or streams very large exports')
})
