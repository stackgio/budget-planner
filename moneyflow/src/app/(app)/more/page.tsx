import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { NAV } from "@/components/shell/nav-items";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "More" };
const DESC: Record<string, string> = {
  "/": "Overview of this month", "/paycheck": "Plan each biweekly paycheck", "/budget": "Allocations & category budgets", "/transactions": "Search, add, import, export", "/insights": "💡 Ideas to cut spending, needs vs wants", "/recap": "📅 Your month in review + next month's game plan",
  "/accounts": "Balances & net worth", "/bills": "Recurring bills & reserves", "/cashflow": "Forecasts & trends", "/debt": "Payoff plans & utilization",
  "/goals": "Savings goals", "/investments": "Holdings & contributions", "/settings": "Workspace, security, preferences",
};
export default function More() {
  return (
    <>
      <PageHeader title="Everything" />
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="flex items-center justify-between px-4 py-3.5 active:bg-surface-2">
            <div><p className="font-medium">{n.label}</p><p className="text-xs text-muted">{DESC[n.href]}</p></div>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        ))}
      </div>
    </>
  );
}
