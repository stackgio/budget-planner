import { beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db";
import { recordDeposit } from "@/server/payroll";
import { approvePlan, challengeTotals, reconcile, recordTilesPaidOutside, spin } from "@/server/ledger";
import { localToDbDate } from "@/domain/dates";
import { freshOwner } from "./helpers";

let ownerId: string;
beforeEach(async () => { ownerId = (await freshOwner()).id; });
const key = () => randomUUID();
const tilesOf = (kind: "MOVING_OUT" | "SCHD") => prisma.challengeTile.findMany({ where: { challenge: { ownerId, kind }, status: "OPEN" }, orderBy: { number: "asc" } });
async function overtime(cents: number) {
  const p = await prisma.payday.findFirstOrThrow({ where: { ownerId, kind: "OVERTIME", officialDate: { gte: localToDbDate("2027-01-01") } }, orderBy: { officialDate: "asc" } });
  return recordDeposit(ownerId, p.id, { netCents: cents, actualDepositDate: "2027-01-15", idempotencyKey: key() });
}

describe("tiles paid outside Roulette (e.g. from a regular paycheck)", () => {
  it("Roulette never proposes a Moving-Out tile you already paid yourself", async () => {
    const open = await tilesOf("MOVING_OUT");
    const top10 = open.slice(-10);
    await recordTilesPaidOutside(ownerId, { tileIds: top10.map((t) => t.id), paidOn: "2027-01-10", note: "from regular paycheck", idempotencyKey: key() });
    const paid = new Set(top10.map((t) => t.id));
    const dep = await overtime(100_000);
    for (let i = 0; i < 15; i++) {
      const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: dep.id, seed: `s${i}` });
      const lines = await prisma.allocationLine.findMany({ where: { planId, tileId: { not: null } } });
      expect(lines.some((l) => paid.has(l.tileId!))).toBe(false);
    }
    const mo = (await challengeTotals(ownerId)).find((c) => c.kind === "MOVING_OUT")!;
    expect(mo.completedTiles).toBe(10);
    expect(await reconcile(ownerId)).toEqual([]);
  });

  it("SCHD: paying the next days moves Roulette to the following day; days must be in order", async () => {
    const open = await tilesOf("SCHD");
    await expect(recordTilesPaidOutside(ownerId, { tileIds: [open[1]!.id], paidOn: "2027-01-10", idempotencyKey: key() })).rejects.toThrow(/next days in order/);
    await recordTilesPaidOutside(ownerId, { tileIds: [open[0]!.id, open[1]!.id], paidOn: "2027-01-10", idempotencyKey: key() });
    const schd = (await challengeTotals(ownerId)).find((c) => c.kind === "SCHD")!;
    expect(schd.nextDay).toBe(open[2]!.number);
    const dep = await overtime(50_000);
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: dep.id, seed: "x" });
    const schdLine = await prisma.allocationLine.findFirst({ where: { planId, target: "SCHD_DAY" }, include: { tile: true } });
    if (schdLine) expect(schdLine.tile!.number).toBe(open[2]!.number);
  });

  it("a proposal you already spun drops a tile you then pay yourself, so it can still be approved", async () => {
    const dep = await overtime(100_000);
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: dep.id, seed: "keep" });
    const picked = await prisma.allocationLine.findFirstOrThrow({ where: { planId, target: "MOVING_TILE" } });
    await recordTilesPaidOutside(ownerId, { tileIds: [picked.tileId!], paidOn: "2027-01-12", idempotencyKey: key() });
    expect(await prisma.allocationLine.count({ where: { planId, tileId: picked.tileId } })).toBe(0);
    await approvePlan(ownerId, planId);
    expect(await reconcile(ownerId)).toEqual([]);
  });

  it("refuses tiles reserved in an approved plan or already done; idempotent; other accounts can't touch them", async () => {
    const dep = await overtime(100_000);
    const { planId } = await spin(ownerId, { kind: "OVERTIME_ROULETTE", depositId: dep.id, seed: "r" });
    await approvePlan(ownerId, planId);
    const reserved = await prisma.allocationLine.findFirstOrThrow({ where: { planId, target: "MOVING_TILE" } });
    await expect(recordTilesPaidOutside(ownerId, { tileIds: [reserved.tileId!], paidOn: "2027-01-12", idempotencyKey: key() })).rejects.toThrow(/reserved in an approved plan/);
    const free = (await prisma.challengeTile.findMany({ where: { challenge: { ownerId, kind: "MOVING_OUT" }, status: "OPEN", lines: { none: {} } }, take: 2 }));
    const k = key();
    const a = await recordTilesPaidOutside(ownerId, { tileIds: free.map((t) => t.id), paidOn: "2027-01-12", idempotencyKey: k });
    const b = await recordTilesPaidOutside(ownerId, { tileIds: free.map((t) => t.id), paidOn: "2027-01-12", idempotencyKey: k });
    expect(b).toMatchObject({ recorded: 2, replay: true, totalCents: a.totalCents });
    await expect(recordTilesPaidOutside(ownerId, { tileIds: [free[0]!.id], paidOn: "2027-01-12", idempotencyKey: key() })).rejects.toThrow(/already completed/);
    const other = (await prisma.user.create({ data: { email: "x@example.test", passwordHash: "x" } })).id;
    const another = await prisma.challengeTile.findFirstOrThrow({ where: { challenge: { ownerId, kind: "MOVING_OUT" }, status: "OPEN", lines: { none: {} } } });
    await expect(recordTilesPaidOutside(other, { tileIds: [another.id], paidOn: "2027-01-12", idempotencyKey: key() })).rejects.toThrow(/weren't found/);
    expect(await reconcile(ownerId)).toEqual([]);
  });

  it("Debt needs setup first", async () => {
    const debtTile = await prisma.challengeTile.findFirst({ where: { challenge: { ownerId, kind: "DEBT" } } });
    if (debtTile) await expect(recordTilesPaidOutside(ownerId, { tileIds: [debtTile.id], paidOn: "2027-01-12", idempotencyKey: key() })).rejects.toThrow(/setting up/);
  });
});
