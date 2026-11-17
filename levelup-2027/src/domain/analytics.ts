/**
 * Analytics math. Pure. Everything here is computed from records the user confirmed or logged;
 * nothing is projected unless labelled, and nothing is invented to fill empty periods.
 */
import { type LocalDate, addDays, monthKey } from "./dates";

export type IncomeKind = "REGULAR" | "OVERTIME" | "GIG" | "OTHER";
export interface DepositRow { kind: IncomeKind; date: LocalDate; netCents: number }

export interface IncomeBreakdown { regularCents: number; overtimeCents: number; gigCents: number; otherCents: number; totalCents: number }

/** Confirmed income by kind. Transfers/allocations are not income and never enter here. */
export function incomeBreakdown(deposits: DepositRow[], from: LocalDate, to: LocalDate): IncomeBreakdown {
  const r: IncomeBreakdown = { regularCents: 0, overtimeCents: 0, gigCents: 0, otherCents: 0, totalCents: 0 };
  for (const d of deposits) {
    if (d.date < from || d.date > to) continue;
    if (d.kind === "REGULAR") r.regularCents += d.netCents;
    else if (d.kind === "OVERTIME") r.overtimeCents += d.netCents;
    else if (d.kind === "GIG") r.gigCents += d.netCents;
    else r.otherCents += d.netCents;
    r.totalCents += d.netCents;
  }
  return r;
}

export interface MonthIncome extends IncomeBreakdown { month: string }

export function incomeByMonth(deposits: DepositRow[], months: string[]): MonthIncome[] {
  return months.map((m) => {
    const inMonth = deposits.filter((d) => monthKey(d.date) === m);
    return { month: m, ...incomeBreakdown(inMonth, "0000-01-01", "9999-12-31") };
  });
}

/** Count of dated items per Saturday-start week. */
export function countByWeek(dates: LocalDate[], weekStarts: LocalDate[]): { week: LocalDate; count: number }[] {
  return weekStarts.map((w) => ({ week: w, count: dates.filter((d) => d >= w && d <= addDays(w, 6)).length }));
}

/**
 * Habit activity against the habit's own weekly target, over the days that have actually elapsed.
 * Not a streak and not a score: "8 of about 10 planned check-ins". Null when nothing was expected yet.
 */
export function habitActivity(checkIns: number, targetPerWeek: number, elapsedDays: number) {
  const expected = Math.round((targetPerWeek * elapsedDays) / 7);
  return { done: checkIns, expected, pct: expected > 0 ? Math.min(100, Math.round((checkIns * 100) / expected)) : null };
}

/** Completion share with an honest denominator; null when there is nothing to complete. */
export function share(done: number, total: number): number | null {
  return total > 0 ? Math.round((done * 100) / total) : null;
}

/** Net of payments including reversals (negative rows), so a corrected transfer is counted once. */
export function netPayments(rows: { kind: string; amountCents: number }[], kinds: string[]): number {
  return rows.filter((r) => kinds.includes(r.kind)).reduce((a, r) => a + r.amountCents, 0);
}

/** Months for a trend chart: the period's months if it spans ≥ 3, otherwise the 6 months ending at `to`. */
export function trendMonths(periodMonths: string[], to: LocalDate): string[] {
  if (periodMonths.length >= 3) return periodMonths;
  const out: string[] = [];
  let y = Number(to.slice(0, 4)), m = Number(to.slice(5, 7));
  for (let i = 0; i < 6; i++) {
    out.unshift(`${y}-${String(m).padStart(2, "0")}`);
    m--; if (m === 0) { m = 12; y--; }
  }
  return out;
}
