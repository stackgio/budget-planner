import "server-only";
import { prisma } from "./db";
import { audit } from "./audit";
import { UserError } from "./payroll";
import { decrypt, encrypt } from "./crypto";
import { IDEMPOTENCY_KEY_RE, isUniqueViolation } from "./idempotency";
import { loadOccurrences } from "./calendar";
import { type LocalDate, addDays, dateToLocal, instantToLocalDate, localToDbDate, zonedToInstant } from "@/domain/dates";
import { adjustedWeeklyTarget, alphabetProgress, dateSpending, heavyDaysIn, nextAnniversary } from "@/domain/growth";

const needKey = (k: string) => {
  if (!IDEMPOTENCY_KEY_RE.test(k)) throw new UserError("Missing request key. Refresh and try again.");
};

// ───────────────────────── Fitness ─────────────────────────

export interface WorkoutInput {
  date: LocalDate;
  title: string;
  templateId: string | null;
  eventId: string | null;
  originalStart: string | null;
  durationMin: number | null;
  effort: number | null;
  status: "COMPLETED" | "PARTIAL";
  notes: string | null;
  sets: { exerciseId: string; setNumber: number; reps: number | null; weightX100: number | null; durationSec: number | null }[];
  idempotencyKey: string;
}

/** Log a workout you did. Idempotent per key; one log per scheduled occurrence. */
export async function logWorkout(ownerId: string, i: WorkoutInput) {
  needKey(i.idempotencyKey);
  const prior = await prisma.workoutLog.findUnique({ where: { idempotencyKey: i.idempotencyKey } });
  if (prior) {
    if (prior.ownerId !== ownerId) throw new UserError("Request key already used.");
    return prior;
  }
  try {
    return await prisma.$transaction(async (tx) => {
      if (i.templateId && !(await tx.workoutTemplate.findFirst({ where: { id: i.templateId, ownerId } }))) throw new UserError("Workout template not found.");
      if (i.eventId && !(await tx.calendarEvent.findFirst({ where: { id: i.eventId, ownerId } }))) throw new UserError("Scheduled workout not found.");
      const exIds = [...new Set(i.sets.map((s) => s.exerciseId))];
      if (exIds.length && (await tx.exercise.count({ where: { ownerId, id: { in: exIds } } })) !== exIds.length) throw new UserError("Unknown exercise.");
      const log = await tx.workoutLog.create({
        data: {
          ownerId, date: localToDbDate(i.date), title: i.title, templateId: i.templateId, eventId: i.eventId,
          originalStart: i.originalStart ? new Date(i.originalStart) : null, durationMin: i.durationMin, effort: i.effort,
          status: i.status, notes: i.notes, idempotencyKey: i.idempotencyKey,
          sets: { create: i.sets.filter((s) => s.reps !== null || s.weightX100 !== null || s.durationSec !== null) },
        },
      });
      await audit(tx, ownerId, "WorkoutLog", log.id, "log", undefined, { date: i.date, title: i.title });
      return log;
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      const again = await prisma.workoutLog.findUnique({ where: { idempotencyKey: i.idempotencyKey } });
      if (again) return again;
      throw new UserError("That scheduled workout is already logged.");
    }
    throw e;
  }
}

/** Remove a mistaken log — explicit, with a full copy kept in the audit log. */
export async function removeWorkoutLog(ownerId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const log = await tx.workoutLog.findFirst({ where: { id, ownerId }, include: { sets: true } });
    if (!log) throw new UserError("Workout not found.");
    await tx.workoutLog.delete({ where: { id } });
    await audit(tx, ownerId, "WorkoutLog", id, "remove", log, undefined);
  });
}

export async function addBodyMetric(ownerId: string, i: { kind: string; valueX100: number; unit: string; measuredOn: LocalDate; note: string | null }) {
  if (!["WEIGHT", "WAIST", "CHEST", "HIPS", "ARMS", "BODY_FAT"].includes(i.kind)) throw new UserError("Unknown measurement.");
  if (!Number.isSafeInteger(i.valueX100) || i.valueX100 <= 0) throw new UserError("Enter a positive value.");
  return prisma.bodyMetric.create({ data: { ownerId, ...i, measuredOn: localToDbDate(i.measuredOn) } });
}

