import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { createEvent, deleteEvent, loadOccurrences, shiftOccurrence, updateEvent, type EventInput } from "@/server/calendar";
import { switchMode, currentMode } from "@/server/modes";
import { createOvertimeShift } from "@/server/overtime";
import { createTask, finishTask } from "@/server/tasks";
import { dateToLocal, instantToLocalDate, instantToLocalTime, zonedToInstant } from "@/domain/dates";
import { freshOwner } from "./helpers";

const TZ = "America/New_York";
let ownerId: string;
beforeEach(async () => { ownerId = (await freshOwner()).id; });

const range = (a: string, b: string) => [zonedToInstant(a, "00:00", TZ), zonedToInstant(b, "00:00", TZ)] as const;
const docOn = async (a: string, b: string) => (await loadOccurrences(ownerId, TZ, ...range(a, b), { includePaydays: false, includeTasks: false })).filter((o) => o.category === "DOC_SHIFT");
const docEvent = () => prisma.calendarEvent.findFirstOrThrow({ where: { ownerId, sourceType: "DOC_SCHEDULE" } });
const input = (over: Partial<EventInput>): EventInput => ({
  title: "DOC shift", description: null, location: null, category: "DOC_SHIFT", date: "2027-03-08", endDate: "2027-03-08",
  startTime: "08:00", endTime: "16:00", allDay: false, rrule: "FREQ=WEEKLY;BYDAY=SA,SU,MO,TU,WE", reminderMin: null, important: true, optional: false, ...over,
});

describe("recurring DOC shifts in the database", () => {
  it("expands Sat–Wed from 2027-01-02, and Thursday/Friday are off", async () => {
    const occ = await docOn("2027-01-01", "2027-01-09");
    expect(occ.map((o) => instantToLocalDate(o.start, TZ))).toEqual(["2027-01-02", "2027-01-03", "2027-01-04", "2027-01-05", "2027-01-06"]);
  });

  it("editing one shift (16-hour double) leaves the series intact", async () => {
    const ev = await docEvent();
    await updateEvent(ownerId, TZ, ev.id, zonedToInstant("2027-03-08", "08:00", TZ).toISOString(), "single", input({ title: "DOC double", endDate: "2027-03-09", endTime: "00:00" }));
    const occ = await docOn("2027-03-06", "2027-03-11");
    expect(occ.map((o) => [instantToLocalDate(o.start, TZ), o.title])).toEqual([
      ["2027-03-06", "DOC shift"], ["2027-03-07", "DOC shift"], ["2027-03-08", "DOC double"], ["2027-03-09", "DOC shift"], ["2027-03-10", "DOC shift"],
    ]);
    expect((await docEvent()).rrule).toBe(ev.rrule);
  });

  it("deleting one shift cancels only that occurrence", async () => {
    const ev = await docEvent();
    await deleteEvent(ownerId, ev.id, zonedToInstant("2027-03-09", "08:00", TZ).toISOString(), "single");
    expect((await docOn("2027-03-08", "2027-03-11")).map((o) => instantToLocalDate(o.start, TZ))).toEqual(["2027-03-08", "2027-03-10"]);
  });

  it("'this and following' splits the series and keeps earlier shifts", async () => {
    const ev = await docEvent();
    await updateEvent(ownerId, TZ, ev.id, zonedToInstant("2027-06-05", "08:00", TZ).toISOString(), "following",
      input({ date: "2027-06-05", endDate: "2027-06-05", startTime: "07:00", endTime: "15:00" }));
    expect((await docOn("2027-06-02", "2027-06-03")).map((o) => instantToLocalTime(o.start, TZ))).toEqual(["08:00"]);
    expect((await docOn("2027-06-05", "2027-06-08")).map((o) => instantToLocalTime(o.start, TZ))).toEqual(["07:00", "07:00", "07:00"]);
    expect(await prisma.calendarEvent.count({ where: { ownerId, category: "DOC_SHIFT" } })).toBe(2);
  });

  it("'all events' time change keeps single-occurrence exceptions attached", async () => {
    const ev = await docEvent();
    await deleteEvent(ownerId, ev.id, zonedToInstant("2027-03-09", "08:00", TZ).toISOString(), "single");
    await updateEvent(ownerId, TZ, ev.id, zonedToInstant("2027-03-08", "08:00", TZ).toISOString(), "all", input({ startTime: "06:00", endTime: "14:00" }));
    const occ = await docOn("2027-03-08", "2027-03-11");
    expect(occ.map((o) => [instantToLocalDate(o.start, TZ), instantToLocalTime(o.start, TZ)])).toEqual([["2027-03-08", "06:00"], ["2027-03-10", "06:00"]]);
  });

  it("postponing an optional occurrence moves only that one", async () => {
    const gym = await createEvent(ownerId, TZ, input({ title: "Gym", category: "WORKOUT", date: "2027-03-08", endDate: "2027-03-08", startTime: "17:00", endTime: "18:00", rrule: "FREQ=WEEKLY;BYDAY=MO,WE", important: false, optional: true }));
    await shiftOccurrence(ownerId, gym.id, gym.startAt.toISOString(), 1);
    const occ = (await loadOccurrences(ownerId, TZ, ...range("2027-03-08", "2027-03-11"), { includePaydays: false, includeTasks: false })).filter((o) => o.title === "Gym");
    expect(occ.map((o) => instantToLocalDate(o.start, TZ))).toEqual(["2027-03-09", "2027-03-10"]);
  });

  it("paydays and dated tasks appear as linked, read-only calendar items (no duplicates)", async () => {
    await createTask(ownerId, { title: "Valencia transcript request", description: null, category: null, priority: "HIGH", dueDate: "2027-04-02", dueTime: null, rrule: null, reminderMin: null, optional: false, isTopThree: false, parentId: null });
    const occ = await loadOccurrences(ownerId, TZ, ...range("2027-04-02", "2027-04-03"));
    const pay = occ.filter((o) => o.category === "PAYDAY_REGULAR");
    expect(pay).toHaveLength(1);
    expect(pay[0]!.title).toBe("Regular payday (provisional)");
    expect(occ.filter((o) => o.category === "TASK")).toHaveLength(1);
    expect(await prisma.calendarEvent.count({ where: { ownerId, category: "FINANCIAL" } })).toBe(0);
  });
});

