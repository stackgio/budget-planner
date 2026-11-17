import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { seedOwnerConfig } from "@/server/bootstrap";
import { addGoalProgress, addMilestone, createGoal, createValenciaChecklist, ensureGrowthDefaults, loadGoals, setGoalStatus, setMilestoneDone, type GoalInput } from "@/server/growth";
import { addFaithEntry, changeDate, completeDate, fitnessWeek, listFaith, logWorkout, planDate, relationshipOverview, removeWorkoutLog } from "@/server/life";
import { careerOverview, logActivity, saveJob } from "@/server/edu";
import { createSession } from "@/server/schedule";
import { reviewData, saveReview } from "@/server/reviews";
import { shiftOccurrence } from "@/server/calendar";
import { switchMode } from "@/server/modes";
import { recordManualPayment, reconcile } from "@/server/ledger";
import { zonedToInstant } from "@/domain/dates";
import { freshOwner } from "./helpers";

const TZ = "America/New_York";
const key = () => randomUUID();
let ownerId: string;
beforeEach(async () => { ownerId = (await freshOwner()).id; await ensureGrowthDefaults(ownerId); });

const goal = (o: Partial<GoalInput> = {}): GoalInput => ({
  title: "Goal", description: null, category: "PERSONAL", horizon: "QUARTER", priority: "MEDIUM", startDate: "2027-01-01", targetDate: null,
  unit: null, targetX100: null, source: "MILESTONES", challengeId: null, habitId: null, activityKind: null, notes: null, ...o,
});
const workout = (o: Partial<Parameters<typeof logWorkout>[1]> = {}) => logWorkout(ownerId, {
  date: "2027-03-08", title: "Full Body A", templateId: null, eventId: null, originalStart: null, durationMin: 40, effort: 6, status: "COMPLETED", notes: null, sets: [], idempotencyKey: key(), ...o,
});

describe("defaults create reference lists only — never activity", () => {
  it("is idempotent and fabricates nothing", async () => {
    await ensureGrowthDefaults(ownerId);
    expect(await prisma.alphabetEntry.count({ where: { ownerId } })).toBe(26);
    expect(await prisma.workoutTemplate.count({ where: { ownerId } })).toBe(3);
    expect(await prisma.eduProgram.count({ where: { ownerId } })).toBe(3);
    expect((await prisma.eduProgram.findMany({ where: { ownerId } })).every((p) => p.status === "RESEARCHING")).toBe(true);
    for (const n of [await prisma.workoutLog.count(), await prisma.faithEntry.count(), await prisma.datePlan.count(), await prisma.activityLog.count(), await prisma.bodyMetric.count(), await prisma.jobOpportunity.count(), await prisma.goal.count()]) expect(n).toBe(0);
  });
});

