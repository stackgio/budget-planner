/**
 * Dates are stored as local calendar days in ISO form "YYYY-MM-DD". All
 * arithmetic is done on UTC-midnight timestamps of those days so daylight
 * saving changes never shift a day.
 */

export type ISODate = string;

const DAY_MS = 86_400_000;

export function todayISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isISODate(value: unknown): value is ISODate {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const t = toUTC(value);
  return !Number.isNaN(t) && fromUTC(t) === value;
}

function toUTC(date: ISODate): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTC(t: number): ISODate {
  return new Date(t).toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUTC(toUTC(date) + days * DAY_MS);
}

/** Whole days from a to b (b - a). */
export function daysBetween(a: ISODate, b: ISODate): number {
  return Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
}

/** 0 = Sunday ... 6 = Saturday */
export function dayOfWeek(date: ISODate): number {
  return new Date(toUTC(date)).getUTCDay();
}

/** Start of the week containing `date`; weekStartsOn 0 = Sunday, 1 = Monday. */
export function startOfWeek(date: ISODate, weekStartsOn: 0 | 1 = 1): ISODate {
  const diff = (dayOfWeek(date) - weekStartsOn + 7) % 7;
  return addDays(date, -diff);
}

export function startOfMonth(date: ISODate): ISODate {
  return `${date.slice(0, 7)}-01`;
}

/** "YYYY-MM" */
export type MonthKey = string;

export function monthKey(date: ISODate): MonthKey {
  return date.slice(0, 7);
}

export function addMonths(key: MonthKey, months: number): MonthKey {
  const [y, m] = key.split('-').map(Number);
  const total = y * 12 + (m - 1) + months;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

export function daysInMonth(key: MonthKey): number {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function endOfMonth(date: ISODate): ISODate {
  const key = monthKey(date);
  return `${key}-${String(daysInMonth(key)).padStart(2, '0')}`;
}

/** Inclusive date range. */
export interface DateRange {
  start: ISODate;
  end: ISODate;
}

export function inRange(date: ISODate, range: DateRange): boolean {
  return date >= range.start && date <= range.end;
}

export function eachDay(range: DateRange): ISODate[] {
  const days: ISODate[] = [];
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) days.push(d);
  return days;
}

export function formatDay(date: ISODate, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  return new Date(toUTC(date)).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

export function formatMonth(key: MonthKey): string {
  return formatDay(`${key}-01`, { month: 'long', year: 'numeric' });
}

export function relativeDayLabel(date: ISODate, today: ISODate): string {
  const diff = daysBetween(date, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff > 1 && diff < 7) return formatDay(date, { weekday: 'long' });
  return formatDay(date, { weekday: 'short', month: 'short', day: 'numeric', year: date.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric' });
}
