/**
 * Monthly recap: what happened this month vs last, and a plan for next month.
 * Everything is derived from recorded transactions and budgets — nothing is guessed.
 */
import { addMonths, daysInMonth, formatMonth, monthEnd, monthStart, type ISODate, type YearMonth } from "./dates";
import { formatCents, type Cents } from "./money";
import { needsVsWants, spendSmarterInsights, type InsightCategory, type InsightTx, type NeedsWants } from "./insights";
import { normalizeMerchant } from "./csv";

export interface RecapCategoryRow {
  id: string | null;
  name: string;
  cur: Cents;
  prev: Cents;
  delta: Cents;
  budgetCents: Cents | null;
  fixed: boolean;
}

export interface RecapAction {
  emoji: string;
  title: string;
  detail: string;
  href: string;
}

export interface MonthRecap {
  month: YearMonth;
  prevMonth: YearMonth;
  partial: boolean; // month still in progress
  daysCounted: number;
  income: Cents;
  spending: Cents;
  leftOver: Cents; // income - spending
  prevIncome: Cents;
  prevSpending: Cents;
  savedCents: Cents; // savings + investment transfers out of cash accounts
  debtPaidCents: Cents;
  categories: RecapCategoryRow[];
  spentMore: RecapCategoryRow[];
  spentLess: RecapCategoryRow[];
  topCategory: RecapCategoryRow | null;
  biggestPurchase: { merchant: string; cents: Cents; date: ISODate } | null;
  topMerchant: { name: string; count: number; cents: Cents } | null;
  noSpendDays: number;
  overBudget: Array<{ id: string; name: string; overCents: Cents; fixed: boolean }>;
  withinBudget: number;
  needsWants: NeedsWants;
  headline: { emoji: string; text: string };
  nextMonth: RecapAction[];
  hasData: boolean;
}

export interface RecapTx extends InsightTx {
  accountType?: string; // for transfers: the account the leg belongs to
  transferKind?: string | null;
}

const spentOf = (t: InsightTx) => (t.type === "expense" || t.type === "refund" ? -t.amountCents : 0);

function byCategory(txs: InsightTx[], from: ISODate, to: ISODate): Map<string | null, Cents> {
  const m = new Map<string | null, Cents>();
  for (const t of txs) {
    if (t.date < from || t.date > to || (t.type !== "expense" && t.type !== "refund")) continue;
    const lines = t.splits && t.splits.length ? t.splits : [{ categoryId: t.categoryId, amountCents: t.amountCents }];
    for (const l of lines) m.set(l.categoryId, (m.get(l.categoryId) ?? 0) - l.amountCents);
  }
  return m;
}

/** Round up to a friendly $5 target. */
const friendly = (c: Cents) => Math.max(500, Math.ceil(c / 500) * 500);

