import { describe, expect, it } from "vitest";
import { allocateByBps, applyBps, formatCents, holdingValueCents, parseDollars } from "@/lib/money";
import { addDays, clampedDate } from "@/lib/dates";
import {
  allocate,
  buildPaydayIncome,
  DEFAULT_RULES,
  incomeFigures,
  nextPayday,
  paydaysBetween,
  paydaysInMonth,
  previousPayday,
  threePaycheckMonths,
  validateRules,
} from "@/lib/paycheck";
import {
  billFundingStatus,
  billsDueBeforeNextPayday,
  occurrencesBetween,
  perCheckReserve,
  projectCashFlow,
  reserveSummary,
  simulateSinkingFund,
  type BillLike,
} from "@/lib/bills";
import {
  accountBalance,
  availableCash,
  creditUtilization,
  netWorth,
  spendingByCategory,
  totalIncome,
  totalSpending,
  transferLegs,
  validateSplits,
  type TxLike,
} from "@/lib/ledger";
import { simulatePayoff } from "@/lib/debt";
import { dedupe, guessMapping, mapRows, parseCsv, parseDate } from "@/lib/csv";
import { budgetHealth, type HealthInput } from "@/lib/health";
import { PERSONAL_BILLS } from "@/lib/profile";

const PAY = 148_200;
const amounts = (r: ReturnType<typeof allocate>) => Object.fromEntries(r.parts.map((p) => [p.key, p.amountCents]));

describe("money", () => {
  it("parses dollar strings without floating point error", () => {
    expect(parseDollars("1,482.00")).toBe(148_200);
    expect(parseDollars("$12.5")).toBe(1_250);
    expect(parseDollars("(40.10)")).toBe(-4_010);
    expect(parseDollars("0.1")).toBe(10);
    expect(parseDollars("0.005")).toBe(1);
    expect(parseDollars("-3")).toBe(-300);
    expect(parseDollars("abc")).toBeNull();
    expect(parseDollars("")).toBeNull();
  });
  it("formats cents", () => {
    expect(formatCents(163_020)).toBe("$1,630.20");
    expect(formatCents(-2_670)).toBe("-$26.70");
  });
  it("allocation parts always sum exactly to the total", () => {
    for (const total of [1, 99, 148_201, 333_333, 7]) {
      const parts = allocateByBps(total, [5500, 2000, 1500, 1000]);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
    }
    expect(applyBps(148_200, 5500)).toBe(81_510);
  });
  it("values holdings from decimal shares and a manual price", () => {
    expect(holdingValueCents("2.5", 30_000)).toBe(75_000);
    expect(holdingValueCents("0.123456", 100_00)).toBe(1_235);
  });
});

describe("paycheck allocation", () => {
  it("allocates a $1,482 paycheck 55/20/15/10", () => {
    const r = allocate(PAY, DEFAULT_RULES);
    expect(amounts(r)).toEqual({ needs: 81_510, investing: 29_640, goals: 22_230, guiltfree: 14_820 });
    expect(r.parts.reduce((a, p) => a + p.amountCents, 0)).toBe(PAY);
  });

  it("allocates a $2,964 normal month", () => {
    const r = allocate(296_400, DEFAULT_RULES);
    expect(amounts(r)).toEqual({ needs: 163_020, investing: 59_280, goals: 44_460, guiltfree: 29_640 });
  });

  it("computes 26-paycheck annual figures and keeps the baseline separate from the average", () => {
    const f = incomeFigures(PAY);
    expect(f.paychecksPerYear).toBe(26);
    expect(f.annual).toBe(3_853_200);
    expect(f.normalMonth).toBe(296_400); // budgeting baseline
    expect(f.annualizedMonthlyAverage).toBe(321_100); // $3,211 — average only
    expect(f.normalMonth).not.toBe(f.annualizedMonthlyAverage);
    expect(f.threePaycheckMonth).toBe(444_600);
  });

  it("allocates a $4,446 three-paycheck month", () => {
    const r = allocate(444_600, DEFAULT_RULES);
    expect(amounts(r)).toEqual({ needs: 244_530, investing: 88_920, goals: 66_690, guiltfree: 44_460 });
  });

  it("pausing investing does not silently move money into other buckets", () => {
    const r = allocate(PAY, DEFAULT_RULES, { investingPaused: true });
    expect(amounts(r).investing).toBe(0);
    expect(r.pausedCents).toBe(29_640);
    expect(amounts(r).needs).toBe(81_510);
  });

  it("validates budget category percentage changes", () => {
    expect(validateRules(DEFAULT_RULES)).toBeNull();
    const changed = DEFAULT_RULES.map((r) => (r.key === "investing" ? { ...r, percentBps: 1000 } : r.key === "goals" ? { ...r, percentBps: 2500 } : r));
    expect(validateRules(changed)).toBeNull();
    expect(amounts(allocate(PAY, changed))).toEqual({ needs: 81_510, investing: 14_820, goals: 37_050, guiltfree: 14_820 });
    expect(validateRules(DEFAULT_RULES.map((r) => (r.key === "needs" ? { ...r, percentBps: 6000 } : r)))).toMatch(/100%/);
  });
});

