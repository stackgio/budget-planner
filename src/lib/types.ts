import type { Cents } from './money';
import type { ISODate } from './dates';

/**
 * Transaction kinds and how each one is treated. These rules are shared with
 * Money Command Center — see docs/DATA_FORMAT.md.
 *
 *  expense     Consumption spending. Counts toward spending totals and budgets.
 *              A credit card purchase is an expense on the day it is recorded.
 *  refund      Money back for an earlier expense. Reduces spending in the
 *              original expense's category on the refund's date.
 *  cc_payment  Paying a credit card bill. NOT spending (the purchases already
 *              counted). Tracked so it is not mistaken for an expense.
 *  transfer    Moving money between my own accounts. NOT spending.
 *  savings     Transfer to savings or investments. NOT spending — reported
 *              separately as money set aside.
 *  uncle       Money handled on behalf of my uncle. Never my income or spending.
 *  debt_payment Paying down a debt (e.g. an interest-free balance). NOT
 *              consumption spending — counted toward the Goals bucket and
 *              reduces the linked debt's balance. Paying a credit card for
 *              purchases already recorded is `cc_payment`, not this.
 */
export type TxnKind = 'expense' | 'refund' | 'cc_payment' | 'transfer' | 'savings' | 'uncle' | 'debt_payment';

export const KIND_LABELS: Record<TxnKind, string> = {
  expense: 'Expense',
  refund: 'Refund',
  cc_payment: 'Credit card payment',
  transfer: 'Transfer (own accounts)',
  savings: 'Savings / investing',
  uncle: "Uncle's money",
  debt_payment: 'Debt payment',
};

export const KIND_HELP: Record<TxnKind, string> = {
  expense: 'Counts as spending.',
  refund: 'Reduces the original purchase.',
  cc_payment: 'Not spending — the purchases on the card were already counted.',
  transfer: 'Not spending — money moved between your own accounts.',
  savings: 'Not spending — tracked separately as money set aside.',
  uncle: 'Not yours — never counted as your income or spending.',
  debt_payment: 'Not spending — pays down a debt. Counts toward Goals and lowers the debt balance.',
};

export type NeedWant = 'need' | 'want';

export interface Transaction {
  /** UUID v4. Stable across export/import and shared with Money Command Center. */
  id: string;
  kind: TxnKind;
  description: string;
  /** Always a positive integer number of cents; `kind` decides the sign. */
  amountCents: Cents;
  date: ISODate;
  /** Required for expense/refund; null for non-spending kinds. */
  categoryId: string | null;
  paymentMethod: string | null;
  needWant: NeedWant | null;
  notes: string;
  /** For refunds: id of the expense being refunded. */
  refundOf: string | null;
  createdAt: string;
  updatedAt: string;
  /** Soft delete timestamp; deleted entries can be restored. */
  deletedAt: string | null;
  /**
   * Budget bucket chosen by the user. null = follow the budget line, then the
   * category's bucket. Only expense / refund / savings use it.
   */
  bucket: Bucket | null;
  /** Budget plan line this entry pays toward (e.g. "rent"), or null. */
  planLineId: string | null;
  /** For debt_payment: the debt being paid down. */
  debtId: string | null;
  /** For transfer: accounts and earmarks. Never affects spending. */
  transfer: TransferInfo | null;
}

export interface TransferAllocation {
  label: string;
  amountCents: Cents;
  /** Budget line this money is set aside for, if any. */
  planLineId: string | null;
}

