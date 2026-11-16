import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { seedOwnerConfig } from "@/server/bootstrap";
import { recordDeposit, updateSchedule, voidDeposit, UserError } from "@/server/payroll";
import {
  approvePlan, cancelLine, cancelPlan, challengeTotals, completeLine, configureDebt, correctDebtBalance, depositBalance, editDraft,
  importSchdHistory, ledgerOverview, reconcile, recordManualPayment, reversePayment, RothLimitWarning, spin,
} from "@/server/ledger";
import { loadExtraMonths } from "@/server/extra";
import { localToDbDate } from "@/domain/dates";
import { freshOwner } from "./helpers";

let ownerId: string;
beforeEach(async () => { ownerId = (await freshOwner()).id; });

const key = () => randomUUID();
const TODAY = "2027-01-15";

async function deposit(kind: "OVERTIME" | "REGULAR", cents: number, official?: string, actual?: string, owner = ownerId) {
  const p = await prisma.payday.findFirstOrThrow({
    where: { ownerId: owner, kind, deposits: { none: {} }, ...(official ? { officialDate: localToDbDate(official) } : { officialDate: { gte: new Date("2027-01-01") } }) },
    orderBy: { officialDate: "asc" },
  });
  return recordDeposit(owner, p.id, { netCents: cents, actualDepositDate: actual ?? official ?? "2027-01-15", idempotencyKey: key() });
}

const planLines = (planId: string) => prisma.allocationLine.findMany({ where: { planId }, orderBy: { sortOrder: "asc" }, include: { tile: true } });
const tileStatusCounts = async () => Object.fromEntries((await prisma.challengeTile.groupBy({ by: ["status"], _count: true })).map((g) => [g.status, g._count]));

async function approvedPlan(cents: number) {
  const d = await deposit("OVERTIME", cents);
  const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
  await approvePlan(ownerId, planId);
  return { d, planId, lines: await planLines(planId) };
}

