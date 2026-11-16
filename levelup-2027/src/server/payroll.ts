import "server-only";
import { Prisma, type PayKind, type PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import { audit } from "./audit";
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
  deposit: { is: null },
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

export async function recordDeposit(
  ownerId: string,
  paydayId: string,
  input: { netCents: number; actualDepositDate: LocalDate; notes?: string | null },
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const p = await tx.payday.findFirst({ where: { id: paydayId, ownerId }, include: { deposit: true } });
      if (!p) throw new UserError("Payday not found.");
      if (p.deposit) throw new UserError("A deposit is already recorded for this payday.");
      const deposit = await tx.incomeDeposit.create({
        data: {
          ownerId,
          kind: p.kind,
          paydayId: p.id,
          netCents: input.netCents,
          actualDepositDate: localToDbDate(input.actualDepositDate),
          notes: input.notes || null,
        },
      });
      await tx.payday.update({ where: { id: p.id }, data: { status: "RECEIVED" } });
      await audit(tx, ownerId, "IncomeDeposit", deposit.id, "confirm", undefined, deposit);
      return deposit;
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new UserError("A deposit is already recorded for this payday.");
    }
    throw e;
  }
}

/** Correction: removes a mistaken deposit. The audit log keeps the full original record. */
export async function voidDeposit(ownerId: string, paydayId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.payday.findFirst({ where: { id: paydayId, ownerId }, include: { deposit: true } });
    if (!p?.deposit) throw new UserError("No deposit to correct.");
    await tx.incomeDeposit.delete({ where: { id: p.deposit.id } });
    await tx.payday.update({ where: { id: p.id }, data: { status: "EXPECTED" } });
    await audit(tx, ownerId, "IncomeDeposit", p.deposit.id, `void: ${reason.slice(0, 200)}`, p.deposit, undefined);
  });
}

export async function setPaydayStatus(ownerId: string, paydayId: string, status: "EXPECTED" | "ZERO" | "SKIPPED", note?: string | null) {
  return prisma.$transaction(async (tx) => {
    const p = await tx.payday.findFirst({ where: { id: paydayId, ownerId }, include: { deposit: true } });
    if (!p) throw new UserError("Payday not found.");
    if (p.deposit) throw new UserError("This payday has a confirmed deposit. Correct the deposit first.");
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
