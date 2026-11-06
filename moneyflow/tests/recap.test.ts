import { describe, expect, it } from "vitest";
import { monthRecap, monthEmoji, type RecapTx } from "@/lib/recap";
import { categoryEmoji, cleanEmoji, transferEmoji } from "@/lib/emoji";
import type { InsightCategory } from "@/lib/insights";

const cats: InsightCategory[] = [
  { id: "dining", name: "Dining Out", bucket: "guiltfree", budgetCents: 100_00 },
  { id: "groc", name: "Groceries", bucket: "needs", budgetCents: 300_00 },
  { id: "rent", name: "Rent", bucket: "needs", budgetCents: null, fixed: true },
  { id: "shop", name: "Shopping", bucket: "guiltfree", budgetCents: null },
];
let n = 0;
const exp = (date: string, merchant: string, dollars: number, categoryId: string | null, extra: Partial<RecapTx> = {}): RecapTx => ({
  id: `t${++n}`, date, merchant, amountCents: -Math.round(dollars * 100), type: "expense", categoryId, necessity: null, ...extra,
});
const inc = (date: string, dollars: number): RecapTx => ({ id: `i${++n}`, date, merchant: "Payroll", amountCents: dollars * 100, type: "income", categoryId: null, necessity: null });

const october: RecapTx[] = [
  inc("2026-10-02", 1482), inc("2026-10-16", 1482), inc("2026-10-30", 1482),
  exp("2026-10-01", "Landlord", 1000, "rent"),
  exp("2026-10-05", "Taco Spot", 60, "dining"), exp("2026-10-12", "Taco Spot", 70, "dining"),
  exp("2026-10-08", "Grocer", 120, "groc"),
  exp("2026-10-20", "Sneakers", 150, "shop"),
  { id: "x1", date: "2026-10-03", merchant: "To Roth", amountCents: -9600, type: "transfer", transferKind: "investment", accountType: "checking", categoryId: null, necessity: null },
  { id: "x2", date: "2026-10-03", merchant: "To Roth", amountCents: 9600, type: "transfer", transferKind: "investment", accountType: "investment", categoryId: null, necessity: null },
  { id: "x3", date: "2026-10-18", merchant: "Card pay", amountCents: -5000, type: "transfer", transferKind: "debt_payment", accountType: "checking", categoryId: null, necessity: null },
];
const september: RecapTx[] = [
  inc("2026-09-04", 1482), inc("2026-09-18", 1482),
  exp("2026-09-01", "Landlord", 1000, "rent"),
  exp("2026-09-10", "Taco Spot", 40, "dining"),
  exp("2026-09-11", "Grocer", 200, "groc"),
];

describe("monthly recap", () => {
  const r = monthRecap({ month: "2026-10", today: "2026-11-06", txs: [...september, ...october], categories: cats, guiltFreeMonthlyCents: 296_40 });

  it("totals income, spending, left over, saved and debt paid without double counting transfers", () => {
    expect(r.partial).toBe(false);
    expect(r.income).toBe(444_600);
    expect(r.spending).toBe(140_000);
    expect(r.leftOver).toBe(304_600);
    expect(r.savedCents).toBe(9_600);
    expect(r.debtPaidCents).toBe(5_000);
    expect(r.prevSpending).toBe(124_000);
  });

  it("finds what went up and what went down", () => {
    expect(r.spentMore.map((x) => [x.name, x.delta])).toEqual([["Shopping", 15_000], ["Dining Out", 9_000]]);
    expect(r.spentLess.map((x) => [x.name, x.delta])).toEqual([["Groceries", -8_000]]);
  });

  it("picks highlights and scores budgets", () => {
    expect(r.topCategory?.name).toBe("Rent");
    expect(r.biggestPurchase).toEqual({ merchant: "Landlord", cents: 100_000, date: "2026-10-01" });
    expect(r.topMerchant).toEqual({ name: "Taco Spot", count: 2, cents: 13_000 });
    expect(r.noSpendDays).toBe(31 - 5);
    expect(r.overBudget).toEqual([{ id: "dining", name: "Dining Out", overCents: 3_000, fixed: false }]);
    expect(r.withinBudget).toBe(1);
  });

  it("builds a specific game plan for next month and skips fixed bills", () => {
    const titles = r.nextMonth.map((a) => a.title);
    expect(titles).toContain("Aim for $120 on Shopping"); // no prior month → 20% less than this month
    expect(titles).toContain("Aim for $100 on Dining Out"); // budget is below what was spent
    expect(titles.some((t) => t.includes("Rent"))).toBe(false);
    expect(titles).toContain("Keep Groceries low");
    expect(r.headline).toEqual({ emoji: "👀", text: "Spending up $160.00 vs Sep" });
  });

  it("compares a month in progress with the same days of last month", () => {
    const p = monthRecap({ month: "2026-10", today: "2026-10-10", txs: [...september, ...october], categories: cats, guiltFreeMonthlyCents: null });
    expect(p.partial).toBe(true);
    expect(p.daysCounted).toBe(10);
    expect(p.spending).toBe(118_000); // rent + 1 taco + groceries (Oct 1–10)
    expect(p.prevSpending).toBe(104_000); // Sep 1–10 (the Sep 11 grocery trip is excluded)
  });

  it("flags a month where spending beat income", () => {
    const tight = monthRecap({ month: "2026-12", today: "2027-01-05", txs: [inc("2026-12-11", 500), exp("2026-12-12", "TV", 800, "shop")], categories: cats, guiltFreeMonthlyCents: 29_640 });
    expect(tight.headline.emoji).toBe("😬");
    expect(tight.nextMonth.some((a) => a.emoji === "⏸️")).toBe(true);
  });

  it("suggests matching the budget (not cutting back) when a bill runs over", () => {
    const bills: InsightCategory[] = [{ id: "util", name: "Utilities", bucket: "needs", budgetCents: 100_00, fixed: true }];
    const u = monthRecap({ month: "2026-10", today: "2026-11-06", txs: [exp("2026-10-06", "Power Co", 112, "util")], categories: bills, guiltFreeMonthlyCents: null });
    expect(u.nextMonth[0]).toMatchObject({ emoji: "🧾", title: "Update the Utilities budget" });
  });

  it("says nothing invented when there's no data", () => {
    const empty = monthRecap({ month: "2026-08", today: "2026-11-06", txs: [], categories: cats, guiltFreeMonthlyCents: 29_640 });
    expect(empty.hasData).toBe(false);
    expect(empty.nextMonth).toEqual([]);
    expect(empty.headline.emoji).toBe("💤");
  });
});

describe("emoji", () => {
  it("maps categories, prefers the user's choice, and validates input", () => {
    expect(categoryEmoji({ name: "Groceries", bucket: "needs" })).toBe("🛒");
    expect(categoryEmoji({ name: "Dining Out", bucket: "guiltfree" })).toBe("🍔");
    expect(categoryEmoji({ name: "Weird thing", bucket: "goals" })).toBe("🎯");
    expect(categoryEmoji({ name: "Groceries", bucket: "needs", emoji: "🥦" })).toBe("🥦");
    expect(transferEmoji("debt_payment")).toBe("💳");
    expect(cleanEmoji("🥦")).toBe("🥦");
    expect(cleanEmoji("")).toBeNull();
    expect(cleanEmoji("abc")).toBe(false);
    expect(monthEmoji("2026-10")).toBe("🎃");
  });
});