describe("Overtime Roulette against the ledger", () => {
  for (const dollars of [0, 25, 100, 150, 250, 500, 1000]) {
    it(`$${dollars}: draft never exceeds the deposit and reserves nothing`, async () => {
      const d = await deposit("OVERTIME", dollars * 100);
      const before = await tileStatusCounts();
      const { planId, proposal } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
      const lines = await planLines(planId);
      const total = lines.reduce((a, l) => a + l.amountCents, 0);
      expect(total + proposal.unallocatedCents).toBe(dollars * 100);
      expect(lines.every((l) => l.status === "PLANNED")).toBe(true);
      expect((await depositBalance(prisma, ownerId, d.id)).availableCents).toBe(dollars * 100); // draft reserves nothing
      expect(await tileStatusCounts()).toEqual(before);
      expect(lines.some((l) => l.target === "DEBT_TILE")).toBe(false); // debt unconfigured
      if (dollars === 25) expect(proposal.shortfall).toEqual({ rothCents: 7_500, funCents: 5_000 });
      if (dollars === 0) await expect(approvePlan(ownerId, planId)).rejects.toThrow(/nothing to approve/);
      else {
        await approvePlan(ownerId, planId);
        const bal = await depositBalance(prisma, ownerId, d.id);
        expect(bal.reservedCents).toBe(total);
        expect(bal.availableCents).toBe(dollars * 100 - total);
        expect(await prisma.challengeTile.count({ where: { status: "COMPLETED" } })).toBe(0); // approval ≠ completion
      }
      expect(await reconcile(ownerId)).toEqual([]);
    });
  }

  it("repeated rerolls keep a single draft, move no money and change no tiles", async () => {
    const d = await deposit("OVERTIME", 60_000);
    const seen = new Set<string>();
    let planId = "";
    for (let i = 0; i < 15; i++) {
      const r = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
      planId = r.planId;
      seen.add((await planLines(planId)).map((l) => l.tile?.number ?? l.target).join(","));
    }
    expect(await prisma.allocationPlan.count({ where: { depositId: d.id } })).toBe(1);
    expect(seen.size).toBeGreaterThan(1);
    expect((await depositBalance(prisma, ownerId, d.id)).availableCents).toBe(60_000);
    expect(await prisma.payment.count()).toBe(0);
  });

  it("a draft survives a refresh (persisted) and an approved plan stays approved", async () => {
    const d = await deposit("OVERTIME", 40_000);
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
    const first = (await planLines(planId)).map((l) => l.id);
    const reloaded = await prisma.allocationPlan.findFirstOrThrow({ where: { depositId: d.id, status: "DRAFT" }, include: { lines: true } });
    expect(reloaded.lines.map((l) => l.id).sort()).toEqual([...first].sort());
    await approvePlan(ownerId, planId);
    expect((await prisma.allocationPlan.findUniqueOrThrow({ where: { id: planId } })).status).toBe("APPROVED");
  });

  it("duplicate approval taps are harmless", async () => {
    const d = await deposit("OVERTIME", 30_000);
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
    const results = await Promise.allSettled([1, 2, 3, 4].map(() => approvePlan(ownerId, planId)));
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const total = (await planLines(planId)).reduce((a, l) => a + l.amountCents, 0);
    expect((await depositBalance(prisma, ownerId, d.id)).reservedCents).toBe(total);
  });

  it("concurrent approvals of competing plans cannot over-commit a deposit", async () => {
    const d = await deposit("OVERTIME", 30_000);
    const mk = (cents: number) => prisma.allocationPlan.create({ data: { ownerId, kind: "OVERTIME_ROULETTE", depositId: null, forecastMonth: `x${Math.random()}`, budgetCents: cents, lines: { create: [{ target: "FUN", amountCents: cents }] } } });
    // Two separate drafts on the same deposit (bypassing the UI's one-draft rule) each wanting $200 of $300.
    const a = await mk(20_000), b = await mk(20_000);
    await prisma.allocationPlan.updateMany({ where: { id: { in: [a.id, b.id] } }, data: { depositId: d.id, forecastMonth: null } }).catch(async () => {
      await prisma.allocationPlan.update({ where: { id: a.id }, data: { depositId: d.id, forecastMonth: null } });
      await prisma.allocationPlan.update({ where: { id: b.id }, data: { depositId: d.id, forecastMonth: null, kind: "OVERTIME_ROULETTE", status: "DRAFT", notes: "second" } }).catch(() => {});
    });
    const results = await Promise.allSettled([approvePlan(ownerId, a.id), approvePlan(ownerId, b.id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await depositBalance(prisma, ownerId, d.id)).availableCents).toBe(10_000);
    expect(await reconcile(ownerId)).toEqual([]);
  });

  it("only confirmed deposits fund plans; an estimate or scheduled payday cannot", async () => {
    await expect(spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: null })).rejects.toThrow(/confirmed deposit/);
    const reg = await deposit("REGULAR", 100_000);
    await expect(spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: reg.id })).rejects.toThrow(/overtime deposit/);
    const d = await deposit("OVERTIME", 10_000);
    await expect(spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id, budgetCents: 10_001 })).rejects.toThrow(/available/);
  });
});

