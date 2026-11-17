import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { recordDeposit } from "@/server/payroll";
import {
  approvePlan, cancelLine, challengeTotals, completeLine, importSchdHistory, markSchdDayNotDone, reconcile,
  recordManualPayment, reversePayment, rothRoom, setRothLineTaxYear, spin,
} from "@/server/ledger";
import { localToDbDate } from "@/domain/dates";
import { freshOwner } from "./helpers";

let ownerId: string;
beforeEach(async () => { ownerId = (await freshOwner()).id; });
const key = () => randomUUID();

async function otDeposit(cents: number, actual = "2027-01-15") {
  const p = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "OVERTIME", deposits: { none: {} }, officialDate: { gte: new Date("2027-01-01") } }, orderBy: { officialDate: "asc" } });
  return recordDeposit(ownerId, p.id, { netCents: cents, actualDepositDate: actual, idempotencyKey: key() });
}
const schdPlan = async (cents: number) => {
  const d = await otDeposit(cents);
  const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id, rothCents: 0, funCents: 0, leftoverToFun: false, challengesOnly: ["SCHD"] });
  return { d, planId, lines: await prisma.allocationLine.findMany({ where: { planId }, include: { tile: true }, orderBy: { sortOrder: "asc" } }) };
};
const nextDay = async () => (await challengeTotals(ownerId)).find((c) => c.kind === "SCHD")!.nextDay;

describe("Correction B — Roth tax year on every planned, reserved and confirmed contribution", () => {
  it("lines carry the deposit's tax year; room is computed per tax year", async () => {
    await prisma.rothYear.createMany({ data: [{ ownerId, taxYear: 2026, limitCents: 50_000 }, { ownerId, taxYear: 2027, limitCents: 50_000 }] });
    const d = await otDeposit(30_000, "2027-01-15");
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
    const roth = await prisma.allocationLine.findFirstOrThrow({ where: { planId, target: "ROTH" } });
    expect(roth.taxYear).toBe(2027);
    expect((await rothRoom(prisma, ownerId, 2027)).plannedCents).toBe(0); // drafts are not planned money
    await approvePlan(ownerId, planId);
    expect((await rothRoom(prisma, ownerId, 2027)).plannedCents).toBe(10_000);
    expect((await rothRoom(prisma, ownerId, 2026)).plannedCents).toBe(0);

    // Re-target to the prior tax year before confirming (e.g. a contribution before the April deadline).
    await setRothLineTaxYear(ownerId, roth.id, 2026);
    expect((await rothRoom(prisma, ownerId, 2027)).plannedCents).toBe(0);
    expect((await rothRoom(prisma, ownerId, 2026)).plannedCents).toBe(10_000);

    // Confirming defaults to the line's intended year; reserved and confirmed reconcile without double counting.
    await completeLine(ownerId, roth.id, { paidCents: 10_000, paidOn: "2027-02-01", idempotencyKey: key() });
    const r26 = await rothRoom(prisma, ownerId, 2026);
    expect([r26.confirmedCents, r26.plannedCents, r26.remainingCents]).toEqual([10_000, 0, 40_000]);
    expect((await prisma.payment.findFirstOrThrow({ where: { lineId: roth.id } })).taxYear).toBe(2026);
    await expect(setRothLineTaxYear(ownerId, roth.id, 2027)).rejects.toThrow(/Already confirmed/);
  });

  it("an explicit year at confirmation updates the line too; existing history is preserved", async () => {
    await recordManualPayment(ownerId, { kind: "ROTH", amountCents: 5_000, paidOn: "2027-01-03", taxYear: 2026, idempotencyKey: key() });
    const d = await otDeposit(20_000);
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
    await approvePlan(ownerId, planId);
    const roth = await prisma.allocationLine.findFirstOrThrow({ where: { planId, target: "ROTH" } });
    await completeLine(ownerId, roth.id, { paidCents: 10_000, paidOn: "2027-03-01", taxYear: 2026, idempotencyKey: key() });
    expect((await prisma.allocationLine.findUniqueOrThrow({ where: { id: roth.id } })).taxYear).toBe(2026);
    expect((await rothRoom(prisma, ownerId, 2026)).confirmedCents).toBe(15_000);
    expect((await rothRoom(prisma, ownerId, 2027)).confirmedCents).toBe(0);
  });

  it("the database requires a tax year on Roth lines and only Roth lines can be re-targeted", async () => {
    const d = await otDeposit(20_000);
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
    await expect(prisma.allocationLine.create({ data: { planId, target: "ROTH", amountCents: 100 } })).rejects.toThrow();
    const fun = await prisma.allocationLine.findFirstOrThrow({ where: { planId, target: "FUN" } });
    await expect(setRothLineTaxYear(ownerId, fun.id, 2026)).rejects.toThrow(/Only Roth/);
  });
});

