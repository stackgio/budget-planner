# LEVEL UP 2027

A private, mobile-first Life Operating System: calendar, tasks, DOC schedule and payroll, extra-paycheck detection, work modes, and (in later phases) Money Roulette, the assistant, and push notifications.

**Status: Phase 2 (Money System) complete — local only, not deployed.**
Docs: [Phase 0 architecture](docs/PHASE-0-ARCHITECTURE.md) · [Phase 2 report](docs/PHASE-2-REPORT.md) · [Security audit](docs/SECURITY-AUDIT-PHASE-2.md).

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

## Data export

Settings → **Export all data (JSON)** (`/api/export`, authenticated). Money is in integer cents, hours in hundredths.
