import { addDays, clampedDate, diffDays, type ISODate } from "./dates";
import { mulDivCeil, mulDivRound, type Cents } from "./money";

export type BillFrequency = "monthly" | "biweekly" | "weekly" | "annual";
export type ReserveMode = "half_month" | "annualized";

export const RESERVE_MODE_LABELS: Record<ReserveMode, { title: string; short: string; explain: string }> = {
  half_month: {
    title: "Half-month reserve (2-paycheck convention)",
    short: "Half-month",
    explain:
      "Each paycheck reserves half of every monthly bill. Simple and conservative: it fully funds every month using only two paychecks. Because a 14-day schedule produces 26 paychecks (not 24), the two extra paychecks a year also reserve half a month each — so this mode builds roughly one extra month of bill money per year as a buffer.",
  },
  annualized: {
    title: "Annualized reserve (26 paychecks)",
    short: "Annualized",
    explain:
      "Each paycheck reserves (annual cost ÷ 26). This sets aside exactly what the year needs and frees more cash per check, but two-paycheck months alone don't cover a full month of bills — it relies on a starting cushion and on three-paycheck months to catch up. Use the gap simulation below to see the cushion required.",
  },
};

export interface BillLike {
  id: string;
  name: string;
  amountCents: Cents;
  frequency: string;
  dueDay: number | null;
  dueMonth?: number | null;
  anchorDate?: ISODate | null;
  active?: boolean;
}

export interface BillOccurrence {
  billId: string;
  name: string;
  dueDate: ISODate;
  amountCents: Cents;
}

export function isScheduled(b: BillLike): boolean {
  switch (b.frequency) {
    case "monthly":
      return b.dueDay != null;
    case "annual":
      return b.dueDay != null && b.dueMonth != null;
    case "weekly":
    case "biweekly":
      return !!b.anchorDate;
    default:
      return false;
  }
}

/** All due dates of a bill in [from, to] inclusive. Unscheduled bills yield none. */
export function billOccurrences(b: BillLike, from: ISODate, to: ISODate): BillOccurrence[] {
  if (b.active === false || !isScheduled(b)) return [];
  const out: BillOccurrence[] = [];
  const push = (d: ISODate) => {
    if (d >= from && d <= to) out.push({ billId: b.id, name: b.name, dueDate: d, amountCents: b.amountCents });
  };
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  if (b.frequency === "monthly" || b.frequency === "annual") {
    for (let idx = fy * 12 + fm - 1; idx <= ty * 12 + tm - 1; idx++) {
      const y = Math.floor(idx / 12);
      const m = (idx % 12) + 1;
      if (b.frequency === "annual" && m !== b.dueMonth) continue;
      push(clampedDate(y, m, b.dueDay!));
    }
  } else {
    const step = b.frequency === "weekly" ? 7 : 14;
    const k = Math.ceil(diffDays(from, b.anchorDate!) / step);
    for (let d = addDays(b.anchorDate!, k * step); d <= to; d = addDays(d, step)) push(d);
  }
  return out;
}

export function occurrencesBetween(bills: BillLike[], from: ISODate, to: ISODate): BillOccurrence[] {
  return bills.flatMap((b) => billOccurrences(b, from, to)).sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name));
}

/** Bills due on/after `payday` and strictly before `nextPayday` — what this check must cover. */
export function billsDueBeforeNextPayday(bills: BillLike[], payday: ISODate, nextPayday: ISODate): BillOccurrence[] {
  return occurrencesBetween(bills, payday, addDays(nextPayday, -1));
}

export function annualCost(b: BillLike): Cents {
  switch (b.frequency) {
    case "monthly":
      return b.amountCents * 12;
    case "biweekly":
      return b.amountCents * 26;
    case "weekly":
      return b.amountCents * 52;
    case "annual":
      return b.amountCents;
    default:
      return b.amountCents * 12;
  }
}

