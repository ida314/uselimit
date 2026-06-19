# uselimit

> **Tiny usage credits and quota enforcement for AI/API products.**

[![CI](https://github.com/ida314/uselimit/actions/workflows/ci.yml/badge.svg)](https://github.com/ida314/uselimit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Types: TypeScript](https://img.shields.io/badge/types-TypeScript-3178c6.svg)](https://www.typescriptlang.org/)
<!-- TODO: add an npm version badge once @uselimit/core is published. -->

Add per-tenant credits, per-feature quotas, and usage export to your app in an afternoon —
**before** you reach for a full billing platform or an enterprise API gateway.

```ts
// Will this request blow the user's budget? Block it before you pay for the work.
const pre = await usage.check({ tenantId, feature: 'generate-image', cost: 12 })
if (!pre.allowed) return res.status(402).json({ error: pre.reason })

const image = await generateImage(prompt) // your expensive AI/API call

await usage.consume({ tenantId, feature: 'generate-image', amount: 12 }) // record + deduct
```

---

## Why this exists

You're building an AI SaaS, a devtool with free/pro tiers, or an internal LLM tool. Every
request can cost you real money, so you need to:

- **Cap spend** — block a request before it exceeds a tenant's monthly credit budget.
- **Gate features** — `summaries: 20/month` on free, unlimited on pro.
- **Meter per tenant and per user** — know who used what, and how much.
- **Export usage** — hand events to Stripe metered billing, a warehouse, or a CSV later.

You don't need invoices, tax handling, or a traffic-routing gateway yet. You need a small,
typed layer that answers one question:

> **Can this tenant do this, right now?**

That's uselimit.

---

## Features

-  **`check()` / `consume()`** — read-only pre-flight and a write path that deducts credits and records an event.
-  **Tenant & user balances** — credits at the tenant level, with optional per-user plan overrides.
-  **Per-feature quotas** — `daily`, `monthly`, `rolling_24h`, `rolling_30d`, or `never` reset windows.
-  **Unlimited tiers** — `null` credits / `null` limits for pro/enterprise plans.
-  **Immutable usage events** — the single source of truth for both quotas and exports.
-  **Usage export** — JSON or RFC 4180 CSV, filterable by tenant/user/feature/date.
-  **Pluggable storage** — implement one small `StorageAdapter`; an `InMemoryAdapter` ships in the box.
-  **TypeScript-first** — fully typed, with **zero runtime dependencies**.

---

## Quick start

> **Heads up:** `@uselimit/core` isn't on npm yet. For now, clone this repo and build it,
> or link it into your project. Once published, install will be `pnpm add @uselimit/core`.

```ts
import { UseLimitClient, InMemoryAdapter } from '@uselimit/core'

// 1. Pick a storage adapter. InMemoryAdapter is perfect for local dev and tests.
const storage = new InMemoryAdapter()

// 2. Seed a tenant and its credit balance (your app does this on signup).
await storage.upsertTenant({
  id: 'team_abc',
  planId: 'free',
  periodStart: '2026-06-01T00:00:00.000Z',
  createdAt: '2026-06-01T00:00:00.000Z',
})
await storage.setBalance({
  tenantId: 'team_abc',
  remaining: 100,
  allocated: 100,
  resetAt: '2026-07-01T00:00:00.000Z',
})

// 3. Create the client with your plan definitions.
const usage = new UseLimitClient({
  storage,
  plans: [
    {
      id: 'free',
      monthlyCredits: 100,
      limits: {
        summaries: { max: 20, resetPeriod: 'monthly' },
      },
    },
  ],
})

// 4. Pre-flight check — read-only, deducts nothing.
const pre = await usage.check({ tenantId: 'team_abc', feature: 'summaries', cost: 3 })
if (!pre.allowed) throw new Error(pre.reason) // e.g. "Insufficient credits"

// 5. ...run the expensive operation...

// 6. Record usage — deducts credits and writes an immutable event.
const result = await usage.consume({ tenantId: 'team_abc', feature: 'summaries', amount: 3 })
console.log(result.remaining) // 97
```

### In a request handler

The realistic shape is **check → operate → consume**: refuse early when the budget is gone,
and only charge for work you actually did.

```ts
async function handler(req, res) {
  const tenantId = req.headers['x-tenant-id']

  // Block before spending money.
  const pre = await usage.check({ tenantId, feature: 'generate-image', cost: 12 })
  if (!pre.allowed) {
    return res.status(402).json({ error: pre.reason, resetAt: pre.resetAt })
  }

  const image = await generateImage(req.body.prompt) // your expensive call

  // Charge only after success.
  await usage.consume({ tenantId, feature: 'generate-image', amount: 12 })
  return res.json({ image })
}
```

Runnable versions of this live in [`examples/`](./examples):

- [`examples/express-api`](./examples/express-api) — a protected Express route using an `x-tenant-id` header.
- [`examples/nextjs-ai-route`](./examples/nextjs-ai-route) — a Next.js App Router route handler.

---

## Plan configuration

Today, plans are plain typed objects:

```ts
import type { Plan } from '@uselimit/core'

const plans: Plan[] = [
  {
    id: 'free',
    monthlyCredits: 100,
    limits: {
      summaries: { max: 20, resetPeriod: 'monthly' },
      exports: { max: 5, resetPeriod: 'monthly' },
    },
  },
  {
    id: 'pro',
    monthlyCredits: 5000,
    limits: {
      summaries: { max: null, resetPeriod: 'monthly' }, // null = unlimited
      exports: { max: 500, resetPeriod: 'monthly' },
    },
  },
]
```

A YAML/JSON plan-config loader (so you can write `summaries: 20/month`) is on the roadmap.

---

## Current status

**Early, but functional — not a stub.** The core package is implemented and tested:

- ✅ `check()`, `consume()`, and `exportUsage()` (JSON + CSV) work against the included `InMemoryAdapter`.
- ✅ Domain types and the `StorageAdapter` interface are stable.
- ✅ Real test coverage for the happy paths, quota enforcement, and CSV escaping.

Honest limitations:

- 🟡 Only `InMemoryAdapter` ships today — it's **single-process and volatile**. Persistent adapters (SQLite/Postgres/Redis) are planned.
- 🟡 `consume()` is safe against partial-write failures but **not** against concurrent double-spend; that needs a transactional adapter (documented inline in `consume()`).
- 🟡 No framework adapters or YAML plan loader yet.
- 🟡 Not yet published to npm.

If those gaps matter for your use case, see the roadmap below or open an issue — contributions welcome.

---

## When to use this

- You're adding credits/quotas to an AI or API product and want a **small, typed library**, not a billing suite.
- You already have a database and just need the metering logic plus a storage interface to plug into.
- You want immutable usage events you can **export to Stripe / a warehouse** later.
- You're single-process, or you're ready to back it with a transactional storage adapter.

## When *not* to use this

- You need **payment processing, invoices, taxes, or subscription lifecycle** → use
  [Stripe Billing](https://stripe.com/billing), [Orb](https://www.withorb.com/),
  [Lago](https://www.getlago.com/), or [OpenMeter](https://openmeter.io/).
- You need a **distributed rate limiter** (multi-region sliding windows).
- You need an **API gateway / proxy** that routes traffic.
- You need **multi-process atomic consumption today** — only `InMemoryAdapter` ships right now.

---

## Roadmap

### Phase 1 — Core (`@uselimit/core`)
- [x] Domain type definitions
- [x] `StorageAdapter` interface
- [x] `InMemoryAdapter` implementation
- [x] `check()` — read-only pre-flight
- [x] `consume()` — credit deduction + event recording
- [x] `exportUsage()` — JSON/CSV export
- [ ] Plan config loader (YAML/JSON)
- [ ] Lazy quota-reset helpers + concurrency-safe consume contract

### Phase 2 — Storage adapters
- [ ] `@uselimit/storage-sqlite`
- [ ] `@uselimit/storage-postgres`
- [ ] `@uselimit/storage-redis`

### Phase 3 — Framework adapters
- [ ] `@uselimit/next` — Next.js middleware + route helpers
- [ ] `@uselimit/express` — Express middleware
- [ ] `@uselimit/hono` — Hono middleware

### Phase 4 — Export integrations
- [ ] Stripe metered-billing push
- [ ] Webhook on threshold exceeded

### Phase 5 — Dashboard
- [ ] Minimal read-only usage dashboard

---

## Packages

| Package | Description | Status |
|---|---|---|
| `@uselimit/core` | Core logic, types, `StorageAdapter`, `InMemoryAdapter` | ✅ Implemented (in-memory) |
| `@uselimit/storage-sqlite` | SQLite storage adapter | Planned |
| `@uselimit/storage-postgres` | Postgres storage adapter | Planned |
| `@uselimit/storage-redis` | Redis storage adapter | Planned |
| `@uselimit/next` | Next.js adapter | Planned |

---

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, how to run the
checks, and how to add examples. Good first issues: a persistent `StorageAdapter`, the YAML plan
loader, or fleshing out the remaining `it.todo` tests.

## License

[MIT](./LICENSE)
