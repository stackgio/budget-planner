import "server-only";
import { Prisma, type GoalCategory, type GoalHorizon, type GoalStatus, type Priority, type ProgressSource } from "@prisma/client";
import { prisma } from "./db";
import { audit } from "./audit";
import { UserError } from "./payroll";
import { encrypt } from "./crypto";
import { IDEMPOTENCY_KEY_RE, isUniqueViolation } from "./idempotency";
import { challengeTotals } from "./ledger";
import { type LocalDate, addDays, dateToLocal, localToDbDate } from "@/domain/dates";
import { LETTERS, goalProgress } from "@/domain/growth";

type Tx = Prisma.TransactionClient;

// ───────────────────────── First-use defaults (templates & reference lists only) ─────────────────────────

const STARTER_EXERCISES: [string, string, string, string][] = [
  ["Incline push-up", "UPPER", "BODYWEIGHT", "Hands on a counter or bench. Lower the bench height as you get stronger."],
  ["Bodyweight squat", "LOWER", "BODYWEIGHT", "Sit back to a chair if needed. Knees track over toes."],
  ["Glute bridge", "LOWER", "BODYWEIGHT", "Squeeze at the top for a second."],
  ["Dumbbell row", "UPPER", "DUMBBELL", "Support yourself on a bench; pull to the hip."],
  ["Dumbbell shoulder press", "UPPER", "DUMBBELL", "Start light. Stop if shoulders pinch."],
  ["Reverse lunge", "LOWER", "BODYWEIGHT", "Hold a wall for balance at first."],
  ["Plank", "CORE", "BODYWEIGHT", "Knees down is fine. Keep a straight line."],
  ["Dead bug", "CORE", "BODYWEIGHT", "Slow and controlled; low back stays down."],
  ["Band pull-apart", "UPPER", "BAND", "Light band, shoulders down."],
  ["Brisk walk", "CARDIO", "BODYWEIGHT", "Conversational pace."],
  ["Hip flexor stretch", "MOBILITY", "BODYWEIGHT", "Gentle; 30 seconds per side."],
];

const STARTER_TEMPLATES: { name: string; items: [string, number, string][] }[] = [
  { name: "Full Body A (beginner)", items: [["Bodyweight squat", 3, "8–12"], ["Incline push-up", 3, "6–10"], ["Dumbbell row", 3, "8–12"], ["Plank", 2, "20–30 s"]] },
  { name: "Full Body B (beginner)", items: [["Reverse lunge", 3, "6–8 / side"], ["Dumbbell shoulder press", 3, "8–10"], ["Glute bridge", 3, "10–15"], ["Dead bug", 2, "6–8 / side"]] },
  { name: "Recovery day (light)", items: [["Brisk walk", 1, "20–30 min"], ["Hip flexor stretch", 2, "30 s / side"], ["Band pull-apart", 2, "12–15"]] },
];

/** Idempotent. Creates settings and reference lists the first time a Phase 3 page is opened. */
export async function ensureGrowthDefaults(ownerId: string) {
  const existing = await prisma.growthSettings.findUnique({ where: { ownerId } });
  await prisma.alphabetEntry.createMany({ data: LETTERS.map((letter) => ({ ownerId, letter })), skipDuplicates: true });
  if (existing) return existing;
  try {
    return await prisma.$transaction(async (tx) => {
      const settings = await tx.growthSettings.create({ data: { ownerId } });
      await tx.exercise.createMany({ data: STARTER_EXERCISES.map(([name, category, equipment, cues]) => ({ ownerId, name, category, equipment, cues })), skipDuplicates: true });
      const ex = await tx.exercise.findMany({ where: { ownerId } });
      for (const t of STARTER_TEMPLATES) {
        await tx.workoutTemplate.create({
          data: {
            ownerId, name: t.name, notes: "Starter template — edit freely. Start light; stop if anything hurts.",
            items: { create: t.items.map(([name, sets, reps], i) => ({ exerciseId: ex.find((e) => e.name === name)!.id, sets, reps, restSec: 60, sortOrder: i })) },
          },
        });
      }
      // Programs you said you're exploring — status RESEARCHING; nothing implies enrollment or admission.
      await tx.eduProgram.createMany({
        data: [
          { ownerId, name: "Criminal Justice", institution: "Valencia College", credential: "A.S." },
          { ownerId, name: "Criminal Justice — Experiential Learning pathway", institution: "Valencia College", credential: "A.S." },
          { ownerId, name: "Public Safety Administration", institution: "Valencia College", credential: "B.A.S. (possible later option)" },
        ],
      });
      await tx.careerProfile.create({ data: { ownerId, employer: "Florida Department of Corrections", title: "Correctional Officer" } });
      return settings;
    });
  } catch (e) {
    if (isUniqueViolation(e)) return prisma.growthSettings.findUniqueOrThrow({ where: { ownerId } });
    throw e;
  }
}

