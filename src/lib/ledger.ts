/**
 * Pure accounting calculations. Every total in the app comes from here so the
 * rules in types.ts are applied in exactly one place.
 */
import type { AppData, Category, Paycheck, Transaction } from './types';
import type { Cents } from './money';
import { sumCents } from './money';
import {
  addDays,
  daysBetween,
  endOfMonth,
  inRange,
  startOfMonth,
  startOfWeek,
  type DateRange,
  type ISODate,
} from './dates';

export function activeTransactions(data: AppData): Transaction[] {
  return data.transactions.filter((t) => !t.deletedAt);
}

/**
 * Signed effect of a transaction on consumption spending:
 * expenses add, refunds subtract, everything else is zero.
 */
export function spendingEffect(t: Transaction): Cents {
  if (t.deletedAt) return 0;
  if (t.kind === 'expense') return t.amountCents;
  if (t.kind === 'refund') return -t.amountCents;
  return 0;
}

export function spendingTransactions(data: AppData, range?: DateRange): Transaction[] {
  return data.transactions.filter(
    (t) => !t.deletedAt && (t.kind === 'expense' || t.kind === 'refund') && (!range || inRange(t.date, range)),
  );
}

export function totalSpent(data: AppData, range: DateRange, filter?: (t: Transaction) => boolean): Cents {
  return sumCents(
    spendingTransactions(data, range)
      .filter((t) => !filter || filter(t))
      .map(spendingEffect),
  );
}

export function spentByCategory(data: AppData, range: DateRange): Map<string, Cents> {
  const totals = new Map<string, Cents>();
  for (const t of spendingTransactions(data, range)) {
    const id = t.categoryId ?? 'other';
    totals.set(id, (totals.get(id) ?? 0) + spendingEffect(t));
  }
  return totals;
}

export function spentByDay(data: AppData, range: DateRange): Map<ISODate, Cents> {
  const totals = new Map<ISODate, Cents>();
  for (const t of spendingTransactions(data, range)) totals.set(t.date, (totals.get(t.date) ?? 0) + spendingEffect(t));
  return totals;
}

/** Money moved to savings / investments (tracked separately from spending). */
export function totalSaved(data: AppData, range: DateRange): Cents {
  return sumCents(
    data.transactions.filter((t) => !t.deletedAt && t.kind === 'savings' && inRange(t.date, range)).map((t) => t.amountCents),
  );
}

export function refundedAmount(data: AppData, expenseId: string, excludeRefundId?: string): Cents {
  return sumCents(
    data.transactions
      .filter((t) => !t.deletedAt && t.kind === 'refund' && t.refundOf === expenseId && t.id !== excludeRefundId)
      .map((t) => t.amountCents),
  );
}

// ---------- periods ----------

export function todayRange(today: ISODate): DateRange {
  return { start: today, end: today };
}

export function weekRange(today: ISODate, weekStartsOn: 0 | 1): DateRange {
  const start = startOfWeek(today, weekStartsOn);
  return { start, end: addDays(start, 6) };
}

