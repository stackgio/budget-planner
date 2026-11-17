import "server-only";
import { prisma } from "./db";
import { encrypt, readPrivate } from "./crypto";
import { UserError } from "./payroll";
import { loadOccurrences } from "./calendar";
import { currentMode } from "./modes";
import { loadTasks } from "./queries";
import { fitnessWeek } from "./life";
import { loadGoals } from "./growth";
import { reviewData } from "./reviews";
import { challengeTotals, rothRoom } from "./ledger";
import { type LocalDate, addDays, dateToLocal, formatInstantTime, formatLocalDate, instantToLocalDate, localToDbDate, zonedToInstant } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { MODE_META, type WorkMode } from "@/domain/modes";
import { weekOf } from "@/domain/growth";
import { inView } from "@/domain/tasks";

// Everything here only READS stored records. Nothing is created, completed or moved by the assistant.

async function dayOccurrences(ownerId: string, tz: string, day: LocalDate) {
  const occ = await loadOccurrences(ownerId, tz, zonedToInstant(day, "00:00", tz), zonedToInstant(addDays(day, 1), "00:00", tz), { includePaydays: false, includeTasks: false });
  // Ignore sub-minute records (e.g. an activation started and ended at once) — they aren't commitments.
  return occ.filter((o) => o.allDay || o.end.getTime() - o.start.getTime() >= 60_000);
}

async function upcomingPaydays(ownerId: string, from: LocalDate, days: number) {
  const [rows, schedule] = await Promise.all([
    prisma.payday.findMany({ where: { ownerId, officialDate: { gte: localToDbDate(from), lte: localToDbDate(addDays(from, days)) } }, include: { deposits: { where: { voidedAt: null } } }, orderBy: { officialDate: "asc" } }),
    prisma.paySchedule.findUnique({ where: { ownerId_kind: { ownerId, kind: "REGULAR" } } }),
  ]);
  return rows.map((p) => ({
    kind: p.kind, officialDate: dateToLocal(p.officialDate), expected: dateToLocal(p.manualDepositDate ?? p.expectedDepositDate),
    provisional: p.kind === "REGULAR" && !schedule?.anchorVerified, received: p.deposits[0] ? p.deposits[0].netCents : null, zero: p.status === "ZERO",
  }));
}

async function waitingTransfers(ownerId: string) {
  const lines = await prisma.allocationLine.findMany({ where: { status: "RESERVED", plan: { ownerId } }, include: { tile: true, plan: { select: { id: true } } } });
  return { count: lines.length, totalCents: lines.reduce((a, l) => a + l.amountCents, 0), rothCount: lines.filter((l) => l.target === "ROTH").length, planIds: [...new Set(lines.map((l) => l.plan.id))] };
}

async function dismissed(ownerId: string, day: LocalDate) {
  return new Set((await prisma.assistantDismissal.findMany({ where: { ownerId, date: localToDbDate(day) } })).map((d) => d.itemKey));
}

// ───────────────────────── Morning briefing ─────────────────────────