describe("biweekly scheduling", () => {
  const anchor = "2026-01-02";
  it("generates 14-day paydays across a year boundary", () => {
    expect(paydaysBetween(anchor, "2026-12-01", "2027-01-31")).toEqual(["2026-12-04", "2026-12-18", "2027-01-01", "2027-01-15", "2027-01-29"]);
    expect(nextPayday(anchor, "2026-12-19")).toBe("2027-01-01");
    expect(previousPayday(anchor, "2027-01-01")).toBe("2026-12-18");
  });
  it("works for dates before the anchor", () => {
    expect(paydaysBetween(anchor, "2025-12-01", "2025-12-31")).toEqual(["2025-12-05", "2025-12-19"]);
  });
  it("produces 26 paydays in 2026 and finds the three-paycheck months only from the anchor", () => {
    expect(paydaysBetween(anchor, "2026-01-01", "2026-12-31")).toHaveLength(26);
    expect(threePaycheckMonths(anchor, 2026).map((m) => m.month)).toEqual(["2026-01", "2026-07"]);
    // A different anchor gives different three-paycheck months — nothing is assumed.
    expect(threePaycheckMonths("2026-01-09", 2026).map((m) => m.month)).toContain("2026-05");
    expect(threePaycheckMonths("2026-01-09", 2026).map((m) => m.month)).not.toContain("2026-01");
    expect(paydaysInMonth(anchor, "2026-07")).toEqual(["2026-07-03", "2026-07-17", "2026-07-31"]);
  });
  it("handles overtime, bonuses, actual vs forecast and changed paycheck amounts", () => {
    const rows = buildPaydayIncome(anchor, "2026-07-01", "2026-07-31", PAY, [
      { payDate: "2026-07-03", kind: "regular", expectedCents: PAY, actualCents: 148_200 },
      { payDate: "2026-07-17", kind: "regular", expectedCents: PAY, actualCents: 140_000 }, // short check
      { payDate: "2026-07-17", kind: "overtime", expectedCents: 21_000, actualCents: 21_050 },
      { payDate: "2026-07-31", kind: "regular", expectedCents: 150_000, actualCents: null }, // raise
      { payDate: "2026-07-24", kind: "bonus", expectedCents: 50_000, actualCents: null },
    ]);
    expect(rows.map((r) => r.payDate)).toEqual(["2026-07-03", "2026-07-17", "2026-07-24", "2026-07-31"]);
    const byDate = Object.fromEntries(rows.map((r) => [r.payDate, r]));
    expect(byDate["2026-07-17"].actualCents).toBe(161_050);
    expect(byDate["2026-07-17"].expectedCents).toBe(169_200);
    expect(byDate["2026-07-24"].isForecast).toBe(true);
    expect(byDate["2026-07-24"].monthIndex).toBe(0); // bonus is not a regular payday
    expect(byDate["2026-07-31"].expectedCents).toBe(150_000);
    expect(byDate["2026-07-31"].isThirdPaycheck).toBe(true);
    expect(byDate["2026-07-31"].isForecast).toBe(true);
  });
});

