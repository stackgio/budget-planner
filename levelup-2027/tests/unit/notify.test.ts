import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, decide, inQuietHours, planDay, publicText, quietEndAfter, type DayFacts, type Prefs } from "@/domain/notify";
import { instantToLocalTime, zonedToInstant } from "@/domain/dates";

const TZ = "America/New_York";
const prefs: Prefs = { ...DEFAULT_PREFS, briefingTime: "06:00", checkInTime: "17:00", reflectionTime: "21:00" };
const empty = (day: string): DayFacts => ({ day, paydays: [], extraMonths: [], waiting: { roth: 0, tiles: 0, other: 0, oldestApprovedDay: null }, milestones: [], jobs: [], workouts: [], dates: [], importantDates: [], faithReminders: [] });
const t = (d: string, hm: string) => zonedToInstant(d, hm, TZ);

describe("daily briefings at 6 AM, 5 PM and 9 PM New York time", () => {
  it("plans exactly three daily items with stable keys", () => {
    const c = planDay(empty("2027-01-12"), prefs, TZ);
    expect(c.map((x) => [x.dedupeKey, instantToLocalTime(x.scheduledFor, TZ)])).toEqual([
      ["briefing:2027-01-12", "06:00"], ["checkin:2027-01-12", "17:00"], ["reflection:2027-01-12", "21:00"],
    ]);
    expect(planDay(empty("2027-01-12"), prefs, TZ).map((x) => x.dedupeKey)).toEqual(c.map((x) => x.dedupeKey)); // idempotent
  });
  it("stays at 6:00 AM local across both DST changes", () => {
    for (const d of ["2027-03-13", "2027-03-14", "2027-03-15", "2027-11-06", "2027-11-07", "2027-11-08"]) {
      expect(instantToLocalTime(planDay(empty(d), prefs, TZ)[0]!.scheduledFor, TZ)).toBe("06:00");
    }
    const before = planDay(empty("2027-03-13"), prefs, TZ)[0]!.scheduledFor.toISOString();
    const after = planDay(empty("2027-03-15"), prefs, TZ)[0]!.scheduledFor.toISOString();
    expect([before, after]).toEqual(["2027-03-13T11:00:00.000Z", "2027-03-15T10:00:00.000Z"]);
  });
  it("respects disabled daily items and custom times", () => {
    const c = planDay(empty("2027-01-12"), { ...prefs, checkInEnabled: false, briefingTime: "05:30" }, TZ);
    expect(c.map((x) => x.dedupeKey)).toEqual(["briefing:2027-01-12", "reflection:2027-01-12"]);
    expect(instantToLocalTime(c[0]!.scheduledFor, TZ)).toBe("05:30");
  });
});

describe("reminders from stored facts", () => {
  it("projected paydays are labelled as projected, never as received", () => {
    const f = { ...empty("2027-04-01"), paydays: [{ kind: "REGULAR" as const, officialDate: "2027-04-02", provisional: true }] };
    const p = planDay(f, prefs, TZ).find((x) => x.category === "PAYDAY")!;
    expect(p.detail).toMatch(/projected/);
    expect(p.detail).not.toMatch(/received|arrived\./i);
  });
  it("extra-paycheck month 30 days ahead and a week before the third payday", () => {
    const m = { month: "2027-04", officialDates: ["2027-04-02", "2027-04-16", "2027-04-30"], provisional: true };
    expect(planDay({ ...empty("2027-03-02"), extraMonths: [m] }, prefs, TZ).some((x) => x.dedupeKey === "extra:2027-04:T-30")).toBe(true);
    expect(planDay({ ...empty("2027-04-23"), extraMonths: [m] }, prefs, TZ).some((x) => x.dedupeKey === "extra:2027-04:third:T-7")).toBe(true);
  });
  it("transfers waiting a week become important", () => {
    const c = planDay({ ...empty("2027-01-20"), waiting: { roth: 1, tiles: 2, other: 0, oldestApprovedDay: "2027-01-10" } }, prefs, TZ);
    expect(c.filter((x) => ["ROTH", "CHALLENGE"].includes(x.category)).map((x) => x.priority)).toEqual(["IMPORTANT", "IMPORTANT"]);
  });
  it("weekly review on Fridays, monthly review on the last day", () => {
    expect(planDay(empty("2027-01-15"), prefs, TZ).some((x) => x.dedupeKey === "review:week:2027-01-09")).toBe(true);
    expect(planDay(empty("2027-02-28"), prefs, TZ).some((x) => x.dedupeKey === "review:month:2027-02")).toBe(true);
  });
  it("workout reminder an hour before, expiring at start; date night 3 hours before is important", () => {
    const f = { ...empty("2027-01-14"), workouts: [{ key: "w1", title: "Full Body A", start: t("2027-01-14", "17:30") }], dates: [{ id: "d1", title: "Aquarium", start: t("2027-01-14", "18:30") }] };
    const c = planDay(f, prefs, TZ);
    const w = c.find((x) => x.category === "WORKOUT")!;
    expect([instantToLocalTime(w.scheduledFor, TZ), w.expiresAt.getTime()]).toEqual(["16:30", t("2027-01-14", "17:30").getTime()]);
    expect(c.find((x) => x.category === "RELATIONSHIP")!.priority).toBe("IMPORTANT");
  });
});

