import { describe, expect, it } from 'vitest';
import { emptyData } from '../src/lib/defaults';
import { addTransaction, deleteTransaction, restoreTransaction, savePaycheck, updateCategory, updateTransaction, ValidationError, purgeTransaction } from '../src/lib/ops';
import { budgetStatus, categoryBudgets, budgetWarningText, findDuplicate, monthRange, totalSpent, totalSaved, weekRange, activeTransactions } from '../src/lib/ledger';
import { suggest } from '../src/lib/suggest';
import { fromCSV, mergeData, sanitizeData, toBackupJSON, toCSV } from '../src/lib/backup';
import { loadData, saveData, type KeyValueStore, STORAGE_KEY } from '../src/lib/storage';
import { formatCents, parseCents } from '../src/lib/money';
import type { AppData } from '../src/lib/types';
import { buildInsights, savingsFromReduction, weeklyRecommendation } from '../src/lib/insights';

const TODAY = '2026-10-23'; // a Friday

function memoryStore(): KeyValueStore & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v) };
}

function quickAdd(data: AppData, description: string, amount: string, date = TODAY) {
  const s = suggest(data, description);
  return addTransaction(data, { kind: s.kind, description, amountCents: parseCents(amount)!, date, categoryId: s.categoryId });
}

const today = { start: TODAY, end: TODAY };
const month = monthRange(TODAY);

describe('money parsing', () => {
  it('parses to integer cents without float error', () => {
    expect(parseCents('14.50')).toBe(1450);
    expect(parseCents('$1,234.5')).toBe(123450);
    expect(parseCents('0.1')).toBe(10);
    expect(parseCents('35')).toBe(3500);
    expect(parseCents('1.234')).toBeNull();
    expect(parseCents('abc')).toBeNull();
    expect(parseCents('')).toBeNull();
  });
});

describe('category suggestions', () => {
  it.each([
    ["McDonald's", 'eating-out'],
    ['Walmart groceries', 'groceries'],
    ['Gas', 'gas'],
    ['Haircut', 'personal-care'],
    ['Amazon', 'shopping'],
    ['Coffee', 'snacks-drinks'],
    ['Netflix', 'subscriptions'],
  ])('%s → %s', (desc, cat) => {
    expect(suggest(emptyData(), desc).categoryId).toBe(cat);
  });

  it('learns from corrections in history', () => {
    let data = emptyData();
    data = addTransaction(data, { kind: 'expense', description: 'Walmart', amountCents: 5000, date: TODAY, categoryId: 'groceries' }).data;
    expect(suggest(data, 'walmart').categoryId).toBe('groceries');
    expect(suggest(data, 'Walmart').source).toBe('history');
  });

  it('suggests non-spending kinds', () => {
    expect(suggest(emptyData(), 'Credit card payment').kind).toBe('cc_payment');
    expect(suggest(emptyData(), 'Transfer to savings').kind).toBe('savings');
    expect(suggest(emptyData(), 'Money for uncle').kind).toBe('uncle');
  });
});

describe('1-3. add, totals, edit', () => {
  it("adds $14.50 McDonald's to Eating Out with today's date and updates totals, then edits to $12.50", () => {
    let data = emptyData(TODAY);
    const res = quickAdd(data, "McDonald's", '14.50');
    data = res.data;
    expect(res.txn.categoryId).toBe('eating-out');
    expect(res.txn.date).toBe(TODAY);
    expect(res.txn.amountCents).toBe(1450);

    expect(totalSpent(data, today)).toBe(1450);
    expect(totalSpent(data, month)).toBe(1450);
    expect(totalSpent(data, weekRange(TODAY, 1))).toBe(1450);

    data = quickAdd(data, 'Coffee', '6.50').data;
    expect(totalSpent(data, today)).toBe(2100);
    // yesterday's entry counts for month, not today
    data = quickAdd(data, 'Gas', '35', '2026-10-22').data;
    expect(totalSpent(data, today)).toBe(2100);
    expect(totalSpent(data, month)).toBe(5600);

    data = updateTransaction(data, res.txn.id, { ...res.txn, amountCents: parseCents('12.50')! });
    expect(totalSpent(data, today)).toBe(1900);
    expect(totalSpent(data, month)).toBe(5400);
    expect(data.transactions.find((t) => t.id === res.txn.id)!.createdAt).toBe(res.txn.createdAt);
  });

  it('rejects invalid entries', () => {
    const data = emptyData();
    expect(() => addTransaction(data, { kind: 'expense', description: '', amountCents: 100, date: TODAY })).toThrow(ValidationError);
    expect(() => addTransaction(data, { kind: 'expense', description: 'x', amountCents: 0, date: TODAY })).toThrow(ValidationError);
    expect(() => addTransaction(data, { kind: 'expense', description: 'x', amountCents: 10.5, date: TODAY })).toThrow(ValidationError);
  });
});

