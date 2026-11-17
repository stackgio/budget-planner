/**
 * Reminder planning & delivery decisions — pure, deterministic, no I/O.
 * Every reminder has a stable dedupe key, so re-running the planner (retries, restarts, two workers)
 * can never create a second copy. Times are wall-clock in the user's zone and DST-safe.
 */
import { type LocalDate, addDays, daysInMonth, formatLocalDate, formatTime12, instantToLocalDate, instantToLocalTime, makeLocalDate, parseLocalDate, parseTime, weekday, zonedToInstant } from "./dates";

export type Category =
  | "BRIEFING" | "CHECKIN" | "REFLECTION"
  | "PAYDAY" | "EXTRA_PAYCHECK" | "ROULETTE" | "ROTH" | "CHALLENGE"
  | "GOAL" | "WORKOUT" | "FAITH" | "RELATIONSHIP" | "EDUCATION" | "CAREER" | "REVIEW";
export type Priority = "IMPORTANT" | "NORMAL" | "LOW";
export type ModeRule = "ALL" | "IMPORTANT_ONLY";
export type WorkMode = "NORMAL" | "OVERTIME" | "ACTIVATION" | "RECOVERY";

export const CATEGORY_META: Record<Category, { label: string; group: "Daily" | "Financial" | "Personal"; generic: string }> = {
  BRIEFING: { label: "Morning briefing", group: "Daily", generic: "Your morning briefing is ready." },
  CHECKIN: { label: "Afternoon check-in", group: "Daily", generic: "Time for a quick check-in." },
  REFLECTION: { label: "Evening reflection", group: "Daily", generic: "Your evening reflection is ready." },
  PAYDAY: { label: "Paydays", group: "Financial", generic: "A payday is coming up." },
  EXTRA_PAYCHECK: { label: "Extra-paycheck months", group: "Financial", generic: "An extra-paycheck month is coming up." },
  ROULETTE: { label: "Roulette transfers waiting", group: "Financial", generic: "You have approved transfers to confirm." },
  ROTH: { label: "Roth IRA contributions waiting", group: "Financial", generic: "A planned contribution is waiting for confirmation." },
  CHALLENGE: { label: "Debt & savings challenge actions", group: "Financial", generic: "A challenge transfer is waiting for confirmation." },
  GOAL: { label: "Goals & milestones", group: "Personal", generic: "A milestone is coming up." },
  WORKOUT: { label: "Workouts", group: "Personal", generic: "You have a workout planned." },
  FAITH: { label: "Faith routines", group: "Personal", generic: "A moment for your faith routine." },
  RELATIONSHIP: { label: "Date nights & important dates", group: "Personal", generic: "You have something special coming up." },
  EDUCATION: { label: "Education deadlines", group: "Personal", generic: "An education deadline is coming up." },
  CAREER: { label: "Career milestones", group: "Personal", generic: "A career deadline is coming up." },
  REVIEW: { label: "Weekly & monthly reviews", group: "Personal", generic: "Your review is ready when you are." },
};
export const ALL_CATEGORIES = Object.keys(CATEGORY_META) as Category[];

export const BRIEFING_SECTIONS = ["shift", "mode", "priorities", "calendar", "workouts", "tasks", "paydays", "transfers", "goals"] as const;
export type BriefingSection = (typeof BRIEFING_SECTIONS)[number];

export interface Prefs {
  quietStart: string;
  quietEnd: string;
  categories: Partial<Record<Category, boolean>>;
  modeRules: Partial<Record<Exclude<WorkMode, "NORMAL">, ModeRule>>;
  previewDetail: boolean;
  briefingEnabled: boolean;
  checkInEnabled: boolean;
  reflectionEnabled: boolean;
  briefingTime: string;
  checkInTime: string;
  reflectionTime: string;
}

export const DEFAULT_PREFS: Omit<Prefs, "briefingTime" | "checkInTime" | "reflectionTime"> = {
  quietStart: "21:45",
  quietEnd: "05:45",
  categories: Object.fromEntries(ALL_CATEGORIES.map((c) => [c, true])),
  modeRules: { OVERTIME: "IMPORTANT_ONLY", ACTIVATION: "IMPORTANT_ONLY", RECOVERY: "IMPORTANT_ONLY" },
  previewDetail: false,
  briefingEnabled: true,
  checkInEnabled: true,
  reflectionEnabled: true,
};

export interface Candidate {
  dedupeKey: string;
  kind: "BRIEFING" | "CHECKIN" | "REFLECTION" | "REMINDER" | "REVIEW";
  category: Category;
  priority: Priority;
  scheduledFor: Date;
  expiresAt: Date;
  detail: string; // may contain private specifics — stored encrypted, shown only in the app
  href: string;
}

