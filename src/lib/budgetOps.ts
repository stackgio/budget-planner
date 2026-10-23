/**
 * Validated state transitions for the Budget Manager. Like ops.ts, each
 * returns new AppData or throws a ValidationError with a friendly message.
 *
 * History rule: a paycheck keeps the plan it was created with. Editing the
 * plan updates only paychecks dated after today; the current paycheck is
 * updated only when you ask (applyPlanToPaycheck / setDebtMode).
 */
import type { AppData, BudgetPlan, Debt, DebtPayoff, Paycheck, PaycheckPlan, PlanLine, Transaction } from './types';
import { BUCKETS, BUCKET_LABELS } from './types';
import { addDays, formatDay, isISODate, type ISODate } from './dates';
import { newId } from './ids';
import { addTransaction, ValidationError } from './ops';
import { allocate, paycheckPeriod, percentTotal, redirectAmount } from './budget';

const LINE_TYPES = ['bill', 'spending', 'contribution'] as const;
const GOALS = ['emergency', 'travel', 'birthday', 'debt', 'other'] as const;

export function snapshotPlan(plan: Pick<BudgetPlan, 'percents' | 'lines' | 'debtPayoff'>, settledLineIds: string[] = []): PaycheckPlan {
  return {
    percents: { ...plan.percents },
    lines: plan.lines.map((l) => ({ ...l })),
    debtPayoff: { ...plan.debtPayoff },
    settledLineIds: settledLineIds.filter((id) => plan.lines.some((l) => l.id === id)),
  };
}

function validateLine(data: AppData, l: PlanLine): PlanLine {
  const name = l.name.trim();
  if (!name) throw new ValidationError('Give the budget line a name.');
  if (name.length > 60) throw new ValidationError('Line name is too long (60 characters max).');
  if (!BUCKETS.includes(l.bucket)) throw new ValidationError('Pick a bucket for this line.');
  if (!LINE_TYPES.includes(l.type)) throw new ValidationError('Pick a line type.');
  if (!Number.isSafeInteger(l.amountCents) || l.amountCents < 0) throw new ValidationError('Planned amount must be $0 or more.');
  if (l.amountCents > 100_000_000) throw new ValidationError('That amount looks too large.');
  if (l.type === 'contribution' && l.bucket !== 'investing' && l.bucket !== 'goals') {
    throw new ValidationError('Savings, investing and debt payoff lines belong in Investing or Goals.');
  }
  const categoryId = l.type === 'contribution' ? null : l.categoryId || null;
  if (categoryId && !data.categories.some((c) => c.id === categoryId)) throw new ValidationError('That category was not found.');
  const goal = l.goal && GOALS.includes(l.goal) && l.type === 'contribution' ? l.goal : null;
  return { id: l.id || newId(), name, bucket: l.bucket, amountCents: l.amountCents, type: l.type, categoryId, goal };
}

function validateLines(data: AppData, lines: PlanLine[]): PlanLine[] {
  const clean = lines.map((l) => validateLine(data, l));
  const ids = new Set<string>();
  const claimed = new Map<string, string>();
  for (const l of clean) {
    if (ids.has(l.id)) throw new ValidationError('Two budget lines share an id.');
    ids.add(l.id);
    if (l.type === 'spending' && l.categoryId) {
      const other = claimed.get(l.categoryId);
      if (other) {
        const cat = data.categories.find((c) => c.id === l.categoryId)?.name ?? 'that category';
        throw new ValidationError(`"${other}" already tracks all ${cat} spending. Link this line to a different category, or none.`);
      }
      claimed.set(l.categoryId, l.name);
    }
  }
  return clean;
}

export function validatePercents(p: BudgetPlan['percents']): void {
  for (const b of BUCKETS) if (!Number.isSafeInteger(p[b]) || p[b] < 0) throw new ValidationError(`${BUCKET_LABELS[b]} percentage is not valid.`);
  const total = percentTotal(p);
  if (total !== 10000) {
    throw new ValidationError(`Your percentages add up to ${(total / 100).toFixed(2).replace(/\.00$/, '')}%. They need to total exactly 100%.`);
  }
}