/** Scheduled vs logged workouts for a period, with expectations adjusted for heavy work days. */
export async function fitnessWeek(ownerId: string, tz: string, range: { start: LocalDate; end: LocalDate }, today: LocalDate) {
  const settings = await prisma.growthSettings.findUnique({ where: { ownerId } });
  const occ = (await loadOccurrences(ownerId, tz, zonedToInstant(range.start, "00:00", tz), zonedToInstant(addDays(range.end, 1), "00:00", tz), { includePaydays: false, includeTasks: false }))
    .filter((o) => o.category === "WORKOUT");
  const logs = await prisma.workoutLog.findMany({ where: { ownerId, date: { gte: localToDbDate(range.start), lte: localToDbDate(range.end) } }, orderBy: { date: "asc" } });
  const sessions = await prisma.modeSession.findMany({ where: { ownerId, mode: { not: "NORMAL" }, startedAt: { lte: zonedToInstant(addDays(range.end, 1), "00:00", tz) }, OR: [{ endedAt: null }, { endedAt: { gte: zonedToInstant(range.start, "00:00", tz) } }] } });
  const heavy = heavyDaysIn(range, sessions.map((s) => ({ startDay: instantToLocalDate(s.startedAt, tz), endDay: s.endedAt ? instantToLocalDate(s.endedAt, tz) : today })));
  const { target, reducedBy } = adjustedWeeklyTarget(settings?.workoutsPerWeek ?? 3, heavy);
  const loggedKeys = new Set(logs.filter((l) => l.eventId && l.originalStart).map((l) => `${l.eventId}|${l.originalStart!.toISOString()}`));
  const scheduled = occ.map((o) => ({
    ...o,
    day: instantToLocalDate(o.start, tz),
    logged: loggedKeys.has(`${o.eventId}|${o.originalStart.toISOString()}`),
  }));
  return {
    baseTarget: settings?.workoutsPerWeek ?? 3, target, reducedBy, heavyDays: heavy,
    logged: logs.map((l) => ({ ...l, date: dateToLocal(l.date) })),
    completedCount: logs.filter((l) => l.status === "COMPLETED").length,
    scheduled,
    // Past scheduled sessions without a log — shown as "not logged", never deleted or auto-completed.
    notLogged: scheduled.filter((s) => !s.logged && s.day < today),
  };
}

// ───────────────────────── Faith ─────────────────────────

const FAITH_KINDS = ["PRAYER", "BIBLE_READING", "REFLECTION", "GRATITUDE"] as const;

