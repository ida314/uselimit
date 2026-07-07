# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Persistent storage adapters (`@uselimit/storage-sqlite` / `-postgres` / `-redis`).
- Framework adapters (`@uselimit/next` / `-express` / `-hono`).
- YAML/JSON plan-config loader (`summaries: 20/month` style entitlements).
- Concurrency-safe `consume()` contract for transactional adapters.

## [0.1.0] — 2026-07-06

> Initial release of `@uselimit/core`.

### Added
- `@uselimit/core` package (pnpm workspace, TypeScript, NodeNext ESM, zero runtime dependencies).
- Domain types — `Tenant`, `User`, `Plan`, `FeatureLimit`, `CreditBalance`, `UsageEvent`,
  and the `check` / `consume` / `export` param + result shapes.
- `StorageAdapter` interface plus an in-memory implementation (`InMemoryAdapter`).
- `UseLimitClient` exposing:
  - `check()` — read-only pre-flight against the credit balance and per-feature quota.
  - `consume()` — credit deduction + immutable usage-event recording, with a compensating
    write to restore the balance if the event write fails.
  - `exportUsage()` — JSON and RFC 4180 CSV serialization, filterable by tenant, user,
    feature, and date range.
- Test suite covering the allow/deny paths, quota enforcement, and CSV escaping.

### Known limitations
- `InMemoryAdapter` is single-process and volatile — intended for local development and tests.
- `consume()` is not yet safe against concurrent double-spend; a production storage adapter
  must make credit consumption atomic (transaction or compare-and-swap).
