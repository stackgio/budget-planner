/**
 * The 55/20/15/10 Budget Manager — pure calculations.
 *
 * Planned money (plan lines, bucket targets) and actual money (transactions)
 * are stored separately and only meet here. Every number on the Budget tab
 * comes from these functions so the rules below are applied in one place:
 *
 *  - Bucket targets are the paycheck's net amount split by the paycheck's own
 *    percentages (frozen when the paycheck was added). Overtime is already
 *    inside the net amount and is never added again.
 *  - Spending (expense − refund) counts in exactly one bucket: the entry's own
 *    choice, else its budget line's bucket, else its category's bucket.
 *  - Savings entries are contributions to Investing or Goals, debt payments are
 *    Goals (debt payoff). Neither is spending.
 *  - Transfers, credit card payments and uncle's money never touch the budget.
 *  - A bill is reserved only while unpaid: reserved = planned − paid, and 0 once
 *    marked paid in full, so the same bill is never both spent and reserved.
 *  - Debt Payoff Mode moves planned investing to Goals as "redirected" money.
 *    It never creates or removes transactions.
 */
import type { AppData, Bucket, BucketMap, Debt, Paycheck, PlanLine, PlanSnapshot, Transaction, TxnKind } from './types';
import { BUCKETS, BUCKET_LABELS } from './types';
import type { Cents } from './money';
import { formatCents, sumCents } from './money';
import { addDays, addMonths, eachDay, endOfMonth, formatDay, formatMonth, inRange, monthKey, type DateRange, type ISODate } from './dates';
import { spendingEffect } from './ledger';
import { defaultBucketFor } from './defaults';
import { normalizeDescription } from './suggest';

export const BUCKET_COLORS: BucketMap<string> = { needs: 'var(--b-needs)', investing: 'var(--b-investing)', goals: 'var(--b-goals)', fun: 'var(--b-fun)' };

const zeroMap = (): BucketMap<number> => ({ needs: 0, investing: 0, goals: 0, fun: 0 });

// ---------- percentages & allocation ----------

/** "55" / "55.5" / "12.25%" → basis points. null if invalid. */
export function parsePercent(input: string): number | null {
  const s = input.trim().replace(/%$/, '').trim();
  if (!/^\d{1,3}(\.\d{0,2})?$/.test(s)) return null;
  const [w, f = ''] = s.split('.');
  const bp = Number(w) * 100 + Number((f + '00').slice(0, 2));
  return bp <= 10000 ? bp : null;
}

export function formatPercent(bp: number): string {
  return `${bp % 100 === 0 ? bp / 100 : (bp / 100).toFixed(bp % 10 === 0 ? 1 : 2)}%`;
}

export function percentTotal(p: BucketMap<number>): number {
  return p.needs + p.investing + p.goals + p.fun;
}

/**
 * Split integer cents by basis points so the parts always add up to the
 * total exactly (largest remainder; ties go to the earlier bucket).
 */
export function allocate(amountCents: Cents, percents: BucketMap<number>): BucketMap<Cents> {
  const out = zeroMap();
  if (percentTotal(percents) !== 10000) throw new Error('Percentages must add up to 100%.');
  const rema: Array<[Bucket, number]> = [];
  let used = 0;
  for (const b of BUCKETS) {
    const exact = amountCents * percents[b];
    out[b] = Math.floor(exact / 10000);
    used += out[b];
    rema.push([b, exact % 10000]);
  }
  rema.sort((a, b) => b[1] - a[1] || BUCKETS.indexOf(a[0]) - BUCKETS.indexOf(b[0]));
  for (let i = 0; used < amountCents; i++, used++) out[rema[i % 4][0]]++;
  return out;
}

export function plannedByBucket(lines: PlanLine[]): BucketMap<Cents> {
  const out = zeroMap();
  for (const l of lines) out[l.bucket] += l.amountCents;
  return out;
}

/** Investing money redirected to debt for a paycheck with these targets. */
export function redirectAmount(plan: PlanSnapshot, targets: BucketMap<Cents>): Cents {
  if (!plan.debtPayoff.enabled) return 0;
  return Math.max(0, Math.min(plan.debtPayoff.redirectCents ?? targets.investing, targets.investing));
}