describe("completion, partial transfers, cancellation, reversals", () => {
  it("confirming each line separately completes tiles; approval alone never does", async () => {
    const { planId, lines } = await approvedPlan(100_000);
    const tileLine = lines.find((l) => l.tileId)!;
    expect(tileLine.tile!.status).toBe("OPEN");
    await completeLine(ownerId, tileLine.id, { paidCents: tileLine.amountCents, paidOn: TODAY, idempotencyKey: key() });
    expect((await prisma.challengeTile.findUniqueOrThrow({ where: { id: tileLine.tileId! } })).status).toBe("COMPLETED");
    expect((await prisma.allocationPlan.findUniqueOrThrow({ where: { id: planId } })).status).toBe("APPROVED"); // partially complete
    expect(await reconcile(ownerId)).toEqual([]);
  });

  it("tiles must be paid exactly; non-tile lines accept partial transfers and release the rest", async () => {
    const { d, lines } = await approvedPlan(50_000);
    const tileLine = lines.find((l) => l.tileId)!;
    await expect(completeLine(ownerId, tileLine.id, { paidCents: tileLine.amountCents - 1, paidOn: TODAY, idempotencyKey: key() })).rejects.toThrow(/exactly/);
    const roth = lines.find((l) => l.target === "ROTH")!;
    const before = (await depositBalance(prisma, ownerId, d.id)).availableCents;
    await completeLine(ownerId, roth.id, { paidCents: 6_000, paidOn: TODAY, idempotencyKey: key() });
    expect((await depositBalance(prisma, ownerId, d.id)).availableCents).toBe(before + 4_000);
    await expect(completeLine(ownerId, roth.id, { paidCents: 4_000, paidOn: TODAY, idempotencyKey: key() })).rejects.toThrow(/already confirmed/);
  });

  it("repeated idempotency keys return the same payment; reused keys with different data are rejected", async () => {
    const { lines } = await approvedPlan(30_000);
    const fun = lines.find((l) => l.target === "FUN")!;
    const k = key();
    const a = await completeLine(ownerId, fun.id, { paidCents: fun.amountCents, paidOn: TODAY, idempotencyKey: k });
    const b = await completeLine(ownerId, fun.id, { paidCents: fun.amountCents, paidOn: TODAY, idempotencyKey: k });
    expect(b.id).toBe(a.id);
    await expect(completeLine(ownerId, fun.id, { paidCents: 1, paidOn: TODAY, idempotencyKey: k })).rejects.toThrow(/different data/);
    expect(await prisma.payment.count()).toBe(1);
  });

  it("concurrent confirmations of the same tile record exactly one payment", async () => {
    const { lines } = await approvedPlan(100_000);
    const tileLine = lines.find((l) => l.tileId)!;
    const results = await Promise.allSettled([1, 2, 3, 4, 5].map(() => completeLine(ownerId, tileLine.id, { paidCents: tileLine.amountCents, paidOn: TODAY, idempotencyKey: key() })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.payment.count({ where: { tileId: tileLine.tileId } })).toBe(1);
    expect(await reconcile(ownerId)).toEqual([]);
  });

  it("a tile reserved in one plan can't be reserved by another, or paid manually", async () => {
    const { lines } = await approvedPlan(100_000);
    const tileLine = lines.find((l) => l.tileId)!;
    await expect(recordManualPayment(ownerId, { kind: "TILE", tileId: tileLine.tileId, amountCents: 0, paidOn: TODAY, idempotencyKey: key() })).rejects.toThrow(/reserved/);
    const d2 = await deposit("OVERTIME", 100_000);
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d2.id });
    expect((await planLines(planId)).some((l) => l.tileId === tileLine.tileId)).toBe(false);
  });

  it("cancelling releases money and the tile; cancelling a plan keeps completed lines", async () => {
    const { d, planId, lines } = await approvedPlan(80_000);
    const [first, ...rest] = lines;
    await completeLine(ownerId, first!.id, { paidCents: first!.amountCents, paidOn: TODAY, idempotencyKey: key() });
    const tileLine = rest.find((l) => l.tileId);
    if (tileLine) await cancelLine(ownerId, tileLine.id);
    await cancelPlan(ownerId, planId);
    const plan = await prisma.allocationPlan.findUniqueOrThrow({ where: { id: planId }, include: { lines: true } });
    expect(plan.status).toBe("COMPLETED");
    expect(plan.lines.filter((l) => l.status === "COMPLETED")).toHaveLength(1);
    expect((await depositBalance(prisma, ownerId, d.id)).availableCents).toBe(80_000 - first!.amountCents);
    if (tileLine) expect((await prisma.challengeTile.findUniqueOrThrow({ where: { id: tileLine.tileId! } })).status).toBe("OPEN");
    expect(await reconcile(ownerId)).toEqual([]);
  });

  it("a reversal adds a negative correction, reopens the tile and keeps full history", async () => {
    const { d, lines } = await approvedPlan(100_000);
    const tileLine = lines.find((l) => l.tileId)!;
    const p = await completeLine(ownerId, tileLine.id, { paidCents: tileLine.amountCents, paidOn: TODAY, idempotencyKey: key() });
    const rk = key();
    const r = await reversePayment(ownerId, p.id, "Transfer bounced", rk);
    expect(r.amountCents).toBe(-p.amountCents);
    expect((await reversePayment(ownerId, p.id, "Transfer bounced", rk)).id).toBe(r.id); // idempotent
    await expect(reversePayment(ownerId, p.id, "again", key())).rejects.toThrow(/already corrected/);
    expect((await prisma.challengeTile.findUniqueOrThrow({ where: { id: tileLine.tileId! } })).status).toBe("OPEN");
    expect(await prisma.payment.count()).toBe(2); // original + correction, nothing erased
    const totals = (await challengeTotals(ownerId)).find((c) => c.kind === (tileLine.target === "SCHD_DAY" ? "SCHD" : "MOVING_OUT"))!;
    expect(totals.confirmedCents).toBe(0);
    expect((await depositBalance(prisma, ownerId, d.id)).completedCents).toBe(0);
    expect(await reconcile(ownerId)).toEqual([]);
  });
});

