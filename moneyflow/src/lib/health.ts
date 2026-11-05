import { formatCents, type Cents } from "./money";
import { formatDate, type ISODate } from "./dates";
import type { BillFundingStatus } from "./bills";

export type Severity = "critical" | "warning" | "info";

export interface Warning {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  action: { label: string; href: string };
}

export interface HealthInput {
  today: ISODate;
  /** Known available cash in spending accounts, null if any is unknown and none known. */
  availableCashCents: Cents | null;
  unknownCashAccounts: number;
  nextPayday: ISODate | null;
  billsBeforeNextPaydayCents: Cents;
  billsBeforeNextPayday: Array<{ name: string; dueDate: ISODate; amountCents: Cents }>;
  categories: Array<{ id: string; name: string; budgetCents: Cents | null; spentCents: Cents; fixed?: boolean }>;
  /** fraction of the month elapsed, 0..1 */
  monthProgress: number;
  funding: BillFundingStatus[];
  emergency: { targetCents: Cents | null; savedCents: Cents | null };
  unassignedCents: Cents; // across received paychecks in the current period
  upcomingDebtPayments: Array<{ name: string; dueDate: ISODate | null; minPaymentCents: Cents | null }>;
  unverifiedCount: number;
  anchorSet: boolean;
  needsMarginCents: Cents | null; // needs budget - listed recurring needs
}

/** Every warning is derived from the user's data — no generic tips, no invented insights. */
export function budgetHealth(h: HealthInput): Warning[] {
  const w: Warning[] = [];

  if (!h.anchorSet) {
    w.push({ id: "anchor", severity: "warning", title: "Set your payday", detail: "Paydays, three-paycheck months, and bill funding can't be calculated until you enter one known payday.", action: { label: "Set payday", href: "/paycheck#anchor" } });
  }

  if (h.unverifiedCount > 0) {
    w.push({ id: "unverified", severity: "info", title: `${h.unverifiedCount} unconfirmed amount${h.unverifiedCount === 1 ? "" : "s"}`, detail: "Some bills, accounts, or goals still use estimated amounts that you haven't reviewed.", action: { label: "Review", href: "/welcome" } });
  }

  if (h.availableCashCents === null) {
    if (h.billsBeforeNextPaydayCents > 0)
      w.push({ id: "cash-unknown", severity: "warning", title: "Cash balance unknown", detail: `${formatCents(h.billsBeforeNextPaydayCents)} in bills are due before your next payday, but no checking balance has been entered, so MoneyFlow can't tell if they're covered.`, action: { label: "Enter balance", href: "/accounts" } });
  } else if (h.billsBeforeNextPaydayCents > h.availableCashCents) {
    const short = h.billsBeforeNextPaydayCents - h.availableCashCents;
    w.push({ id: "bills-exceed-cash", severity: "critical", title: "Bills exceed available cash", detail: `${formatCents(h.billsBeforeNextPaydayCents)} due before ${h.nextPayday ? formatDate(h.nextPayday) : "next payday"} vs ${formatCents(h.availableCashCents)} available — short ${formatCents(short)}.`, action: { label: "See bills", href: "/bills" } });
  }

  for (const c of h.categories) {
    if (c.budgetCents === null || c.budgetCents <= 0) continue;
    if (c.spentCents > c.budgetCents) {
      w.push({ id: `over-${c.id}`, severity: "warning", title: `${c.name} over budget`, detail: `Spent ${formatCents(c.spentCents)} of ${formatCents(c.budgetCents)} (${formatCents(c.spentCents - c.budgetCents)} over).`, action: { label: "Adjust budget", href: "/budget" } });
    } else if (!c.fixed && h.monthProgress > 0.1 && h.monthProgress < 0.95) {
      // Pace checks only make sense for flexible spending; fixed bills arrive in lumps.
      const pace = c.spentCents / c.budgetCents;
      if (pace > h.monthProgress + 0.25 && c.spentCents > 0) {
        w.push({ id: `pace-${c.id}`, severity: "info", title: `${c.name} spending faster than planned`, detail: `${Math.round(pace * 100)}% of the budget used with ${Math.round(h.monthProgress * 100)}% of the month gone.`, action: { label: "View category", href: `/transactions?category=${c.id}` } });
      }
    }
  }

  const gaps = h.funding.filter((f) => f.status === "gap");
  if (gaps.length) {
    const total = gaps.reduce((a, g) => a + g.gapCents, 0);
    w.push({ id: "underfunded", severity: "warning", title: `${gaps.length} bill${gaps.length === 1 ? "" : "s"} underfunded`, detail: `${gaps.map((g) => `${g.name} (${formatDate(g.dueDate)})`).join(", ")} — ${formatCents(total)} not covered by confirmed reserves plus planned paychecks before the due date.`, action: { label: "Fund bills", href: "/bills#funding" } });
  }

  if (h.emergency.targetCents !== null && h.emergency.targetCents > 0) {
    const saved = h.emergency.savedCents ?? 0;
    if (saved < h.emergency.targetCents) {
      w.push({ id: "emergency", severity: saved < h.emergency.targetCents / 4 ? "warning" : "info", title: "Emergency fund below target", detail: `${formatCents(saved)} saved of your ${formatCents(h.emergency.targetCents)} target (${Math.round((saved / h.emergency.targetCents) * 100)}%).`, action: { label: "Open goals", href: "/goals" } });
    }
  }

  if (h.unassignedCents > 0) {
    w.push({ id: "unassigned", severity: "info", title: `${formatCents(h.unassignedCents)} unassigned`, detail: "Received paycheck money that hasn't been given a job yet.", action: { label: "Assign dollars", href: "/paycheck" } });
  }

  for (const d of h.upcomingDebtPayments) {
    w.push({ id: `debt-${d.name}`, severity: "info", title: `${d.name} payment due ${d.dueDate ? formatDate(d.dueDate) : ""}`.trim(), detail: d.minPaymentCents !== null ? `Minimum payment ${formatCents(d.minPaymentCents)}.` : "Minimum payment not entered yet.", action: { label: "Debt plan", href: "/debt" } });
  }

  if (h.needsMarginCents !== null && h.needsMarginCents < 5000) {
    w.push({ id: "needs-margin", severity: h.needsMarginCents < 0 ? "critical" : "warning", title: h.needsMarginCents < 0 ? "Listed needs exceed the Needs budget" : "Very small Needs margin", detail: `Only ${formatCents(h.needsMarginCents)} of the monthly Needs budget is left after listed recurring expenses. Groceries, utilities, and other essentials may not all be represented yet.`, action: { label: "Review bills", href: "/bills" } });
  }

  const rank: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
  return w.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
