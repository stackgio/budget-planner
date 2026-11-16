import "server-only";
import type { PayKind } from "@prisma/client";
import { prisma } from "./db";
import { ensurePaydays } from "./payroll";
import { dateToLocal } from "@/domain/dates";
import { isOnSchedule } from "@/domain/payroll";
import type { PaydayView } from "@/app/(app)/money/PaydayRow";

export async function loadPayroll(ownerId: string, kind: PayKind) {
  await ensurePaydays(ownerId);
  const schedule = await prisma.paySchedule.findUniqueOrThrow({ where: { ownerId_kind: { ownerId, kind } } });
  const rows = await prisma.payday.findMany({
    where: { ownerId, kind },
    include: { deposit: true, overtimeShifts: { select: { estimatedGrossCents: true } } },
    orderBy: { officialDate: "asc" },
  });
  const cfg = { anchorOfficialDate: dateToLocal(schedule.anchorOfficialDate), intervalDays: schedule.intervalDays };
  const paydays: PaydayView[] = rows.map((p) => ({
    id: p.id, kind: p.kind, officialDate: dateToLocal(p.officialDate), expectedDepositDate: dateToLocal(p.expectedDepositDate),
    manualDepositDate: p.manualDepositDate ? dateToLocal(p.manualDepositDate) : null, holidayNote: p.holidayNote, status: p.status, note: p.note,
    onSchedule: isOnSchedule(cfg, dateToLocal(p.officialDate)),
    deposit: p.deposit ? { netCents: p.deposit.netCents, actualDepositDate: dateToLocal(p.deposit.actualDepositDate), notes: p.deposit.notes } : null,
    ...(kind === "OVERTIME" ? { shiftCount: p.overtimeShifts.length, estGrossCents: p.overtimeShifts.reduce((s, x) => s + x.estimatedGrossCents, 0) } : {}),
  }));
  return { schedule, cfg, paydays };
}
