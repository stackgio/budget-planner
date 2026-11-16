import { describe, expect, it } from "vitest";
import { extraPaycheckMonths, officialPaydays, paydaysPerMonth, projectPaydays, isOnSchedule, anchorWarning } from "@/domain/payroll";
import { weekday } from "@/domain/dates";

const REGULAR = { kind: "REGULAR" as const, anchorOfficialDate: "2026-11-27", intervalDays: 14, earlyDepositOffsetDays: -1 };
const OVERTIME = { kind: "OVERTIME" as const, anchorOfficialDate: "2026-12-04", intervalDays: 14, earlyDepositOffsetDays: 0 };

describe("regular DOC payroll (provisional anchor 2026-11-27)", () => {
  const dates2027 = officialPaydays(REGULAR, "2027-01-01", "2027-12-31");

  it("produces 26 Friday paydays in 2027", () => {
    expect(dates2027).toHaveLength(26);
    for (const d of dates2027) expect(weekday(d)).toBe(5);
  });

  it("April 2027 official paydays are April 2, 16, 30", () => {
    expect(dates2027.filter((d) => d.startsWith("2027-04"))).toEqual(["2027-04-02", "2027-04-16", "2027-04-30"]);
  });

  it("October 2027 official paydays are October 1, 15, 29", () => {
    expect(dates2027.filter((d) => d.startsWith("2027-10"))).toEqual(["2027-10-01", "2027-10-15", "2027-10-29"]);
  });

  it("every 2027 month has the correct count; only April and October have three", () => {
    const counts = Object.fromEntries(paydaysPerMonth(dates2027));
    expect(counts).toEqual({
      "2027-01": 2, "2027-02": 2, "2027-03": 2, "2027-04": 3, "2027-05": 2, "2027-06": 2,
      "2027-07": 2, "2027-08": 2, "2027-09": 2, "2027-10": 3, "2027-11": 2, "2027-12": 2,
    });
    expect(extraPaycheckMonths(dates2027).map((m) => m.month)).toEqual(["2027-04", "2027-10"]);
  });

  it("expected early deposit can cross a month boundary (Oct 1 → Thu Sep 30)", () => {
    const p = projectPaydays(REGULAR, "2027-10-01", "2027-10-01")[0]!;
    expect(p.officialDate).toBe("2027-10-01");
    expect(p.expectedDepositDate).toBe("2027-09-30");
  });

  it("flags the Thanksgiving anchor and estimates the deposit on the prior business day", () => {
    const p = projectPaydays(REGULAR, "2026-11-27", "2026-11-27")[0]!;
    expect(p.holidayNote).toMatch(/Friday after Thanksgiving/);
    expect(p.expectedDepositDate).toBe("2026-11-25"); // Thu 11/26 is a bank holiday → Wed
  });

  it("flags Christmas Eve 2027 (observed state holiday)", () => {
    const p = projectPaydays(REGULAR, "2027-12-24", "2027-12-24")[0]!;
    expect(p.holidayNote).toMatch(/Christmas/);
  });

  it("changing the anchor recalculates projections", () => {
    const shifted = officialPaydays({ ...REGULAR, anchorOfficialDate: "2026-12-04" }, "2027-01-01", "2027-12-31");
    expect(shifted[0]).toBe("2027-01-01");
    expect(extraPaycheckMonths(shifted).map((m) => m.month)).toEqual(["2027-01", "2027-07", "2027-12"]);
    expect(isOnSchedule({ ...REGULAR, anchorOfficialDate: "2026-12-04" }, "2027-04-02")).toBe(false);
  });

  it("warns when an anchor is not a Friday", () => {
    expect(anchorWarning("2026-11-27")).toBeNull();
    expect(anchorWarning("2026-11-26")).not.toBeNull();
  });
});

describe("overtime payroll (anchor 2026-12-04)", () => {
  const ot = officialPaydays(OVERTIME, "2026-11-01", "2027-12-31");
  it("includes the previous overtime payday 2026-11-20 and alternates with regular weeks", () => {
    expect(ot).toContain("2026-11-20");
    const reg = new Set(officialPaydays(REGULAR, "2026-11-01", "2027-12-31"));
    for (const d of ot) expect(reg.has(d)).toBe(false);
  });
  it("has 27 Fridays in 2027 with deposits on the Friday itself", () => {
    const p = projectPaydays(OVERTIME, "2027-01-01", "2027-12-31");
    expect(p).toHaveLength(27);
    expect(p[1]!.expectedDepositDate).toBe(p[1]!.officialDate);
  });
  it("flags New Year's Day 2027", () => {
    const p = projectPaydays(OVERTIME, "2027-01-01", "2027-01-01")[0]!;
    expect(p.holidayNote).toMatch(/New Year/);
  });
});