export function monthlyEquivalent(b: BillLike): Cents {
  return b.frequency === "monthly" ? b.amountCents : mulDivRound(annualCost(b), 1, 12);
}

/**
 * Per-paycheck reserve for a bill.
 * half_month: monthly-equivalent ÷ 2 (rounded up) — the 2-paycheck convention.
 * annualized: annual cost ÷ 26 (rounded up).
 * Bills that recur every pay period are simply reserved per check at their own cadence.
 */
export function perCheckReserve(b: BillLike, mode: ReserveMode): Cents {
  if (b.frequency === "biweekly") return b.amountCents;
  if (b.frequency === "weekly") return b.amountCents * 2;
  if (mode === "half_month") return mulDivCeil(monthlyEquivalent(b), 1, 2);
  return mulDivCeil(annualCost(b), 1, 26);
}

export interface ReserveSummary {
  mode: ReserveMode;
  rows: Array<{ billId: string; name: string; monthlyCents: Cents; perCheckCents: Cents; annualCents: Cents; reservedPerYear: Cents }>;
  totalMonthly: Cents;
  totalPerCheck: Cents;
  totalAnnualCost: Cents;
  reservedPerYear: Cents; // perCheck * 26
  extraPerYear: Cents; // reserved - needed (positive = buffer built)
}

export function reserveSummary(bills: BillLike[], mode: ReserveMode, paychecksPerYear = 26): ReserveSummary {
  const rows = bills
    .filter((b) => b.active !== false)
    .map((b) => {
      const perCheckCents = perCheckReserve(b, mode);
      return {
        billId: b.id,
        name: b.name,
        monthlyCents: monthlyEquivalent(b),
        perCheckCents,
        annualCents: annualCost(b),
        reservedPerYear: perCheckCents * paychecksPerYear,
      };
    });
  const totalPerCheck = rows.reduce((a, r) => a + r.perCheckCents, 0);
  const totalAnnualCost = rows.reduce((a, r) => a + r.annualCents, 0);
  const reservedPerYear = totalPerCheck * paychecksPerYear;
  return {
    mode,
    rows,
    totalMonthly: rows.reduce((a, r) => a + r.monthlyCents, 0),
    totalPerCheck,
    totalAnnualCost,
    reservedPerYear,
    extraPerYear: reservedPerYear - totalAnnualCost,
  };
}

export interface SinkingFundResult {
  occurrences: Array<{ dueDate: ISODate; amountCents: Cents; reserveBefore: Cents; shortfallCents: Cents }>;
  totalShortfall: Cents;
  /** Smallest starting reserve that would avoid every shortfall in the window. */
  startingReserveNeeded: Cents;
  endingReserve: Cents;
}

/**
 * Simulate a per-bill sinking fund: on each payday add `perCheckCents`, on each
 * due date pay the bill. Paydays are processed before bills on the same date.
 * A shortfall means the reserve was not enough on the due date; the simulation
 * assumes the gap was covered from other cash and continues from zero.
 */