/** Re-snapshot paychecks dated after today so upcoming budgets follow the plan. */
function refreshFuture(data: AppData, today: ISODate): Paycheck[] {
  return data.paychecks.map((p) => (p.date > today ? { ...p, ...legacyFields(p.amountCents, snapshotPlan(data.budget, p.plan.settledLineIds)) } : p));
}

/**
 * Older readers expect bills/debt/savings/investing reserved + an allowance.
 * For budget paychecks they are derived from the bucket targets.
 */
function legacyFields(amountCents: number, plan: PaycheckPlan): Pick<Paycheck, 'plan' | 'reserved' | 'allowanceCents'> {
  const t = allocate(amountCents, plan.percents);
  const redirect = redirectAmount(plan, t);
  return { plan, reserved: { bills: t.needs, debt: redirect, savings: t.goals, investing: t.investing - redirect }, allowanceCents: t.fun };
}

export function updatePlan(data: AppData, patch: Partial<BudgetPlan>, today: ISODate): AppData {
  const next: BudgetPlan = { ...data.budget, ...patch };
  validatePercents(next.percents);
  if (!Number.isSafeInteger(next.baselineCents) || next.baselineCents <= 0) throw new ValidationError('Enter your usual take-home paycheck.');
  next.lines = validateLines(data, next.lines);
  const out = { ...data, budget: next };
  return { ...out, paychecks: refreshFuture(out, today) };
}

export function savePlanLine(data: AppData, line: PlanLine, today: ISODate): AppData {
  const exists = data.budget.lines.some((l) => l.id === line.id);
  const lines = exists ? data.budget.lines.map((l) => (l.id === line.id ? line : l)) : [...data.budget.lines, { ...line, id: line.id || newId() }];
  return updatePlan(data, { lines }, today);
}

/** Removes a line from the plan. Past paychecks keep it; entries linked to it are untouched. */
export function removePlanLine(data: AppData, id: string, today: ISODate): AppData {
  return updatePlan(data, { lines: data.budget.lines.filter((l) => l.id !== id) }, today);
}

/** Explicitly bring one paycheck's budget up to date with the current plan. */
export function applyPlanToPaycheck(data: AppData, paycheckId: string): AppData {
  return {
    ...data,
    paychecks: data.paychecks.map((p) => (p.id === paycheckId ? { ...p, ...legacyFields(p.amountCents, snapshotPlan(data.budget, p.plan.settledLineIds)) } : p)),
  };
}

/**
 * Turn Debt Payoff Mode on/off. Changes the plan and every paycheck whose
 * period hasn't ended yet. Ended periods keep the mode they had. No entries
 * are created or changed.
 */
export function setDebtMode(data: AppData, patch: Partial<DebtPayoff>, today: ISODate): AppData {
  const debtPayoff: DebtPayoff = { ...data.budget.debtPayoff, ...patch };
  if (debtPayoff.redirectCents !== null && (!Number.isSafeInteger(debtPayoff.redirectCents) || debtPayoff.redirectCents < 0)) {
    throw new ValidationError('Redirect amount must be $0 or more.');
  }
  if (debtPayoff.debtId && !data.debts.some((d) => d.id === debtPayoff.debtId)) throw new ValidationError('That debt was not found.');
  const budget = { ...data.budget, debtPayoff };
  return {
    ...data,
    budget,
    paychecks: data.paychecks.map((p) =>
      p.periodEnd >= today ? { ...p, ...legacyFields(p.amountCents, { ...p.plan, debtPayoff: { ...debtPayoff } }) } : p,
    ),
  };
}

// ---------- paychecks ----------

export interface PaycheckInput {
  date: ISODate;
  amountCents: number;
  periodStart: ISODate;
  periodEnd: ISODate;
  overtimeCents: number;
  notes: string;
}

