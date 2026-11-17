import "server-only";
import { prisma } from "./db";
import { encrypt, readPrivate } from "./crypto";
import { UserError } from "./payroll";
import { challengeTotals } from "./ledger";
import { fitnessWeek } from "./life";
import { loadGoals } from "./growth";
import { type LocalDate, addDays, dateToLocal, localToDbDate, zonedToInstant } from "@/domain/dates";
import { alphabetProgress, monthOf, weekOf } from "@/domain/growth";

export type ReviewKind = "WEEK" | "MONTH";

export function periodFor(kind: ReviewKind, anyDay: LocalDate) {
  return kind === "WEEK" ? weekOf(anyDay) : monthOf(anyDay);
}

/** Every number here is read from stored records for the period. Nothing is estimated or invented. */
export async function reviewData(ownerId: string, tz: string, kind: ReviewKind, anyDay: LocalDate, today: LocalDate) {
  const range = periodFor(kind, anyDay);
  const from = localToDbDate(range.start), to = localToDbDate(range.end);
  const fromI = zonedToInstant(range.start, "00:00", tz), toI = zonedToInstant(addDays(range.end, 1), "00:00", tz);

  const [goals, tasksDone, tasksOpenDue, checkIns, faith, dates, activity, payments, deposits, milestonesDone, alphabet, jobsApplied, saved] = await Promise.all([
    loadGoals(ownerId, today, { status: { not: "ARCHIVED" } }),
    prisma.task.count({ where: { ownerId, status: "DONE", completedAt: { gte: fromI, lt: toI } } }),
    prisma.task.count({ where: { ownerId, status: "OPEN", dueDate: { gte: from, lte: to } } }),
    prisma.habitCheckIn.findMany({ where: { habit: { ownerId }, date: { gte: from, lte: to } }, include: { habit: { select: { name: true } } } }),
    prisma.faithEntry.groupBy({ by: ["kind"], where: { ownerId, date: { gte: from, lte: to } }, _count: true }),
    prisma.datePlan.findMany({ where: { ownerId, date: { gte: from, lte: to } } }),
    prisma.activityLog.groupBy({ by: ["kind"], where: { ownerId, date: { gte: from, lte: to } }, _sum: { minutes: true } }),
    prisma.payment.findMany({ where: { ownerId, paidOn: { gte: from, lte: to } } }),
    prisma.incomeDeposit.findMany({ where: { ownerId, voidedAt: null, actualDepositDate: { gte: from, lte: to } } }),
    prisma.goalMilestone.findMany({ where: { goal: { ownerId }, completedAt: { gte: fromI, lt: toI } }, include: { goal: { select: { title: true, category: true } } } }),
    prisma.alphabetEntry.findMany({ where: { ownerId } }),
    prisma.jobOpportunity.count({ where: { ownerId, appliedOn: { gte: from, lte: to } } }),
    prisma.review.findUnique({ where: { ownerId_kind_periodStart: { ownerId, kind, periodStart: from } } }),
  ]);

  const fitness = kind === "WEEK" ? await fitnessWeek(ownerId, tz, range, today) : null;
  const workoutsInPeriod = await prisma.workoutLog.findMany({ where: { ownerId, date: { gte: from, lte: to } }, select: { date: true, status: true } });
  // Monthly consistency: share of Sat–Fri weeks in the month with at least one logged workout.
  const weeks = new Map<string, number>();
  for (let d = range.start; d <= range.end; d = addDays(d, 1)) weeks.set(weekOf(d).start, 0);
  for (const w of workoutsInPeriod) { const k = weekOf(dateToLocal(w.date)).start; weeks.set(k, (weeks.get(k) ?? 0) + 1); }

  const habitTotals = new Map<string, number>();
  for (const c of checkIns) habitTotals.set(c.habit.name, (habitTotals.get(c.habit.name) ?? 0) + 1);
  const sumKind = (k: string) => payments.filter((p) => p.kind === k).reduce((a, p) => a + p.amountCents, 0);
  const totals = await challengeTotals(ownerId);

  const completedGoals = goals.filter((g) => g.completedAt && g.completedAt >= fromI && g.completedAt < toI);
  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const overdueMilestones = goals.flatMap((g) => g.milestones.filter((m) => !m.completedAt && m.dueDate && m.dueDate < today).map((m) => ({ goal: g.title, title: m.title, dueDate: m.dueDate! })));
  const nextRange = { start: addDays(range.end, 1), end: addDays(range.end, kind === "WEEK" ? 7 : 31) };
  const [upcomingTasks, upcomingDates] = await Promise.all([
    prisma.task.findMany({ where: { ownerId, status: "OPEN", parentId: null, dueDate: { gte: localToDbDate(nextRange.start), lte: localToDbDate(nextRange.end) } }, orderBy: [{ priority: "asc" }, { dueDate: "asc" }], take: 6 }),
    prisma.datePlan.findMany({ where: { ownerId, status: "PLANNED", date: { gte: localToDbDate(nextRange.start), lte: localToDbDate(nextRange.end) } }, orderBy: { date: "asc" }, take: 3 }),
  ]);

  const attention: string[] = [];
  if (overdueMilestones.length) attention.push(`${overdueMilestones.length} overdue milestone${overdueMilestones.length > 1 ? "s" : ""}`);
  if (tasksOpenDue) attention.push(`${tasksOpenDue} task${tasksOpenDue > 1 ? "s" : ""} due this period still open`);
  const paused = goals.filter((g) => g.status === "PAUSED").length;
  if (paused) attention.push(`${paused} paused goal${paused > 1 ? "s" : ""}`);
  if (fitness && fitness.notLogged.length) attention.push(`${fitness.notLogged.length} scheduled workout${fitness.notLogged.length > 1 ? "s" : ""} not logged`);
  const waiting = await prisma.allocationLine.count({ where: { status: "RESERVED", plan: { ownerId } } });
  if (waiting) attention.push(`${waiting} approved money allocation${waiting > 1 ? "s" : ""} waiting for your transfer`);

  return {
    kind, range,
    goals: {
      active: activeGoals.length, completed: completedGoals.map((g) => g.title),
      dueThisPeriodOpen: goals.filter((g) => g.targetDate && g.targetDate >= range.start && g.targetDate <= range.end && g.status !== "COMPLETED").map((g) => g.title),
      yearly: goals.filter((g) => g.horizon === "YEAR").map((g) => ({ title: g.title, pct: g.computed.pct, label: g.computed.label, status: g.status })),
      milestonesCompleted: milestonesDone.map((m) => ({ title: m.title, goal: m.goal.title, category: m.goal.category })),
      overdueMilestones,
    },
    tasks: { completed: tasksDone, openDue: tasksOpenDue },
    habits: [...habitTotals.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    fitness: {
      logged: workoutsInPeriod.filter((w) => w.status === "COMPLETED").length,
      partial: workoutsInPeriod.filter((w) => w.status === "PARTIAL").length,
      target: fitness?.target ?? null, baseTarget: fitness?.baseTarget ?? null, reducedBy: fitness?.reducedBy ?? 0,
      notLogged: fitness?.notLogged.length ?? 0,
      weeksWithWorkout: [...weeks.values()].filter((n) => n > 0).length, weeks: weeks.size,
    },
    faith: Object.fromEntries(faith.map((f) => [f.kind, f._count])) as Record<string, number>,
    relationship: {
      completed: dates.filter((d) => d.status === "COMPLETED").length,
      planned: dates.filter((d) => d.status === "PLANNED").length,
      alphabet: alphabetProgress(alphabet),
    },
    growth: Object.fromEntries(activity.map((a) => [a.kind, a._sum.minutes ?? 0])) as Record<string, number>,
    career: { applied: jobsApplied },
    money: {
      regularCents: deposits.filter((d) => d.kind === "REGULAR").reduce((a, d) => a + d.netCents, 0),
      overtimeCents: deposits.filter((d) => d.kind === "OVERTIME").reduce((a, d) => a + d.netCents, 0),
      movingCents: sumKind("SAVINGS_TRANSFER"), schdCents: sumKind("INVESTMENT_CONTRIBUTION"), debtCents: sumKind("DEBT_PAYMENT"),
      rothCents: sumKind("ROTH_CONTRIBUTION"), emergencyCents: sumKind("EMERGENCY_SAVINGS"),
      challenges: totals.map((c) => ({ name: c.name, status: c.status, confirmedCents: c.confirmedCents, targetCents: c.targetCents })),
    },
    upcoming: {
      tasks: upcomingTasks.map((t) => ({ title: t.title, dueDate: t.dueDate ? dateToLocal(t.dueDate) : null })),
      dates: upcomingDates.map((d) => ({ title: d.title, date: dateToLocal(d.date) })),
    },
    attention,
    saved: saved ? { reflection: readPrivate(saved.reflectionCipher), priorities: saved.priorities, updatedAt: saved.updatedAt } : null,
  };
}

export async function saveReview(ownerId: string, kind: ReviewKind, anyDay: LocalDate, reflection: string | null, priorities: string[]) {
  const clean = priorities.map((p) => p.trim()).filter(Boolean).slice(0, 5);
  if (clean.some((p) => p.length > 120)) throw new UserError("Keep each priority under 120 characters.");
  const periodStart = localToDbDate(periodFor(kind, anyDay).start);
  return prisma.review.upsert({
    where: { ownerId_kind_periodStart: { ownerId, kind, periodStart } },
    create: { ownerId, kind, periodStart, reflectionCipher: encrypt(reflection?.trim() || null), priorities: clean },
    update: { reflectionCipher: encrypt(reflection?.trim() || null), priorities: clean },
  });
}