const bills: BillLike[] = PERSONAL_BILLS.map((b, i) => ({ id: `b${i}`, name: b.name, amountCents: b.amountCents, frequency: "monthly", dueDay: [1, 15, 20, 28, 10, 25, 31][i] }));

describe("bills", () => {
  it("totals the listed recurring expenses and the tiny Needs margin", () => {
    const total = PERSONAL_BILLS.reduce((a, b) => a + b.amountCents, 0);
    expect(total).toBe(160_350);
    const needs = amounts(allocate(296_400, DEFAULT_RULES)).needs;
    expect(needs - total).toBe(2_670);
  });

  it("finds bills due before the next payday", () => {
    const due = billsDueBeforeNextPayday(bills, "2026-01-30", "2026-02-13");
    expect(due.map((d) => `${d.name}@${d.dueDate}`)).toEqual(["Haircut@2026-01-31", "Rent@2026-02-01", "Gas@2026-02-10"]);
    // due day 31 clamps to the end of short months
    expect(occurrencesBetween(bills, "2026-02-01", "2026-02-28").find((o) => o.name === "Haircut")?.dueDate).toBe("2026-02-28");
    expect(clampedDate(2028, 2, 31)).toBe("2028-02-29");
  });

  it("ignores bills whose due date is not set instead of guessing", () => {
    const due = billsDueBeforeNextPayday([{ id: "x", name: "No date", amountCents: 1000, frequency: "monthly", dueDay: null }], "2026-01-01", "2026-03-01");
    expect(due).toEqual([]);
  });

  it("half-month reserves = $801.75 per check and over-reserve over 26 checks", () => {
    const s = reserveSummary(bills, "half_month");
    expect(s.rows.map((r) => r.perCheckCents)).toEqual([50_000, 12_550, 5_000, 8_000, 2_500, 625, 1_500]);
    expect(s.totalPerCheck).toBe(80_175);
    expect(s.totalAnnualCost).toBe(1_924_200);
    expect(s.reservedPerYear).toBe(2_084_550);
    expect(s.extraPerYear).toBe(160_350); // one extra month of bills per year
  });

  it("annualized reserves use 26 paychecks", () => {
    expect(perCheckReserve(bills[0], "annualized")).toBe(46_154);
    const s = reserveSummary(bills, "annualized");
    expect(s.reservedPerYear).toBeGreaterThanOrEqual(s.totalAnnualCost);
    expect(s.extraPerYear).toBeLessThan(100); // only rounding
  });

  it("sinking-fund simulation shows the annualized mode needs a cushion and half-month does not", () => {
    const anchor = "2026-01-02";
    const pd = paydaysBetween(anchor, "2026-01-01", "2026-12-31");
    const rent = bills[0]; // due the 1st
    const half = simulateSinkingFund(rent, pd, perCheckReserve(rent, "half_month"), 0, "2026-02-02", "2026-12-31");
    expect(half.totalShortfall).toBe(0);
    // starting just after rent is paid, only two checks land before the next due date
    const ann = simulateSinkingFund(rent, pd, perCheckReserve(rent, "annualized"), 0, "2026-02-02", "2026-12-31");
    expect(ann.totalShortfall).toBeGreaterThan(0);
    expect(ann.startingReserveNeeded).toBeGreaterThan(0);
    const fixed = simulateSinkingFund(rent, pd, perCheckReserve(rent, "annualized"), ann.startingReserveNeeded, "2026-02-02", "2026-12-31");
    expect(fixed.totalShortfall).toBe(0);
  });

  it("does not treat budgeted-but-unconfirmed reserves as funded", () => {
    const rent = bills[0];
    const base = { bill: rent, today: "2026-01-20", upcomingPaydays: ["2026-01-30"], perCheckCents: 50_000 };
    const unfunded = billFundingStatus({ ...base, confirmedReserves: [] })!;
    expect(unfunded.dueDate).toBe("2026-02-01");
    expect(unfunded.fundedCents).toBe(0);
    expect(unfunded.gapCents).toBe(50_000);
    expect(unfunded.status).toBe("gap");
    const half = billFundingStatus({ ...base, confirmedReserves: [{ payDate: "2026-01-16", fundedCents: 50_000 }] })!;
    expect(half.status).toBe("on_track");
    const full = billFundingStatus({ ...base, confirmedReserves: [{ payDate: "2026-01-16", fundedCents: 50_000 }, { payDate: "2026-01-30", fundedCents: 50_000 }] })!;
    expect(full.status).toBe("funded");
  });

  it("projects cash flow and never assumes an unknown balance is zero", () => {
    const evs = [
      { date: "2026-02-01", amountCents: -100_000, label: "Rent", kind: "bill" as const, projected: true },
      { date: "2026-01-30", amountCents: PAY, label: "Paycheck", kind: "income" as const, projected: true },
      { date: "2026-02-10", amountCents: -60_000, label: "Car", kind: "bill" as const, projected: true },
    ];
    const known = projectCashFlow(10_000, evs);
    expect(known.points.map((p) => p.balanceCents)).toEqual([158_200, 58_200, -1_800]);
    expect(known.firstNegative?.date).toBe("2026-02-10");
    const unknown = projectCashFlow(null, evs);
    expect(unknown.points.every((p) => p.balanceCents === null)).toBe(true);
    expect(unknown.firstNegative).toBeNull();
  });
});

