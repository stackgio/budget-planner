/**
 * Phase 3 domain logic — pure functions, no I/O.
 * Nothing here invents activity: every number is derived from records passed in.
 */
import { type LocalDate, addDays, daysInMonth, diffDays, makeLocalDate, parseLocalDate, startOfWeek, weekday } from "./dates";
import { overlaps } from "./calendar";

// ───────────── Periods (weeks run Sat → Fri, matching the DOC rotation) ─────────────

export function weekOf(d: LocalDate): { start: LocalDate; end: LocalDate } {
  const start = startOfWeek(d, 6);
  return { start, end: addDays(start, 6) };
}

export function monthOf(d: LocalDate): { start: LocalDate; end: LocalDate } {
  const { y, m } = parseLocalDate(d);
  return { start: makeLocalDate(y, m, 1), end: makeLocalDate(y, m, daysInMonth(y, m)) };
}

export const inRange = (d: LocalDate, r: { start: LocalDate; end: LocalDate }) => d >= r.start && d <= r.end;

// ───────────── Goals ─────────────

export type ProgressSource = "MANUAL" | "MILESTONES" | "TASKS" | "HABIT" | "CHALLENGE" | "WORKOUTS" | "ACTIVITY";

export interface GoalProgressInput {
  source: ProgressSource;
  targetX100: number | null;
  status: "NOT_STARTED" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  manualEntries: { valueX100: number; recordedOn: LocalDate; createdAt: Date }[];
  milestones: { completed: boolean }[];
  tasks: { done: boolean }[];
  /** Pre-summed by the caller from real records within the goal's period. */
  habitCheckIns?: number;
  challengeConfirmedCents?: number;
  workoutsLogged?: number;
  activityMinutes?: number;
}

export interface GoalProgress {
  current: number; // in units (not ×100)
  target: number | null;
  pct: number | null; // 0–100
  label: string;
}

export function goalProgress(g: GoalProgressInput): GoalProgress {
  const target = g.targetX100 === null ? null : g.targetX100 / 100;
  const pctOf = (cur: number, tgt: number | null) => (tgt && tgt > 0 ? Math.max(0, Math.min(100, (cur / tgt) * 100)) : null);
  switch (g.source) {
    case "MILESTONES": {
      const done = g.milestones.filter((m) => m.completed).length;
      return { current: done, target: g.milestones.length, pct: g.milestones.length ? (done / g.milestones.length) * 100 : null, label: `${done} of ${g.milestones.length} milestones` };
    }
    case "TASKS": {
      const done = g.tasks.filter((t) => t.done).length;
      return { current: done, target: g.tasks.length, pct: g.tasks.length ? (done / g.tasks.length) * 100 : null, label: `${done} of ${g.tasks.length} linked tasks done` };
    }
    case "HABIT": {
      const cur = g.habitCheckIns ?? 0;
      return { current: cur, target, pct: pctOf(cur, target), label: `${cur} check-ins` };
    }
    case "CHALLENGE": {
      const cur = (g.challengeConfirmedCents ?? 0) / 100;
      return { current: cur, target, pct: pctOf(cur, target), label: "from confirmed transfers" };
    }
    case "WORKOUTS": {
      const cur = g.workoutsLogged ?? 0;
      return { current: cur, target, pct: pctOf(cur, target), label: `${cur} workouts logged` };
    }
    case "ACTIVITY": {
      const cur = g.activityMinutes ?? 0;
      return { current: cur, target, pct: pctOf(cur, target), label: `${cur} minutes logged` };
    }
    default: {
      const latest = [...g.manualEntries].sort((a, b) => b.recordedOn.localeCompare(a.recordedOn) || b.createdAt.getTime() - a.createdAt.getTime())[0];
      if (!latest) return { current: 0, target, pct: target ? 0 : null, label: "No updates yet" };
      const cur = latest.valueX100 / 100;
      return { current: cur, target, pct: pctOf(cur, target), label: `updated ${latest.recordedOn}` };
    }
  }
}

export function milestoneBuckets<T extends { dueDate: LocalDate | null; completedAt: Date | null }>(ms: T[], today: LocalDate, horizonDays = 30) {
  const open = ms.filter((m) => !m.completedAt && m.dueDate);
  return {
    overdue: open.filter((m) => m.dueDate! < today),
    upcoming: open.filter((m) => m.dueDate! >= today && m.dueDate! <= addDays(today, horizonDays)),
  };
}

// ───────────── Work modes → expectations ─────────────

/**
 * Optional weekly targets (workouts, faith days…) shrink by one for each day you spent in
 * Overtime, Activation or Recovery mode — never below zero. This only changes expectations;
 * nothing logged is altered and missed sessions are not counted as failures.
 */
export function adjustedWeeklyTarget(base: number, heavyDays: number): { target: number; reducedBy: number } {
  const reducedBy = Math.min(base, Math.max(0, heavyDays));
  return { target: base - reducedBy, reducedBy };
}

