import { describe, expect, it } from "vitest";
import {
  adjustedWeeklyTarget, alphabetProgress, comparePay, dateSpending, goalProgress, heavyDaysIn, milestoneBuckets,
  monthOf, nextAnniversary, nextWeekdays, suggestSlots, weekOf,
} from "@/domain/growth";
import { zonedToInstant } from "@/domain/dates";

const base = { targetX100: null, status: "ACTIVE" as const, manualEntries: [], milestones: [], tasks: [] };

describe("goal progress never invents activity", () => {
  it("manual: latest entry is current; no entries → 0", () => {
    expect(goalProgress({ ...base, source: "MANUAL", targetX100: 2000 }).pct).toBe(0);
    const p = goalProgress({ ...base, source: "MANUAL", targetX100: 2000, manualEntries: [
      { valueX100: 500, recordedOn: "2027-01-01", createdAt: new Date(1) },
      { valueX100: 1200, recordedOn: "2027-02-01", createdAt: new Date(2) },
    ] });
    expect([p.current, p.pct]).toEqual([12, 60]);
  });
  it("milestones and tasks", () => {
    expect(goalProgress({ ...base, source: "MILESTONES", milestones: [{ completed: true }, { completed: false }] }).pct).toBe(50);
    expect(goalProgress({ ...base, source: "TASKS", tasks: [] }).pct).toBeNull();
  });
  it("finance reads confirmed cents only; activity and workouts use logged counts; capped at 100%", () => {
    expect(goalProgress({ ...base, source: "CHALLENGE", targetX100: 1_001_100, challengeConfirmedCents: 100_000 }).current).toBe(1000);
    expect(goalProgress({ ...base, source: "WORKOUTS", targetX100: 1200, workoutsLogged: 30 }).pct).toBe(100);
    expect(goalProgress({ ...base, source: "ACTIVITY", targetX100: 60000, activityMinutes: 150 }).pct).toBe(25); // 150 of 600 minutes
  });
  it("milestone buckets", () => {
    const b = milestoneBuckets([{ dueDate: "2027-01-01", completedAt: null }, { dueDate: "2027-01-20", completedAt: null }, { dueDate: "2027-01-02", completedAt: new Date() }], "2027-01-10");
    expect([b.overdue.length, b.upcoming.length]).toEqual([1, 1]);
  });
});

describe("periods and work modes", () => {
  it("weeks run Saturday → Friday", () => {
    expect(weekOf("2027-03-10")).toEqual({ start: "2027-03-06", end: "2027-03-12" });
    expect(monthOf("2027-02-10")).toEqual({ start: "2027-02-01", end: "2027-02-28" });
  });
  it("heavy days reduce optional targets, never below zero", () => {
    const wk = { start: "2027-03-06", end: "2027-03-12" };
    expect(heavyDaysIn(wk, [{ startDay: "2027-03-05", endDay: "2027-03-07" }, { startDay: "2027-03-07", endDay: "2027-03-07" }])).toBe(2);
    expect(adjustedWeeklyTarget(3, 2)).toEqual({ target: 1, reducedBy: 2 });
    expect(adjustedWeeklyTarget(3, 9)).toEqual({ target: 0, reducedBy: 3 });
  });
});

describe("schedule suggestions avoid DOC shifts and only suggest", () => {
  const TZ = "America/New_York";
  const toInstant = (d: string, t: string) => zonedToInstant(d, t, TZ);
  it("Monday 8–4 shift: suggests the evening; Thursday off: keeps the preferred time", () => {
    const busy = [{ start: toInstant("2027-03-08", "08:00"), end: toInstant("2027-03-08", "16:00"), title: "DOC shift" }];
    const s = suggestSlots({ days: ["2027-03-08", "2027-03-11"], durationMin: 45, busy, toInstant, preferredTime: "09:00", latest: "21:00" });
    expect(s[0]!.start >= toInstant("2027-03-08", "16:30")).toBe(true);
    expect(s[1]!.start.getTime()).toBe(toInstant("2027-03-11", "09:00").getTime());
  });
  it("next weekdays", () => {
    expect(nextWeekdays("2027-03-08", [1, 3, 4], 3)).toEqual(["2027-03-08", "2027-03-10", "2027-03-11"]);
  });
});

describe("relationship", () => {
  it("Alphabet Dating progress and next letter", () => {
    expect(alphabetProgress([{ letter: "A", status: "COMPLETED" }, { letter: "B", status: "PLANNED" }])).toMatchObject({ completed: 1, next: "B" });
    expect(alphabetProgress([]).next).toBe("A");
  });
  it("date spending counts each date once and only completed dates", () => {
    expect(dateSpending([
      { status: "COMPLETED", actualCostCents: 4_000, linkedPaymentCents: null },
      { status: "COMPLETED", actualCostCents: null, linkedPaymentCents: 6_000 },
      { status: "PLANNED", actualCostCents: 9_999, linkedPaymentCents: null },
    ])).toEqual({ manualCents: 4_000, linkedCents: 6_000, totalCents: 10_000 });
  });
  it("anniversaries roll to next year; Feb 29 falls back", () => {
    expect(nextAnniversary(2, 14, "2027-03-01")).toBe("2028-02-14");
    expect(nextAnniversary(2, 29, "2027-01-01")).toBe("2027-02-28");
  });
});

describe("career pay comparison uses entered numbers only", () => {
  it("annualizes $24.20/h", () => {
    const c = comparePay(2420, { minCents: 2600, maxCents: null, period: "HOURLY" });
    expect(c.currentAnnualCents).toBe(5_033_600);
    expect(c.minDiffCents).toBe(374_400);
    expect(c.maxAnnualCents).toBeNull();
  });
});
