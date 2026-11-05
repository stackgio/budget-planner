# MoneyFlow

A personal finance dashboard built around **biweekly paychecks**. Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn-style UI primitives · Recharts · Prisma · SQLite (PostgreSQL-ready).

Everything is real and persistent: every number you enter is stored in the database, and every screen is calculated from your data. Nothing is a mockup, and nothing is made up.

---

## Quick start

```bash
cd moneyflow
npm install
cp .env.example .env          # DATABASE_URL="file:./dev.db"
npm run setup                 # creates the database + seeds Personal and Demo workspaces
npm run dev                   # http://localhost:3000
```

On iPhone (same Wi-Fi): run `npm run dev -- -H 0.0.0.0`, open `http://<your-computer-ip>:3000` in Safari, then Share → **Add to Home Screen**. **Set a passcode first** (see Security below); without one, anyone on your network can see your data.

Production build: `npm run build && npm start`. Tests: `npm test`. Type check: `npm run typecheck`.
Reset everything (both workspaces): `npm run db:reset`.

## First run

1. Opening the app takes you to **Confirm your starting numbers** (`/welcome`). It shows the profile you gave: $1,482 net per check, 55/20/15/10 split, your 7 recurring expenses, and the optional older plan lines. Each item stays **unverified** until you check it.
2. Enter **one real payday** you know for sure (past or upcoming). MoneyFlow generates every other payday 14 days apart, including across year boundaries. Until you set it, three-paycheck months show as *unknown*; MoneyFlow doesn't guess.
3. Optionally add a **due day** to each bill. Bills without a due day can't be placed into a pay period, and the app tells you so.

### Set or change your next payday

**My Paycheck → Pay schedule** (or Settings → Edit pay schedule). Any real payday works as the anchor. Changing it never rewrites paychecks you have already recorded.

### Enter your real transactions

- **Balances first:** Accounts → each account → **Update balance**. An account with no balance shows **Unknown**, never $0.
- **Manual:** Transactions → **Add**. Choose a type:
  - **Expense:** spending. A card purchase is an expense on the card account, counted once.
  - **Income** or **Refund:** a refund reduces spending in its category.
  - **Transfer:** money moving between your own accounts. This covers savings, Roth contributions, and card or loan payments. Transfers are never counted as spending.
  - Splits, tags, notes, and linking to a recurring bill are supported.
- **Paychecks:** My Paycheck → open a payday → **Record this paycheck** with the actual amount. This also creates the deposit transaction. Overtime, bonuses, and irregular income go in the separate form.
- **Bank CSV:** Transactions → **Import CSV**. You pick the account and file, map the columns (or use the auto-detected ones), and preview before importing. Duplicates are detected by fingerprint, so re-importing the same file or overlapping statements adds nothing. Two genuinely identical purchases in one file are both kept. After importing, re-label card payments and transfers between your own accounts as **Transfer**.
- **Export:** Transactions → Export (respects filters), or Settings → Export all.

## How the paycheck math works

| Figure | Value | How it's used |
|---|---|---|
| Per paycheck | $1,482.00 | Allocated 55/20/15/10 → $815.10 / $296.40 / $222.30 / $148.20 |
| Normal month (2 checks) | $2,964.00 | **Budget baseline** → $1,630.20 / $592.80 / $444.60 / $296.40 |
| Three-paycheck month | $4,446.00 | Only when your actual schedule has 3 paydays in a month |
| Annual (26 checks) | $38,532.00 | |
| Annualized monthly average | $3,211.00 | Shown for reference only. Don't budget on it. |

- Allocations always add up to the exact cent (largest-remainder rounding, integer cents everywhere).
- Allocation rules change only when you tick **"I confirm"**. Every change goes to the change log. **Pause investing** shows the investing share as paused/unassigned; it is never quietly moved into another bucket.
- **Bill reserves** have two clearly labeled modes:
  - **Half-month** (default): monthly bill ÷ 2 per check → **$801.75/check** for your 7 bills. This is conservative. Over 26 checks it reserves $20,845.50 against $19,242.00 of bills, building about one extra month ($1,603.50) of buffer a year.
  - **Annualized**: annual cost ÷ 26 per check. It frees cash, but needs a starting cushion. The 12-month simulation on the Bills page shows exactly how much, and on which due date the first gap would happen.