export function sameSnapshot(a: PlanSnapshot, b: PlanSnapshot): boolean {
  const pick = (s: PlanSnapshot) => JSON.stringify([s.percents, s.lines, s.debtPayoff]);
  return pick(a) === pick(b);
}

// ---------- paycheck periods ----------

export function paycheckPeriod(p: Paycheck): DateRange {
  return { start: p.periodStart, end: p.periodEnd };
}

interface Index {
  /** Sorted by periodStart descending, so the first hit is the latest period. */
  paychecks: Paycheck[];
  periodCache: Map<ISODate, Paycheck | null>;
}
const indexes = new WeakMap<AppData, Index>();

function index(data: AppData): Index {
  let ix = indexes.get(data);
  if (!ix) {
    ix = {
      paychecks: [...data.paychecks].sort((a, b) => b.periodStart.localeCompare(a.periodStart) || b.date.localeCompare(a.date)),
      periodCache: new Map(),
    };
    indexes.set(data, ix);
  }
  return ix;
}

/** The paycheck whose budget period contains `date` (latest wins if periods overlap). */
export function paycheckFor(data: AppData, date: ISODate): Paycheck | null {
  const ix = index(data);
  if (ix.periodCache.has(date)) return ix.periodCache.get(date)!;
  const hit = ix.paychecks.find((p) => inRange(date, paycheckPeriod(p))) ?? null;
  ix.periodCache.set(date, hit);
  return hit;
}

export function sortedPaychecks(data: AppData): Paycheck[] {
  return [...data.paychecks].sort((a, b) => b.date.localeCompare(a.date) || b.periodStart.localeCompare(a.periodStart));
}

/** The paycheck covering today, or the latest one (stale) if its period has ended. */
export function currentPaycheck(data: AppData, today: ISODate): { paycheck: Paycheck; stale: boolean } | null {
  const hit = paycheckFor(data, today);
  if (hit) return { paycheck: hit, stale: false };
  const past = data.paychecks.filter((p) => p.periodStart <= today).sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
  return past ? { paycheck: past, stale: true } : null;
}

export function targetsFor(p: Paycheck): BucketMap<Cents> {
  return allocate(p.amountCents, p.plan.percents);
}

// ---------- how a transaction counts ----------

export type Flow = 'spent' | 'contributed' | 'debt';

export interface Resolved {
  flow: Flow;
  bucket: Bucket;
  line: PlanLine | null;
  /** Signed for spending (refunds negative); positive otherwise. */
  amount: Cents;
}

function linesAt(data: AppData, date: ISODate): PlanLine[] {
  return paycheckFor(data, date)?.plan.lines ?? data.budget.lines;
}

function findLine(lines: PlanLine[], t: Pick<Transaction, 'kind' | 'planLineId' | 'categoryId'>): PlanLine | null {
  if (t.planLineId) {
    const l = lines.find((x) => x.id === t.planLineId);
    if (l) return l;
  }
  if ((t.kind === 'expense' || t.kind === 'refund') && t.categoryId) {
    return lines.find((l) => l.type === 'spending' && l.categoryId === t.categoryId) ?? null;
  }
  return null;
}

function categoryBucket(data: AppData, categoryId: string | null): Bucket {
  if (!categoryId) return 'fun';
  return data.categories.find((c) => c.id === categoryId)?.bucket ?? defaultBucketFor(categoryId);
}

const isContributionBucket = (b: Bucket | null | undefined): b is 'investing' | 'goals' => b === 'investing' || b === 'goals';

/** How an entry counts toward the budget, or null if it doesn't (transfers, card payments, uncle, deleted). */
export function resolveTxn(data: AppData, t: Transaction): Resolved | null {
  if (t.deletedAt) return null;
  if (t.kind === 'expense' || t.kind === 'refund') {
    const line = findLine(linesAt(data, t.date), t);
    return { flow: 'spent', bucket: t.bucket ?? line?.bucket ?? categoryBucket(data, t.categoryId), line, amount: spendingEffect(t) };
  }
  if (t.kind === 'savings') {
    const line = findLine(linesAt(data, t.date), t);
    const bucket = isContributionBucket(t.bucket) ? t.bucket : isContributionBucket(line?.bucket) ? line!.bucket : 'goals';
    return { flow: 'contributed', bucket, line, amount: t.amountCents };
  }
  if (t.kind === 'debt_payment') {
    const lines = linesAt(data, t.date);
    const line = findLine(lines, t) ?? lines.find((l) => l.goal === 'debt') ?? null;
    return { flow: 'debt', bucket: 'goals', line, amount: t.amountCents };
  }
  return null;
}

