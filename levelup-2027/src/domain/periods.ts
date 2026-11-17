/** Reporting periods in the user's local calendar. Weeks run Saturday–Friday (LEVEL UP's week). Pure. */
import { type LocalDate, MONTHS, addDays, daysInMonth, diffDays, formatLocalDate, isLocalDate, makeLocalDate, parseLocalDate, startOfWeek } from "./dates";

export type PeriodKind = "week" | "month" | "quarter" | "year" | "custom";
export const PERIOD_KINDS: PeriodKind[] = ["week", "month", "quarter", "year", "custom"];
export const MAX_CUSTOM_DAYS = 366 * 3;

export interface Period { kind: PeriodKind; from: LocalDate; to: LocalDate; label: string; days: number; prev: LocalDate | null; next: LocalDate | null }

export function periodFor(kind: PeriodKind, anchor: LocalDate, custom?: { from?: string | null; to?: string | null }): Period {
  const { y, m } = parseLocalDate(anchor);
  let from: LocalDate, to: LocalDate, label: string, prev: LocalDate | null, next: LocalDate | null;
  switch (kind) {
    case "week": {
      from = startOfWeek(anchor, 6);
      to = addDays(from, 6);
      label = `Week of ${formatLocalDate(from)} – ${formatLocalDate(to)}`;
      prev = addDays(from, -7); next = addDays(from, 7);
      break;
    }
    case "month": {
      from = makeLocalDate(y, m, 1); to = makeLocalDate(y, m, daysInMonth(y, m));
      label = `${MONTHS[m - 1]} ${y}`;
      prev = m === 1 ? makeLocalDate(y - 1, 12, 1) : makeLocalDate(y, m - 1, 1);
      next = m === 12 ? makeLocalDate(y + 1, 1, 1) : makeLocalDate(y, m + 1, 1);
      break;
    }
    case "quarter": {
      const q = Math.floor((m - 1) / 3);
      from = makeLocalDate(y, q * 3 + 1, 1);
      to = makeLocalDate(y, q * 3 + 3, daysInMonth(y, q * 3 + 3));
      label = `Q${q + 1} ${y}`;
      prev = q === 0 ? makeLocalDate(y - 1, 10, 1) : makeLocalDate(y, q * 3 - 2, 1);
      next = q === 3 ? makeLocalDate(y + 1, 1, 1) : makeLocalDate(y, q * 3 + 4, 1);
      break;
    }
    case "year": {
      from = makeLocalDate(y, 1, 1); to = makeLocalDate(y, 12, 31);
      label = String(y);
      prev = makeLocalDate(y - 1, 1, 1); next = makeLocalDate(y + 1, 1, 1);
      break;
    }
    case "custom": {
      const f = custom?.from && isLocalDate(custom.from) ? custom.from : makeLocalDate(y, m, 1);
      let t = custom?.to && isLocalDate(custom.to) ? custom.to : anchor;
      if (t < f) t = f;
      if (diffDays(t, f) >= MAX_CUSTOM_DAYS) t = addDays(f, MAX_CUSTOM_DAYS - 1);
      from = f; to = t;
      label = `${formatLocalDate(from)} – ${formatLocalDate(to)}`;
      prev = null; next = null;
      break;
    }
  }
  return { kind, from, to, label, days: diffDays(to, from) + 1, prev, next };
}

export function parsePeriodKind(v: string | null | undefined, fallback: PeriodKind = "month"): PeriodKind {
  return (PERIOD_KINDS as string[]).includes(v ?? "") ? (v as PeriodKind) : fallback;
}

/** Calendar months overlapping a range, as YYYY-MM keys (for monthly trend charts). */
export function monthsIn(from: LocalDate, to: LocalDate): string[] {
  const out: string[] = [];
  let { y, m } = parseLocalDate(from);
  const end = parseLocalDate(to);
  while (y < end.y || (y === end.y && m <= end.m)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

/** Saturday–Friday weeks overlapping a range, as their Saturday start dates. */
export function weeksIn(from: LocalDate, to: LocalDate): LocalDate[] {
  const out: LocalDate[] = [];
  for (let d = startOfWeek(from, 6); d <= to; d = addDays(d, 7)) out.push(d);
  return out;
}

/** Number of days of [from,to] that fall on or before `today` and on or after `since` — the honest denominator for daily rates. */
export function elapsedDays(from: LocalDate, to: LocalDate, today: LocalDate, since?: LocalDate): number {
  const start = since && since > from ? since : from;
  const end = today < to ? today : to;
  return end < start ? 0 : diffDays(end, start) + 1;
}
