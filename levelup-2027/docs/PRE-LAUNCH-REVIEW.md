# LEVEL UP 2027 — Final Pre-Launch Review

Status: ready for your decision. **Nothing has been deployed, purchased or activated.**

## 1. How Stackwise is hosted (read from its files; nothing was changed)

Stackwise is the `moneyflow/` app in the same repository. Its `railway.json`, `Dockerfile` and README show this setup:

| | Stackwise |
|---|---|
| Host | **Railway**, built from the `Dockerfile`, with a health check at `/api/health` and automatic restart |
| Data | **SQLite**: one file on a persistent Railway **volume** mounted at `/data`. It survives redeploys |
| Sign-in | One passcode plus a signed session cookie. Every request is refused if the passcode isn't set |
| Address | Railway's free `https://<name>.up.railway.app` |
| iPhone | Safari → Add to Home Screen → full-screen |
| Backups | CSV export, plus Railway volume backups |

What I can't see: I have no access to your Railway account. I can't confirm Stackwise's live status, which plan you're on, or what it costs today. Everything above comes from the repository.

## 2. Why LEVEL UP needs a slightly bigger setup than Stackwise

| Need | Why |
|---|---|
| **PostgreSQL**, not SQLite | The money ledger relies on database triggers, row locks and advisory locks so that nothing can be double-counted, even with two requests at once. 164 integration tests depend on this |
| An **always-on worker** | Reminders every minute, plus the 3:30 AM daily backup. It runs in the same service as the website, so no extra service is needed |
| **HTTPS on a real address** | Required by iPhone push notifications and by Face ID passkeys |
| **Off-site backups** | So that losing the database doesn't lose your history |

## 3. Hosting comparison

| Option | Affordability | Reliability | Security | Permanent data | Notifications | Works from iPhone only? |
|---|---|---|---|---|---|---|
| **Railway, same account as Stackwise (recommended)** | ≈ $4–7/mo extra if Stackwise already pays the $5 plan; ≈ $6–8/mo if on its own | Always-on, auto-restart, health check, daily volume snapshots | Private database network, HTTPS, secrets in Railway variables | Postgres on a volume, plus daily encrypted backups in a separate bucket, plus your iCloud copy | Yes: an always-on worker and HTTPS | **Yes.** railway.com works in Safari, and deploys come from GitHub |
| Railway, separate new account | ≈ $6–8/mo | Same | Same | Same | Yes | Yes |
| Vercel + Neon (free tiers)\* | $0 | Serverless; the database sleeps when idle | Good | Yes | **No reliable per-minute reminders** on free plans | Yes |
| Render (free)\* | $0 | Free web services sleep; free Postgres is time-limited | Good | **Not permanent** on free | Unreliable while asleep | Yes |
| Fly.io\* | Similar to Railway; no free tier | Good | Good | Volumes | Yes | Setup expects a computer with a command-line tool |

\* Alternatives are based on their published plan terms as I know them. I did **not** re-check them today.

**Recommendation:** put LEVEL UP on **Railway, in the same account as Stackwise, as a separate project.** It's the setup you already use and manage from your phone, and it meets every requirement.

- **Cheaper together.** A Hobby subscription covers the whole account, so the $5 fee is shared.
- **Kept apart.** LEVEL UP gets its own project, so it never touches Stackwise.

## 4. Costs

**Verified today (2026-11-17) on docs.railway.com and railway.com/pricing:**
- Hobby is **$5/month**, and the fee includes **$5 of usage**. You pay only usage above $5.
- **Rates:**

  | Resource | Rate | ≈ per month |
  |---|---|---|
  | Memory | $0.00000386 per GB per second | $10.0 per GB |
  | CPU | $0.00000772 per vCPU per second | $20.0 per vCPU |
  | Volume | $0.00000006 per GB per second | $0.16 per GB |
  | Network egress | $0.05 per GB | — |

- **Buckets:** $0.015 per GB-month. Requests and bucket egress are free. Buckets are private and S3-compatible.
- **Volume backups:**
  - schedules: daily (kept 6 days), weekly (kept 27 days), monthly (kept 89 days);
  - restore with one tap;
  - billed like volume storage, for the changed data only.
