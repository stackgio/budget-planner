import { loadWorkspace } from "@/lib/workspace";
import { computeOverview, primaryAccount, scheduledBills, txLike } from "@/lib/overview";
import { addDays, addMonths, formatDate, formatMonth, isYearMonth, monthEnd, monthOf, monthStart, todayISO } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { accountBalance, spendingByCategory, spendingByMerchant, totalSpending } from "@/lib/ledger";
import { isScheduled, monthlyEquivalent, occurrencesBetween, projectCashFlow, type CashEvent } from "@/lib/bills";
import { allocate, paydaysBetween, paydaysInMonth } from "@/lib/paycheck";
import { normalizeMerchant } from "@/lib/csv";
import { Badge, Card, CardBody, CardHeader, Money, Notice, PageHeader, Table } from "@/components/ui";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { BalanceForecast, IncomeSpendingBars } from "@/components/charts";
import { cn } from "@/lib/utils";

export const metadata = { title: "Cash Flow" };

export default async function CashFlowPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const ws = await loadWorkspace();
  const sp = await searchParams;
  const today = todayISO();
  const current = monthOf(today);
  const month = isYearMonth(sp.month) ? sp.month : current;
  const s = ws.settings;
  const o = computeOverview(ws, month, today);
  const txs = txLike(ws);
  const primary = primaryAccount(ws);

  // --- Forecast: actual history (60 days) + projected (90 days) for the primary account
  const histStart = addDays(today, -60);
  const horizon = addDays(today, 90);
  const points: Array<{ date: string; label: string; actual: number | null; projected: number | null }> = [];
  let projection: ReturnType<typeof projectCashFlow> | null = null;
  let events: CashEvent[] = [];
  if (primary) {
    const dates = [...new Set([histStart, ...txs.filter((t) => t.accountId === primary.id && t.date >= histStart && t.date <= today).map((t) => t.date), today])].sort();
    for (const d of dates) {
      const b = accountBalance(primary.id, ws.snapshots, txs, d);
      points.push({ date: d, label: formatDate(d), actual: b, projected: d === today ? b : null });
    }
    if (s.anchorPayday) {
      for (const d of paydaysBetween(s.anchorPayday, addDays(today, 1), horizon, s.payIntervalDays)) {
        events.push({ date: d, amountCents: s.netPayCents, label: "Paycheck (expected)", kind: "income", projected: true });
        for (const p of allocate(s.netPayCents, ws.rules, { investingPaused: s.investingPaused }).parts) {
          if ((p.key === "investing" || p.key === "goals") && p.amountCents > 0) events.push({ date: d, amountCents: -p.amountCents, label: `${p.label} transfer (planned)`, kind: "planned", projected: true });
        }
      }
    }
    for (const oc of occurrencesBetween(scheduledBills(ws).filter((b) => !b.accountId || b.accountId === primary.id), addDays(today, 1), horizon)) {
      events.push({ date: oc.dueDate, amountCents: -oc.amountCents, label: oc.name, kind: "bill", projected: true });
    }
    projection = projectCashFlow(points.length ? points[points.length - 1].actual : null, events);
    for (const p of projection.points) points.push({ date: p.date, label: formatDate(p.date), actual: null, projected: p.balanceCents });
  }
  const hasBalance = primary ? accountBalance(primary.id, ws.snapshots, txs, today) !== null : false;

  // --- Month comparisons
  const prevMonth = addMonths(month, -1);
  const inMonth = (m: string) => txs.filter((t) => t.date >= monthStart(m) && t.date <= monthEnd(m));
  const cur = spendingByCategory(inMonth(month));
  const prev = spendingByCategory(inMonth(prevMonth));
  const catIds = [...new Set([...cur.keys(), ...prev.keys()])];
  const catName = (id: string | null) => (id ? (ws.categories.find((c) => c.id === id)?.name ?? "?") : "Uncategorized");
  const mom = catIds.map((id) => ({ id, name: catName(id), cur: cur.get(id) ?? 0, prev: prev.get(id) ?? 0 })).sort((a, b) => b.cur - a.cur);
  const merchants = spendingByMerchant(inMonth(month)).slice(0, 10);

  // --- Bars: actual months + projected upcoming months (dashed in table)
  const bars = o.trend.map((t) => ({ label: formatMonth(t.month, "short").split(" ")[0], income: t.income, spending: t.spending }));
  const upcomingMonths = s.anchorPayday ? [0, 1, 2, 3].map((i) => addMonths(current, i)).map((m) => {
    const days = paydaysInMonth(s.anchorPayday!, m, s.payIntervalDays);
    const bills = occurrencesBetween(scheduledBills(ws), monthStart(m), monthEnd(m)).reduce((a, x) => a + x.amountCents, 0);
    return { m, checks: days.length, income: days.length * s.netPayCents, bills };
  }) : [];

  // --- Recurring analysis
  const billMonthly = scheduledBills(ws).filter(isScheduled).reduce((a, b) => a + monthlyEquivalent(b), 0);
  const allBillsMonthly = ws.bills.filter((b) => b.active).reduce((a, b) => a + monthlyEquivalent(b), 0);
  const billNames = new Set(ws.bills.map((b) => normalizeMerchant(b.name)));
  const last3 = [0, 1, 2].map((i) => addMonths(current, -i));
  const repeat = new Map<string, { name: string; months: Set<string>; total: number }>();
  for (const t of txs) {
    if (t.type !== "expense" || !last3.includes(monthOf(t.date))) continue;
    const k = normalizeMerchant(t.merchant ?? "");
    const r = repeat.get(k) ?? { name: t.merchant ?? k, months: new Set(), total: 0 };
    r.months.add(monthOf(t.date));
    r.total += -t.amountCents;
    repeat.set(k, r);
  }
  const detected = [...repeat.entries()].filter(([k, r]) => r.months.size >= 2 && !billNames.has(k)).map(([, r]) => ({ ...r, avg: Math.round(r.total / r.months.size) })).sort((a, b) => b.avg - a.avg).slice(0, 8);

  return (
    <>
      <PageHeader title="Cash Flow" subtitle="Solid = what actually happened. Dashed/striped = projection from your schedule." actions={<MonthSwitcher month={month} current={current} basePath="/cashflow" />} />

      <Card>
        <CardHeader title={`${primary?.name ?? "Checking"} — balance forecast`} subtitle="Last 60 days actual, next 90 days projected from expected paychecks, scheduled bills, and planned investing/goal transfers. Day-to-day spending isn't projected." />
        <CardBody>
          {!primary ? <p className="text-sm text-muted">Add a checking account first.</p> : !hasBalance ? (
            <Notice tone="warn" title="Starting balance unknown">Enter your {primary.name} balance on the Accounts page. MoneyFlow won't project from an assumed $0.</Notice>
          ) : (
            <>
              <BalanceForecast points={points} />
              {projection?.firstNegative && <Notice tone="danger" className="mt-3" title={`Projected to go below $0 on ${formatDate(projection.firstNegative.date, "long")}`}>After “{projection.firstNegative.label}” the projected balance is {formatCents(projection.firstNegative.balanceCents)} — before any discretionary spending.</Notice>}
              {projection?.lowest && !projection.firstNegative && <p className="mt-2 text-xs text-muted">Lowest projected point: {formatCents(projection.lowest.balanceCents)} on {formatDate(projection.lowest.date)}.</p>}
            </>
          )}
        </CardBody>
      </Card>

      {projection && hasBalance && (
        <Card className="mt-4">
          <CardHeader title="Biweekly timeline — next 6 weeks" subtitle="Every projected event, in order" />
          <CardBody className="pt-2">
            <Table>
              <thead><tr><th>Date</th><th>Event</th><th className="text-right">Amount</th><th className="text-right">Projected balance</th></tr></thead>
              <tbody>
                {projection.points.filter((p) => p.date <= addDays(today, 42)).map((p, i) => (
                  <tr key={i} className={cn(p.kind === "income" && "bg-brand/5")}>
                    <td className="whitespace-nowrap">{formatDate(p.date, "weekday")}</td>
                    <td><span className="mr-2">{p.label}</span><Badge tone="forecast">{p.kind === "income" ? "expected" : p.kind === "bill" ? "bill" : "planned"}</Badge></td>
                    <td className={cn("text-right tabular", p.amountCents > 0 && "text-brand")}>{formatCents(p.amountCents, { sign: true })}</td>
                    <td className={cn("text-right tabular font-medium", (p.balanceCents ?? 0) < 0 && "text-danger")}>{formatCents(p.balanceCents)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Income vs spending" subtitle="Actual, last 6 months (transfers excluded)" />
          <CardBody><IncomeSpendingBars data={bars} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Projected months" subtitle="Expected paychecks from your schedule vs scheduled bills" />
          <CardBody className="pt-2">
            {upcomingMonths.length === 0 ? <p className="text-sm text-muted">Set your payday to project upcoming months.</p> : (
              <ul className="divide-y divide-border">
                {upcomingMonths.map((u) => (
                  <li key={u.m} className="forecast-stripe -mx-2 my-1 flex items-center justify-between rounded-lg px-2 py-2.5 text-sm">
                    <span className="font-medium">{formatMonth(u.m)} {u.checks === 3 && <Badge tone="info" className="ml-1">3 checks</Badge>}</span>
                    <span className="text-right tabular"><span className="text-brand">{formatCents(u.income)}</span><span className="text-muted"> in · {formatCents(u.bills)} bills</span></span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Month over month" subtitle={`${formatMonth(month)} vs ${formatMonth(prevMonth)}`} />
          <CardBody className="pt-2">
            {mom.length === 0 ? <p className="text-sm text-muted">No spending in either month.</p> : (
              <ul className="divide-y divide-border text-sm">
                {mom.map((r) => {
                  const d = r.cur - r.prev;
                  return (
                    <li key={r.id ?? "none"} className="flex items-center justify-between gap-2 py-2">
                      <span className="truncate">{r.name}</span>
                      <span className="flex items-center gap-3 tabular"><span className="text-muted">{formatCents(r.prev)}</span><span className="font-medium">{formatCents(r.cur)}</span><span className={cn("w-20 text-right text-xs", d > 0 ? "text-danger" : d < 0 ? "text-brand" : "text-muted")}>{d === 0 ? "—" : formatCents(d, { sign: true })}</span></span>
                    </li>
                  );
                })}
                <li className="flex justify-between py-2 font-semibold"><span>Total</span><span className="tabular">{formatCents(totalSpending(inMonth(prevMonth)))} → {formatCents(totalSpending(inMonth(month)))}</span></li>
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Top merchants" subtitle={formatMonth(month)} />
          <CardBody className="pt-2">
            {merchants.length === 0 ? <p className="text-sm text-muted">No spending recorded.</p> : (
              <ul className="divide-y divide-border text-sm">
                {merchants.map((m) => <li key={m.merchant} className="flex justify-between py-2"><span className="truncate">{m.merchant} <span className="text-xs text-muted">· {m.count}×</span></span><Money cents={m.cents} /></li>)}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Recurring expense analysis" />
        <CardBody className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-muted">Listed bills / month</p><p className="text-lg font-semibold tabular">{formatCents(allBillsMonthly)}</p></div>
            <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-muted">Share of normal month</p><p className="text-lg font-semibold tabular">{o.fig.normalMonth ? `${((allBillsMonthly / o.fig.normalMonth) * 100).toFixed(1)}%` : "—"}</p></div>
            <div className="rounded-xl bg-surface-2 p-3"><p className="text-xs text-muted">With due dates set</p><p className="text-lg font-semibold tabular">{formatCents(billMonthly)}</p></div>
          </div>
          <div>
            <p className="mb-1 font-medium">Repeating merchants not set up as bills</p>
            {detected.length === 0 ? <p className="text-muted">None detected in the last 3 months.</p> : (
              <ul className="divide-y divide-border">{detected.map((d) => <li key={d.name} className="flex justify-between py-1.5"><span>{d.name} <span className="text-xs text-muted">· {d.months.size} of 3 months</span></span><span className="tabular text-muted">~{formatCents(d.avg)}/mo</span></li>)}</ul>
            )}
          </div>
        </CardBody>
      </Card>
    </>
  );
}