/** Facts for one local day, gathered from stored records by the server. */
export interface DayFacts {
  day: LocalDate;
  paydays: { kind: "REGULAR" | "OVERTIME"; officialDate: LocalDate; provisional: boolean }[];
  extraMonths: { month: string; officialDates: LocalDate[]; provisional: boolean }[];
  waiting: { roth: number; tiles: number; other: number; oldestApprovedDay: LocalDate | null };
  milestones: { id: string; title: string; dueDate: LocalDate; category: string; goalId: string }[];
  jobs: { id: string; title: string; deadline: LocalDate | null; interviewOn: LocalDate | null }[];
  workouts: { key: string; title: string; start: Date }[];
  dates: { id: string; title: string; start: Date }[];
  importantDates: { id: string; title: string; next: LocalDate }[];
  faithReminders: { key: string; label: string; time: string; days: number[] }[];
}

const at = (day: LocalDate, time: string, tz: string) => zonedToInstant(day, time, tz);
const endOfDay = (day: LocalDate, tz: string) => zonedToInstant(addDays(day, 1), "00:00", tz);
const plusMin = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);

/** Everything that could be reminded about on `facts.day`. Disabled daily items are simply not planned. */
export function planDay(f: DayFacts, prefs: Prefs, tz: string): Candidate[] {
  const d = f.day;
  const out: Candidate[] = [];
  const push = (c: Omit<Candidate, "expiresAt"> & { expiresAt?: Date }) => out.push({ ...c, expiresAt: c.expiresAt ?? endOfDay(d, tz) });

  if (prefs.briefingEnabled) push({ dedupeKey: `briefing:${d}`, kind: "BRIEFING", category: "BRIEFING", priority: "NORMAL", scheduledFor: at(d, prefs.briefingTime, tz), expiresAt: plusMin(at(d, prefs.briefingTime, tz), 4 * 60), detail: `Morning briefing for ${formatLocalDate(d, "long")}.`, href: `/assistant?tab=morning&date=${d}` });
  if (prefs.checkInEnabled) push({ dedupeKey: `checkin:${d}`, kind: "CHECKIN", category: "CHECKIN", priority: "NORMAL", scheduledFor: at(d, prefs.checkInTime, tz), expiresAt: plusMin(at(d, prefs.checkInTime, tz), 3 * 60), detail: "Afternoon check-in: open tasks, habits and evening plans.", href: `/assistant?tab=checkin&date=${d}` });
  if (prefs.reflectionEnabled) push({ dedupeKey: `reflection:${d}`, kind: "REFLECTION", category: "REFLECTION", priority: "NORMAL", scheduledFor: at(d, prefs.reflectionTime, tz), detail: "Evening reflection: what went well, and tomorrow at a glance.", href: `/assistant?tab=evening&date=${d}` });

  // Paydays — always labelled as projected; never treated as received income.
  for (const p of f.paydays) {
    if (p.officialDate === addDays(d, 1)) {
      push({ dedupeKey: `payday:${p.kind}:${p.officialDate}:eve`, kind: "REMINDER", category: "PAYDAY", priority: "NORMAL", scheduledFor: at(d, "18:00", tz),
        detail: `${p.kind === "REGULAR" ? "Regular" : "Overtime"} payday tomorrow${p.provisional ? " (projected from your provisional schedule)" : ""}. Record the actual deposit when it arrives.`, href: p.kind === "REGULAR" ? "/money/payroll" : "/money/overtime" });
    }
    if (p.officialDate === d && p.kind === "OVERTIME") {
      push({ dedupeKey: `payday:OVERTIME:${d}:day`, kind: "REMINDER", category: "PAYDAY", priority: "NORMAL", scheduledFor: at(d, "10:00", tz),
        detail: "Overtime payday. If an overtime deposit arrived, enter the actual net amount — then you can spin Roulette.", href: "/money/overtime" });
    }
  }
  for (const m of f.extraMonths) {
    const first = `${m.month}-01`;
    if (addDays(first, -30) === d) push({ dedupeKey: `extra:${m.month}:T-30`, kind: "REMINDER", category: "EXTRA_PAYCHECK", priority: "LOW", scheduledFor: at(d, "09:00", tz), detail: `${formatLocalDate(first).split(" ")[0]} is a${m.provisional ? " projected" : "n"} three-paycheck month. Want to plan the extra income?`, href: "/money/extra" });
    const third = m.officialDates[2];
    if (third && addDays(third, -7) === d) push({ dedupeKey: `extra:${m.month}:third:T-7`, kind: "REMINDER", category: "EXTRA_PAYCHECK", priority: "NORMAL", scheduledFor: at(d, "09:00", tz), detail: `Your third regular paycheck${m.provisional ? " (projected)" : ""} is a week away. Review your Extra Paycheck plan.`, href: `/money/extra/${m.month}` });
  }
  const waitingTotal = f.waiting.roth + f.waiting.tiles + f.waiting.other;
  if (waitingTotal) {
    const stale = f.waiting.oldestApprovedDay !== null && f.waiting.oldestApprovedDay <= addDays(d, -7);
    const prio: Priority = stale ? "IMPORTANT" : "NORMAL";
    if (f.waiting.roth) push({ dedupeKey: `waiting:roth:${d}`, kind: "REMINDER", category: "ROTH", priority: prio, scheduledFor: at(d, "19:00", tz), detail: `${f.waiting.roth} planned Roth IRA contribution${f.waiting.roth > 1 ? "s" : ""} still waiting for your confirmation.`, href: "/money/roulette" });
    if (f.waiting.tiles) push({ dedupeKey: `waiting:tiles:${d}`, kind: "REMINDER", category: "CHALLENGE", priority: prio, scheduledFor: at(d, "19:00", tz), detail: `${f.waiting.tiles} approved challenge transfer${f.waiting.tiles > 1 ? "s" : ""} still waiting for confirmation.`, href: "/money/roulette" });
    if (f.waiting.other) push({ dedupeKey: `waiting:other:${d}`, kind: "REMINDER", category: "ROULETTE", priority: prio, scheduledFor: at(d, "19:00", tz), detail: `${f.waiting.other} other approved allocation${f.waiting.other > 1 ? "s" : ""} still waiting for confirmation.`, href: "/money/roulette" });
  }

  for (const m of f.milestones) {
    const cat: Category = m.category === "EDUCATION" ? "EDUCATION" : m.category === "CAREER" ? "CAREER" : "GOAL";
    if (m.dueDate === addDays(d, 1)) push({ dedupeKey: `milestone:${m.id}:T-1`, kind: "REMINDER", category: cat, priority: "NORMAL", scheduledFor: at(d, "18:30", tz), detail: `Due tomorrow: ${m.title}.`, href: `/goals/${m.goalId}` });
    if (m.dueDate === d) push({ dedupeKey: `milestone:${m.id}:T0`, kind: "REMINDER", category: cat, priority: "IMPORTANT", scheduledFor: at(d, "08:00", tz), detail: `Due today: ${m.title}.`, href: `/goals/${m.goalId}` });
  }
  for (const j of f.jobs) {
    if (j.deadline === addDays(d, 3)) push({ dedupeKey: `job:${j.id}:deadline:T-3`, kind: "REMINDER", category: "CAREER", priority: "NORMAL", scheduledFor: at(d, "09:00", tz), detail: `Application deadline in 3 days: ${j.title}.`, href: "/goals/career" });
    if (j.deadline === addDays(d, 1)) push({ dedupeKey: `job:${j.id}:deadline:T-1`, kind: "REMINDER", category: "CAREER", priority: "IMPORTANT", scheduledFor: at(d, "09:00", tz), detail: `Application deadline tomorrow: ${j.title}.`, href: "/goals/career" });
    if (j.interviewOn === addDays(d, 1)) push({ dedupeKey: `job:${j.id}:interview:T-1`, kind: "REMINDER", category: "CAREER", priority: "IMPORTANT", scheduledFor: at(d, "18:00", tz), detail: `Interview tomorrow: ${j.title}. Review your prep notes.`, href: "/goals/career" });
  }
  for (const w of f.workouts) {
    if (instantToLocalDate(w.start, tz) !== d) continue;
    push({ dedupeKey: `workout:${w.key}`, kind: "REMINDER", category: "WORKOUT", priority: "LOW", scheduledFor: plusMin(w.start, -60), expiresAt: w.start, detail: `${w.title} at ${formatTime12(instantToLocalTime(w.start, tz))}.`, href: "/goals/fitness" });
  }
  for (const x of f.dates) {
    if (instantToLocalDate(x.start, tz) !== d) continue;
    push({ dedupeKey: `date:${x.id}:${d}`, kind: "REMINDER", category: "RELATIONSHIP", priority: "IMPORTANT", scheduledFor: plusMin(x.start, -180), expiresAt: x.start, detail: `Date night today: ${x.title} at ${formatTime12(instantToLocalTime(x.start, tz))}.`, href: "/goals/relationship" });
  }
  for (const x of f.importantDates) {
    if (x.next === addDays(d, 3)) push({ dedupeKey: `important:${x.id}:${x.next}:T-3`, kind: "REMINDER", category: "RELATIONSHIP", priority: "NORMAL", scheduledFor: at(d, "09:00", tz), detail: `${x.title} is in 3 days (${formatLocalDate(x.next, "weekday")}).`, href: "/goals/relationship" });
    if (x.next === d) push({ dedupeKey: `important:${x.id}:${x.next}:T0`, kind: "REMINDER", category: "RELATIONSHIP", priority: "IMPORTANT", scheduledFor: at(d, "08:00", tz), detail: `Today: ${x.title}.`, href: "/goals/relationship" });
  }
  for (const r of f.faithReminders) {
    if (!r.days.includes(weekday(d))) continue;
    push({ dedupeKey: `faith:${r.key}:${d}`, kind: "REMINDER", category: "FAITH", priority: "LOW", scheduledFor: at(d, r.time, tz), expiresAt: plusMin(at(d, r.time, tz), 120), detail: `${r.label}.`, href: "/goals/faith" });
  }
  // Reviews: weekly on Friday (end of the Sat–Fri week), monthly on the last day.
  if (weekday(d) === 5) push({ dedupeKey: `review:week:${addDays(d, -6)}`, kind: "REVIEW", category: "REVIEW", priority: "NORMAL", scheduledFor: at(d, "19:30", tz), expiresAt: at(addDays(d, 2), "12:00", tz), detail: "Your weekly review is ready — a few minutes to look back and set next week's priorities.", href: `/reviews?date=${d}` });
  const { y, m } = parseLocalDate(d);
  if (d === makeLocalDate(y, m, daysInMonth(y, m))) push({ dedupeKey: `review:month:${d.slice(0, 7)}`, kind: "REVIEW", category: "REVIEW", priority: "NORMAL", scheduledFor: at(d, "19:45", tz), expiresAt: at(addDays(d, 3), "12:00", tz), detail: "Your monthly review is ready.", href: `/reviews/month?date=${d}` });

  return out;
}

