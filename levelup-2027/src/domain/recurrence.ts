/**
 * RFC 5545 RRULE subset: FREQ (DAILY|WEEKLY|MONTHLY|YEARLY), INTERVAL, BYDAY (weekly), COUNT, UNTIL.
 * UNTIL is stored as a local date (YYYYMMDD, inclusive) in the event's timezone.
 * Expansion happens in wall-clock time so an 8:00 AM shift stays 8:00 AM across DST.
 */
import {
  type LocalDate,
  addDays,
  daysInMonth,
  instantToLocalDate,
  instantToLocalTime,
  makeLocalDate,
  parseLocalDate,
  toDayNumber,
  weekday,
  zonedToInstant,
} from "./dates";

export type Freq = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

export interface Rule {
  freq: Freq;
  interval: number;
  byDay?: number[]; // 0=Sun … 6=Sat
  count?: number;
  until?: LocalDate;
}

export function parseRRule(s: string): Rule {
  const parts = Object.fromEntries(
    s
      .replace(/^RRULE:/i, "")
      .split(";")
      .filter(Boolean)
      .map((p) => {
        const [k, v] = p.split("=");
        return [String(k).toUpperCase(), String(v ?? "").toUpperCase()];
      }),
  );
  const freq = parts.FREQ as Freq;
  if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(freq)) throw new Error(`Unsupported FREQ: ${parts.FREQ}`);
  const interval = parts.INTERVAL ? Number(parts.INTERVAL) : 1;
  if (!Number.isInteger(interval) || interval < 1 || interval > 365) throw new Error("Invalid INTERVAL");
  const rule: Rule = { freq, interval };
  if (parts.BYDAY) {
    rule.byDay = parts.BYDAY.split(",").map((c: string) => {
      const i = DAY_CODES.indexOf(c as (typeof DAY_CODES)[number]);
      if (i < 0) throw new Error(`Invalid BYDAY: ${c}`);
      return i;
    });
    rule.byDay.sort((a, b) => a - b);
  }
  if (parts.COUNT) {
    const c = Number(parts.COUNT);
    if (!Number.isInteger(c) || c < 1 || c > 5000) throw new Error("Invalid COUNT");
    rule.count = c;
  }
  if (parts.UNTIL) {
    const m = /^(\d{4})(\d{2})(\d{2})/.exec(parts.UNTIL);
    if (!m) throw new Error("Invalid UNTIL");
    rule.until = `${m[1]}-${m[2]}-${m[3]}`;
  }
  return rule;
}

export function formatRRule(r: Rule): string {
  const out = [`FREQ=${r.freq}`];
  if (r.interval !== 1) out.push(`INTERVAL=${r.interval}`);
  if (r.byDay?.length) out.push(`BYDAY=${r.byDay.map((d) => DAY_CODES[d]).join(",")}`);
  if (r.count) out.push(`COUNT=${r.count}`);
  if (r.until) out.push(`UNTIL=${r.until.replace(/-/g, "")}`);
  return out.join(";");
}

export function describeRule(r: Rule): string {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const every = r.interval === 1 ? "" : `${r.interval} `;
  const unit = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" }[r.freq];
  let s = r.interval === 1 ? `Every ${unit}` : `Every ${every}${unit}s`;
  if (r.freq === "WEEKLY" && r.byDay?.length) s += ` on ${r.byDay.map((d) => names[d]).join(", ")}`;
  if (r.until) s += ` until ${r.until}`;
  if (r.count) s += `, ${r.count} times`;
  return s;
}

/**
 * Yield local dates on which the rule produces an occurrence, in order, starting at dtStart.
 * Stops after `maxDate` (inclusive) or when COUNT/UNTIL is exhausted.
 */
export function* ruleDates(rule: Rule, dtStart: LocalDate, maxDate: LocalDate): Generator<LocalDate> {
  let produced = 0;
  const limit = rule.until && rule.until < maxDate ? rule.until : maxDate;
  const emit = (d: LocalDate) => d >= dtStart && d <= limit;
  const done = () => (rule.count !== undefined && produced >= rule.count);

  if (rule.freq === "DAILY") {
    for (let d = dtStart; d <= limit && !done(); d = addDays(d, rule.interval)) {
      produced++;
      yield d;
    }
    return;
  }

  if (rule.freq === "WEEKLY") {
    const days = rule.byDay?.length ? rule.byDay : [weekday(dtStart)];
    // Weeks start Monday (RFC 5545 default WKST=MO).
    const mondayOffset = (weekday(dtStart) + 6) % 7;
    let weekStart = addDays(dtStart, -mondayOffset);
    while (weekStart <= limit && !done()) {
      const inWeek = days
        .map((wd) => addDays(weekStart, (wd + 6) % 7))
        .sort();
      for (const d of inWeek) {
        if (done()) return;
        if (d > limit) return;
        if (emit(d)) {
          produced++;
          yield d;
        }
      }
      weekStart = addDays(weekStart, 7 * rule.interval);
    }
    return;
  }

  const { y: y0, m: m0, d: d0 } = parseLocalDate(dtStart);
  for (let k = 0; !done(); k++) {
    let y: number, m: number;
    if (rule.freq === "MONTHLY") {
      const total = (m0 - 1) + k * rule.interval;
      y = y0 + Math.floor(total / 12);
      m = (total % 12) + 1;
    } else {
      y = y0 + k * rule.interval;
      m = m0;
    }
    const first = makeLocalDate(y, m, 1);
    if (first > limit) return;
    if (d0 > daysInMonth(y, m)) continue; // e.g. the 31st or Feb 29 — skipped per RFC 5545
    const d = makeLocalDate(y, m, d0);
    if (d > limit) return;
    if (emit(d)) {
      produced++;
      yield d;
    }
  }
}

export interface SeriesSpec {
  startAt: Date;
  endAt: Date;
  timezone: string;
  rrule: string | null;
  allDay?: boolean;
}

/** Occurrence start instants of a series that overlap [rangeStart, rangeEnd). */
export function expandSeries(spec: SeriesSpec, rangeStart: Date, rangeEnd: Date): { start: Date; end: Date }[] {
  const duration = spec.endAt.getTime() - spec.startAt.getTime();
  if (!spec.rrule) {
    return spec.startAt < rangeEnd && spec.endAt.getTime() + (duration === 0 ? 1 : 0) > rangeStart.getTime()
      ? [{ start: spec.startAt, end: spec.endAt }]
      : [];
  }
  const rule = parseRRule(spec.rrule);
  const dtStart = instantToLocalDate(spec.startAt, spec.timezone);
  const time = instantToLocalTime(spec.startAt, spec.timezone);
  // Occurrences starting up to `duration` before the range can still overlap it.
  const maxDate = addDays(instantToLocalDate(rangeEnd, spec.timezone), 1);
  const minDayNum = toDayNumber(instantToLocalDate(rangeStart.getTime() - duration, spec.timezone)) - 1;
  const out: { start: Date; end: Date }[] = [];
  for (const d of ruleDates(rule, dtStart, maxDate)) {
    if (toDayNumber(d) < minDayNum) continue;
    const start = zonedToInstant(d, time, spec.timezone);
    const end = new Date(start.getTime() + duration);
    if (start < rangeEnd && (end > rangeStart || (duration === 0 && start >= rangeStart))) out.push({ start, end });
  }
  return out;
}

/** Builds an UNTIL that ends a series the day before `date` (used for "this and following" splits). */
export function untilBefore(date: LocalDate): LocalDate {
  return addDays(date, -1);
}