describe("work modes", () => {
  it("activation records a start, a calendar block, and only one mode can be open", async () => {
    const s = await switchMode(ownerId, "ACTIVATION", { now: new Date("2027-03-08T20:00:00Z") });
    expect(s?.eventId).toBeTruthy();
    const ev = await prisma.calendarEvent.findUniqueOrThrow({ where: { id: s!.eventId! } });
    expect(ev.category).toBe("ACTIVATION");
    await switchMode(ownerId, "RECOVERY", { now: new Date("2027-03-09T02:00:00Z") });
    expect((await prisma.calendarEvent.findUniqueOrThrow({ where: { id: ev.id } })).endAt.toISOString()).toBe("2027-03-09T02:00:00.000Z");
    expect((await currentMode(ownerId))?.mode).toBe("RECOVERY");
    expect(await prisma.modeSession.count({ where: { ownerId, endedAt: null } })).toBe(1);
    await switchMode(ownerId, "NORMAL");
    expect(await currentMode(ownerId)).toBeNull();
    // Nothing was deleted: DOC series untouched
    expect(await prisma.calendarEvent.count({ where: { ownerId, sourceType: "DOC_SCHEDULE" } })).toBe(1);
  });

  it("database rejects two open mode sessions", async () => {
    await prisma.modeSession.create({ data: { ownerId, mode: "OVERTIME", startedAt: new Date() } });
    await expect(prisma.modeSession.create({ data: { ownerId, mode: "RECOVERY", startedAt: new Date() } })).rejects.toThrow();
  });
});

describe("overtime shifts", () => {
  it("estimates gross from user-split hours at $24.20 / 1.5× and links to an overtime payday", async () => {
    const pd = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "OVERTIME", officialDate: { gte: new Date("2027-03-12") } }, orderBy: { officialDate: "asc" } });
    const s = await createOvertimeShift(ownerId, TZ, { date: "2027-03-08", startTime: "16:00", endTime: "00:00", breakMinutes: 0, regularHoursX100: 0, overtimeHoursX100: 800, isActivation: false, payrollPeriod: null, paydayId: pd.id, status: "WORKED", notes: null, addToCalendar: true });
    expect(s.estimatedGrossCents).toBe(29040);
    expect(instantToLocalDate(s.endAt, TZ)).toBe("2027-03-09");
    expect(await prisma.calendarEvent.count({ where: { sourceType: "OVERTIME_SHIFT", sourceId: s.id } })).toBe(1);
    expect(await prisma.incomeDeposit.count()).toBe(0); // estimate is never income
  });

  it("rejects linking to a regular payday", async () => {
    const pd = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "REGULAR" } });
    await expect(createOvertimeShift(ownerId, TZ, { date: "2027-03-08", startTime: "16:00", endTime: "20:00", breakMinutes: 0, regularHoursX100: 0, overtimeHoursX100: 400, isActivation: false, payrollPeriod: null, paydayId: pd.id, status: "WORKED", notes: null, addToCalendar: false })).rejects.toThrow();
  });
});

describe("tasks", () => {
  it("completing a repeating task keeps history and schedules the next one", async () => {
    const t = await createTask(ownerId, { title: "Speaking practice", description: null, category: null, priority: "MEDIUM", dueDate: "2027-03-08", dueTime: null, rrule: "FREQ=DAILY", reminderMin: null, optional: true, isTopThree: false, parentId: null });
    await finishTask(ownerId, t.id, "DONE");
    await finishTask(ownerId, t.id, "DONE"); // double tap is harmless
    const all = await prisma.task.findMany({ where: { ownerId }, orderBy: { dueDate: "asc" } });
    expect(all.map((x) => [dateToLocal(x.dueDate!), x.status])).toEqual([["2027-03-08", "DONE"], ["2027-03-09", "OPEN"]]);
  });
});
