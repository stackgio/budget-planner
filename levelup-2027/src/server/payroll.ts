import "server-only";
import { Prisma, type PayKind, type PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import { audit } from "./audit";
import { IDEMPOTENCY_KEY_RE, isLedgerViolation, isUniqueViolation, requestHash } from "./idempotency";
import { type LocalDate, dateToLocal, localToDbDate, makeLocalDate, todayLocal } from "@/domain/dates";
import { projectPaydays } from "@/domain/payroll";

type Db = PrismaClient | Prisma.TransactionClient;

export const PAYROLL_WINDOW_START: LocalDate = "2026-10-01";

function horizonEnd(today: LocalDate): LocalDate {
  return makeLocalDate(Number(today.slice(0, 4)) + 2, 12, 31);
}

/** Materialize any missing projected paydays. Never alters existing rows. */
export async function ensurePaydays(ownerId: string, db: Db = prisma, today: LocalDate = todayLocal()) {
  const schedules = await db.paySchedule.findMany({ where: { ownerId } });
  for (const s of schedules) {
    const projected = projectPaydays(
      {
        kind: s.kind,
        anchorOfficialDate: dateToLocal(s.anchorOfficialDate),
        intervalDays: s.intervalDays,
        earlyDepositOffsetDays: s.earlyDepositOffsetDays,
      },
      PAYROLL_WINDOW_START,
      horizonEnd(today),
    );
    await db.payday.createMany({
      data: projected.map((p) => ({
        ownerId,
        kind: s.kind,
        officialDate: localToDbDate(p.officialDate),
        expectedDepositDate: localToDbDate(p.expectedDepositDate),
        holidayNote: p.holidayNote,
      })),
      skipDuplicates: true,
    });
  }
}

/** A payday is "user-touched" when it holds anything the user entered. Those are never removed. */
const untouched = (ownerId: string, kind: PayKind): Prisma.PaydayWhereInput => ({
  ownerId,
  kind,
  status: "EXPECTED",
  manualDepositDate: null,
  deposits: { none: {} }, // any deposit — even a voided correction — keeps the payday as history
});

export async function updateSchedule(
  ownerId: string,
  kind: PayKind,
  input: { anchorOfficialDate: LocalDate; anchorVerified: boolean; earlyDepositOffsetDays: number },
) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.paySchedule.findUniqueOrThrow({ where: { ownerId_kind: { ownerId, kind } } });
    const after = await tx.paySchedule.update({
      where: { id: before.id },
      data: {
        anchorOfficialDate: localToDbDate(input.anchorOfficialDate),
        anchorVerified: input.anchorVerified,
        earlyDepositOffsetDays: input.earlyDepositOffsetDays,
      },
    });
    const anchorChanged = dateToLocal(before.anchorOfficialDate) !== input.anchorOfficialDate || before.earlyDepositOffsetDays !== input.earlyDepositOffsetDays;
    let removed = 0;
    if (anchorChanged) {
      const stale = await tx.payday.findMany({ where: untouched(ownerId, kind), select: { id: true } });
      const ids = stale.map((p) => p.id);
      await tx.overtimeShift.updateMany({ where: { ownerId, paydayId: { in: ids } }, data: { paydayId: null } });
      removed = (await tx.payday.deleteMany({ where: { id: { in: ids } } })).count;
      await ensurePaydays(ownerId, tx);
    }
    const preserved = await tx.payday.count({ where: { ownerId, kind, NOT: untouched(ownerId, kind) } });
    await audit(tx, ownerId, "PaySchedule", before.id, "update", before, after);
    return { anchorChanged, removed, preserved };
  });
}

export class UserError extends Error {}

export interface DepositInput {
  netCents: number;
  actualDepositDate: LocalDate;
  notes?: string | null;
  idempotencyKey: string;
}

/**
 * Confirm money that actually arrived. Idempotent: the same key returns the same deposit;
 * the same key with different data is rejected. At most one active deposit per payday (DB index).
 */
