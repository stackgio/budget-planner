import { describe, expect, it } from 'vitest';
import { emptyData } from '../src/lib/defaults';
import { addTransaction, deleteTransaction, updateTransaction, ValidationError } from '../src/lib/ops';
import { totalSpent } from '../src/lib/ledger';
import { suggest } from '../src/lib/suggest';
import { mergeData, sanitizeData, toBackupJSON, toCSV, fromCSV } from '../src/lib/backup';
import { loadData, saveData, STORAGE_KEY, type KeyValueStore } from '../src/lib/storage';
import {
  allocate,
  budgetNotices,
  bucketActuals,
  currentPaycheck,
  debtRemaining,
  monthView,
  monthlyReport,
  parsePercent,
  paycheckView,
  planOverTargets,
  resolveTxn,
  reviewFor,
  suggestBudget,
} from '../src/lib/budget';
import {
  applyPlanToPaycheck,
  recordLinePayment,
  saveDebt,
  savePlanLine,
  savePlanPaycheck,
  setDebtMode,
  setLineSettled,
  updatePlan,
  type PaycheckInput,
} from '../src/lib/budgetOps';
import type { AppData } from '../src/lib/types';
import { BUCKETS } from '../src/lib/types';

const TODAY = '2026-10-23';

function pay(date: string, amountCents = 148200, extra: Partial<PaycheckInput> = {}): PaycheckInput {
  const end = new Date(Date.parse(date) + 13 * 86_400_000).toISOString().slice(0, 10);
  return { date, amountCents, periodStart: date, periodEnd: end, overtimeCents: 0, notes: '', ...extra };
}

function withPaycheck(data: AppData, date = '2026-10-16', amountCents = 148200, extra: Partial<PaycheckInput> = {}) {
  return savePlanPaycheck(data, pay(date, amountCents, extra));
}

function quickAdd(data: AppData, description: string, amountCents: number, date = TODAY, extra = {}) {
  const s = suggest(data, description);
  const b = suggestBudget(data, { kind: s.kind, description, categoryId: s.categoryId, date });
  return addTransaction(data, { kind: s.kind, description, amountCents, date, categoryId: s.categoryId, planLineId: b.planLineId, ...extra });
}

describe('1. $1,482 paycheck allocations', () => {
  it('splits 55/20/15/10 exactly in cents', () => {
    expect(allocate(148200, emptyData().budget.percents)).toEqual({ needs: 81510, investing: 29640, goals: 22230, fun: 14820 });
    const { data, paycheck } = withPaycheck(emptyData(TODAY));
    const v = paycheckView(data, paycheck);
    expect(v.totals.income).toBe(148200);
    expect(BUCKETS.map((b) => v.buckets[b].target)).toEqual([81510, 29640, 22230, 14820]);
    expect(BUCKETS.reduce((s, b) => s + v.buckets[b].target, 0)).toBe(148200);
  });

  it('never loses a cent on odd amounts and validates 100%', () => {
    for (const amt of [1, 99, 100001, 123457, 999999]) {
      const a = allocate(amt, { needs: 5500, investing: 2000, goals: 1500, fun: 1000 });
      expect(a.needs + a.investing + a.goals + a.fun).toBe(amt);
    }
    expect(() => allocate(100, { needs: 5000, investing: 2000, goals: 1500, fun: 1000 })).toThrow();
    expect(() => updatePlan(emptyData(), { percents: { needs: 5000, investing: 2000, goals: 1500, fun: 1000 } }, TODAY)).toThrow(/95%/);
    expect(parsePercent('55')).toBe(5500);
    expect(parsePercent('12.5%')).toBe(1250);
    expect(parsePercent('101')).toBeNull();
  });

  it('prepopulates the template without recording anything as paid', () => {
    const d = emptyData();
    expect(d.budget.baselineCents).toBe(148200);
    expect(d.budget.lines.find((l) => l.id === 'rent')!.amountCents).toBe(50000);
    expect(d.budget.lines.find((l) => l.id === 'phone-wifi')!.amountCents).toBe(8333);
    expect(d.transactions).toHaveLength(0);
    // Goals lines (200 + 25 + 25) exceed the 15% target ($222.30) — shown, not hidden.
    expect(planOverTargets(d.budget, 148200)).toEqual([{ bucket: 'goals', planned: 25000, target: 22230 }]);
    const { data, paycheck } = withPaycheck(d);
    const v = paycheckView(data, paycheck);
    expect(v.totals.spent).toBe(0);
    expect(v.buckets.needs.reserved).toBe(50000 + 8333 + 10000); // unpaid bills
  });
});