export function monthRecap(params: {
  month: YearMonth;
  today: ISODate;
  txs: RecapTx[];
  categories: InsightCategory[];
  guiltFreeMonthlyCents: Cents | null;
}): MonthRecap {
  const { month, today, txs, categories } = params;
  const prevMonth = addMonths(month, -1);
  const from = monthStart(month);
  const fullEnd = monthEnd(month);
  const partial = today < fullEnd && today >= from;
  const to = partial ? today : fullEnd;
  const daysCounted = partial ? Number(today.slice(8, 10)) : daysInMonth(+month.slice(0, 4), +month.slice(5, 7));
  const pFrom = monthStart(prevMonth);
  // Compare like with like: a month in progress is compared with the same days of last month.
  const pTo = partial ? `${prevMonth}-${String(Math.min(daysCounted, daysInMonth(+prevMonth.slice(0, 4), +prevMonth.slice(5, 7)))).padStart(2, "0")}` : monthEnd(prevMonth);

  const inRange = (t: InsightTx, a: ISODate, b: ISODate) => t.date >= a && t.date <= b;
  const cur = txs.filter((t) => inRange(t, from, to));
  const prev = txs.filter((t) => inRange(t, pFrom, pTo));
  const income = cur.filter((t) => t.type === "income").reduce((a, t) => a + t.amountCents, 0);
  const prevIncome = prev.filter((t) => t.type === "income").reduce((a, t) => a + t.amountCents, 0);
  const spending = cur.reduce((a, t) => a + spentOf(t), 0);
  const prevSpending = prev.reduce((a, t) => a + spentOf(t), 0);
  const cashOut = (t: RecapTx) => t.type === "transfer" && t.amountCents < 0 && (t.accountType === "checking" || t.accountType === "cash" || t.accountType === "savings");
  const savedCents = cur.filter((t) => cashOut(t) && (t.transferKind === "investment" || (t.transferKind === "savings" && t.accountType !== "savings"))).reduce((a, t) => a - t.amountCents, 0);
  const debtPaidCents = cur.filter((t) => cashOut(t) && t.transferKind === "debt_payment").reduce((a, t) => a - t.amountCents, 0);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const cNow = byCategory(txs, from, to);
  const cPrev = byCategory(txs, pFrom, pTo);
  const ids = [...new Set([...cNow.keys(), ...cPrev.keys()])];
  const rows: RecapCategoryRow[] = ids
    .map((id) => {
      const c = id ? catMap.get(id) : undefined;
      const curC = cNow.get(id) ?? 0;
      const prevC = cPrev.get(id) ?? 0;
      return { id, name: c?.name ?? "Uncategorized", cur: curC, prev: prevC, delta: curC - prevC, budgetCents: c?.budgetCents ?? null, fixed: !!c?.fixed };
    })
    .filter((r) => r.cur !== 0 || r.prev !== 0)
    .sort((a, b) => b.cur - a.cur);
  const MIN_CHANGE = 500;
  const spentMore = rows.filter((r) => r.delta >= MIN_CHANGE).sort((a, b) => b.delta - a.delta).slice(0, 3);
  const spentLess = rows.filter((r) => r.delta <= -MIN_CHANGE).sort((a, b) => a.delta - b.delta).slice(0, 3);

  const expenses = cur.filter((t) => t.type === "expense");
  const big = [...expenses].sort((a, b) => a.amountCents - b.amountCents)[0];
  const merchants = new Map<string, { name: string; count: number; cents: Cents }>();
  for (const t of expenses) {
    const k = normalizeMerchant(t.merchant);
    const m = merchants.get(k) ?? { name: t.merchant, count: 0, cents: 0 };
    m.count += 1;
    m.cents -= t.amountCents;
    merchants.set(k, m);
  }
  const topMerchant = [...merchants.values()].sort((a, b) => b.count - a.count || b.cents - a.cents)[0] ?? null;
  const spendDays = new Set(expenses.map((t) => t.date));
  const noSpendDays = Math.max(0, daysCounted - spendDays.size);

  const overBudget: MonthRecap["overBudget"] = [];
  let withinBudget = 0;
  for (const r of rows) {
    if (!r.id || r.budgetCents === null || r.budgetCents <= 0) continue;
    if (r.cur > r.budgetCents) overBudget.push({ id: r.id, name: r.name, overCents: r.cur - r.budgetCents, fixed: r.fixed });
    else withinBudget += 1;
  }
  for (const c of categories) {
    if (c.budgetCents && c.budgetCents > 0 && !rows.some((r) => r.id === c.id)) withinBudget += 1;
  }
  const nw = needsVsWants(txs, categories, from, to);
  const hasData = expenses.length > 0 || income > 0;
  const leftOver = income - spending;

  // Headline
  let headline: MonthRecap["headline"];
  if (!hasData) headline = { emoji: "💤", text: "Quiet month — nothing recorded yet" };
  else if (income > 0 && leftOver < 0) headline = { emoji: "😬", text: `Spent ${formatCents(-leftOver)} more than came in` };
  else if (prevSpending > 0 && spending < prevSpending * 0.95) headline = { emoji: "🙌", text: `Spending down ${formatCents(prevSpending - spending)} vs ${formatMonth(prevMonth, "short").split(" ")[0]}` };
  else if (prevSpending > 0 && spending > prevSpending * 1.05) headline = { emoji: "👀", text: `Spending up ${formatCents(spending - prevSpending)} vs ${formatMonth(prevMonth, "short").split(" ")[0]}` };
  else if (income > 0) headline = { emoji: "✨", text: `Kept ${formatCents(leftOver)} after spending` };
  else headline = { emoji: "📊", text: "Here's how the month went" };

  // Game plan for next month — specific, from the numbers above.
  const plan: RecapAction[] = [];
  for (const r of spentMore) {
    if (r.fixed || !r.id) continue;
    const target = r.budgetCents && r.budgetCents < r.cur ? r.budgetCents : friendly(r.prev > 0 ? r.prev : r.cur * 0.8);
    plan.push({ emoji: "🎯", title: `Aim for ${formatCents(target, { noCents: true })} on ${r.name}`, detail: `You spent ${formatCents(r.cur)}, up ${formatCents(r.delta)} from last month.`, href: `/budget` });
  }
  for (const o of overBudget) {
    if (plan.some((p) => p.title.endsWith(o.name))) continue;
    plan.push(
      o.fixed
        ? { emoji: "🧾", title: `Update the ${o.name} budget`, detail: `It's a bill and came in ${formatCents(o.overCents)} above budget — set the budget to the real amount so next month's numbers are accurate.`, href: `/budget` }
        : { emoji: "🚧", title: `${o.name} went ${formatCents(o.overCents)} over budget`, detail: "Cut back next month, or raise the budget if it was too tight to be realistic.", href: `/budget` },
    );
  }
  if (params.guiltFreeMonthlyCents && nw.want > params.guiltFreeMonthlyCents) {
    plan.push({ emoji: "🎉", title: `Keep wants under ${formatCents(params.guiltFreeMonthlyCents, { noCents: true })}`, detail: `Wants came to ${formatCents(nw.want)} — ${formatCents(nw.want - params.guiltFreeMonthlyCents)} over your guilt-free share.`, href: "/insights" });
  }
  if (income > 0 && leftOver < 0) {
    plan.push({ emoji: "⏸️", title: "Pause one want until you're back in the green", detail: `Spending beat income by ${formatCents(-leftOver)}. Your biggest want category is the easiest place to start.`, href: "/insights" });
  }
  const ideas = spendSmarterInsights({ today: to, txs, categories, guiltFreeMonthlyCents: null }).filter((i) => i.kind === "subscription" || i.kind === "frequent");
  for (const i of ideas.slice(0, 2)) plan.push({ emoji: i.kind === "subscription" ? "📺" : "☕", title: i.title, detail: i.detail, href: i.href });
  for (const r of spentLess.slice(0, 1)) {
    if (!r.id) continue;
    plan.push({ emoji: "🏆", title: `Keep ${r.name} low`, detail: `You spent ${formatCents(-r.delta)} less than last month — nice. Same again next month?`, href: "/budget" });
  }

  return {
    month, prevMonth, partial, daysCounted, income, spending, leftOver, prevIncome, prevSpending, savedCents, debtPaidCents,
    categories: rows, spentMore, spentLess, topCategory: rows.find((r) => r.cur > 0) ?? null,
    biggestPurchase: big ? { merchant: big.merchant, cents: -big.amountCents, date: big.date } : null,
    topMerchant, noSpendDays, overBudget, withinBudget, needsWants: nw, headline, nextMonth: plan.slice(0, 6), hasData,
  };
}

export const MONTH_EMOJI = ["❄️", "💘", "🍀", "🌷", "🌸", "☀️", "🎆", "🏖️", "🍎", "🎃", "🦃", "🎄"];
export const monthEmoji = (ym: YearMonth) => MONTH_EMOJI[Number(ym.slice(5, 7)) - 1];
