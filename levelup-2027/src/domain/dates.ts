/**
 * Date utilities. Two representations only:
 *  - LocalDate: "YYYY-MM-DD" string, a calendar day with no timezone (paydays, due dates).
 *  - Instant: a JS Date / epoch ms (event start/end), converted to wall-clock time via an IANA zone.
 * All wall-clock math goes through Intl so DST transitions are handled correctly.
 */

export type LocalDate = string; // YYYY-MM-DD

const DAY_MS = 86_400_000;
export const DEFAULT_TZ = "America/New_York";
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLocalDate(s: string): s is LocalDate {
  const m = LOCAL_DATE_RE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

export function parseLocalDate(s: LocalDate): { y: number; m: number; d: number } {
  const m = LOCAL_DATE_RE.exec(s);
  if (!m) throw new Error(`Invalid date: ${s}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

export function makeLocalDate(y: number, m: number, d: number): LocalDate {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Day number since epoch — exact integer arithmetic on calendar days. */
export function toDayNumber(s: LocalDate): number {
  const { y, m, d } = parseLocalDate(s);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function fromDayNumber(n: number): LocalDate {
  const dt = new Date(n * DAY_MS);
  return makeLocalDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function addDays(s: LocalDate, n: number): LocalDate {
  return fromDayNumber(toDayNumber(s) + n);
}

export function diffDays(a: LocalDate, b: LocalDate): number {
  return toDayNumber(a) - toDayNumber(b);
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(s: LocalDate): number {
  return ((toDayNumber(s) % 7) + 7 + 4) % 7; // 1970-01-01 was a Thursday
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function monthKey(s: LocalDate): string {
  return s.slice(0, 7);
}

/** Prisma returns @db.Date columns as UTC-midnight Dates. */
export function dateToLocal(d: Date): LocalDate {
  return d.toISOString().slice(0, 10);
}

export function localToDbDate(s: LocalDate): Date {
  const { y, m, d } = parseLocalDate(s);
  return new Date(Date.UTC(y, m - 1, d));
}

// ───────────── Time zones ─────────────

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string): Intl.DateTimeFormat {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

export interface ZonedParts {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
  ss: number;
}

export function zonedParts(instant: Date | number, tz: string = DEFAULT_TZ): ZonedParts {
  const ms = typeof instant === "number" ? instant : instant.getTime();
  const parts = formatter(tz).formatToParts(new Date(ms));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour") % 24, mm: get("minute"), ss: get("second") };
}

function offsetMs(utcMs: number, tz: string): number {
  const p = zonedParts(utcMs, tz);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, p.ss);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** Convert a wall-clock time in `tz` to an instant. Nonexistent (spring-forward) times roll forward. */
export function zonedToInstant(date: LocalDate, time: string, tz: string = DEFAULT_TZ): Date {
  const { y, m, d } = parseLocalDate(date);
  const [hh, mm] = parseTime(time);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const off1 = offsetMs(guess, tz);
  let t = guess - off1;
  const off2 = offsetMs(t, tz);
  if (off2 !== off1) t = guess - off2;
  return new Date(t);
}

export function instantToLocalDate(instant: Date | number, tz: string = DEFAULT_TZ): LocalDate {
  const p = zonedParts(instant, tz);
  return makeLocalDate(p.y, p.m, p.d);
}

export function instantToLocalTime(instant: Date | number, tz: string = DEFAULT_TZ): string {
  const p = zonedParts(instant, tz);
  return `${String(p.hh).padStart(2, "0")}:${String(p.mm).padStart(2, "0")}`;
}

export function todayLocal(tz: string = DEFAULT_TZ, now: Date = new Date()): LocalDate {
  return instantToLocalDate(now, tz);
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function isTime(s: string): boolean {
  return TIME_RE.test(s);
}
export function parseTime(s: string): [number, number] {
  const m = TIME_RE.exec(s);
  if (!m) throw new Error(`Invalid time: ${s}`);
  return [Number(m[1]), Number(m[2])];
}

// ───────────── Display ─────────────

export function formatLocalDate(s: LocalDate, style: "short" | "long" | "weekday" = "short"): string {
  const { y, m, d } = parseLocalDate(s);
  const wd = weekday(s);
  if (style === "long") return `${WEEKDAYS_LONG[wd]}, ${MONTHS[m - 1]} ${d}, ${y}`;
  if (style === "weekday") return `${WEEKDAYS[wd]}, ${MONTHS[m - 1]!.slice(0, 3)} ${d}`;
  return `${MONTHS[m - 1]!.slice(0, 3)} ${d}, ${y}`;
}

export function formatTime12(time: string): string {
  const [h, m] = parseTime(time);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function formatInstantTime(instant: Date, tz: string = DEFAULT_TZ): string {
  return formatTime12(instantToLocalTime(instant, tz));
}

/** Monday-start week containing the date. */
export function startOfWeek(s: LocalDate, weekStartsOn = 0): LocalDate {
  const wd = weekday(s);
  return addDays(s, -((wd - weekStartsOn + 7) % 7));
}
