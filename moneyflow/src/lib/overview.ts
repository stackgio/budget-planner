import type { Workspace } from "./workspace";
import { addDays, addMonths, daysInMonth, monthEnd, monthOf, monthStart, type ISODate, type YearMonth } from "./dates";
import {
  billFundingStatus,
  billOccurrences,
  billsDueBeforeNextPayday,
  occurrencesBetween,
  perCheckReserve,
  projectCashFlow,
  reserveSummary,
  type BillFundingStatus,
  type CashEvent,
  type ReserveMode,
} from "./bills";
import { accountBalance, availableCash, creditUtilization, LIABILITY_TYPES, netWorth, spendingByCategory, totalIncome, totalSpending, type TxLike } from "./ledger";
import { allocate, buildPaydayIncome, incomeFigures, nextPayday, paydaysBetween, previousPayday, type PaydayIncome } from "./paycheck";
import { budgetHealth } from "./health";
import type { Cents } from "./money";

export function txLike(ws: Workspace): TxLike[] {
  return ws.transactions.map((t) => ({ id: t.id, date: t.date, amountCents: t.amountCents, type: t.type, accountId: t.accountId, categoryId: t.categoryId, merchant: t.merchant, createdAt: t.createdAt, splits: t.splits }));
}

export function balancesAsOf(ws: Workspace, date: ISODate): Map<string, Cents | null> {
  const txs = txLike(ws);
  return new Map(ws.accounts.map((a) => [a.id, accountBalance(a.id, ws.snapshots, txs, date)]));
}

export function categoryBudget(ws: Workspace, month: YearMonth, categoryId: string): Cents | null {
  const o = ws.budgets.find((b) => b.month === month && b.categoryId === categoryId);
  if (o) return o.amountCents;
  return ws.categories.find((c) => c.id === categoryId)?.monthlyBudgetCents ?? null;
}

export function txInRange(ws: Workspace, from: ISODate, to: ISODate) {
  return txLike(ws).filter((t) => t.date >= from && t.date <= to);
}

export function goalSaved(ws: Workspace, goalId: string): Cents {
  return ws.goalContribs.filter((c) => c.goalId === goalId).reduce((a, c) => a + c.amountCents, 0);
}

export function primaryAccount(ws: Workspace) {
  return ws.accounts.find((a) => a.id === ws.settings.primaryAccountId) ?? ws.accounts.find((a) => a.type === "checking") ?? null;
}

export function unverifiedCount(ws: Workspace): number {
  return (
    ws.bills.filter((b) => b.active && !b.verified).length +
    ws.accounts.filter((a) => !a.archived && !a.verified).length +
    ws.goals.filter((g) => !g.archived && !g.verified).length +
    ws.planLines.filter((p) => p.status === "draft").length
  );
}

export function scheduledBills(ws: Workspace) {
  return ws.bills.filter((b) => b.active);
}

/** Income records for paydays in a window (merged with persisted actuals/extras). */
export function paydayIncome(ws: Workspace, from: ISODate, to: ISODate): PaydayIncome[] {
  const s = ws.settings;
  if (!s.anchorPayday) {
    // Without an anchor we can still show recorded paychecks, but no forecasts.
    return ws.paychecks
      .filter((p) => p.payDate >= from && p.payDate <= to)
      .map((p) => ({ payDate: p.payDate, expectedCents: p.expectedCents, actualCents: p.actualCents, isForecast: p.actualCents === null, extras: [], monthIndex: 0, isThirdPaycheck: false }));
  }
  return buildPaydayIncome(s.anchorPayday, from, to, s.netPayCents, ws.paychecks, s.payIntervalDays);
}

export interface PaycheckPlan {
  payDate: ISODate;
  nextPayDate: ISODate;
  income: PaydayIncome;
  incomeUsedCents: Cents; // actual if received, else expected
  billsDue: Array<{ billId: string; name: string; dueDate: ISODate; amountCents: Cents }>;
  billsDueCents: Cents;
  reserveRows: Array<{ billId: string; name: string; perCheckCents: Cents; fundedCents: Cents }>;
  reserveCents: Cents;
  reserveFundedCents: Cents;
  allocation: ReturnType<typeof allocate>;
  needsAfterReserveCents: Cents;
  remainingSpendableCents: Cents;
  assignments: Workspace["assignments"];
  assignedCents: Cents;
  unassignedCents: Cents;
  projectedBalanceAfterCents: Cents | null;
  balanceIsActual: boolean;
  isPast: boolean;
}