describe("ledger", () => {
  const card = "card";
  const checking = "chk";
  const savings = "sav";
  const purchase: TxLike = { date: "2026-03-02", accountId: card, amountCents: -5_000, type: "expense", categoryId: "dining", merchant: "Cafe" };
  const payLegs = transferLegs({ fromAccountId: checking, toAccountId: card, amountCents: 5_000, date: "2026-03-20", kind: "debt_payment", group: "g1", memo: "Card payment" });

  it("counts a credit-card purchase as spending once and the payment as a transfer", () => {
    const txs = [purchase, ...payLegs];
    expect(totalSpending(txs)).toBe(5_000);
    expect(totalIncome(txs)).toBe(0);
    const snaps = [
      { accountId: card, date: "2026-03-01", balanceCents: 0 },
      { accountId: checking, date: "2026-03-01", balanceCents: 100_000 },
    ];
    expect(accountBalance(card, snaps, txs, "2026-03-10")).toBe(-5_000); // owes $50
    expect(accountBalance(card, snaps, txs, "2026-03-31")).toBe(0); // paid off
    expect(accountBalance(checking, snaps, txs, "2026-03-31")).toBe(95_000);
  });

  it("counts same-day transactions entered after a balance snapshot", () => {
    const snap = { accountId: checking, date: "2026-03-10", balanceCents: 100_000, createdAt: new Date("2026-03-10T12:00:00Z") };
    const before: TxLike = { date: "2026-03-10", accountId: checking, amountCents: -1_000, type: "expense", categoryId: null, createdAt: new Date("2026-03-10T09:00:00Z") };
    const after: TxLike = { ...before, amountCents: -2_000, createdAt: new Date("2026-03-10T15:00:00Z") };
    expect(accountBalance(checking, [snap], [before, after], "2026-03-10")).toBe(98_000);
  });

  it("treats savings and investment transfers as transfers, not expenses", () => {
    const legs = transferLegs({ fromAccountId: checking, toAccountId: savings, amountCents: 20_000, date: "2026-03-05", kind: "savings", group: "g2", memo: "To savings" });
    const roth = transferLegs({ fromAccountId: checking, toAccountId: "roth", amountCents: 9_600, date: "2026-03-05", kind: "investment", group: "g3", memo: "Roth IRA" });
    const all = [...legs, ...roth, { date: "2026-03-06", accountId: checking, amountCents: -3_000, type: "expense", categoryId: "groceries" }];
    expect(totalSpending(all)).toBe(3_000);
    const nw = netWorth(
      [{ id: checking, type: "checking", creditLimitCents: null }, { id: savings, type: "savings", creditLimitCents: null }],
      new Map([[checking, 70_400], [savings, 20_000]]),
    );
    expect(nw.netWorth).toBe(90_400);
  });

  it("applies refunds and splits by category", () => {
    const split: TxLike = { date: "2026-03-03", accountId: checking, amountCents: -10_000, type: "expense", categoryId: null, splits: [{ categoryId: "groceries", amountCents: -7_000 }, { categoryId: "household", amountCents: -3_000 }] };
    const refund: TxLike = { date: "2026-03-04", accountId: checking, amountCents: 1_000, type: "refund", categoryId: "household" };
    expect(validateSplits(split)).toBeNull();
    expect(validateSplits({ ...split, splits: [{ categoryId: "a", amountCents: -1 }] })).toMatch(/Splits/);
    const by = spendingByCategory([split, refund]);
    expect(by.get("groceries")).toBe(7_000);
    expect(by.get("household")).toBe(2_000);
    expect(totalSpending([split, refund])).toBe(9_000);
  });

  it("reports missing and unconfirmed balances as unknown, not zero", () => {
    expect(accountBalance("nobody", [], [], "2026-03-01")).toBeNull();
    const accounts = [
      { id: "a", type: "checking", creditLimitCents: null },
      { id: "b", type: "credit_card", creditLimitCents: 90_000 },
    ];
    const nw = netWorth(accounts, new Map([["a", 50_000], ["b", null]]));
    expect(nw.unknownAccounts).toEqual(["b"]);
    expect(nw.netWorth).toBe(50_000);
    const cash = availableCash(accounts, new Map([["a", null]]));
    expect(cash.unknown).toEqual(["a"]);
    expect(creditUtilization(null, 90_000).utilizationBps).toBeNull();
  });

  it("computes utilization without treating available credit as cash", () => {
    const u = creditUtilization(27_000, 90_000);
    expect(u.utilizationBps).toBe(3_000);
    expect(u.availableCreditCents).toBe(63_000);
    const cash = availableCash([{ id: "card", type: "credit_card", creditLimitCents: 90_000 }], new Map([["card", -27_000]]));
    expect(cash.cents).toBe(0);
  });
});