- A reserve counts as **funded only when you confirm it** on the paycheck page. Budgeting money alone never marks a bill funded. Funding gaps are shown per bill before each due date.
- **Three-paycheck months** are detected from your real schedule. The extra check gets its own "your call" panel (debt / emergency fund / invest / other goal), and nothing is allocated until you choose.
- **Every dollar gets a job:** each paycheck page shows the amount assigned vs unassigned. "Apply my standard plan" fills in the bill reserves plus the bucket split, but only when you click it.

Your 7 listed expenses total **$1,603.50**/month against a **$1,630.20** Needs budget, which leaves only **$26.70** of margin. The app warns about this: groceries, utilities, and other essentials may not be listed yet, and missing expenses are never treated as zero. To move Haircut out of Needs, edit its category's bucket under Budget → Category budgets.

## Pages

Dashboard (any month) · My Paycheck · Budget · Transactions · Accounts · Bills · Cash Flow · Debt · Goals · Investments · Settings. Desktop has a sidebar; iPhone has bottom navigation (Home, Paycheck, Activity, Budget, More). Light and dark mode follow the system and can be toggled.

- **Debt:** snowball vs avalanche, extra-payment scenarios, a debt-free countdown, and card utilization. A debt is only simulated once its balance, APR (use 0 for the interest-free friend loan), and payment are entered. Anything missing is listed, not guessed. Available credit is never shown as cash.
- **Investments:** manual holdings (VTI, VOO, SCHD, QQQM, VXUS, or anything else) with the prices *you* enter and their dates. Contributions are tracked separately from market change (value − first value − contributions since). No price feeds and no invented dividends.
- **Cash Flow:** actual balances are drawn solid and projections dashed, with a 6-week biweekly timeline, projected months (3-check months flagged), month-over-month by category, top merchants, and repeating merchants that aren't set up as bills.
- **Budget health:** every warning is computed from your data and links to the fix. Warnings cover bills exceeding cash, categories over their limit, spending pace (flexible categories only), underfunded bills, emergency fund below *your* target, unassigned money, upcoming debt payments, and the needs margin.

## Demo vs Personal

Use the sidebar switch on desktop, or the pill at the top of the screen on iPhone. They are separate datasets (separate `User` rows; every query is scoped by its id).

- **Personal:** only your stated profile, all editable and unverified. No transactions, balances, APRs, minimums, or due dates were invented. The 4 cards keep their reported limits; the friend loan is 0% with its balance to be confirmed.
- **Demo:** "Alex Demo", with three months of fictional activity relative to today. Settings → Reset demo regenerates it.

## Data model

`prisma/schema.prisma` defines these models: User (workspace), Settings, AllocationRule, Account, AccountSnapshot, Category, Transaction, TransactionSplit, Budget, Bill, BillReserve, PaycheckEvent, PaycheckAssignment, SavingsGoal, GoalContribution, Holding, InvestmentContribution, PlanLine (draft plan lines), ImportBatch, AuditEvent.

- Money is stored as **integer cents**. Shares are decimal strings and are calculated as integer micro-shares.
- Calendar dates are `YYYY-MM-DD` strings, so timezones and daylight saving can't shift a payday.
- A transaction's amount is signed from its account's point of view. Liabilities are stored as negative net value.
- An account's balance is its latest snapshot plus every transaction entered after it, so it reconciles from your own entries.
- Debt payments and savings/investment contributions are transfer pairs that share a `transferGroup`. Deleting one side deletes both.

Business logic lives in pure, tested modules: `src/lib/{money,dates,paycheck,bills,ledger,debt,csv,health}.ts`.

## Tests

`npm test` runs 40 unit tests covering:

