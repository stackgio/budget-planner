import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { seedOwnerConfig } from "@/server/bootstrap";
import { afternoonCheckIn, answer, dismissSuggestion, eveningReflection, matchIntent, morningBriefing, saveDailyReflection } from "@/server/assistant";
import { activeProvider, externalAiProvider } from "@/server/assistant-provider";
import { createTask } from "@/server/tasks";
import { createSession } from "@/server/schedule";
import { recordDeposit } from "@/server/payroll";
import { approvePlan, spin } from "@/server/ledger";
import { ensureGrowthDefaults, createGoal, editMilestone, setMilestoneArchived, loadGoals } from "@/server/growth";
import { logWorkout } from "@/server/life";
import { duplicateTemplate, saveTemplate, setTemplateArchived } from "@/server/fitness";
import { archivedEducation, educationOverview, setEduArchived, upsertOwned } from "@/server/edu";
import { PRIVATE_UNAVAILABLE, encrypt, readPrivate, verifyKey } from "@/server/crypto";
import { localToDbDate } from "@/domain/dates";
import { freshOwner } from "./helpers";

const TZ = "America/New_York";
const key = () => randomUUID();
let ownerId: string;
beforeEach(async () => { ownerId = (await freshOwner()).id; await ensureGrowthDefaults(ownerId); });
const task = (title: string, dueDate: string | null, o: Partial<Parameters<typeof createTask>[1]> = {}) =>
  createTask(ownerId, { title, description: null, category: null, priority: "MEDIUM", dueDate, dueTime: null, rrule: null, reminderMin: null, optional: false, isTopThree: false, parentId: null, ...o });

describe("briefings use real records and say so when empty", () => {
  it("morning briefing: DOC shift, priorities, projected paydays, nothing invented", async () => {
    await task("Call advisor", "2027-01-11", { isTopThree: true });
    const b = await morningBriefing(ownerId, TZ, "2027-01-11"); // Monday
    expect(b.shift).toMatchObject({ title: "DOC shift", start: "8 AM", end: "4 PM" });
    expect(b.priorities.map((p) => p.title)).toEqual(["Call advisor"]);
    expect(b.calendar).toEqual([]);
    expect(b.workouts).toEqual([]);
    expect(b.paydays).toEqual([{ kind: "OVERTIME", officialDate: "2027-01-15", expected: "2027-01-15", provisional: false, received: null, zero: false }]);
    const thu = await morningBriefing(ownerId, TZ, "2027-01-14");
    expect(thu.shift).toBeNull(); // Thursday off
  });

  it("check-in lists open items; dismiss hides a suggestion without changing the task", async () => {
    const t = await task("Pay phone bill", "2027-01-11");
    let c = await afternoonCheckIn(ownerId, TZ, "2027-01-11", new Date("2027-01-11T21:00:00Z"));
    expect(c.openTasks.map((x) => x.title)).toContain("Pay phone bill");
    expect(c.habitsNotLogged.length).toBe(8);
    await dismissSuggestion(ownerId, "2027-01-11", `task:${t.id}`);
    await dismissSuggestion(ownerId, "2027-01-11", `task:${t.id}`); // duplicate tap
    c = await afternoonCheckIn(ownerId, TZ, "2027-01-11", new Date("2027-01-11T21:00:00Z"));
    expect(c.openTasks.map((x) => x.title)).not.toContain("Pay phone bill");
    expect((await prisma.task.findUniqueOrThrow({ where: { id: t.id } })).status).toBe("OPEN");
    await expect(dismissSuggestion(ownerId, "2027-01-11", "DROP TABLE")).rejects.toThrow();
  });

  it("evening reflection: only confirmed accomplishments; reflection saved encrypted", async () => {
    let e = await eveningReflection(ownerId, TZ, "2027-01-11");
    expect(e.accomplishments).toEqual([]);
    await logWorkout(ownerId, { date: "2027-01-11", title: "Full Body A", templateId: null, eventId: null, originalStart: null, durationMin: 30, effort: null, status: "COMPLETED", notes: null, sets: [], idempotencyKey: key() });
    e = await eveningReflection(ownerId, TZ, "2027-01-11");
    expect(e.accomplishments).toEqual(["🏋️ Full Body A (30 min)"]);
    await saveDailyReflection(ownerId, "2027-01-11", "Tired but good", { "What went well today?": "Finished the workout" });
    const raw = await prisma.dailyReflection.findFirstOrThrow();
    expect(raw.bodyCipher).not.toContain("Tired");
    expect((await eveningReflection(ownerId, TZ, "2027-01-11")).saved).toEqual({ body: "Tired but good", answers: { "What went well today?": "Finished the workout" } });
  });
});

