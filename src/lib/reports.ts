import type { AppData, Transaction } from './types';
import type { Cents } from './money';
import { addDays, addMonths, eachDay, formatDay, formatMonth, monthKey, startOfWeek, type DateRange, type ISODate } from './dates';
import { categoryBudgets, monthRange, paycheckRange, spendingTransactions, spentByCategory, spentByDay, totalSaved, totalSpent } from './ledger';
import { frequentPurchases, smallPurchases } from './insights';

export interface ReportPeriod {
  key: string;
  label: string;
  range: DateRange;
  kind: 'month' | 'pay' | 'week';
}

export function monthPeriods(data: AppData, today: ISODate): ReportPeriod[] {
  const dates = data.transactions.filter((t) => !t.deletedAt).map((t) => t.date);
  const earliest = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : today;
  const out: ReportPeriod[] = [];
  for (let k = monthKey(today); k >= monthKey(earliest); k = addMonths(k, -1)) {
    out.push({ key: `m:${k}`, label: formatMonth(k), range: monthRange(`${k}-01`), kind: 'month' });
    if (out.length > 120) break;
  }
  return out;
}

export function payPeriods(data: AppData, today: ISODate): ReportPeriod[] {
  if (data.settings.budgetMode === 'biweekly') {
    const anchor = data.settings.biweeklyAnchor;
    const dates = data.transactions.filter((t) => !t.deletedAt).map((t) => t.date);
    const earliest = dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : today;
    const out: ReportPeriod[] = [];
    let n = Math.floor((Date.parse(today) - Date.parse(anchor)) / (14 * 86_400_000));
    for (; out.length < 60; n--) {
      const start = addDays(anchor, n * 14);
      const end = addDays(start, 13);
      if (end < earliest && out.length) break;
      out.push({ key: `b:${start}`, label: `${formatDay(start)} – ${formatDay(end)}`, range: { start, end }, kind: 'pay' });
    }
    return out;
  }
  return [...data.paychecks]
    .filter((p) => p.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((p) => {
      const range = paycheckRange(p);
      return { key: `p:${p.id}`, label: `${formatDay(range.start)} – ${formatDay(range.end)}`, range, kind: 'pay' as const };
    });
}

export interface WeeklyTrendPoint {
  start: ISODate;
  label: string;
  spent: Cents;
}

export function weeklyTrend(data: AppData, end: ISODate, weeks: number, weekStartsOn: 0 | 1): WeeklyTrendPoint[] {
  const last = startOfWeek(end, weekStartsOn);
  const out: WeeklyTrendPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addDays(last, -7 * i);
    out.push({ start, label: formatDay(start), spent: totalSpent(data, { start, end: addDays(start, 6) }) });
  }
  return out;
}

export interface Report {
  total: Cents;
  count: number;
  saved: Cents;
  byCategory: Array<{ id: string; name: string; emoji: string; spent: Cents }>;
  daily: Array<{ date: ISODate; spent: Cents }>;
  needs: Cents;
  wants: Cents;
  unmarked: Cents;
  largest: Transaction[];
  opportunities: string[];
}

export function buildReport(data: AppData, range: DateRange, today: ISODate, fmt: (c: Cents) => string): Report {
  const txns = spendingTransactions(data, range);
  const byCat = spentByCategory(data, range);
  const byDay = spentByDay(data, range);
  const catList = [...byCat.entries()]
    .map(([id, spent]) => {
      const c = data.categories.find((x) => x.id === id);
      return { id, name: c?.name ?? 'Other', emoji: c?.emoji ?? '📦', spent };
    })
    .filter((c) => c.spent !== 0)
    .sort((a, b) => b.spent - a.spent);

  let needs = 0, wants = 0, unmarked = 0;
  for (const t of txns) {
    const v = t.kind === 'refund' ? -t.amountCents : t.amountCents;
    if (t.needWant === 'need') needs += v;
    else if (t.needWant === 'want') wants += v;
    else unmarked += v;
  }

  const opportunities: string[] = [];
  const wantCats = new Map<string, Cents>();
  for (const t of txns) if (t.needWant === 'want' && t.categoryId) wantCats.set(t.categoryId, (wantCats.get(t.categoryId) ?? 0) + (t.kind === 'refund' ? -t.amountCents : t.amountCents));
  const topWant = [...wantCats.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topWant && topWant[1] > 0) {
    const c = data.categories.find((x) => x.id === topWant[0]);
    opportunities.push(`${c?.name ?? 'Other'} wants totaled ${fmt(topWant[1])}. Cutting that by a quarter would free up ${fmt(Math.round(topWant[1] / 4))}.`);
  }
  const freq = frequentPurchases(data, range).filter((f) => f.count >= 3)[0];
  if (freq) opportunities.push(`${freq.description}: ${freq.count} purchases, ${fmt(freq.total)}. Each one skipped saves about ${fmt(Math.round(freq.total / freq.count))}.`);
  const small = smallPurchases(data, range);
  if (small.count >= 5) opportunities.push(`${small.count} small purchases added up to ${fmt(small.total)}.`);
  const eat = byCat.get('eating-out') ?? 0;
  const groceries = byCat.get('groceries') ?? 0;
  if (eat > 0 && eat > groceries) opportunities.push(`Eating out (${fmt(eat)}) was more than groceries (${fmt(groceries)}). Swapping a few meals out for home cooking usually costs less.`);
  for (const row of categoryBudgets(data, today, range).filter((r) => r.level === 'over')) {
    opportunities.push(`${row.category.name} went ${fmt(row.spent - row.budget)} over its ${fmt(row.budget)} budget.`);
  }

  return {
    total: totalSpent(data, range),
    count: txns.filter((t) => t.kind === 'expense').length,
    saved: totalSaved(data, range),
    byCategory: catList,
    daily: eachDay(range).map((date) => ({ date, spent: byDay.get(date) ?? 0 })),
    needs,
    wants,
    unmarked,
    largest: txns.filter((t) => t.kind === 'expense').sort((a, b) => b.amountCents - a.amountCents).slice(0, 5),
    opportunities: opportunities.slice(0, 4),
  };
}
