import Link from "next/link";
import { Lightbulb, Sparkles, TrendingDown } from "lucide-react";
import { loadWorkspace } from "@/lib/workspace";
import { insightInputs, paydayIncome } from "@/lib/overview";
import { addDays, addMonths, formatDate, formatMonth, monthEnd, monthOf, monthStart, todayISO } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { allocate, incomeFigures, nextPayday, previousPayday } from "@/lib/paycheck";
import { guiltFreePace, largestPurchases, needsVsWants, spendSmarterInsights, weeklyTip } from "@/lib/insights";
import { Badge, Card, CardBody, CardHeader, EmptyState, LinkButton, Money, Notice, PageHeader, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Spend Smarter" };

export default async function InsightsPage() {
  const ws = await loadWorkspace();
  const s = ws.settings;
  const today = todayISO();
  const month = monthOf(today);
  const lastMonth = addMonths(month, -1);
  const { categories, txs } = insightInputs(ws, month);
  const fig = incomeFigures(s.netPayCents, s.payIntervalDays);
  const gfMonthly = allocate(fig.normalMonth, ws.rules).parts.find((p) => p.key === "guiltfree")?.amountCents ?? null;
  const ideas = spendSmarterInsights({ today, txs, categories, guiltFreeMonthlyCents: gfMonthly });
  const tip = weeklyTip(ideas);
  const potential = ideas.reduce((a, i) => a + (i.monthlySavingsCents ?? 0), 0);
  const nwNow = needsVsWants(txs, categories, monthStart(month), today);
  const nwLast = needsVsWants(txs, categories, monthStart(lastMonth), monthEnd(lastMonth));
  const untagged = ws.transactions.filter((t) => t.type === "expense" && !t.necessity && t.date >= monthStart(month)).length;
  const biggest = largestPurchases(txs, monthStart(month), today);
  const catName = (id: string | null) => ws.categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  // Guilt-free money left this pay period
  let pace: ReturnType<typeof guiltFreePace> | null = null;
  let period: { last: string; next: string } | null = null;
  if (s.anchorPayday) {
    const last = previousPayday(s.anchorPayday, addDays(today, 1), s.payIntervalDays);
    const next = nextPayday(s.anchorPayday, addDays(today, 1), s.payIntervalDays);
    const inc = paydayIncome(ws, last, last)[0];
    const income = inc ? (inc.actualCents ?? inc.expectedCents) : s.netPayCents;
    const allowance = allocate(income, ws.rules).parts.find((p) => p.key === "guiltfree")?.amountCents ?? 0;
    pace = guiltFreePace({ today, lastPayday: last, nextPayday: next, allowanceCents: allowance, txs, categories });
    period = { last, next };
  }
  const hasSpending = txs.some((t) => t.type === "expense");

  return (
    <>
      <PageHeader title="Spend Smarter 💡" subtitle="Ideas built only from your own transactions — no generic advice." />

      {!hasSpending ? (
        <EmptyState title="Add a few purchases to get ideas" action={<LinkButton href="/transactions/new">Add a purchase</LinkButton>}>
          Tap the green <b>+</b> button to log spending in seconds, or import a bank CSV. Ideas appear once there's real data to learn from.
        </EmptyState>
      ) : (
        <>
          {tip ? (
            <Card className="border-brand/40 bg-gradient-to-br from-brand/10 to-transparent">
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand"><Lightbulb className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand">This week&apos;s idea</p>
                    <p className="mt-1 text-lg font-semibold leading-snug">{tip.title}</p>
                    <p className="mt-1 text-sm text-muted">{tip.detail}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {tip.monthlySavingsCents !== null && <Badge tone="brand">Save ~{formatCents(tip.monthlySavingsCents, { noCents: tip.monthlySavingsCents >= 10_000 })}/mo</Badge>}
                      <Link href={tip.href} className="text-sm font-medium text-brand">See the purchases →</Link>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Notice tone="brand" title="Nothing stands out right now">Your recent spending looks in line with your usual and your budgets. Check back after more purchases.</Notice>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Guilt-free money left" subtitle={period ? `This pay period · ${formatDate(period.last)} – ${formatDate(addDays(period.next, -1))}` : "Set your payday to track this"} />
              <CardBody>
                {pace ? (
                  <>
                    <div className="flex items-end justify-between">
                      <Money cents={pace.leftCents} className={cn("text-3xl font-semibold tracking-tight", pace.leftCents < 0 && "text-danger")} />
                      {pace.leftCents > 0 && <p className="text-right text-sm text-muted">about <b className="text-fg">{formatCents(pace.perDayCents)}</b>/day<br />for {pace.daysLeft} day{pace.daysLeft === 1 ? "" : "s"}</p>}
                    </div>
                    <Progress className="mt-3" value={pace.wantSpentCents} max={pace.allowanceCents || 1} tone={pace.leftCents < 0 ? "danger" : pace.wantSpentCents > pace.allowanceCents * 0.8 ? "warn" : "brand"} />
                    <p className="mt-1.5 text-xs text-muted">{formatCents(pace.wantSpentCents)} of {formatCents(pace.allowanceCents)} guilt-free spent on wants since payday.{pace.leftCents < 0 ? " You're over — pause wants until the next check." : ""}</p>
                  </>
                ) : (
                  <LinkButton href="/paycheck#anchor" variant="outline" size="sm">Set my payday</LinkButton>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Needs vs. wants" subtitle={`${formatMonth(month)} so far vs ${formatMonth(lastMonth, "short")}`} />
              <CardBody className="space-y-3">
                {[{ label: formatMonth(month, "short"), nw: nwNow }, { label: formatMonth(lastMonth, "short"), nw: nwLast }].map(({ label, nw }) => {
                  const total = nw.need + nw.want + nw.unclassified;
                  const pct = (v: number) => (total > 0 ? (Math.max(0, v) / total) * 100 : 0);
                  return (
                    <div key={label}>
                      <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{label}</span><span className="tabular text-muted">{formatCents(total)}</span></div>
                      <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
                        <span className="bg-brand" style={{ width: `${pct(nw.need)}%` }} />
                        <span className="bg-info" style={{ width: `${pct(nw.want)}%` }} />
                        <span className="bg-muted/40" style={{ width: `${pct(nw.unclassified)}%` }} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
                        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-brand" />Needs {formatCents(nw.need)}</span>
                        <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-info" />Wants {formatCents(nw.want)}</span>
                        {nw.unclassified > 0 && <span><i className="mr-1 inline-block h-2 w-2 rounded-sm bg-muted/40" />Unsure {formatCents(nw.unclassified)}</span>}
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-muted">
                  Tagged purchases use your Need/Want choice; untagged ones follow their category (Needs → need, Guilt-free → want).
                  {untagged > 0 && <> {untagged} purchase{untagged === 1 ? "" : "s"} this month {untagged === 1 ? "isn't" : "aren't"} tagged — <Link className="text-brand" href={`/transactions?month=${month}&type=expense`}>tag them</Link> for sharper ideas.</>}
                </p>
              </CardBody>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader title="Ideas to spend smarter" subtitle={ideas.length ? `Together worth up to ~${formatCents(potential, { noCents: true })} a month (estimates — you decide what's worth it)` : "No opportunities found in your recent spending"} />
            <CardBody className="pt-1">
              {ideas.length === 0 ? <p className="text-sm text-muted">Nothing is running above your usual, over budget, or repeating unnoticed.</p> : (
                <ul className="divide-y divide-border">
                  {ideas.map((i) => (
                    <li key={i.id}>
                      <Link href={i.href} className="flex items-start gap-3 py-3">
                        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">{i.kind === "subscription" ? <Sparkles className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{i.title}</p>
                          <p className="mt-0.5 text-[13px] leading-snug text-muted">{i.detail}</p>
                        </div>
                        {i.monthlySavingsCents !== null && <span className="shrink-0 text-right text-sm font-semibold text-brand tabular">~{formatCents(i.monthlySavingsCents, { noCents: i.monthlySavingsCents >= 10_000 })}<span className="block text-[11px] font-normal text-muted">/month</span></span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader title="Largest purchases" subtitle={formatMonth(month)} />
            <CardBody className="pt-1">
              {biggest.length === 0 ? <p className="text-sm text-muted">No purchases this month yet.</p> : (
                <ul className="divide-y divide-border">
                  {biggest.map((t) => {
                    const tag = ws.transactions.find((x) => x.id === t.id)?.necessity;
                    return (
                      <li key={t.id}>
                        <Link href={`/transactions/${t.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                          <span className="min-w-0"><span className="block truncate font-medium">{t.merchant}</span><span className="text-xs text-muted">{formatDate(t.date)} · {catName(t.categoryId)}</span></span>
                          <span className="flex shrink-0 items-center gap-2">{tag && <Badge tone={tag === "want" ? "info" : "brand"}>{tag}</Badge>}<Money cents={-t.amountCents} className="font-medium" /></span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </>
  );
}
