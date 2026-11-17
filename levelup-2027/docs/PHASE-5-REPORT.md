# LEVEL UP 2027 — Phase 5 Report: Gig Income, Analytics, Backups & Launch Readiness

Status: complete locally. Nothing has been deployed, no paid services are active, no real push was sent, and no external AI is used.

## Completed features

### Gig Income (Money → Gig Income)
- **Income sources**
  - DoorDash, Veho, Instacart and Shipt are set up by default.
  - You can add your own sources and hide them later; their history is kept.
  - The monthly gross target defaults to **$500** and is editable.
- **Work sessions** record:
  - platform, date, start/end time (or total hours), and gross earnings
  - tips and bonuses, each marked "included in gross" or "on top of gross"
  - parking/tolls, other costs, miles and private notes (encrypted)
  - payment status: awaiting payout / paid / disputed
  - the actual payout date and the confirmed net deposit
- **Labelled separately everywhere:**
  - earnings (reported by the apps)
  - expenses
  - estimated profit before taxes
  - **deposited** (confirmed payouts only)
  - "awaiting payout", which is never counted as money
- **Calculations**
  - Gross by platform, estimated expenses and profit, earnings per hour and estimated profit per hour.
  - Per-hour figures use the hours you actually recorded and show "—" when no hours exist (no division by zero).
  - Also: miles, confirmed payouts, monthly target progress, and weekly (Sat–Fri) summaries.
- **Mileage log**
  - Each trip records date, platform, business purpose, and optional odometer readings (miles are computed from them).
  - Trips can be corrected or removed (kept in history).
  - Miles entered on a session live in the same log, so they are counted once.
  - No mileage rate is ever assumed. A cost per mile is optional and is your own planning figure.
- **Tax reserve**
  - Optional, as a percentage of estimated profit, labelled "your planning estimate".
  - It is not a tax calculation and makes no claims about what is deductible.
- **CSV export** of sessions, mileage and payouts for tax preparation, with a not-tax-advice header and formula-injection protection.

### Ledger integration
- Confirming a payout creates **exactly one** GIG deposit. The amount is stored only on that deposit.
- Logging work, planning shifts and entering mileage create no money.
- Duplicates are prevented by:
  - an idempotency key plus request hash;
  - an owner-level lock, so concurrent confirmations are serialised;
  - a payout-ID unique index;
  - a same-platform/date/amount check that needs explicit "this is a separate payout" confirmation;
  - a session belonging to only one payout.
- A database trigger enforces payout⇄deposit consistency, and payouts can't be deleted.
- **Corrections**
  - A paid session's amounts can be changed only with a reason, which is audit-logged; the deposit is unchanged.
  - A payout is voided and re-entered. Voiding is refused if the money is already allocated.
- Gig income is reported separately from regular DOC pay and overtime.
- **Roulette** never uses gig money unless you open a gig payout there yourself. The Extra Paycheck Planner refuses gig deposits.

### Scheduling
- Planned gig shifts go on the calendar.
- A shift that overlaps a DOC shift (or another event) is **blocked** unless you tick "Plan it anyway", and free alternatives are shown. Nothing is ever moved.
- Each shift can carry an optional income target, labelled "planned, not earned".
- "Log as worked" turns a past planned shift into a session.
- Work-mode notes appear when you're in a heavy mode.

### Analytics (More → Analytics)
- **Filters:** week (Sat–Fri), month, quarter, year and a custom range (up to 3 years), using local dates in America/New_York.
- **Financial**
  - Confirmed income split into Regular, Overtime and Gig, plus a total.
  - Projected paydays are reported separately ("N projected paydays aren't confirmed yet — not included").
  - A monthly stacked trend chart with legend, hover/focus tooltips and a table view. Its colours were run through the dataviz palette checker on the app's dark surface: CVD ΔE 9.4, contrast ≥ 3:1.
  - Roth contributions, challenge contributions and all confirmed allocations, each shown as transfers rather than income. Reversals cancel out.
  - Available and reserved balances (as of today), challenge progress, extra-paycheck months and gig totals.
