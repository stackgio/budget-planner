import { describe, expect, it } from "vitest";
import { effectiveNecessity, guiltFreePace, needsVsWants, spendSmarterInsights, weeklyTip, type InsightCategory, type InsightTx } from "@/lib/insights";
import { addDays } from "@/lib/dates";

const cats: InsightCategory[] = [
  { id: "dining", name: "Dining Out", bucket: "guiltfree", budgetCents: 100_00 },
  { id: "groc", name: "Groceries", bucket: "needs", budgetCents: 300_00 },
  { id: "rent", name: "Rent", bucket: "needs", budgetCents: 1000_00, fixed: true },
  { id: "subs", name: "Subscriptions", bucket: "guiltfree", budgetCents: null },
  { id: "misc", name: "Misc", bucket: "goals", budgetCents: null },
];
const today = "2026-11-20";
let n = 0;
const tx = (date: string, merchant: string, dollars: number, categoryId: string | null, extra: Partial<InsightTx> = {}): InsightTx => ({
  id: `t${++n}`, date, merchant, amountCents: -Math.round(dollars * 100), type: "expense", categoryId, necessity: null, ...extra,
});

describe("need vs want", () => {
  const map = new Map(cats.map((c) => [c.id, c]));
  it("uses the explicit tag first, then the category bucket", () => {
    expect(effectiveNecessity(tx(today, "x", 1, "dining", { necessity: "need" }), map)).toEqual({ value: "need", tagged: true });
    expect(effectiveNecessity(tx(today, "x", 1, "dining"), map)).toEqual({ value: "want", tagged: false });
    expect(effectiveNecessity(tx(today, "x", 1, "groc"), map)).toEqual({ value: "need", tagged: false });
    expect(effectiveNecessity(tx(today, "x", 1, "misc"), map).value).toBeNull();
  });
  it("totals needs, wants and unclassified; refunds reduce, transfers ignored", () => {
    const r = needsVsWants([
      tx("2026-11-02", "Grocer", 80, "groc"),
      tx("2026-11-03", "Cafe", 20, "dining"),
      tx("2026-11-04", "Shop", 30, "misc", { necessity: "want" }),
      tx("2026-11-05", "Thing", 10, "misc"),
      { ...tx("2026-11-06", "Cafe", 5, "dining"), amountCents: 500, type: "refund" },
      { ...tx("2026-11-07", "To savings", 200, null), type: "transfer" },
    ], cats, "2026-11-01", "2026-11-30");
    expect(r).toMatchObject({ need: 8000, want: 4500, unclassified: 1000 });
  });
});

describe("spend smarter insights", () => {
  it("spots frequent small purchases and estimates half-the-visits savings", () => {
    const txs = [1, 4, 8, 12, 15].map((d) => tx(addDays(today, -d), "Bean Cafe", 6, "dining"));
    const ins = spendSmarterInsights({ today, txs, categories: cats, guiltFreeMonthlyCents: null });
    const f = ins.find((i) => i.kind === "frequent")!;
    expect(f.title).toContain("5 purchases at Bean Cafe");
    expect(f.monthlySavingsCents).toBe(1500);
  });

  it("ignores fixed bills even when paid often", () => {
    const txs = [1, 2, 3, 4].map((d) => tx(addDays(today, -d), "Landlord", 10, "rent"));
    expect(spendSmarterInsights({ today, txs, categories: cats, guiltFreeMonthlyCents: null }).filter((i) => i.kind === "frequent")).toEqual([]);
  });

  it("flags a flexible category running well above its usual", () => {
    const txs = [
      tx(addDays(today, -40), "A", 60, "groc"), tx(addDays(today, -70), "A", 60, "groc"), tx(addDays(today, -100), "A", 60, "groc"),
      tx(addDays(today, -5), "A", 150, "groc"),
    ];
    const ins = spendSmarterInsights({ today, txs, categories: cats.map((c) => ({ ...c, budgetCents: null })), guiltFreeMonthlyCents: null });
    const a = ins.find((i) => i.kind === "above_usual")!;
    expect(a.title).toBe("Groceries is up 150% vs your usual");
    expect(a.monthlySavingsCents).toBe(9000);
  });

  it("needs at least two prior months before calling anything 'usual'", () => {
    const txs = [tx(addDays(today, -40), "A", 10, "groc"), tx(addDays(today, -3), "A", 200, "groc")];
    const ins = spendSmarterInsights({ today, txs, categories: cats.map((c) => ({ ...c, budgetCents: null })), guiltFreeMonthlyCents: null });
    expect(ins.find((i) => i.kind === "above_usual")).toBeUndefined();
  });

  it("reports over-budget categories once (no duplicate with above-usual)", () => {
    const txs = [tx("2026-11-03", "Steak", 140, "dining")];
    const ins = spendSmarterInsights({ today, txs, categories: cats, guiltFreeMonthlyCents: null });
    const over = ins.filter((i) => i.id.endsWith("dining"));
    expect(over).toHaveLength(1);
    expect(over[0].kind).toBe("over_budget");
    expect(over[0].monthlySavingsCents).toBe(4000);
  });

  it("finds monthly want subscriptions with similar amounts", () => {
    const txs = ["2026-09-12", "2026-10-12", "2026-11-12"].map((d) => tx(d, "StreamFlix", 15.99, "subs"));
    const ins = spendSmarterInsights({ today, txs, categories: cats, guiltFreeMonthlyCents: null });
    const s = ins.find((i) => i.kind === "subscription")!;
    expect(s.title).toBe("Review StreamFlix (~$15.99/mo)");
    expect(s.monthlySavingsCents).toBe(1599);
  });

  it("compares wants to the guilt-free share and picks the biggest idea as the weekly tip", () => {
    const txs = [tx("2026-11-02", "Shoes", 250, "misc", { necessity: "want" }), tx("2026-11-03", "Cafe", 50, "dining")];
    const ins = spendSmarterInsights({ today, txs, categories: cats, guiltFreeMonthlyCents: 29_640 });
    const w = ins.find((i) => i.kind === "wants_over")!;
    expect(w.monthlySavingsCents).toBe(30_000 - 29_640);
    expect(weeklyTip(ins)).toEqual(ins[0]);
    expect(ins.map((i) => i.monthlySavingsCents ?? 0)).toEqual([...ins.map((i) => i.monthlySavingsCents ?? 0)].sort((a, b) => b - a));
  });

  it("returns nothing when there is no data — no invented advice", () => {
    expect(spendSmarterInsights({ today, txs: [], categories: cats, guiltFreeMonthlyCents: 29_640 })).toEqual([]);
    expect(weeklyTip([])).toBeNull();
  });
});

describe("guilt-free pace", () => {
  it("shows what's left this pay period and per day", () => {
    const p = guiltFreePace({
      today: "2026-11-10", lastPayday: "2026-11-06", nextPayday: "2026-11-20", allowanceCents: 148_20,
      txs: [tx("2026-11-07", "Movie", 20, "dining"), tx("2026-11-05", "Before payday", 99, "dining"), tx("2026-11-08", "Food", 50, "groc")],
      categories: cats,
    });
    expect(p.wantSpentCents).toBe(2000);
    expect(p.leftCents).toBe(12_820);
    expect(p.daysLeft).toBe(10);
    expect(p.perDayCents).toBe(1282);
  });
});