export function monthRange(date: ISODate): DateRange {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

/** Last n days ending today, inclusive. */
export function lastNDays(today: ISODate, n: number): DateRange {
  return { start: addDays(today, -(n - 1)), end: today };
}

export function latestPaycheck(data: AppData, today: ISODate): Paycheck | null {
  const past = data.paychecks.filter((p) => p.date <= today).sort((a, b) => b.date.localeCompare(a.date));
  return past[0] ?? null;
}

export function paycheckRange(p: Paycheck): DateRange {
  const end = p.nextPayday > p.date ? addDays(p.nextPayday, -1) : p.date;
  return { start: p.date, end };
}

export function sumReserved(p: Paycheck): Cents {
  return p.reserved.bills + p.reserved.debt + p.reserved.savings + p.reserved.investing;
}

/** Paycheck minus reserved money; the most the allowance should be. */
export function maxAllowance(p: Paycheck): Cents {
  return Math.max(0, p.amountCents - sumReserved(p));
}

export interface BudgetPeriod {
  range: DateRange;
  budgetCents: Cents;
  label: string;
  /** True when in paycheck mode and next payday has passed without a new paycheck. */
  stale: boolean;
}

function biweeklyRange(anchor: ISODate, date: ISODate): DateRange {
  const n = Math.floor(daysBetween(anchor, date) / 14);
  const start = addDays(anchor, n * 14);
  return { start, end: addDays(start, 13) };
}

/** The spending-budget period containing `today`, or null if not set up. */
export function currentBudgetPeriod(data: AppData, today: ISODate): BudgetPeriod | null {
  const s = data.settings;
  if (s.budgetMode === 'paycheck') {
    const p = latestPaycheck(data, today);
    if (!p) return null;
    const range = paycheckRange(p);
    return { range, budgetCents: p.allowanceCents, label: 'This pay period', stale: today > range.end };
  }
  if (s.customBudgetCents <= 0) return null;
  if (s.budgetMode === 'biweekly') {
    return { range: biweeklyRange(s.biweeklyAnchor, today), budgetCents: s.customBudgetCents, label: 'This 2-week budget', stale: false };
  }
  return { range: monthRange(today), budgetCents: s.customBudgetCents, label: 'This month', stale: false };
}

export interface BudgetStatus {
  period: BudgetPeriod;
  spent: Cents;
  remaining: Cents;
  percent: number;
  /** Days left in the period including today. */
  daysLeft: number;
  /** Remaining budget per day left (0 when over budget). */
  perDayLeft: Cents;
}

export function budgetStatus(data: AppData, today: ISODate): BudgetStatus | null {
  const period = currentBudgetPeriod(data, today);
  if (!period) return null;
  const spent = totalSpent(data, { start: period.range.start, end: period.stale ? today : period.range.end });
  const remaining = period.budgetCents - spent;
  const daysLeft = Math.max(1, daysBetween(today, period.range.end) + 1);
  return {
    period,
    spent,
    remaining,
    percent: period.budgetCents > 0 ? Math.round((spent / period.budgetCents) * 100) : 0,
    daysLeft,
    perDayLeft: remaining > 0 ? Math.floor(remaining / daysLeft) : 0,
  };
}

// ---------- category budgets ----------

export type WarningLevel = 'ok' | 'near' | 'over';

export interface CategoryBudgetRow {
  category: Category;
  spent: Cents;
  budget: Cents;
  remaining: Cents;
  percent: number;
  level: WarningLevel;
}

export function warningLevel(spent: Cents, budget: Cents): WarningLevel {
  if (budget <= 0) return 'ok';
  // Integer comparison: spent/budget >= 100% and >= 80%.
  if (spent >= budget) return 'over';
  if (spent * 100 >= budget * 80) return 'near';
  return 'ok';
}

export function categoryBudgetRange(data: AppData, today: ISODate): DateRange {
  if (data.settings.categoryBudgetPeriod === 'budget') {
    const p = currentBudgetPeriod(data, today);
    if (p) return p.range;
  }
  return monthRange(today);
}

export function categoryBudgets(data: AppData, today: ISODate, range = categoryBudgetRange(data, today)): CategoryBudgetRow[] {
  const spent = spentByCategory(data, range);
  return data.categories
    .filter((c) => !c.archived && c.budgetCents && c.budgetCents > 0)
    .map((c) => {
      const s = spent.get(c.id) ?? 0;
      const budget = c.budgetCents!;
      return {
        category: c,
        spent: s,
        budget,
        remaining: budget - s,
        percent: Math.round((s / budget) * 100),
        level: warningLevel(s, budget),
      };
    });
}

/** Friendly, non-judgmental warning text for a category nearing/over its limit. */
export function budgetWarningText(row: CategoryBudgetRow, formatter: (c: Cents) => string): string | null {
  if (row.level === 'over') {
    const over = row.spent - row.budget;
    return over === 0
      ? `You've used your full ${row.category.name} budget. Anything more will go over — that's okay, just a heads-up.`
      : `${row.category.name} is ${formatter(over)} over budget. No stress — you can adjust the limit or ease off for the rest of the period.`;
  }
  if (row.level === 'near') {
    return `You've used ${row.percent}% of your ${row.category.name} budget — ${formatter(row.remaining)} left.`;
  }
  return null;
}

// ---------- duplicates ----------

/** Same kind, amount, date and description as an existing active entry. */
export function findDuplicate(
  data: AppData,
  draft: Pick<Transaction, 'kind' | 'amountCents' | 'date' | 'description'>,
  excludeId?: string,
): Transaction | null {
  const desc = draft.description.trim().toLowerCase();
  return (
    data.transactions.find(
      (t) =>
        !t.deletedAt &&
        t.id !== excludeId &&
        t.kind === draft.kind &&
        t.amountCents === draft.amountCents &&
        t.date === draft.date &&
        t.description.trim().toLowerCase() === desc,
    ) ?? null
  );
}