export function simulateSinkingFund(
  bill: BillLike,
  paydays: ISODate[],
  perCheckCents: Cents,
  startingReserve: Cents,
  from: ISODate,
  to: ISODate,
): SinkingFundResult {
  type Ev = { date: ISODate; order: number; amount: Cents };
  const evs: Ev[] = [
    ...paydays.filter((d) => d >= from && d <= to).map((d) => ({ date: d, order: 0, amount: perCheckCents })),
    ...billOccurrences(bill, from, to).map((o) => ({ date: o.dueDate, order: 1, amount: -o.amountCents })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
  let reserve = startingReserve;
  let running = 0; // contributions - bills with no starting reserve, for cushion calc
  let worst = 0;
  const occurrences: SinkingFundResult["occurrences"] = [];
  for (const e of evs) {
    running += e.amount;
    if (running < worst) worst = running;
    if (e.amount > 0) {
      reserve += e.amount;
    } else {
      const need = -e.amount;
      const shortfall = Math.max(0, need - reserve);
      occurrences.push({ dueDate: e.date, amountCents: need, reserveBefore: reserve, shortfallCents: shortfall });
      reserve = Math.max(0, reserve - need);
    }
  }
  return {
    occurrences,
    totalShortfall: occurrences.reduce((a, o) => a + o.shortfallCents, 0),
    startingReserveNeeded: -worst,
    endingReserve: reserve,
  };
}

export interface BillFundingStatus {
  billId: string;
  name: string;
  dueDate: ISODate;
  amountCents: Cents;
  fundedCents: Cents; // confirmed by the user
  plannedBeforeDueCents: Cents; // per-check reserves from paychecks still to come before the due date
  gapCents: Cents; // amount not covered by funded + planned
  status: "funded" | "on_track" | "gap";
}

/**
 * Funding status for a bill's next occurrence. `funded` only counts reserves the
 * user has confirmed — a budget allocation alone never marks a bill as funded.
 */
export function billFundingStatus(params: {
  bill: BillLike;
  today: ISODate;
  upcomingPaydays: ISODate[]; // paydays on/after today
  perCheckCents: Cents;
  confirmedReserves: Array<{ payDate: ISODate; fundedCents: Cents }>;
}): BillFundingStatus | null {
  const { bill, today } = params;
  const next = billOccurrences(bill, today, addDays(today, 400))[0];
  if (!next) return null;
  const prev = billOccurrences(bill, addDays(today, -400), addDays(today, -1)).pop();
  const windowStart = prev ? addDays(prev.dueDate, 1) : addDays(next.dueDate, -45);
  const fundedCents = params.confirmedReserves
    .filter((r) => r.payDate >= windowStart && r.payDate <= next.dueDate)
    .reduce((a, r) => a + r.fundedCents, 0);
  const fundedDates = new Set(params.confirmedReserves.filter((r) => r.fundedCents > 0).map((r) => r.payDate));
  const remainingChecks = params.upcomingPaydays.filter((d) => d >= today && d <= next.dueDate && !fundedDates.has(d)).length;
  const plannedBeforeDueCents = remainingChecks * params.perCheckCents;
  const gapCents = Math.max(0, next.amountCents - fundedCents - plannedBeforeDueCents);
  const status = fundedCents >= next.amountCents ? "funded" : gapCents === 0 ? "on_track" : "gap";
  return { billId: bill.id, name: bill.name, dueDate: next.dueDate, amountCents: next.amountCents, fundedCents, plannedBeforeDueCents, gapCents, status };
}

export interface CashEvent {
  date: ISODate;
  amountCents: Cents;
  label: string;
  kind: "income" | "bill" | "planned" | "actual";
  projected: boolean;
}

export interface CashPoint extends CashEvent {
  balanceCents: Cents | null;
}

/**
 * Project an account balance through a list of dated events. Income is applied
 * before outflows on the same day. If the starting balance is unknown, balances
 * are null — MoneyFlow never assumes a missing balance is zero.
 */
export function projectCashFlow(startBalance: Cents | null, events: CashEvent[]): { points: CashPoint[]; lowest: CashPoint | null; firstNegative: CashPoint | null } {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || Number(a.amountCents < 0) - Number(b.amountCents < 0));
  let bal = startBalance;
  const points: CashPoint[] = sorted.map((e) => {
    if (bal !== null) bal += e.amountCents;
    return { ...e, balanceCents: bal };
  });
  let lowest: CashPoint | null = null;
  let firstNegative: CashPoint | null = null;
  for (const p of points) {
    if (p.balanceCents === null) continue;
    if (!lowest || p.balanceCents < lowest.balanceCents!) lowest = p;
    if (!firstNegative && p.balanceCents < 0) firstNegative = p;
  }
  return { points, lowest, firstNegative };
}
