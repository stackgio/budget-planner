/**
 * Insights computed only from recorded transactions. When there isn't enough
 * data for an insight it is omitted — nothing is estimated or invented.
 */
import type { AppData, Category } from './types';
import type { Cents } from './money';
import { formatCents } from './money';
import { addDays, type DateRange, type ISODate } from './dates';
import { categoryBudgets, lastNDays, monthRange, spendingTransactions, spentByCategory, totalSpent } from './ledger';
import { normalizeDescription } from './suggest';

export interface Insight {
  id: string;
  icon: string;
  title: string;
  detail: string;
  tone: 'neutral' | 'good' | 'heads-up';
}

export interface CategoryChange {
  category: Category;
  current: Cents;
  previous: Cents;
  change: Cents;
}

export function categoryChanges(data: AppData, current: DateRange, previous: DateRange): CategoryChange[] {
  const a = spentByCategory(data, current);
  const b = spentByCategory(data, previous);
  const ids = new Set([...a.keys(), ...b.keys()]);
  return [...ids]
    .map((id) => {
      const category = data.categories.find((c) => c.id === id);
      return category ? { category, current: a.get(id) ?? 0, previous: b.get(id) ?? 0, change: (a.get(id) ?? 0) - (b.get(id) ?? 0) } : null;
    })
    .filter((c): c is CategoryChange => !!c && c.change !== 0)
    .sort((x, y) => Math.abs(y.change) - Math.abs(x.change));
}

export interface FrequentPurchase {
  description: string;
  count: number;
  total: Cents;
}

export function frequentPurchases(data: AppData, range: DateRange): FrequentPurchase[] {
  const groups = new Map<string, FrequentPurchase>();
  for (const t of spendingTransactions(data, range)) {
    if (t.kind !== 'expense') continue;
    const key = normalizeDescription(t.description);
    const g = groups.get(key) ?? { description: t.description, count: 0, total: 0 };
    g.count++;
    g.total += t.amountCents;
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || b.total - a.total);
}

export function topCategory(data: AppData, range: DateRange): { category: Category; spent: Cents } | null {
  const best = [...spentByCategory(data, range).entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0];
  if (!best) return null;
  const category = data.categories.find((c) => c.id === best[0]);
  return category ? { category, spent: best[1] } : null;
}

export function smallPurchases(data: AppData, range: DateRange): { count: number; total: Cents } {
  const small = spendingTransactions(data, range).filter((t) => t.kind === 'expense' && t.amountCents <= data.settings.smallPurchaseCents);
  return { count: small.length, total: small.reduce((s, t) => s + t.amountCents, 0) };
}