describe('4. delete and restore', () => {
  it('soft-deletes with restore, and purges permanently', () => {
    let data = emptyData();
    const { data: d1, txn } = quickAdd(data, 'Haircut', '30');
    data = deleteTransaction(d1, txn.id);
    expect(totalSpent(data, today)).toBe(0);
    expect(activeTransactions(data)).toHaveLength(0);
    data = restoreTransaction(data, txn.id);
    expect(totalSpent(data, today)).toBe(3000);
    data = purgeTransaction(deleteTransaction(data, txn.id), txn.id);
    expect(data.transactions).toHaveLength(0);
  });
});

describe('5. refunds', () => {
  it('reduces the related expense and its category; cannot exceed the purchase', () => {
    let data = emptyData();
    const { data: d1, txn } = quickAdd(data, 'Amazon', '24.99');
    data = addTransaction(d1, { kind: 'refund', description: 'Amazon refund', amountCents: 1000, date: TODAY, refundOf: txn.id }).data;
    expect(totalSpent(data, today)).toBe(1499);
    const refund = data.transactions.find((t) => t.kind === 'refund')!;
    expect(refund.categoryId).toBe('shopping');
    expect(() => addTransaction(data, { kind: 'refund', description: 'again', amountCents: 1500, date: TODAY, refundOf: txn.id })).toThrow(/can't be more/);

    // deleting the purchase also removes its refund; restoring brings both back
    data = deleteTransaction(data, txn.id);
    expect(totalSpent(data, today)).toBe(0);
    data = restoreTransaction(data, txn.id);
    expect(totalSpent(data, today)).toBe(1499);
  });
});

describe('6. biweekly spending budget', () => {
  it('uses only the allowance, not reserved money', () => {
    let data = emptyData();
    data = savePaycheck(data, {
      date: '2026-10-16',
      nextPayday: '2026-10-30',
      amountCents: 200000,
      reserved: { bills: 90000, debt: 20000, savings: 25000, investing: 15000 },
      allowanceCents: 50000,
      notes: '',
    });
    expect(() =>
      savePaycheck(data, { date: '2026-10-16', nextPayday: '2026-10-30', amountCents: 200000, reserved: { bills: 90000, debt: 20000, savings: 25000, investing: 15000 }, allowanceCents: 60000, notes: '' }),
    ).toThrow(/can't be more/);

    data = quickAdd(data, 'Groceries', '63.20', '2026-10-15').data; // before paycheck — not counted
    data = quickAdd(data, 'Walmart groceries', '63.20', '2026-10-17').data;
    data = quickAdd(data, "McDonald's", '14.50').data;
    data = addTransaction(data, { kind: 'savings', description: 'To savings', amountCents: 25000, date: TODAY }).data;

    const status = budgetStatus(data, TODAY)!;
    expect(status.period.range).toEqual({ start: '2026-10-16', end: '2026-10-29' });
    expect(status.spent).toBe(7770);
    expect(status.remaining).toBe(50000 - 7770);
    expect(status.daysLeft).toBe(7);
    expect(totalSaved(data, status.period.range)).toBe(25000);
  });

  it('supports a custom biweekly budget and a monthly budget', () => {
    let data = emptyData();
    data = { ...data, settings: { ...data.settings, budgetMode: 'biweekly', customBudgetCents: 40000, biweeklyAnchor: '2026-10-02' } };
    expect(budgetStatus(data, TODAY)!.period.range).toEqual({ start: '2026-10-16', end: '2026-10-29' });
    data = { ...data, settings: { ...data.settings, budgetMode: 'monthly', customBudgetCents: 90000 } };
    expect(budgetStatus(data, TODAY)!.period.range).toEqual({ start: '2026-10-01', end: '2026-10-31' });
  });
});

describe('7. category budget warnings', () => {
  it('warns at 80% and 100%', () => {
    let data = updateCategory(emptyData(), 'eating-out', { budgetCents: 10000 });
    data = quickAdd(data, 'Chipotle', '75').data;
    let row = categoryBudgets(data, TODAY).find((r) => r.category.id === 'eating-out')!;
    expect(row.level).toBe('ok');
    expect(row.remaining).toBe(2500);

    data = quickAdd(data, 'Pizza', '5').data; // 80%
    row = categoryBudgets(data, TODAY).find((r) => r.category.id === 'eating-out')!;
    expect(row.level).toBe('near');
    expect(budgetWarningText(row, formatCents)).toContain('80%');

    data = quickAdd(data, 'Burger', '25').data; // 105%
    row = categoryBudgets(data, TODAY).find((r) => r.category.id === 'eating-out')!;
    expect(row.level).toBe('over');
    expect(budgetWarningText(row, formatCents)).toContain('$5.00 over');
  });
});

describe('8. smart money rules', () => {
  it('does not double count a credit card payment, transfers, savings, or uncle money', () => {
    let data = emptyData();
    data = addTransaction(data, { kind: 'expense', description: 'Target', amountCents: 5000, date: TODAY, categoryId: 'shopping', paymentMethod: 'Credit card' }).data;
    data = addTransaction(data, { kind: 'cc_payment', description: 'Visa payment', amountCents: 5000, date: TODAY }).data;
    data = addTransaction(data, { kind: 'transfer', description: 'Checking to savings', amountCents: 10000, date: TODAY }).data;
    data = addTransaction(data, { kind: 'savings', description: 'Roth IRA', amountCents: 20000, date: TODAY }).data;
    data = addTransaction(data, { kind: 'uncle', description: "Uncle's groceries", amountCents: 8000, date: TODAY }).data;
    expect(totalSpent(data, today)).toBe(5000);
    expect(totalSaved(data, today)).toBe(20000);
    expect(data.transactions.find((t) => t.kind === 'uncle')!.categoryId).toBeNull();
  });

  it('detects duplicates', () => {
    const { data } = quickAdd(emptyData(), 'Coffee', '6.50');
    expect(findDuplicate(data, { kind: 'expense', description: 'coffee', amountCents: 650, date: TODAY })).not.toBeNull();
    expect(findDuplicate(data, { kind: 'expense', description: 'coffee', amountCents: 700, date: TODAY })).toBeNull();
  });
});

describe('9. export and import', () => {
  function sample() {
    let data = emptyData();
    data = quickAdd(data, "McDonald's", '14.50').data;
    data = quickAdd(data, 'Notes, with "quotes"', '3.00').data;
    data = addTransaction(data, { kind: 'cc_payment', description: 'Card bill', amountCents: 1450, date: TODAY }).data;
    return data;
  }

  it('JSON round-trips exactly and re-import creates no duplicates', () => {
    const data = sample();
    const parsed = sanitizeData(JSON.parse(toBackupJSON(data)));
    expect(parsed.data).toEqual(data);
    const merged = mergeData(data, parsed.data);
    expect(merged.added).toBe(0);
    expect(merged.data.transactions).toHaveLength(3);
    const into = mergeData(emptyData(), parsed.data);
    expect(into.added).toBe(3);
    expect(totalSpent(into.data, today)).toBe(1750);
  });

  it('CSV round-trips and keeps ids', () => {
    const data = sample();
    const csv = toCSV(data);
    expect(csv.split('\n')[0]).toContain('spending_effect');
    const imported = fromCSV(csv, emptyData());
    expect(imported.skipped).toBe(0);
    const merged = mergeData(emptyData(), imported.data);
    expect(merged.added).toBe(3);
    expect(totalSpent(merged.data, today)).toBe(1750);
    expect(new Set(merged.data.transactions.map((t) => t.id))).toEqual(new Set(data.transactions.map((t) => t.id)));
    expect(merged.data.transactions.find((t) => t.description.startsWith('Notes'))!.description).toBe('Notes, with "quotes"');
    // importing again into the merged data adds nothing
    expect(mergeData(merged.data, fromCSV(csv, merged.data).data).added).toBe(0);
  });

  it('restoring into a fresh install keeps category limits and settings', () => {
    let data = updateCategory(sample(), 'eating-out', { budgetCents: 10000 });
    data = { ...data, settings: { ...data.settings, budgetMode: 'monthly', customBudgetCents: 80000 } };
    const restored = mergeData(emptyData(), sanitizeData(JSON.parse(toBackupJSON(data))).data).data;
    expect(restored.categories.find((c) => c.id === 'eating-out')!.budgetCents).toBe(10000);
    expect(restored.settings.customBudgetCents).toBe(80000);
  });

  it('rejects files that are not backups', () => {
    expect(() => sanitizeData({ hello: 1 })).toThrow();
  });
});

describe('10. persistence across restarts', () => {
  it('saves and reloads identical data, and recovers from a corrupted write', () => {
    const store = memoryStore();
    expect(loadData(store).firstRun).toBe(true);
    let data = quickAdd(emptyData(), "McDonald's", '14.50').data;
    saveData(store, data);
    const reloaded = loadData(store);
    expect(reloaded.firstRun).toBe(false);
    expect(reloaded.data).toEqual(data);

    data = quickAdd(data, 'Coffee', '6.50').data;
    saveData(store, data);
    store.map.set(STORAGE_KEY, '{corrupt');
    const recovered = loadData(store);
    expect(recovered.recovered).toBe(true);
    expect(recovered.data.transactions).toHaveLength(1);
  });
});

describe('insights', () => {
  it('only reports from recorded data', () => {
    expect(buildInsights(emptyData(), TODAY)).toEqual([]);
    expect(weeklyRecommendation(emptyData(), TODAY)).toBeNull();
    let data = emptyData();
    for (let i = 0; i < 3; i++) data = addTransaction(data, { kind: 'expense', description: 'Coffee', amountCents: 650, date: TODAY, categoryId: 'snacks-drinks' }).data;
    const ids = buildInsights(data, TODAY).map((i) => i.id);
    expect(ids).toContain('frequent');
    expect(ids).toContain('small');
    expect(ids).not.toContain('week-compare'); // no previous-week data recorded
    expect(weeklyRecommendation(data, TODAY)).toContain('Coffee 3 times');
  });

  it('savings calculator', () => {
    expect(savingsFromReduction(650, 5, 2)).toEqual({ weekly: 1300, monthly: 5633, yearly: 67600 });
  });
});
