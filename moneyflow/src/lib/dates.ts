/**
 * Date-only helpers. Dates are "YYYY-MM-DD" strings and all arithmetic is done
 * in UTC on day numbers, so daylight-saving changes and server timezones can
 * never shift a payday or due date.
 */

export type ISODate = string; // YYYY-MM-DD
export type YearMonth = string; // YYYY-MM

const DAY_MS = 86_400_000;

export function isISODate(s: unknown): s is ISODate {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  return m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);
}

export function toDayNumber(d: ISODate): number {
  const [y, m, day] = d.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, day) / DAY_MS);
}

export function fromDayNumber(n: number): ISODate {
  return new Date(n * DAY_MS).toISOString().slice(0, 10);
}

export function addDays(d: ISODate, days: number): ISODate {
  return fromDayNumber(toDayNumber(d) + days);
}

export function diffDays(a: ISODate, b: ISODate): number {
  return toDayNumber(a) - toDayNumber(b);
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

export function ymd(year: number, month1: number, day: number): ISODate {
  return `${year}-${String(month1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Day-of-month clamped to the month length (due day 31 → Feb 28/29). */
export function clampedDate(year: number, month1: number, day: number): ISODate {
  return ymd(year, month1, Math.min(day, daysInMonth(year, month1)));
}

export function monthOf(d: ISODate): YearMonth {
  return d.slice(0, 7);
}

export function monthStart(ym: YearMonth): ISODate {
  return `${ym}-01`;
}

export function monthEnd(ym: YearMonth): ISODate {
  const [y, m] = ym.split("-").map(Number);
  return ymd(y, m, daysInMonth(y, m));
}

export function addMonths(ym: YearMonth, n: number): YearMonth {
  const [y, m] = ym.split("-").map(Number);
  const idx = y * 12 + (m - 1) + n;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

export function isYearMonth(s: unknown): s is YearMonth {
  return typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

/** Today's date in the user's locale timezone (server falls back to TZ env). */
export function todayISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return ymd(y, m, d);
}

export function formatDate(d: ISODate | null | undefined, style: "short" | "long" | "weekday" = "short"): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  const opts: Intl.DateTimeFormatOptions =
    style === "long"
      ? { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }
      : style === "weekday"
        ? { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }
        : { month: "short", day: "numeric", timeZone: "UTC" };
  return dt.toLocaleDateString("en-US", opts);
}

export function formatMonth(ym: YearMonth, style: "long" | "short" = "long"): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", {
    month: style === "long" ? "long" : "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
