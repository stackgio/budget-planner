import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { createOwner } from "@/server/bootstrap";
import { ensurePaydays, recordDeposit, setPaydayStatus, updateSchedule, voidDeposit, UserError } from "@/server/payroll";
import { dateToLocal, localToDbDate } from "@/domain/dates";
import { extraPaycheckMonths } from "@/domain/payroll";
import { freshOwner, resetDb } from "./helpers";

let ownerId: string;
beforeEach(async () => { ownerId = (await freshOwner()).id; });

const regDates = async () => (await prisma.payday.findMany({ where: { ownerId, kind: "REGULAR" }, orderBy: { officialDate: "asc" } })).map((p) => dateToLocal(p.officialDate));

describe("owner setup seeds only confirmed configuration", () => {
  it("creates schedules, pay rate, DOC series, habits and challenges — and no income", async () => {
    const reg = await prisma.paySchedule.findUniqueOrThrow({ where: { ownerId_kind: { ownerId, kind: "REGULAR" } } });
    expect(dateToLocal(reg.anchorOfficialDate)).toBe("2026-11-27");
    expect(reg.anchorVerified).toBe(false);
    const rate = await prisma.payRate.findFirstOrThrow({ where: { ownerId } });
    expect([rate.regularHourlyCents, rate.overtimeMultiplierBp, rate.provisional]).toEqual([2420, 15000, true]);
    expect(await prisma.incomeDeposit.count()).toBe(0);
    expect(await prisma.payday.count({ where: { status: { not: "EXPECTED" } } })).toBe(0);
    const doc = await prisma.calendarEvent.findFirstOrThrow({ where: { ownerId, sourceType: "DOC_SCHEDULE" } });
    expect(doc.rrule).toBe("FREQ=WEEKLY;BYDAY=SA,SU,MO,TU,WE");
    expect(await prisma.habit.count({ where: { ownerId } })).toBe(8);
  });

  it("seeds Moving-Out (141 tiles, $10,011, 0 complete), SCHD (next Day 38, 1–37 provisional), Debt setup-required", async () => {
    const ch = await prisma.challenge.findMany({ where: { ownerId }, include: { tiles: true } });
    const mo = ch.find((c) => c.kind === "MOVING_OUT")!;
    expect(mo.tiles).toHaveLength(141);
    expect(mo.targetCents).toBe(1_001_100);
    expect(mo.tiles.reduce((s, t) => s + t.amountCents, 0)).toBe(1_001_100);
    expect(mo.tiles.every((t) => t.status === "OPEN")).toBe(true);
    const schd = ch.find((c) => c.kind === "SCHD")!;
    expect(schd.nextNumber).toBe(38);
    expect(schd.targetCents).toBe(505_000);
    expect(schd.tiles.filter((t) => t.status === "PROVISIONAL").map((t) => t.number)).toEqual(Array.from({ length: 37 }, (_, i) => i + 1));
    expect(schd.tiles.some((t) => t.status === "COMPLETED")).toBe(false);
    const debt = ch.find((c) => c.kind === "DEBT")!;
    expect([debt.status, debt.targetCents, debt.tiles.length]).toEqual(["SETUP_REQUIRED", null, 0]);
  });

  it("is single-owner, even under concurrent setup", async () => {
    await resetDb();
    const results = await Promise.allSettled([1, 2, 3].map((i) => createOwner(prisma, `o${i}@example.test`, "x")));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.user.count()).toBe(1);
  });
});

