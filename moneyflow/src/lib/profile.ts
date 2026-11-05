/**
 * The user's stated financial profile. These are USER-REPORTED, EDITABLE
 * starting values. Personal mode seeds them as unverified drafts; nothing here is
 * a transaction, a balance, or a verified fact.
 */
import type { Cents } from "./money";

export const PERSONAL_PROFILE = {
  netPayCents: 148_200 as Cents, // $1,482 per biweekly paycheck
  payIntervalDays: 14,
};

export const PERSONAL_CATEGORIES: Array<{ name: string; bucket: string; color: string; monthlyBudgetCents?: Cents }> = [
  { name: "Rent", bucket: "needs", color: "#0ea5e9" },
  { name: "Phone & Internet", bucket: "needs", color: "#6366f1" },
  { name: "Car Payment", bucket: "needs", color: "#8b5cf6" },
  { name: "Car Insurance", bucket: "needs", color: "#a855f7" },
  { name: "Gas", bucket: "needs", color: "#f59e0b" },
  { name: "Car Maintenance", bucket: "needs", color: "#f97316" },
  { name: "Haircut", bucket: "needs", color: "#ec4899" },
  { name: "Groceries", bucket: "needs", color: "#22c55e" },
  { name: "Utilities", bucket: "needs", color: "#14b8a6" },
  { name: "Health", bucket: "needs", color: "#06b6d4" },
  { name: "Dining Out", bucket: "guiltfree", color: "#f43f5e" },
  { name: "Entertainment", bucket: "guiltfree", color: "#e11d48" },
  { name: "Shopping", bucket: "guiltfree", color: "#d946ef" },
  { name: "Subscriptions", bucket: "guiltfree", color: "#c026d3" },
  { name: "Gifts", bucket: "goals", color: "#fb7185" },
  { name: "Travel", bucket: "goals", color: "#38bdf8" },
  { name: "Fees & Interest", bucket: "needs", color: "#64748b" },
  { name: "Paycheck", bucket: "income", color: "#10b981" },
  { name: "Other Income", bucket: "income", color: "#34d399" },
  { name: "Uncategorized", bucket: "needs", color: "#94a3b8" },
];

/** Reported recurring expenses — unverified, due dates intentionally unknown. */
export const PERSONAL_BILLS: Array<{ name: string; amountCents: Cents; category: string }> = [
  { name: "Rent", amountCents: 100_000, category: "Rent" },
  { name: "Phone + Wi-Fi", amountCents: 25_100, category: "Phone & Internet" },
  { name: "Car payment", amountCents: 10_000, category: "Car Payment" },
  { name: "Car insurance", amountCents: 16_000, category: "Car Insurance" },
  { name: "Gas", amountCents: 5_000, category: "Gas" },
  { name: "Car maintenance", amountCents: 1_250, category: "Car Maintenance" },
  { name: "Haircut", amountCents: 3_000, category: "Haircut" },
];

/** Older reported planning amounts — imported as OPTIONAL DRAFTS only. */
export const PERSONAL_PLAN_LINES: Array<{ name: string; monthlyCents: Cents; bucket: string; nature: "savings" | "investment" | "spending" }> = [
  { name: "Travel savings", monthlyCents: 2_500, bucket: "goals", nature: "savings" },
  { name: "Birthday savings", monthlyCents: 2_500, bucket: "goals", nature: "savings" },
  { name: "General savings", monthlyCents: 20_000, bucket: "goals", nature: "savings" },
  { name: "Roth IRA contributions", monthlyCents: 9_600, bucket: "investing", nature: "investment" },
  { name: "Discretionary / free spending", monthlyCents: 13_400, bucket: "guiltfree", nature: "spending" },
];

/** Debt accounts — limits as reported; balances, APRs, minimums and due dates unknown. */
export const PERSONAL_DEBTS: Array<{ name: string; type: string; institution: string | null; creditLimitCents: Cents | null; notes: string }> = [
  { name: "Capital One Quicksilver", type: "credit_card", institution: "Capital One", creditLimitCents: 90_000, notes: "Reported credit limit $900." },
  { name: "Capital One Savor", type: "credit_card", institution: "Capital One", creditLimitCents: 30_000, notes: "Reported credit limit $300." },
  { name: "Bread Cashback American Express", type: "credit_card", institution: "Bread Financial", creditLimitCents: 290_000, notes: "Reported credit limit $2,900." },
  { name: "Rakuten American Express", type: "credit_card", institution: "Rakuten", creditLimitCents: 240_000, notes: "Reported credit limit approximately $2,400 — confirm exact limit." },
  { name: "Personal loan from friend", type: "personal_debt", institution: null, creditLimitCents: null, notes: "Interest-free. Balance to be confirmed." },
];

export const PERSONAL_GOALS: Array<{ name: string; kind: string; priority: number }> = [
  { name: "Emergency fund", kind: "emergency", priority: 1 },
  { name: "Apartment / moving fund", kind: "moving", priority: 2 },
  { name: "Travel fund", kind: "travel", priority: 3 },
  { name: "Birthday fund", kind: "birthday", priority: 4 },
];

export const PERSONAL_INVESTMENT_ACCOUNTS: Array<{ name: string; subtype: string }> = [
  { name: "Roth IRA", subtype: "roth_ira" },
  { name: "Taxable growth", subtype: "taxable" },
  { name: "Dividend portfolio", subtype: "dividend" },
];