export function validatePaycheckInput(data: AppData, input: PaycheckInput, id?: string): { overlaps: Paycheck | null } {
  if (!isISODate(input.date)) throw new ValidationError('Pick the pay date.');
  if (!Number.isSafeInteger(input.amountCents) || input.amountCents <= 0) throw new ValidationError('Enter the net (take-home) paycheck amount.');
  if (input.amountCents > 100_000_000) throw new ValidationError('That amount looks too large.');
  if (!isISODate(input.periodStart) || !isISODate(input.periodEnd)) throw new ValidationError('Pick the pay period start and end.');
  if (input.periodEnd < input.periodStart) throw new ValidationError('The pay period must end on or after it starts.');
  if (!Number.isSafeInteger(input.overtimeCents) || input.overtimeCents < 0) throw new ValidationError('Overtime must be $0 or more.');
  if (input.overtimeCents > input.amountCents) throw new ValidationError('Overtime is part of your net pay, so it can\'t be more than the paycheck.');
  const overlaps =
    data.paychecks.find((p) => p.id !== id && p.periodStart <= input.periodEnd && p.periodEnd >= input.periodStart) ?? null;
  return { overlaps };
}

/**
 * Add or edit a paycheck. New paychecks copy the current plan; edits keep the
 * paycheck's own plan (so changing the amount re-splits by its own %).
 * `trimPrevious` shortens an earlier overlapping period to end the day before.
 */
export function savePlanPaycheck(data: AppData, input: PaycheckInput, id?: string, opts: { trimPrevious?: boolean } = {}): { data: AppData; paycheck: Paycheck } {
  const { overlaps } = validatePaycheckInput(data, input, id);
  let paychecks = data.paychecks;
  if (overlaps) {
    const canTrim = opts.trimPrevious && overlaps.periodStart < input.periodStart && overlaps.periodEnd <= input.periodEnd;
    if (!canTrim) {
      throw new ValidationError(
        `This period overlaps your ${formatDay(overlaps.date)} paycheck (${formatDay(overlaps.periodStart)} – ${formatDay(overlaps.periodEnd)}). Adjust the dates so each day belongs to one paycheck.`,
      );
    }
    const end = addDays(input.periodStart, -1);
    paychecks = paychecks.map((p) => (p.id === overlaps.id ? { ...p, periodEnd: end, nextPayday: input.periodStart } : p));
    const still = paychecks.find((p) => p.id !== id && p.id !== overlaps.id && p.periodStart <= input.periodEnd && p.periodEnd >= input.periodStart);
    if (still) throw new ValidationError(`This period also overlaps your ${formatDay(still.date)} paycheck.`);
  }
  const existing = id ? data.paychecks.find((p) => p.id === id) : undefined;
  if (id && !existing) throw new ValidationError('That paycheck no longer exists.');
  const plan = existing?.plan ?? snapshotPlan(data.budget);
  const paycheck: Paycheck = {
    id: existing?.id ?? newId(),
    date: input.date,
    amountCents: input.amountCents,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    nextPayday: addDays(input.periodEnd, 1),
    overtimeCents: input.overtimeCents,
    notes: input.notes.trim().slice(0, 300),
    ...legacyFields(input.amountCents, plan),
  };
  paychecks = existing ? paychecks.map((p) => (p.id === paycheck.id ? paycheck : p)) : [...paychecks, paycheck];
  return { data: { ...data, paychecks }, paycheck };
}

export function setLineSettled(data: AppData, paycheckId: string, lineId: string, settled: boolean): AppData {
  return {
    ...data,
    paychecks: data.paychecks.map((p) => {
      if (p.id !== paycheckId) return p;
      const ids = p.plan.settledLineIds.filter((x) => x !== lineId);
      return { ...p, plan: { ...p.plan, settledLineIds: settled ? [...ids, lineId] : ids } };
    }),
  };
}