// ---------- views ----------

export interface LineSummary {
  line: PlanLine;
  planned: Cents;
  actual: Cents;
  reserved: Cents;
  settled: boolean;
  /** Earmarked for this line by transfers (e.g. moved to Bills Checking). */
  funded: Cents;
  /** Paycheck that owns this line in a paycheck view (for "record payment"). */
  paycheckId: string | null;
}

export interface BucketSummary {
  bucket: Bucket;
  /** Basis points; null when the view mixes paychecks with different splits. */
  percent: number | null;
  target: Cents;
  /** Investing money moved to debt payoff (out of Investing, into Goals). */
  redirectOut: Cents;
  redirectIn: Cents;
  planned: Cents;
  spent: Cents;
  contributed: Cents;
  debtPaid: Cents;
  reserved: Cents;
  /** Target ± redirect − spent − contributed − debt paid − reserved. */
  remaining: Cents;
  /** Spending in this bucket not tied to a budget line. */
  unplannedSpent: Cents;
  lines: LineSummary[];
}

export interface BudgetView {
  kind: 'paycheck' | 'month';
  key: string;
  label: string;
  range: DateRange;
  paychecks: Paycheck[];
  debtMode: boolean;
  redirect: Cents;
  buckets: BucketMap<BucketSummary>;
  totals: {
    income: Cents;
    overtime: Cents;
    allocated: Cents;
    spent: Cents;
    contributed: Cents;
    debtPaid: Cents;
    reserved: Cents;
    remaining: Cents;
  };
}

function lineActuals(data: AppData, range: DateRange): Map<string, Cents> {
  const out = new Map<string, Cents>();
  for (const t of data.transactions) {
    if (t.deletedAt || !inRange(t.date, range)) continue;
    const r = resolveTxn(data, t);
    if (r?.line) out.set(r.line.id, (out.get(r.line.id) ?? 0) + r.amount);
  }
  return out;
}

function fundedByLine(data: AppData, range: DateRange): Map<string, Cents> {
  const out = new Map<string, Cents>();
  for (const t of data.transactions) {
    if (t.deletedAt || t.kind !== 'transfer' || !t.transfer || !inRange(t.date, range)) continue;
    for (const a of t.transfer.allocations) if (a.planLineId) out.set(a.planLineId, (out.get(a.planLineId) ?? 0) + a.amountCents);
  }
  return out;
}

/** Reserved amount per bill line for one paycheck, against its own period's payments. */
export function paycheckReservations(data: AppData, p: Paycheck): Map<string, { reserved: Cents; settled: boolean; actual: Cents }> {
  const actuals = lineActuals(data, paycheckPeriod(p));
  const out = new Map<string, { reserved: Cents; settled: boolean; actual: Cents }>();
  for (const l of p.plan.lines) {
    if (l.type !== 'bill') continue;
    const actual = actuals.get(l.id) ?? 0;
    // "Paid in full" only counts while a payment exists; deleting the payment re-reserves the bill.
    const settled = p.plan.settledLineIds.includes(l.id) && actual > 0;
    out.set(l.id, { reserved: settled ? 0 : Math.max(0, l.amountCents - actual), settled, actual });
  }
  return out;
}

