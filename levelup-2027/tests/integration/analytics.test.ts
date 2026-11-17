import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { recordDeposit } from "@/server/payroll";
import { approvePlan, completeLine, spin } from "@/server/ledger";
import { confirmPayout, listPlatforms, saveSession } from "@/server/gig";
import { loadAnalytics } from "@/server/analytics";
import { localToDbDate } from "@/domain/dates";
import { periodFor } from "@/domain/periods";
import { seedOwnerConfig } from "@/server/bootstrap";
import { freshOwner } from "./helpers";

const TZ = "America/New_York";
let ownerId: string;
beforeEach(async () => { ownerId = (await freshOwner()).id; });
const key = () => randomUUID();

async function deposit(kind: "OVERTIME" | "REGULAR", cents: number, actual: string) {
  const p = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind, deposits: { none: {} }, officialDate: { gte: localToDbDate(actual) } }, orderBy: { officialDate: "asc" } });
  return recordDeposit(ownerId, p.id, { netCents: cents, actualDepositDate: actual, idempotencyKey: key() });
}

describe("Analytics", () => {
  it("empty account: zeros and empty arrays, never fabricated activity", async () => {
    const a = await loadAnalytics(ownerId, periodFor("month", "2027-02-10"), "2027-02-28", TZ, "2027-01-01");
    expect(a.finance.income.totalCents).toBe(0);
    expect(a.finance.trend.every((m) => m.totalCents === 0)).toBe(true);
    expect(a.growth.workouts.completed).toBe(0);
    expect(a.growth.workouts.byWeek.every((w) => w.count === 0)).toBe(true);
    expect(a.growth.habits.every((h) => h.done === 0)).toBe(true);
    expect(a.finance.gig.earningsCents).toBe(0);
  });

  it("confirmed income only, split by source; projected paydays reported separately; transfers aren't income", async () => {
    const ot = await deposit("OVERTIME", 61_240, "2027-02-04");
    await deposit("REGULAR", 150_000, "2027-02-11");
    const dd = (await listPlatforms(ownerId)).find((p) => p.name === "DoorDash")!.id;
    await saveSession(ownerId, TZ, null, { platformId: dd, workDate: "2027-02-06", minutes: 180, grossCents: 9_000, tipsCents: 0, tipsInGross: true, bonusCents: 0, bonusInGross: true, parkingTollsCents: 0, otherExpenseCents: 0 });
    await confirmPayout(ownerId, { platformId: dd, netCents: 8_800, depositDate: "2027-02-09", sessionIds: [], idempotencyKey: key() });
    // move some overtime into Roth etc. — these are transfers, not new income
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: ot.id, seed: "a" });
    await approvePlan(ownerId, planId);
    const roth = await prisma.allocationLine.findFirstOrThrow({ where: { planId, target: "ROTH" } });
    await completeLine(ownerId, roth.id, { paidOn: "2027-02-05", paidCents: roth.amountCents, idempotencyKey: key() });

    const a = await loadAnalytics(ownerId, periodFor("month", "2027-02-10"), "2027-02-28", TZ, "2027-01-01");
    expect(a.finance.income).toMatchObject({ regularCents: 150_000, overtimeCents: 61_240, gigCents: 8_800, totalCents: 220_040 });
    expect(a.finance.rothCents).toBe(roth.amountCents);
    expect(a.finance.income.totalCents).toBe(150_000 + 61_240 + 8_800); // Roth transfer did not add income
    expect(a.finance.gig).toMatchObject({ earningsCents: 9_000, payoutsCents: 8_800 });
    expect(a.finance.projectedUnconfirmedPaydays).toBeGreaterThan(0);
    const feb = a.finance.trend.find((m) => m.month === "2027-02")!;
    expect(feb.totalCents).toBe(220_040);
  });

  it("date-range filtering uses local dates at the boundaries", async () => {
    await deposit("OVERTIME", 10_000, "2027-01-31");
    await deposit("OVERTIME", 20_000, "2027-02-01");
    const jan = await loadAnalytics(ownerId, periodFor("month", "2027-01-15"), "2027-03-01", TZ, "2026-12-01");
    const feb = await loadAnalytics(ownerId, periodFor("month", "2027-02-15"), "2027-03-01", TZ, "2026-12-01");
    expect(jan.finance.income.overtimeCents).toBe(10_000);
    expect(feb.finance.income.overtimeCents).toBe(20_000);
    const custom = await loadAnalytics(ownerId, periodFor("custom", "2027-02-15", { from: "2027-01-31", to: "2027-02-01" }), "2027-03-01", TZ, "2026-12-01");
    expect(custom.finance.income.overtimeCents).toBe(30_000);
  });

  it("habit denominators count only elapsed days since you started", async () => {
    const h = await prisma.habit.findFirstOrThrow({ where: { ownerId } });
    await prisma.habitCheckIn.createMany({ data: ["2027-02-08", "2027-02-09"].map((d) => ({ habitId: h.id, date: localToDbDate(d) })) });
    const a = await loadAnalytics(ownerId, periodFor("month", "2027-02-10"), "2027-02-10", TZ, "2027-02-08");
    expect(a.elapsedDays).toBe(3);
    const row = a.growth.habits.find((x) => x.name === h.name)!;
    expect(row.done).toBe(2);
    expect(row.expected).toBe(Math.round((h.targetPerWeek * 3) / 7));
  });

  it("another account's records never appear", async () => {
    await deposit("OVERTIME", 10_000, "2027-02-04");
    const other = (await prisma.user.create({ data: { email: "x@example.test", passwordHash: "x" } })).id;
    await seedOwnerConfig(prisma, other);
    const a = await loadAnalytics(other, periodFor("month", "2027-02-10"), "2027-02-28", TZ, "2027-01-01");
    expect(a.finance.income.totalCents).toBe(0);
  });
});
