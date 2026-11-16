/**
 * Holiday calendars used only to FLAG payroll dates whose timing may differ.
 * Nothing is moved automatically except the *estimated* early-deposit date, which is
 * labelled as an estimate.
 */
import { type LocalDate, addDays, daysInMonth, makeLocalDate, weekday } from "./dates";

export interface Holiday {
  date: LocalDate; // observed date
  name: string;
}

function nthWeekday(y: number, m: number, wd: number, n: number): LocalDate {
  const first = makeLocalDate(y, m, 1);
  const offset = (wd - weekday(first) + 7) % 7;
  return addDays(first, offset + 7 * (n - 1));
}

function lastWeekday(y: number, m: number, wd: number): LocalDate {
  const last = makeLocalDate(y, m, daysInMonth(y, m));
  return addDays(last, -((weekday(last) - wd + 7) % 7));
}

/** Sat → Fri, Sun → Mon (State of Florida and federal-employee observance). */
function observedFriMon(d: LocalDate): LocalDate {
  const wd = weekday(d);
  if (wd === 6) return addDays(d, -1);
  if (wd === 0) return addDays(d, 1);
  return d;
}

/** Federal Reserve banks: Sunday holidays move to Monday; Saturday holidays are NOT observed. */
function observedBank(d: LocalDate): LocalDate | null {
  const wd = weekday(d);
  if (wd === 6) return null;
  if (wd === 0) return addDays(d, 1);
  return d;
}

/** Paid holidays for State of Florida employees (s. 110.117, F.S.), with observed dates. */
export function floridaStateHolidays(y: number): Holiday[] {
  const thanksgiving = nthWeekday(y, 11, 4, 4);
  return [
    { date: observedFriMon(makeLocalDate(y, 1, 1)), name: "New Year's Day" },
    { date: nthWeekday(y, 1, 1, 3), name: "Martin Luther King Jr. Day" },
    { date: lastWeekday(y, 5, 1), name: "Memorial Day" },
    { date: observedFriMon(makeLocalDate(y, 7, 4)), name: "Independence Day" },
    { date: nthWeekday(y, 9, 1, 1), name: "Labor Day" },
    { date: observedFriMon(makeLocalDate(y, 11, 11)), name: "Veterans Day" },
    { date: thanksgiving, name: "Thanksgiving Day" },
    { date: addDays(thanksgiving, 1), name: "Friday after Thanksgiving" },
    { date: observedFriMon(makeLocalDate(y, 12, 25)), name: "Christmas Day" },
  ];
}

/** Federal Reserve (bank) holidays — days when direct deposits generally do not post. */
export function bankHolidays(y: number): Holiday[] {
  const list: [LocalDate | null, string][] = [
    [observedBank(makeLocalDate(y, 1, 1)), "New Year's Day"],
    [nthWeekday(y, 1, 1, 3), "Martin Luther King Jr. Day"],
    [nthWeekday(y, 2, 1, 3), "Washington's Birthday"],
    [lastWeekday(y, 5, 1), "Memorial Day"],
    [observedBank(makeLocalDate(y, 6, 19)), "Juneteenth"],
    [observedBank(makeLocalDate(y, 7, 4)), "Independence Day"],
    [nthWeekday(y, 9, 1, 1), "Labor Day"],
    [nthWeekday(y, 10, 1, 2), "Columbus Day"],
    [observedBank(makeLocalDate(y, 11, 11)), "Veterans Day"],
    [nthWeekday(y, 11, 4, 4), "Thanksgiving Day"],
    [observedBank(makeLocalDate(y, 12, 25)), "Christmas Day"],
  ];
  return list.filter((x): x is [LocalDate, string] => x[0] !== null).map(([date, name]) => ({ date, name }));
}

function index(fn: (y: number) => Holiday[]) {
  const cache = new Map<number, Map<LocalDate, string>>();
  return (d: LocalDate): string | null => {
    const y = Number(d.slice(0, 4));
    // Observed dates can spill into the neighbouring year (e.g. Jan 1 on Saturday → Dec 31).
    for (const yy of [y - 1, y, y + 1]) {
      let m = cache.get(yy);
      if (!m) {
        m = new Map(fn(yy).map((h) => [h.date, h.name]));
        cache.set(yy, m);
      }
      const hit = m.get(d);
      if (hit) return hit;
    }
    return null;
  };
}

export const stateHolidayOn = index(floridaStateHolidays);
export const bankHolidayOn = index(bankHolidays);

export function isBusinessDay(d: LocalDate): boolean {
  const wd = weekday(d);
  return wd !== 0 && wd !== 6 && bankHolidayOn(d) === null;
}
