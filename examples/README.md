# Examples

Minimal, runnable integrations showing the uselimit `check → operate → consume` flow.

| Example | Stack | Shows |
|---|---|---|
| [`express-api`](./express-api) | Express | Protected route, tenant from `x-tenant-id`, `402` when out of credits |
| [`nextjs-ai-route`](./nextjs-ai-route) | Next.js (App Router) | Route handler guarding a mocked AI call, `402` when blocked |

These folders are intentionally **outside** the pnpm workspace, so they don't affect the root
install or CI. Each links `@uselimit/core` locally via `file:../../packages/core` — build core
first (`pnpm --filter @uselimit/core build`), then `pnpm install` inside the example.