/** Everything the "My Paycheck" page shows for one payday. */
export function paycheckPlans(ws: Workspace, from: ISODate, to: ISODate, today: ISODate): PaycheckPlan[] {
  const s = ws.settings;
  if (!s.anchorPayday) return [];
  const mode = s.reserveMode as ReserveMode;
  const bills = scheduledBills(ws);
  const incomes = paydayIncome(ws, from, addDays(to, 0)).filter((p) => p.monthIndex > 0);
  const primary = primaryAccount(ws);
  const txs = txLike(ws);
  const startBal = primary ? accountBalance(primary.id, ws.snapshots, txs, today) : null;

  // Projection for future paychecks on the primary account
  const futurePays = paydaysBetween(s.anchorPayday, addDays(today, 1), addDays(to, s.payIntervalDays), s.payIntervalDays);
  const events: CashEvent[] = [];
  for (const d of futurePays) {
    const inc = incomes.find((i) => i.payDate === d);
    const amt = inc ? (inc.actualCents ?? inc.expectedCents) : s.netPayCents;
    events.push({ date: d, amountCents: amt, label: "Paycheck", kind: "income", projected: true });
    const alloc = allocate(amt, ws.rules, { investingPaused: s.investingPaused });
    for (const p of alloc.parts) if (p.key === "investing" || p.key === "goals") if (p.amountCents > 0) events.push({ date: d, amountCents: -p.amountCents, label: p.label, kind: "planned", projected: true });
  }
  for (const o of occurrencesBetween(bills.filter((b) => !b.accountId || b.accountId === primary?.id), addDays(today, 1), addDays(to, s.payIntervalDays))) {
    events.push({ date: o.dueDate, amountCents: -o.amountCents, label: o.name, kind: "bill", projected: true });
  }
  const proj = projectCashFlow(startBal, events);

  return incomes.map((inc) => {
    const next = addDays(inc.payDate, s.payIntervalDays);
    const due = billsDueBeforeNextPayday(bills, inc.payDate, next);
    const reserveRows = bills.map((b) => ({
      billId: b.id,
      name: b.name,
      perCheckCents: perCheckReserve(b, mode),
      fundedCents: ws.reserves.find((r) => r.billId === b.id && r.payDate === inc.payDate)?.fundedCents ?? 0,
    }));
    const reserveCents = reserveRows.reduce((a, r) => a + r.perCheckCents, 0);
    const incomeUsed = inc.actualCents ?? inc.expectedCents;
    const allocation = allocate(incomeUsed, ws.rules, { investingPaused: s.investingPaused });
    const part = (k: string) => allocation.parts.find((p) => p.key === k)?.amountCents ?? 0;
    const assignments = ws.assignments.filter((a) => a.payDate === inc.payDate);
    const assigned = assignments.reduce((a, x) => a + x.amountCents, 0);
    const isPast = inc.payDate <= today;
    let balanceAfter: Cents | null = null;
    let balanceIsActual = false;
    if (primary) {
      if (next <= today || inc.payDate <= today) {
        // Actual balance at the end of this pay period (or today if the period is in progress)
        const end = next <= today ? addDays(next, -1) : today;
        balanceAfter = accountBalance(primary.id, ws.snapshots, txs, end);
        balanceIsActual = true;
      } else {
        // Projected balance right before the next payday
        const before = proj.points.filter((p) => p.date < next);
        balanceAfter = before.length ? before[before.length - 1].balanceCents : startBal;
      }
    }
    return {
      payDate: inc.payDate,
      nextPayDate: next,
      income: inc,
      incomeUsedCents: incomeUsed,
      billsDue: due,
      billsDueCents: due.reduce((a, d) => a + d.amountCents, 0),
      reserveRows,
      reserveCents,
      reserveFundedCents: reserveRows.reduce((a, r) => a + r.fundedCents, 0),
      allocation,
      needsAfterReserveCents: part("needs") - reserveCents,
      remainingSpendableCents: incomeUsed - reserveCents - part("investing") - part("goals") - allocation.pausedCents,
      assignments,
      assignedCents: assigned,
      unassignedCents: incomeUsed - assigned,
      projectedBalanceAfterCents: balanceAfter,
      balanceIsActual,
      isPast,
    };
  });
}