describe("assistant answers are grounded in stored records", () => {
  const ask = (q: string, today = "2027-01-11") => answer(ownerId, TZ, today, q);

  it("routes questions to the right intent", () => {
    expect(matchIntent("What's on my schedule today?")).toBe("schedule");
    expect(matchIntent("When is my next projected payday?")).toBe("payday");
    expect(matchIntent("What financial transfers are still waiting?")).toBe("transfers");
    expect(matchIntent("What did I accomplish this week?")).toBe("accomplished");
    expect(matchIntent("Which goals need attention?")).toBe("goals");
    expect(matchIntent("What's my next workout?")).toBe("workout");
    expect(matchIntent("What should I focus on this week?")).toBe("focus");
  });

  it("schedule today includes the DOC shift; an empty day says so", async () => {
    expect((await ask("What's on my schedule today?")).lines[0]).toMatch(/8 AM–4 PM · DOC shift/);
    expect((await ask("What's on my schedule today?", "2027-01-14")).lines).toEqual(["Nothing is scheduled. (Nothing has been added for you.)"]);
  });

  it("paydays are labelled projected; transfers list only real reservations", async () => {
    const p = await ask("When is my next projected payday?");
    expect(p.lines[0]).toMatch(/projected from your unverified anchor/);
    expect(p.notes[0]).toMatch(/not income until/);
    expect((await ask("What financial transfers are still waiting?")).lines[0]).toMatch(/Nothing is waiting/);
    const pd = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "OVERTIME", officialDate: { gte: localToDbDate("2027-01-01") } } });
    const d = await recordDeposit(ownerId, pd.id, { netCents: 30_000, actualDepositDate: "2027-01-01", idempotencyKey: key() });
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
    await approvePlan(ownerId, planId);
    const t = await ask("What financial transfers are still waiting?");
    expect(t.title).toMatch(/waiting · \$300\.00/);
    expect(t.lines.some((l) => /Roth IRA \(tax year 2027\) · \$100\.00/.test(l))).toBe(true);
  });

  it("workouts, goals and accomplishments come from logs; missing data is explained", async () => {
    expect((await ask("What's my next workout?")).lines[0]).toMatch(/No workout is scheduled/);
    expect((await ask("Which goals need attention?")).lines).toEqual(["You don't have any active goals yet."]);
    const r = await createSession(ownerId, TZ, { title: "Workout", category: "WORKOUT", date: "2027-01-14", time: "09:00", durationMin: 45 }, false);
    expect(r.created).not.toBeNull();
    const acc = await ask("What did I accomplish this week?", "2027-01-15");
    expect(acc.lines).toContain("0 workouts logged"); // scheduled ≠ done
    const unknown = await ask("What's the weather?");
    expect(unknown.intent).toBe("unknown");
    expect(unknown.notes[0]).toMatch(/don't use an AI service/);
  });

  it("only the rule-based provider is active; the external one refuses", async () => {
    expect(activeProvider().external).toBe(false);
    await expect(externalAiProvider.ask({ ownerId, tz: TZ, today: "2027-01-11", question: "x" })).rejects.toThrow(/not enabled/);
  });

  it("answers never include another account's data", async () => {
    await task("Owner secret task", "2027-01-11");
    const other = (await prisma.user.create({ data: { email: "o@example.test", passwordHash: "x" } })).id;
    await seedOwnerConfig(prisma, other);
    const a = await answer(other, TZ, "2027-01-11", "What's on my schedule today?");
    expect(JSON.stringify(a)).not.toContain("Owner secret task");
    expect(JSON.stringify(await morningBriefing(other, TZ, "2027-01-11"))).not.toContain("Owner secret task");
  });
});