export async function morningBriefing(ownerId: string, tz: string, day: LocalDate) {
  const [occ, mode, tasks, paydays, waiting, goals] = await Promise.all([
    dayOccurrences(ownerId, tz, day), currentMode(ownerId), loadTasks(ownerId), upcomingPaydays(ownerId, day, 7), waitingTransfers(ownerId),
    loadGoals(ownerId, day, { status: { in: ["ACTIVE", "NOT_STARTED"] } }),
  ]);
  const shift = occ.find((o) => o.category === "DOC_SHIFT") ?? occ.find((o) => o.category === "OVERTIME_SHIFT" || o.category === "ACTIVATION");
  const top = tasks.filter((t) => t.status === "OPEN" && t.isTopThree).slice(0, 3);
  const dueToday = tasks.filter((t) => inView(t, "today", day) && !t.isTopThree);
  return {
    day,
    shift: shift ? { title: shift.title, start: formatInstantTime(shift.start, tz), end: formatInstantTime(shift.end, tz) } : null,
    mode: (mode?.mode ?? "NORMAL") as WorkMode,
    priorities: top.map((t) => ({ id: t.id, title: t.title })),
    calendar: occ.filter((o) => !["DOC_SHIFT", "WORKOUT"].includes(o.category)).map((o) => ({ title: o.title, time: o.allDay ? "All day" : formatInstantTime(o.start, tz), category: o.category })),
    workouts: occ.filter((o) => o.category === "WORKOUT").map((o) => ({ title: o.title, time: formatInstantTime(o.start, tz) })),
    tasks: dueToday.slice(0, 6).map((t) => ({ id: t.id, title: t.title, overdue: !!t.dueDate && t.dueDate < day, priority: t.priority })),
    paydays,
    transfers: waiting,
    goals: goals.flatMap((g) => g.milestones.filter((m) => !m.completedAt && m.dueDate && m.dueDate <= addDays(day, 7)).map((m) => ({ goalId: g.id, goal: g.title, title: m.title, dueDate: m.dueDate!, overdue: m.dueDate! < day }))).slice(0, 5),
  };
}

// ───────────────────────── Afternoon check-in ─────────────────────────

export async function afternoonCheckIn(ownerId: string, tz: string, day: LocalDate, now = new Date()) {
  const [tasks, habits, occ, mode, fw, hidden] = await Promise.all([
    loadTasks(ownerId),
    prisma.habit.findMany({ where: { ownerId, archived: false }, include: { checkIns: { where: { date: localToDbDate(day) } } }, orderBy: { sortOrder: "asc" } }),
    dayOccurrences(ownerId, tz, day), currentMode(ownerId), fitnessWeek(ownerId, tz, weekOf(day), day), dismissed(ownerId, day),
  ]);
  const m = (mode?.mode ?? "NORMAL") as WorkMode;
  const workoutsToday = fw.scheduled.filter((s) => s.day === day);
  return {
    day, mode: m,
    modeNote: m === "NORMAL" ? null : `${MODE_META[m].label} mode: optional items can wait. Rest is part of the plan.`,
    openTasks: tasks.filter((t) => inView(t, "today", day) && !hidden.has(`task:${t.id}`)).slice(0, 8),
    habitsNotLogged: habits.filter((h) => !h.checkIns.length && !hidden.has(`habit:${h.id}`)).map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, optional: h.optional })),
    workout: workoutsToday.length ? workoutsToday.map((w) => ({ title: w.title, time: formatInstantTime(w.start, tz), logged: w.logged })) : null,
    evening: occ.filter((o) => o.start >= zonedToInstant(day, "17:00", tz) && !o.allDay).map((o) => ({ title: o.title, time: formatInstantTime(o.start, tz), important: o.important })),
    postponable: occ.filter((o) => o.optional && o.start > now && !hidden.has(`event:${o.key}`)).map((o) => ({ key: o.key, eventId: o.eventId, originalStart: o.originalStart.toISOString(), title: o.title, time: formatInstantTime(o.start, tz) })),
  };
}

export async function dismissSuggestion(ownerId: string, day: LocalDate, itemKey: string) {
  if (!/^(task|habit|event):[A-Za-z0-9|:.\-_TZ]{1,200}$/.test(itemKey)) throw new UserError("Unknown suggestion.");
  await prisma.assistantDismissal.upsert({ where: { ownerId_date_itemKey: { ownerId, date: localToDbDate(day), itemKey } }, create: { ownerId, date: localToDbDate(day), itemKey }, update: {} });
}

// ───────────────────────── Evening reflection ─────────────────────────

