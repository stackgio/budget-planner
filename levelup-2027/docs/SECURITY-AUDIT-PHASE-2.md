# LEVEL UP 2027 — Security & Dependency Audit (Phase 2)

Date: 2026-11-17 · Scope: `levelup-2027/` only · Local development; nothing deployed.

## 1. Dependency audit (`npm audit`)

### Phase 1 finding — Next.js (bundled PostCSS)

| | |
|---|---|
| Package | `next` 15.5.29 → its bundled `postcss` 8.4.31 |
| Advisories | GHSA-qx2v-qp2m-jg93 (moderate, XSS via unescaped `</style>` in CSS stringify, postcss < 8.5.10) · GHSA-6g55-p6wh-862q (high, arbitrary file read via attacker-controlled `sourceMappingURL`, ≤ 8.5.11) · GHSA-r28c-9q8g-f849 (high, path traversal in source-map auto-loading, ≤ 8.5.17) · GHSA-fxqj-rqcc-2cmp (moderate, incomplete fix, ≤ 8.5.22) |
| Affected | `next` 9.3.4-canary.0 – 16.3.0-preview.10 |
| Patched | `next` 16.4.x |
| Practical exposure | Build-time CSS processing of our own stylesheets; requires attacker-controlled CSS. Low, but real. |
| **Action** | **Upgraded to `next` 16.4.6** with `react`/`react-dom` 19.2.9. Breaking change handled: `src/middleware.ts` → `src/proxy.ts` (`export function proxy`). All Phase 1 tests re-run, including password and passkey browser tests: pass. |

### New findings surfaced during the Phase 2 audit

| Package | Severity | Advisory | Runtime? | Action |
|---|---|---|---|---|
| `zod` < 4.6.6 | High | GHSA-mrhx-c7xc-m3w5 — memory exhaustion validating oversized constrained collections | **Yes** (server input validation) | **Upgraded to `zod` 4.6.7** (major). API used is compatible; all tests pass. |
| `vitest` ≤ 4.1.10 / `tinypool` ≤ 2.1.1 / `@vitest/mocker` | Critical / moderate | GHSA-5gmw-xhrv-c9v3, GHSA-85c8-ppgw-ccpr (prototype-pollution → RCE gadget), GHSA-82fw-gwwq-j7x9, GHSA-qxg6-89mg-rqv8 | No — test runner only | **Upgraded to `vitest` 5.1.0.** |
| `deepmerge-ts` < 8.0.0 via `prisma` CLI → `@prisma/config` | High | GHSA-ggr8-5vv4-36mx — stack exhaustion merging recursive objects | **No** — only the `prisma` CLI (migrations, codegen) loads it; the running app uses `@prisma/client` only | **Not fixed.** The only fix is Prisma 7, a major migration (new generator, driver adapters, config file). Exposure requires feeding the CLI a malicious recursive config — not a realistic path here. **Proposed:** migrate to Prisma 7 as a dedicated, tested task before deployment. `npm audit --omit=dev` still lists it because `@prisma/client` declares `prisma` as an optional peer. |

Current state: **0 known vulnerabilities in packages the running application loads**; 1 high in the development-only Prisma CLI (documented above). Passing tests are not a claim that the app is secure.

## 2. Application security review

| Area | Status |
|---|---|
| Authentication | Argon2id passwords; DB sessions (SHA-256 token hash stored); optional passkeys (WebAuthn, user verification required, single-use server-side challenges). Unchanged in Phase 2; all auth tests re-run and pass on Next 16. |
| Authorization | Every financial service takes `ownerId` and scopes **every** read/write to it (including raw `FOR UPDATE` locks). Cross-account integration test: another account cannot spin, approve, edit, complete, release, cancel, reverse, record tiles, or void deposits belonging to the owner. |
| CSRF | Server Actions: Next.js verifies `Origin` against `Host`. JSON route handlers (passkeys): explicit `Origin` == `APP_ORIGIN` check. Session cookie `SameSite=Lax`, `HttpOnly`, `Secure` over HTTPS. |
| Replay / duplicate submissions | Every money-creating mutation (deposit, payment confirmation, correction, manual record, SCHD import) requires an idempotency key (one per form instance) stored with a request hash: same key + same data → returns the original record; same key + different data → rejected. State transitions (approve, cancel) are idempotent by design. |
| Concurrency | `SELECT … FOR UPDATE` on the deposit/plan/line/payment rows, lock-before-read; partial unique indexes on tiles and active deposits; a **deferred DB trigger** rejects any commit where reserved + completed allocations exceed a deposit; deletes of payments/committed lines/deposits are blocked by triggers. Tested with concurrent approvals, concurrent tile confirmations, and double taps. |
| No money movement | There is no banking, brokerage, payment, or transfer integration of any kind. "Confirm transfer" only records what the user says they did elsewhere. |
| Secrets | `.env` git-ignored; `.env.test` contains only local test credentials. Error logging reduced to error type/code so query arguments and amounts are never written to logs. No secrets are logged. |
| Input validation | zod on every action; integer-cent parsing; DB CHECK constraints (no negative or zero allocations, paid ≤ reserved, reversal sign rules). |

## 3. Unresolved risks

1. Prisma 7 migration pending (dev-only `deepmerge-ts`).
2. No real-device testing of passkeys yet (requires a deployed HTTPS origin).
3. Rate limiting is per-IP + global in the database — adequate for one user; a deployment behind a proxy must forward the real client IP.
4. Backups are not set up (Phase 0 plan: nightly `pg_dump` once deployed).
