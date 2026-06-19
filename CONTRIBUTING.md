# Contributing to uselimit

Thanks for your interest! uselimit is an early-stage, open-source usage-credits and quota
library. Bug reports, docs, tests, and storage/framework adapters are all welcome.

## Prerequisites

- **Node.js** 20 or 22
- **pnpm** 10 (`corepack enable` will provide it, or `npm i -g pnpm`)

This is a pnpm workspace; the publishable code lives in `packages/core`.

## Setup

```bash
git clone https://github.com/ida314/uselimit.git
cd uselimit
pnpm install
```

## Running the checks

All of these are wired into CI, so run them before opening a PR:

```bash
pnpm typecheck      # tsc --noEmit across the workspace
pnpm lint           # ESLint (flat config) over packages/*/src
pnpm format:check   # Prettier in check mode (use `pnpm format` to auto-fix)
pnpm test           # Vitest
pnpm build          # tsc build to dist/
```

Tests live in `packages/core/tests/`. Some are intentionally left as `it.todo(...)` for
behavior that isn't implemented yet (e.g. concurrency safety, quota-reset-after-period) —
converting those into real, passing tests is a great first contribution.

## Adding an example

Examples live under [`examples/`](./examples) and are intentionally **outside** the pnpm
workspace, so they don't affect the root install or CI. To add one:

1. Create `examples/<your-example>/` with its own `package.json` and a `README.md` that
   explains what it shows and how to run it.
2. Import the public API as `@uselimit/core`. Until the package is published to npm, link it
   locally (e.g. `pnpm link ../../packages/core`, or build core and reference the path).
3. Keep it minimal and focused on the `check → operate → consume` flow. Prefer a mocked
   expensive operation over real API keys.

## Opening a good issue

- Describe what you expected vs. what happened, with a minimal repro (the seeded
  tenant/balance/plan and the `check`/`consume` call).
- Include versions: Node, pnpm, and the commit you're on.
- For feature requests, say which use case it unblocks — it helps us prioritize.

## Opening a good PR

- Keep it focused; one logical change per PR.
- Make sure `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, and `pnpm test` all pass.
- Add or update tests for any behavior change.
- Update `CHANGELOG.md` under `## [Unreleased]`.
- Match the existing style (Prettier: no semicolons, single quotes, 2-space, 100 cols).

## Note for storage-adapter authors

The in-memory adapter is single-process and **not** safe for production. A production-grade
`StorageAdapter` **must make credit consumption atomic** — the read in `check()` and the write
in `setBalance()` are not a single operation, so two concurrent `consume()` calls can both pass
the check and double-spend the same balance. Back your adapter with a database transaction or a
version/compare-and-swap on `CreditBalance` to prevent lost updates. See the atomicity notes in
[`packages/core/src/consume.ts`](./packages/core/src/consume.ts) for the exact contract.