describe("Correction C — SCHD next day recalculates automatically", () => {
  it("resumes at Day 38 with Days 1–37 unverified", async () => {
    expect(await nextDay()).toBe(38);
  });

  it("marking an unverified day as not done makes it the next day — no manual reset", async () => {
    await markSchdDayNotDone(ownerId, 20);
    expect(await nextDay()).toBe(20);
    const { lines } = await schdPlan(2_000 + 3_800);
    expect(lines.map((l) => l.tile!.number)).toEqual([20, 38]);
  });

  it("verified (imported) days can't be marked not done; reversing an import returns the day to unverified history", async () => {
    await importSchdHistory(ownerId, { days: [5], paidOn: "2026-05-01", idempotencyKey: key() });
    await expect(markSchdDayNotDone(ownerId, 5)).rejects.toThrow(/confirmed contribution/);
    const pay = await prisma.payment.findFirstOrThrow({ where: { tile: { number: 5, challenge: { kind: "SCHD" } } } });
    await reversePayment(ownerId, pay.id, "Not in brokerage history", key());
    expect((await prisma.challengeTile.findFirstOrThrow({ where: { number: 5, challenge: { kind: "SCHD" } } })).status).toBe("PROVISIONAL");
    expect(await nextDay()).toBe(38); // unverified history still orders as done
    await markSchdDayNotDone(ownerId, 5);
    expect(await nextDay()).toBe(5);
    expect(await prisma.auditLog.count({ where: { action: { startsWith: "schd-day-not-done" } } })).toBe(1);
  });

  it("reserved days are skipped, cancelled ones come back, and no day is ever funded twice", async () => {
    const a = await schdPlan(3_800 + 3_900);
    expect(a.lines.map((l) => l.tile!.number)).toEqual([38, 39]);
    await approvePlan(ownerId, a.planId);
    expect(await nextDay()).toBe(40);
    await cancelLine(ownerId, a.lines[0]!.id); // release Day 38
    expect(await nextDay()).toBe(38);
    const b = await schdPlan(3_800 + 4_000);
    expect(b.lines.map((l) => l.tile!.number)).toEqual([38, 40]); // 39 still reserved in plan A
    await approvePlan(ownerId, b.planId);
    await completeLine(ownerId, b.lines[0]!.id, { paidCents: 3_800, paidOn: "2027-01-20", idempotencyKey: key() });
    await expect(recordManualPayment(ownerId, { kind: "TILE", tileId: b.lines[0]!.tileId, amountCents: 0, paidOn: "2027-01-21", idempotencyKey: key() })).rejects.toThrow(/already completed/);
    expect(await nextDay()).toBe(41);
    expect(await reconcile(ownerId)).toEqual([]);
  });

  it("correcting a confirmed roulette contribution reopens that day as next — explicitly, with history kept", async () => {
    const a = await schdPlan(3_800);
    await approvePlan(ownerId, a.planId);
    const p = await completeLine(ownerId, a.lines[0]!.id, { paidCents: 3_800, paidOn: "2027-01-20", idempotencyKey: key() });
    expect(await nextDay()).toBe(39);
    await reversePayment(ownerId, p.id, "Transfer failed", key());
    expect(await nextDay()).toBe(38);
    expect(await prisma.payment.count({ where: { OR: [{ id: p.id }, { reversalOfId: p.id }] } })).toBe(2);
    expect(await reconcile(ownerId)).toEqual([]);
  });

  it("the resume-point setting still works and never touches verified days", async () => {
    await importSchdHistory(ownerId, { days: [1, 2], paidOn: "2026-05-01", idempotencyKey: key() });
    await prisma.challengeTile.updateMany({ where: { challenge: { ownerId, kind: "SCHD" }, number: { gte: 38, lt: 45 } }, data: { status: "PROVISIONAL" } });
    expect(await nextDay()).toBe(45);
    expect((await prisma.challengeTile.count({ where: { challenge: { kind: "SCHD" }, status: "COMPLETED" } }))).toBe(2);
    void localToDbDate;
  });
});