- **Growth**
  - Workouts per week (chart plus table), goals completed and still open, milestones done versus due.
  - Habits: check-ins against each habit's own weekly target, over days that have actually passed since you started. No streaks and no scores.
  - Faith routines by type, relationship dates completed out of planned, and education/career activity, applications and completed courses (all-time, because courses have no completion date).
- Empty periods show empty states. Nothing is invented.

### Backup & restore
- `backup:create`, `backup:verify`, `backup:restore-test` and `backup:drill`.
- Backups are encrypted with AES-256-GCM using a key derived from your passphrase (scrypt). Each file is timestamped and owner-only (mode 600), and is verified straight away.
- Retention defaults to 14 daily + 8 weekly backups.
- Restores go only into **new** temporary databases.
- Backups are git-ignored and never committed.
- Backups don't contain `DATA_ENCRYPTION_KEY`. Keep a separate copy in your password manager.

### Notification improvements
- **Simulated test notification:** appears in the notification center and reports how many devices *would* get a push. It never calls a push service.
- **Diagnostics:**
  - server side: push keys, when the worker last ran, device health, 7-day status counts, push failures;
  - this device: HTTPS, service worker, permission, subscription, iOS version, Home Screen.
- **Troubleshooting guide** in the app, plus `docs/NOTIFICATIONS-DEVICE-SETUP.md`.
- **iOS splash screens** for 11 iPhone sizes, wired as `apple-touch-startup-image`.
- **Duplicate-delivery mitigation:**
  - an "in-flight" marker with a 10-minute retry hold;
  - a stable `tag`, so the device replaces rather than duplicates;
  - a Web Push `Topic`, so the push service replaces a queued copy.
- Exactly-once delivery is **not** promised.

### Integrations (preparation only)
- A provider interface and registry for Google Calendar (read-only), an external AI provider, gig-platform statement import and other analytics sources.
- Every one shows "Not connected", with what it would read or share and what it would cost.
- Duplicate detection and review classification (`domain/imports.ts`, unit-tested). Nothing is ever imported automatically.
- No credentials were requested and nothing was connected.

### Mobile polish
- Loading skeleton for every page.
- Confirmation sheets for removing sessions or trips, voiding payouts, cancelling remaining reservations and removing a passkey.
- 44 px+ touch targets, horizontal-overflow checks on every new page (E2E), and the established matte black / charcoal / bright green style.

## Screenshots (iPhone 13 viewport, test data)
- 50 Gig Income
- 51 Mileage log
- 52 Analytics (month)
- 53 Analytics (year)
- 54 Notification diagnostics

## Tests

| Suite | Result |
|---|---|
| TypeScript | 0 errors |
| Unit | **109 passed** (+19: gig math, periods, analytics, import dedupe) |
| Integration (real PostgreSQL) | **147 passed** (+42: gig 28, analytics 5, backup 5, notifications 4) |
| E2E (production build, iPhone 13) | **43 passed** (Phases 1–4: 35, Phase 5: 8) |
| `npm audit` | 0 vulnerabilities (not proof of security) |
| Migration drift (dev, test) | none; `migrate status`: up to date |
| `key:check` (dev) | OK |
| `key:drill` | passed |
| `backup:drill` | **passed** (below) |

Phase 5 coverage includes:
- **Gig sessions and money:** session create/edit/stale-edit, tips and bonus double-count prevention, mileage (manual, odometer, correction, removal), confirmed payouts → ledger, idempotent replay, likely-duplicate detection, payout-ID uniqueness, **4 concurrent confirmations → 1 deposit**, void and re-enter correction, allocation-protected void, and DB triggers.
- **Scheduling and isolation:** DOC-shift conflicts and override, cross-account isolation.
- **Analytics:** confirmed-only income, transfers not counted as income, local-date boundaries, custom ranges, empty datasets, honest habit denominators.
- **Backups:** backup creation, verification, tamper / wrong-passphrase / truncation rejection, restore safety, retention, wrong encryption key.
- **Notifications:** simulated test (no push), diagnostics, the in-flight retry hold, push topics.
- **Export and layout:** export v5 completeness with no secrets, mobile overflow, sign-in required.