describe("goals and milestones", () => {
  it("milestone progress moves only when you complete milestones; status changes are explicit", async () => {
    const g = await createGoal(ownerId, goal({ title: "Return to school" }), [{ title: "Transcript", dueDate: "2027-01-10" }, { title: "Advisor", dueDate: null }]);
    let [v] = await loadGoals(ownerId, "2027-01-15", { id: g.id });
    expect([v!.computed.pct, v!.status]).toEqual([0, "ACTIVE"]);
    const ms = await prisma.goalMilestone.findMany({ where: { goalId: g.id }, orderBy: { sortOrder: "asc" } });
    await setMilestoneDone(ownerId, ms[0]!.id, true);
    await setMilestoneDone(ownerId, ms[0]!.id, true); // duplicate tap
    [v] = await loadGoals(ownerId, "2027-01-15", { id: g.id });
    expect(v!.computed.pct).toBe(50);
    expect(v!.status).toBe("ACTIVE"); // never auto-completes
    await addMilestone(ownerId, g.id, "Register", "2027-02-01");
    [v] = await loadGoals(ownerId, "2027-01-15", { id: g.id });
    expect(v!.computed.label).toBe("1 of 3 milestones");
    await setGoalStatus(ownerId, g.id, "COMPLETED");
    expect((await prisma.goal.findUniqueOrThrow({ where: { id: g.id } })).completedAt).not.toBeNull();
    expect(await prisma.auditLog.count({ where: { entity: "GoalMilestone" } })).toBe(1);
  });

  it("manual progress is append-only history and idempotent", async () => {
    const g = await createGoal(ownerId, goal({ source: "MANUAL", targetX100: 2000, unit: "books" }));
    const k = key();
    await addGoalProgress(ownerId, g.id, 300, "2027-01-05", null, k);
    await addGoalProgress(ownerId, g.id, 300, "2027-01-05", null, k);
    await addGoalProgress(ownerId, g.id, 500, "2027-02-01", "Finished another", key());
    expect(await prisma.goalProgress.count({ where: { goalId: g.id } })).toBe(2);
    const [v] = await loadGoals(ownerId, "2027-02-02", { id: g.id });
    expect([v!.computed.current, v!.computed.pct]).toEqual([5, 25]);
    const m = await createGoal(ownerId, goal({ source: "MILESTONES" }));
    await expect(addGoalProgress(ownerId, m.id, 100, "2027-01-01", null, key())).rejects.toThrow(/comes from your records/);
  });

  it("a finance goal reads confirmed Phase 2 payments without duplicating money", async () => {
    const moving = await prisma.challenge.findFirstOrThrow({ where: { ownerId, kind: "MOVING_OUT" } });
    const g = await createGoal(ownerId, goal({ category: "FINANCE", source: "CHALLENGE", challengeId: moving.id, targetX100: 1_001_100 }));
    const tile = await prisma.challengeTile.findFirstOrThrow({ where: { challengeId: moving.id, number: 141 } });
    const paymentsBefore = await prisma.payment.count();
    let [v] = await loadGoals(ownerId, "2027-01-15", { id: g.id });
    expect(v!.computed.current).toBe(0);
    await recordManualPayment(ownerId, { kind: "TILE", tileId: tile.id, amountCents: 0, paidOn: "2027-01-10", idempotencyKey: key() });
    [v] = await loadGoals(ownerId, "2027-01-15", { id: g.id });
    expect(v!.computed.current).toBe(141);
    expect(await prisma.payment.count()).toBe(paymentsBefore + 1); // only the payment itself — the goal stored nothing
    expect(await reconcile(ownerId)).toEqual([]);
  });

  it("workout and activity goals count only logged records", async () => {
    const w = await createGoal(ownerId, goal({ category: "FITNESS", source: "WORKOUTS", targetX100: 3600 }));
    await workout({ date: "2027-01-03" });
    const a = await createGoal(ownerId, goal({ category: "COMMUNICATION", source: "ACTIVITY", activityKind: "SPEAKING", targetX100: 30000 }));
    await logActivity(ownerId, { kind: "SPEAKING", date: "2027-01-03", minutes: 15, title: null, note: null, goalId: a.id, courseId: null, idempotencyKey: key() });
    const goals = await loadGoals(ownerId, "2027-01-10");
    expect(goals.find((x) => x.id === w.id)!.computed.current).toBe(1);
    expect(goals.find((x) => x.id === a.id)!.computed.current).toBe(15);
  });
});

describe("fitness", () => {
  it("a scheduled workout is not a completed one; logging is idempotent and one per occurrence", async () => {
    const tpl = await prisma.workoutTemplate.findFirstOrThrow({ where: { ownerId }, include: { items: true } });
    const { created } = await createSession(ownerId, TZ, { title: "Workout", category: "WORKOUT", date: "2027-03-11", time: "09:00", durationMin: 45, weekdays: [4], workoutTemplateId: tpl.id }, false);
    expect(created).not.toBeNull();
    let wk = await fitnessWeek(ownerId, TZ, { start: "2027-03-06", end: "2027-03-12" }, "2027-03-12");
    expect([wk.completedCount, wk.scheduled.length, wk.notLogged.length]).toEqual([0, 1, 1]);
    const occ = wk.scheduled[0]!;
    const k = key();
    const base = { date: "2027-03-11", templateId: tpl.id, eventId: occ.eventId, originalStart: occ.originalStart.toISOString(), idempotencyKey: k, sets: [{ exerciseId: tpl.items[0]!.exerciseId, setNumber: 1, reps: 10, weightX100: null, durationSec: null }] };
    const a = await workout(base);
    expect((await workout(base)).id).toBe(a.id);
    await expect(workout({ ...base, idempotencyKey: key() })).rejects.toThrow(/already logged/);
    wk = await fitnessWeek(ownerId, TZ, { start: "2027-03-06", end: "2027-03-12" }, "2027-03-12");
    expect([wk.completedCount, wk.notLogged.length]).toEqual([1, 0]);
    expect(await prisma.workoutSet.count()).toBe(1);
    await removeWorkoutLog(ownerId, a.id);
    expect(await prisma.auditLog.count({ where: { entity: "WorkoutLog", action: "remove" } })).toBe(1);
  });

  it("heavy work days ease the weekly target", async () => {
    await switchMode(ownerId, "OVERTIME", { now: zonedToInstant("2027-03-07", "08:00", TZ) });
    await switchMode(ownerId, "RECOVERY", { now: zonedToInstant("2027-03-08", "02:00", TZ) });
    await switchMode(ownerId, "NORMAL", { now: zonedToInstant("2027-03-08", "20:00", TZ) });
    const wk = await fitnessWeek(ownerId, TZ, { start: "2027-03-06", end: "2027-03-12" }, "2027-03-12");
    expect([wk.baseTarget, wk.heavyDays, wk.target]).toEqual([3, 2, 1]);
  });
});