describe("Phase 3 usability: editable workouts & education", () => {
  it("editing, duplicating and archiving a template never changes past logs", async () => {
    const tpl = await prisma.workoutTemplate.findFirstOrThrow({ where: { ownerId, name: "Full Body A (beginner)" }, include: { items: true } });
    const log = await logWorkout(ownerId, { date: "2027-01-05", title: tpl.name, templateId: tpl.id, eventId: null, originalStart: null, durationMin: 40, effort: null, status: "COMPLETED", notes: null, sets: [{ exerciseId: tpl.items[0]!.exerciseId, setNumber: 1, reps: 10, weightX100: null, durationSec: null }], idempotencyKey: key() });
    await saveTemplate(ownerId, tpl.id, { name: "Full Body A — gym", notes: "Moved to the gym", kind: "GYM", items: [{ exerciseId: tpl.items[1]!.exerciseId, sets: 4, reps: "6–8", weightNote: "40 lb", restSec: 90 }] });
    const after = await prisma.workoutTemplate.findUniqueOrThrow({ where: { id: tpl.id }, include: { items: true } });
    expect([after.name, after.kind, after.items.length, after.items[0]!.weightNote]).toEqual(["Full Body A — gym", "GYM", 1, "40 lb"]);
    const kept = await prisma.workoutLog.findUniqueOrThrow({ where: { id: log.id }, include: { sets: true } });
    expect([kept.title, kept.sets.length, kept.sets[0]!.exerciseId]).toEqual(["Full Body A (beginner)", 1, tpl.items[0]!.exerciseId]);
    const copy = await duplicateTemplate(ownerId, tpl.id);
    expect(copy.name).toBe("Full Body A — gym (copy)");
    await setTemplateArchived(ownerId, tpl.id, true);
    expect(await prisma.workoutLog.count({ where: { templateId: tpl.id } })).toBe(1);
    await expect(saveTemplate(ownerId, null, { name: "Full Body A — gym (copy)", notes: null, kind: "HOME", items: [{ exerciseId: tpl.items[0]!.exerciseId, sets: 3, reps: "10", weightNote: null, restSec: null }] })).rejects.toThrow(/already have/);
  });

  it("courses, tuition and milestones can be edited/archived without losing history", async () => {
    const c = await upsertOwned("eduCourse", ownerId, null, { title: "Intro to CJ", status: "PLANNED" }) as { id: string };
    await upsertOwned("eduCourse", ownerId, c.id, { title: "Intro to Criminal Justice", status: "REGISTERED", notes: "Online" });
    const t = await upsertOwned("tuitionItem", ownerId, null, { label: "Tuition", estCents: 30_000 }) as { id: string };
    await setEduArchived(ownerId, "tuitionItem", t.id, true);
    let ov = await educationOverview(ownerId);
    expect(ov.courses.map((x) => [x.title, x.status, x.notes])).toEqual([["Intro to Criminal Justice", "REGISTERED", "Online"]]);
    expect(ov.tuition).toEqual([]);
    expect((await archivedEducation(ownerId)).tuition.map((x) => x.label)).toEqual(["Tuition"]);
    await setEduArchived(ownerId, "tuitionItem", t.id, false);
    ov = await educationOverview(ownerId);
    expect(ov.tuitionEstCents).toBe(30_000);

    const g = await createGoal(ownerId, { title: "Valencia", description: null, category: "EDUCATION", horizon: "YEAR", priority: "MEDIUM", startDate: "2027-01-01", targetDate: null, unit: null, targetX100: null, source: "MILESTONES", challengeId: null, habitId: null, activityKind: null, notes: null }, [{ title: "Transcript", dueDate: null }, { title: "Advisor", dueDate: null }]);
    const ms = await prisma.goalMilestone.findMany({ where: { goalId: g.id }, orderBy: { sortOrder: "asc" } });
    await editMilestone(ownerId, ms[0]!.id, "Request official transcript", "2027-02-01");
    await setMilestoneArchived(ownerId, ms[1]!.id, true);
    const [v] = await loadGoals(ownerId, "2027-01-10", { id: g.id });
    expect(v!.milestones.map((m) => [m.title, m.dueDate])).toEqual([["Request official transcript", "2027-02-01"]]);
    expect(v!.computed.label).toBe("0 of 1 milestones");
    expect(await prisma.goalMilestone.count({ where: { goalId: g.id } })).toBe(2); // archived, not deleted
    const other = (await prisma.user.create({ data: { email: "x@example.test", passwordHash: "x" } })).id;
    await expect(setEduArchived(other, "eduCourse", c.id, true)).rejects.toThrow(/Not found/);
    await expect(editMilestone(other, ms[0]!.id, "hijack", null)).rejects.toThrow(/not found/i);
  });
});

describe("encryption key safety", () => {
  it("wrong or missing key fails safely and is detected", async () => {
    const cipher = encrypt("private");
    expect(await verifyKey(prisma)).toBe("OK"); // creates the check value
    const real = process.env.DATA_ENCRYPTION_KEY;
    try {
      process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
      expect(readPrivate(cipher)).toBe(PRIVATE_UNAVAILABLE);
      expect(await verifyKey(prisma)).toBe("MISMATCH");
      process.env.DATA_ENCRYPTION_KEY = "";
      expect(readPrivate(cipher)).toBe(PRIVATE_UNAVAILABLE);
      expect(await verifyKey(prisma)).toBe("MISSING");
      expect(() => encrypt("x")).toThrow(/DATA_ENCRYPTION_KEY/); // never writes with no key
    } finally {
      process.env.DATA_ENCRYPTION_KEY = real;
    }
    expect(readPrivate(cipher)).toBe("private");
  });
});