describe("database-level guards (bypassing the service layer)", () => {
  it("the trigger rejects over-committing a deposit even with direct writes", async () => {
    const d = await deposit("OVERTIME", 10_000);
    await expect(prisma.allocationPlan.create({
      data: { ownerId, kind: "OVERTIME_ROULETTE", depositId: d.id, budgetCents: 10_000, status: "APPROVED", lines: { create: [{ target: "FUN", amountCents: 10_001, status: "RESERVED" }] } },
    })).rejects.toThrow(/LEVELUP_LEDGER/);
  });

  it("a deposit with committed money cannot be voided or reduced", async () => {
    const { d } = await approvedPlan(30_000);
    const pd = await prisma.incomeDeposit.findUniqueOrThrow({ where: { id: d.id } });
    await expect(voidDeposit(ownerId, pd.paydayId!, "mistake")).rejects.toThrow(UserError);
    await expect(prisma.incomeDeposit.update({ where: { id: d.id }, data: { netCents: 1 } })).rejects.toThrow(/LEVELUP_LEDGER/);
  });

  it("payments and committed lines cannot be deleted; negative amounts are impossible", async () => {
    const { lines } = await approvedPlan(30_000);
    const p = await completeLine(ownerId, lines[0]!.id, { paidCents: lines[0]!.amountCents, paidOn: TODAY, idempotencyKey: key() });
    await expect(prisma.payment.delete({ where: { id: p.id } })).rejects.toThrow(/LEVELUP_LEDGER/);
    await expect(prisma.allocationLine.delete({ where: { id: lines[0]!.id } })).rejects.toThrow(/LEVELUP_LEDGER/);
    await expect(prisma.payment.create({ data: { ownerId, kind: "FUN_MONEY", source: "MANUAL", amountCents: -5, paidOn: new Date(), idempotencyKey: key(), requestHash: "x" } })).rejects.toThrow();
  });
});