// ───────────────────────── Goals ─────────────────────────

export interface GoalInput {
  title: string;
  description: string | null;
  category: GoalCategory;
  horizon: GoalHorizon;
  priority: Priority;
  startDate: LocalDate;
  targetDate: LocalDate | null;
  unit: string | null;
  targetX100: number | null;
  source: ProgressSource;
  challengeId: string | null;
  habitId: string | null;
  activityKind: string | null;
  notes: string | null;
}

async function validateLinks(tx: Tx, ownerId: string, i: GoalInput) {
  if (i.targetDate && i.targetDate < i.startDate) throw new UserError("Target date can't be before the start date.");
  if (i.source === "CHALLENGE") {
    if (!i.challengeId) throw new UserError("Choose which financial challenge this goal follows.");
    if (!(await tx.challenge.findFirst({ where: { id: i.challengeId, ownerId } }))) throw new UserError("Challenge not found.");
  }
  if (i.source === "HABIT") {
    if (!i.habitId) throw new UserError("Choose a habit.");
    if (!(await tx.habit.findFirst({ where: { id: i.habitId, ownerId } }))) throw new UserError("Habit not found.");
  }
  if (i.source === "ACTIVITY" && !i.activityKind) throw new UserError("Choose which kind of logged time counts.");
  if (["MANUAL", "HABIT", "CHALLENGE", "WORKOUTS", "ACTIVITY"].includes(i.source) && i.source !== "MANUAL" && !i.targetX100) throw new UserError("Add a measurable target for this kind of goal.");
}

function goalData(i: GoalInput) {
  return {
    title: i.title, description: i.description, category: i.category, horizon: i.horizon, priority: i.priority,
    startDate: localToDbDate(i.startDate), targetDate: i.targetDate ? localToDbDate(i.targetDate) : null,
    unit: i.unit, targetX100: i.targetX100, source: i.source,
    challengeId: i.source === "CHALLENGE" ? i.challengeId : null, habitId: i.source === "HABIT" ? i.habitId : null,
    activityKind: i.source === "ACTIVITY" ? i.activityKind : null, notesCipher: encrypt(i.notes),
  };
}

export async function createGoal(ownerId: string, i: GoalInput, milestones: { title: string; dueDate: LocalDate | null }[] = []) {
  return prisma.$transaction(async (tx) => {
    await validateLinks(tx, ownerId, i);
    const g = await tx.goal.create({
      data: { ownerId, ...goalData(i), status: "ACTIVE", milestones: { create: milestones.map((m, idx) => ({ title: m.title, dueDate: m.dueDate ? localToDbDate(m.dueDate) : null, sortOrder: idx })) } },
    });
    await audit(tx, ownerId, "Goal", g.id, "create", undefined, { title: g.title, category: g.category });
    return g;
  });
}