function buildView(data: AppData, kind: BudgetView['kind'], key: string, label: string, range: DateRange, paychecks: Paycheck[]): BudgetView {
  const targets = zeroMap();
  let redirect = 0;
  const percentSets = new Set(paychecks.map((p) => JSON.stringify(p.plan.percents)));
  for (const p of paychecks) {
    const t = targetsFor(p);
    for (const b of BUCKETS) targets[b] += t[b];
    redirect += redirectAmount(p.plan, t);
  }

  // Planned lines: from the view's paychecks; with none, the current template (planned only, no targets).
  const lineMap = new Map<string, LineSummary>();
  const sources = paychecks.length ? paychecks : [];
  for (const p of sources) {
    const reservations = paycheckReservations(data, p);
    for (const l of p.plan.lines) {
      const s = lineMap.get(l.id) ?? { line: l, planned: 0, actual: 0, reserved: 0, settled: true, funded: 0, paycheckId: paychecks.length === 1 ? p.id : null };
      s.line = l; // latest wins (paychecks are given in date order)
      s.planned += l.amountCents;
      const r = reservations.get(l.id);
      if (r) {
        s.reserved += r.reserved;
        s.settled = s.settled && r.settled;
      } else s.settled = false;
      lineMap.set(l.id, s);
    }
  }

  const b: BucketMap<BucketSummary> = {} as BucketMap<BucketSummary>;
  for (const bucket of BUCKETS) {
    b[bucket] = {
      bucket,
      percent: percentSets.size === 1 ? paychecks[0].plan.percents[bucket] : null,
      target: targets[bucket],
      redirectOut: bucket === 'investing' ? redirect : 0,
      redirectIn: bucket === 'goals' ? redirect : 0,
      planned: 0,
      spent: 0,
      contributed: 0,
      debtPaid: 0,
      reserved: 0,
      remaining: 0,
      unplannedSpent: 0,
      lines: [],
    };
  }

  for (const t of data.transactions) {
    if (t.deletedAt || !inRange(t.date, range)) continue;
    const r = resolveTxn(data, t);
    if (!r) continue;
    const s = b[r.bucket];
    if (r.flow === 'spent') s.spent += r.amount;
    else if (r.flow === 'contributed') s.contributed += r.amount;
    else s.debtPaid += r.amount;
    if (r.line) {
      const ls = lineMap.get(r.line.id);
      if (ls && ls.line.bucket === r.bucket) ls.actual += r.amount;
      else if (r.flow === 'spent') s.unplannedSpent += r.amount;
    } else if (r.flow === 'spent') s.unplannedSpent += r.amount;
  }

  const funded = fundedByLine(data, range);
  for (const ls of lineMap.values()) {
    ls.funded = funded.get(ls.line.id) ?? 0;
    if (ls.line.type !== 'bill') ls.settled = false;
    const s = b[ls.line.bucket];
    s.lines.push(ls);
    s.planned += ls.planned;
    s.reserved += ls.reserved;
  }
  for (const bucket of BUCKETS) {
    const s = b[bucket];
    s.remaining = s.target - s.redirectOut + s.redirectIn - s.spent - s.contributed - s.debtPaid - s.reserved;
  }

  const sum = (f: (s: BucketSummary) => Cents) => sumCents(BUCKETS.map((k) => f(b[k])));
  const income = sumCents(paychecks.map((p) => p.amountCents));
  const totals = {
    income,
    overtime: sumCents(paychecks.map((p) => p.overtimeCents)),
    allocated: sum((s) => s.planned),
    spent: sum((s) => s.spent),
    contributed: sum((s) => s.contributed),
    debtPaid: sum((s) => s.debtPaid),
    reserved: sum((s) => s.reserved),
    remaining: 0,
  };
  totals.remaining = income - totals.spent - totals.contributed - totals.debtPaid - totals.reserved;

  return { kind, key, label, range, paychecks, debtMode: paychecks.some((p) => p.plan.debtPayoff.enabled), redirect, buckets: b, totals };
}

export function paycheckView(data: AppData, p: Paycheck): BudgetView {
  const r = paycheckPeriod(p);
  return buildView(data, 'paycheck', `p:${p.id}`, `${formatDay(r.start)} – ${formatDay(r.end)}`, r, [p]);
}

/**
 * Month view: income is the paychecks actually paid in that month (so a
 * three-paycheck month shows three); actuals are entries dated in the month.
 */
export function monthView(data: AppData, key: string): BudgetView {
  const range = { start: `${key}-01`, end: endOfMonth(`${key}-01`) };
  const paychecks = data.paychecks.filter((p) => monthKey(p.date) === key).sort((a, b) => a.date.localeCompare(b.date));
  return buildView(data, 'month', `m:${key}`, formatMonth(key), range, paychecks);
}

