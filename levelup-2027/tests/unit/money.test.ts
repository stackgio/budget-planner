import { describe, expect, it } from "vitest";
import { estimateGross, formatCents, overtimeRateCents, parseDollarsToCents, parseHoursX100, workedHoursX100 } from "@/domain/money";

describe("money", () => {
  it("parses and formats exactly", () => {
    expect(parseDollarsToCents("$24.20")).toBe(2420);
    expect(parseDollarsToCents("1,234.5")).toBe(123450);
    expect(parseDollarsToCents("-5")).toBeNull();
    expect(parseDollarsToCents("1.234")).toBeNull();
    expect(formatCents(1001100)).toBe("$10,011.00");
  });
  it("overtime rate is $36.30 at 1.5x of $24.20", () => {
    expect(overtimeRateCents(2420, 15000)).toBe(3630);
  });
  it("separates regular-rate and overtime-rate hours", () => {
    const e = estimateGross(400, 800, 2420, 15000); // 4h regular + 8h OT
    expect(e.regularCents).toBe(9680);
    expect(e.overtimeCents).toBe(29040);
    expect(e.totalCents).toBe(38720);
  });
  it("rounds fractional hours to the cent", () => {
    expect(estimateGross(0, 125, 2420, 15000).overtimeCents).toBe(4538); // 1.25 × 36.30 = 45.375
  });
  it("computes worked hours minus breaks", () => {
    expect(workedHoursX100(new Date("2027-01-01T13:00:00Z"), new Date("2027-01-02T05:00:00Z"), 30)).toBe(1550);
    expect(parseHoursX100("8.5")).toBe(850);
  });
});