// ───────────── Delivery decision ─────────────

const minutesOf = (t: string) => { const [h, m] = parseTime(t); return h * 60 + m; };

/** True when the local wall-clock time falls inside quiet hours (supports windows that cross midnight). */
export function inQuietHours(instant: Date, tz: string, start: string, end: string): boolean {
  const now = minutesOf(instantToLocalTime(instant, tz));
  const s = minutesOf(start), e = minutesOf(end);
  if (s === e) return false;
  return s < e ? now >= s && now < e : now >= s || now < e;
}

/** The next instant (after `instant`) when quiet hours end, in local wall-clock time. */
export function quietEndAfter(instant: Date, tz: string, end: string): Date {
  const today = instantToLocalDate(instant, tz);
  const candidate = zonedToInstant(today, end, tz);
  return candidate > instant ? candidate : zonedToInstant(addDays(today, 1), end, tz);
}

export type Decision =
  | { action: "WAIT" }
  | { action: "DELIVER" }
  | { action: "DEFER"; until: Date; reason: string }
  | { action: "SUPPRESS"; reason: string }
  | { action: "EXPIRE"; reason: string };

/**
 * Decide what to do with a due reminder right now.
 * - Disabled category → suppressed.
 * - Overtime/Activation/Recovery with "important only" → normal/low reminders are suppressed
 *   (dropped, not queued) so no backlog arrives when the mode ends. Important ones still come through.
 * - Quiet hours → deferred to the end of quiet hours, unless that would be after it stops being useful.
 * - Past its useful window → expired (no catch-up flood after downtime).
 */