describe("scheduling respects the DOC schedule", () => {
  it("a Monday 10:00 session conflicts with the shift: nothing is created, alternatives are suggested", async () => {
    const r = await createSession(ownerId, TZ, { title: "Gym", category: "WORKOUT", date: "2027-03-08", time: "10:00", durationMin: 45 }, false);
    expect(r.created).toBeNull();
    expect(r.check.conflicts[0]).toMatch(/DOC shift/);
    expect(r.check.suggestions.length).toBeGreaterThan(0);
    expect(r.check.suggestions[0]!.time >= "16:30" || r.check.suggestions[0]!.date > "2027-03-08").toBe(true);
    expect(await prisma.calendarEvent.count({ where: { ownerId, category: "WORKOUT" } })).toBe(0);
    const forced = await createSession(ownerId, TZ, { title: "Gym", category: "WORKOUT", date: "2027-03-08", time: "10:00", durationMin: 45 }, true);
    expect(forced.created).not.toBeNull();
    expect(await prisma.auditLog.count({ where: { action: "create-with-accepted-conflicts" } })).toBe(1);
    const doc = await prisma.calendarEvent.findFirstOrThrow({ where: { ownerId, sourceType: "DOC_SCHEDULE" } });
    expect(doc.rrule).toBe("FREQ=WEEKLY;BYDAY=SA,SU,MO,TU,WE"); // untouched
  });

  it("postponing keeps history in the audit log", async () => {
    const { created } = await createSession(ownerId, TZ, { title: "Study", category: "STUDY", date: "2027-03-11", time: "10:00", durationMin: 60 }, false);
    await shiftOccurrence(ownerId, created!.id, created!.startAt.toISOString(), 1);
    expect(await prisma.auditLog.count({ where: { entityId: created!.id, action: "postpone:1d" } })).toBe(1);
  });
});

describe("faith privacy", () => {
  it("entries are encrypted at rest and readable only through the app; duplicate taps don't duplicate", async () => {
    const k = key();
    await addFaithEntry(ownerId, { kind: "GRATITUDE", date: "2027-01-05", minutes: null, passage: null, body: "Grateful for my family", idempotencyKey: k });
    await addFaithEntry(ownerId, { kind: "GRATITUDE", date: "2027-01-05", minutes: null, passage: null, body: "Grateful for my family", idempotencyKey: k });
    const raw = await prisma.faithEntry.findMany();
    expect(raw).toHaveLength(1);
    expect(raw[0]!.bodyCipher!.startsWith("v1:")).toBe(true);
    expect(raw[0]!.bodyCipher).not.toContain("Grateful");
    expect((await listFaith(ownerId, "2027-01-01", "2027-01-31"))[0]!.body).toBe("Grateful for my family");
    await expect(addFaithEntry(ownerId, { kind: "REFLECTION", date: "2027-01-05", minutes: null, passage: null, body: "  ", idempotencyKey: key() })).rejects.toThrow(/Write something/);
  });
});