export async function updateGoal(ownerId: string, id: string, i: GoalInput) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.goal.findFirst({ where: { id, ownerId } });
    if (!before) throw new UserError("Goal not found.");
    await validateLinks(tx, ownerId, i);
    const after = await tx.goal.update({ where: { id }, data: goalData(i) });
    await audit(tx, ownerId, "Goal", id, "update", { title: before.title, status: before.status }, { title: after.title });
    return after;
  });
}

export async function setGoalStatus(ownerId: string, id: string, status: GoalStatus) {
  return prisma.$transaction(async (tx) => {
    const g = await tx.goal.findFirst({ where: { id, ownerId } });
    if (!g) throw new UserError("Goal not found.");
    if (g.status === status) return g;
    const after = await tx.goal.update({ where: { id }, data: { status, completedAt: status === "COMPLETED" ? new Date() : status === "ARCHIVED" ? g.completedAt : null } });
    await audit(tx, ownerId, "Goal", id, `status:${status}`, { status: g.status }, { status });
    return after;
  });
}

async function ownedGoal(tx: Tx, ownerId: string, goalId: string) {
  const g = await tx.goal.findFirst({ where: { id: goalId, ownerId } });
  if (!g) throw new UserError("Goal not found.");
  return g;
}

export async function addMilestone(ownerId: string, goalId: string, title: string, dueDate: LocalDate | null) {
  return prisma.$transaction(async (tx) => {
    await ownedGoal(tx, ownerId, goalId);
    const n = await tx.goalMilestone.count({ where: { goalId } });
    return tx.goalMilestone.create({ data: { goalId, title, dueDate: dueDate ? localToDbDate(dueDate) : null, sortOrder: n } });
  });
}

/** Explicit tap only. Un-completing is allowed and recorded in the audit log. */
export async function setMilestoneDone(ownerId: string, milestoneId: string, done: boolean) {
  return prisma.$transaction(async (tx) => {
    const m = await tx.goalMilestone.findFirst({ where: { id: milestoneId, goal: { ownerId } } });
    if (!m) throw new UserError("Milestone not found.");
    if (!!m.completedAt === done) return m;
    const after = await tx.goalMilestone.update({ where: { id: m.id }, data: { completedAt: done ? new Date() : null } });
    await audit(tx, ownerId, "GoalMilestone", m.id, done ? "complete" : "reopen", { completedAt: m.completedAt }, { completedAt: after.completedAt });
    return after;
  });
}

/** Manual progress update — appended to history, never overwrites earlier entries. Idempotent per key. */
export async function addGoalProgress(ownerId: string, goalId: string, valueX100: number, recordedOn: LocalDate, note: string | null, idempotencyKey: string) {
  if (!IDEMPOTENCY_KEY_RE.test(idempotencyKey)) throw new UserError("Missing request key. Refresh and try again.");
  if (!Number.isSafeInteger(valueX100) || valueX100 < 0) throw new UserError("Enter a value of zero or more.");
  const prior = await prisma.goalProgress.findUnique({ where: { idempotencyKey } });
  if (prior) {
    if (prior.goalId !== goalId) throw new UserError("This update was already used for a different goal.");
    return prior;
  }
  return prisma.$transaction(async (tx) => {
    const g = await ownedGoal(tx, ownerId, goalId);
    if (g.source !== "MANUAL") throw new UserError("This goal's progress comes from your records, not manual updates.");
    return tx.goalProgress.create({ data: { goalId, valueX100, recordedOn: localToDbDate(recordedOn), note, idempotencyKey } });
  }).catch(async (e) => {
    if (isUniqueViolation(e)) return prisma.goalProgress.findUniqueOrThrow({ where: { idempotencyKey } });
    throw e;
  });
}

export async function linkTaskToGoal(ownerId: string, taskId: string, goalId: string | null) {
  const t = await prisma.task.findFirst({ where: { id: taskId, ownerId } });
  if (!t) throw new UserError("Task not found.");
  if (goalId) await ownedGoal(prisma, ownerId, goalId);
  return prisma.task.update({ where: { id: taskId }, data: { goalId } });
}

