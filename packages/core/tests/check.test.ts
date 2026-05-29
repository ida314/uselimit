import { describe, it } from 'vitest'

// TODO: import { UseLimitClient } from '../src/index.js'
// TODO: import { InMemoryAdapter } from '../src/storage/memory.js'

describe('check()', () => {
  it.todo('returns allowed=true when credits are sufficient')
  it.todo('returns allowed=false when credits are exhausted')
  it.todo('returns allowed=false when per-feature quota is exceeded')
  it.todo('returns correct remaining count')
  it.todo('returns correct resetAt for monthly period')
  it.todo('returns correct resetAt for daily period')
  it.todo('returns allowed=true for unlimited features regardless of balance')
  it.todo('falls back to tenant plan when user has no plan override')
  it.todo('falls back to defaultPlanId when tenant has no plan record')
  it.todo('includes a human-readable reason when allowed=false')
})