describe("relationship & Alphabet Dating", () => {
  it("plan → explicit completion; cost counted once; cancel keeps history", async () => {
    const a = await planDate(ownerId, TZ, { title: "Arcade", date: "2027-03-12", startTime: "18:30", durationMin: 150, budgetCents: 6_000, letter: "A", notes: "Her favorite" });
    expect((await prisma.alphabetEntry.findFirstOrThrow({ where: { ownerId, letter: "A" } })).status).toBe("PLANNED");
    expect(await prisma.calendarEvent.count({ where: { ownerId, category: "DATE_NIGHT", sourceId: a.id } })).toBe(1);
    expect((await prisma.datePlan.findUniqueOrThrow({ where: { id: a.id } })).notesCipher).not.toContain("favorite");
    await expect(planDate(ownerId, TZ, { title: "Again", date: "2027-03-19", startTime: null, durationMin: 120, budgetCents: null, letter: "A", notes: null })).rejects.toThrow(/already has a planned date/);
    await expect(completeDate(ownerId, a.id, { actualCostCents: 100, paymentId: "x" })).rejects.toThrow(/not both/);
    await expect(completeDate(ownerId, a.id, { actualCostCents: 5_500, paymentId: null }, "2027-03-11")).rejects.toThrow(/hasn't happened yet/);
    await completeDate(ownerId, a.id, { actualCostCents: 5_500, paymentId: null }, "2027-03-12");
    await completeDate(ownerId, a.id, { actualCostCents: 9_999, paymentId: null }); // duplicate → no change
    expect((await prisma.datePlan.findUniqueOrThrow({ where: { id: a.id } })).actualCostCents).toBe(5_500);
    expect((await prisma.alphabetEntry.findFirstOrThrow({ where: { ownerId, letter: "A" } })).status).toBe("COMPLETED");

    // A date linked to a confirmed guilt-free payment counts that payment once, not twice.
    const fun = await recordManualPayment(ownerId, { kind: "FUN", amountCents: 4_000, paidOn: "2027-03-19", idempotencyKey: key() });
    const b = await planDate(ownerId, TZ, { title: "Bowling", date: "2027-03-19", startTime: "18:30", durationMin: 150, budgetCents: null, letter: "B", notes: null });
    await completeDate(ownerId, b.id, { actualCostCents: null, paymentId: fun.id });
    const ov = await relationshipOverview(ownerId, "2027-03-20");
    expect(ov.spending).toEqual({ manualCents: 5_500, linkedCents: 4_000, totalCents: 9_500 });
    expect(ov.alphabetProgress.completed).toBe(2);

    const c = await planDate(ownerId, TZ, { title: "Cooking class", date: "2027-03-26", startTime: "18:00", durationMin: 150, budgetCents: null, letter: "C", notes: null });
    await changeDate(ownerId, TZ, c.id, { status: "CANCELLED" });
    expect((await prisma.alphabetEntry.findFirstOrThrow({ where: { ownerId, letter: "C" } })).status).toBe("OPEN");
    expect((await prisma.datePlan.findUniqueOrThrow({ where: { id: c.id } })).status).toBe("CANCELLED"); // history kept
    await expect(prisma.alphabetEntry.updateMany({ where: { ownerId, letter: "D" }, data: { status: "COMPLETED", completedAt: new Date() } })).rejects.toThrow(); // DB: completion needs a date
  });
});

describe("education & career", () => {
  it("checklist, activity logging, and pay comparison from entered numbers only", async () => {
    await createValenciaChecklist(ownerId, "2027-01-02");
    const [g] = await loadGoals(ownerId, "2027-01-02", { category: "EDUCATION" });
    expect(g!.milestones).toHaveLength(7);
    expect(g!.computed.pct).toBe(0);
    const k = key();
    await logActivity(ownerId, { kind: "STUDY", date: "2027-01-03", minutes: 45, title: "Orientation reading", note: null, goalId: g!.id, courseId: null, idempotencyKey: k });
    await logActivity(ownerId, { kind: "STUDY", date: "2027-01-03", minutes: 45, title: "Orientation reading", note: null, goalId: g!.id, courseId: null, idempotencyKey: k });
    expect(await prisma.activityLog.count()).toBe(1);
    await expect(saveJob(ownerId, null, { title: "Deputy", agency: "County", level: "COUNTY", location: null, payMinCents: null, payMaxCents: null, payPeriod: "HOURLY", deadline: null, status: "APPLIED", appliedOn: null, interviewOn: null, notes: null, prepNotes: null })).rejects.toThrow(/date you applied/);
    await saveJob(ownerId, null, { title: "Detention Deputy", agency: "County Sheriff", level: "COUNTY", location: null, payMinCents: 2_600, payMaxCents: null, payPeriod: "HOURLY", deadline: "2027-02-01", status: "RESEARCHING", appliedOn: null, interviewOn: null, notes: "Ask about shift bid", prepNotes: null });
    const c = await careerOverview(ownerId);
    expect(c.hourlyCents).toBe(2420);
    expect(c.jobs[0]!.compare!.minDiffCents).toBe((2_600 - 2_420) * 2080);
    expect(c.jobs[0]!.notes).toBe("Ask about shift bid");
    expect((await prisma.jobOpportunity.findFirstOrThrow()).notesCipher).not.toContain("shift");
  });
});

describe("reviews use stored data only", () => {
  it("weekly review counts only logged activity; reflection is encrypted and upserted", async () => {
    await workout({ date: "2027-03-08" });
    await addFaithEntry(ownerId, { kind: "PRAYER", date: "2027-03-09", minutes: 10, passage: null, body: null, idempotencyKey: key() });
    await logActivity(ownerId, { kind: "SPEAKING", date: "2027-03-10", minutes: 15, title: null, note: null, goalId: null, courseId: null, idempotencyKey: key() });
    const d = await reviewData(ownerId, TZ, "WEEK", "2027-03-10", "2027-03-12");
    expect(d.range).toEqual({ start: "2027-03-06", end: "2027-03-12" });
    expect([d.fitness.logged, d.faith.PRAYER, d.growth.SPEAKING, d.tasks.completed, d.money.regularCents]).toEqual([1, 1, 15, 0, 0]);
    await saveReview(ownerId, "WEEK", "2027-03-10", "Solid week", ["Sleep by 9:30", "", "Call Mom"]);
    await saveReview(ownerId, "WEEK", "2027-03-07", "Solid week, edited", ["Sleep by 9:30"]);
    const rows = await prisma.review.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.reflectionCipher).not.toContain("Solid");
    expect((await reviewData(ownerId, TZ, "WEEK", "2027-03-10", "2027-03-12")).saved?.reflection).toBe("Solid week, edited");
    const month = await reviewData(ownerId, TZ, "MONTH", "2027-03-10", "2027-03-31");
    expect([month.range.start, month.fitness.weeksWithWorkout]).toEqual(["2027-03-01", 1]);
  });
});