## Backup & restore drill (synthetic data, temporary databases)
1. A temporary database was created, migrated, and seeded with a synthetic ledger, Roulette, challenges, auth, goals, tasks, encrypted notes, notification settings and gig records.
2. It was backed up encrypted: 147 KB, 65 tables. The file contains no plaintext, key or passphrase.
3. Verify passed. A wrong passphrase was rejected, a tampered file was rejected, and a restore into `levelup_dev` was refused.
4. It was restored into a new temporary database. **414 rows identical**, and these all matched:
   - ledger reconciliation: no issues
   - totals: income $2,182.40 (regular / overtime / gig), reserved, completed, available
   - challenge progress, auth fingerprint, notification settings, gig totals
   - notes: 3/3 readable
5. **Wrong key** → MISMATCH; notes show the locked notice; money data unaffected.
6. **Missing key** → MISSING; safe failure.
7. Both temporary databases were dropped. Your databases were never touched.

## Performance
Local measurements on a synthetic heavy dataset (3,000 gig sessions, 50,000 audit rows, 20,000 notifications):

| Operation | Median |
|---|---|
| Analytics month | 26 ms |
| Analytics year | 33 ms |
| Analytics 3-year custom range | 104 ms |
| Gig summary, year | 20 ms |
| Session list, year | 37 ms |
| Calendar, 6 weeks | 7 ms |

- New indexes: gig sessions, mileage and payouts by owner/date, and deposits by owner/date.
- Client JS chunks total about 850 KB uncompressed; the charts are small inline SVG with no chart library.
- To watch in production: analytics on very long custom ranges, how often the worker runs, and memory held by the Node process (the main cost driver).

## Security findings
Full details are in `docs/SECURITY-REVIEW-PHASE-5.md`.
- **Fixed:** a gig-setup race, unconfirmed passkey removal and reservation cancellation, and the missing HSTS header.
- **Open before launch:** a nonce-based CSP; keep a single replica (in-memory rate limiter).
- **Prisma:** stays on 6.19.3, the latest 6.x with no advisory. 7.x is a major upgrade, deferred to a maintenance pass.

## Known limitations
- Push and passkeys on a real iPhone are **untested** until an approved HTTPS deployment.
- Exactly-once push delivery can't be guaranteed. Duplicates are mitigated and normally invisible.
- Backups are local until you copy them elsewhere; automated off-site copies come with deployment.
- Course completions have no date, so Analytics shows them as all-time.
- Gig statement import, Google Calendar and external AI are interfaces only.
- The Railway Hobby subscription fee could not be quoted verbatim (see the readiness doc). The included $5 of usage and the per-unit rates are verified.
- In the gig weekly summary, future weeks of the current month show $0.00.

## Local testing
```bash
cd levelup-2027
npm run build && npm start                    # http://localhost:3100 → Money → Gig Income, More → Analytics
npm run worker -- --once                      # reminder worker
npm run test:unit && npm run test:integration
npm run build && npm run test:e2e
npm run backup:drill                          # synthetic restore drill
BACKUP_PASSPHRASE='…' npm run backup:create   # real backup of DATABASE_URL into ./backups
```

## Deployment
See `docs/DEPLOYMENT-READINESS.md`. Proposal only. Estimated **≈ $2–7/month** depending on the Hobby fee, with a ~$10 usage alert recommended.

## Remaining work before launch
1. Your approval to deploy: Railway project, Postgres and secrets.
2. Nonce-based CSP.
3. Production VAPID keys, then **one** approved real test push.
4. Real-iPhone test plan: Home Screen, splash, Face ID passkey, push, layouts.
5. Automated daily backups plus an off-site copy, and the first production restore test.
6. Optional: custom domain (decide before adding passkeys), and the Prisma 7 / minor-dependency maintenance pass.
