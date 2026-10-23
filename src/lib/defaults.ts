import type { AppData, Category, Settings } from './types';
import { todayISO } from './dates';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'groceries', name: 'Groceries', emoji: '🛒', budgetCents: null, archived: false },
  { id: 'eating-out', name: 'Eating Out', emoji: '🍔', budgetCents: null, archived: false },
  { id: 'snacks-drinks', name: 'Snacks & Drinks', emoji: '☕', budgetCents: null, archived: false },
  { id: 'gas', name: 'Gas', emoji: '⛽', budgetCents: null, archived: false },
  { id: 'transportation', name: 'Transportation', emoji: '🚌', budgetCents: null, archived: false },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', budgetCents: null, archived: false },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎬', budgetCents: null, archived: false },
  { id: 'subscriptions', name: 'Subscriptions', emoji: '🔁', budgetCents: null, archived: false },
  { id: 'personal-care', name: 'Personal Care', emoji: '💇', budgetCents: null, archived: false },
  { id: 'household', name: 'Household', emoji: '🏠', budgetCents: null, archived: false },
  { id: 'bills', name: 'Bills', emoji: '🧾', budgetCents: null, archived: false },
  { id: 'debt', name: 'Debt Payments', emoji: '💳', budgetCents: null, archived: false },
  { id: 'other', name: 'Other', emoji: '📦', budgetCents: null, archived: false },
];

export const OTHER_CATEGORY_ID = 'other';

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
    schemaVersion: 1,
    transactions: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    paychecks: [],
    settings: defaultSettings(today),
  };
}