export async function recordDeposit(ownerId: string, paydayId: string, input: DepositInput) {
  if (!IDEMPOTENCY_KEY_RE.test(input.idempotencyKey)) throw new UserError("Missing request key. Refresh and try again.");
  if (!Number.isSafeInteger(input.netCents) || input.netCents < 0) throw new UserError("Amount must be zero or more.");
  const hash = requestHash({ op: "deposit", ownerId, paydayId, netCents: input.netCents, date: input.actualDepositDate, notes: input.notes || null });
  const replay = async () => {
    const prior = await prisma.incomeDeposit.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (!prior) return null;
    if (prior.ownerId !== ownerId || prior.requestHash !== hash) throw new UserError("This confirmation was already used for different data. Refresh and try again.");
    return prior;
  };
  const prior = await replay();
  if (prior) return prior;
  try {
    return await prisma.$transaction(async (tx) => {
      const p = await tx.payday.findFirst({ where: { id: paydayId, ownerId }, include: { deposits: { where: { voidedAt: null } } } });
      if (!p) throw new UserError("Payday not found.");
      if (p.deposits.length) throw new UserError("A deposit is already recorded for this payday.");
      const deposit = await tx.incomeDeposit.create({
        data: {
          ownerId, kind: p.kind, paydayId: p.id, netCents: input.netCents,
          actualDepositDate: localToDbDate(input.actualDepositDate), notes: input.notes || null,
          idempotencyKey: input.idempotencyKey, requestHash: hash,
        },
      });
      await tx.payday.update({ where: { id: p.id }, data: { status: "RECEIVED" } });
      await audit(tx, ownerId, "IncomeDeposit", deposit.id, "confirm", undefined, deposit);
      return deposit;
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      const again = await replay();
      if (again) return again;
      throw new UserError("A deposit is already recorded for this payday.");
    }
    throw e;
  }
}

/**
 * Correction: voids a mistaken deposit (kept as history) so it can be re-entered.
 * Refused while any allocation is reserved or completed against it.
 */
export async function voidDeposit(ownerId: string, paydayId: string, reason: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const p = await tx.payday.findFirst({ where: { id: paydayId, ownerId }, include: { deposits: { where: { voidedAt: null } } } });
      const d = p?.deposits[0];
      if (!p || !d) throw new UserError("No deposit to correct.");
      await tx.$queryRaw`SELECT id FROM "IncomeDeposit" WHERE id = ${d.id} FOR UPDATE`;
      const committed = await tx.allocationLine.count({ where: { plan: { depositId: d.id }, status: { in: ["RESERVED", "COMPLETED"] } } });
      if (committed) throw new UserError("Money from this deposit is already approved or completed in a plan. Cancel or reverse those allocations first.");
      await tx.allocationPlan.updateMany({ where: { depositId: d.id, status: "DRAFT" }, data: { status: "CANCELLED", closedAt: new Date() } });
      const after = await tx.incomeDeposit.update({ where: { id: d.id }, data: { voidedAt: new Date(), voidReason: reason.slice(0, 200) } });
      await tx.payday.update({ where: { id: p.id }, data: { status: "EXPECTED" } });
      await audit(tx, ownerId, "IncomeDeposit", d.id, `void: ${reason.slice(0, 200)}`, d, after);
    });
  } catch (e) {
    if (isLedgerViolation(e)) throw new UserError("Money from this deposit is committed in a plan. Cancel or reverse those allocations first.");
    throw e;
  }
}

export async function setPaydayStatus(ownerId: string, paydayId: string, status: "EXPECTED" | "ZERO" | "SKIPPED", note?: string | null) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.payday.findFirst({ where: { id: paydayId, ownerId }, include: { deposits: { where: { voidedAt: null } } } });
    if (!p) throw new UserError("Payday not found.");
    if (p.deposits.length) throw new UserError("This payday has a confirmed deposit. Correct the deposit first.");
    const after = await tx.payday.update({ where: { id: p.id }, data: { status, note: note ?? p.note } });
    await audit(tx, ownerId, "Payday", p.id, `status:${status}`, p, after);
  });
}

export async function setManualDepositDate(ownerId: string, paydayId: string, date: LocalDate | null) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.payday.findFirst({ where: { id: paydayId, ownerId } });
    if (!p) throw new UserError("Payday not found.");
    const after = await tx.payday.update({ where: { id: p.id }, data: { manualDepositDate: date ? localToDbDate(date) : null } });
    await audit(tx, ownerId, "Payday", p.id, "manualDepositDate", p, after);
  });
}

export async function currentPayRate(ownerId: string, db: Db = prisma) {
  return db.payRate.findFirst({ where: { ownerId }, orderBy: [{ effectiveFrom: "desc" }, { createdAt: "desc" }] });
}
