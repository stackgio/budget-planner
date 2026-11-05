import { addMonths, type YearMonth } from "./dates";
import { mulDivRound, type Cents } from "./money";

export type Strategy = "snowball" | "avalanche";

export interface DebtInput {
  id: string;
  name: string;
  balanceCents: Cents | null; // positive amount owed; null = unknown
  aprBps: number | null; // null = unknown
  minPaymentCents: Cents | null; // null = unknown
}

export interface DebtPlanResult {
  feasible: boolean;
  /** Debts left out of the plan and why (missing data is never guessed). */
  excluded: Array<{ id: string; name: string; reason: string }>;
  months: number | null; // months until all included debts are paid
  payoffMonth: YearMonth | null;
  totalInterestCents: Cents;
  totalPaidCents: Cents;
  perDebt: Array<{ id: string; name: string; payoffMonthIndex: number | null; payoffMonth: YearMonth | null; interestCents: Cents }>;
  schedule: Array<{ month: YearMonth; totalBalanceCents: Cents }>;
  problem?: string;
}

const MAX_MONTHS = 600;

/**
 * Month-by-month payoff simulation.
 * - Interest accrues monthly at APR/12 on the opening balance (rounded to cents).
 * - Every debt gets its minimum payment; the extra budget plus any freed-up minimums
 *   ("rollover") go to the target debt: smallest balance (snowball) or highest APR (avalanche).
 * - Only debts with a known balance, APR and minimum payment are simulated.
 */
export function simulatePayoff(debts: DebtInput[], extraMonthlyCents: Cents, strategy: Strategy, startMonth: YearMonth): DebtPlanResult {
  const excluded: DebtPlanResult["excluded"] = [];
  const active: Array<{ id: string; name: string; bal: Cents; apr: number; min: Cents; interest: Cents; paidOff: number | null }> = [];
  for (const d of debts) {
    if (d.balanceCents === null) excluded.push({ id: d.id, name: d.name, reason: "Balance not entered" });
    else if (d.balanceCents <= 0) continue;
    else if (d.aprBps === null) excluded.push({ id: d.id, name: d.name, reason: "APR not entered (enter 0% for interest-free debt)" });
    else if (d.minPaymentCents === null) excluded.push({ id: d.id, name: d.name, reason: "Minimum / planned payment not entered" });
    else active.push({ id: d.id, name: d.name, bal: d.balanceCents, apr: d.aprBps, min: d.minPaymentCents, interest: 0, paidOff: null });
  }
  const budget = active.reduce((a, d) => a + d.min, 0) + Math.max(0, extraMonthlyCents);
  const schedule: DebtPlanResult["schedule"] = [{ month: startMonth, totalBalanceCents: active.reduce((a, d) => a + d.bal, 0) }];
  let totalInterest = 0;
  let totalPaid = 0;
  let month = 0;
  const empty = (): DebtPlanResult => ({
    feasible: true, excluded, months: 0, payoffMonth: startMonth, totalInterestCents: 0, totalPaidCents: 0, perDebt: [], schedule,
  });
  if (active.length === 0) return { ...empty(), feasible: excluded.length === 0, months: excluded.length ? null : 0, payoffMonth: excluded.length ? null : startMonth };

  while (active.some((d) => d.bal > 0) && month < MAX_MONTHS) {
    month++;
    // 1. accrue interest
    for (const d of active) {
      if (d.bal <= 0) continue;
      const i = mulDivRound(d.bal, d.apr, 12 * 10_000);
      d.bal += i;
      d.interest += i;
      totalInterest += i;
    }
    // 2. minimums
    let pool = budget;
    for (const d of active) {
      if (d.bal <= 0) continue;
      const pay = Math.min(d.min, d.bal, pool);
      d.bal -= pay;
      pool -= pay;
      totalPaid += pay;
    }
    // 3. extra + rollover to target order
    const order = active
      .filter((d) => d.bal > 0)
      .sort((a, b) => (strategy === "snowball" ? a.bal - b.bal || b.apr - a.apr : b.apr - a.apr || a.bal - b.bal));
    for (const d of order) {
      if (pool <= 0) break;
      const pay = Math.min(pool, d.bal);
      d.bal -= pay;
      pool -= pay;
      totalPaid += pay;
    }
    for (const d of active) if (d.bal <= 0 && d.paidOff === null) d.paidOff = month;
    schedule.push({ month: addMonths(startMonth, month), totalBalanceCents: active.reduce((a, d) => a + Math.max(0, d.bal), 0) });
    // Detect negative amortization: balance not decreasing after a year.
    if (month === 12 && schedule[12].totalBalanceCents >= schedule[0].totalBalanceCents) {
      return {
        feasible: false, excluded, months: null, payoffMonth: null, totalInterestCents: totalInterest, totalPaidCents: totalPaid,
        perDebt: active.map((d) => ({ id: d.id, name: d.name, payoffMonthIndex: d.paidOff, payoffMonth: d.paidOff ? addMonths(startMonth, d.paidOff) : null, interestCents: d.interest })),
        schedule, problem: "Payments don't cover interest — balances are not going down. Increase payments.",
      };
    }
  }
  const done = active.every((d) => d.bal <= 0);
  return {
    feasible: done && excluded.length === 0,
    excluded,
    months: done ? month : null,
    payoffMonth: done ? addMonths(startMonth, month) : null,
    totalInterestCents: totalInterest,
    totalPaidCents: totalPaid,
    perDebt: active.map((d) => ({ id: d.id, name: d.name, payoffMonthIndex: d.paidOff, payoffMonth: d.paidOff ? addMonths(startMonth, d.paidOff) : null, interestCents: d.interest })),
    schedule,
    problem: done ? undefined : `Not paid off within ${MAX_MONTHS / 12} years at this payment level.`,
  };
}
