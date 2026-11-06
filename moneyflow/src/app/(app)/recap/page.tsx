import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { loadWorkspace } from "@/lib/workspace";
import { insightInputs, recapFixes, recapTxs } from "@/lib/overview";
import { addMonths, formatDate, formatMonth, isYearMonth, monthOf, todayISO } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { allocate, incomeFigures } from "@/lib/paycheck";
import { monthEmoji, monthRecap, type RecapAction } from "@/lib/recap";
import { categoryEmoji } from "@/lib/emoji";
import { Card, CardBody, CardHeader, EmptyState, LinkButton, Progress } from "@/components/ui";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { cn } from "@/lib/utils";

export const metadata = { title: "Monthly Recap" };

export default async function RecapPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const ws = await loadWorkspace();
  const sp = await searchParams;
  const today = todayISO();
  const current = monthOf(today);
  // Default to last month's full recap; the current month shows "so far".
  const month = isYearMonth(sp.month) ? sp.month : addMonths(current, -1);
  const { categories } = insightInputs(ws, month);
  const fig = incomeFigures(ws.settings.netPayCents, ws.settings.payIntervalDays);
  const gf = allocate(fig.normalMonth, ws.rules).parts.find((p) => p.key === "guiltfree")?.amountCents ?? null;
  const r = monthRecap({ month, today, txs: recapTxs(ws), categories, guiltFreeMonthlyCents: gf });
  const fixes = recapFixes(ws, month, today);
  const cat = (id: string | null) => ws.categories.find((c) => c.id === id);
  const short = (ym: string) => formatMonth(ym, "short").split(" ")[0];
  const nextName = formatMonth(addMonths(month, 1), "long").split(" ")[0];
  const future = month > current;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{monthEmoji(month)} Monthly recap{r.partial ? " · so far" : ""}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{formatMonth(month)}</h1>
        </div>
        <MonthSwitcher month={month} current={current} basePath="/recap" />
      </div>

      {future ? (
        <EmptyState title="🔮 That month hasn't happened yet">Check back once it starts.</EmptyState>
      ) : !r.hasData ? (
        <EmptyState title="💤 Nothing recorded this month" action={<LinkButton href="/transactions/new">Add a purchase</LinkButton>}>
          Log spending with the green <b>+</b> or import a bank CSV, and your recap fills itself in.
        </EmptyState>
      ) : (
        <>
          <Card className="overflow-hidden border-brand/30 bg-gradient-to-br from-brand/10 via-transparent to-transparent">
            <CardBody>
              <p className="text-3xl" aria-hidden>{r.headline.emoji}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight">{r.headline.text}</p>
              {r.partial && <p className="mt-1 text-sm text-muted">First {r.daysCounted} days, compared with the same days of {short(r.prevMonth)}.</p>}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Big label="💵 Came in" cents={r.income} prev={r.prevIncome} goodWhenUp />
                <Big label="💸 Spent" cents={r.spending} prev={r.prevSpending} />
                <Big label={r.leftOver >= 0 ? "🐷 Left over" : "😬 Short by"} cents={Math.abs(r.leftOver)} tone={r.leftOver >= 0 ? "brand" : "danger"} />
              </div>
              {(r.savedCents > 0 || r.debtPaidCents > 0) && (
                <p className="mt-3 text-sm text-muted">
                  {r.savedCents > 0 && <>📈 Saved & invested <b className="text-fg">{formatCents(r.savedCents)}</b></>}
                  {r.savedCents > 0 && r.debtPaidCents > 0 && " · "}
                  {r.debtPaidCents > 0 && <>💳 Paid down debt <b className="text-fg">{formatCents(r.debtPaidCents)}</b></>}
                </p>
              )}
            </CardBody>
          </Card>

          <h2 className="mb-2 mt-6 text-lg font-semibold">🏅 Highlights</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {r.topCategory && <Fact emoji={categoryEmoji(cat(r.topCategory.id) ?? { name: r.topCategory.name })} label="Top category" value={r.topCategory.name} sub={formatCents(r.topCategory.cur)} />}
            {r.biggestPurchase && <Fact emoji="💥" label="Biggest purchase" value={r.biggestPurchase.merchant} sub={`${formatCents(r.biggestPurchase.cents)} · ${formatDate(r.biggestPurchase.date)}`} />}
            {r.topMerchant && <Fact emoji="📍" label="Most visited" value={r.topMerchant.name} sub={`${r.topMerchant.count}× · ${formatCents(r.topMerchant.cents)}`} />}
            <Fact emoji="🧘" label="No-spend days" value={`${r.noSpendDays} of ${r.daysCounted}`} sub={r.noSpendDays >= r.daysCounted / 2 ? "Nice restraint!" : "Days with zero purchases"} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="📈 Spent more on" subtitle={`vs ${short(r.prevMonth)}`} />
              <CardBody className="pt-2">
                {r.spentMore.length === 0 ? <p className="text-sm text-muted">Nothing went up by more than $5. 🎉</p> : <Changes rows={r.spentMore} cat={cat} />}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="📉 Spent less on" subtitle="Your wins" />
              <CardBody className="pt-2">
                {r.spentLess.length === 0 ? <p className="text-sm text-muted">No category dropped by more than $5 this time.</p> : <Changes rows={r.spentLess} cat={cat} />}
              </CardBody>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="🎯 Budget scorecard" subtitle={r.overBudget.length + r.withinBudget ? `${r.withinBudget} on track · ${r.overBudget.length} over` : "No category budgets set"} />
              <CardBody className="pt-2">
                {r.overBudget.length + r.withinBudget === 0 ? (
                  <LinkButton href="/budget" variant="outline" size="sm">Set category budgets</LinkButton>
                ) : (
                  <>
                    <Progress value={r.withinBudget} max={r.withinBudget + r.overBudget.length} tone={r.overBudget.length ? "warn" : "brand"} />
                    <ul className="mt-3 space-y-1.5 text-sm">
                      {r.overBudget.map((o) => <li key={o.id} className="flex justify-between"><span>{categoryEmoji(cat(o.id))} {o.name}</span><span className="tabular text-danger">+{formatCents(o.overCents)} over</span></li>)}
                      {r.overBudget.length === 0 && <li className="text-brand">Every budget stayed on track. 🙌</li>}
                    </ul>
                  </>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="⚖️ Needs vs. wants" subtitle={formatMonth(month)} />
              <CardBody className="pt-2">
                {(() => {
                  const nw = r.needsWants;
                  const total = nw.need + nw.want + nw.unclassified || 1;
                  return (
                    <>
                      <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
                        <span className="bg-brand" style={{ width: `${(Math.max(0, nw.need) / total) * 100}%` }} />
                        <span className="bg-info" style={{ width: `${(Math.max(0, nw.want) / total) * 100}%` }} />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div><p className="text-muted">🧾 Needs</p><p className="font-semibold tabular">{formatCents(nw.need)}</p></div>
                        <div><p className="text-muted">🎉 Wants</p><p className="font-semibold tabular">{formatCents(nw.want)}{gf ? <span className="block text-xs font-normal text-muted">plan: {formatCents(gf, { noCents: true })}/mo</span> : null}</p></div>
                      </div>
                    </>
                  );
                })()}
              </CardBody>
            </Card>
          </div>

          <Card className="mt-4 border-brand/40">
            <CardHeader title={`🚀 Game plan for ${nextName}`} subtitle="Built from this month's numbers" />
            <CardBody className="pt-1">
              {r.nextMonth.length === 0 ? <p className="text-sm text-muted">Nothing to change — keep doing what you did this month. ✨</p> : <Actions items={r.nextMonth} />}
            </CardBody>
          </Card>

          {fixes.length > 0 && (
            <Card className="mt-4">
              <CardHeader title="🛠️ Quick fixes" subtitle="Clean-up that makes next month's recap sharper" />
              <CardBody className="pt-1"><Actions items={fixes} /></CardBody>
            </Card>
          )}
        </>
      )}
    </>
  );
}

