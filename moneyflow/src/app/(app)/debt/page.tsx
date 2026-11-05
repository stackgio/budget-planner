import { loadWorkspace } from "@/lib/workspace";
import { computeOverview, primaryAccount } from "@/lib/overview";
import { diffDays, formatMonth, monthOf, todayISO } from "@/lib/dates";
import { centsToDecimalString, formatCents, parseDollars } from "@/lib/money";
import { simulatePayoff, type Strategy } from "@/lib/debt";
import { saveTransaction, updateDebtTerms } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { SubmitButton } from "@/components/shell/SubmitButton";
import { Badge, Card, CardBody, CardHeader, Checkbox, Details, Field, Input, LinkButton, Money, MoneyInput, Notice, PageHeader, Progress, Select, Stat } from "@/components/ui";
import { DebtPayoffChart } from "@/components/charts";
import { cn } from "@/lib/utils";

export const metadata = { title: "Debt" };

export default async function DebtPage({ searchParams }: { searchParams: Promise<{ extra?: string; strategy?: string }> }) {
  const ws = await loadWorkspace();
  const sp = await searchParams;
  const today = todayISO();
  const o = computeOverview(ws, monthOf(today), today);
  const debts = o.debts;
  const extra = Math.max(0, parseDollars(sp.extra ?? "") ?? 0);
  const strategy: Strategy = sp.strategy === "snowball" ? "snowball" : "avalanche";
  const inputs = debts.map((d) => ({ id: d.id, name: d.name, balanceCents: d.owedCents, aprBps: d.aprBps, minPaymentCents: d.minPaymentCents }));
  const start = monthOf(today);
  const snow = simulatePayoff(inputs, extra, "snowball", start);
  const ava = simulatePayoff(inputs, extra, "avalanche", start);
  const base = simulatePayoff(inputs, 0, strategy, start);
  const chosen = strategy === "snowball" ? snow : ava;
  const len = Math.max(snow.schedule.length, ava.schedule.length);
  const series = Array.from({ length: len }, (_, i) => ({ label: formatMonth((snow.schedule[i] ?? ava.schedule[i]).month, "short"), snowball: snow.schedule[i]?.totalBalanceCents, avalanche: ava.schedule[i]?.totalBalanceCents }));
  const cards = debts.filter((d) => d.type === "credit_card");
  const totalLimit = cards.reduce((a, d) => a + (d.creditLimitCents ?? 0), 0);
  const knownCardOwed = cards.filter((d) => d.owedCents !== null).reduce((a, d) => a + Math.max(0, d.owedCents!), 0);
  const allCardsKnown = cards.every((d) => d.owedCents !== null);
  const payoffDay = chosen.payoffMonth ? `${chosen.payoffMonth}-01` : null;
  const primary = primaryAccount(ws);
  const cash = ws.accounts.filter((a) => ["checking", "savings", "cash"].includes(a.type) && !a.archived);

  return (
    <>
      <PageHeader title="Debt" subtitle="Payoff dates are calculated only from the balances, APRs, and payments you enter." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total owed (known)"><Money cents={o.debtOwed} /></Stat>
        <Stat label="Debt-free" hint={chosen.payoffMonth ? `${strategy} · ${chosen.months} months` : chosen.excluded.length ? "Needs missing details" : chosen.problem ?? ""}>
          {chosen.payoffMonth ? formatMonth(chosen.payoffMonth) : <span className="text-muted">Not calculable</span>}
        </Stat>
        <Stat label="Countdown" hint="Days until the debt-free month">{payoffDay ? `${Math.max(0, diffDays(payoffDay, today))} days` : "—"}</Stat>
        <Stat label="Card utilization" hint={allCardsKnown ? `${formatCents(knownCardOwed, { noCents: true })} of ${formatCents(totalLimit, { noCents: true })} limits` : "Some card balances unknown"}>
          {allCardsKnown && totalLimit > 0 ? `${((knownCardOwed / totalLimit) * 100).toFixed(0)}%` : <span className="text-muted">—</span>}
        </Stat>
      </div>
      <p className="mt-2 text-xs text-muted">Available credit is never counted as spendable cash. Card purchases are spending when they happen; card payments are transfers that reduce what you owe.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {debts.map((d) => {
          const missing = [d.owedCents === null && "balance", d.aprBps === null && "APR", d.minPaymentCents === null && "payment", !d.dueDay && "due day"].filter(Boolean) as string[];
          const payoff = chosen.perDebt.find((p) => p.id === d.id);
          return (
            <Card key={d.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="truncate font-semibold">{d.name}</p><p className="text-xs text-muted">{d.type.replace("_", " ")}{d.institution ? ` · ${d.institution}` : ""}</p></div>
                  <div className="flex flex-wrap justify-end gap-1">{!d.verified && <Badge tone="warn">Unverified</Badge>}{payoff?.payoffMonth && <Badge tone="brand">Paid off {formatMonth(payoff.payoffMonth, "short")}</Badge>}</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted">Owed</p>{d.owedCents === null ? <p className="text-muted">Unknown</p> : <Money cents={d.owedCents} className="font-semibold" />}</div>
                  <div><p className="text-xs text-muted">APR</p><p className={cn(d.aprBps === null && "text-muted")}>{d.aprBps === null ? "Unknown" : `${d.aprBps / 100}%`}</p></div>
                  <div><p className="text-xs text-muted">Min / planned</p>{d.minPaymentCents === null ? <p className="text-muted">Unknown</p> : <Money cents={d.minPaymentCents} />}</div>
                </div>
                {d.util.utilizationBps !== null && <><Progress className="mt-3" value={d.util.utilizationBps} max={10000} tone={d.util.utilizationBps > 3000 ? "warn" : "brand"} /><p className="mt-1 text-xs text-muted">{(d.util.utilizationBps / 100).toFixed(0)}% of {formatCents(d.creditLimitCents, { noCents: true })} limit</p></>}
                {d.util.utilizationBps === null && d.creditLimitCents && <p className="mt-2 text-xs text-muted">Limit {formatCents(d.creditLimitCents, { noCents: true })} (reported)</p>}
                {missing.length > 0 && <p className="mt-2 text-xs text-warn">Missing: {missing.join(", ")}</p>}
                <Details summary="Update details" className="mt-3">
                  <ActionForm action={updateDebtTerms} className="grid grid-cols-2 gap-2">
                    <input type="hidden" name="accountId" value={d.id} />
                    <Field label="Amount owed now"><MoneyInput name="owed" placeholder={d.owedCents !== null ? centsToDecimalString(d.owedCents) : "Enter"} /></Field>
                    <Field label="As of"><Input type="date" name="asOf" defaultValue={today} /></Field>
                    <Field label="APR %"><Input name="apr" inputMode="decimal" defaultValue={d.aprBps !== null ? String(d.aprBps / 100) : ""} placeholder="e.g. 29.99" /></Field>
                    <Field label="Min / planned payment"><MoneyInput name="minPayment" defaultValue={d.minPaymentCents !== null ? centsToDecimalString(d.minPaymentCents) : ""} /></Field>
                    <Field label="Due day"><Input type="number" min={1} max={31} name="dueDay" defaultValue={d.dueDay ?? ""} /></Field>
                    <Field label="Credit limit"><MoneyInput name="creditLimit" defaultValue={d.creditLimitCents !== null ? centsToDecimalString(d.creditLimitCents) : ""} /></Field>
                    <Checkbox name="verified" defaultChecked={d.verified} label="Confirmed" className="col-span-2" />
                    <SubmitButton size="sm" className="col-span-2">Save</SubmitButton>
                  </ActionForm>
                </Details>
                <Details summary="Record a payment" className="mt-2">
                  <ActionForm action={saveTransaction} resetOnSuccess className="grid grid-cols-2 gap-2">
                    <input type="hidden" name="type" value="transfer" />
                    <input type="hidden" name="toAccountId" value={d.id} />
                    <input type="hidden" name="merchant" value={`${d.name} payment`} />
                    <Field label="Amount"><MoneyInput name="amount" required /></Field>
                    <Field label="Date"><Input type="date" name="date" defaultValue={today} required /></Field>
                    <Field label="From" className="col-span-2"><Select name="accountId" defaultValue={primary?.id}>{cash.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
                    <SubmitButton size="sm" className="col-span-2">Record payment (transfer)</SubmitButton>
                  </ActionForm>
                </Details>
              </CardBody>
            </Card>
          );
        })}
      </div>
      {debts.length === 0 && <Notice tone="brand" title="No debt accounts">Add credit cards, loans, or personal debts on the Accounts page.</Notice>}

      <Card className="mt-4">
        <CardHeader title="Payoff plan" subtitle="Minimums on everything, then extra money to one target. Freed-up payments roll over." />
        <CardBody className="space-y-4">
          <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Extra per month on top of minimums"><MoneyInput name="extra" defaultValue={extra ? centsToDecimalString(extra) : ""} placeholder="0.00" /></Field>
            <Field label="Strategy"><Select name="strategy" defaultValue={strategy}><option value="avalanche">Avalanche — highest APR first (least interest)</option><option value="snowball">Snowball — smallest balance first (quick wins)</option></Select></Field>
            <button className="h-10 rounded-xl bg-fg px-4 text-sm font-medium text-bg">Run scenario</button>
          </form>

          {chosen.excluded.length > 0 && (
            <Notice tone="warn" title={`${chosen.excluded.length} debt${chosen.excluded.length > 1 ? "s" : ""} left out — details missing`}>
              {chosen.excluded.map((e) => `${e.name}: ${e.reason}`).join(" · ")}. MoneyFlow doesn't guess balances, rates, or payments.
            </Notice>
          )}
          {chosen.problem && <Notice tone="danger" title="Plan doesn't converge">{chosen.problem}</Notice>}

          <div className="grid gap-3 sm:grid-cols-2">
            {[{ k: "avalanche", r: ava }, { k: "snowball", r: snow }].map(({ k, r }) => (
              <div key={k} className={cn("rounded-xl border p-4", strategy === k ? "border-brand/50 bg-brand/5" : "border-border")}>
                <p className="font-semibold capitalize">{k}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <div><p className="text-xs text-muted">Debt-free</p><p className="font-semibold">{r.payoffMonth ? formatMonth(r.payoffMonth, "short") : "—"}</p></div>
                  <div><p className="text-xs text-muted">Months</p><p className="font-semibold">{r.months ?? "—"}</p></div>
                  <div><p className="text-xs text-muted">Interest</p><p className="font-semibold tabular">{formatCents(r.totalInterestCents, { noCents: true })}</p></div>
                </div>
                {r.perDebt.length > 0 && <ol className="mt-3 space-y-1 text-xs text-muted">{[...r.perDebt].filter((p) => p.payoffMonthIndex).sort((a, b) => a.payoffMonthIndex! - b.payoffMonthIndex!).map((p, i) => <li key={p.id}>{i + 1}. {p.name} — {p.payoffMonth ? formatMonth(p.payoffMonth, "short") : "—"}</li>)}</ol>}
              </div>
            ))}
          </div>
          {extra > 0 && base.months && chosen.months && <p className="text-sm">Paying an extra <b>{formatCents(extra)}</b>/month saves <b className="text-brand">{base.months - chosen.months} months</b> and <b className="text-brand">{formatCents(base.totalInterestCents - chosen.totalInterestCents)}</b> in interest vs minimums only.</p>}
          {series.length > 1 && <DebtPayoffChart series={series} />}
          <p className="text-xs text-muted">Interest is estimated monthly at APR ÷ 12 on the balance. Real statements use daily balances, so actual figures will differ slightly. To prioritize debt over investing, pause investing on the <LinkButton href="/budget#rules" variant="ghost" size="sm" className="h-auto px-1 py-0 text-xs text-brand">Budget page</LinkButton>.</p>
        </CardBody>
      </Card>
    </>
  );
}