/** Bucket actuals for any date range (used for reconciliation). */
export function bucketActuals(data: AppData, range: DateRange): BucketMap<{ spent: Cents; contributed: Cents; debtPaid: Cents }> {
  const out = { needs: { spent: 0, contributed: 0, debtPaid: 0 }, investing: { spent: 0, contributed: 0, debtPaid: 0 }, goals: { spent: 0, contributed: 0, debtPaid: 0 }, fun: { spent: 0, contributed: 0, debtPaid: 0 } };
  for (const t of data.transactions) {
    if (t.deletedAt || !inRange(t.date, range)) continue;
    const r = resolveTxn(data, t);
    if (!r) continue;
    const s = out[r.bucket];
    if (r.flow === 'spent') s.spent += r.amount;
    else if (r.flow === 'contributed') s.contributed += r.amount;
    else s.debtPaid += r.amount;
  }
  return out;
}

/** Used share of a bucket's target (spent + contributed + reserved), integer %. */
export function bucketUsedPercent(s: BucketSummary): number {
  const budget = s.target - s.redirectOut + s.redirectIn;
  if (budget <= 0) return 0;
  return Math.round(((s.spent + s.contributed + s.debtPaid + s.reserved) / budget) * 100);
}

export function monthsWithActivity(data: AppData, today: ISODate): string[] {
  let earliest = today;
  for (const t of data.transactions) if (!t.deletedAt && t.date < earliest) earliest = t.date;
  for (const p of data.paychecks) if (p.date < earliest) earliest = p.date;
  let latest = monthKey(today);
  for (const p of data.paychecks) if (monthKey(p.date) > latest) latest = monthKey(p.date);
  const out: string[] = [];
  for (let k = latest; k >= monthKey(earliest) && out.length < 120; k = addMonths(k, -1)) out.push(k);
  return out;
}

// ---------- notices ----------

export interface BudgetNotice {
  id: string;
  level: 'info' | 'near' | 'over' | 'good';
  text: string;
}

/** Plan-level heads-up: planned lines above a bucket's target. */
export function planOverTargets(plan: PlanSnapshot, amountCents: Cents): Array<{ bucket: Bucket; planned: Cents; target: Cents }> {
  if (percentTotal(plan.percents) !== 10000) return [];
  const targets = allocate(amountCents, plan.percents);
  const planned = plannedByBucket(plan.lines);
  return BUCKETS.filter((b) => planned[b] > targets[b]).map((bucket) => ({ bucket, planned: planned[bucket], target: targets[bucket] }));
}

/**
 * A few calm, factual notices for the current pay period, based only on
 * recorded data. At most `limit`, most important first.
 */
export function budgetNotices(data: AppData, today: ISODate, limit = 4): BudgetNotice[] {
  const cur = currentPaycheck(data, today);
  if (!cur) return [];
  const out: BudgetNotice[] = [];
  const p = cur.paycheck;
  if (cur.stale) {
    out.push({ id: 'stale', level: 'info', text: `Your pay period ended ${formatDay(p.periodEnd)}. Add your next paycheck and its budget is ready right away.` });
  }
  const v = paycheckView(data, p);
  const fun = v.buckets.fun;
  const funBudget = fun.target;
  if (funBudget > 0 && fun.spent > 0) {
    if (fun.spent > funBudget) out.push({ id: 'fun-over', level: 'over', text: `Guilt-Free spending is ${formatCents(fun.spent - funBudget)} past this period's ${formatCents(funBudget)}. Totally fine — it just comes out of something else.` });
    else if (fun.spent === funBudget) out.push({ id: 'fun-full', level: 'over', text: `You've used all of your Guilt-Free budget for this pay period.` });
    else if (fun.spent * 100 >= funBudget * 80) out.push({ id: 'fun-near', level: 'near', text: `You've used ${Math.floor((fun.spent * 100) / funBudget)}% of your Guilt-Free budget — ${formatCents(funBudget - fun.spent)} left.` });
  }
  const needs = v.buckets.needs;
  if (needs.target > 0 && needs.spent + needs.reserved > needs.target) {
    out.push({ id: 'needs-over', level: 'over', text: `Needs spending plus unpaid bills is ${formatCents(needs.spent + needs.reserved - needs.target)} above your Needs budget this period.` });
  }
  for (const ls of [...v.buckets.needs.lines, ...v.buckets.fun.lines]) {
    if (ls.line.type !== 'spending' || ls.planned <= 0 || ls.actual <= 0) continue;
    if (ls.actual > ls.planned) out.push({ id: `line-over-${ls.line.id}`, level: 'near', text: `${ls.line.name} is ${formatCents(ls.actual - ls.planned)} over its planned ${formatCents(ls.planned)}.` });
    else if (ls.actual * 100 >= ls.planned * 80) out.push({ id: `line-near-${ls.line.id}`, level: 'near', text: `You have ${formatCents(ls.planned - ls.actual)} remaining for ${ls.line.name}.` });
  }
  for (const o of planOverTargets(p.plan, p.amountCents)) {
    const pct = formatPercent(p.plan.percents[o.bucket]);
    out.push({ id: `plan-${o.bucket}`, level: 'info', text: `Your planned ${BUCKET_LABELS[o.bucket]} (${formatCents(o.planned)}) exceed your ${pct} target (${formatCents(o.target)}) by ${formatCents(o.planned - o.target)}.` });
  }
  if (!cur.stale && p.periodStart >= addDays(today, -2) && p.periodStart <= today) {
    out.push({ id: 'ready', level: 'good', text: `Your paycheck budget for ${formatDay(p.periodStart)} – ${formatDay(p.periodEnd)} is ready.` });
  }
  const rank = { over: 0, near: 1, info: 2, good: 3 } as const;
  return out.sort((a, b) => rank[a.level] - rank[b.level]).slice(0, limit);
}

