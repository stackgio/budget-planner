import type { Prisma, PrismaClient } from "@prisma/client";

/** Works with the client or inside an interactive transaction. */
type Db = Prisma.TransactionClient;
import { addDays, addMonths, clampedDate, monthOf, monthStart, todayISO, type ISODate } from "./dates";
import { DEFAULT_RULES, paydaysBetween } from "./paycheck";
import {
  PERSONAL_BILLS,
  PERSONAL_CATEGORIES,
  PERSONAL_DEBTS,
  PERSONAL_GOALS,
  PERSONAL_INVESTMENT_ACCOUNTS,
  PERSONAL_PLAN_LINES,
  PERSONAL_PROFILE,
} from "./profile";

/**
 * PERSONAL workspace: only the user's stated profile, everything editable and
 * marked unverified. No transactions, no balances, no due dates, no APRs.
 */
export async function seedPersonal(prisma: Db): Promise<string> {
  const user = await prisma.user.create({ data: { name: "My MoneyFlow", mode: "personal" } });
  const userId = user.id;
  await prisma.settings.create({
    data: { userId, netPayCents: PERSONAL_PROFILE.netPayCents, payIntervalDays: PERSONAL_PROFILE.payIntervalDays, anchorPayday: null, reserveMode: "half_month" },
  });
  await prisma.allocationRule.createMany({ data: DEFAULT_RULES.map((r, i) => ({ userId, key: r.key, label: r.label, percentBps: r.percentBps, sortOrder: i })) });
  await prisma.category.createMany({ data: PERSONAL_CATEGORIES.map((c) => ({ userId, name: c.name, bucket: c.bucket, color: c.color })) });
  const cats = await prisma.category.findMany({ where: { userId } });
  const catId = (name: string) => cats.find((c) => c.name === name)?.id ?? null;

  const checking = await prisma.account.create({ data: { userId, name: "Primary checking", type: "checking", notes: "Enter your current balance to enable cash-flow forecasts." } });
  await prisma.account.create({ data: { userId, name: "Savings", type: "savings", notes: "Enter your current balance." } });
  await prisma.settings.update({ where: { userId }, data: { primaryAccountId: checking.id } });

  for (const b of PERSONAL_BILLS) {
    await prisma.bill.create({
      data: { userId, name: b.name, amountCents: b.amountCents, frequency: "monthly", dueDay: null, categoryId: catId(b.category), accountId: checking.id, verified: false, notes: "User-reported estimate. Confirm the amount and add the due day." },
    });
  }
  for (const d of PERSONAL_DEBTS) {
    await prisma.account.create({ data: { userId, name: d.name, type: d.type, institution: d.institution, creditLimitCents: d.creditLimitCents, aprBps: d.type === "personal_debt" ? 0 : null, notes: d.notes, verified: false } });
  }
  for (const g of PERSONAL_GOALS) {
    await prisma.savingsGoal.create({ data: { userId, name: g.name, kind: g.kind, priority: g.priority, verified: false } });
  }
  for (const a of PERSONAL_INVESTMENT_ACCOUNTS) {
    await prisma.account.create({ data: { userId, name: a.name, type: "investment", subtype: a.subtype, verified: false, notes: "Add holdings and a current value when you have them." } });
  }
  await prisma.planLine.createMany({ data: PERSONAL_PLAN_LINES.map((p) => ({ userId, ...p, status: "draft" })) });
  await prisma.auditEvent.create({ data: { userId, kind: "seed", message: "Personal workspace created from your stated profile. All amounts are unverified until you confirm them." } });
  return userId;
}

/** Deterministic pseudo-random generator so demo data is stable. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/**
 * DEMO workspace: a fictional person ("Alex Demo") with fictional accounts and
 * ~3 months of fictional transactions. Nothing here relates to the real user.
 */
