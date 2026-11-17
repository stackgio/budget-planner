# LEVEL UP 2027 — Railway Deployment Proposal (NOT executed)

Status: **proposal only.** Nothing has been created, purchased, or deployed. Needs your explicit approval.

Pricing below is from railway.com/pricing and two independent 2026 breakdowns, checked 2026‑11‑17. Re-check before approving — usage pricing changes.

## 1. What would run

| Railway service | What it is | Notes |
|---|---|---|
| `levelup-web` | The Next.js app (Docker, `levelup-2027/` as root) | HTTPS on a free `*.up.railway.app` domain |
| `levelup-db` | Railway PostgreSQL 16 with a persistent volume | Separate from MoneyFlow; no shared data |
| Reminder worker | **Recommended:** run inside `levelup-web` (one extra process: `npm run worker`). **Alternative:** a separate always-on worker service | The scheduler is idempotent and restart-safe, so either works; in-process avoids paying for a third service |

## 2. Expected monthly cost

Railway Hobby = **$5/month minimum, which includes $5 of usage.** Usage beyond that is billed per second:
RAM ≈ **$10 per GB-month**, CPU ≈ **$20 per vCPU-month** (actual use), volume storage **$0.15 per GB-month**, egress **$0.05 per GB**.

| Item | Assumption | Est. / month |
|---|---|---|
| Web app (+ in-process worker) | ~300–400 MB RAM held, near-idle CPU (one user) | $3.00–4.50 |
| PostgreSQL | ~150–250 MB RAM, tiny CPU | $1.50–2.50 |
| Database storage | < 1 GB for years of personal data | ≈ $0.15 |
| Backups (see §4) | daily `pg_dump`, compressed, < 50 MB each, 30 kept | < $0.25 |
| Egress | one person's browsing + push payloads, < 2 GB | < $0.10 |
| **Total usage** | | **≈ $5–8** |
| **You pay** | $5 plan + usage above the included $5 | **≈ $5–8 / month** |

Separate always-on worker service instead of in-process: add ≈ $1–2/month.

**Free:** the `*.up.railway.app` HTTPS domain, TLS certificates, Web Push delivery (Apple's/Google's push services charge nothing; no Apple Developer account needed for web push), VAPID keys, the rule-based assistant.
**Costs money:** the Railway Hobby plan and any usage above $5.
**Can grow with usage:** RAM held by the app (the main driver), egress, backup storage. For one user these stay small. Railway lets you set a **usage limit / spend alert** — set it to e.g. $10 so a bug can't run up a bill.
**Optional:** a custom domain (≈ $10–20/year at a registrar). Decide this *before* adding passkeys: passkeys are tied to the domain, so switching domains later means re-adding them.

Not proposed: Railway Pro ($20/month), paid email/SMS, external AI.

## 3. Secrets & configuration (Railway variables — never in Git)

`DATABASE_URL` (from Railway Postgres) · `APP_ORIGIN` / `WEBAUTHN_RP_ID` (the final HTTPS domain) · `SETUP_TOKEN` (one-time, remove after setup) · **`DATA_ENCRYPTION_KEY`** (your existing key — copied from your password manager, never generated anew) · `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (generated once, stored only in Railway + your password manager) · `CRON_SECRET` (only if an external cron calls `/api/cron/tick`).

## 4. Backups & restore

- **Frequency:** daily `pg_dump -Fc` at ~03:30 ET (worker job), plus Railway's own volume snapshot if available on the plan.
- **Retention:** 14 daily + 8 weekly (~4 months).
- **Where:** a Railway storage bucket (≈ $0.015/GB-month) or downloaded monthly to your computer.
- **Encryption key:** stored separately in your password manager. A backup without the key can't read private notes — by design.
- **Restore test (monthly, ~10 minutes):** restore the latest dump into a temporary database, run `npm run key:check` against it, open the app against it, and confirm counts of deposits/payments/goals match. The same procedure as `npm run key:drill`, which already passes locally.

## 5. Security checklist before go-live

- [ ] `SETUP_TOKEN` set, owner account created, then token removed
- [ ] HTTPS only (Railway default); `APP_ORIGIN` matches the domain exactly
- [ ] `DATA_ENCRYPTION_KEY` restored from your copy; `npm run key:check` → OK
- [ ] Spend limit / alert configured
- [ ] `npm audit` → 0; production build; all test suites pass on the deployed commit
- [ ] Database not publicly exposed (Railway private networking)
- [ ] Health check `/api/health` configured
- [ ] Login rate limiting verified behind Railway's proxy (client IP forwarding)
- [ ] First backup taken and a restore tested
- [ ] No MoneyFlow resources touched; separate Railway project

## 6. Real-iPhone test plan (after deployment)

1. Safari → open the HTTPS URL → sign in.
2. Share → **Add to Home Screen** → open from the icon (standalone).
3. Settings → Notifications → **Enable on this device** → allow.
4. Settings → Passkeys → add Face ID passkey → sign out → sign in with Face ID.
5. Trigger a test reminder (a dedicated “Send test notification” button would be added at deploy time) and confirm: banner appears, text is generic, tapping opens the right page.
6. Lock-screen check: no amounts or names unless you enabled detailed previews.
7. Quiet hours and a work mode: confirm optional reminders don't arrive.
8. Only after these pass will notifications or passkeys be described as working on your iPhone.

## 7. Ongoing maintenance

~30 minutes/month: review the Railway bill, glance at the scheduler log, monthly restore test, apply dependency security updates (`npm audit`), and the Prisma 7 migration when it becomes worthwhile.

## 8. Risks & limitations

- Usage pricing can change; set a spend alert.
- iOS web push depends on Apple; iOS can stop delivering to an app you haven't opened in a long time. In-app notifications remain the source of truth.
- Single region, single instance: a Railway outage means the app is unavailable (no data loss with backups).
- If the encryption key is lost, private notes cannot be recovered.
- Hobby plan log retention is short (≈ 7 days).