- **Usage limits:** you can set an email alert and a hard limit. **When the hard limit is reached, Railway takes the apps offline.**

**Estimated LEVEL UP usage (not a quote):**

| Item | Estimate / month |
|---|---|
| Web app + worker (~350–400 MB memory, light CPU) | $3.90–4.40 |
| PostgreSQL (~200 MB memory, 1 GB volume) | $2.20 |
| Railway volume snapshots | < $0.20 |
| Encrypted backup files in the bucket (14 daily + 8 weekly, under 1 MB each today) | < $0.01 |
| Egress (one person) | < $0.10 |
| **Total usage** | **≈ $6.40–6.90** |

**What you'd pay:**
- LEVEL UP alone on Hobby: ≈ **$6.50–7/month**.
- In the same account as Stackwise: ≈ $9–11/month **for both together**. That is roughly **$4.50–6** more than Stackwise alone, if Stackwise uses $2–4 today. Check Stackwise's current usage on Railway's Usage page.

**Backup cost:** about **$0.20/month in total**, covering volume snapshots and encrypted files in the bucket. Your iCloud Drive copy uses a few MB of iCloud storage, which costs nothing extra on a normal plan.

**Free:** the `*.up.railway.app` HTTPS address, iPhone push delivery (Apple charges nothing for web push), Face ID passkeys, and the built-in assistant.

**Optional:** a custom domain (≈ $10–20/year). Not needed. If you ever want one, choose it **before** adding your Face ID passkey, because passkeys are tied to the address.

**Recommended limits:** an email alert at **$10** and a hard limit at **$25**. The hard limit shuts the apps down, so set it above normal usage. It is only a runaway-bill safety net.

## 5. Final security work (done and tested)

| Item | What changed | Tested by |
|---|---|---|
| **Content-Security-Policy** | A new nonce on every request. Only Next.js's own nonce-tagged scripts run. Inline handlers, injected markup, framing and plugins are blocked. Also sets `form-action 'self'` and `base-uri 'self'`, plus `upgrade-insecure-requests` on HTTPS | E2E: header present, every page works under it with no violations, and an injected `onerror=` handler and `<iframe srcdoc>` script are blocked. The Face ID passkey flow works under the CSP |
| **Login rate limiting** | *Correction:* the Phase 5 report wrongly called this in-memory; it was already database-backed. The real gaps are now fixed: (1) client IP comes from the trusted proxy's entry, so a forged `X-Forwarded-For` can't dodge the limit; (2) an attempt is reserved *before* the password is checked, so parallel guessing can't slip through; (3) Face ID sign-in still works while someone hammers the password form; (4) the "current password" check when changing your password is limited too; (5) old attempts are cleaned up daily | Integration: 20 parallel guesses → exactly 5 allowed; spoofed headers; global limit with passkey exempt |
| **Sessions** | Over HTTPS the cookie uses the `__Host-` prefix (Secure, no domain, path `/`), so another `*.up.railway.app` site can't set or overwrite it. Expired sessions are pruned. Existing protections: httpOnly, SameSite=Lax, a 30-day session, only a SHA-256 of the token stored, "Sign out everywhere", other devices signed out after a password change | E2E: cookie flags; after sign-out the old token is refused |
| **Private pages and records** | A crawler lists every page and API in the code and requests each one signed out. All private pages redirect to sign-in and all private APIs return 401, including with a forged cookie. A static test checks that every server action calls `requireUser()`. Cross-account isolation is tested per feature | E2E + unit |
| **Service-worker caching** | The service worker has no fetch handler and no cache. Private pages and exports are sent `Cache-Control: no-store` | E2E: the cache list is empty after browsing; headers checked |
| **Registration abuse** | Single owner: needs `SETUP_TOKEN`; "first account wins" is atomic (advisory lock); setup is closed and redirects as soon as the owner exists, and the token isn't even checked after that; attempts are rate-limited; error messages no longer echo internal errors. Disaster restore is offered **only** on an empty installation and needs the setup token plus the backup passphrase | Integration: 4 parallel setups → 1 owner. E2E: `/setup` redirects; restore API refuses |
| HSTS, no-sniff, frame DENY, no-referrer | Present (HSTS takes effect over HTTPS) | Start-script probe |

