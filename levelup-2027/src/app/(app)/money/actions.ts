"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { UserError, recordDeposit, setManualDepositDate, setPaydayStatus, updateSchedule, voidDeposit } from "@/server/payroll";
import { createOvertimeShift, deleteOvertimeShift, updateOvertimeShift, type OvertimeInput } from "@/server/overtime";
import { switchMode } from "@/server/modes";
import { run, type ActionState } from "@/ui/actions";
import { isLocalDate, isTime, localToDbDate, todayLocal } from "@/domain/dates";
import { parseDollarsToCents, parseHoursX100 } from "@/domain/money";

const date = z.string().refine(isLocalDate, "Enter a valid date.");
const done = () => revalidatePath("/", "layout");

export async function updateScheduleAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i = z.object({ kind: z.enum(["REGULAR", "OVERTIME"]), anchor: date, offset: z.coerce.number().int().min(-5).max(5), verified: z.string().optional() }).parse(Object.fromEntries(fd));
    const res = await updateSchedule(user.id, i.kind, { anchorOfficialDate: i.anchor, anchorVerified: i.verified === "on", earlyDepositOffsetDays: i.offset });
    return res.anchorChanged
      ? `Schedule updated. ${res.removed} projected paydays were recalculated; ${res.preserved} paydays with your confirmed data were preserved.`
      : "Schedule updated.";
  });
  done();
  return r;
}

export async function recordDepositAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i = z.object({ paydayId: z.string().min(1), amount: z.string(), date, notes: z.string().max(500).optional(), idempotencyKey: z.string() }).parse(Object.fromEntries(fd));
    const cents = parseDollarsToCents(i.amount);
    if (cents === null) throw new UserError("Enter the net amount deposited, e.g. 1482.37");
    await recordDeposit(user.id, i.paydayId, { netCents: cents, actualDepositDate: i.date, notes: i.notes, idempotencyKey: i.idempotencyKey });
    return "Deposit confirmed.";
  });
  done();
  return r;
}

export async function voidDepositAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i = z.object({ paydayId: z.string().min(1), reason: z.string().trim().min(3, "Say briefly why (kept in the audit log).").max(200) }).parse(Object.fromEntries(fd));
    await voidDeposit(user.id, i.paydayId, i.reason);
    return "Deposit voided. The original stays in your history and audit log.";
  });
  done();
  return r;
}

export async function paydayStatusAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i = z.object({ paydayId: z.string().min(1), status: z.enum(["EXPECTED", "ZERO", "SKIPPED"]), note: z.string().max(200).optional() }).parse(Object.fromEntries(fd));
    await setPaydayStatus(user.id, i.paydayId, i.status, i.note || null);
  });
  done();
  return r;
}

export async function manualDepositDateAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i = z.object({ paydayId: z.string().min(1), date: z.string().optional() }).parse(Object.fromEntries(fd));
    if (i.date && !isLocalDate(i.date)) throw new UserError("Invalid date.");
    await setManualDepositDate(user.id, i.paydayId, i.date || null);
    return i.date ? "Expected deposit date updated." : "Override removed.";
  });
  done();
  return r;
}

export async function payRateAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i = z.object({ hourly: z.string(), multiplier: z.string(), provisional: z.string().optional(), effectiveFrom: date }).parse(Object.fromEntries(fd));
    const hourly = parseDollarsToCents(i.hourly);
    if (!hourly) throw new UserError("Enter your regular hourly rate, e.g. 24.20");
    const m = /^(\d)(?:\.(\d{1,4}))?$/.exec(i.multiplier.trim());
    if (!m) throw new UserError("Enter a multiplier like 1.5");
    const bp = Number(m[1]) * 10000 + Number(((m[2] ?? "") + "0000").slice(0, 4));
    if (bp < 10000 || bp > 30000) throw new UserError("Multiplier must be between 1.0 and 3.0.");
    await prisma.$transaction(async (tx) => {
      const rate = await tx.payRate.create({ data: { ownerId: user.id, regularHourlyCents: hourly, overtimeMultiplierBp: bp, provisional: i.provisional === "on", effectiveFrom: localToDbDate(i.effectiveFrom) } });
      await audit(tx, user.id, "PayRate", rate.id, "create", undefined, rate);
    });
    return "Pay rate saved. Existing shift estimates keep the rate they were logged with unless you recalculate them.";
  });
  done();
  return r;
}

