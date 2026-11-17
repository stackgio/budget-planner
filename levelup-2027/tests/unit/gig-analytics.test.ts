import { describe, expect, it } from "vitest";
import {
  csvCell, gigTotals, mileageCostCents, milesFromOdometer, minutesBetween, parseMiles, parseOdometer, perHourCents, roundDiv, sessionEarnings, targetProgress,
} from "@/domain/gig";
import { elapsedDays, monthsIn, periodFor, weeksIn } from "@/domain/periods";
import { countByWeek, habitActivity, incomeBreakdown, incomeByMonth, netPayments, share, trendMonths } from "@/domain/analytics";

const s = (o: Partial<Parameters<typeof sessionEarnings>[0]> = {}) => ({
  minutes: 120, grossCents: 6_000, tipsCents: 2_000, tipsInGross: true, bonusCents: 0, bonusInGross: true, parkingTollsCents: 0, otherExpenseCents: 0, ...o,
});

describe("gig earnings", () => {
  it("never double-counts tips or bonuses included in gross", () => {
    expect(sessionEarnings(s())).toBe(6_000);
    expect(sessionEarnings(s({ tipsInGross: false }))).toBe(8_000);
    expect(sessionEarnings(s({ bonusCents: 500, bonusInGross: true }))).toBe(6_000);
    expect(sessionEarnings(s({ bonusCents: 500, bonusInGross: false }))).toBe(6_500);
  });
  it("profit = earnings − expenses − your mileage cost; tax reserve only when you set it", () => {
    const t = gigTotals([s({ parkingTollsCents: 300, otherExpenseCents: 150 })], [{ milesHundredths: 2_000 }], { costPerMileMills: 250, taxReserveBps: 1_500 });
    expect(t.expensesCents).toBe(450);
    expect(t.mileageCostCents).toBe(500);
    expect(t.estProfitCents).toBe(6_000 - 450 - 500);
    expect(t.taxReserveCents).toBe(Math.round(5_050 * 0.15));
    const none = gigTotals([s()], [{ milesHundredths: 2_000 }], { costPerMileMills: null, taxReserveBps: null });
    expect(none.mileageCostCents).toBeNull();
    expect(none.taxReserveCents).toBeNull();
    expect(none.estProfitCents).toBe(6_000);
  });
  it("negative profit never produces a negative tax reserve", () => {
    const t = gigTotals([s({ grossCents: 100, tipsCents: 0, otherExpenseCents: 5_000 })], [], { costPerMileMills: null, taxReserveBps: 2_500 });
    expect(t.estProfitCents).toBe(-4_900);
    expect(t.taxReserveCents).toBe(0);
    expect(t.estProfitPerHourCents).toBe(-2_450);
  });
  it("per-hour uses recorded minutes and never divides by zero", () => {
    expect(perHourCents(6_000, 120)).toBe(3_000);
    expect(perHourCents(1_000, 0)).toBeNull();
    expect(gigTotals([], [], { costPerMileMills: null, taxReserveBps: null }).earningsPerHourCents).toBeNull();
    expect(perHourCents(1_000, 45)).toBe(1_333);
  });
  it("rounding is symmetric and exact for cents", () => {
    expect(roundDiv(5, 2)).toBe(3);
    expect(roundDiv(-5, 2)).toBe(-3);
    expect(roundDiv(-1, 3)).toBe(0);
    expect(mileageCostCents(1, 670)).toBe(1); // 0.67¢ rounds to 1¢
    expect(mileageCostCents(100, 670)).toBe(67);
  });
  it("target progress handles zero and overshoot", () => {
    expect(targetProgress(25_000, 50_000)).toEqual({ pct: 50, remainingCents: 25_000 });
    expect(targetProgress(60_000, 50_000)).toEqual({ pct: 100, remainingCents: 0 });
    expect(targetProgress(10, 0).pct).toBeNull();
  });
  it("parses times, miles and odometers", () => {
    expect(minutesBetween("17:00", "20:30")).toBe(210);
    expect(minutesBetween("22:00", "01:00")).toBe(180);
    expect(parseMiles("23.4")).toBe(2_340);
    expect(parseMiles("1,203.25")).toBe(120_325);
    expect(parseMiles("-3")).toBeNull();
    expect(parseOdometer("45210.4")).toBe(452_104);
    expect(milesFromOdometer(452_104, 452_225)).toBe(1_210);
    expect(milesFromOdometer(10, 5)).toBeNull();
  });
  it("CSV cells are escaped and formula-safe", () => {
    expect(csvCell('He said "hi", ok')).toBe('"He said ""hi"", ok"');
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("-cmd")).toBe("'-cmd");
    expect(csvCell("-12.50")).toBe("'-12.50");
    expect(csvCell(42)).toBe("42");
    expect(csvCell(null)).toBe("");
  });
});