- the $1,482 paycheck allocation, the $2,964 month, 26-paycheck annual figures, and the $4,446 three-paycheck month
- 14-day scheduling across year boundaries, and 3-paycheck detection that depends on the anchor
- bills due before the next payday (including day 31 in short months)
- both reserve modes and the sinking-fund gap simulation
- unconfirmed reserves never counting as funded
- credit-card purchases vs payments, savings and investment transfers vs expenses, refunds and splits
- missing balances reported as unknown, and same-day balance entries
- overtime, bonuses, and changed pay
- category percentage changes and validation
- debt payoff (snowball/avalanche, 0% debt, payments that don't cover interest)
- CSV mapping, debit/credit columns, and duplicate prevention
- budget-health warnings

## Security

- **Local development:** no login is required, and the app is meant for `localhost` only. Settings shows a "Local mode — not safe to host" banner.
- **Before exposing it anywhere** (LAN, tunnel, server), set both of these:
  ```bash
  MONEYFLOW_PASSCODE="a long passphrase"
  MONEYFLOW_SESSION_SECRET="$(openssl rand -hex 32)"
  ```
  Every page and the CSV export then require a signed, HTTP-only, 14-day session cookie. Forged cookies and wrong passcodes are rejected, and the API returns 401. Serve it over HTTPS (the cookie is `Secure` in production).
- **For multiple people:** the passcode protects a single owner. Before hosting for others, add a real identity provider (e.g. Auth.js with OAuth or passkeys) and map each authenticated user to their own `User` workspace id in `getUserId()` (`src/lib/workspace.ts`). All queries and actions already scope by that id and re-check ownership of every referenced record.
- Every server action validates its input on the server. Security headers are set: `X-Frame-Options: DENY`, `nosniff`, and `same-origin` referrer.
- Bank usernames and passwords are **never** requested or stored, and there is no fake bank sync. A future integration should use a regulated aggregator (Plaid / MX / Finicity) with OAuth and read-only tokens stored server-side in environment-configured secrets.

## PostgreSQL migration

1. In `prisma/schema.prisma`, set `provider = "postgresql"`.
2. Set `DATABASE_URL="postgresql://user:pass@host:5432/moneyflow?sslmode=require"`.
3. Run `npx prisma migrate dev --name init` (or `prisma db push`), then `npm run db:seed` if you want fresh workspaces.

No SQLite-specific types are used: cents are `Int`, dates are `String`, and ids are `cuid`. To move existing data, export transactions as CSV and import them, or use a tool such as `pgloader`.

## MoneyFlow vs Monarch Money

| | MoneyFlow | Monarch Money |
|---|---|---|
| Biweekly paycheck planner (per-check bills, reserves, every-dollar assignment) | **Core feature** | Monthly budgets; no per-paycheck planner |
| Three-paycheck months from your real schedule | **Yes**, with an explicit "your call" allocation | No dedicated handling |
| Half-month vs annualized (÷26) bill reserves, gap simulation | **Yes** | No |
| Confirmed vs unverified amounts; nothing invented | **Yes** | Data comes from bank sync |
| Bank & card auto-sync | **No** (manual + CSV import) | **Yes** (aggregators) |
| Investment prices / holdings sync | Manual prices only | Automatic |
| Native iOS/Android apps | Home-screen web app | **Native apps** |
| Shared household / collaborators | Single owner (multi-user needs real auth) | **Yes** |
| Rules engine, auto-categorization, AI insights | Not yet | **Yes** |
| Debt snowball/avalanche simulator | **Yes** | Limited (goals/planning) |
| Where your data lives | **Your machine / your database** | Monarch's cloud |
| Cost | Free, self-hosted | Paid subscription |

In short: MoneyFlow is stronger for planning paycheck to paycheck on a 14-day schedule, and it is strict about not inventing numbers. Monarch is stronger on automation (sync, categorization, apps, collaboration). Good next steps for MoneyFlow would be a categorization rules engine, recurring-transaction templates, and an optional aggregator integration behind real auth.
