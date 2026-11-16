/**
 * Payroll recurrence. Pure functions — no I/O.
 *
 * Three different dates are kept apart everywhere:
 *   1. officialDate        — the scheduled payday (from the biweekly anchor)
 *   2. expectedDepositDate — an ESTIMATE of when the bank shows it (e.g. one day early)
 *   3. actualDepositDate   — what the user confirms (lives on IncomeDeposit, not here)
 */
import { type LocalDate, addDays, diffDays, formatLocalDate, monthKey, weekday } from "./dates";
import { bankHolidayOn, isBusinessDay, stateHolidayOn } from "./holidays";

export type PayKind = "REGULAR" | "OVERTIME";

export interface ScheduleConfig {
  kind: PayKind;
  anchorOfficialDate: LocalDate;
  intervalDays: number;
  earlyDepositOffsetDays: number; // REGULAR: -1 (Thursday), OVERTIME: 0
}

export interface ProjectedPayday {
  kind: PayKind;
  officialDate: LocalDate;
  expectedDepositDate: LocalDate;
  holidayNote: string | null;
}

/** Every official payday in [from, to] (inclusive), stepping from the anchor in both directions. */
export function officialPaydays(cfg: Pick<ScheduleConfig, "anchorOfficialDate" | "intervalDays">, from: LocalDate, to: LocalDate): LocalDate[] {
  if (cfg.intervalDays < 1) throw new Error("intervalDays must be ≥ 1");
  const k0 = Math.ceil(diffDays(from, cfg.anchorOfficialDate) / cfg.intervalDays);
  const out: LocalDate[] = [];
  for (let k = k0; ; k++) {
    const d = addDays(cfg.anchorOfficialDate, k * cfg.intervalDays);
    if (d > to) break;
    if (d >= from) out.push(d);
  }
  return out;
}

/**
 * Estimated deposit date: official date + offset, moved back to the previous business day
 * if it lands on a weekend or bank holiday. Always an estimate — never a guarantee.
 */
export function estimateDeposit(official: LocalDate, offsetDays: number): { date: LocalDate; moved: boolean } {
  let d = addDays(official, offsetDays);
  let moved = false;
  for (let i = 0; i < 7 && !isBusinessDay(d); i++) {
    d = addDays(d, -1);
    moved = true;
  }
  return { date: d, moved };
}

export function holidayNoteFor(official: LocalDate, expected: LocalDate, moved: boolean): string | null {
  const notes: string[] = [];
  const state = stateHolidayOn(official);
  if (state) notes.push(`Official payday is a State of Florida holiday (${state})`);
  const bankOfficial = bankHolidayOn(official);
  if (bankOfficial && bankOfficial !== state) notes.push(`Bank holiday on payday (${bankOfficial})`);
  const early = addDays(official, -1);
  const bankEarly = bankHolidayOn(early);
  const stateEarly = stateHolidayOn(early);
  if (bankEarly || stateEarly) notes.push(`Day before payday is a holiday (${bankEarly ?? stateEarly})`);
  if (moved) notes.push(`Estimated deposit moved to ${formatLocalDate(expected, "weekday")} (previous business day)`);
  return notes.length ? `${notes.join(". ")}. Timing may differ.` : null;
}

export function projectPaydays(cfg: ScheduleConfig, from: LocalDate, to: LocalDate): ProjectedPayday[] {
  return officialPaydays(cfg, from, to).map((officialDate) => {
    const { date, moved } = estimateDeposit(officialDate, cfg.earlyDepositOffsetDays);
    return { kind: cfg.kind, officialDate, expectedDepositDate: date, holidayNote: holidayNoteFor(officialDate, date, moved) };
  });
}

export interface MonthCount {
  month: string; // YYYY-MM
  officialDates: LocalDate[];
}

/** Months containing ≥ 3 REGULAR official paydays — the "extra paycheck" months. */
export function extraPaycheckMonths(regularOfficialDates: LocalDate[]): MonthCount[] {
  const byMonth = new Map<string, LocalDate[]>();
  for (const d of [...regularOfficialDates].sort()) {
    const k = monthKey(d);
    byMonth.set(k, [...(byMonth.get(k) ?? []), d]);
  }
  return [...byMonth.entries()]
    .filter(([, ds]) => ds.length >= 3)
    .map(([month, officialDates]) => ({ month, officialDates }));
}

export function paydaysPerMonth(dates: LocalDate[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const d of dates) m.set(monthKey(d), (m.get(monthKey(d)) ?? 0) + 1);
  return m;
}

/** Validates that a chosen anchor is a Friday — warns, but the user may override. */
export function anchorWarning(anchor: LocalDate): string | null {
  return weekday(anchor) === 5 ? null : "This anchor is not a Friday. DOC paydays are normally Fridays — double-check it.";
}

/** Whether a stored payday still lines up with the current schedule. */
export function isOnSchedule(cfg: Pick<ScheduleConfig, "anchorOfficialDate" | "intervalDays">, official: LocalDate): boolean {
  return ((diffDays(official, cfg.anchorOfficialDate) % cfg.intervalDays) + cfg.intervalDays) % cfg.intervalDays === 0;
}