export interface TransferInfo {
  fromAccount: string;
  toAccount: string;
  allocations: TransferAllocation[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  /** Spending limit per category-budget period, or null for none. */
  budgetCents: Cents | null;
  archived: boolean;
  /** Budget bucket that spending in this category counts toward by default. */
  bucket: Bucket;
}

export interface Paycheck {
  id: string;
  date: ISODate;
  amountCents: Cents;
  /** Money reserved for bills, debt, savings, investing — not spendable. */
  reserved: {
    bills: Cents;
    debt: Cents;
    savings: Cents;
    investing: Cents;
  };
  /** Discretionary spending allowance for this pay period. */
  allowanceCents: Cents;
  /** Day after periodEnd; kept for older readers of the data. */
  nextPayday: ISODate;
  notes: string;
  /** Budget period this paycheck covers (inclusive). */
  periodStart: ISODate;
  periodEnd: ISODate;
  /** Overtime already included in amountCents — informational, never added again. */
  overtimeCents: Cents;
  /** The plan as it was when this paycheck's budget was made. Frozen history. */
  plan: PaycheckPlan;
}

// ---------- 55/20/15/10 budget ----------

export type Bucket = 'needs' | 'investing' | 'goals' | 'fun';
export const BUCKETS: readonly Bucket[] = ['needs', 'investing', 'goals', 'fun'];
export const BUCKET_LABELS: Record<Bucket, string> = { needs: 'Needs', investing: 'Investing', goals: 'Goals', fun: 'Guilt-Free' };
export type BucketMap<T> = Record<Bucket, T>;

/**
 * bill:         fixed obligation; unpaid amount is shown as reserved.
 * spending:     variable spending; may claim a whole category (e.g. Groceries).
 * contribution: money moved to investing, savings goals or debt payoff.
 */
export type LineType = 'bill' | 'spending' | 'contribution';
export type GoalKind = 'emergency' | 'travel' | 'birthday' | 'debt' | 'other';

export interface PlanLine {
  id: string;
  name: string;
  bucket: Bucket;
  /** Planned amount per paycheck. */
  amountCents: Cents;
  type: LineType;
  /** spending lines: every expense in this category counts toward the line. */
  categoryId: string | null;
  goal: GoalKind | null;
}

export interface DebtPayoff {
  enabled: boolean;
  /** Planned investing redirected to debt per paycheck; null = all of the investing target. */
  redirectCents: Cents | null;
  debtId: string | null;
}

export interface PlanSnapshot {
  /** Basis points (5500 = 55%). Always sum to 10000. */
  percents: BucketMap<number>;
  lines: PlanLine[];
  debtPayoff: DebtPayoff;
}

export interface PaycheckPlan extends PlanSnapshot {
  /** Bill lines marked "paid in full" this period (nothing more is reserved). */
  settledLineIds: string[];
}

/** The editable template that new paychecks copy. */
export interface BudgetPlan extends PlanSnapshot {
  baselineCents: Cents;
}

export interface Debt {
  id: string;
  name: string;
  /** Balance owed on `asOf`; payments on or after that date reduce it. */
  balanceCents: Cents;
  asOf: ISODate;
  interestFree: boolean;
  payoffBy: ISODate | null;
  archived: boolean;
}

export type BudgetMode = 'paycheck' | 'biweekly' | 'monthly';

export interface Settings {
  /**
   * paycheck: budget = allowance of the latest paycheck, period = paycheck date → day before next payday.
   * biweekly: fixed custom amount every 14 days starting from `biweeklyAnchor`.
   * monthly:  fixed custom amount per calendar month.
   */
  budgetMode: BudgetMode;
  customBudgetCents: Cents;
  biweeklyAnchor: ISODate;
  /** Category limits apply per calendar month or per active budget period. */
  categoryBudgetPeriod: 'month' | 'budget';
  weekStartsOn: 0 | 1;
  paymentMethods: string[];
  /** Purchases at or under this count as "small purchases" in insights. */
  smallPurchaseCents: Cents;
}

export interface AppData {
  schemaVersion: 2;
  transactions: Transaction[];
  categories: Category[];
  paychecks: Paycheck[];
  settings: Settings;
  budget: BudgetPlan;
  debts: Debt[];
}

export const SPENDING_KINDS: ReadonlySet<TxnKind> = new Set(['expense', 'refund']);
