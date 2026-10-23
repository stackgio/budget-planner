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
 */
export type TxnKind = 'expense' | 'refund' | 'cc_payment' | 'transfer' | 'savings' | 'uncle';

export const KIND_LABELS: Record<TxnKind, string> = {
  expense: 'Expense',
  refund: 'Refund',
  cc_payment: 'Credit card payment',
  transfer: 'Transfer (own accounts)',
  savings: 'Savings / investing',
  uncle: "Uncle's money",
};

export const KIND_HELP: Record<TxnKind, string> = {
  expense: 'Counts as spending.',
  refund: 'Reduces the original purchase.',
  cc_payment: 'Not spending — the purchases on the card were already counted.',
  transfer: 'Not spending — money moved between your own accounts.',
  savings: 'Not spending — tracked separately as money set aside.',
  uncle: 'Not yours — never counted as your income or spending.',
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
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  /** Spending limit per category-budget period, or null for none. */
  budgetCents: Cents | null;
  archived: boolean;
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
  nextPayday: ISODate;
  notes: string;
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
  schemaVersion: 1;
  transactions: Transaction[];
  categories: Category[];
  paychecks: Paycheck[];
  settings: Settings;
}

export const SPENDING_KINDS: ReadonlySet<TxnKind> = new Set(['expense', 'refund']);
