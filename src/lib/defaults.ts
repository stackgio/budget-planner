import type { AppData, BudgetPlan, Bucket, Category, PlanLine, Settings } from './types';
import { todayISO } from './dates';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'groceries', name: 'Groceries', emoji: '🛒', budgetCents: null, archived: false, bucket: 'needs' },
  { id: 'eating-out', name: 'Eating Out', emoji: '🍔', budgetCents: null, archived: false, bucket: 'fun' },
  { id: 'snacks-drinks', name: 'Snacks & Drinks', emoji: '☕', budgetCents: null, archived: false, bucket: 'fun' },
  { id: 'gas', name: 'Gas', emoji: '⛽', budgetCents: null, archived: false, bucket: 'needs' },
  { id: 'transportation', name: 'Transportation', emoji: '🚌', budgetCents: null, archived: false, bucket: 'needs' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', budgetCents: null, archived: false, bucket: 'fun' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬', budgetCents: null, archived: false, bucket: 'fun' },
  { id: 'subscriptions', name: 'Subscriptions', emoji: '🔁', budgetCents: null, archived: false, bucket: 'fun' },
  { id: 'personal-care', name: 'Personal Care', emoji: '💇', budgetCents: null, archived: false, bucket: 'needs' },
  { id: 'household', name: 'Household', emoji: '🏠', budgetCents: null, archived: false, bucket: 'needs' },
  { id: 'bills', name: 'Bills', emoji: '🧾', budgetCents: null, archived: false, bucket: 'needs' },
  { id: 'debt', name: 'Debt Payments', emoji: '💳', budgetCents: null, archived: false, bucket: 'needs' },
  { id: 'other', name: 'Other', emoji: '📦', budgetCents: null, archived: false, bucket: 'fun' },
];

export const OTHER_CATEGORY_ID = 'other';

/** Bucket for categories that don't say (older data, imported categories). */
export function defaultBucketFor(categoryId: string): Bucket {
  return DEFAULT_CATEGORIES.find((c) => c.id === categoryId)?.bucket ?? 'fun';
}

/**
 * The starting per-paycheck plan. These are planned amounts only — nothing
 * here is ever recorded as paid until a payment is confirmed.
 */
export const DEFAULT_PLAN_LINES: PlanLine[] = [
  { id: 'rent', name: 'Rent', bucket: 'needs', amountCents: 50000, type: 'bill', categoryId: 'bills', goal: null },
  { id: 'phone-wifi', name: 'Phone + Wi-Fi', bucket: 'needs', amountCents: 8333, type: 'bill', categoryId: 'bills', goal: null },
  { id: 'car-payment', name: 'Car payment/rental', bucket: 'needs', amountCents: 10000, type: 'bill', categoryId: 'transportation', goal: null },
  { id: 'gas', name: 'Gas', bucket: 'needs', amountCents: 5000, type: 'spending', categoryId: 'gas', goal: null },
  { id: 'car-maintenance', name: 'Car maintenance', bucket: 'needs', amountCents: 1250, type: 'spending', categoryId: null, goal: null },
  { id: 'haircut', name: 'Haircut', bucket: 'needs', amountCents: 3000, type: 'spending', categoryId: null, goal: null },
  { id: 'groceries', name: 'Groceries', bucket: 'needs', amountCents: 0, type: 'spending', categoryId: 'groceries', goal: null },
  { id: 'investing', name: 'Investing contribution', bucket: 'investing', amountCents: 29640, type: 'contribution', categoryId: null, goal: null },
  { id: 'debt-payoff', name: 'Debt payoff', bucket: 'goals', amountCents: 0, type: 'contribution', categoryId: null, goal: 'debt' },
  { id: 'emergency', name: 'Emergency savings', bucket: 'goals', amountCents: 20000, type: 'contribution', categoryId: null, goal: 'emergency' },
  { id: 'travel', name: 'Travel savings', bucket: 'goals', amountCents: 2500, type: 'contribution', categoryId: null, goal: 'travel' },
  { id: 'birthday', name: 'Birthday savings', bucket: 'goals', amountCents: 2500, type: 'contribution', categoryId: null, goal: 'birthday' },
  { id: 'personal', name: 'Personal spending allowance', bucket: 'fun', amountCents: 13400, type: 'spending', categoryId: null, goal: null },
];

export function defaultPlan(): BudgetPlan {
  return {
    baselineCents: 148200,
    percents: { needs: 5500, investing: 2000, goals: 1500, fun: 1000 },
    lines: DEFAULT_PLAN_LINES.map((l) => ({ ...l })),
    debtPayoff: { enabled: false, redirectCents: null, debtId: null },
  };
}

export function defaultSettings(today = todayISO()): Settings {
  return {
    budgetMode: 'paycheck',
    customBudgetCents: 0,
    biweeklyAnchor: today,
    categoryBudgetPeriod: 'month',
    weekStartsOn: 1,
    paymentMethods: ['Debit card', 'Credit card', 'Cash', 'Apple Pay'],
    smallPurchaseCents: 1000,
  };
}

export function emptyData(today = todayISO()): AppData {
  return {
    schemaVersion: 2,
    transactions: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    paychecks: [],
    settings: defaultSettings(today),
    budget: defaultPlan(),
    debts: [],
  };
}