describe('2. eating out reduces Guilt-Free', () => {
  it("McDonald's $14.50 → Eating Out, Guilt-Free, 148.20 → 133.70", () => {
    let { data, paycheck } = withPaycheck(emptyData(TODAY));
    const res = quickAdd(data, "McDonald's", 1450);
    data = res.data;
    expect(res.txn.categoryId).toBe('eating-out');
    expect(resolveTxn(data, res.txn)!.bucket).toBe('fun');
    const v = paycheckView(data, paycheck);
    expect(v.buckets.fun.spent).toBe(1450);
    expect(v.buckets.fun.remaining).toBe(13370);
    expect(data.transactions).toHaveLength(1);
    // Re-classifying moves it, never counts it twice.
    data = updateTransaction(data, res.txn.id, { ...res.txn, bucket: 'needs' });
    const v2 = paycheckView(data, paycheck);
    expect(v2.buckets.fun.spent).toBe(0);
    expect(v2.buckets.needs.spent).toBe(1450);
    expect(v2.totals.spent).toBe(1450);
  });
});

describe('3. internal transfers', () => {
  it('a $300 transfer to Bills Checking with set-asides is not spending', () => {
    let { data, paycheck } = withPaycheck(emptyData(TODAY));
    data = addTransaction(data, {
      kind: 'transfer', description: 'To Bills Checking', amountCents: 30000, date: TODAY,
      transfer: {
        fromAccount: 'Main Checking', toAccount: 'Bills Checking',
        allocations: [
          { label: 'Capital One', amountCents: 10000, planLineId: null },
          { label: 'Household bills', amountCents: 10000, planLineId: 'phone-wifi' },
          { label: 'American Express', amountCents: 10000, planLineId: null },
        ],
      },
    }).data;
    const v = paycheckView(data, paycheck);
    expect(v.totals.spent).toBe(0);
    expect(v.totals.remaining).toBe(148200 - v.totals.reserved);
    expect(totalSpent(data, { start: TODAY, end: TODAY })).toBe(0);
    // The earmark is shown on the bill, but it is still reserved until paid.
    const phone = v.buckets.needs.lines.find((l) => l.line.id === 'phone-wifi')!;
    expect(phone.funded).toBe(10000);
    expect(phone.reserved).toBe(8333);
    expect(() => addTransaction(data, { kind: 'transfer', description: 'x', amountCents: 100, date: TODAY, transfer: { fromAccount: '', toAccount: '', allocations: [{ label: 'a', amountCents: 200, planLineId: null }] } })).toThrow(ValidationError);
  });
});