/** Goals with progress derived from real records. */
export async function loadGoals(ownerId: string, today: LocalDate, where: Prisma.GoalWhereInput = {}) {
  const goals = await prisma.goal.findMany({
    where: { ownerId, ...where },
    include: { milestones: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }, progress: { orderBy: { recordedOn: "asc" } }, tasks: { select: { id: true, title: true, status: true, dueDate: true } } },
    orderBy: [{ status: "asc" }, { targetDate: "asc" }, { createdAt: "asc" }],
  });
  const needChallenges = goals.some((g) => g.source === "CHALLENGE");
  const totals = needChallenges ? await challengeTotals(ownerId) : [];
  return Promise.all(goals.map(async (g) => {
    const start = g.startDate;
    const end = localToDbDate(g.targetDate && dateToLocal(g.targetDate) < today ? dateToLocal(g.targetDate) : today);
    let habitCheckIns: number | undefined, workoutsLogged: number | undefined, activityMinutes: number | undefined;
    if (g.source === "HABIT" && g.habitId) habitCheckIns = await prisma.habitCheckIn.count({ where: { habitId: g.habitId, habit: { ownerId }, date: { gte: start, lte: end } } });
    if (g.source === "WORKOUTS") workoutsLogged = await prisma.workoutLog.count({ where: { ownerId, date: { gte: start, lte: end } } });
    if (g.source === "ACTIVITY" && g.activityKind) activityMinutes = (await prisma.activityLog.aggregate({ where: { ownerId, kind: g.activityKind, date: { gte: start, lte: end } }, _sum: { minutes: true } }))._sum.minutes ?? 0;
    const progress = goalProgress({
      source: g.source, targetX100: g.targetX100, status: g.status,
      manualEntries: g.progress.map((p) => ({ valueX100: p.valueX100, recordedOn: dateToLocal(p.recordedOn), createdAt: p.createdAt })),
      milestones: g.milestones.map((m) => ({ completed: !!m.completedAt })),
      tasks: g.tasks.map((t) => ({ done: t.status === "DONE" })),
      habitCheckIns, workoutsLogged, activityMinutes,
      challengeConfirmedCents: g.challengeId ? totals.find((c) => c.id === g.challengeId)?.confirmedCents : undefined,
    });
    return {
      ...g,
      startDate: dateToLocal(g.startDate),
      targetDate: g.targetDate ? dateToLocal(g.targetDate) : null,
      milestones: g.milestones.map((m) => ({ ...m, dueDate: m.dueDate ? dateToLocal(m.dueDate) : null })),
      progressHistory: g.progress.map((p) => ({ id: p.id, value: p.valueX100 / 100, recordedOn: dateToLocal(p.recordedOn), note: p.note })),
      computed: progress,
      overdue: !!g.targetDate && dateToLocal(g.targetDate) < today && g.status !== "COMPLETED" && g.status !== "ARCHIVED",
    };
  }));
}
export type GoalView = Awaited<ReturnType<typeof loadGoals>>[number];

/** Returning-student checklist — a goal with milestones you can edit. Nothing implies admission. */
export async function createValenciaChecklist(ownerId: string, today: LocalDate) {
  return createGoal(ownerId, {
    title: "Return to Valencia College", description: "Explore returning; start with a manageable load (possibly one class).",
    category: "EDUCATION", horizon: "YEAR", priority: "MEDIUM", startDate: today, targetDate: null, unit: null, targetX100: null,
    source: "MILESTONES", challengeId: null, habitId: null, activityKind: null, notes: null,
  }, [
    "Check returning-student / readmission requirements", "Request transcripts from previous attendance", "Request a degree audit of existing credits",
    "Ask about credit for DOC training (evaluation)", "Book an advisor appointment", "Complete FAFSA / financial aid tasks", "Choose first class and register",
  ].map((title) => ({ title, dueDate: null })).map((m, i) => ({ ...m, dueDate: i === 4 ? addDays(today, 30) : null })));
}