describe("delivery decisions", () => {
  const base = { category: "WORKOUT" as const, priority: "LOW" as const, dueAt: t("2027-01-14", "16:30"), expiresAt: t("2027-01-14", "17:30") };
  const ctx = (now: Date, mode: "NORMAL" | "OVERTIME" | "ACTIVATION" | "RECOVERY" = "NORMAL", p: Prefs = prefs) => ({ now, tz: TZ, prefs: p, mode });

  it("waits, delivers, and expires instead of flooding late", () => {
    expect(decide(base, ctx(t("2027-01-14", "16:00"))).action).toBe("WAIT");
    expect(decide(base, ctx(t("2027-01-14", "16:31"))).action).toBe("DELIVER");
    expect(decide(base, ctx(t("2027-01-16", "09:00"))).action).toBe("EXPIRE"); // worker was down for 2 days
  });
  for (const mode of ["OVERTIME", "ACTIVATION", "RECOVERY"] as const) {
    it(`${mode.toLowerCase()} suppresses non-important reminders but keeps important ones`, () => {
      expect(decide(base, ctx(t("2027-01-14", "16:31"), mode))).toMatchObject({ action: "SUPPRESS" });
      expect(decide({ ...base, priority: "IMPORTANT" }, ctx(t("2027-01-14", "16:31"), mode)).action).toBe("DELIVER");
      expect(decide(base, ctx(t("2027-01-14", "16:31"), mode, { ...prefs, modeRules: { ...prefs.modeRules, [mode]: "ALL" } })).action).toBe("DELIVER");
    });
  }
  it("disabled categories are suppressed", () => {
    expect(decide(base, ctx(t("2027-01-14", "16:31"), "NORMAL", { ...prefs, categories: { ...prefs.categories, WORKOUT: false } })).action).toBe("SUPPRESS");
  });
  it("quiet hours defer to the end of quiet time, across midnight", () => {
    expect(inQuietHours(t("2027-01-14", "23:30"), TZ, "21:45", "05:45")).toBe(true);
    expect(inQuietHours(t("2027-01-14", "05:44"), TZ, "21:45", "05:45")).toBe(true);
    expect(inQuietHours(t("2027-01-14", "05:45"), TZ, "21:45", "05:45")).toBe(false);
    const n = { category: "REVIEW" as const, priority: "NORMAL" as const, dueAt: t("2027-01-15", "22:00"), expiresAt: t("2027-01-17", "12:00") };
    const d = decide(n, ctx(t("2027-01-15", "22:05")));
    expect(d.action).toBe("DEFER");
    if (d.action === "DEFER") expect(d.until.getTime()).toBe(t("2027-01-16", "05:45").getTime());
    // A reminder that would be stale by morning expires instead of arriving late.
    expect(decide({ ...n, expiresAt: t("2027-01-15", "23:00") }, ctx(t("2027-01-15", "22:05"))).action).toBe("EXPIRE");
    expect(quietEndAfter(t("2027-03-14", "01:00"), TZ, "05:45").getTime()).toBe(t("2027-03-14", "05:45").getTime()); // DST night
  });
  it("lock-screen text is generic by default", () => {
    expect(publicText({ category: "ROTH", detail: "1 planned Roth IRA contribution of $100" }, false).preview).not.toMatch(/\$|100/);
    expect(publicText({ category: "ROTH", detail: "detail" }, true).preview).toBe("detail");
  });
});
