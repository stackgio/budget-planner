# Spend Smarter data format & accounting rules

This document is the contract for sharing data with other apps (e.g. Money
Command Center). Both apps should use the same ids and rules so totals agree.

## Backup file (JSON)

```json
{
  "format": "spend-smarter-backup",
  "app": "Spend Smarter",
  "schemaVersion": 1,
  "exportedAt": "2026-10-23T18:00:00.000Z",
  "data": {
    "schemaVersion": 1,
    "transactions": [Transaction],
    "categories": [Category],
    "paychecks": [Paycheck],
    "settings": Settings
  }
}
```

## Transaction

| field | type | notes |
|---|---|---|
| `id` | UUID v4 string | Permanent. Never reused or regenerated. The merge key for imports. |
| `kind` | `expense` \| `refund` \| `cc_payment` \| `transfer` \| `savings` \| `uncle` | See rules below. |
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

## Accounting rules

1. **All money is integer cents.** No floating point anywhere in calculations.
2. **Spending** = sum of `expense` amounts − sum of `refund` amounts, excluding deleted entries.
3. **Credit card purchases** are `expense` entries on the date recorded (whatever the payment method).
4. **Credit card bill payments** are `cc_payment` and are **not** spending — the purchases were already counted.
5. **Transfers** between your own accounts (`transfer`) are not spending.
6. **Savings / investing** (`savings`) are not spending; they are totalled separately as money set aside.
7. **Refunds** reduce spending on the refund's date, in the original expense's category. A linked refund can't exceed what is left of the original purchase. Deleting a purchase deletes its refunds with it.
8. **Uncle's money** (`uncle`) is never counted as personal income or spending.
9. **Paychecks**: spending allowance ≤ paycheck − (bills + debt + savings + investing reserved). The pay period runs from the paycheck date to the day before the next payday.
10. **Duplicates**: imports merge by `id`. An entry with a new id but the same kind, date, amount and description as an existing active entry is skipped as a duplicate.

## CSV

Columns: `id,date,kind,description,amount,spending_effect,category,payment_method,need_want,notes,refund_of,created_at,updated_at`.
`amount` is positive dollars (e.g. `14.50`); `spending_effect` is the signed effect on spending
(refunds negative, non-spending kinds `0.00`). Deleted entries are not exported to CSV.
A minimal CSV with just `date,description,amount` can be imported too (negative amounts become refunds).