export async function eveningReflection(ownerId: string, tz: string, day: LocalDate) {
  const from = zonedToInstant(day, "00:00", tz), to = zonedToInstant(addDays(day, 1), "00:00", tz);
  const d = localToDbDate(day);
  const [tasksDone, habitsDone, workouts, faith, activity, payments, milestones, dates, tasks, tomorrowOcc, waiting, saved] = await Promise.all([
    prisma.task.findMany({ where: { ownerId, status: "DONE", completedAt: { gte: from, lt: to } }, select: { title: true } }),
    prisma.habitCheckIn.findMany({ where: { date: d, habit: { ownerId } }, include: { habit: { select: { name: true, emoji: true } } } }),
    prisma.workoutLog.findMany({ where: { ownerId, date: d }, select: { title: true, durationMin: true } }),
    prisma.faithEntry.findMany({ where: { ownerId, date: d }, select: { kind: true } }),
    prisma.activityLog.findMany({ where: { ownerId, date: d }, select: { kind: true, minutes: true } }),
    prisma.payment.findMany({ where: { ownerId, createdAt: { gte: from, lt: to }, reversalOfId: null, reversedAt: null }, select: { kind: true, amountCents: true } }),
    prisma.goalMilestone.findMany({ where: { goal: { ownerId }, completedAt: { gte: from, lt: to } }, select: { title: true } }),
    prisma.datePlan.findMany({ where: { ownerId, status: "COMPLETED", completedAt: { gte: from, lt: to } }, select: { title: true } }),
    loadTasks(ownerId), dayOccurrences(ownerId, tz, addDays(day, 1)), waitingTransfers(ownerId),
    prisma.dailyReflection.findUnique({ where: { ownerId_date: { ownerId, date: d } } }),
  ]);
  const accomplishments = [
    ...tasksDone.map((t) => `✓ ${t.title}`),
    ...milestones.map((m) => `🎯 Milestone: ${m.title}`),
    ...workouts.map((w) => `🏋️ ${w.title}${w.durationMin ? ` (${w.durationMin} min)` : ""}`),
    ...habitsDone.map((h) => `${h.habit.emoji ?? "✅"} ${h.habit.name}`),
    ...(faith.length ? [`🙏 ${faith.length} faith entr${faith.length === 1 ? "y" : "ies"}`] : []),
    ...(activity.length ? [`🌱 ${activity.reduce((a, x) => a + x.minutes, 0)} minutes of practice/study`] : []),
    ...dates.map((x) => `💚 Date: ${x.title}`),
    ...(payments.length ? [`💰 ${payments.length} transfer${payments.length === 1 ? "" : "s"} confirmed (${formatCents(payments.reduce((a, p) => a + p.amountCents, 0))})`] : []),
  ];
  const outstanding = tasks.filter((t) => t.status === "OPEN" && (t.isTopThree || (t.dueDate && t.dueDate <= day))).slice(0, 5);
  const tomorrow = addDays(day, 1);
  const paydaysTomorrow = await upcomingPaydays(ownerId, tomorrow, 0);
  return {
    day, accomplishments,
    outstanding: outstanding.map((t) => ({ id: t.id, title: t.title, overdue: !!t.dueDate && t.dueDate < day })),
    tomorrow: tomorrowOcc.map((o) => ({ title: o.title, time: o.allDay ? "All day" : formatInstantTime(o.start, tz) })),
    paydaysTomorrow,
    money: { waiting },
    saved: saved ? { body: readPrivate(saved.bodyCipher), answers: parseAnswers(readPrivate(saved.answersCipher)) } : null,
    questions: ["What went well today?", "What drained your energy?", "What's one thing to make tomorrow easier?", "What are you grateful for?"],
  };
}

function parseAnswers(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try { const v = JSON.parse(raw); return v && typeof v === "object" ? (v as Record<string, string>) : {}; } catch { return {}; }
}

export async function saveDailyReflection(ownerId: string, day: LocalDate, body: string | null, answers: Record<string, string>) {
  const clean = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k.slice(0, 80), v.trim().slice(0, 2000)]).filter(([, v]) => v));
  return prisma.dailyReflection.upsert({
    where: { ownerId_date: { ownerId, date: localToDbDate(day) } },
    create: { ownerId, date: localToDbDate(day), bodyCipher: encrypt(body?.trim() || null), answersCipher: encrypt(JSON.stringify(clean)) },
    update: { bodyCipher: encrypt(body?.trim() || null), answersCipher: encrypt(JSON.stringify(clean)) },
  });
}

