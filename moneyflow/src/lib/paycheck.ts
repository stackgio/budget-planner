import { addDays, diffDays, monthOf, type ISODate, type YearMonth, monthStart, monthEnd } from "./dates";
import { allocateByBps, type Cents } from "./money";

export const BUCKETS = ["needs", "investing", "goals", "guiltfree"] as const;
export type BucketKey = (typeof BUCKETS)[number];

export const BUCKET_LABELS: Record<BucketKey, string> = {
  needs: "Needs",
  investing: "Investing",
  goals: "Financial Goals",
  guiltfree: "Guilt-Free Spending",
};

export const DEFAULT_RULES: Array<{ key: BucketKey; label: string; percentBps: number }> = [
  { key: "needs", label: "Needs", percentBps: 5500 },
  { key: "investing", label: "Investing", percentBps: 2000 },
  { key: "goals", label: "Financial Goals", percentBps: 1500 },
  { key: "guiltfree", label: "Guilt-Free Spending", percentBps: 1000 },
];

export interface AllocationRuleLike {
  key: string;
  label: string;
  percentBps: number;
}

export type Allocation = Array<{ key: string; label: string; percentBps: number; amountCents: Cents }>;

export function validateRules(rules: AllocationRuleLike[]): string | null {
  for (const r of rules) {
    if (!Number.isInteger(r.percentBps) || r.percentBps < 0 || r.percentBps > 10_000) return `${r.label}: percentage must be between 0 and 100`;
  }
  const total = rules.reduce((a, r) => a + r.percentBps, 0);
  if (total !== 10_000) return `Percentages must add up to 100% (currently ${(total / 100).toFixed(2)}%)`;
  return null;
}

/**
 * Split an amount of income across the allocation rules. Parts always sum to the
 * input exactly. If investing is paused the investing share is shown as 0 and the
 * paused amount is returned separately as `pausedCents` — it is NOT silently moved
 * into another bucket; the user decides where it goes.
 */
export function allocate(
  amountCents: Cents,
  rules: AllocationRuleLike[],
  opts: { investingPaused?: boolean } = {},
): { parts: Allocation; pausedCents: Cents } {
  const amounts = allocateByBps(amountCents, rules.map((r) => r.percentBps));
  let pausedCents = 0;
  const parts = rules.map((r, i) => {
    let amt = amounts[i];
    if (opts.investingPaused && r.key === "investing") {
      pausedCents = amt;
      amt = 0;
    }
    return { key: r.key, label: r.label, percentBps: r.percentBps, amountCents: amt };
  });
  return { parts, pausedCents };
}

export interface IncomeFigures {
  perPaycheck: Cents;
  normalMonth: Cents; // 2 paychecks — the budgeting baseline
  threePaycheckMonth: Cents;
  annual: Cents; // 26 paychecks
  annualizedMonthlyAverage: Cents; // annual / 12 — NOT the budgeting baseline
  paychecksPerYear: number;
}

export function incomeFigures(netPayCents: Cents, intervalDays = 14): IncomeFigures {
  // 14-day pay = 26 paychecks in a standard planning year (occasionally 27 calendar
  // paydays fall in one year; the schedule view shows actual dates).
  const paychecksPerYear = intervalDays === 14 ? 26 : intervalDays === 7 ? 52 : Math.round(364 / intervalDays);
  const annual = netPayCents * paychecksPerYear;
  return {
    perPaycheck: netPayCents,
    normalMonth: netPayCents * 2,
    threePaycheckMonth: netPayCents * 3,
    annual,
    annualizedMonthlyAverage: Math.round(annual / 12),
    paychecksPerYear,
  };
}

/** Generate every payday in [from, to] inclusive from a known anchor payday. Works in both directions. */
export function paydaysBetween(anchor: ISODate, from: ISODate, to: ISODate, intervalDays = 14): ISODate[] {
  if (intervalDays <= 0) throw new Error("intervalDays must be positive");
  const offset = diffDays(from, anchor);
  const k = Math.ceil(offset / intervalDays);
  const out: ISODate[] = [];
  for (let d = addDays(anchor, k * intervalDays); diffDays(d, to) <= 0; d = addDays(d, intervalDays)) out.push(d);
  return out;
}