function Big({ label, cents, prev, goodWhenUp, tone }: { label: string; cents: number; prev?: number; goodWhenUp?: boolean; tone?: "brand" | "danger" }) {
  const d = prev !== undefined && prev > 0 ? cents - prev : null;
  const good = d !== null && (goodWhenUp ? d > 0 : d < 0);
  return (
    <div className="min-w-0 rounded-xl bg-surface/70 p-2.5">
      <p className="truncate text-[11.5px] font-medium text-muted">{label}</p>
      <p className={cn("mt-0.5 truncate text-lg font-semibold tabular", tone === "brand" && "text-brand", tone === "danger" && "text-danger")}>{formatCents(cents, { noCents: cents >= 100_000 })}</p>
      {d !== null && d !== 0 && <p className={cn("truncate text-[11px] tabular", good ? "text-brand" : "text-warn")}>{d > 0 ? "▲" : "▼"} {formatCents(Math.abs(d), { noCents: true })}</p>}
    </div>
  );
}

function Fact({ emoji, label, value, sub }: { emoji: string; label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-surface p-3.5 animate-fade-up">
      <p className="text-2xl" aria-hidden>{emoji}</p>
      <p className="mt-1 text-[11.5px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="truncate font-semibold">{value}</p>
      <p className="truncate text-xs text-muted">{sub}</p>
    </div>
  );
}

function Changes({ rows, cat }: { rows: Array<{ id: string | null; name: string; cur: number; prev: number; delta: number }>; cat: (id: string | null) => { name: string; bucket: string; emoji: string | null } | undefined }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((r) => (
        <li key={r.id ?? "none"} className="flex items-center gap-3 py-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg" aria-hidden>{categoryEmoji(cat(r.id) ?? { name: r.name })}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{r.name}</span>
            <span className="text-xs text-muted tabular">{formatCents(r.prev)} → {formatCents(r.cur)}</span>
          </span>
          <span className={cn("text-sm font-semibold tabular", r.delta > 0 ? "text-warn" : "text-brand")}>{r.delta > 0 ? "+" : "−"}{formatCents(Math.abs(r.delta))}</span>
        </li>
      ))}
    </ul>
  );
}

function Actions({ items }: { items: RecapAction[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((a) => (
        <li key={a.title}>
          <Link href={a.href} className="flex items-start gap-3 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg" aria-hidden>{a.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{a.title}</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">{a.detail}</span>
            </span>
            <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