describe('4. credit cards', () => {
  it('counts the purchase once; the card payment is not spending', () => {
    let { data, paycheck } = withPaycheck(emptyData(TODAY));
    data = addTransaction(data, { kind: 'expense', description: 'Target', amountCents: 5000, date: TODAY, categoryId: 'shopping', paymentMethod: 'Credit card' }).data;
    data = addTransaction(data, { kind: 'cc_payment', description: 'Capital One payment', amountCents: 5000, date: TODAY }).data;
    const v = paycheckView(data, paycheck);
    expect(v.totals.spent).toBe(5000);
    expect(v.totals.debtPaid).toBe(0);
    expect(v.buckets.fun.spent).toBe(5000);
  });

  it('a bill is reserved until paid, then spent — never both', () => {
    let { data, paycheck: first } = withPaycheck(emptyData(TODAY));
    const view = () => paycheckView(data, data.paychecks.find((p) => p.id === first.id)!);
    const paycheck = first;
    let rent = paycheckView(data, paycheck).buckets.needs.lines.find((l) => l.line.id === 'rent')!;
    expect([rent.actual, rent.reserved]).toEqual([0, 50000]);
    data = recordLinePayment(data, { paycheckId: paycheck.id, lineId: 'rent', amountCents: 50000, date: TODAY, paymentMethod: 'Credit card', paidInFull: true }).data;
    let needs = paycheckView(data, paycheck).buckets.needs;
    rent = needs.lines.find((l) => l.line.id === 'rent')!;
    expect([rent.actual, rent.reserved]).toEqual([50000, 0]);
    expect(needs.spent).toBe(50000);
    // Paying the card that carried the rent adds nothing.
    data = addTransaction(data, { kind: 'cc_payment', description: 'Card payment', amountCents: 50000, date: TODAY }).data;
    expect(paycheckView(data, paycheck).buckets.needs.spent).toBe(50000);
    // Phone bill came in lower and is paid in full: nothing left reserved.
    data = recordLinePayment(data, { paycheckId: paycheck.id, lineId: 'phone-wifi', amountCents: 8000, date: TODAY, paymentMethod: null, paidInFull: true }).data;
    needs = view().buckets.needs;
    expect(needs.lines.find((l) => l.line.id === 'phone-wifi')!.reserved).toBe(0);
    expect(needs.reserved).toBe(10000); // only the car payment
    expect(needs.remaining).toBe(81510 - 58000 - 10000);
    data = setLineSettled(data, paycheck.id, 'phone-wifi', false);
    expect(view().buckets.needs.lines.find((l) => l.line.id === 'phone-wifi')!.reserved).toBe(333);
  });
});

describe('5. changing percentages', () => {
  it('recalculates upcoming paychecks and keeps past ones', () => {
    let data = withPaycheck(emptyData(TODAY), '2026-10-02').data;
    data = withPaycheck(data, '2026-10-16').data;
    data = withPaycheck(data, '2026-10-30').data; // upcoming (after today)
    data = updatePlan(data, { percents: { needs: 5000, investing: 2500, goals: 1500, fun: 1000 } }, TODAY);
    const [past, current, future] = [...data.paychecks].sort((a, b) => a.date.localeCompare(b.date));
    expect(paycheckView(data, past).buckets.needs.target).toBe(81510);
    expect(paycheckView(data, current).buckets.needs.target).toBe(81510); // current only on request
    expect(paycheckView(data, future).buckets.needs.target).toBe(74100);
    expect(paycheckView(data, future).buckets.investing.target).toBe(37050);
    data = applyPlanToPaycheck(data, current.id);
    expect(paycheckView(data, data.paychecks.find((p) => p.id === current.id)!).buckets.needs.target).toBe(74100);
    expect(paycheckView(data, data.paychecks.find((p) => p.id === past.id)!).buckets.needs.target).toBe(81510);
    // A new paycheck uses the new split.
    const added = savePlanPaycheck(data, pay('2026-11-13')).paycheck;
    expect(added.plan.percents.needs).toBe(5000);
  });

  it('editing a line updates upcoming paychecks only', () => {
    let data = withPaycheck(emptyData(TODAY), '2026-10-16').data;
    data = withPaycheck(data, '2026-10-30').data;
    const groceries = { ...data.budget.lines.find((l) => l.id === 'groceries')!, amountCents: 12000 };
    data = savePlanLine(data, groceries, TODAY);
    const [cur, next] = [...data.paychecks].sort((a, b) => a.date.localeCompare(b.date));
    expect(cur.plan.lines.find((l) => l.id === 'groceries')!.amountCents).toBe(0);
    expect(next.plan.lines.find((l) => l.id === 'groceries')!.amountCents).toBe(12000);
    expect(() => savePlanLine(data, { id: '', name: 'Food', bucket: 'needs', amountCents: 100, type: 'spending', categoryId: 'groceries', goal: null }, TODAY)).toThrow(/already tracks/);
  });
});

