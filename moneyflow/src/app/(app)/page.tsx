import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, CreditCard, PiggyBank, Wallet, Banknote, ShoppingBag, Scale, Hourglass, Target, Landmark } from "lucide-react";
import { loadWorkspace } from "@/lib/workspace";
import { computeOverview } from "@/lib/overview";
import { diffDays, formatDate, formatMonth, isYearMonth, monthOf, todayISO } from "@/lib/dates";
import { Badge, Card, CardBody, CardHeader, LinkButton, Money, PageHeader, Progress, Stat } from "@/components/ui";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { Warnings } from "@/components/Warnings";
import { TxList } from "@/components/TxList";
import { SpendingDonut } from "@/components/charts";
import { formatCents } from "@/lib/money";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const ws = await loadWorkspace();
  if (ws.user.mode === "personal" && !ws.user.onboardedAt) redirect("/welcome");
  const sp = await searchParams;
  const today = todayISO();
  const current = monthOf(today);
  const month = isYearMonth(sp.month) ? sp.month : current;
  const o = computeOverview(ws, month, today);
  const isCurrent = month === current;
  const donut = o.catRows.filter((c) => c.spentCents > 0).sort((a, b) => b.spentCents - a.spentCents).map((c) => ({ name: c.name, value: c.spentCents, color: c.color }));
  if (o.uncategorized > 0) donut.push({ name: "Uncategorized", value: o.uncategorized, color: "#94a3b8" });
  const unknownCash = o.cash.unknown.length > 0 && o.cash.cents === 0;
  const debtPaid = o.debtStart - o.debtOwed;

  return (
    <>
      <PageHeader
        title={isCurrent ? "Good to see you" : formatMonth(month)}
        subtitle={isCurrent ? `${formatDate(today, "long")} · ${ws.user.mode === "demo" ? "Demo workspace" : "Personal workspace"}` : "Viewing a past or future month"}
        actions={<MonthSwitcher month={month} current={current} basePath="/" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Available cash" icon={<Wallet className="h-3.5 w-3.5" />} href="/accounts"
          hint={o.cash.unknown.length ? `${o.cash.unknown.length} account${o.cash.unknown.length > 1 ? "s" : ""} without a balance` : "Checking + cash. Credit isn't cash."}>
          {unknownCash ? <span className="text-muted">Not set</span> : <Money cents={o.cash.cents} />}
        </Stat>
        <Stat label="Next payday" icon={<CalendarClock className="h-3.5 w-3.5" />} href="/paycheck"
          hint={o.next ? `in ${diffDays(o.next, today)} day${diffDays(o.next, today) === 1 ? "" : "s"} · ${formatCents(ws.settings.netPayCents)} expected` : "Set a known payday"}>
          {o.next ? formatDate(o.next, "weekday") : <span className="text-muted">Not set</span>}
        </Stat>
        <Stat label="Until next paycheck" icon={<Hourglass className="h-3.5 w-3.5" />} href="/paycheck"
          hint={o.primaryBal === null ? `Enter your ${o.primary?.name ?? "checking"} balance` : `After ${formatCents(o.billsBeforeNextCents)} in bills due first`}>
          {o.untilNext === null ? <span className="text-muted">Unknown</span> : <Money cents={o.untilNext} className={o.untilNext < 0 ? "text-danger" : ""} />}
        </Stat>
        <Stat label="Net worth" icon={<Scale className="h-3.5 w-3.5" />} href="/accounts"
          hint={o.nw.unknownAccounts.length ? `${o.nw.unknownAccounts.length} account${o.nw.unknownAccounts.length > 1 ? "s" : ""} excluded (no balance)` : "Assets − debts"}>
          <Money cents={o.nw.netWorth} />
        </Stat>
        <Stat label={`Income ${isCurrent ? "this month" : "received"}`} icon={<Banknote className="h-3.5 w-3.5" />} href={`/transactions?month=${month}&type=income`} hint="Actual deposits recorded">
          <Money cents={o.incomeReceived} />
        </Stat>
        <Stat label={`Spending ${isCurrent ? "this month" : ""}`.trim()} icon={<ShoppingBag className="h-3.5 w-3.5" />} href={`/transactions?month=${month}&type=expense`} hint="Excludes transfers & card payments">
          <Money cents={o.spending} />
        </Stat>
        <Stat label="Budget remaining" icon={<PiggyBank className="h-3.5 w-3.5" />} href={`/budget?month=${month}`}
          hint={o.budgetRemaining === null ? "Set category budgets" : `of ${formatCents(o.budgetTotal, { noCents: true })} budgeted`}>
          {o.budgetRemaining === null ? <span className="text-muted">No budgets</span> : <Money cents={o.budgetRemaining} className={o.budgetRemaining < 0 ? "text-danger" : ""} />}
        </Stat>
        <Stat label="Bills before payday" icon={<CalendarClock className="h-3.5 w-3.5" />} href="/bills" hint={`${o.billsBeforeNext.length} bill${o.billsBeforeNext.length === 1 ? "" : "s"} due${o.next ? ` before ${formatDate(o.next)}` : " in 2 weeks"}`}>
          <Money cents={o.billsBeforeNextCents} />
        </Stat>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Budget health" subtitle="Warnings come only from your own data" action={<LinkButton href="/budget" variant="ghost" size="sm">Budget</LinkButton>} />
          <CardBody className="pt-1"><Warnings items={o.warnings} limit={5} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Next bills due" subtitle={o.next ? `Before ${formatDate(o.next, "weekday")}` : "Next 14 days"} action={<LinkButton href="/bills" variant="ghost" size="sm">All bills</LinkButton>} />
          <CardBody className="pt-2">
            {o.upcomingBills.length === 0 ? (
              <p className="text-sm text-muted">{ws.bills.some((b) => b.dueDay === null) ? "Add due days to your bills to see what's coming up." : "Nothing due in the next 30 days."}</p>
            ) : (
              <ul className="space-y-2.5">
                {o.upcomingBills.slice(0, 6).map((b) => {
                  const beforePay = o.next ? b.dueDate < o.next : false;
                  return (
                    <li key={b.billId + b.dueDate} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{b.name}</p>
                        <p className="text-xs text-muted">{formatDate(b.dueDate, "weekday")}{beforePay && <span className="ml-1.5 text-warn">· before payday</span>}</p>
                      </div>
                      <Money cents={b.amountCents} />
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Spending by category" subtitle={formatMonth(month)} />
          <CardBody>
            <SpendingDonut data={donut} total={o.spending} />
            <ul className="mt-3 space-y-1.5">
              {donut.slice(0, 5).map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="flex-1 truncate">{d.name}</span>
                  <Money cents={d.value} className="text-muted" />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Savings progress" subtitle={o.goalTarget ? `${formatCents(o.goalSavedTotal, { noCents: true })} of ${formatCents(o.goalTarget, { noCents: true })}` : "Set goal targets to track progress"} action={<LinkButton href="/goals" variant="ghost" size="sm">Goals</LinkButton>} />
          <CardBody className="space-y-3.5">
            {o.goals.slice(0, 4).map((g) => (
              <div key={g.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium"><Target className="h-3.5 w-3.5 text-brand" />{g.name}</span>
                  <span className="text-muted tabular">{formatCents(g.savedCents, { noCents: true })}{g.targetCents ? ` / ${formatCents(g.targetCents, { noCents: true })}` : ""}</span>
                </div>
                {g.targetCents ? <Progress value={g.savedCents} max={g.targetCents} /> : <p className="text-xs text-muted">No target set</p>}
              </div>
            ))}
            {o.goals.length === 0 && <p className="text-sm text-muted">No goals yet.</p>}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Debt payoff" subtitle={o.debts.some((d) => d.owedCents === null) ? `${o.debts.filter((d) => d.owedCents === null).length} balance${o.debts.filter((d) => d.owedCents === null).length > 1 ? "s" : ""} not entered` : `${formatCents(o.debtOwed)} owed`} action={<LinkButton href="/debt" variant="ghost" size="sm">Plan</LinkButton>} />
          <CardBody className="space-y-3">
            {o.debtStart > 0 && (
              <div>
                <div className="mb-1 flex justify-between text-sm"><span>Paid down since tracking</span><Money cents={debtPaid} className="font-medium text-brand" /></div>
                <Progress value={debtPaid} max={o.debtStart} />
              </div>
            )}
            <ul className="space-y-2">
              {o.debts.slice(0, 5).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 shrink-0 text-muted" /><span className="truncate">{d.name}</span></span>
                  <span className="flex shrink-0 items-center gap-2">
                    {d.util.utilizationBps !== null && <Badge tone={d.util.utilizationBps > 3000 ? "warn" : "neutral"}>{Math.round(d.util.utilizationBps / 100)}%</Badge>}
                    {d.owedCents === null ? <span className="text-muted">Unknown</span> : <Money cents={d.owedCents} />}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Recent transactions" action={<div className="flex gap-2"><LinkButton href="/transactions/new" size="sm">Add</LinkButton><LinkButton href="/transactions" variant="outline" size="sm">View all</LinkButton></div>} />
        <CardBody className="pt-1">
          <TxList txs={o.recent} categories={ws.categories} accounts={ws.accounts} />
          {o.recent.length === 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <LinkButton href="/transactions/new" size="sm">Add a transaction</LinkButton>
              <LinkButton href="/transactions/import" variant="outline" size="sm">Import bank CSV</LinkButton>
              <LinkButton href="/accounts" variant="outline" size="sm"><Landmark className="h-4 w-4" />Enter balances</LinkButton>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