export interface LinePaymentInput {
  paycheckId: string;
  lineId: string;
  amountCents: number;
  date: ISODate;
  paymentMethod: string | null;
  paidInFull: boolean;
  debtId?: string | null;
  description?: string;
}

/**
 * Confirm an actual payment for a planned line. Creates exactly one entry:
 * an expense for bills/spending, savings for contributions, or a debt
 * payment for a debt-payoff line. The plan line itself is never "paid" by
 * planning alone.
 */
export function recordLinePayment(data: AppData, input: LinePaymentInput): { data: AppData; txn: Transaction } {
  const p = data.paychecks.find((x) => x.id === input.paycheckId);
  const line = p?.plan.lines.find((l) => l.id === input.lineId);
  if (!p || !line) throw new ValidationError('That budget line was not found.');
  const period = paycheckPeriod(p);
  if (input.date < period.start || input.date > period.end) {
    throw new ValidationError(`Pick a date in this pay period (${formatDay(period.start)} – ${formatDay(period.end)}).`);
  }
  const description = input.description?.trim() || line.name;
  const base = { description, amountCents: input.amountCents, date: input.date, paymentMethod: input.paymentMethod, planLineId: line.id };
  let res: { data: AppData; txn: Transaction };
  if (line.type === 'contribution' && line.goal === 'debt') {
    res = addTransaction(data, { ...base, kind: 'debt_payment', debtId: input.debtId ?? data.budget.debtPayoff.debtId });
  } else if (line.type === 'contribution') {
    res = addTransaction(data, { ...base, kind: 'savings', bucket: line.bucket });
  } else {
    const categoryId = line.categoryId ?? (line.bucket === 'needs' ? 'bills' : 'other');
    res = addTransaction(data, { ...base, kind: 'expense', categoryId: data.categories.some((c) => c.id === categoryId) ? categoryId : 'other' });
  }
  const out = line.type === 'bill' ? setLineSettled(res.data, p.id, line.id, input.paidInFull) : res.data;
  return { data: out, txn: res.txn };
}

// ---------- debts ----------

export type DebtDraft = Omit<Debt, 'id' | 'archived'> & { archived?: boolean };

export function saveDebt(data: AppData, draft: DebtDraft, id?: string): AppData {
  const name = draft.name.trim();
  if (!name) throw new ValidationError('Give the debt a name, like "Affirm" or "0% card".');
  if (!Number.isSafeInteger(draft.balanceCents) || draft.balanceCents < 0) throw new ValidationError('Balance must be $0 or more.');
  if (!isISODate(draft.asOf)) throw new ValidationError('Pick the date of that balance.');
  if (draft.payoffBy !== null && !isISODate(draft.payoffBy)) throw new ValidationError('Pick a valid payoff date.');
  const debt: Debt = {
    id: id ?? newId(),
    name: name.slice(0, 60),
    balanceCents: draft.balanceCents,
    asOf: draft.asOf,
    interestFree: draft.interestFree,
    payoffBy: draft.payoffBy,
    archived: draft.archived ?? false,
  };
  if (id) {
    if (!data.debts.some((d) => d.id === id)) throw new ValidationError('That debt no longer exists.');
    return { ...data, debts: data.debts.map((d) => (d.id === id ? debt : d)) };
  }
  return { ...data, debts: [...data.debts, debt] };
}

/** Deletes an unused debt; one with payments is archived so history stays correct. */
export function removeDebt(data: AppData, id: string): AppData {
  const used = data.transactions.some((t) => t.debtId === id);
  const debts = used ? data.debts.map((d) => (d.id === id ? { ...d, archived: true } : d)) : data.debts.filter((d) => d.id !== id);
  const budget = data.budget.debtPayoff.debtId === id ? { ...data.budget, debtPayoff: { ...data.budget.debtPayoff, debtId: null } } : data.budget;
  return { ...data, debts, budget };
}
