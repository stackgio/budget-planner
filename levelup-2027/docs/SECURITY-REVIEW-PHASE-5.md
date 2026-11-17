# Security Review — Phase 5

Scope: the whole app, with emphasis on what Phase 5 added (gig income, payouts, analytics, backups, diagnostics, integrations prep). Method: code review plus automated tests. **`npm audit` reporting 0 known vulnerabilities does not mean the app is secure.** It only means no published advisory matches the installed package versions.

## Results by area

| Area | What was checked | Result |
|---|---|---|
| Authentication | Argon2id passwords, DB sessions (only a SHA-256 of the token is stored), login rate limit, single-owner `/setup` with token | Unchanged and passing (Phase 1 E2E) |
| Passkeys | Public key only; bound to `WEBAUTHN_RP_ID`; removal is now behind a confirmation sheet | OK. Passkeys must be re-added on the deployed domain |
| Authorization | Every new page uses `appContext()`/`requireUser`. Every gig, analytics and diagnostics query is scoped by `ownerId`. Platforms, sessions, planned shifts and payouts are ownership-checked before use | Cross-account tests pass (gig, analytics, notifications, earlier phases) |
| Financial ledger | Gig money enters **only** through `confirmPayout`. The money comes from exactly one GIG `IncomeDeposit`; the amount is stored once (on the deposit). Idempotency key + request hash; owner-level advisory lock; payout-ID partial unique index; DB trigger requiring payout⇄deposit consistency (same owner, kind GIG, voided together); payouts can't be deleted | 28 gig tests, including 4 concurrent confirmations → exactly 1 deposit. `reconcile()` extended with gig checks |
| Logged work vs money | Logging a session, planning a shift or entering mileage never creates money. Projected paydays are never counted as income | Tested in integration and E2E |
| Corrections | A paid session's amounts can only be corrected with a reason (audited). A payout is voided and re-entered, never edited. Voiding is refused when the money is allocated | Tested |
| Encryption key | Unchanged AES-256-GCM. Gig notes encrypted. Exports never include ciphertext columns. Wrong or missing key fails safely | Drill: MISMATCH and MISSING both fail safely |
| Backup encryption | AES-256-GCM, scrypt KDF, authenticated header, mode-600 files, passphrase only from env/file, DB password via `PGPASSWORD` (never argv) | Tamper, wrong-passphrase and truncation tests pass. Files contain no plaintext, key or passphrase |
| Restore safety | Only into new `levelup_restore_*` / `levelup_drill_*` databases. Refuses existing databases, including `levelup_dev` / `levelup_test` | Tested |
| Database access | Postgres reached only via `DATABASE_URL`. Raw SQL uses tagged templates / `Prisma.join`. The one string-built statement (temp DB name) is validated by regex first | OK |
| Push subscriptions | Endpoint/keys never exported or shown in diagnostics. 404/410 responses revoke the subscription. The test button **never** calls a push service | Tested (no `PushDelivery` rows created) |
| Sessions | httpOnly, SameSite=Lax, Secure over HTTPS | Unchanged |
| Sensitive logging | The only app log line prints the error class/code. Backup/drill scripts print counts only. Worker logs counts only | Reviewed (`grep console.`) |
| CSV export | Authenticated, `no-store`, owner-scoped. Formula-injection prefixing. Filename built from validated dates | Unit + E2E tests |
| Export privacy | v5 adds gig data (notes decrypted for you). Still excludes password hash, passkeys, sessions, push keys and ciphertext | E2E asserts absence |
| Migration safety | `20261120000000_phase5_gig` is additive: new tables, checks, triggers and one index. No existing rows or columns changed. Applied to dev and test; drift = 0 | OK |
| Headers | nosniff, frame DENY, no-referrer, permissions policy. **Added HSTS** (only takes effect over HTTPS) | OK |

## Findings and recommendations

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | Low | Concurrent first-time gig setup could race on a unique key (seen in E2E as a page error) | **Fixed**: race-free `createMany … skipDuplicates` |
| 2 | Low | Removing a passkey and cancelling remaining reservations each happened on one tap | **Fixed**: confirmation sheets |
| 3 | Low | No HSTS header | **Fixed** |
| 4 | Medium (before launch) | No Content-Security-Policy | **Fixed in the pre-launch review**: nonce-based CSP, tested |
| 5 | Low | ~~Login rate limiting is in-memory~~ **Correction (pre-launch review):** it was already database-backed. The real gaps were a spoofable client IP, parallel guesses, and a global lockout that could block the owner | **Fixed in the pre-launch review**, see PRE-LAUNCH-REVIEW.md §5 |
| 6 | Low | Next.js prints server render errors to the server log (Prisma error text can include field names). No amounts or notes were observed | Accepted. Keep logs private (Railway logs are private to the project) |
| 7 | Info | Backups are local until you copy them off the machine | Documented in BACKUP-AND-RESTORE.md. Automate after deployment approval |
| 8 | Info | Push delivery is at-least-once per round. The new mitigations make duplicates rare and invisible on the device, but exactly-once can't be guaranteed through Apple/Google push services | Documented |

## Dependencies

- `npm audit`: **0 vulnerabilities** (see the caveat above). The `deepmerge-ts` override from Phase 1 remains.
- **Prisma 6.19.3** is the newest 6.x release. Prisma 7.10 is a major upgrade: new generator, driver adapters and config changes. Prisma 8 is still a release candidate. There is no known advisory against 6.19.3, and upgrading would touch every query path. **Not upgraded.** It is recommended as its own small, test-gated change after launch.
- Minor updates are available: React 19.3.1, argon2 2.2.2, Playwright 1.65, tsx. Majors are available: Tailwind 4, TypeScript 7, web-push 4, SimpleWebAuthn 14, lucide 1.x. None are security fixes per `npm audit`. These are deferred to a maintenance pass so this phase doesn't mix feature work with upgrades.
