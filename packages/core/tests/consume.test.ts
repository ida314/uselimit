import { describe, it } from 'vitest'

// TODO: import { UseLimitClient } from '../src/index.js'
// TODO: import { InMemoryAdapter } from '../src/storage/memory.js'

describe('consume()', () => {
  it.todo('returns allowed=true and deducts credits from balance')
  it.todo('returns allowed=false without deducting when quota is exceeded')
  it.todo('records a UsageEvent with correct tenantId, userId, feature, amount')
  it.todo('records a UsageEvent with provided metadata')
  it.todo('increments per-feature usage counter')
  it.todo('does not deduct credits when allowed=false')
  it.todo('returns the recorded UsageEvent in ConsumeResult.event')
  it.todo('handles concurrent consumes without double-deduction (atomicity)')
  it.todo('resets quota counter after resetPeriod elapses')
})
