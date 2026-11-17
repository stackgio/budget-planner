# LEVEL UP 2027 — Phase 3 Report: Goals & Personal Growth

Status: **complete locally. Not deployed. No paid services. No external AI calls. Stopped before Phase 4.**

## Phase 2 corrections (done first)

| Item | Result |
|---|---|
| A. Prisma `deepmerge-ts` (GHSA-ggr8-5vv4-36mx, high, `< 8.0.0`, via `prisma` CLI → `@prisma/config` 6.19.3 pinned to 7.1.5) | Only reachable when the Prisma **CLI** loads a `prisma.config.*` file (development/migrations); never at runtime. Fixed **without** upgrading Prisma: npm `overrides` pins `deepmerge-ts` 8.0.2 (same `deepmerge` export). Verified `validate`, `generate`, `migrate status/deploy/diff`, and the config-loading path itself. `npm audit`: **0 vulnerabilities**. Prisma 7 not needed now. |
| B. Roth tax year | Every Roth allocation line carries an explicit `taxYear` (DB CHECK, NULL-safe), backfilled from the funding deposit / confirmed payment. Editable before confirmation. Planned room and confirmed totals are computed **per tax year**; drafts never count. |
| C. SCHD sequencing | Next day = lowest OPEN, unreserved day — derived from tile state, no manual reset. Unverified days can be marked “not done” and become next automatically; confirmed contributions can only change through a correction; audit kept. |

Two migration bugs were caught by tests and fixed before commit: a backfill that would fail on databases with ledger data (pending deferred-trigger events), and a CHECK that allowed NULL. Fix verified by replaying migrations on a throwaway database seeded with Roth data.

## Migrations (all additive; `levelup_dev` never reset)

`20261118000000_roth_line_tax_year` · `…000100_roth_tax_year_not_null` · `…000200_phase3_growth` (21 new tables, nullable `Task.goalId` / `CalendarEvent.goalId`, CHECK constraints) · `…000300_event_workout_template`. Schema ↔ DB drift: none.

## Tests

| Suite | Count |
|---|---|
| Unit | 75 |
| Integration (real PostgreSQL) | 77 |
| Playwright (iPhone 13) | 26 (passed on 3 consecutive runs) |

## Privacy

AES-256-GCM application encryption (`DATA_ENCRYPTION_KEY`) for faith entries, relationship notes, date notes, goal notes, job notes/interview prep, and review reflections. Export decrypts for the signed-in owner only and contains no password hash, passkeys, sessions or challenges.