Bugs found and fixed during this review:
- The worker crashed on start. It imported a Next.js-only module; caught by running the real production start script, and now covered by a process-level test.
- The start script didn't stop the worker when the web app stopped.
- The "Test restore" scheduler used a lock that doesn't work with a connection pool; caught by a concurrency test.

## 6. Data persistence and recovery (designed for iPhone-only use)

Your data lives in **PostgreSQL on Railway**, not in Safari. Safari stores only your sign-in cookie, so deleting Safari data or getting a new phone loses nothing.

**Three layers of backup, all automatic except the last tap:**
1. **Railway volume snapshots.** Daily, weekly and monthly, turned on once. One-tap restore in the Railway app.
2. **LEVEL UP encrypted daily backup** at 3:30 AM New York time:
   - stored in a **private Railway bucket** separate from the database;
   - verified by reading it back;
   - 14 daily and 8 weekly copies kept;
   - shown in **Settings → Backups & recovery**.
3. **Your own copy.** Once a week: Settings → Backups → **Save** → *Save to Files → iCloud Drive*. The file is encrypted. The Backups page shows when you last did this and turns amber after 7 days.

**Checking it works:** Settings → Backups → **Test restore**. It restores the newest backup into a temporary copy, checks that row counts match, that the ledger reconciles and that notes decrypt, then deletes the copy.

**If the database were ever lost:**
1. Add a new Postgres in Railway.
2. LEVEL UP opens on its setup screen. Choose **Restore from a backup**, then enter your setup token and backup passphrase.
3. Pick the file from iCloud Drive, or use the newest backup in the bucket.
4. LEVEL UP restores into a **new** database and tells you its name.
5. In Railway, add the variable `LEVELUP_DATABASE_NAME` with that name, then Deploy.

All of this can be done from the iPhone.

**Saving the encryption key and backup passphrase:**
- Use the iPhone **Passwords** app, with **two separate entries**: "LEVEL UP encryption key" and "LEVEL UP backup passphrase".
- They sync to your other Apple devices with iCloud Keychain end-to-end encryption, and they're protected by Face ID and your device passcode.
- Optionally also keep a paper copy at home.
- Never put them in Notes, email, texts, screenshots or a chat. LEVEL UP never displays them after setup.
- If you lose the **encryption key**, your money records, goals and tasks still restore, but private notes stay locked.
- If you lose the **passphrase**, the encrypted backup files can't be opened. You still have Railway's own volume snapshots.

## 7. iPhone experience: what's ready

- **Safari → Add to Home Screen:** manifest (standalone, portrait, start `/`), name "LEVEL UP".
- **App icon:** 180 px Apple touch icon, plus 192, 512 and maskable icons.
- **Full screen:** `apple-mobile-web-app-capable`, black-translucent status bar, `viewport-fit=cover`, safe-area padding.
- **Launch screens:** 11 iPhone sizes.
- **Face ID passkeys:** WebAuthn tested with a virtual authenticator under the CSP. Real-iPhone test after deployment.
- **Push notifications:** VAPID keys can be made on the phone, a service worker is in place, and the permission flow is built. Real push hasn't been tested and needs your approval.
- **Persistent data:** PostgreSQL plus three backup layers.
- **Access from anywhere:** HTTPS address on Railway.

## 8. Remaining risks (honest list)

