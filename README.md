# uselimit

> Lightweight usage credits, quotas, and limits for AI/API apps.

Add metering and enforcement to your app before adopting a full billing platform.

---

## Why uselimit?

You're building an AI SaaS, devtool, or internal tool. You need to:

- Block requests before they exceed a monthly credit budget
- Gate features behind a free/pro plan
- Track per-tenant and per-user usage
- Export raw events to Stripe, a warehouse, or a CSV

You don't need a full billing platform, an enterprise API gateway, or a revenue recognition system. You need a small, composable layer that answers one question:

> **Can this user do this right now?**

That's uselimit.

---

## Status

Early development. Interfaces are stable; implementations are in progress.

---

## Intended usage

```ts
import { UseLimitClient } from '@uselimit/core'

const usage = new UseLimitClient({
  plans: [...],      // your plan definitions
  storage: adapter,  // e.g. new InMemoryAdapter() for local dev
})

// Pre-flight check — does NOT deduct credits
const check = await usage.check({
  tenantId: 'team_abc',
  userId: 'user_123',
  feature: 'generate-image',
  cost: 12,
})

if (!check.allowed) {
  return res.status(429).json({ error: 'Usage limit exceeded' })
}

// ... do the expensive AI call ...

// Record usage — deducts credits and writes an event
const result = await usage.consume({
  tenantId: 'team_abc',
  userId: 'user_123',
  feature: 'generate-image',
  amount: 12,
})
```

Result shape:

```ts
{
  allowed: true,
  remaining: 742,
  resetAt: '2026-06-01T00:00:00Z',
  event: { id: 'evt_...', ... }
}
```

---

## Plan config

```yaml
plans:
  free:
    monthly_credits: 100
    limits:
      summaries: 20/month
      exports: 5/month
      api_requests: 1000/month

  pro:
    monthly_credits: 5000
    limits:
      summaries: unlimited
      exports: 500/month
      api_requests: 100000/month
```

---

## Non-goals

uselimit deliberately does **not**:

- Process payments or integrate with Stripe Checkout
- Generate invoices, receipts, or tax documents
- Replace an API gateway (no proxying, no traffic routing)
- Handle subscription lifecycle (trials, upgrades, downgrades)
- Provide multi-region distributed rate limiting
- Target enterprise compliance requirements

If you need any of the above, look at [Stripe Billing](https://stripe.com/billing), [Orb](https://www.withorb.com/), [Lago](https://www.getlago.com/), or [OpenMeter](https://openmeter.io/).

---

## Roadmap

### Phase 1 — Core (`@uselimit/core`)
- [x] Domain type definitions
- [x] `StorageAdapter` interface
- [ ] `InMemoryAdapter` implementation
- [ ] `check()` — read-only pre-flight
- [ ] `consume()` — credit deduction + event recording
- [ ] `exportUsage()` — JSON/CSV export
- [ ] Quota reset logic
- [ ] Plan config loader (YAML/JSON)

### Phase 2 — Storage adapters
- [ ] `@uselimit/storage-sqlite`
- [ ] `@uselimit/storage-postgres`
- [ ] `@uselimit/storage-redis`

### Phase 3 — Framework adapters
- [ ] `@uselimit/next` — Next.js middleware + route helpers
- [ ] `@uselimit/express` — Express middleware
- [ ] `@uselimit/hono` — Hono middleware
- [ ] `@uselimit/fastapi` — Python/FastAPI dependency

### Phase 4 — Export integrations
- [ ] Stripe metered billing push
- [ ] Webhook on threshold exceeded
- [ ] Segment event forwarding

### Phase 5 — Dashboard
- [ ] Minimal read-only dashboard (usage over time, per-tenant breakdown)

---

## Packages

| Package | Description | Status |
|---|---|---|
| `@uselimit/core` | Core logic, types, StorageAdapter interface | In progress |
| `@uselimit/storage-sqlite` | SQLite storage adapter | Planned |
| `@uselimit/storage-postgres` | Postgres storage adapter | Planned |
| `@uselimit/storage-redis` | Redis storage adapter | Planned |
| `@uselimit/next` | Next.js adapter | Planned |

---

## Contributing

This project is in early scaffolding. Contributing guide coming soon.

---

## License

MIT