describe("debt payoff", () => {
  it("requires supplied balances, rates and payments", () => {
    const r = simulatePayoff([{ id: "q", name: "Quicksilver", balanceCents: null, aprBps: null, minPaymentCents: null }], 0, "avalanche", "2026-11");
    expect(r.excluded[0].reason).toMatch(/Balance/);
    expect(r.payoffMonth).toBeNull();
  });
  it("pays off an interest-free debt exactly", () => {
    const r = simulatePayoff([{ id: "f", name: "Friend", balanceCents: 60_000, aprBps: 0, minPaymentCents: 10_000 }], 0, "snowball", "2026-11");
    expect(r.months).toBe(6);
    expect(r.payoffMonth).toBe("2027-05");
    expect(r.totalInterestCents).toBe(0);
  });
  it("avalanche saves interest vs snowball and extra payments shorten payoff", () => {
    const debts = [
      { id: "a", name: "Small low APR", balanceCents: 50_000, aprBps: 1000, minPaymentCents: 2_500 },
      { id: "b", name: "Big high APR", balanceCents: 200_000, aprBps: 2999, minPaymentCents: 6_000 },
    ];
    const snow = simulatePayoff(debts, 10_000, "snowball", "2026-11");
    const ava = simulatePayoff(debts, 10_000, "avalanche", "2026-11");
    expect(ava.totalInterestCents).toBeLessThan(snow.totalInterestCents);
    const none = simulatePayoff(debts, 0, "avalanche", "2026-11");
    expect(none.months!).toBeGreaterThan(ava.months!);
  });
  it("flags payments that don't cover interest", () => {
    const r = simulatePayoff([{ id: "x", name: "X", balanceCents: 1_000_000, aprBps: 2999, minPaymentCents: 1_000 }], 0, "avalanche", "2026-11");
    expect(r.feasible).toBe(false);
    expect(r.problem).toMatch(/interest/);
  });
});

