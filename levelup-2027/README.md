# LEVEL UP 2027

A private, mobile-first Life Operating System: calendar, tasks, DOC schedule and payroll, extra-paycheck detection, work modes, and (in later phases) Money Roulette, the assistant, and push notifications.

**Status: Phase 3 (Goals & Personal Growth) complete — local only, not deployed.**
Docs: [Phase 0 architecture](docs/PHASE-0-ARCHITECTURE.md) · [Phase 2 report](docs/PHASE-2-REPORT.md) · [Phase 3 report](docs/PHASE-3-REPORT.md) · [Security audit](docs/SECURITY-AUDIT-PHASE-2.md).

Fully separate from `../moneyflow` and `../video`: no shared code, database, or credentials.

## Stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS · PostgreSQL 16 · Prisma 6 (versioned migrations) · Argon2id passwords · DB-backed sessions · WebAuthn passkeys (SimpleWebAuthn) · Vitest · Playwright.

## Run it locally

Prerequisites: Node 22, PostgreSQL 16.

```bash
cd levelup-2027
npm install

# 1. Create a local database and user (one time)
sudo -u postgres psql -c "CREATE ROLE levelup LOGIN PASSWORD 'levelup_local_dev' CREATEDB;"
sudo -u postgres createdb -O levelup levelup_dev
sudo -u postgres createdb -O levelup levelup_test     # for automated tests

# 2. Configure
cp .env.example .env
# set SETUP_TOKEN to a random value: openssl rand -hex 24
# set DATA_ENCRYPTION_KEY: openssl rand -base64 32   (back it up — private notes need it)

# 3. Apply migrations (non-destructive) and start
npx prisma migrate deploy
npx dotenv -e .env.test -- npx prisma migrate deploy   # test database
npm run dev            # http://localhost:3100
```

Open http://localhost:3100 → you'll be sent to **/setup** (only while no account exists). Enter the `SETUP_TOKEN`, your email, and a password of 12+ characters. Setup loads your confirmed configuration:

- DOC rotation Sat–Wed 8:00 AM–4:00 PM starting Jan 2, 2027 (a single editable recurring series).
- Regular payroll anchor 2026‑11‑27 (**provisional / unverified**), expected deposit 1 day early; overtime anchor 2026‑12‑04.
- Pay rate $24.20/h, 1.5× (provisional) → $36.30/h.
- Moving-Out 141 tiles ($10,011, 0 complete), SCHD 100 days (next Day 38; Days 1–37 provisional, not verified), Debt = Setup Required.
- Eight default habits. **No income, deposits, or payments are created.**

Alternative to /setup: `OWNER_EMAIL=… OWNER_PASSWORD=… npm run owner:create`.

## Tests

```bash
npm run test:unit          # pure domain logic (dates, recurrence, payroll, money, modes, tasks)
npm run test:integration   # services against the real levelup_test PostgreSQL database
npm run build && npm run test:e2e   # Playwright, iPhone 13 viewport, production build on :3101
```

Integration and E2E tests truncate **only** the `levelup_test` database and refuse to run against anything else.

## Security notes

- Passwords: Argon2id (19 MiB, t=2). Sessions: 256-bit random token in an httpOnly, SameSite=Lax cookie (Secure over HTTPS); only its SHA-256 is stored.
- Every page, server action, and API route checks the session server-side; middleware only fast-redirects requests that have no cookie.
- Login and setup are rate-limited (5 failures per client / 30 global per 15 min).
- Passkeys store only a public key. Face ID / Touch ID never leave the device. Passkeys are bound to the host name (`WEBAUTHN_RP_ID`): a passkey made on `localhost` will not work on a deployed HTTPS domain, so you'll add a new one after deployment.
- Financial changes run in transactions and write an append-only `AuditLog`. DB constraints block negative money, duplicate deposits per payday, duplicate paydays, and more than one open work mode.

## Money System (Phase 2)

1. **Record a real deposit:** Regular or Overtime Payroll → Record deposit (net amount, actual date).
2. **Overtime Money Roulette:** Money → Roulette 🎲 → choose the deposit → SPIN MY OVERTIME → reroll/adjust → Approve (reserves) → confirm each transfer as you make it.
3. **Extra Paycheck Planner:** Money → Extra Paycheck → Plan April… → set what's free after bills → dollars/percentages → optional spin → approve once a regular deposit for that month is confirmed.
4. **Challenges:** tiles complete only from confirmed transfers. SCHD earlier days: Challenges → Verify Days 1–37. Debt: Challenges → Set up debt challenge.
5. **Roth IRA:** set your own annual limit per tax year; LEVEL UP never hardcodes IRS figures.