describe('6. Debt Payoff Mode', () => {
  it('redirects planned investing without inventing transactions, and reverses cleanly', () => {
    let data = withPaycheck(emptyData(TODAY), '2026-10-02').data; // ended period
    data = withPaycheck(data, '2026-10-16').data; // current
    data = saveDebt(data, { name: '0% card', balanceCents: 300000, asOf: '2026-10-01', interestFree: true, payoffBy: '2026-12-31' });
    const debt = data.debts[0];
    const before = data.transactions.length;
    data = setDebtMode(data, { enabled: true, debtId: debt.id }, TODAY);
    expect(data.transactions.length).toBe(before);
    const [ended, cur] = [...data.paychecks].sort((a, b) => a.date.localeCompare(b.date));
    expect(ended.plan.debtPayoff.enabled).toBe(false); // history untouched
    let v = paycheckView(data, cur);
    expect(v.buckets.investing.target).toBe(29640); // long-term target stays visible
    expect(v.buckets.investing.redirectOut).toBe(29640);
    expect(v.buckets.goals.redirectIn).toBe(29640);
    expect(v.buckets.investing.contributed).toBe(0);
    expect(v.buckets.investing.remaining).toBe(0);
    expect(v.totals.remaining).toBe(148200 - v.totals.reserved); // nothing spent or saved

    // A real debt payment: not spending, lowers the balance.
    data = addTransaction(data, { kind: 'debt_payment', description: 'Pay down 0% card', amountCents: 29640, date: TODAY, debtId: debt.id }).data;
    v = paycheckView(data, cur);
    expect(v.totals.spent).toBe(0);
    expect(v.totals.debtPaid).toBe(29640);
    expect(v.buckets.goals.debtPaid).toBe(29640);
    expect(debtRemaining(data, debt)).toBe(300000 - 29640);

    // Partial redirect.
    data = setDebtMode(data, { redirectCents: 10000 }, TODAY);
    v = paycheckView(data, data.paychecks.find((p) => p.id === cur.id)!);
    expect(v.buckets.investing.redirectOut).toBe(10000);
    // Back to normal: no fake investing contributions appear.
    data = setDebtMode(data, { enabled: false }, TODAY);
    v = paycheckView(data, data.paychecks.find((p) => p.id === cur.id)!);
    expect(v.buckets.investing.redirectOut).toBe(0);
    expect(v.buckets.investing.contributed).toBe(0);
    expect(v.totals.debtPaid).toBe(29640);
  });
});

describe('7. extra and irregular paychecks', () => {
  it('a three-paycheck month shows three paychecks of income', () => {
    let data = emptyData(TODAY);
    for (const d of ['2026-10-02', '2026-10-16', '2026-10-30', '2026-11-13']) data = withPaycheck(data, d).data;
    const oct = monthView(data, '2026-10');
    expect(oct.paychecks).toHaveLength(3);
    expect(oct.totals.income).toBe(3 * 148200);
    expect(oct.buckets.fun.target).toBe(3 * 14820);
    expect(monthView(data, '2026-11').totals.income).toBe(148200);
  });

  it('handles irregular amounts, overtime (no double count) and overlap', () => {
    let data = withPaycheck(emptyData(TODAY), '2026-10-16', 161800, { overtimeCents: 13600 }).data;
    const p = data.paychecks[0];
    const v = paycheckView(data, p);
    expect(v.totals.income).toBe(161800);
    expect(v.totals.overtime).toBe(13600);
    expect(v.buckets.needs.target).toBe(88990);
    expect(() => withPaycheck(data, '2026-10-20')).toThrow(/overlaps/);
    // An early paycheck can trim the previous period on request.
    data = savePlanPaycheck(data, pay('2026-10-27'), undefined, { trimPrevious: true }).data;
    expect(data.paychecks.find((x) => x.id === p.id)!.periodEnd).toBe('2026-10-26');
    expect(() => withPaycheck(emptyData(), '2026-10-16', 1000, { overtimeCents: 2000 })).toThrow(/Overtime/);
  });
});