/** Days within [start,end] touched by a non-normal mode session. */
export function heavyDaysIn(range: { start: LocalDate; end: LocalDate }, sessions: { startDay: LocalDate; endDay: LocalDate }[]): number {
  const days = new Set<LocalDate>();
  for (const s of sessions) {
    for (let d = s.startDay > range.start ? s.startDay : range.start; d <= s.endDay && d <= range.end; d = addDays(d, 1)) days.add(d);
  }
  return days.size;
}

// ───────────── Scheduling suggestions ─────────────

export interface Busy { start: Date; end: Date; title: string }

/**
 * Free slots of `durationMin` on the candidate days, avoiding busy blocks (with a buffer),
 * staying between `earliest` and `latest` wall-clock times. Suggestions only — the caller
 * never moves or cancels anything.
 */
export function suggestSlots(opts: {
  days: LocalDate[];
  durationMin: number;
  busy: Busy[];
  toInstant: (d: LocalDate, t: string) => Date;
  preferredTime: string;
  earliest?: string;
  latest?: string;
  bufferMin?: number;
  max?: number;
}): { start: Date; end: Date; day: LocalDate }[] {
  const { durationMin, busy, toInstant } = opts;
  const buffer = (opts.bufferMin ?? 30) * 60_000;
  const out: { start: Date; end: Date; day: LocalDate }[] = [];
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const fmt = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const earliest = toMin(opts.earliest ?? "07:00");
  const latest = toMin(opts.latest ?? "21:00");
  const pref = toMin(opts.preferredTime);
  for (const day of opts.days) {
    // Try the preferred time first, then nearby half-hour steps outward.
    const candidates: number[] = [];
    for (let k = 0; k <= 28; k++) {
      for (const sign of k === 0 ? [0] : [1, -1]) {
        const m = pref + sign * k * 30;
        if (m >= earliest && m + durationMin <= latest) candidates.push(m);
      }
    }
    for (const m of candidates) {
      const start = toInstant(day, fmt(m));
      const end = new Date(start.getTime() + durationMin * 60_000);
      const clash = busy.some((b) => overlaps({ start: new Date(start.getTime() - buffer), end: new Date(end.getTime() + buffer) }, b));
      if (!clash) {
        out.push({ start, end, day });
        break;
      }
    }
    if (out.length >= (opts.max ?? 3)) break;
  }
  return out;
}

/** Next `count` dates (from `from`, inclusive) falling on the given weekdays (0=Sun). */
export function nextWeekdays(from: LocalDate, weekdays: number[], count: number): LocalDate[] {
  const out: LocalDate[] = [];
  for (let d = from; out.length < count && diffDays(d, from) < 366; d = addDays(d, 1)) if (weekdays.includes(weekday(d))) out.push(d);
  return out;
}

// ───────────── Relationship ─────────────

export const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

export function alphabetProgress(entries: { letter: string; status: string }[]) {
  const done = entries.filter((e) => e.status === "COMPLETED").map((e) => e.letter).sort();
  const next = LETTERS.find((l) => !entries.some((e) => e.letter === l && (e.status === "COMPLETED" || e.status === "SKIPPED"))) ?? null;
  return { completed: done.length, total: 26, next, pct: (done.length / 26) * 100 };
}

/**
 * Date spending: each date's cost counts once — either the manual amount or the linked
 * confirmed payment, never both (enforced by a DB CHECK as well).
 */
export function dateSpending(plans: { status: string; actualCostCents: number | null; linkedPaymentCents: number | null }[]) {
  let manual = 0, linked = 0;
  for (const p of plans) {
    if (p.status !== "COMPLETED") continue;
    if (p.linkedPaymentCents !== null) linked += p.linkedPaymentCents;
    else if (p.actualCostCents !== null) manual += p.actualCostCents;
  }
  return { manualCents: manual, linkedCents: linked, totalCents: manual + linked };
}

/** Next occurrence (on or after `from`) of a yearly important date. Feb 29 falls back to Feb 28. */
export function nextAnniversary(month: number, day: number, from: LocalDate): LocalDate {
  const { y } = parseLocalDate(from);
  for (const yy of [y, y + 1]) {
    const d = makeLocalDate(yy, month, Math.min(day, daysInMonth(yy, month)));
    if (d >= from) return d;
  }
  return makeLocalDate(y + 1, month, Math.min(day, daysInMonth(y + 1, month)));
}

// ───────────── Career ─────────────

export const FULL_TIME_HOURS = 2080;

/** Annualized comparison with your current hourly rate. Uses only amounts you entered. */
export function comparePay(currentHourlyCents: number, posting: { minCents: number | null; maxCents: number | null; period: "HOURLY" | "ANNUAL" }) {
  const toAnnual = (c: number) => (posting.period === "HOURLY" ? c * FULL_TIME_HOURS : c);
  const current = currentHourlyCents * FULL_TIME_HOURS;
  const min = posting.minCents === null ? null : toAnnual(posting.minCents);
  const max = posting.maxCents === null ? null : toAnnual(posting.maxCents);
  return { currentAnnualCents: current, minAnnualCents: min, maxAnnualCents: max, minDiffCents: min === null ? null : min - current, maxDiffCents: max === null ? null : max - current };
}
