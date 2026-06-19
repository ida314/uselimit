# Express API + uselimit

A minimal Express server with one **credit-protected** route. It shows the core pattern:

```
check()  →  expensive operation  →  consume()
```

The route reads the tenant from an `x-tenant-id` header, refuses with **402** when the tenant
is out of credits/quota, runs a mocked "expensive" summarize call, and only **then** charges
credits.

## Run it

> `@uselimit/core` isn't on npm yet, so this example links it locally via
> `"file:../../packages/core"`. Build core first so its `dist/` exists.

```bash
# from the repo root
pnpm --filter @uselimit/core build

# then, in this folder
cd examples/express-api
pnpm install
pnpm start
```

## Try it

```bash
# Funded tenant → 200 with a summary and the remaining credits
curl -sXPOST localhost:3000/summarize \
  -H 'x-tenant-id: team_funded' -H 'content-type: application/json' \
  -d '{"text":"hello world"}'

# Broke tenant (only 2 credits, needs 5) → 402 Payment Required
curl -sXPOST localhost:3000/summarize \
  -H 'x-tenant-id: team_broke' -H 'content-type: application/json' \
  -d '{"text":"hello world"}'
```

Storage is in-memory, so balances reset every time you restart the server. Swap
`InMemoryAdapter` for a persistent `StorageAdapter` in production.