// ---------- reviews ----------

export interface CategoryTotal {
  id: string;
  name: string;
  emoji: string;
  spent: Cents;
  count: number;
}

function categoryTotals(data: AppData, range: DateRange, bucket?: Bucket): CategoryTotal[] {
  const map = new Map<string, CategoryTotal>();
  for (const t of data.transactions) {
    if (t.deletedAt || !inRange(t.date, range)) continue;
    const r = resolveTxn(data, t);
    if (!r || r.flow !== 'spent' || (bucket && r.bucket !== bucket)) continue;
    const id = t.categoryId ?? 'other';
    const c = data.categories.find((x) => x.id === id);
    const row = map.get(id) ?? { id, name: c?.name ?? 'Other', emoji: c?.emoji ?? '📦', spent: 0, count: 0 };
    row.spent += r.amount;
    if (t.kind === 'expense') row.count++;
    map.set(id, row);
  }
  return [...map.values()].filter((c) => c.spent !== 0).sort((a, b) => b.spent - a.spent);
}

export interface PeriodReview {
  view: BudgetView;
  byCategory: CategoryTotal[];
  biggest: CategoryTotal | null;
  unused: Array<{ bucket: Bucket; cents: Cents }>;
  overspent: Array<{ label: string; planned: Cents; actual: Cents }>;
  recommendations: string[];
  hasData: boolean;
}

export function reviewFor(data: AppData, view: BudgetView): PeriodReview {
  const byCategory = categoryTotals(data, view.range);
  const overspent: PeriodReview['overspent'] = [];
  for (const b of BUCKETS) {
    const s = view.buckets[b];
    for (const ls of s.lines) if (ls.planned > 0 && ls.actual > ls.planned && ls.line.type !== 'contribution') overspent.push({ label: ls.line.name, planned: ls.planned, actual: ls.actual });
  }
  for (const b of ['needs', 'fun'] as const) {
    const s = view.buckets[b];
    if (s.target > 0 && s.spent > s.target) overspent.push({ label: `${BUCKET_LABELS[b]} (whole bucket)`, planned: s.target, actual: s.spent });
  }
  const unused = BUCKETS.map((bucket) => ({ bucket, cents: view.buckets[bucket].remaining })).filter((u) => u.cents > 0);
  const hasData = view.totals.spent !== 0 || view.totals.contributed > 0 || view.totals.debtPaid > 0;
  return {
    view,
    byCategory,
    biggest: byCategory.find((c) => c.spent > 0) ?? null,
    unused,
    overspent,
    recommendations: recommendations(data, view, byCategory),
    hasData,
  };
}