export function decide(n: { category: Category; priority: Priority; dueAt: Date; expiresAt: Date }, ctx: { now: Date; tz: string; prefs: Prefs; mode: WorkMode }): Decision {
  const { now, tz, prefs, mode } = ctx;
  if (now < n.dueAt) return { action: "WAIT" };
  if (now >= n.expiresAt) return { action: "EXPIRE", reason: "Past its useful time" };
  if (prefs.categories[n.category] === false) return { action: "SUPPRESS", reason: `${CATEGORY_META[n.category].label} reminders are turned off` };
  if (mode !== "NORMAL" && (prefs.modeRules[mode] ?? "IMPORTANT_ONLY") === "IMPORTANT_ONLY" && n.priority !== "IMPORTANT") {
    return { action: "SUPPRESS", reason: `Paused during ${mode.toLowerCase()} mode` };
  }
  if (inQuietHours(now, tz, prefs.quietStart, prefs.quietEnd)) {
    const until = quietEndAfter(now, tz, prefs.quietEnd);
    if (until >= n.expiresAt) return { action: "EXPIRE", reason: "Would arrive after quiet hours, too late to be useful" };
    return { action: "DEFER", until, reason: "Quiet hours" };
  }
  return { action: "DELIVER" };
}

/** Text that may appear on a lock screen or push banner. Generic unless you opt in to detail. */
export function publicText(c: { category: Category; detail: string }, previewDetail: boolean): { title: string; preview: string } {
  return { title: "LEVEL UP", preview: previewDetail ? c.detail : CATEGORY_META[c.category].generic };
}