describe("payroll persistence", () => {
  it("materializes April and October 2027 as three-paycheck months", async () => {
    const months = extraPaycheckMonths((await regDates()).filter((d) => d.startsWith("2027")));
    expect(months.map((m) => [m.month, m.officialDates])).toEqual([
      ["2027-04", ["2027-04-02", "2027-04-16", "2027-04-30"]],
      ["2027-10", ["2027-10-01", "2027-10-15", "2027-10-29"]],
    ]);
  });

  it("ensurePaydays is idempotent (no duplicates)", async () => {
    const n = await prisma.payday.count();
    await ensurePaydays(ownerId);
    await ensurePaydays(ownerId);
    expect(await prisma.payday.count()).toBe(n);
  });

  it("never creates income from a scheduled payday; deposits are confirmed explicitly and only once", async () => {
    const p = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "REGULAR", officialDate: localToDbDate("2027-01-08") } });
    expect(p.status).toBe("EXPECTED");
    await recordDeposit(ownerId, p.id, { netCents: 148237, actualDepositDate: "2027-01-07" });
    await expect(recordDeposit(ownerId, p.id, { netCents: 148237, actualDepositDate: "2027-01-07" })).rejects.toBeInstanceOf(UserError);
    // Concurrent double-submit
    const p2 = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "REGULAR", officialDate: localToDbDate("2027-01-22") } });
    const r = await Promise.allSettled([1, 2, 3].map(() => recordDeposit(ownerId, p2.id, { netCents: 100, actualDepositDate: "2027-01-21" })));
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.incomeDeposit.count()).toBe(2);
    const d = await prisma.incomeDeposit.findFirstOrThrow({ where: { paydayId: p.id } });
    expect([d.kind, d.netCents, dateToLocal(d.actualDepositDate)]).toEqual(["REGULAR", 148237, "2027-01-07"]);
  });

  it("overtime deposits are separate from regular and a $0 overtime payday creates no income", async () => {
    const ot = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "OVERTIME", officialDate: localToDbDate("2027-01-15") } });
    await setPaydayStatus(ownerId, ot.id, "ZERO", "No overtime");
    expect(await prisma.incomeDeposit.count()).toBe(0);
    await expect(recordDeposit(ownerId, ot.id, { netCents: 1, actualDepositDate: "2027-01-15" })).resolves.toBeTruthy(); // still allowed if money actually arrived
    const dep = await prisma.incomeDeposit.findFirstOrThrow();
    expect(dep.kind).toBe("OVERTIME");
  });

  it("changing the anchor recalculates projections but preserves confirmed deposits and overrides", async () => {
    const jan8 = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "REGULAR", officialDate: localToDbDate("2027-01-08") } });
    await recordDeposit(ownerId, jan8.id, { netCents: 150000, actualDepositDate: "2027-01-07" });
    const feb5 = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "REGULAR", officialDate: localToDbDate("2027-02-05") } });
    await prisma.payday.update({ where: { id: feb5.id }, data: { manualDepositDate: localToDbDate("2027-02-03") } });

    const res = await updateSchedule(ownerId, "REGULAR", { anchorOfficialDate: "2026-12-04", anchorVerified: true, earlyDepositOffsetDays: -1 });
    expect(res.anchorChanged).toBe(true);
    expect(res.preserved).toBe(2);
    const dates = await regDates();
    expect(dates).toContain("2027-01-08"); // kept: has a confirmed deposit
    expect(dates).toContain("2027-02-05"); // kept: has a manual override
    expect(dates).not.toContain("2027-04-02"); // projection recalculated away
    expect(dates).toContain("2027-01-01");
    expect(await prisma.incomeDeposit.count()).toBe(1);
    const months = extraPaycheckMonths(dates.filter((d) => d.startsWith("2027"))).map((m) => m.month);
    expect(months).toContain("2027-07");
    expect(await prisma.auditLog.count({ where: { entity: "PaySchedule" } })).toBe(1);
  });

  it("corrections keep an audit trail", async () => {
    const p = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "REGULAR", officialDate: localToDbDate("2027-01-08") } });
    await recordDeposit(ownerId, p.id, { netCents: 999, actualDepositDate: "2027-01-07" });
    await voidDeposit(ownerId, p.id, "typo");
    expect(await prisma.incomeDeposit.count()).toBe(0);
    expect((await prisma.payday.findUniqueOrThrow({ where: { id: p.id } })).status).toBe("EXPECTED");
    const log = await prisma.auditLog.findMany({ where: { entity: "IncomeDeposit" }, orderBy: { at: "asc" } });
    expect(log.map((l) => l.action)).toEqual(["confirm", "void: typo"]);
    expect((log[1]!.before as { netCents: number }).netCents).toBe(999);
  });
});