export function nextPayday(anchor: ISODate, onOrAfter: ISODate, intervalDays = 14): ISODate {
  return paydaysBetween(anchor, onOrAfter, addDays(onOrAfter, intervalDays), intervalDays)[0];
}

export function previousPayday(anchor: ISODate, before: ISODate, intervalDays = 14): ISODate {
  const list = paydaysBetween(anchor, addDays(before, -intervalDays), addDays(before, -1), intervalDays);
  return list[list.length - 1];
}

export function paydaysInMonth(anchor: ISODate, ym: YearMonth, intervalDays = 14): ISODate[] {
  return paydaysBetween(anchor, monthStart(ym), monthEnd(ym), intervalDays);
}

/** Months (YYYY-MM) in the given year with three paydays. */
export function threePaycheckMonths(anchor: ISODate, year: number, intervalDays = 14): Array<{ month: YearMonth; paydays: ISODate[] }> {
  const days = paydaysBetween(anchor, `${year}-01-01`, `${year}-12-31`, intervalDays);
  const byMonth = new Map<YearMonth, ISODate[]>();
  for (const d of days) {
    const m = monthOf(d);
    byMonth.set(m, [...(byMonth.get(m) ?? []), d]);
  }
  return [...byMonth.entries()].filter(([, v]) => v.length >= 3).map(([month, paydays]) => ({ month, paydays }));
}

export interface PaycheckRecordLike {
  payDate: ISODate;
  kind: string;
  expectedCents: Cents;
  actualCents: Cents | null;
}

export interface PaydayIncome {
  payDate: ISODate;
  expectedCents: Cents; // regular + any recorded extra income expected that day
  actualCents: Cents | null; // null = nothing recorded as received
  isForecast: boolean; // true when no actual amount recorded
  extras: PaycheckRecordLike[]; // overtime / bonus / irregular entries
  monthIndex: number; // 1st, 2nd, 3rd payday of its month
  isThirdPaycheck: boolean;
}

/**
 * Merge generated paydays with persisted paycheck records (actuals, overrides,
 * overtime, bonuses). Extra income on non-payday dates is included as its own row.
 */
export function buildPaydayIncome(
  anchor: ISODate,
  from: ISODate,
  to: ISODate,
  netPayCents: Cents,
  records: PaycheckRecordLike[],
  intervalDays = 14,
): PaydayIncome[] {
  const days = paydaysBetween(anchor, from, to, intervalDays);
  const relevant = records.filter((r) => r.payDate >= from && r.payDate <= to);
  const dates = new Set<ISODate>(days);
  for (const r of relevant) dates.add(r.payDate);
  const sorted = [...dates].sort();
  const regularSet = new Set(days);
  // Count paydays per month using the full months spanned so monthIndex is correct.
  const out: PaydayIncome[] = [];
  for (const d of sorted) {
    const regular = relevant.find((r) => r.payDate === d && r.kind === "regular");
    const extras = relevant.filter((r) => r.payDate === d && r.kind !== "regular");
    const isRegularDay = regularSet.has(d);
    const regularExpected = isRegularDay ? (regular?.expectedCents ?? netPayCents) : (regular?.expectedCents ?? 0);
    const expectedCents = regularExpected + extras.reduce((a, e) => a + e.expectedCents, 0);
    const recordedActuals = [regular, ...extras].filter((r): r is PaycheckRecordLike => !!r && r.actualCents !== null);
    const actualCents = recordedActuals.length ? recordedActuals.reduce((a, r) => a + (r.actualCents ?? 0), 0) : null;
    const monthDays = isRegularDay ? paydaysInMonth(anchor, monthOf(d), intervalDays) : [];
    const monthIndex = isRegularDay ? monthDays.indexOf(d) + 1 : 0;
    out.push({
      payDate: d,
      expectedCents,
      actualCents,
      isForecast: actualCents === null,
      extras,
      monthIndex,
      isThirdPaycheck: monthIndex === 3,
    });
  }
  return out;
}