export function buildInsights(data: AppData, today: ISODate): Insight[] {
  const out: Insight[] = [];
  const month = monthRange(today);
  const monthToDate = { start: month.start, end: today };
  const last7 = lastNDays(today, 7);
  const prev7 = { start: addDays(last7.start, -7), end: addDays(last7.start, -1) };
  const hasPrevWeek = spendingTransactions(data, prev7).length > 0;

  const top = topCategory(data, monthToDate);
  if (top) {
    out.push({
      id: 'top-category',
      icon: top.category.emoji,
      title: `${top.category.name} is your biggest category this month`,
      detail: `${formatCents(top.spent)} so far this month.`,
      tone: 'neutral',
    });
  }

  const frequent = frequentPurchases(data, lastNDays(today, 30))[0];
  if (frequent && frequent.count >= 2) {
    out.push({
      id: 'frequent',
      icon: '🔁',
      title: `Most frequent purchase: ${frequent.description}`,
      detail: `${frequent.count} times in the last 30 days, ${formatCents(frequent.total)} total.`,
      tone: 'neutral',
    });
  }

  const eatingOut = spendingTransactions(data, monthToDate).filter((t) => t.kind === 'expense' && t.categoryId === 'eating-out');
  if (eatingOut.length) {
    out.push({
      id: 'eating-out',
      icon: '🍔',
      title: `${eatingOut.length} eating-out ${eatingOut.length === 1 ? 'purchase' : 'purchases'} this month`,
      detail: `${formatCents(eatingOut.reduce((s, t) => s + t.amountCents, 0))} total.`,
      tone: 'neutral',
    });
  }

  const small = smallPurchases(data, monthToDate);
  if (small.count >= 3) {
    out.push({
      id: 'small',
      icon: '🪙',
      title: `Small purchases added up to ${formatCents(small.total)}`,
      detail: `${small.count} purchases of ${formatCents(data.settings.smallPurchaseCents)} or less this month.`,
      tone: 'heads-up',
    });
  }

  const spentLast7 = totalSpent(data, last7);
  if (hasPrevWeek) {
    const spentPrev7 = totalSpent(data, prev7);
    const diff = spentLast7 - spentPrev7;
    out.push({
      id: 'week-compare',
      icon: diff <= 0 ? '📉' : '📈',
      title:
        diff === 0
          ? 'Same spending as the week before'
          : `${formatCents(Math.abs(diff))} ${diff < 0 ? 'less' : 'more'} than the previous week`,
      detail: `Last 7 days: ${formatCents(spentLast7)} · previous 7 days: ${formatCents(spentPrev7)}.`,
      tone: diff <= 0 ? 'good' : 'heads-up',
    });
    const changes = categoryChanges(data, last7, prev7);
    const up = changes.filter((c) => c.change > 0).slice(0, 3);
    const down = changes.filter((c) => c.change < 0).slice(0, 3);
    if (up.length) {
      out.push({
        id: 'cat-up',
        icon: '⬆️',
        title: 'Spending went up in',
        detail: up.map((c) => `${c.category.name} (+${formatCents(c.change)})`).join(', '),
        tone: 'heads-up',
      });
    }
    if (down.length) {
      out.push({
        id: 'cat-down',
        icon: '⬇️',
        title: 'Spending went down in',
        detail: down.map((c) => `${c.category.name} (−${formatCents(-c.change)})`).join(', '),
        tone: 'good',
      });
    }
  }

  return out;
}

/**
 * One practical suggestion for the coming week, based only on what was recorded.
 * Returns null when there isn't enough data.
 */
export function weeklyRecommendation(data: AppData, today: ISODate): string | null {
  const last7 = lastNDays(today, 7);
  const prev7 = { start: addDays(last7.start, -7), end: addDays(last7.start, -1) };
  const recent = spendingTransactions(data, last7);
  if (recent.length === 0) return null;

  const over = categoryBudgets(data, today).filter((r) => r.level !== 'ok').sort((a, b) => b.percent - a.percent)[0];
  if (over) {
    return over.level === 'over'
      ? `${over.category.name} has passed its budget. Try pausing ${over.category.name.toLowerCase()} purchases this week, or raise the limit if it was set too low.`
      : `${over.category.name} is at ${over.percent}% of its budget with ${formatCents(over.remaining)} left. Planning ahead for those purchases this week will help it last.`;
  }

  if (spendingTransactions(data, prev7).length) {
    const rise = categoryChanges(data, last7, prev7).find((c) => c.change > 0);
    if (rise && rise.change >= 1000) {
      return `${rise.category.name} rose by ${formatCents(rise.change)} compared with the week before. Setting a small weekly target for it could keep things steady.`;
    }
  }

  const frequent = frequentPurchases(data, last7)[0];
  if (frequent && frequent.count >= 3) {
    return `You bought ${frequent.description} ${frequent.count} times this week (${formatCents(frequent.total)}). Skipping one or two next week would save about ${formatCents(Math.round(frequent.total / frequent.count))} each time.`;
  }

  const wants = recent.filter((t) => t.needWant === 'want');
  if (wants.length) {
    const total = wants.reduce((s, t) => s + (t.kind === 'refund' ? -t.amountCents : t.amountCents), 0);
    if (total > 0) return `You marked ${formatCents(total)} as wants this week. Picking one want to skip next week is an easy win.`;
  }

  return `You recorded ${recent.length} ${recent.length === 1 ? 'purchase' : 'purchases'} this week totaling ${formatCents(totalSpent(data, last7))}. Keep logging — insights get sharper with more history.`;
}

/** Savings calculator: how much is saved by cutting a recurring purchase. */
export function savingsFromReduction(amountCents: Cents, timesPerWeek: number, cutPerWeek: number) {
  const cut = Math.max(0, Math.min(cutPerWeek, timesPerWeek));
  const weekly = amountCents * cut;
  return {
    weekly,
    monthly: Math.round((weekly * 52) / 12),
    yearly: weekly * 52,
  };
}
