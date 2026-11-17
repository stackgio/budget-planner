import "server-only";
import { prisma } from "./db";
import { challengeTotals, ledgerOverview } from "./ledger";
import { loadExtraMonths } from "./extra";
import { gigSummary } from "./gig";
import { type LocalDate, dateToLocal, localToDbDate, monthKey, zonedToInstant, addDays } from "@/domain/dates";
import { type Period, elapsedDays, monthsIn, weeksIn } from "@/domain/periods";
import { countByWeek, habitActivity, incomeBreakdown, incomeByMonth, netPayments, share, trendMonths, type DepositRow } from "@/domain/analytics";

/**
 * Analytics for one period, from stored records only. Date boundaries are the user's local dates.
 * `since` (account start) keeps denominators honest: days before you used LEVEL UP don't count as missed.
 */
export async function loadAnalytics(ownerId: string, period: Period, today: LocalDate, tz: string, since: LocalDate) {
  const { from, to } = period;
  const dbRange = { gte: localToDbDate(from), lte: localToDbDate(to) };
  const months = monthsIn(from, to);
  const trend = trendMonths(months, to);
  const trendFrom = `${trend[0]}-01`;
  const instantFrom = zonedToInstant(from, "00:00", tz), instantTo = zonedToInstant(addDays(to, 1), "00:00", tz);

  const [deposits, payments, projected, overview, totals, extra, gig,
    workouts, goalsDone, goalsActive, milestonesDue, milestonesDone, habits, faith, dates, activity, jobsApplied, coursesDone] = await Promise.all([
    prisma.incomeDeposit.findMany({ where: { ownerId, voidedAt: null, actualDepositDate: { gte: localToDbDate(trendFrom < from ? trendFrom : from), lte: localToDbDate(to) } }, select: { kind: true, actualDepositDate: true, netCents: true } }),
    prisma.payment.findMany({ where: { ownerId, paidOn: dbRange }, select: { kind: true, amountCents: true, source: true } }),
    prisma.payday.count({ where: { ownerId, status: "EXPECTED", deposits: { none: { voidedAt: null } }, expectedDepositDate: dbRange } }),
    ledgerOverview(ownerId),
    challengeTotals(ownerId),
    loadExtraMonths(ownerId),
    gigSummary(ownerId, from, to),
    prisma.workoutLog.findMany({ where: { ownerId, date: dbRange }, select: { date: true, status: true } }),
    prisma.goal.count({ where: { ownerId, status: "COMPLETED", completedAt: { gte: instantFrom, lt: instantTo } } }),
    prisma.goal.count({ where: { ownerId, status: { in: ["ACTIVE", "NOT_STARTED", "PAUSED"] } } }),
    prisma.goalMilestone.count({ where: { goal: { ownerId }, archivedAt: null, dueDate: dbRange } }),
    prisma.goalMilestone.count({ where: { goal: { ownerId }, archivedAt: null, completedAt: { gte: instantFrom, lt: instantTo } } }),
    prisma.habit.findMany({ where: { ownerId, archived: false }, include: { checkIns: { where: { date: dbRange }, select: { date: true } } }, orderBy: { sortOrder: "asc" } }),
    prisma.faithEntry.findMany({ where: { ownerId, date: dbRange }, select: { kind: true, date: true } }),
    prisma.datePlan.findMany({ where: { ownerId, date: dbRange }, select: { status: true } }),
    prisma.activityLog.findMany({ where: { ownerId, date: dbRange }, select: { kind: true } }),
    prisma.jobOpportunity.count({ where: { ownerId, appliedOn: dbRange } }),
    prisma.eduCourse.count({ where: { ownerId, status: "COMPLETED", archivedAt: null } }), // courses have no completion date: all-time
  ]);

  const rows: DepositRow[] = deposits.map((d) => ({ kind: d.kind, date: dateToLocal(d.actualDepositDate), netCents: d.netCents }));
  const income = incomeBreakdown(rows, from, to);
  const days = elapsedDays(from, to, today, since);
  const weeks = weeksIn(from, to);
  const completedWorkouts = workouts.filter((w) => w.status === "COMPLETED").map((w) => dateToLocal(w.date));
  const byKind = <T extends { kind: string }>(xs: T[]) => xs.reduce<Record<string, number>>((a, x) => ((a[x.kind] = (a[x.kind] ?? 0) + 1), a), {});
  const extraInRange = extra.months.filter((m) => m.month >= monthKey(from) && m.month <= monthKey(to));

  return {
    period, elapsedDays: days,
    finance: {
      income,
      projectedUnconfirmedPaydays: projected,
      trend: incomeByMonth(rows, trend),
      challengeContributionsCents: netPayments(payments, ["SAVINGS_TRANSFER", "INVESTMENT_CONTRIBUTION", "DEBT_PAYMENT"]),
      rothCents: netPayments(payments, ["ROTH_CONTRIBUTION"]),
      allocationsConfirmedCents: netPayments(payments, ["ROTH_CONTRIBUTION", "SAVINGS_TRANSFER", "INVESTMENT_CONTRIBUTION", "DEBT_PAYMENT", "FUN_MONEY", "EMERGENCY_SAVINGS", "GOAL_TRANSFER"]),
      historicalImportCents: payments.filter((p) => p.source === "HISTORICAL_IMPORT").reduce((a, p) => a + p.amountCents, 0),
      balances: { availableCents: overview.availableCents, reservedCents: overview.reservedCents },
      challenges: totals.map((c) => ({ kind: c.kind, name: c.name, status: c.status, confirmedCents: c.confirmedCents, targetCents: c.targetCents, completedTiles: c.completedTiles, tileCount: c.tileCount })),
      extraMonths: extraInRange.map((m) => ({ month: m.month, paydays: m.paydays.length, received: m.receivedCount, verified: extra.verified })),
      gig: { earningsCents: gig.totals.earningsCents, payoutsCents: gig.payoutsCents, estProfitCents: gig.totals.estProfitCents, minutes: gig.totals.minutes },
    },
    growth: {
      workouts: { completed: completedWorkouts.length, partial: workouts.length - completedWorkouts.length, byWeek: countByWeek(completedWorkouts, weeks) },
      goals: { completed: goalsDone, open: goalsActive },
      milestones: { dueInPeriod: milestonesDue, completedInPeriod: milestonesDone },
      habits: habits.map((h) => ({ name: h.name, emoji: h.emoji, targetPerWeek: h.targetPerWeek, ...habitActivity(h.checkIns.length, h.targetPerWeek, days) })),
      faith: { total: faith.length, byKind: byKind(faith) },
      relationship: { completed: dates.filter((d) => d.status === "COMPLETED").length, planned: dates.length, share: share(dates.filter((d) => d.status === "COMPLETED").length, dates.filter((d) => d.status !== "CANCELLED").length) },
      learning: { activities: activity.length, byKind: byKind(activity), jobsApplied, coursesCompleted: coursesDone },
    },
  };
}
export type Analytics = Awaited<ReturnType<typeof loadAnalytics>>;