/** One or two practical, data-backed suggestions. Empty when nothing was recorded. */
export function recommendations(data: AppData, view: BudgetView, byCategory = categoryTotals(data, view.range)): string[] {
  const out: string[] = [];
  const funCats = categoryTotals(data, view.range, 'fun');
  const topFun = funCats[0];
  if (topFun && topFun.spent > 0 && topFun.count >= 2) {
    const avg = Math.round(topFun.spent / topFun.count);
    out.push(`${topFun.name} was your biggest Guilt-Free category: ${formatCents(topFun.spent)} over ${topFun.count} purchases (about ${formatCents(avg)} each). Skipping two next period would keep about ${formatCents(avg * 2)} in your budget.`);
  }

  // Repeat purchases (same description) outside of planned bills.
  const groups = new Map<string, { description: string; count: number; total: Cents }>();
  for (const t of data.transactions) {
    if (t.deletedAt || t.kind !== 'expense' || !inRange(t.date, view.range)) continue;
    const r = resolveTxn(data, t);
    if (!r || r.line?.type === 'bill') continue;
    const k = normalizeDescription(t.description);
    const g = groups.get(k) ?? { description: t.description, count: 0, total: 0 };
    g.count++;
    g.total += t.amountCents;
    groups.set(k, g);
  }
  const freq = [...groups.values()].filter((g) => g.count >= 3).sort((a, b) => b.total - a.total)[0];
  if (freq && !(topFun && normalizeDescription(freq.description) === normalizeDescription(topFun.name))) {
    out.push(`${freq.description} came up ${freq.count} times (${formatCents(freq.total)}). Cutting one of those saves about ${formatCents(Math.round(freq.total / freq.count))} each time.`);
  }

  for (const b of BUCKETS) {
    for (const ls of view.buckets[b].lines) {
      if (ls.line.type === 'spending' && ls.planned > 0 && ls.actual > ls.planned) {
        out.push(`${ls.line.name} ran ${formatCents(ls.actual - ls.planned)} over its ${formatCents(ls.planned)} plan. If that's normal now, raising the line keeps your plan honest; if not, it's the first place to look.`);
      }
    }
  }

  const fun = view.buckets.fun;
  if (fun.target > 0 && fun.spent > fun.target && !out.length) {
    out.push(`Guilt-Free spending ran ${formatCents(fun.spent - fun.target)} over. Your largest category there was ${funCats[0]?.name ?? 'Other'}.`);
  }
  if (!out.length && byCategory[0] && byCategory[0].spent > 0) {
    const top = byCategory[0];
    out.push(`${top.name} was your biggest category at ${formatCents(top.spent)}. Keep logging — suggestions get sharper as patterns show up.`);
  }
  return out.slice(0, 2);
}

// ---------- monthly report ----------

export interface MonthlyReport {
  key: string;
  view: BudgetView;
  previous: BudgetView;
  byCategory: CategoryTotal[];
  daily: Array<{ date: ISODate; spent: Cents }>;
  /** Pay periods overlapping the month, with the in-month part of their actuals. */
  periods: Array<{ paycheck: Paycheck; inMonth: DateRange; spent: Cents; contributed: Cents; debtPaid: Cents }>;
  /** Actuals on days not covered by any pay period. */
  uncovered: { spent: Cents; contributed: Cents; debtPaid: Cents };
  comparison: Array<{ label: string; current: Cents; previous: Cents }>;
}

export function monthlyReport(data: AppData, key: string): MonthlyReport {
  const view = monthView(data, key);
  const previous = monthView(data, addMonths(key, -1));
  const byDay = new Map<ISODate, Cents>();
  for (const t of data.transactions) {
    if (t.deletedAt || !inRange(t.date, view.range)) continue;
    const r = resolveTxn(data, t);
    if (r?.flow === 'spent') byDay.set(t.date, (byDay.get(t.date) ?? 0) + r.amount);
  }

  // Split the month's actuals by the pay period that owns each day.
  const periods: MonthlyReport['periods'] = [];
  const byPaycheck = new Map<string, MonthlyReport['periods'][number]>();
  for (const d of eachDay(view.range)) {
    const p = paycheckFor(data, d);
    if (!p) continue;
    const row = byPaycheck.get(p.id);
    if (row) row.inMonth.end = d;
    else {
      const fresh = { paycheck: p, inMonth: { start: d, end: d }, spent: 0, contributed: 0, debtPaid: 0 };
      byPaycheck.set(p.id, fresh);
      periods.push(fresh);
    }
  }
  const uncovered = { spent: 0, contributed: 0, debtPaid: 0 };
  for (const t of data.transactions) {
    if (t.deletedAt || !inRange(t.date, view.range)) continue;
    const r = resolveTxn(data, t);
    if (!r) continue;
    const owner = paycheckFor(data, t.date);
    const target = owner ? byPaycheck.get(owner.id)! : uncovered;
    if (r.flow === 'spent') target.spent += r.amount;
    else if (r.flow === 'contributed') target.contributed += r.amount;
    else target.debtPaid += r.amount;
  }

  const row = (label: string, f: (v: BudgetView) => Cents) => ({ label, current: f(view), previous: f(previous) });
  return {
    key,
    view,
    previous,
    byCategory: categoryTotals(data, view.range),
    daily: eachDay(view.range).map((date) => ({ date, spent: byDay.get(date) ?? 0 })),
    periods,
    uncovered,
    comparison: [
      row('Income', (v) => v.totals.income),
      row('Total spending', (v) => v.totals.spent),
      row('Needs spending', (v) => v.buckets.needs.spent),
      row('Guilt-Free spending', (v) => v.buckets.fun.spent),
      row('Investing', (v) => v.buckets.investing.contributed),
      row('Savings (goals)', (v) => v.buckets.goals.contributed),
      row('Debt payments', (v) => v.totals.debtPaid),
    ],
  };
}

