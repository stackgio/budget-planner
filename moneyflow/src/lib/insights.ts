/**
 * "Spend smarter" insights. Every idea is computed from the user's own recorded
 * transactions — no generic advice. Savings estimates state their assumption.
 */
import { addDays, diffDays, formatDate, monthEnd, monthOf, monthStart, type ISODate } from "./dates";
import { formatCents, type Cents } from "./money";
import { normalizeMerchant } from "./csv";

export type Necessity = "need" | "want";

export interface InsightTx {
  id: string;
  date: ISODate;
  merchant: string;
  amountCents: Cents; // signed (expenses negative)
  type: string;
  categoryId: string | null;
  necessity: string | null;
  splits?: Array<{ categoryId: string | null; amountCents: Cents }>;
}

export interface InsightCategory {
  id: string;
  name: string;
  bucket: string;
  budgetCents: Cents | null;
  fixed?: boolean; // tied to a recurring bill
}

/** Explicit tag wins; otherwise infer from the category bucket (Needs → need, Guilt-free → want). */
export function effectiveNecessity(tx: InsightTx, cats: Map<string, InsightCategory>): { value: Necessity | null; tagged: boolean } {
  if (tx.necessity === "need" || tx.necessity === "want") return { value: tx.necessity, tagged: true };
  const c = tx.categoryId ? cats.get(tx.categoryId) : undefined;
  if (c?.bucket === "needs") return { value: "need", tagged: false };
  if (c?.bucket === "guiltfree") return { value: "want", tagged: false };
  return { value: null, tagged: false };
}

/** Net spending of a transaction (expenses positive, refunds negative, others 0). */
const spent = (t: InsightTx) => (t.type === "expense" || t.type === "refund" ? -t.amountCents : 0);

export interface NeedsWants {
  need: Cents;
  want: Cents;
  unclassified: Cents;
  taggedShare: number; // 0..1 of classified spending that was explicitly tagged
}

export function needsVsWants(txs: InsightTx[], cats: InsightCategory[], from: ISODate, to: ISODate): NeedsWants {
  const map = new Map(cats.map((c) => [c.id, c]));
  let need = 0, want = 0, unclassified = 0, tagged = 0, classified = 0;
  for (const t of txs) {
    if (t.date < from || t.date > to) continue;
    const s = spent(t);
    if (s === 0) continue;
    const n = effectiveNecessity(t, map);
    if (n.value === "need") need += s;
    else if (n.value === "want") want += s;
    else unclassified += s;
    if (n.value) {
      classified += Math.abs(s);
      if (n.tagged) tagged += Math.abs(s);
    }
  }
  return { need, want, unclassified, taggedShare: classified ? tagged / classified : 0 };
}

export interface Insight {
  id: string;
  kind: "frequent" | "above_usual" | "over_budget" | "subscription" | "wants_over";
  title: string;
  detail: string;
  monthlySavingsCents: Cents | null;
  href: string;
}

export interface InsightInput {
  today: ISODate;
  txs: InsightTx[];
  categories: InsightCategory[];
  guiltFreeMonthlyCents: Cents | null; // the user's guilt-free allocation for a normal month
}

function categorySpend(txs: InsightTx[], from: ISODate, to: ISODate): Map<string | null, Cents> {
  const m = new Map<string | null, Cents>();
  for (const t of txs) {
    if (t.date < from || t.date > to) continue;
    if (t.type !== "expense" && t.type !== "refund") continue;
    const lines = t.splits && t.splits.length ? t.splits : [{ categoryId: t.categoryId, amountCents: t.amountCents }];
    for (const l of lines) m.set(l.categoryId, (m.get(l.categoryId) ?? 0) - l.amountCents);
  }
  return m;
}