const shiftSchema = z.object({
  id: z.string().optional(),
  date,
  startTime: z.string().refine(isTime, "Invalid start time."),
  endTime: z.string().refine(isTime, "Invalid end time."),
  breakMinutes: z.coerce.number().int().min(0).max(600).default(0),
  regularHours: z.string().default("0"),
  overtimeHours: z.string().default("0"),
  isActivation: z.string().optional(),
  payrollPeriod: z.string().max(60).optional(),
  paydayId: z.string().optional(),
  status: z.enum(["WORKED", "SUBMITTED", "APPROVED", "EXPECTED", "RECEIVED", "DISPUTED"]).default("WORKED"),
  notes: z.string().max(1000).optional(),
  addToCalendar: z.string().optional(),
  switchMode: z.string().optional(),
  recalc: z.string().optional(),
});

export async function overtimeShiftAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i = shiftSchema.parse(Object.fromEntries(fd));
    const reg = parseHoursX100(i.regularHours || "0");
    const ot = parseHoursX100(i.overtimeHours || "0");
    if (reg === null || ot === null) throw new UserError("Hours must be numbers like 8 or 7.5");
    if (reg + ot === 0) throw new UserError("Enter at least some regular-rate or overtime-rate hours.");
    const input: OvertimeInput = {
      date: i.date, startTime: i.startTime, endTime: i.endTime, breakMinutes: i.breakMinutes,
      regularHoursX100: reg, overtimeHoursX100: ot, isActivation: i.isActivation === "on",
      payrollPeriod: i.payrollPeriod?.trim() || null, paydayId: i.paydayId || null, status: i.status,
      notes: i.notes?.trim() || null, addToCalendar: i.addToCalendar === "on",
    };
    if (i.id) await updateOvertimeShift(user.id, user.timezone, i.id, input, i.recalc === "on");
    else await createOvertimeShift(user.id, user.timezone, input);
    if (!i.id && i.switchMode === "on" && i.date === todayLocal(user.timezone)) await switchMode(user.id, "OVERTIME");
    return i.id ? "Shift updated." : "Overtime shift logged.";
  });
  done();
  return r;
}

export async function deleteOvertimeShiftAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await deleteOvertimeShift(user.id, z.string().min(1).parse(fd.get("id")));
    return "Shift deleted.";
  });
  done();
  return r;
}

export async function schdNextDayAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const next = z.coerce.number().int().min(1).max(101).parse(fd.get("nextDay"));
    await prisma.$transaction(async (tx) => {
      const c = await tx.challenge.findUnique({ where: { ownerId_kind: { ownerId: user.id, kind: "SCHD" } } });
      if (!c) throw new UserError("SCHD challenge not found.");
      // Earlier days are shown as provisional (not verified); later days reopen. Verified days are never touched.
      await tx.challengeTile.updateMany({ where: { challengeId: c.id, number: { lt: next }, status: "OPEN" }, data: { status: "PROVISIONAL" } });
      await tx.challengeTile.updateMany({ where: { challengeId: c.id, number: { gte: next }, status: "PROVISIONAL" }, data: { status: "OPEN" } });
      await tx.challenge.update({ where: { id: c.id }, data: { nextNumber: next } });
      await audit(tx, user.id, "Challenge", c.id, `nextNumber:${next}`, { nextNumber: c.nextNumber }, { nextNumber: next });
    });
    return `Next SCHD day set to Day ${next}.`;
  });
  done();
  return r;
}