describe('8. monthly totals reconcile with pay periods', () => {
  it('month actuals equal the sum of the in-month parts of each period', () => {
    let data = emptyData(TODAY);
    for (const d of ['2026-09-18', '2026-10-02', '2026-10-16', '2026-10-30']) data = withPaycheck(data, d).data;
    const entries: Array<[string, number, string]> = [
      ["McDonald's", 1450, '2026-09-30'], ['Groceries', 6320, '2026-10-01'], ['Gas', 4000, '2026-10-05'],
      ['Chipotle', 1275, '2026-10-17'], ['Rent', 50000, '2026-10-20'], ['Coffee', 650, '2026-10-31'], ['Amazon', 2499, '2026-11-02'],
    ];
    for (const [d, a, date] of entries) data = quickAdd(data, d, a, date).data;
    data = addTransaction(data, { kind: 'savings', description: 'Emergency savings', amountCents: 20000, date: '2026-10-03', planLineId: 'emergency' }).data;
    data = addTransaction(data, { kind: 'savings', description: 'Roth IRA', amountCents: 10000, date: '2026-10-29', bucket: 'investing' }).data;

    const rep = monthlyReport(data, '2026-10');
    const sum = (k: 'spent' | 'contributed' | 'debtPaid') => rep.periods.reduce((s, p) => s + p[k], 0) + rep.uncovered[k];
    expect(sum('spent')).toBe(rep.view.totals.spent);
    expect(sum('contributed')).toBe(rep.view.totals.contributed);
    expect(rep.view.totals.spent).toBe(6320 + 4000 + 1275 + 50000 + 650);
    expect(rep.view.totals.income).toBe(3 * 148200);
    expect(rep.periods.map((p) => p.inMonth)).toEqual([
      { start: '2026-10-01', end: '2026-10-01' },
      { start: '2026-10-02', end: '2026-10-15' },
      { start: '2026-10-16', end: '2026-10-29' },
      { start: '2026-10-30', end: '2026-10-31' },
    ]);
    // Per-bucket: the month equals the sum of each period clipped to the month.
    const month = bucketActuals(data, rep.view.range);
    for (const b of BUCKETS) {
      const parts = rep.periods.reduce((s, p) => s + bucketActuals(data, p.inMonth)[b].spent, 0);
      expect(parts).toBe(month[b].spent);
    }
    // Across the whole covered span, periods and months agree.
    const periodsTotal = data.paychecks.reduce((s, p) => s + paycheckView(data, p).totals.spent, 0);
    const monthsTotal = ['2026-09', '2026-10', '2026-11'].reduce((s, k) => s + monthView(data, k).totals.spent, 0);
    expect(periodsTotal).toBe(monthsTotal);
  });
});

describe('9. editing an expense updates every report', () => {
  it('edit and delete flow through dashboard, review and monthly report', () => {
    let { data, paycheck } = withPaycheck(emptyData(TODAY));
    const { data: d1, txn } = quickAdd(data, "McDonald's", 1450);
    data = d1;
    expect(reviewFor(data, paycheckView(data, paycheck)).biggest!.spent).toBe(1450);
    data = updateTransaction(data, txn.id, { ...txn, amountCents: 1250 });
    const v = paycheckView(data, paycheck);
    expect(v.buckets.fun.remaining).toBe(14820 - 1250);
    expect(reviewFor(data, v).byCategory[0].spent).toBe(1250);
    expect(monthlyReport(data, '2026-10').view.buckets.fun.spent).toBe(1250);
    data = updateTransaction(data, txn.id, { ...txn, amountCents: 1250, categoryId: 'groceries' });
    expect(paycheckView(data, paycheck).buckets.needs.spent).toBe(1250);
    expect(paycheckView(data, paycheck).buckets.fun.spent).toBe(0);
    data = deleteTransaction(data, txn.id);
    expect(paycheckView(data, paycheck).totals.spent).toBe(0);
  });
});