describe("CSV import", () => {
  const csv = `Date,Description,Amount\n03/01/2026,STARBUCKS #123,-5.25\n03/01/2026,STARBUCKS #123,-5.25\n03/02/2026,PAYROLL ACME,1482.00\nbad,row,1\n`;
  it("maps columns and parses rows", () => {
    const t = parseCsv(csv);
    const m = guessMapping(t.headers);
    expect(m).toMatchObject({ date: 0, description: 1, amount: 2 });
    const { rows, errors } = mapRows(t, m, "chk");
    expect(rows).toHaveLength(3);
    expect(errors).toHaveLength(1);
    expect(rows[2].amountCents).toBe(148_200);
    expect(parseDate("2026-03-01")).toBe("2026-03-01");
    expect(parseDate("01/03/2026", "DD/MM/YYYY")).toBe("2026-03-01");
  });
  it("keeps genuine identical rows in one file but blocks re-importing the same file", () => {
    const t = parseCsv(csv);
    const { rows } = mapRows(t, guessMapping(t.headers), "chk");
    const first = dedupe(rows, new Set());
    expect(first.fresh).toHaveLength(3); // two identical coffees are both kept
    const existing = new Set(first.fresh.map((r) => r.hash));
    const second = dedupe(mapRows(t, guessMapping(t.headers), "chk").rows, existing);
    expect(second.fresh).toHaveLength(0);
    expect(second.duplicates).toHaveLength(3);
  });
  it("detects overlap between two statement exports", () => {
    const a = parseCsv(`Date,Description,Amount\n03/01/2026,A,-1.00\n03/02/2026,B,-2.00\n`);
    const b = parseCsv(`Date,Description,Amount\n03/02/2026,B,-2.00\n03/03/2026,C,-3.00\n`);
    const ra = mapRows(a, guessMapping(a.headers), "chk").rows;
    const rb = mapRows(b, guessMapping(b.headers), "chk").rows;
    const res = dedupe(rb, new Set(ra.map((r) => r.hash)));
    expect(res.fresh.map((r) => r.merchant)).toEqual(["C"]);
  });
  it("supports debit/credit columns", () => {
    const t = parseCsv(`Posted Date,Payee,Debit,Credit\n2026-03-05,Rent,1000.00,\n2026-03-06,Payroll,,1482.00\n`);
    const m = guessMapping(t.headers);
    const { rows } = mapRows(t, m, "chk");
    expect(rows.map((r) => r.amountCents)).toEqual([-100_000, 148_200]);
  });
});

describe("budget health", () => {
  const base: HealthInput = {
    today: "2026-03-10", availableCashCents: 50_000, unknownCashAccounts: 0, nextPayday: "2026-03-13",
    billsBeforeNextPaydayCents: 0, billsBeforeNextPayday: [], categories: [], monthProgress: 0.3, funding: [],
    emergency: { targetCents: null, savedCents: null }, unassignedCents: 0, upcomingDebtPayments: [], unverifiedCount: 0, anchorSet: true, needsMarginCents: null,
  };
  it("produces no warnings when nothing is wrong", () => {
    expect(budgetHealth(base)).toEqual([]);
  });
  it("warns from real data only", () => {
    const w = budgetHealth({ ...base, billsBeforeNextPaydayCents: 80_000, categories: [{ id: "d", name: "Dining", budgetCents: 10_000, spentCents: 12_000 }], needsMarginCents: 2_670, anchorSet: false });
    const ids = w.map((x) => x.id);
    expect(ids).toContain("bills-exceed-cash");
    expect(ids).toContain("over-d");
    expect(ids).toContain("needs-margin");
    expect(ids).toContain("anchor");
    expect(w[0].severity).toBe("critical");
  });
  it("skips pace warnings for fixed bill categories", () => {
    const cat = { id: "r", name: "Rent", budgetCents: 100_000, spentCents: 100_000 };
    expect(budgetHealth({ ...base, categories: [cat] }).map((x) => x.id)).toContain("pace-r");
    expect(budgetHealth({ ...base, categories: [{ ...cat, fixed: true }] }).map((x) => x.id)).not.toContain("pace-r");
  });
});

it("addDays crosses leap years correctly", () => {
  expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
});