export async function addFaithEntry(ownerId: string, i: { kind: string; date: LocalDate; minutes: number | null; passage: string | null; body: string | null; idempotencyKey: string }) {
  needKey(i.idempotencyKey);
  if (!(FAITH_KINDS as readonly string[]).includes(i.kind)) throw new UserError("Unknown entry type.");
  if ((i.kind === "REFLECTION" || i.kind === "GRATITUDE") && !i.body?.trim()) throw new UserError("Write something first.");
  const prior = await prisma.faithEntry.findUnique({ where: { idempotencyKey: i.idempotencyKey } });
  if (prior) return prior;
  try {
    return await prisma.faithEntry.create({
      data: { ownerId, kind: i.kind, date: localToDbDate(i.date), minutes: i.minutes, passage: i.passage, bodyCipher: encrypt(i.body?.trim() || null), idempotencyKey: i.idempotencyKey },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return prisma.faithEntry.findUniqueOrThrow({ where: { idempotencyKey: i.idempotencyKey } });
    throw e;
  }
}

export async function listFaith(ownerId: string, from: LocalDate, to: LocalDate) {
  const rows = await prisma.faithEntry.findMany({ where: { ownerId, date: { gte: localToDbDate(from), lte: localToDbDate(to) } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
  return rows.map((r) => ({ id: r.id, kind: r.kind, date: dateToLocal(r.date), minutes: r.minutes, passage: r.passage, body: decrypt(r.bodyCipher) }));
}

export async function saveReminderPreference(ownerId: string, key: string, time: string, days: number[], enabled: boolean) {
  if (!/^[a-z.]{3,40}$/.test(key)) throw new UserError("Invalid reminder.");
  return prisma.reminderPreference.upsert({ where: { ownerId_key: { ownerId, key } }, create: { ownerId, key, time, days, enabled }, update: { time, days, enabled } });
}

// ───────────────────────── Relationship ─────────────────────────

export interface DatePlanInput {
  title: string;
  date: LocalDate;
  startTime: string | null;
  durationMin: number;
  budgetCents: number | null;
  letter: string | null;
  notes: string | null;
}

/** Plan a date: creates the plan and its calendar event in one transaction. Never books or buys anything. */
export async function planDate(ownerId: string, tz: string, i: DatePlanInput) {
  return prisma.$transaction(async (tx) => {
    if (i.letter) {
      const entry = await tx.alphabetEntry.findUnique({ where: { ownerId_letter: { ownerId, letter: i.letter } } });
      if (!entry) throw new UserError("Unknown letter.");
      if (entry.status === "COMPLETED") throw new UserError(`${i.letter} is already completed.`);
      if (entry.datePlanId) throw new UserError(`${i.letter} already has a planned date. Postpone or cancel that one first.`);
    }
    const plan = await tx.datePlan.create({
      data: { ownerId, title: i.title, date: localToDbDate(i.date), startTime: i.startTime, budgetCents: i.budgetCents, letter: i.letter, notesCipher: encrypt(i.notes) },
    });
    const startAt = zonedToInstant(i.date, i.startTime ?? "18:30", tz);
    const ev = await tx.calendarEvent.create({
      data: {
        ownerId, title: i.letter ? `Date night · ${i.letter}: ${i.title}` : `Date night · ${i.title}`, category: "DATE_NIGHT", startAt,
        endAt: new Date(startAt.getTime() + i.durationMin * 60_000), allDay: false, timezone: tz, optional: false, sourceType: "DATE_PLAN", sourceId: plan.id,
      },
    });
    await tx.datePlan.update({ where: { id: plan.id }, data: { eventId: ev.id } });
    if (i.letter) await tx.alphabetEntry.update({ where: { ownerId_letter: { ownerId, letter: i.letter } }, data: { status: "PLANNED", datePlanId: plan.id, activity: i.title, estBudgetCents: i.budgetCents } });
    await audit(tx, ownerId, "DatePlan", plan.id, "plan", undefined, { title: i.title, date: i.date, letter: i.letter });
    return plan;
  });
}

/** Explicitly mark a date as done. Cost is recorded once: manual amount OR a linked confirmed payment. */
export async function completeDate(ownerId: string, planId: string, cost: { actualCostCents: number | null; paymentId: string | null }, today?: LocalDate) {
  if (cost.actualCostCents !== null && cost.paymentId) throw new UserError("Record the cost manually or link a payment — not both.");
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "DatePlan" WHERE id = ${planId} AND "ownerId" = ${ownerId} FOR UPDATE`;
    const plan = await tx.datePlan.findFirst({ where: { id: planId, ownerId } });
    if (!plan) throw new UserError("Date not found.");
    if (plan.status === "COMPLETED") return plan;
    if (plan.status === "CANCELLED") throw new UserError("This date was cancelled.");
    if (today && dateToLocal(plan.date) > today) throw new UserError("This date hasn't happened yet. Mark it done on or after the day.");
    if (cost.paymentId) {
      const p = await tx.payment.findFirst({ where: { id: cost.paymentId, ownerId, reversedAt: null, reversalOfId: null } });
      if (!p) throw new UserError("Payment not found.");
    }
    if (cost.actualCostCents !== null && (!Number.isSafeInteger(cost.actualCostCents) || cost.actualCostCents < 0)) throw new UserError("Cost must be zero or more.");
    const after = await tx.datePlan.update({ where: { id: planId }, data: { status: "COMPLETED", completedAt: new Date(), actualCostCents: cost.actualCostCents, paymentId: cost.paymentId } });
    if (plan.letter) await tx.alphabetEntry.updateMany({ where: { ownerId, letter: plan.letter, datePlanId: plan.id }, data: { status: "COMPLETED", completedAt: new Date() } });
    await audit(tx, ownerId, "DatePlan", planId, "complete", { status: plan.status }, { status: "COMPLETED", actualCostCents: cost.actualCostCents, paymentId: cost.paymentId });
    return after;
  });
}

/** Postpone (new date) or cancel. History stays: the plan row is kept and the change is audited. */
export async function changeDate(ownerId: string, tz: string, planId: string, change: { status: "POSTPONED" | "CANCELLED"; newDate?: LocalDate | null; newTime?: string | null }) {
  return prisma.$transaction(async (tx) => {
    const plan = await tx.datePlan.findFirst({ where: { id: planId, ownerId } });
    if (!plan) throw new UserError("Date not found.");
    if (plan.status === "COMPLETED") throw new UserError("This date is already completed.");
    if (change.status === "POSTPONED" && change.newDate) {
      const time = change.newTime ?? plan.startTime ?? "18:30";
      const after = await tx.datePlan.update({ where: { id: planId }, data: { date: localToDbDate(change.newDate), startTime: time, status: "PLANNED" } });
      if (plan.eventId) {
        const ev = await tx.calendarEvent.findFirst({ where: { id: plan.eventId, ownerId } });
        if (ev) {
          const start = zonedToInstant(change.newDate, time, tz);
          await tx.calendarEvent.update({ where: { id: ev.id }, data: { startAt: start, endAt: new Date(start.getTime() + (ev.endAt.getTime() - ev.startAt.getTime())) } });
        }
      }
      await audit(tx, ownerId, "DatePlan", planId, "postpone", { date: dateToLocal(plan.date), time: plan.startTime }, { date: change.newDate, time });
      return after;
    }
    const after = await tx.datePlan.update({ where: { id: planId }, data: { status: change.status } });
    if (plan.eventId) await tx.calendarEvent.deleteMany({ where: { id: plan.eventId, ownerId } });
    await tx.datePlan.update({ where: { id: planId }, data: { eventId: null } });
    if (plan.letter) await tx.alphabetEntry.updateMany({ where: { ownerId, letter: plan.letter, datePlanId: plan.id }, data: { status: "OPEN", datePlanId: null } });
    await audit(tx, ownerId, "DatePlan", planId, change.status.toLowerCase(), { status: plan.status }, { status: change.status });
    return after;
  });
}

export async function updateAlphabetEntry(ownerId: string, letter: string, i: { activity: string | null; estBudgetCents: number | null; notes: string | null; skip?: boolean }) {
  const e = await prisma.alphabetEntry.findUnique({ where: { ownerId_letter: { ownerId, letter } } });
  if (!e) throw new UserError("Unknown letter.");
  if (e.status === "COMPLETED") throw new UserError(`${letter} is completed. Its history is kept as-is.`);
  const status = i.skip === true ? "SKIPPED" : i.skip === false && e.status === "SKIPPED" ? "OPEN" : e.status;
  return prisma.alphabetEntry.update({ where: { id: e.id }, data: { activity: i.activity, estBudgetCents: i.estBudgetCents, notes: i.notes, status } });
}

export async function relationshipOverview(ownerId: string, today: LocalDate) {
  const [plans, alphabet, important, ideas, notes, settings] = await Promise.all([
    prisma.datePlan.findMany({ where: { ownerId }, include: { payment: true }, orderBy: { date: "desc" } }),
    prisma.alphabetEntry.findMany({ where: { ownerId }, orderBy: { letter: "asc" } }),
    prisma.importantDate.findMany({ where: { ownerId } }),
    prisma.dateIdea.findMany({ where: { ownerId, archived: false }, orderBy: { title: "asc" } }),
    prisma.relationshipNote.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.growthSettings.findUnique({ where: { ownerId } }),
  ]);
  const view = plans.map((p) => ({
    id: p.id, title: p.title, date: dateToLocal(p.date), startTime: p.startTime, status: p.status, budgetCents: p.budgetCents,
    actualCostCents: p.actualCostCents, linkedPaymentCents: p.payment ? p.payment.amountCents : null, letter: p.letter, notes: decrypt(p.notesCipher), completedAt: p.completedAt,
  }));
  return {
    settings,
    upcoming: view.filter((p) => p.status === "PLANNED" && p.date >= today).sort((a, b) => a.date.localeCompare(b.date)),
    past: view.filter((p) => p.status !== "PLANNED" || p.date < today),
    alphabet, alphabetProgress: alphabetProgress(alphabet),
    importantDates: important.map((d) => ({ ...d, next: nextAnniversary(d.month, d.day, today) })).sort((a, b) => a.next.localeCompare(b.next)),
    ideas,
    notes: notes.map((n) => ({ id: n.id, createdAt: n.createdAt, body: decrypt(n.bodyCipher) })),
    spending: dateSpending(view),
  };
}
