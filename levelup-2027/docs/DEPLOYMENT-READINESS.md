# LEVEL UP 2027 — Deployment Readiness (proposal only — NOT executed)

Nothing has been deployed, provisioned or purchased. This document supersedes the Phase 4 `DEPLOYMENT-PROPOSAL.md` cost section.

## 1. Pricing — verified vs estimated

**Verified today (2026-11-17, railway.com/pricing, quoted from the page):**

- "Your Hobby plan subscription includes $5 of usage per month. If your total usage at the end of your billing period is $5 or less, you will not be charged extra for usage."
- Per-second usage rates:

  | Resource | Rate | ≈ per month |
  |---|---|---|
  | Memory | $0.00000386 / GB / s | $10.0 / GB |
  | vCPU | $0.00000772 / vCPU / s | $20.0 / vCPU |
  | Volume storage | $0.00000006 / GB / s | $0.16 / GB |

- Network egress: $0.05 / GB. Object storage (buckets): $0.015 / GB-month, with free operations and free bucket egress.
- Hobby limits: volume storage up to 5 GB, logs kept 7 days, up to 6 replicas.
- The page lists a default *agent* spend limit and "hard and soft limits". The exact usage-limit controls should be checked in the dashboard.

**Not verified:** the Hobby subscription fee itself.

- The page's summary text said **$1/month**. Earlier third-party sources (Phase 4) said **$5/month**.
- I could not get a verbatim quote of the price, so confirm it on the checkout screen before subscribing.
- Under either fee the bill below stays in single digits.

**Estimated usage for one person:**

| Service | Assumption | Est. / month |
|---|---|---|
| Web app + in-process reminder worker | ~350 MB RAM, ~0.02 vCPU average | ≈ $3.50 + $0.40 |
| PostgreSQL | ~200 MB RAM, tiny CPU, 1 GB volume | ≈ $2.00 + $0.16 |
| Encrypted backups in a bucket | 14 daily + 8 weekly, < 50 MB each | < $0.02 |
| Egress | < 2 GB | < $0.10 |
| **Usage total** | | **≈ $6–7** |

The bill is the Hobby fee plus usage above the included $5:

- **≈ $6–7/month** if the fee is $5;
- **≈ $2–3/month** if the fee is $1.

**What can grow:** RAM held by the app (the main driver), extra services (a separate worker adds ≈ $1–2), egress, and storage. Set a usage alert or limit at about **$10**.

**Free:**
- the `*.up.railway.app` domain with HTTPS;
- TLS;
- Web Push delivery (Apple/Google push services; no Apple Developer account is needed for web push);
- VAPID keys;
- the rule-based assistant.

**Optional cost:** a custom domain at about $10–20/year.

## 2. Resources

| Service | Requirement |
|---|---|
| App (Next.js, `npm start`) | 512 MB limit. Measured local heavy queries: 3-year analytics ≈ 104 ms with 3,000 gig sessions, 50k audit rows and 20k notifications |
| Worker | In the same service (`npm run worker` alongside `npm start` via a small process runner), or a separate service. It is idempotent and safe across restarts |
| PostgreSQL 16 | Railway Postgres with a volume, private networking only |
| Storage | < 1 GB for years |

## 3. HTTPS, domain and passkeys

- Start on the free `*.up.railway.app` domain with HTTPS.
- **Passkeys are bound to the domain** (`WEBAUTHN_RP_ID`). Passkeys made on localhost won't work there, and changing domains later means re-adding them. Decide on a custom domain *before* adding the iPhone passkey.
- Set `APP_ORIGIN` to the exact HTTPS origin.

## 4. Secrets

The following are stored as Railway variables, never in Git:

- `DATABASE_URL`
- `APP_ORIGIN`
- `WEBAUTHN_RP_ID`
- `SETUP_TOKEN` (remove it after the owner account exists)
- **`DATA_ENCRYPTION_KEY`**: your existing key, pasted from your password manager. It is never regenerated.
- `VAPID_*`: generated once, with a copy in your password manager.
- `BACKUP_PASSPHRASE`: a separate password-manager entry.
- `CRON_SECRET`: only if an external cron is used.

Check the key first with `npm run key:check`.

## 5. Backups and restore testing

- **Daily** encrypted backup (`npm run backup:create`) at about 03:30 ET, kept as 14 daily + 8 weekly.
- **Monthly** restore test (`npm run backup:restore-test`), plus one after every migration.
- **Weekly** off-site copy of the backup files.
- The local drill passed (see BACKUP-AND-RESTORE.md).

## 6. Security checklist before go-live

- [ ] Nonce-based CSP added and tested (finding #4)
- [ ] Single replica (in-memory rate limit)
- [ ] `SETUP_TOKEN` used once, then removed
- [ ] `key:check` → OK on production
- [ ] Usage alert/limit set
- [ ] Database private (no public TCP proxy)
- [ ] Health check `/api/health`
- [ ] First backup taken and a restore test passed
- [ ] All test suites green on the deployed commit
- [ ] `npm audit` reviewed
- [ ] Separate Railway project from anything else; nothing from `moneyflow/` or `video/` involved

## 7. Rollback plan

1. Every deploy is a Git commit. Railway can redeploy the previous build in one click.
2. Migrations are additive. Before any migration deploy:
   - take a backup;
   - run `backup:restore-test`;
   - deploy;
   - if something is wrong, roll the app back. Additive tables are harmless to the previous version.
3. For data problems, restore the pre-deploy backup into a **new** database, verify it, then switch `DATABASE_URL`. The broken database is never dropped until you say so.

## 8. Real-iPhone test plan

1. Safari → HTTPS URL → sign in.
2. Share → Add to Home Screen → open from the icon. Check the splash screen appears.
3. Settings → Passkeys → add Face ID → sign out → sign in with Face ID.
4. Settings → Notifications → Diagnostics. Expect:
   - HTTPS: Yes
   - service worker: Active
   - opened from Home Screen: Yes
   - iOS ≥ 16.4
5. Tap **Enable on this device**, then allow.
6. Gig Income on a phone:
   - log a session, confirm a payout, open Analytics;
   - check for no sideways scrolling, readable text, and that every button can be tapped.

## 9. Notification testing plan (real device, after approval)

1. Send a simulated test. It appears in the notification center and nothing is pushed.
2. With approval, send **one** real test push. Check:
   - it arrives;
   - the lock screen shows generic text;
   - tapping it opens the right page.
3. Quiet hours: schedule a reminder inside them. It is held or skipped.
4. Work mode = Overtime: optional reminders are suppressed and important ones arrive.
5. Restart the worker mid-run: no duplicate is shown (same tag replaces).
6. Turn push off: the device disappears from Diagnostics.

## 10. Your ongoing maintenance

About 30 minutes a month:

- look at the bill;
- check the Diagnostics "worker last ran" line;
- monthly restore test;
- monthly `npm audit`;
- confirm the backup files exist off-site.

Plan a dependency maintenance pass each quarter (Prisma 7, minor updates).