describe("challenges", () => {
  it("SCHD progresses sequentially across paychecks and never skips a reserved day", async () => {
    const d1 = await deposit("OVERTIME", 15_000 + 3_800 + 3_900);
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d1.id, leftoverToFun: false, challengesOnly: ["SCHD"] });
    expect((await planLines(planId)).filter((l) => l.tile).map((l) => l.tile!.number)).toEqual([38, 39]);
    await approvePlan(ownerId, planId);
    const d2 = await deposit("OVERTIME", 15_000 + 4_000);
    const r2 = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d2.id, challengesOnly: ["SCHD"] });
    expect((await planLines(r2.planId)).filter((l) => l.tile).map((l) => l.tile!.number)).toEqual([40]);
    await expect(editDraft(ownerId, r2.planId, { op: "addTile", tileId: (await prisma.challengeTile.findFirstOrThrow({ where: { number: 45, challenge: { kind: "SCHD" } } })).id })).rejects.toThrow(/sequential/);
  });

  it("SCHD history import verifies selected days only, idempotently, without touching Day 38", async () => {
    const k = key();
    const r = await importSchdHistory(ownerId, { days: [1, 2, 3], paidOn: "2026-06-01", idempotencyKey: k });
    expect(r.imported).toBe(3);
    expect((await importSchdHistory(ownerId, { days: [1, 2, 3], paidOn: "2026-06-01", idempotencyKey: k })).replay).toBe(true);
    await expect(importSchdHistory(ownerId, { days: [3], paidOn: "2026-06-01", idempotencyKey: key() })).rejects.toThrow(/already verified/);
    const schd = (await challengeTotals(ownerId)).find((c) => c.kind === "SCHD")!;
    expect(schd.verifiedHistoricalCents).toBe(600);
    expect(schd.provisionalCents).toBe(70_300 - 600);
    expect(schd.nextDay).toBe(38);
    expect(await prisma.payment.count({ where: { source: "HISTORICAL_IMPORT" } })).toBe(3);
  });

  it("debt stays excluded until configured; mapping must reconcile; $4,000 is never assumed", async () => {
    const d = await deposit("OVERTIME", 100_000);
    expect((await (await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id })).proposal.lines).some((l) => l.target === "DEBT_TILE")).toBe(false);
    expect((await prisma.challenge.findFirstOrThrow({ where: { kind: "DEBT" } })).targetCents).toBeNull();
    await expect(configureDebt(ownerId, { balanceCents: 300_000, targetCents: 300_000, tileAmountsCents: [100_000, 100_000], priorPaidCents: null, note: null, asOf: TODAY })).rejects.toThrow(/must match/);
    await expect(configureDebt(ownerId, { balanceCents: 100_000, targetCents: 200_000, tileAmountsCents: [200_000], priorPaidCents: null, note: null, asOf: TODAY })).rejects.toThrow(/more than the current balance/);
    const tiles = Array.from({ length: 50 }, (_, i) => (i + 1) * 100); // $1..$50 = $1,275
    await configureDebt(ownerId, { balanceCents: 200_000, targetCents: 127_500, tileAmountsCents: tiles, priorPaidCents: 10_000, note: "Card", asOf: TODAY });
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
    const debtLines = (await planLines(planId)).filter((l) => l.target === "DEBT_TILE");
    expect(debtLines.length).toBeGreaterThan(0);
    await approvePlan(ownerId, planId);
    await completeLine(ownerId, debtLines[0]!.id, { paidCents: debtLines[0]!.amountCents, paidOn: TODAY, idempotencyKey: key() });
    await correctDebtBalance(ownerId, { balanceCents: 195_000, asOf: "2027-02-01", note: "Statement" });
    const debt = (await challengeTotals(ownerId)).find((c) => c.kind === "DEBT")!;
    expect(debt.balances.map((b) => b.cents)).toEqual([195_000, 200_000]); // history kept
    expect(debt.confirmedCents).toBe(debtLines[0]!.amountCents); // payments untouched by the correction
    await expect(configureDebt(ownerId, { balanceCents: 100_000, targetCents: 100, tileAmountsCents: [100], priorPaidCents: null, note: null, asOf: TODAY })).rejects.toThrow(/balance correction/);
  });

  it("all challenges completed: Roulette offers only Roth and fun money", async () => {
    await prisma.challengeTile.updateMany({ data: { status: "COMPLETED" } }); // simulated end state (test only)
    const d = await deposit("OVERTIME", 50_000);
    const { proposal } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: d.id });
    expect(proposal.challengeCents).toBe(0);
    expect(proposal.lines.map((l) => l.target)).toEqual(["ROTH", "FUN"]);
  });
});

