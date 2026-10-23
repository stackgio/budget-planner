# Spend Smarter data format & accounting rules

This document is the contract for sharing data with other apps (e.g. Money
Command Center). Both apps should use the same ids and rules so totals agree.

## Backup file (JSON)

```json
{
  "format": "spend-smarter-backup",
  "app": "Spend Smarter",
  "schemaVersion": 2,
  "exportedAt": "2026-10-23T18:00:00.000Z",
  "data": {
    "schemaVersion": 2,
    "transactions": [Transaction],
    "categories": [Category],
    "paychecks": [Paycheck],
    "settings": Settings,
    "budget": BudgetPlan,
    "debts": [Debt]
  }
}
```

Schema 1 files (before the Budget Manager) still import: every new field gets a
safe default, and each old paycheck receives a copy of the plan once.

## Transaction

| field | type | notes |
|---|---|---|
| `id` | UUID v4 string | Permanent. Never reused or regenerated. The merge key for imports. |
| `kind` | `expense` \| `refund` \| `cc_payment` \| `transfer` \| `savings` \| `uncle` \| `debt_payment` | See rules below. |
| `description` | string | What the money was spent on. |
| `amountCents` | positive integer | Always positive; `kind` decides the sign. |
| `date` | `YYYY-MM-DD` | Local calendar day of the transaction. |
| `categoryId` | string \| null | Set for `expense` / `refund`, `null` otherwise. |
| `paymentMethod` | string \| null | Free text, e.g. "Credit card". |
| `needWant` | `need` \| `want` \| null | Only ever set by the user (or copied from their own earlier entry). |
| `notes` | string | |
| `refundOf` | UUID \| null | For refunds: the `id` of the expense being refunded. |
| `createdAt`, `updatedAt` | ISO timestamp | Newer `updatedAt` wins when merging. |
| `deletedAt` | ISO timestamp \| null | Soft delete. Deleted entries never count toward totals. |
| `bucket` | `needs` \| `investing` \| `goals` \| `fun` \| null | Budget bucket chosen for this entry. null = use the plan line's bucket, then the category's. Savings: `investing` or `goals`. |
| `planLineId` | string \| null | Budget plan line this entry pays toward (e.g. `rent`). |
| `debtId` | string \| null | For `debt_payment`: the debt being paid down. |
| `transfer` | object \| null | For `transfer`: `{ fromAccount, toAccount, allocations: [{ label, amountCents, planLineId }] }`. Earmarks only. |

## Accounting rules

1. **All money is integer cents.** No floating point anywhere in calculations.
2. **Spending** = sum of `expense` amounts − sum of `refund` amounts, excluding deleted entries.
3. **Credit card purchases** are `expense` entries on the date recorded (whatever the payment method).
4. **Credit card bill payments** are `cc_payment` and are **not** spending — the purchases were already counted.
5. **Transfers** between your own accounts (`transfer`) are not spending.
6. **Savings / investing** (`savings`) are not spending; they are totalled separately as money set aside.
7. **Refunds** reduce spending on the refund's date, in the original expense's category. A linked refund can't exceed what is left of the original purchase. Deleting a purchase deletes its refunds with it.
8. **Uncle's money** (`uncle`) is never counted as personal income or spending.
9. **Paychecks** cover `periodStart`–`periodEnd` (inclusive). Pay periods don't overlap; an entry belongs to the period containing its date. `amountCents` is net pay; `overtimeCents` is already inside it and is never added again.
10. **Debt payments** (`debt_payment`) are not spending. They count toward the Goals bucket (debt payoff) and reduce the linked debt's balance. Paying a credit card for purchases already recorded is `cc_payment`, never `debt_payment`.
11. **Transfers with set-asides** (e.g. $300 Main Checking → Bills Checking: Capital One $100, Household bills $100, Amex $100) are still not spending. Set-asides are shown against bills but a bill stays *reserved* until its actual payment is recorded.
12. **Duplicates**: imports merge by `id`. An entry with a new id but the same kind, date, amount and description as an existing active entry is skipped as a duplicate.

## CSV

Columns: `id,date,kind,description,amount,spending_effect,category,payment_method,need_want,notes,refund_of,created_at,updated_at`.
`amount` is positive dollars (e.g. `14.50`); `spending_effect` is the signed effect on spending
(refunds negative, non-spending kinds `0.00`). Deleted entries are not exported to CSV.
A minimal CSV with just `date,description,amount` can be imported too (negative amounts become refunds).

## Budget Manager (55/20/15/10)

**Planned money and actual money are stored separately.** Plans live in `budget`
and in each paycheck's `plan`; actuals are only ever transactions.

| Object | Fields |
|---|---|
| `BudgetPlan` | `baselineCents`, `percents` (basis points per bucket — `5500` = 55%, always summing to `10000`), `lines: [PlanLine]`, `debtPayoff: { enabled, redirectCents \| null, debtId \| null }` |
| `PlanLine` | `id`, `name`, `bucket`, `amountCents` (per paycheck), `type` (`bill` \| `spending` \| `contribution`), `categoryId` (spending lines: claims all spending in that category), `goal` (`emergency` \| `travel` \| `birthday` \| `debt` \| `other` \| null) |
| `Paycheck` (added) | `periodStart`, `periodEnd`, `overtimeCents`, `plan` (frozen copy of percents, lines and debt mode, plus `settledLineIds` — bills marked paid in full). `reserved`/`allowanceCents`/`nextPayday` are derived for older readers. |
| `Debt` | `id`, `name`, `balanceCents` (as of `asOf`), `asOf`, `interestFree`, `payoffBy`, `archived` |
| `Category` (added) | `bucket` — default bucket for spending in that category |

Rules:

- **Targets** = net pay × the paycheck's own percentages, in integer cents; leftover cents go to the largest remainders so buckets always add up to the paycheck exactly.
- **Which bucket?** an entry's own `bucket`, else its plan line's bucket, else its category's bucket.
- **Spent** = expenses − refunds; **contributed** = `savings`; **debt paid** = `debt_payment`. Transfers, `cc_payment` and `uncle` never touch the budget.
- **Reserved** = for each `bill` line, planned − paid in that pay period; 0 once marked paid in full (while a payment exists). A bill is never both spent and reserved.
- **Remaining** per bucket = target − spent − contributed − debt paid − reserved (Investing − redirect, Goals + redirect in Debt Payoff Mode). Summed, that is income − spent − contributed − debt paid − reserved. It is budget, not a bank balance.
- **History**: editing the plan updates paychecks dated after today. Current and past paychecks keep their plan until you explicitly apply the new one. Debt Payoff Mode applies to paychecks whose period hasn't ended.
- **Months** count paychecks paid in the month and entries dated in the month, so a three-paycheck month shows three. Each day belongs to one pay period, so the per-period parts of a month add up to the month.