// ───────────────────────── Questions (rule-based) ─────────────────────────

export interface Answer { intent: string; title: string; lines: string[]; notes: string[]; links: { label: string; href: string }[] }

export const SUGGESTED_QUESTIONS = [
  "What's on my schedule today?", "What should I focus on this week?", "What's my next workout?", "Which goals need attention?",
  "What financial transfers are still waiting?", "When is my next projected payday?", "What did I accomplish this week?",
];

const INTENTS: { id: string; re: RegExp }[] = [
  { id: "tomorrow", re: /tomorrow/i },
  { id: "schedule", re: /schedule|today|calendar|shift|agenda/i },
  { id: "workout", re: /workout|gym|train|exercise/i },
  { id: "transfers", re: /transfer|waiting|confirm|roulette|allocat/i },
  { id: "payday", re: /pay ?day|paycheck|deposit|get paid/i },
  { id: "accomplished", re: /accomplish|achiev|did i|done this week|progress this week|wins?/i },
  { id: "goals", re: /goal|milestone|attention|behind/i },
  { id: "focus", re: /focus|priorit|this week|plan my week/i },
  { id: "roth", re: /roth|ira/i },
  { id: "schd", re: /schd|dividend|invest/i },
  { id: "extra", re: /extra|three[- ]paycheck|3[- ]paycheck/i },
];

export function matchIntent(q: string): string | null {
  return INTENTS.find((i) => i.re.test(q))?.id ?? null;
}