describe("periods (local dates, Sat–Fri weeks)", () => {
  it("week runs Saturday to Friday", () => {
    const p = periodFor("week", "2027-02-10"); // Wednesday
    expect(p.from).toBe("2027-02-06");
    expect(p.to).toBe("2027-02-12");
    expect(p.prev).toBe("2027-01-30");
  });
  it("month, quarter, year boundaries incl. leap year", () => {
    expect(periodFor("month", "2028-02-15")).toMatchObject({ from: "2028-02-01", to: "2028-02-29", days: 29 });
    expect(periodFor("quarter", "2027-11-03")).toMatchObject({ from: "2027-10-01", to: "2027-12-31", next: "2028-01-01", prev: "2027-07-01" });
    expect(periodFor("year", "2027-06-01")).toMatchObject({ from: "2027-01-01", to: "2027-12-31", days: 365 });
  });
  it("custom ranges are ordered and bounded", () => {
    expect(periodFor("custom", "2027-03-01", { from: "2027-03-10", to: "2027-03-01" })).toMatchObject({ from: "2027-03-10", to: "2027-03-10" });
    expect(periodFor("custom", "2027-03-01", { from: "2020-01-01", to: "2027-01-01" }).days).toBe(366 * 3);
    expect(periodFor("custom", "2027-03-01", { from: "bad", to: null }).from).toBe("2027-03-01");
  });
  it("months, weeks and elapsed days", () => {
    expect(monthsIn("2026-11-15", "2027-02-01")).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"]);
    expect(weeksIn("2027-02-01", "2027-02-28")[0]).toBe("2027-01-30");
    expect(elapsedDays("2027-02-01", "2027-02-28", "2027-02-10")).toBe(10);
    expect(elapsedDays("2027-02-01", "2027-02-28", "2027-02-10", "2027-02-08")).toBe(3);
    expect(elapsedDays("2027-03-01", "2027-03-31", "2027-02-10")).toBe(0);
  });
});

describe("analytics", () => {
  const deps = [
    { kind: "REGULAR" as const, date: "2027-01-08", netCents: 150_000 },
    { kind: "OVERTIME" as const, date: "2027-01-15", netCents: 61_240 },
    { kind: "GIG" as const, date: "2027-01-20", netCents: 9_000 },
    { kind: "REGULAR" as const, date: "2027-02-05", netCents: 150_000 },
  ];
  it("separates income by source and respects the range", () => {
    expect(incomeBreakdown(deps, "2027-01-01", "2027-01-31")).toEqual({ regularCents: 150_000, overtimeCents: 61_240, gigCents: 9_000, otherCents: 0, totalCents: 220_240 });
    expect(incomeBreakdown([], "2027-01-01", "2027-01-31").totalCents).toBe(0);
  });
  it("monthly trend includes empty months as zero, never invented values", () => {
    const m = incomeByMonth(deps, ["2026-12", "2027-01", "2027-02"]);
    expect(m.map((x) => x.totalCents)).toEqual([0, 220_240, 150_000]);
  });
  it("trend uses the last 6 months for short periods", () => {
    expect(trendMonths(["2027-02"], "2027-02-28")).toEqual(["2026-09", "2026-10", "2026-11", "2026-12", "2027-01", "2027-02"]);
    expect(trendMonths(["2027-01", "2027-02", "2027-03"], "2027-03-31")).toHaveLength(3);
  });
  it("habit activity uses the habit's own target and elapsed days only", () => {
    expect(habitActivity(4, 7, 7)).toEqual({ done: 4, expected: 7, pct: 57 });
    expect(habitActivity(3, 3, 14)).toEqual({ done: 3, expected: 6, pct: 50 });
    expect(habitActivity(0, 3, 0).pct).toBeNull();
    expect(habitActivity(9, 3, 7).pct).toBe(100);
  });
  it("shares and net payments (reversals cancel)", () => {
    expect(share(0, 0)).toBeNull();
    expect(share(1, 3)).toBe(33);
    expect(netPayments([{ kind: "ROTH_CONTRIBUTION", amountCents: 10_000 }, { kind: "ROTH_CONTRIBUTION", amountCents: -10_000 }, { kind: "FUN_MONEY", amountCents: 500 }], ["ROTH_CONTRIBUTION"])).toBe(0);
  });
  it("counts per week", () => {
    expect(countByWeek(["2027-02-06", "2027-02-12", "2027-02-13"], ["2027-02-06", "2027-02-13"])).toEqual([{ week: "2027-02-06", count: 2 }, { week: "2027-02-13", count: 1 }]);
  });
});

import { classify, fingerprint } from "@/domain/imports";
describe("import review (duplicate detection)", () => {
  const c = (o: Partial<Parameters<typeof fingerprint>[0]> & { externalId?: string } = {}) => ({ source: "doordash", externalId: "A1", kind: "GIG_PAYOUT" as const, date: "2027-02-09", amountCents: 7_000, title: "Weekly payout", ...o });
  it("flags exact re-imports, possible duplicates and in-batch duplicates; nothing is auto-imported", () => {
    const existing = [{ source: "doordash", externalId: "A1", kind: "GIG_PAYOUT" as const, date: "2027-02-09", amountCents: 7_000, title: "Weekly payout" }, { kind: "GIG_PAYOUT" as const, date: "2027-02-16", amountCents: 5_000, title: "weekly  PAYOUT!" }];
    const r = classify([c(), c({ externalId: "B2", date: "2027-02-16", amountCents: 5_000 }), c({ externalId: "C3", date: "2027-02-23" }), c({ externalId: "C3", date: "2027-02-23" })], existing);
    expect(r.map((x) => x.decision)).toEqual(["ALREADY_IMPORTED", "POSSIBLE_DUPLICATE", "NEW", "ALREADY_IMPORTED"]);
    expect(r[2]!.reason).toMatch(/only if you approve/);
  });
});