describe("authorization boundaries", () => {
  it("another account cannot read or change Phase 3 data", async () => {
    const g = await createGoal(ownerId, goal(), [{ title: "Step", dueDate: null }]);
    const ms = await prisma.goalMilestone.findFirstOrThrow({ where: { goalId: g.id } });
    const d = await planDate(ownerId, TZ, { title: "Movie", date: "2027-03-12", startTime: null, durationMin: 120, budgetCents: null, letter: null, notes: null });
    const w = await workout();
    const other = (await prisma.user.create({ data: { email: "x@example.test", passwordHash: "x" } })).id;
    await seedOwnerConfig(prisma, other);
    await expect(setGoalStatus(other, g.id, "COMPLETED")).rejects.toThrow(/not found/i);
    await expect(setMilestoneDone(other, ms.id, true)).rejects.toThrow(/not found/i);
    await expect(addMilestone(other, g.id, "x", null)).rejects.toThrow(/not found/i);
    await expect(completeDate(other, d.id, { actualCostCents: 1, paymentId: null })).rejects.toThrow(/not found/i);
    await expect(changeDate(other, TZ, d.id, { status: "CANCELLED" })).rejects.toThrow(/not found/i);
    await expect(removeWorkoutLog(other, w.id)).rejects.toThrow(/not found/i);
    await expect(logActivity(other, { kind: "STUDY", date: "2027-01-01", minutes: 5, title: null, note: null, goalId: g.id, courseId: null, idempotencyKey: key() })).rejects.toThrow(/not found/i);
    expect(await loadGoals(other, "2027-01-01")).toEqual([]);
  });
});
