import "server-only";
import type { OvertimeStatus } from "@prisma/client";
import { prisma } from "./db";
import { audit } from "./audit";
import { UserError, currentPayRate } from "./payroll";
import { type LocalDate, localToDbDate, zonedToInstant, addDays } from "@/domain/dates";
import { estimateGross } from "@/domain/money";

export interface OvertimeInput {
  date: LocalDate;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  regularHoursX100: number;
  overtimeHoursX100: number;
  isActivation: boolean;
  payrollPeriod: string | null;
  paydayId: string | null;
  status: OvertimeStatus;
  notes: string | null;
  addToCalendar: boolean;
}

function instants(i: OvertimeInput, tz: string) {
  const startAt = zonedToInstant(i.date, i.startTime, tz);
  let endAt = zonedToInstant(i.date, i.endTime, tz);
  if (endAt <= startAt) endAt = zonedToInstant(addDays(i.date, 1), i.endTime, tz); // overnight shift
  return { startAt, endAt };
}

async function checkPayday(ownerId: string, paydayId: string | null) {
  if (!paydayId) return;
  const p = await prisma.payday.findFirst({ where: { id: paydayId, ownerId, kind: "OVERTIME" } });
  if (!p) throw new UserError("Choose an overtime payday.");
}

export async function createOvertimeShift(ownerId: string, tz: string, i: OvertimeInput) {
  await checkPayday(ownerId, i.paydayId);
  const rate = await currentPayRate(ownerId);
  if (!rate) throw new UserError("Set your pay rate in Settings first.");
  const { startAt, endAt } = instants(i, tz);
  const est = estimateGross(i.regularHoursX100, i.overtimeHoursX100, rate.regularHourlyCents, rate.overtimeMultiplierBp);
  return prisma.$transaction(async (tx) => {
    const shift = await tx.overtimeShift.create({
      data: {
        ownerId, date: localToDbDate(i.date), startAt, endAt, breakMinutes: i.breakMinutes,
        regularHoursX100: i.regularHoursX100, overtimeHoursX100: i.overtimeHoursX100,
        rateHourlyCents: rate.regularHourlyCents, rateMultiplierBp: rate.overtimeMultiplierBp,
        estimatedGrossCents: est.totalCents, isActivation: i.isActivation, payrollPeriod: i.payrollPeriod,
        paydayId: i.paydayId, status: i.status, notes: i.notes,
      },
    });
    if (i.addToCalendar) {
      await tx.calendarEvent.create({
        data: {
          ownerId, title: i.isActivation ? "Activation shift" : "Overtime shift", category: i.isActivation ? "ACTIVATION" : "OVERTIME_SHIFT",
          startAt, endAt, timezone: tz, important: true, sourceType: "OVERTIME_SHIFT", sourceId: shift.id,
        },
      });
    }
    await audit(tx, ownerId, "OvertimeShift", shift.id, "create", undefined, shift);
    return shift;
  });
}

export async function updateOvertimeShift(ownerId: string, tz: string, id: string, i: OvertimeInput, recalcWithCurrentRate: boolean) {
  await checkPayday(ownerId, i.paydayId);
  return prisma.$transaction(async (tx) => {
    const before = await tx.overtimeShift.findFirst({ where: { id, ownerId } });
    if (!before) throw new UserError("Shift not found.");
    const rate = recalcWithCurrentRate ? await currentPayRate(ownerId, tx) : null;
    const hourly = rate?.regularHourlyCents ?? before.rateHourlyCents;
    const mult = rate?.overtimeMultiplierBp ?? before.rateMultiplierBp;
    const est = estimateGross(i.regularHoursX100, i.overtimeHoursX100, hourly, mult);
    const { startAt, endAt } = instants(i, tz);
    const after = await tx.overtimeShift.update({
      where: { id },
      data: {
        date: localToDbDate(i.date), startAt, endAt, breakMinutes: i.breakMinutes,
        regularHoursX100: i.regularHoursX100, overtimeHoursX100: i.overtimeHoursX100,
        rateHourlyCents: hourly, rateMultiplierBp: mult, estimatedGrossCents: est.totalCents,
        isActivation: i.isActivation, payrollPeriod: i.payrollPeriod, paydayId: i.paydayId, status: i.status, notes: i.notes,
      },
    });
    await tx.calendarEvent.updateMany({
      where: { ownerId, sourceType: "OVERTIME_SHIFT", sourceId: id },
      data: { startAt, endAt, category: i.isActivation ? "ACTIVATION" : "OVERTIME_SHIFT" },
    });
    await audit(tx, ownerId, "OvertimeShift", id, "update", before, after);
    return after;
  });
}

export async function deleteOvertimeShift(ownerId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.overtimeShift.findFirst({ where: { id, ownerId } });
    if (!before) throw new UserError("Shift not found.");
    await tx.calendarEvent.deleteMany({ where: { ownerId, sourceType: "OVERTIME_SHIFT", sourceId: id } });
    await tx.overtimeShift.delete({ where: { id } });
    await audit(tx, ownerId, "OvertimeShift", id, "delete", before, undefined);
  });
}