LEVEL UP never moves money. Every "confirm" records a transfer you made yourself.

## Goals & growth (Phase 3)

Goals tab → Goals, Fitness, Faith, Relationship (incl. Alphabet Dating), Education, Career, Growth. Reviews tab → weekly (Sat–Fri) and monthly reviews. Progress only moves from things you log or confirm. Sessions you schedule are checked against your DOC shifts; conflicts show free alternatives and nothing is moved for you.

## Assistant, reminders & notifications (Phase 4)

- **Assistant tab:** Morning briefing (6 AM), Check-in (5 PM), Evening reflection (9 PM), and **Ask** — a rule-based assistant that answers only from your records, labels projections, and never changes anything without a tap. Questions are not stored. No external AI is connected.
- **Notification center** (bell in the header): unread/read, categories, priority, snooze, dismiss, history. Settings → Notifications: reminder types, briefing sections, quiet hours, work-mode rules, lock-screen detail (off by default).
- **Reminder worker** (local, free): `npm run worker` (every 60 s) or `npm run worker -- --once`. Idempotent, DST-safe, respects quiet hours and work modes, and skips stale reminders instead of flooding.
- **Push:** off until `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` are set. iPhone web push needs iOS 16.4+, HTTPS, and the app added to the Home Screen; it has **not** been tested on a real device yet.
- **Encryption key:** `npm run key:check` (does this key match my data?) and `npm run key:drill` (recovery drill on temporary databases with synthetic data). See `docs/ENCRYPTION-KEY-RECOVERY.md`.
- Deployment plan (not executed): `docs/DEPLOYMENT-PROPOSAL.md`.

## Gig income, analytics & backups (Phase 5)

- **Money → Gig Income:** log sessions (DoorDash, Veho, Instacart, Shipt, or your own sources), plan shifts (DOC-shift conflicts are blocked unless you override), track mileage, and confirm payouts.
  - Logged work is **never** spendable money. Only a payout you confirm adds one gig deposit to the ledger.
  - Gig deposits are not used by Roulette unless you open one there yourself.
  - The tax reserve and cost per mile are your own planning settings. LEVEL UP never assumes a mileage rate or tells you what's deductible.
  - CSV export for tax preparation is under Gig Income → Mileage & tax records.
- **Analytics** (More → Analytics): week (Sat–Fri), month, quarter, year or a custom range, in your time zone. It shows confirmed income only; projected paydays are counted separately and labelled. Growth sections have no streaks or scores.
- **Backups:**
  - `npm run backup:create`, `backup:verify`, `backup:restore-test` and `backup:drill`. See `docs/BACKUP-AND-RESTORE.md`.
  - Backups are encrypted with `BACKUP_PASSPHRASE` and never committed.
  - Keep `DATA_ENCRYPTION_KEY` separately.
- **Notifications:** Settings → Notifications has a simulated test (it never sends a push), diagnostics and troubleshooting. See `docs/NOTIFICATIONS-DEVICE-SETUP.md`.
- **Integrations:** Settings → Integrations lists future options. None are connected.
- **Docs:** `docs/SECURITY-REVIEW-PHASE-5.md`, `docs/DEPLOYMENT-READINESS.md` (proposal only) and `docs/PHASE-5-REPORT.md`.

## Pre-launch (hosting, security, backups)

See `docs/PRE-LAUNCH-REVIEW.md` for the hosting comparison, verified costs, remaining risks, and the step-by-step iPhone setup.

- **Production files:** `Dockerfile`, `railway.json` and `scripts/start.sh`. The start script runs migrations, then the web app and the worker together.
- **New production variables:**
  - `TRUSTED_PROXY_HOPS=1`
  - `BACKUP_PASSPHRASE`
  - `BACKUP_S3_*`
  - `LEVELUP_DATABASE_NAME` (only after a disaster restore)
- **Pre-launch security:**
  - nonce-based Content-Security-Policy;
  - database-backed login limiting with trusted-proxy IP parsing;
  - `__Host-` session cookie over HTTPS.

## Data export

Settings → **Export all data (JSON)** (`/api/export`, authenticated). Money is in integer cents, hours in hundredths.