export async function answer(ownerId: string, tz: string, today: LocalDate, question: string): Promise<Answer> {
  const q = question.trim().slice(0, 300);
  const intent = matchIntent(q);
  const a = (title: string, lines: string[], notes: string[] = [], links: Answer["links"] = []): Answer => ({ intent: intent ?? "unknown", title, lines, notes, links });

  switch (intent) {
    case "schedule":
    case "tomorrow": {
      const day = intent === "tomorrow" ? addDays(today, 1) : today;
      const occ = await dayOccurrences(ownerId, tz, day);
      const tasks = (await loadTasks(ownerId)).filter((t) => t.status === "OPEN" && t.dueDate === day);
      const lines = [...occ.map((o) => `${o.allDay ? "All day" : `${formatInstantTime(o.start, tz)}–${formatInstantTime(o.end, tz)}`} · ${o.title}`), ...tasks.map((t) => `Task due: ${t.title}`)];
      return a(`${intent === "tomorrow" ? "Tomorrow" : "Today"} · ${formatLocalDate(day, "long")}`, lines.length ? lines : ["Nothing is scheduled. (Nothing has been added for you.)"], [], [{ label: "Open calendar", href: `/calendar?view=day&date=${day}` }]);
    }
    case "workout": {
      const occ = (await loadOccurrences(ownerId, tz, new Date(), zonedToInstant(addDays(today, 14), "00:00", tz), { includePaydays: false, includeTasks: false })).filter((o) => o.category === "WORKOUT");
      const fw = await fitnessWeek(ownerId, tz, weekOf(today), today);
      const next = occ.find((o) => o.start > new Date());
      return a("Next workout", [next ? `${formatLocalDate(instantToLocalDate(next.start, tz), "weekday")} at ${formatInstantTime(next.start, tz)} · ${next.title}` : "No workout is scheduled in the next two weeks.", `This week: ${fw.completedCount} logged of ${fw.target}${fw.reducedBy ? ` (target eased by ${fw.reducedBy} for work)` : ""}.`], ["Only logged workouts count — a scheduled one isn't counted as done."], [{ label: "Fitness", href: "/goals/fitness" }]);
    }
    case "transfers": {
      const lines = await prisma.allocationLine.findMany({ where: { status: "RESERVED", plan: { ownerId } }, include: { tile: true, plan: { select: { id: true } } }, orderBy: { createdAt: "asc" } });
      if (!lines.length) return a("Transfers waiting", ["Nothing is waiting. Every approved allocation is confirmed or released."], [], [{ label: "Money", href: "/money" }]);
      const label = (l: (typeof lines)[number]) => (l.target === "ROTH" ? `Roth IRA (tax year ${l.taxYear})` : l.target === "FUN" ? "Guilt-free money" : l.tile ? `${l.target === "SCHD_DAY" ? "SCHD Day" : l.target === "DEBT_TILE" ? "Debt tile" : "Moving-out tile"} #${l.tile.number}` : l.label ?? l.target.toLowerCase());
      return a(`${lines.length} transfer${lines.length > 1 ? "s" : ""} waiting · ${formatCents(lines.reduce((x, l) => x + l.amountCents, 0))}`, lines.slice(0, 12).map((l) => `${label(l)} · ${formatCents(l.amountCents)}`), ["Approved means reserved, not paid. LEVEL UP never moves money — confirm each one after you make it."], [...new Set(lines.map((l) => l.plan.id))].slice(0, 3).map((id) => ({ label: "Open plan", href: `/money/plans/${id}` })));
    }
    case "payday": {
      const p = await upcomingPaydays(ownerId, today, 35);
      const reg = p.find((x) => x.kind === "REGULAR" && !x.received && x.officialDate >= today);
      const ot = p.find((x) => x.kind === "OVERTIME" && !x.received && x.officialDate >= today);
      const lines = [
        reg ? `Regular: ${formatLocalDate(reg.officialDate, "weekday")} (expected deposit ${formatLocalDate(reg.expected, "weekday")}, estimate)${reg.provisional ? " — projected from your unverified anchor" : ""}` : "No upcoming regular payday found.",
        ot ? `Overtime: ${formatLocalDate(ot.officialDate, "weekday")} — only if overtime was worked` : "No upcoming overtime payday found.",
      ];
      return a("Next projected paydays", lines, ["A projected payday is not income until you record the actual deposit."], [{ label: "Regular payroll", href: "/money/payroll" }]);
    }
    case "accomplished": {
      const d = await reviewData(ownerId, tz, "WEEK", today, today);
      const lines = [
        `${d.tasks.completed} task${d.tasks.completed === 1 ? "" : "s"} completed`,
        `${d.fitness.logged} workout${d.fitness.logged === 1 ? "" : "s"} logged`,
        `${Object.values(d.faith).reduce((x, y) => x + y, 0)} faith entries`,
        ...d.goals.milestonesCompleted.map((m) => `Milestone: ${m.title}`),
        ...d.goals.completed.map((g) => `Goal completed: ${g}`),
        ...(d.relationship.completed ? [`${d.relationship.completed} date${d.relationship.completed > 1 ? "s" : ""}`] : []),
        ...(d.money.movingCents + d.money.schdCents + d.money.rothCents + d.money.debtCents > 0 ? [`Confirmed transfers: ${formatCents(d.money.movingCents + d.money.schdCents + d.money.rothCents + d.money.debtCents)} toward your challenges and Roth`] : []),
      ];
      return a(`This week · ${formatLocalDate(d.range.start, "weekday")} – ${formatLocalDate(d.range.end, "weekday")}`, lines, ["Counted only from what you logged or confirmed."], [{ label: "Weekly review", href: "/reviews" }]);
    }
    case "goals": {
      const goals = await loadGoals(ownerId, today, { status: { in: ["ACTIVE", "PAUSED", "NOT_STARTED"] } });
      const attention = goals.filter((g) => g.overdue || g.status === "PAUSED" || g.milestones.some((m) => !m.completedAt && m.dueDate && m.dueDate < addDays(today, 7)));
      if (!goals.length) return a("Goals", ["You don't have any active goals yet."], [], [{ label: "Create a goal", href: "/goals" }]);
      return a("Goals needing attention", attention.length ? attention.map((g) => `${g.title} — ${g.overdue ? "past its target date" : g.status === "PAUSED" ? "paused" : "milestone due soon"} · ${g.computed.pct === null ? g.computed.label : `${Math.round(g.computed.pct)}%`}`) : ["Nothing is overdue or due this week. 👍"], [], attention.slice(0, 3).map((g) => ({ label: g.title, href: `/goals/${g.id}` })));
    }
    case "focus": {
      const [tasks, goals, waiting] = await Promise.all([loadTasks(ownerId), loadGoals(ownerId, today, { status: "ACTIVE" }), waitingTransfers(ownerId)]);
      const end = weekOf(today).end;
      const lines = [
        ...tasks.filter((t) => t.status === "OPEN" && t.isTopThree).map((t) => `⭐ ${t.title}`),
        ...tasks.filter((t) => t.status === "OPEN" && !t.isTopThree && t.dueDate && t.dueDate <= end && t.priority === "HIGH").slice(0, 3).map((t) => `High priority: ${t.title} (${formatLocalDate(t.dueDate!, "weekday")})`),
        ...goals.flatMap((g) => g.milestones.filter((m) => !m.completedAt && m.dueDate && m.dueDate <= end).map((m) => `Milestone: ${m.title}`)).slice(0, 3),
        ...(waiting.count ? [`Confirm ${waiting.count} waiting transfer${waiting.count > 1 ? "s" : ""}`] : []),
      ];
      return a("Focus for this week", lines.length ? lines : ["Nothing urgent is recorded for this week. Star up to three tasks to set your focus."], ["Based on your starred tasks, high-priority deadlines and milestones due by Friday."], [{ label: "Tasks", href: "/tasks?view=week" }]);
    }
    case "roth": {
      const y = Number(today.slice(0, 4));
      const r = await rothRoom(prisma, ownerId, y);
      return a(`Roth IRA ${y}`, [`Confirmed: ${formatCents(r.confirmedCents)}`, `Planned (approved, not contributed): ${formatCents(r.plannedCents)}`, r.limitCents === null ? "No annual limit configured." : `Room left under your configured limit: ${formatCents(r.remainingCents ?? 0)}`], ["The limit is your own setting, not an eligibility check."], [{ label: "Roth IRA", href: "/money/roth" }]);
    }
    case "schd": {
      const s = (await challengeTotals(ownerId)).find((c) => c.kind === "SCHD");
      if (!s) return a("SCHD", ["No SCHD challenge found."]);
      return a("SCHD Investing", [`Next day: ${s.nextDay ? `Day ${s.nextDay} (${formatCents(s.nextDay * 100)})` : "complete"}`, `Confirmed contributions: ${formatCents(s.confirmedCents)} of ${formatCents(s.targetCents ?? 0)}`, `Unverified history: ${formatCents(s.provisionalCents)} (not counted)`], ["Contribution amounts only — not the market value of your shares."], [{ label: "Challenges", href: "/money/challenges" }]);
    }
    case "extra": {
      const p = await upcomingPaydays(ownerId, today, 400);
      const byMonth = new Map<string, string[]>();
      for (const x of p.filter((x) => x.kind === "REGULAR")) byMonth.set(x.officialDate.slice(0, 7), [...(byMonth.get(x.officialDate.slice(0, 7)) ?? []), x.officialDate]);
      const months = [...byMonth.entries()].filter(([, ds]) => ds.length >= 3);
      return a("Extra-paycheck months", months.length ? months.map(([m, ds]) => `${formatLocalDate(`${m}-01`).split(" ")[0]} ${m.slice(0, 4)}: ${ds.map((d) => formatLocalDate(d, "weekday")).join(", ")}${p.find((x) => x.kind === "REGULAR")?.provisional ? " (projected)" : ""}`) : ["No three-paycheck month in the next year."], ["Projected from your payroll schedule; an extra paycheck isn't automatically spare money."], [{ label: "Extra Paycheck Planner", href: "/money/extra" }]);
    }
    default:
      return { intent: "unknown", title: "I can help with these", lines: SUGGESTED_QUESTIONS, notes: ["I answer from your saved LEVEL UP records only. I don't use an AI service or the internet, and I can't change anything for you."], links: [] };
  }
}
