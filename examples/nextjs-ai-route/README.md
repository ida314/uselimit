# Next.js AI route + uselimit

A Next.js **App Router** route handler that guards an AI call with uselimit. Same pattern as
the Express example:

```
check()  →  expensive AI call  →  consume()
```

The handler reads the tenant from an `x-tenant-id` header (falling back to `team_demo`),
returns **402** when the tenant is out of credits/quota, runs a mocked text-generation call,
and charges credits only after it succeeds.

## Files

- `app/api/generate/route.ts` — the `POST` route handler (`check → generate → consume`).
- `lib/usage.ts` — builds and seeds a single `UseLimitClient` (replace with your DB-backed adapter in production).

These are written as **drop-in files** for an existing Next.js 14+ App Router project. Copy
them into your app, or scaffold a fresh one with `npx create-next-app@latest` and drop them in.

## Run it

> `@uselimit/core` isn't on npm yet, so this example links it locally via
> `"file:../../packages/core"`. Build core first.

```bash
# from the repo root
pnpm --filter @uselimit/core build

# then, in this folder
cd examples/nextjs-ai-route
pnpm install
pnpm dev
```

## Try it

```bash
# Default demo tenant → 200, with the generated text and remaining credits
curl -sXPOST localhost:3000/api/generate \
  -H 'content-type: application/json' -d '{"prompt":"write a haiku about rate limits"}'

# Repeat until the 50-credit balance (10 calls × 5 credits) runs out → 402
```

In a real app, build the client once at startup with a persistent `StorageAdapter` rather than
seeding an in-memory one per process.