describe("Roth IRA", () => {
  it("warns before exceeding the configured limit; planned ≠ contributed", async () => {
    const year = Number(TODAY.slice(0, 4));
    await prisma.rothYear.create({ data: { ownerId, taxYear: year, limitCents: 15_000 } });
    const { lines } = await approvedPlan(30_000);
    expect(await prisma.payment.count({ where: { kind: "ROTH_CONTRIBUTION" } })).toBe(0); // reserved ≠ contributed
    const roth = lines.find((l) => l.target === "ROTH")!;
    await completeLine(ownerId, roth.id, { paidCents: roth.amountCents, paidOn: TODAY, taxYear: year, idempotencyKey: key() });
    await expect(recordManualPayment(ownerId, { kind: "ROTH", amountCents: 10_000, paidOn: TODAY, idempotencyKey: key() })).rejects.toBeInstanceOf(RothLimitWarning);
    await recordManualPayment(ownerId, { kind: "ROTH", amountCents: 10_000, paidOn: TODAY, idempotencyKey: key(), acknowledgeOverLimit: true });
    const sum = await prisma.payment.aggregate({ where: { kind: "ROTH_CONTRIBUTION", taxYear: year }, _sum: { amountCents: true } });
    expect(sum._sum.amountCents).toBe(20_000);
  });
});

describe("Extra Paycheck Planner", () => {
  it("forecast drafts are non-binding; approval needs a confirmed REGULAR deposit; no overtime defaults", async () => {
    const { planId, proposal } = await spin(ownerId, { kind: "EXTRA_PAYCHECK", forecastMonth: "2027-04", forecastCents: 150_000, includeReserves: false });
    expect(proposal.rothCents).toBe(0);
    expect(proposal.funBaseCents).toBe(0);
    await expect(approvePlan(ownerId, planId)).rejects.toThrow(/Choose the confirmed regular deposit/);
    const ot = await deposit("OVERTIME", 200_000);
    await expect(approvePlan(ownerId, planId, { depositId: ot.id })).rejects.toThrow(/regular paycheck/);
    const reg = await deposit("REGULAR", 100_000, "2027-04-30", "2027-04-29");
    await expect(approvePlan(ownerId, planId, { depositId: reg.id })).rejects.toThrow(/only/); // $1,500 planned > $1,000 confirmed
    await editDraft(ownerId, planId, { op: "setAmount", target: "EMERGENCY", amountCents: 20_000 }).catch(() => {});
  });

  it("manual dollar plan on a confirmed third paycheck; regular and overtime money stay separate", async () => {
    const reg = await deposit("REGULAR", 148_000, "2027-04-30", "2027-04-29");
    const { planId } = await spin(ownerId, { kind: "EXTRA_PAYCHECK", depositId: reg.id, budgetCents: 50_000, includeReserves: false, challengesOnly: [] });
    await editDraft(ownerId, planId, { op: "setAmount", target: "EMERGENCY", amountCents: 30_000 });
    await expect(editDraft(ownerId, planId, { op: "setAmount", target: "GOAL", label: "Car", amountCents: 30_000 })).rejects.toThrow(/exceed/);
    await approvePlan(ownerId, planId);
    const ov = await ledgerOverview(ownerId, 2027);
    expect(ov.regularCents).toBe(148_000);
    expect(ov.overtimeCents).toBe(0);
    expect(ov.reservedCents).toBe(30_000);
    expect((await depositBalance(prisma, ownerId, reg.id)).availableCents).toBe(118_000);
  });

  it("an early deposit crossing a month boundary still belongs to the official extra month", async () => {
    await deposit("REGULAR", 150_000, "2027-10-01", "2027-09-30");
    const { months } = await loadExtraMonths(ownerId);
    const oct = months.find((m) => m.month === "2027-10")!;
    expect(oct.receivedCount).toBe(1);
    expect(oct.paydays[0]!.deposit!.actualDepositDate).toBe("2027-09-30");
    expect(months.some((m) => m.month === "2027-09")).toBe(false); // not a phantom September extra month
  });
});