1. **Push and Face ID on a real iPhone are untested** until deployment. Push needs iOS 16.4+ and opening the app from the Home Screen. Apple can stop delivering to an app you haven't opened in a long time; the in-app notification center remains the source of truth.
2. **The Docker image hasn't been built end-to-end here.** This sandbox can't reach Debian's package mirrors. What was verified: the production start script ran locally (migrations, then web and worker together), a restart happens when either process stops, the health check responds, the CSP and HSTS headers are present, and the worker made a verified backup. Railway builds with normal internet access, and the first deploy log will confirm the build.
3. **Postgres version match.** The image installs PostgreSQL 17 client tools. If Railway's Postgres turns out to be newer, the first "Back up now" will say so, and the fix is a one-line build setting (`PG_MAJOR`).
4. **Single provider for layers 1 and 2.** Both are on Railway. Your weekly iCloud copy is what protects you if you lose your Railway account. Don't skip it.
5. **The hard spending limit takes the apps offline** when reached. Keep it well above normal usage.
6. **One instance only.** That's fine for one person.
7. **CSP allows inline *styles*,** which React's style attributes need. Scripts are strictly nonce-only.
8. **`npm audit` reports 0 vulnerabilities.** That isn't proof of security, and minor dependency updates are still pending a maintenance pass.

## 9. Step by step on your iPhone (after you approve)

**One-time setup, about 20 minutes in Safari:**
1. Go to **railway.com**, sign in with the same GitHub account as Stackwise, and open Account → **Usage limits**. Set an email alert of $10 and a hard limit of $25.
2. **New Project → Deploy from GitHub repo** → `stackgio/budget-planner`. In the service's Settings:
   - Root Directory `/levelup-2027`
   - the branch you approve
3. In the project: **+ New → Database → PostgreSQL**, then **+ New → Bucket**.
4. In the Postgres service: **Backups** → turn on the daily schedule.
5. In the LEVEL UP service: **Settings → Networking → Generate Domain**. Note the address.
6. **Variables → Raw editor** → paste this, replacing the address:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   APP_ORIGIN=https://YOUR-ADDRESS.up.railway.app
   WEBAUTHN_RP_ID=YOUR-ADDRESS.up.railway.app
   TRUSTED_PROXY_HOPS=1
   BACKUP_S3_ENDPOINT=${{Bucket.ENDPOINT}}
   BACKUP_S3_BUCKET=${{Bucket.BUCKET}}
   BACKUP_S3_ACCESS_KEY_ID=${{Bucket.ACCESS_KEY_ID}}
   BACKUP_S3_SECRET_ACCESS_KEY=${{Bucket.SECRET_ACCESS_KEY}}
   BACKUP_S3_REGION=${{Bucket.REGION}}
   ```
   Railway names the services. If yours are called something other than "Postgres" and "Bucket", use those names.
7. Wait for the deploy, then open the address in Safari. You'll see "Create your account".
8. Tap **First time? Generate your secrets** → **Generate**. For each of the five values:
   - tap **Copy**;
   - for `DATA_ENCRYPTION_KEY`, `BACKUP_PASSPHRASE` and `SETUP_TOKEN`: in the **Passwords** app, tap **+** and save it as its own entry;
   - paste it into Railway → Variables under the same name.
9. Railway redeploys. Back in Safari, refresh, then fill in the setup token, your name, email and a password (12+ characters, and save it in Passwords too). Tap **Create account**.
10. **Share → Add to Home Screen → Add.** From now on, open LEVEL UP from that icon.
11. In the app: **Settings → Passkeys → Add**, then Face ID. Sign out and sign back in with Face ID to check it.
12. **Settings → Notifications → Enable on this device → Allow.** Then send a **simulated** test. A real push test happens only with your approval.
13. **Settings → Backups → Back up now**, then **Test restore**, then **Save** and choose iCloud Drive.

**Weekly, about 30 seconds:** Settings → Backups → Save the newest backup to iCloud Drive.

**Monthly, about 1 minute:** Settings → Backups → Test restore. Glance at Railway's Usage page.

## 10. Test results after these changes

| Suite | Result |
|---|---|
| TypeScript | 0 errors |
| Unit | 126 passed (+17: proxy IP parsing, CSP, every action requires auth, on-phone secret generator) |
| Integration (PostgreSQL) | 164 passed (+17: rate limiting and setup races, backup service, worker process) |
| Browser (production build, iPhone 13) | 51 passed (+8: route crawl, CSP, caching, sessions, setup closure, backups, Home Screen assets) |
| Production build | Passes with 0 warnings |
| Production start script (local) | Migrations ran; web and worker both up; health OK; restart on failure |
| `npm audit` | 0 vulnerabilities |
| Backup drill / key drill | Passed |