// ---------- debts ----------

export function debtPaid(data: AppData, debt: Debt, range?: DateRange): Cents {
  return sumCents(
    data.transactions
      .filter((t) => !t.deletedAt && t.kind === 'debt_payment' && t.debtId === debt.id && t.date >= debt.asOf && (!range || inRange(t.date, range)))
      .map((t) => t.amountCents),
  );
}

export function debtRemaining(data: AppData, debt: Debt): Cents {
  return Math.max(0, debt.balanceCents - debtPaid(data, debt));
}

// ---------- suggestions for new entries ----------

export interface BudgetSuggestion {
  bucket: Bucket | null;
  planLineId: string | null;
}

const candidateTypes = (kind: TxnKind): PlanLine['type'][] =>
  kind === 'expense' || kind === 'refund' ? ['bill', 'spending'] : kind === 'savings' || kind === 'debt_payment' ? ['contribution'] : [];

/** Suggest the budget line (by your history, then by name) and bucket for an entry. */
export function suggestBudget(
  data: AppData,
  draft: { kind: TxnKind; description: string; categoryId: string | null; date: ISODate },
): BudgetSuggestion {
  const types = candidateTypes(draft.kind);
  if (!types.length) return { bucket: null, planLineId: null };
  const lines = linesAt(data, draft.date).filter(
    (l) => types.includes(l.type) && (draft.kind === 'debt_payment' ? l.goal === 'debt' : draft.kind === 'savings' ? l.goal !== 'debt' : true),
  );
  const norm = normalizeDescription(draft.description);
  let line: PlanLine | null = null;
  if (norm) {
    const prior = data.transactions
      .filter((t) => !t.deletedAt && t.kind === draft.kind && t.planLineId && normalizeDescription(t.description) === norm)
      .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))[0];
    line = (prior && lines.find((l) => l.id === prior.planLineId)) || null;
    if (!line) {
      const byName = lines.filter((l) => {
        const n = normalizeDescription(l.name);
        return n === norm || n.includes(norm) || (norm.includes(n) && n.length >= 3);
      });
      if (byName.length === 1) line = byName[0];
      else if (byName.length > 1) line = byName.find((l) => normalizeDescription(l.name) === norm) ?? null;
    }
  }
  if (!line && draft.kind === 'debt_payment') line = lines[0] ?? null;
  if (!line && (draft.kind === 'expense' || draft.kind === 'refund') && draft.categoryId) {
    line = lines.find((l) => l.type === 'spending' && l.categoryId === draft.categoryId) ?? null;
  }

  let bucket: Bucket | null;
  if (draft.kind === 'debt_payment') bucket = 'goals';
  else if (draft.kind === 'savings') bucket = line?.bucket ?? (/\b(invest|investing|investment|roth|ira|401k|brokerage|stocks?|etf|index fund|fidelity|vanguard|schwab|robinhood)\b/.test(norm) ? 'investing' : 'goals');
  else bucket = line?.bucket ?? categoryBucket(data, draft.categoryId);
  return { bucket, planLineId: line?.id ?? null };
}

/** All plan lines a new entry on `date` could be linked to. */
export function linesForDate(data: AppData, date: ISODate): PlanLine[] {
  return linesAt(data, date);
}