describe('10. existing expense tracker data stays intact', () => {
  const v1 = {
    schemaVersion: 1,
    transactions: [
      { id: '11111111-1111-4111-8111-111111111111', kind: 'expense', description: "McDonald's", amountCents: 1450, date: '2026-10-20', categoryId: 'eating-out', paymentMethod: 'Credit card', needWant: 'want', notes: '', refundOf: null, createdAt: '2026-10-20T12:00:00.000Z', updatedAt: '2026-10-20T12:00:00.000Z', deletedAt: null },
      { id: '22222222-2222-4222-8222-222222222222', kind: 'cc_payment', description: 'Card bill', amountCents: 1450, date: '2026-10-21', categoryId: null, paymentMethod: null, needWant: null, notes: '', refundOf: null, createdAt: '2026-10-21T12:00:00.000Z', updatedAt: '2026-10-21T12:00:00.000Z', deletedAt: null },
      { id: '33333333-3333-4333-8333-333333333333', kind: 'savings', description: 'To savings', amountCents: 5000, date: '2026-10-21', categoryId: null, paymentMethod: null, needWant: null, notes: 'hi', refundOf: null, createdAt: '2026-10-21T12:00:00.000Z', updatedAt: '2026-10-21T12:00:00.000Z', deletedAt: null },
    ],
    categories: [
      { id: 'eating-out', name: 'Eating Out', emoji: '🍔', budgetCents: 4000, archived: false },
      { id: 'other', name: 'Other', emoji: '📦', budgetCents: null, archived: false },
      { id: 'pets', name: 'Pets', emoji: '🐶', budgetCents: null, archived: false },
    ],
    paychecks: [{ id: 'p1', date: '2026-10-16', amountCents: 200000, reserved: { bills: 90000, debt: 0, savings: 0, investing: 0 }, allowanceCents: 50000, nextPayday: '2026-10-30', notes: '' }],
    settings: { budgetMode: 'paycheck', customBudgetCents: 0, biweeklyAnchor: '2026-10-01', categoryBudgetPeriod: 'month', weekStartsOn: 1, paymentMethods: ['Cash'], smallPurchaseCents: 1000 },
  };

  it('loads a schema-1 save without losing or changing records', () => {
    const map = new Map<string, string>([[STORAGE_KEY, JSON.stringify(v1)]]);
    const store: KeyValueStore = { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
    const { data } = loadData(store);
    expect(data.transactions).toHaveLength(3);
    for (const orig of v1.transactions) {
      const t = data.transactions.find((x) => x.id === orig.id)!;
      expect({ ...t, bucket: undefined, planLineId: undefined, debtId: undefined, transfer: undefined }).toEqual({ ...orig, bucket: undefined, planLineId: undefined, debtId: undefined, transfer: undefined });
      expect([t.bucket, t.planLineId, t.debtId, t.transfer]).toEqual([null, null, null, null]);
    }
    expect(data.categories.map((c) => [c.id, c.budgetCents])).toEqual([['eating-out', 4000], ['other', null], ['pets', null]]);
    expect(data.categories.find((c) => c.id === 'eating-out')!.bucket).toBe('fun');
    const p = data.paychecks[0];
    expect([p.amountCents, p.allowanceCents, p.reserved.bills, p.periodStart, p.periodEnd]).toEqual([200000, 50000, 90000, '2026-10-16', '2026-10-29']);
    expect(p.plan.percents).toEqual({ needs: 5500, investing: 2000, goals: 1500, fun: 1000 });
    expect(totalSpent(data, { start: '2026-10-01', end: '2026-10-31' })).toBe(1450);
    const v = paycheckView(data, p);
    expect(v.totals.spent).toBe(1450);
    expect(v.buckets.goals.contributed).toBe(5000); // old savings count as goal contributions, not spending

    // Saving and reloading is stable — the migration happens once.
    saveData(store, data);
    expect(loadData(store).data).toEqual(data);
  });

  it('backups round-trip the budget, and merging never overwrites your plan', () => {
    let { data } = withPaycheck(emptyData(TODAY));
    data = saveDebt(data, { name: 'Affirm', balanceCents: 50000, asOf: TODAY, interestFree: true, payoffBy: null });
    data = quickAdd(data, "McDonald's", 1450).data;
    data = updatePlan(data, { baselineCents: 150000 }, TODAY);
    const parsed = sanitizeData(JSON.parse(toBackupJSON(data))).data;
    expect(parsed).toEqual(data);
    expect(mergeData(data, parsed).added).toBe(0);
    const other = updatePlan(emptyData(), { baselineCents: 99900 }, TODAY);
    expect(mergeData(data, other).data.budget.baselineCents).toBe(150000);
    expect(mergeData(emptyData(), parsed).data.budget.baselineCents).toBe(150000);
    const csv = toCSV(data);
    expect(csv.split('\n')[0]).toContain('bucket,plan_line_id,debt_id');
    expect(mergeData(data, fromCSV(csv, data).data).added).toBe(0);
  });
});

describe('notices and reviews', () => {
  it('warns from recorded data, calmly and briefly', () => {
    let { data } = withPaycheck(emptyData(TODAY));
    let ids = budgetNotices(data, TODAY).map((n) => n.id);
    expect(ids).toContain('plan-goals');
    expect(ids).not.toContain('fun-near');
    data = quickAdd(data, 'Concert tickets', 12000).data; // 81% of 148.20
    const fun = budgetNotices(data, TODAY).find((n) => n.id === 'fun-near')!;
    expect(fun.text).toBe("You've used 80% of your Guilt-Free budget — $28.20 left.");
    data = savePlanLine(data, { id: 'eat', name: 'Eating Out', bucket: 'fun', amountCents: 17500, type: 'spending', categoryId: 'eating-out', goal: null }, TODAY);
    data = applyPlanToPaycheck(data, data.paychecks[0].id);
    data = quickAdd(data, 'Chipotle', 14000).data;
    expect(budgetNotices(data, TODAY, 10).map((n) => n.text)).toContain('You have $35.00 remaining for Eating Out.');
    expect(budgetNotices(data, TODAY).length).toBeLessThanOrEqual(4);
    ids = budgetNotices(data, '2026-11-02').map((n) => n.id);
    expect(ids).toContain('stale');
    expect(currentPaycheck(data, '2026-11-02')!.stale).toBe(true);
  });

  it('reviews contain only recorded data', () => {
    let { data, paycheck } = withPaycheck(emptyData(TODAY));
    let r = reviewFor(data, paycheckView(data, paycheck));
    expect(r.hasData).toBe(false);
    expect(r.recommendations).toEqual([]);
    for (const day of ['2026-10-17', '2026-10-19', '2026-10-21']) data = quickAdd(data, "McDonald's", 1200, day).data;
    data = quickAdd(data, 'Gas', 6500, '2026-10-18').data;
    r = reviewFor(data, paycheckView(data, paycheck));
    expect(r.biggest!.name).toBe('Gas');
    expect(r.overspent).toEqual([{ label: 'Gas', planned: 5000, actual: 6500 }]);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeLessThanOrEqual(2);
    expect(r.recommendations[0]).toContain('Eating Out was your biggest Guilt-Free category: $36.00 over 3 purchases');
  });

  it('suggests budget lines by name and category', () => {
    const { data } = withPaycheck(emptyData(TODAY));
    expect(suggestBudget(data, { kind: 'expense', description: 'Rent', categoryId: 'bills', date: TODAY })).toEqual({ bucket: 'needs', planLineId: 'rent' });
    expect(suggestBudget(data, { kind: 'expense', description: 'Haircut', categoryId: 'personal-care', date: TODAY }).planLineId).toBe('haircut');
    expect(suggestBudget(data, { kind: 'expense', description: 'Shell', categoryId: 'gas', date: TODAY }).planLineId).toBe('gas');
    expect(suggestBudget(data, { kind: 'savings', description: 'Travel savings', categoryId: null, date: TODAY })).toEqual({ bucket: 'goals', planLineId: 'travel' });
    expect(suggestBudget(data, { kind: 'savings', description: 'Roth IRA', categoryId: null, date: TODAY }).bucket).toBe('investing');
    expect(suggest(data, 'Debt payoff').kind).toBe('debt_payment');
  });
});