export function fundingStatuses(ws: Workspace, today: ISODate): BillFundingStatus[] {
  const s = ws.settings;
  if (!s.anchorPayday) return [];
  const upcoming = paydaysBetween(s.anchorPayday, today, addDays(today, 400), s.payIntervalDays);
  return scheduledBills(ws)
    .map((b) =>
      billFundingStatus({
        bill: b,
        today,
        upcomingPaydays: upcoming,
        perCheckCents: perCheckReserve(b, s.reserveMode as ReserveMode),
        confirmedReserves: ws.reserves.filter((r) => r.billId === b.id),
      }),
    )
    .filter((x): x is BillFundingStatus => !!x)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function computeOverview(ws: Workspace, month: YearMonth, today: ISODate) {
  const s = ws.settings;
  const txs = txLike(ws);
  const anchorSet = !!s.anchorPayday;
  const balances = balancesAsOf(ws, today);
  const cash = availableCash(ws.accounts, balances);
  const savingsCash = availableCash(ws.accounts, balances, new Set(["savings"]));
  const nw = netWorth(ws.accounts, balances);
  const next = anchorSet ? nextPayday(s.anchorPayday!, addDays(today, 1), s.payIntervalDays) : null;
  const prev = anchorSet ? previousPayday(s.anchorPayday!, addDays(today, 1), s.payIntervalDays) : null;
  const bills = scheduledBills(ws);
  const billsBeforeNext = next ? occurrencesBetween(bills, today, addDays(next, -1)) : occurrencesBetween(bills, today, addDays(today, 13));
  const billsBeforeNextCents = billsBeforeNext.reduce((a, b) => a + b.amountCents, 0);
  const upcomingBills = occurrencesBetween(bills, today, addDays(today, 30));

  const from = monthStart(month);
  const to = monthEnd(month);
  const monthTxs = txs.filter((t) => t.date >= from && t.date <= to);
  const incomeReceived = totalIncome(monthTxs);
  const spending = totalSpending(monthTxs);
  const byCat = spendingByCategory(monthTxs);
  const expenseCats = ws.categories.filter((c) => c.bucket !== "income" && c.bucket !== "transfer");
  const catRows = expenseCats
    .map((c) => ({ id: c.id, name: c.name, color: c.color, bucket: c.bucket, budgetCents: categoryBudget(ws, month, c.id), spentCents: byCat.get(c.id) ?? 0, fixed: ws.bills.some((b) => b.active && b.categoryId === c.id) }))
    .filter((c) => c.spentCents !== 0 || (c.budgetCents ?? 0) > 0);
  const uncategorized = byCat.get(null) ?? 0;
  const budgetTotal = catRows.reduce((a, c) => a + (c.budgetCents ?? 0), 0);
  const budgetedSpent = catRows.filter((c) => (c.budgetCents ?? 0) > 0).reduce((a, c) => a + c.spentCents, 0);
  const budgetRemaining = budgetTotal > 0 ? budgetTotal - budgetedSpent : null;

  // Money until next paycheck: checking balance minus unpaid bills due before the next payday
  const primary = primaryAccount(ws);
  const primaryBal = primary ? (balances.get(primary.id) ?? null) : null;
  const untilNext = primaryBal === null ? null : primaryBal - billsBeforeNextCents;

  const goals = ws.goals.filter((g) => !g.archived).map((g) => ({ ...g, savedCents: goalSaved(ws, g.id) }));
  const goalTarget = goals.reduce((a, g) => a + (g.targetCents ?? 0), 0);
  const goalSavedTotal = goals.reduce((a, g) => a + g.savedCents, 0);

  const debts = ws.accounts
    .filter((a) => LIABILITY_TYPES.has(a.type) && !a.archived)
    .map((a) => {
      const bal = balances.get(a.id) ?? null;
      const owed = bal === null ? null : -bal;
      const first = ws.snapshots.find((x) => x.accountId === a.id);
      const startOwed = first ? -first.balanceCents : null;
      return { ...a, owedCents: owed, startOwedCents: startOwed, util: creditUtilization(owed, a.creditLimitCents) };
    });
  const knownDebts = debts.filter((d) => d.owedCents !== null);
  const debtOwed = knownDebts.reduce((a, d) => a + Math.max(0, d.owedCents!), 0);
  const debtStart = knownDebts.reduce((a, d) => a + Math.max(0, d.startOwedCents ?? d.owedCents!), 0);

  const funding = fundingStatuses(ws, today);
  const emergency = goals.find((g) => g.kind === "emergency");
  const monthDays = daysInMonth(+month.slice(0, 4), +month.slice(5, 7));
  const monthProgress = month === monthOf(today) ? Number(today.slice(8, 10)) / monthDays : month < monthOf(today) ? 1 : 0;

  // Unassigned money from paychecks received in the current month
  const received = paydayIncome(ws, monthStart(monthOf(today)), today).filter((p) => p.actualCents !== null);
  const unassigned = received.reduce((a, p) => a + Math.max(0, (p.actualCents ?? 0) - ws.assignments.filter((x) => x.payDate === p.payDate).reduce((s2, x) => s2 + x.amountCents, 0)), 0);

  const debtDue = debts
    .filter((d) => d.dueDay)
    .map((d) => {
      const occ = billOccurrences({ id: d.id, name: d.name, amountCents: d.minPaymentCents ?? 0, frequency: "monthly", dueDay: d.dueDay }, today, addDays(today, 10))[0];
      return occ ? { name: d.name, dueDate: occ.dueDate, minPaymentCents: d.minPaymentCents } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);

  const fig = incomeFigures(s.netPayCents, s.payIntervalDays);
  const needsRule = ws.rules.find((r) => r.key === "needs");
  const needsBudget = needsRule ? allocate(fig.normalMonth, ws.rules).parts.find((p) => p.key === "needs")!.amountCents : null;
  const needsBills = bills.filter((b) => {
    const c = ws.categories.find((x) => x.id === b.categoryId);
    return !c || c.bucket === "needs";
  });
  const listedNeeds = reserveSummary(needsBills, "half_month").totalMonthly;
  const needsMargin = needsBudget === null ? null : needsBudget - listedNeeds;

  const warnings = budgetHealth({
    today,
    availableCashCents: cash.unknown.length && cash.cents === 0 ? null : cash.cents,
    unknownCashAccounts: cash.unknown.length,
    nextPayday: next,
    billsBeforeNextPaydayCents: billsBeforeNextCents,
    billsBeforeNextPayday: billsBeforeNext,
    categories: catRows,
    monthProgress,
    funding,
    emergency: { targetCents: s.emergencyTargetCents ?? emergency?.targetCents ?? null, savedCents: emergency?.savedCents ?? null },
    unassignedCents: unassigned,
    upcomingDebtPayments: debtDue,
    unverifiedCount: unverifiedCount(ws),
    anchorSet,
    needsMarginCents: needsMargin,
  });

  // Last 6 months income vs spending
  const trend = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5)).map((m) => {
    const mt = txs.filter((t) => t.date >= monthStart(m) && t.date <= monthEnd(m));
    return { month: m, income: totalIncome(mt), spending: totalSpending(mt) };
  });

  return {
    today, month, anchorSet, next, prev, balances, cash, savingsCash, nw,
    billsBeforeNext, billsBeforeNextCents, upcomingBills,
    incomeReceived, spending, catRows, uncategorized, budgetTotal, budgetRemaining,
    primary, primaryBal, untilNext,
    goals, goalTarget, goalSavedTotal,
    debts, debtOwed, debtStart,
    funding, warnings, unassigned, fig, needsBudget, listedNeeds, needsMargin, trend,
    recent: ws.transactions.slice(0, 8),
  };
}