export async function seedDemo(prisma: Db, today: ISODate = todayISO()): Promise<string> {
  const rand = rng(42);
  const user = await prisma.user.create({ data: { name: "Alex Demo (fictional)", mode: "demo", onboardedAt: new Date() } });
  const userId = user.id;
  const anchor = addDays(today, -11); // fictional payday 11 days ago → next one in 3 days
  await prisma.settings.create({ data: { userId, netPayCents: 165_000, anchorPayday: anchor, reserveMode: "half_month", emergencyTargetCents: 600_000, investingGoalMonthly: 25_000, profileConfirmedAt: new Date() } });
  await prisma.allocationRule.createMany({ data: DEFAULT_RULES.map((r, i) => ({ userId, key: r.key, label: r.label, percentBps: r.percentBps, sortOrder: i })) });

  const demoCats: Array<{ name: string; bucket: string; color: string; monthlyBudgetCents?: number }> = [
    { name: "Rent", bucket: "needs", color: "#0ea5e9", monthlyBudgetCents: 95_000 },
    { name: "Utilities", bucket: "needs", color: "#14b8a6", monthlyBudgetCents: 12_000 },
    { name: "Phone & Internet", bucket: "needs", color: "#6366f1", monthlyBudgetCents: 9_000 },
    { name: "Groceries", bucket: "needs", color: "#22c55e", monthlyBudgetCents: 38_000 },
    { name: "Gas", bucket: "needs", color: "#f59e0b", monthlyBudgetCents: 14_000 },
    { name: "Car Insurance", bucket: "needs", color: "#a855f7", monthlyBudgetCents: 12_500 },
    { name: "Dining Out", bucket: "guiltfree", color: "#f43f5e", monthlyBudgetCents: 15_000 },
    { name: "Entertainment", bucket: "guiltfree", color: "#e11d48", monthlyBudgetCents: 6_000 },
    { name: "Shopping", bucket: "guiltfree", color: "#d946ef", monthlyBudgetCents: 10_000 },
    { name: "Subscriptions", bucket: "guiltfree", color: "#c026d3", monthlyBudgetCents: 3_500 },
    { name: "Health", bucket: "needs", color: "#06b6d4", monthlyBudgetCents: 4_000 },
    { name: "Paycheck", bucket: "income", color: "#10b981" },
    { name: "Other Income", bucket: "income", color: "#34d399" },
    { name: "Uncategorized", bucket: "needs", color: "#94a3b8" },
  ];
  await prisma.category.createMany({ data: demoCats.map((c) => ({ userId, ...c })) });
  const cats = await prisma.category.findMany({ where: { userId } });
  const cat = (n: string) => cats.find((c) => c.name === n)!.id;

  const start = monthStart(addMonths(monthOf(today), -3));
  const acct = async (data: { name: string; type: string; subtype?: string; creditLimitCents?: number; aprBps?: number; minPaymentCents?: number; dueDay?: number; institution?: string }, opening: number) => {
    const a = await prisma.account.create({ data: { userId, verified: true, ...data } });
    await prisma.accountSnapshot.create({ data: { userId, accountId: a.id, date: addDays(start, -1), balanceCents: opening, note: "Demo opening balance" } });
    return a;
  };
  const checking = await acct({ name: "Demo Checking", type: "checking", institution: "Demo Bank" }, 124_000);
  const savings = await acct({ name: "Demo High-Yield Savings", type: "savings", institution: "Demo Bank" }, 250_000);
  const visa = await acct({ name: "Demo Rewards Visa", type: "credit_card", creditLimitCents: 200_000, aprBps: 2299, minPaymentCents: 3_500, dueDay: 18, institution: "Demo Card Co" }, -43_000);
  const loan = await acct({ name: "Demo Auto Loan", type: "loan", aprBps: 649, minPaymentCents: 28_500, dueDay: 12, institution: "Demo Credit Union" }, -620_000);
  const roth = await acct({ name: "Demo Roth IRA", type: "investment", subtype: "roth_ira", institution: "Demo Brokerage" }, 420_000);
  await prisma.settings.update({ where: { userId }, data: { primaryAccountId: checking.id } });

  const txs: Array<{ accountId: string; date: string; merchant: string; amountCents: number; type: string; categoryId?: string | null; transferKind?: string; transferGroup?: string; tags?: string }> = [];
  let g = 0;
  const transfer = (from: string, to: string, date: string, cents: number, kind: string, memo: string) => {
    const grp = `demo-${++g}`;
    txs.push({ accountId: from, date, merchant: memo, amountCents: -cents, type: "transfer", transferKind: kind, transferGroup: grp });
    txs.push({ accountId: to, date, merchant: memo, amountCents: cents, type: "transfer", transferKind: kind, transferGroup: grp });
  };

  for (const d of paydaysBetween(anchor, start, today)) {
    txs.push({ accountId: checking.id, date: d, merchant: "Demo Employer Payroll", amountCents: 165_000, type: "income", categoryId: cat("Paycheck") });
    transfer(checking.id, savings.id, d, 15_000, "savings", "Transfer to savings");
  }
  for (let m = 0; m <= 3; m++) {
    const ym = addMonths(monthOf(start), m);
    const [y, mo] = ym.split("-").map(Number);
    const on = (day: number) => clampedDate(y, mo, day);
    const push = (day: number, merchant: string, cents: number, c: string, account = checking.id) => {
      const date = on(day);
      if (date <= today && date >= start) txs.push({ accountId: account, date, merchant, amountCents: -cents, type: "expense", categoryId: cat(c) });
    };
    push(1, "Maple Court Apartments", 95_000, "Rent");
    push(6, "City Power & Water", 9_000 + Math.round(rand() * 4_000), "Utilities");
    push(9, "Wavelink Mobile", 8_500, "Phone & Internet");
    push(15, "Shieldline Insurance", 12_500, "Car Insurance");
    push(20, "StreamBox", 1_599, "Subscriptions", visa.id);
    for (const day of [3, 10, 17, 24]) push(day, rand() > 0.5 ? "FreshMart" : "Green Basket Grocery", 7_000 + Math.round(rand() * 3_500), "Groceries", rand() > 0.6 ? visa.id : checking.id);
    for (const day of [5, 19]) push(day, "QuickFuel", 3_800 + Math.round(rand() * 1_500), "Gas");
    for (const day of [7, 13, 22, 27]) push(day, ["Taco Corner", "Noodle House", "Bean & Leaf Cafe", "Pizza Planet Demo"][Math.floor(rand() * 4)], 1_200 + Math.round(rand() * 3_000), "Dining Out", visa.id);
    push(11, "Cineplex Demo", 2_400, "Entertainment", visa.id);
    for (const day of [2, 6, 9, 13, 16, 20, 23, 27]) push(day, "Daily Grind Coffee", 500 + Math.round(rand() * 250), "Dining Out", visa.id);
    push(16, "Online Marketplace", 2_000 + Math.round(rand() * 6_000), "Shopping", visa.id);
    push(23, "Corner Pharmacy", 1_500 + Math.round(rand() * 1_500), "Health");
    if (on(18) <= today && on(18) >= start) transfer(checking.id, visa.id, on(18), 30_000, "debt_payment", "Visa payment");
    if (on(12) <= today && on(12) >= start) transfer(checking.id, loan.id, on(12), 28_500, "debt_payment", "Auto loan payment");
    if (on(2) <= today && on(2) >= start) transfer(checking.id, roth.id, on(2), 25_000, "investment", "Roth IRA contribution");
  }
  // A refund to show refund handling
  const refundDate = addDays(today, -9);
  if (refundDate >= start) txs.push({ accountId: visa.id, date: refundDate, merchant: "Online Marketplace", amountCents: 1_850, type: "refund", categoryId: cat("Shopping") });

  await prisma.transaction.createMany({ data: txs.map((t) => ({ userId, ...t })) });
  // Show need/want tagging in the demo (most purchases stay untagged and fall back to their category).
  await prisma.transaction.updateMany({ where: { userId, merchant: { in: ["Daily Grind Coffee", "Online Marketplace", "Cineplex Demo"] }, type: "expense" }, data: { necessity: "want" } });
  await prisma.transaction.updateMany({ where: { userId, merchant: { in: ["FreshMart", "Green Basket Grocery", "Corner Pharmacy"] } }, data: { necessity: "need" } });
  const invTxs = await prisma.transaction.findMany({ where: { userId, accountId: roth.id, transferKind: "investment" } });
  for (const t of invTxs) await prisma.investmentContribution.create({ data: { userId, accountId: roth.id, date: t.date, amountCents: t.amountCents, taxYear: +t.date.slice(0, 4), transactionId: t.id, note: "Demo contribution" } });
  await prisma.accountSnapshot.create({ data: { userId, accountId: roth.id, date: addDays(today, -1), balanceCents: 420_000 + invTxs.reduce((a, t) => a + t.amountCents, 0) + 18_430, note: "Demo statement value (fictional)" } });
  await prisma.holding.createMany({
    data: [
      { userId, accountId: roth.id, symbol: "DEMO-TOTAL", name: "Fictional total-market fund", shares: "21.5", costBasisCents: 380_000, manualPriceCents: 21_150, priceAsOf: addDays(today, -1), verified: true },
      { userId, accountId: roth.id, symbol: "DEMO-INTL", name: "Fictional international fund", shares: "12.25", costBasisCents: 110_000, manualPriceCents: 9_420, priceAsOf: addDays(today, -1), verified: true },
    ],
  });

  const bills: Array<{ name: string; amountCents: number; dueDay: number; c: string; debt?: string; account?: string }> = [
    { name: "Rent", amountCents: 95_000, dueDay: 1, c: "Rent" },
    { name: "Utilities", amountCents: 11_000, dueDay: 6, c: "Utilities" },
    { name: "Phone", amountCents: 8_500, dueDay: 9, c: "Phone & Internet" },
    { name: "Auto loan", amountCents: 28_500, dueDay: 12, c: "Uncategorized", debt: loan.id },
    { name: "Car insurance", amountCents: 12_500, dueDay: 15, c: "Car Insurance" },
    { name: "Visa payment", amountCents: 3_500, dueDay: 18, c: "Uncategorized", debt: visa.id },
    { name: "StreamBox", amountCents: 1_599, dueDay: 20, c: "Subscriptions", account: visa.id },
  ];
  for (const b of bills) {
    await prisma.bill.create({ data: { userId, name: b.name, amountCents: b.amountCents, frequency: "monthly", dueDay: b.dueDay, categoryId: cat(b.c), accountId: b.account ?? checking.id, debtAccountId: b.debt ?? null, verified: true, autopay: b.name !== "Rent" } });
  }
  // Record demo paychecks as received (linked to their payroll deposits)
  const payTxs = await prisma.transaction.findMany({ where: { userId, accountId: checking.id, type: "income" } });
  for (const t of payTxs) await prisma.paycheckEvent.create({ data: { userId, payDate: t.date, kind: "regular", expectedCents: 165_000, actualCents: t.amountCents, transactionId: t.id } });
  // Demo user has confirmed bill reserves from the last two paychecks
  const demoBills = await prisma.bill.findMany({ where: { userId } });
  const lastTwo = paydaysBetween(anchor, addDays(today, -28), today).slice(-2);
  for (const d of lastTwo) for (const b of demoBills) {
    const amt = Math.ceil(b.amountCents / 2);
    await prisma.billReserve.create({ data: { userId, billId: b.id, payDate: d, plannedCents: amt, fundedCents: amt, fundedAt: new Date() } });
  }
  const efund = await prisma.savingsGoal.create({ data: { userId, name: "Emergency fund", kind: "emergency", targetCents: 600_000, priority: 1, accountId: savings.id, verified: true, monthlyContributionCents: 30_000 } });
  const trip = await prisma.savingsGoal.create({ data: { userId, name: "Coastal trip", kind: "travel", targetCents: 120_000, targetDate: clampedDate(+today.slice(0, 4) + 1, 6, 1), priority: 3, accountId: savings.id, verified: true, monthlyContributionCents: 5_000 } });
  await prisma.goalContribution.createMany({
    data: [
      { userId, goalId: efund.id, date: addDays(start, -1), amountCents: 210_000, note: "Starting amount (demo)" },
      { userId, goalId: trip.id, date: addDays(start, -1), amountCents: 40_000, note: "Starting amount (demo)" },
      ...paydaysBetween(anchor, start, today).map((d) => ({ userId, goalId: efund.id, date: d, amountCents: 15_000, note: "Per-paycheck savings" })),
    ],
  });
  return userId;
}

const TX = { maxWait: 30_000, timeout: 180_000 };

/**
 * Create a workspace atomically: either every row exists or none do, so a
 * concurrent request can never observe a half-built workspace.
 */
export function createWorkspace(prisma: PrismaClient, mode: "demo" | "personal"): Promise<string> {
  return prisma.$transaction((tx) => (mode === "demo" ? seedDemo(tx) : seedPersonal(tx)), TX);
}

export async function resetWorkspace(prisma: PrismaClient, mode: "demo" | "personal"): Promise<string> {
  return prisma.$transaction(async (tx) => {
    await tx.user.deleteMany({ where: { mode } });
    return mode === "demo" ? seedDemo(tx) : seedPersonal(tx);
  }, TX);
}