export function spendSmarterInsights(input: InsightInput): Insight[] {
  const { today, txs, categories } = input;
  const cats = new Map(categories.map((c) => [c.id, c]));
  const out: Insight[] = [];
  const last30From = addDays(today, -29);

  // 1. Frequent small purchases at one merchant (last 30 days)
  const byMerchant = new Map<string, { name: string; count: number; total: Cents; categoryId: string | null }>();
  for (const t of txs) {
    if (t.type !== "expense" || t.date < last30From || t.date > today) continue;
    if (t.categoryId && cats.get(t.categoryId)?.fixed) continue;
    const key = normalizeMerchant(t.merchant);
    if (!key) continue;
    const cur = byMerchant.get(key) ?? { name: t.merchant, count: 0, total: 0, categoryId: t.categoryId };
    cur.count += 1;
    cur.total += -t.amountCents;
    byMerchant.set(key, cur);
  }
  for (const [key, m] of byMerchant) {
    const avg = m.total / m.count;
    if (m.count >= 4 && avg <= 30_00) {
      const save = Math.round(m.total / 2);
      out.push({
        id: `frequent-${key}`,
        kind: "frequent",
        title: `${m.count} purchases at ${m.name} in 30 days`,
        detail: `${formatCents(m.total)} total, about ${formatCents(Math.round(avg))} each. Cutting the number of visits in half would free about ${formatCents(save)} a month.`,
        monthlySavingsCents: save,
        href: `/transactions?q=${encodeURIComponent(m.name)}`,
      });
    }
  }

  // 2. Flexible categories running above your usual (last 30 days vs the 3 windows before)
  const windows = [0, 1, 2, 3].map((k) => categorySpend(txs, addDays(today, -29 - 30 * k), addDays(today, -30 * k)));
  for (const c of categories) {
    if (c.fixed || c.bucket === "income" || c.bucket === "transfer") continue;
    const now = windows[0].get(c.id) ?? 0;
    const prior = windows.slice(1).map((w) => w.get(c.id) ?? 0).filter((v) => v > 0);
    if (prior.length < 2 || now <= 0) continue;
    const usual = Math.round(prior.reduce((a, b) => a + b, 0) / prior.length);
    const diff = now - usual;
    if (usual > 0 && diff >= 20_00 && now >= usual * 1.25) {
      out.push({
        id: `above-${c.id}`,
        kind: "above_usual",
        title: `${c.name} is up ${Math.round((now / usual - 1) * 100)}% vs your usual`,
        detail: `${formatCents(now)} in the last 30 days vs about ${formatCents(usual)} in a typical month. Getting back to normal saves about ${formatCents(diff)}.`,
        monthlySavingsCents: diff,
        href: `/transactions?category=${c.id}`,
      });
    }
  }

  // 3. Over budget this calendar month
  const month = monthOf(today);
  const mSpend = categorySpend(txs, monthStart(month), monthEnd(month));
  for (const c of categories) {
    if (c.budgetCents === null || c.budgetCents <= 0) continue;
    const s = mSpend.get(c.id) ?? 0;
    if (s > c.budgetCents) {
      out.push({
        id: `over-${c.id}`,
        kind: "over_budget",
        title: `${c.name} is ${formatCents(s - c.budgetCents)} over budget`,
        detail: `${formatCents(s)} spent of ${formatCents(c.budgetCents)} this month.`,
        monthlySavingsCents: s - c.budgetCents,
        href: `/budget?month=${month}`,
      });
    }
  }

  // 4. Repeating "want" charges (subscriptions): same merchant, similar amount, in 2+ of the last 3 months
  const months = [0, 1, 2].map((k) => {
    const d = new Date(Date.UTC(+month.slice(0, 4), +month.slice(5, 7) - 1 - k, 1));
    return d.toISOString().slice(0, 7);
  });
  const recurring = new Map<string, { name: string; months: Set<string>; amounts: Cents[] }>();
  for (const t of txs) {
    if (t.type !== "expense" || !months.includes(monthOf(t.date))) continue;
    if (effectiveNecessity(t, cats).value !== "want") continue;
    const key = normalizeMerchant(t.merchant);
    const r = recurring.get(key) ?? { name: t.merchant, months: new Set(), amounts: [] };
    r.months.add(monthOf(t.date));
    r.amounts.push(-t.amountCents);
    recurring.set(key, r);
  }
  for (const [key, r] of recurring) {
    if (r.months.size < 2 || r.amounts.length > r.months.size + 1) continue; // monthly-ish only
    const min = Math.min(...r.amounts), max = Math.max(...r.amounts);
    if (max > min * 1.1) continue; // amounts should be similar
    const avg = Math.round(r.amounts.reduce((a, b) => a + b, 0) / r.amounts.length);
    out.push({
      id: `sub-${key}`,
      kind: "subscription",
      title: `Review ${r.name} (~${formatCents(avg)}/mo)`,
      detail: `Charged in ${r.months.size} of the last 3 months. If you don't use it much, cancelling saves ${formatCents(avg)} a month.`,
      monthlySavingsCents: avg,
      href: `/transactions?q=${encodeURIComponent(r.name)}`,
    });
  }

  // 5. Wants above the guilt-free share this month
  if (input.guiltFreeMonthlyCents !== null && input.guiltFreeMonthlyCents > 0) {
    const nw = needsVsWants(txs, categories, monthStart(month), today);
    if (nw.want > input.guiltFreeMonthlyCents) {
      const over = nw.want - input.guiltFreeMonthlyCents;
      out.push({
        id: "wants-over",
        kind: "wants_over",
        title: `Wants are ${formatCents(over)} over your guilt-free share`,
        detail: `${formatCents(nw.want)} on wants so far this month vs a ${formatCents(input.guiltFreeMonthlyCents)} guilt-free plan.${nw.taggedShare < 0.5 ? " Many purchases aren't tagged need/want yet, so this uses their categories." : ""}`,
        monthlySavingsCents: over,
        href: "/insights",
      });
    }
  }

  // Dedupe (over-budget and above-usual can describe the same category): keep the larger saving.
  const best = new Map<string, Insight>();
  for (const i of out) {
    const key = i.id.replace(/^(over|above)-/, "cat-");
    const cur = best.get(key);
    if (!cur || (i.monthlySavingsCents ?? 0) > (cur.monthlySavingsCents ?? 0)) best.set(key, i);
  }
  return [...best.values()].sort((a, b) => (b.monthlySavingsCents ?? 0) - (a.monthlySavingsCents ?? 0) || a.id.localeCompare(b.id));
}