describe("payroll anchor changes preserve the ledger", () => {
  it("approved plans and deposits survive an anchor change", async () => {
    const { d, planId } = await approvedPlan(40_000);
    await updateSchedule(ownerId, "OVERTIME", { anchorOfficialDate: "2026-12-11", anchorVerified: false, earlyDepositOffsetDays: 0 });
    expect((await prisma.incomeDeposit.findUniqueOrThrow({ where: { id: d.id } })).voidedAt).toBeNull();
    expect((await prisma.allocationPlan.findUniqueOrThrow({ where: { id: planId } })).status).toBe("APPROVED");
    expect(await reconcile(ownerId)).toEqual([]);
  });
});

describe("cross-account authorization", () => {
  it("another account cannot see or change this owner's money", async () => {
    const { d, planId, lines } = await approvedPlan(50_000);
    const p = await completeLine(ownerId, lines[0]!.id, { paidCents: lines[0]!.amountCents, paidOn: TODAY, idempotencyKey: key() });
    const intruder = await prisma.user.create({ data: { email: "other@example.test", passwordHash: "x" } });
    await seedOwnerConfig(prisma, intruder.id);
    const other = intruder.id;
    await expect(spin(other, { kind: "OVERTIME_ROULETTE", depositId: d.id })).rejects.toThrow(/not found/i);
    await expect(approvePlan(other, planId)).rejects.toThrow(/not found/i);
    await expect(cancelPlan(other, planId)).rejects.toThrow(/not found/i);
    await expect(completeLine(other, lines[1]!.id, { paidCents: lines[1]!.amountCents, paidOn: TODAY, idempotencyKey: key() })).rejects.toThrow(/not found/i);
    await expect(cancelLine(other, lines[1]!.id)).rejects.toThrow(/not found/i);
    await expect(reversePayment(other, p.id, "nope", key())).rejects.toThrow(/not found/i);
    await expect(editDraft(other, planId, { op: "remove", lineId: lines[1]!.id })).rejects.toThrow(/not found/i);
    const ownerTile = await prisma.challengeTile.findFirstOrThrow({ where: { challenge: { ownerId, kind: "MOVING_OUT" }, status: "OPEN" } });
    await expect(recordManualPayment(other, { kind: "TILE", tileId: ownerTile.id, amountCents: 0, paidOn: TODAY, idempotencyKey: key() })).rejects.toThrow(/not found/i);
    await expect(voidDeposit(other, (await prisma.incomeDeposit.findUniqueOrThrow({ where: { id: d.id } })).paydayId!, "x")).rejects.toThrow(/No deposit/);
    expect(await reconcile(ownerId)).toEqual([]);
  });
});

describe("end-to-end reconciliation", () => {
  it("ledger, payments and challenge totals agree after a mixed sequence", async () => {
    const a = await approvedPlan(100_000);
    for (const l of a.lines.slice(0, 3)) await completeLine(ownerId, l.id, { paidCents: l.amountCents, paidOn: TODAY, idempotencyKey: key() });
    const b = await approvedPlan(60_000);
    await cancelLine(ownerId, b.lines[b.lines.length - 1]!.id);
    const pay = await completeLine(ownerId, b.lines[0]!.id, { paidCents: b.lines[0]!.amountCents, paidOn: TODAY, idempotencyKey: key() });
    await reversePayment(ownerId, pay.id, "wrong account", key());
    await importSchdHistory(ownerId, { days: [10, 11], paidOn: "2026-05-01", idempotencyKey: key() });
    await recordManualPayment(ownerId, { kind: "EMERGENCY", amountCents: 2_500, paidOn: TODAY, idempotencyKey: key() });
    expect(await reconcile(ownerId)).toEqual([]);
    const totals = await challengeTotals(ownerId);
    const tilePayments = await prisma.payment.aggregate({ where: { tileId: { not: null }, reversedAt: null, reversalOfId: null }, _sum: { amountCents: true } });
    expect(totals.reduce((s, c) => s + c.confirmedCents, 0)).toBe(tilePayments._sum.amountCents ?? 0);
    const ov = await ledgerOverview(ownerId);
    expect(ov.totalIncomeCents).toBe(160_000);
    expect(ov.availableCents + ov.reservedCents + ov.allocatedCompletedCents).toBe(160_000);
  });
});
