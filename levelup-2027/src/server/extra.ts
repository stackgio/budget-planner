import "server-only";
import { loadPayroll } from "./money-queries";
import { type LocalDate, monthKey } from "@/domain/dates";
import { extraPaycheckMonths } from "@/domain/payroll";
import type { PaydayView } from "@/app/(app)/money/PaydayRow";

export interface ExtraMonth {
  month: string;
  paydays: PaydayView[];
  receivedCents: number;
  receivedCount: number;
}

/** Extra-paycheck months computed from stored REGULAR paydays (recalculates whenever the schedule changes). */
export async function loadExtraMonths(ownerId: string) {
  const { schedule, paydays } = await loadPayroll(ownerId, "REGULAR");
  const active = paydays.filter((p) => p.status !== "SKIPPED");
  const months = extraPaycheckMonths(active.map((p) => p.officialDate)).map<ExtraMonth>((m) => {
    const ps = active.filter((p) => monthKey(p.officialDate) === m.month);
    const received = ps.filter((p) => p.deposit);
    return { month: m.month, paydays: ps, receivedCents: received.reduce((s, p) => s + p.deposit!.netCents, 0), receivedCount: received.length };
  });
  const lastConfirmed = [...paydays].reverse().find((p) => p.deposit);
  return { months, verified: schedule.anchorVerified, lastConfirmedNet: lastConfirmed?.deposit?.netCents ?? null };
}

export function nextExtraMonth(months: ExtraMonth[], today: LocalDate) {
  return months.find((m) => m.month >= monthKey(today)) ?? null;
}