/** The single idea to feature this week: the largest estimated saving. */
export function weeklyTip(insights: Insight[]): Insight | null {
  return insights[0] ?? null;
}

export interface GuiltFreePace {
  allowanceCents: Cents; // guilt-free share of the current paycheck
  wantSpentCents: Cents; // want spending since the last payday
  leftCents: Cents;
  daysLeft: number; // including today, until the day before next payday
  perDayCents: Cents | null;
}

/** How much guilt-free money is left this pay period and what that means per day. */
export function guiltFreePace(params: {
  today: ISODate;
  lastPayday: ISODate;
  nextPayday: ISODate;
  allowanceCents: Cents;
  txs: InsightTx[];
  categories: InsightCategory[];
}): GuiltFreePace {
  const nw = needsVsWants(params.txs, params.categories, params.lastPayday, params.today);
  const left = params.allowanceCents - nw.want;
  const daysLeft = Math.max(1, diffDays(params.nextPayday, params.today));
  return {
    allowanceCents: params.allowanceCents,
    wantSpentCents: nw.want,
    leftCents: left,
    daysLeft,
    perDayCents: left > 0 ? Math.floor(left / daysLeft) : 0,
  };
}

export function largestPurchases(txs: InsightTx[], from: ISODate, to: ISODate, n = 5): InsightTx[] {
  return txs
    .filter((t) => t.type === "expense" && t.date >= from && t.date <= to)
    .sort((a, b) => a.amountCents - b.amountCents)
    .slice(0, n);
}

export const describeRange = (from: ISODate, to: ISODate) => `${formatDate(from)} – ${formatDate(to)}`;
