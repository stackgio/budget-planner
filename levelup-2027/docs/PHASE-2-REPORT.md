# LEVEL UP 2027 — Phase 2 Report: The Money System

Status: **complete locally. Not deployed. No paid services. Stopped before Phase 3.**

## Ledger model

```
IncomeDeposit (confirmed by you; never from a schedule or an estimate)
  └─ AllocationPlan  DRAFT → APPROVED → COMPLETED | CANCELLED
       └─ AllocationLine  PLANNED → RESERVED → COMPLETED (paidCents) | CANCELLED
            └─ Payment  (a transfer you made elsewhere) — corrections add a negative reversal row
available = deposit net − reserved − completed
```

| Invariant | Enforced by |
|---|---|
| Never allocate more than a deposit | Row lock on the deposit at approval + deferred DB trigger at commit |
| Same dollar never allocated twice | Same as above; drafts reserve nothing |
| Same deposit never recorded twice | Partial unique index (one active deposit per payday) + idempotency key |
| Same tile never completed twice | Partial unique indexes on live lines and active payments per tile |
| Double taps / retries | Idempotency key + request hash on every money-creating mutation |
| No negative balances / amounts | CHECK constraints; engine and service validation |
| History never erased | Delete-blocking triggers; voids and reversals instead of deletes; audit log |
| Regular vs overtime money stay separate | Plan kind must match the deposit kind (Overtime Roulette ← overtime; Extra Paycheck ← regular) |

## Migrations (all additive, reviewed, applied with `migrate deploy`)

1. `20261117000000_phase2_ledger` — new tables, enums, constraints, triggers. The one drop (`IncomeDeposit_paydayId_key`) is immediately replaced by a stricter partial unique index. Financial FKs are `RESTRICT`.
2. `20261117000100_fix_history_guard` — corrects the delete-guard function (it referenced a column absent on some tables).
3. `20261117000200_plan_params` — nullable `params` column so REROLL reuses your last spin settings.

`levelup_dev` was migrated in place — never reset. Schema-to-database drift: none.

## Tests

| Suite | Count | Covers |
|---|---|---|
| Unit | 63 | Roulette engine: $0, $25, $100, $150, $250, $400, $500, $600, $1,000 (25 seeds each), shortfall, unaffordable tiles, one eligible challenge, all complete, debt excluded, SCHD sequencing and never skipping, rerolls, rotation, debt cap; debt mappings; Phase 1 domain |
| Integration (real PostgreSQL) | 54 | Spin/approve per amount, rerolls, draft refresh, duplicate/concurrent approvals, competing plans, concurrent tile confirmations, partial transfers, cancellations, reversals, idempotency replay and misuse, DB triggers when bypassing the service, SCHD history import, debt setup/correction, Roth limit warning, Extra Paycheck forecast vs binding, deposit crossing a month boundary, anchor changes, cross-account authorization, full reconciliation |
| Browser (Playwright, iPhone 13) | 17 | Phase 1 journeys + money dashboard, deposit → spin → reroll → refresh → approve → confirm (double tap recorded once), challenge tiles, SCHD import, debt setup, Extra Paycheck Planner, Roth |
