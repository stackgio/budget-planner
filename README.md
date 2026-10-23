# Spend Smarter

A fast, private, mobile-first expense tracker. Built with React + TypeScript + Vite, installable as a PWA.

**Add an expense in two fields:** what you bought and how much. The date is filled in and the
category is suggested (from your previous entries first, then keyword rules) — tap a chip to correct it.

## Features

- **Quick entry** — name + amount, auto date, suggested category, "tap to repeat" recent purchases, duplicate warning. Optional: category, payment method, need/want, notes, date, type.
- **Dashboard** — spent today / this week / this month / since last paycheck, remaining budget with progress bar and per-day allowance, average daily spend, top category, 5 most recent, weekly tip.
- **Biweekly paycheck tracker** — paycheck amount, money reserved for bills / debt / savings / investing (never counted as spendable), spending allowance, next payday. Or a custom 2-week or monthly budget.
- **Categories** — 13 defaults, rename, custom icons, add your own, archive. Per-category limits with friendly warnings at 80% and 100%.
- **Insights** — top category, most frequent purchase, eating-out count, small purchases adding up, last 7 days vs. previous 7, categories up/down. Computed only from what you recorded.
- **History** — search, filter by category and date, daily/weekly/monthly totals, edit, delete with confirmation, undo, and a Recently deleted bin with restore.
- **Reports** — by month, pay period or week: totals, category breakdown, daily chart, 8-week trend, budget performance, needs vs. wants (plus a monthly comparison), largest purchases, opportunities to cut back, savings calculator.
- **Money rules** — credit card payments, transfers, savings and uncle's money are tracked but never counted as spending; refunds reduce the original purchase. See [docs/DATA_FORMAT.md](docs/DATA_FORMAT.md).
- **Backups** — JSON and CSV export, import with merge-by-id (no duplicates) or replace-all.

## Where your data lives (please read)

- Data is stored **only on the device**, in the browser's `localStorage`. Nothing is sent to any server; there is **no sync** between devices.
- Each save keeps the previous copy too, so a corrupted write is recovered automatically on next launch.
- The app asks the browser for persistent storage, but browsers may still clear site data:
  - On iPhone, **add it to your Home Screen** (Safari → Share → Add to Home Screen). Safari can delete data for websites you haven't visited in a while; Home Screen apps are kept.
  - Clearing Safari website data, using Private Browsing, or deleting the Home Screen app erases your data.
  - The Safari tab and the Home Screen app keep **separate** data — pick one and stick with it.
- **Export a backup regularly** (Settings → Export backup) and save it to Files / iCloud Drive.
- Privacy: no analytics, no third-party scripts, a strict Content-Security-Policy, and CSV exports are protected against spreadsheet formula injection.

## claude.ai Artifact version

`node scripts/build-artifact.mjs out.html` builds a single-file version for publishing as a claude.ai Artifact.
In that build, data is saved to the signed-in person's private space in the artifact's database
(`data/users/<id>/…`, readable only by that person), so it follows them across devices. The browser copy is
only a cache. Exports use the viewer's download prompt. If account storage isn't available (e.g. signed out),
the app says "This browser only" and keeps data in the browser. Deleting the artifact deletes its data.

## Run it

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (accounting rules, budgets, refunds, import/export, persistence)
npm run build      # production build in dist/
npm run e2e        # builds must exist; drives the real app in a phone-sized browser
```

### Using it on your iPhone

The included GitHub Actions workflow tests, builds and deploys to **GitHub Pages** on every push to `main`.
Enable it once in the repo: *Settings → Pages → Build and deployment → Source: GitHub Actions*.
Then open `https://<your-user>.github.io/budget-planner/` in Safari and Add to Home Screen.
(GitHub Pages for a private repo requires a paid GitHub plan; any static host works — just upload `dist/`.)

## Project layout

```
src/lib/        pure logic — money (cents), dates, ledger (all totals), ops (validated edits),
                suggest (categories), insights, reports, backup (JSON/CSV), storage
src/pages/      Home, History, Reports, Budget, Settings
src/components/ ExpenseForm (quick entry), charts, shared UI
tests/          unit tests for the 10 required scenarios and more
scripts/e2e.mjs browser test of the same scenarios through the UI
```
