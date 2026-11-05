import Link from "next/link";
import { ArrowRight, CalendarDays, Sparkles } from "lucide-react";
import { loadWorkspace } from "@/lib/workspace";
import { paycheckPlans, primaryAccount } from "@/lib/overview";
import { addDays, formatDate, formatMonth, todayISO } from "@/lib/dates";
import { allocate, incomeFigures, previousPayday, threePaycheckMonths } from "@/lib/paycheck";
import { centsToDecimalString, formatCents } from "@/lib/money";
import { savePaySettings, recordPaycheck } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { SubmitButton } from "@/components/shell/SubmitButton";
import { Badge, Card, CardBody, CardHeader, Details, Field, Input, Money, MoneyInput, Notice, PageHeader, Select } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "My Paycheck" };

export default async function PaycheckPage() {
  const ws = await loadWorkspace();
  const s = ws.settings;
  const today = todayISO();
  const fig = incomeFigures(s.netPayCents, s.payIntervalDays);
  const perCheck = allocate(fig.perPaycheck, ws.rules, { investingPaused: s.investingPaused });
  const perMonth = allocate(fig.normalMonth, ws.rules, { investingPaused: s.investingPaused });
  const primary = primaryAccount(ws);

  const settingsForm = (
    <ActionForm action={savePaySettings} className="grid gap-3 sm:grid-cols-[1fr_1fr_120px_auto] sm:items-end">
      <Field label="A known payday" hint="Any real payday, past or upcoming"><Input type="date" name="anchorPayday" defaultValue={s.anchorPayday ?? ""} /></Field>
      <Field label="Net pay per regular paycheck"><MoneyInput name="netPay" defaultValue={centsToDecimalString(s.netPayCents)} required /></Field>
      <Field label="Every (days)"><Input type="number" name="payIntervalDays" min={7} max={31} defaultValue={s.payIntervalDays} /></Field>
      <SubmitButton>Save schedule</SubmitButton>
    </ActionForm>
  );

  if (!s.anchorPayday) {
    return (
      <>
        <PageHeader title="My Paycheck" subtitle="Plan every biweekly paycheck: bills, reserves, and where each dollar goes." />
        <Card id="anchor" className="border-brand/40">
          <CardHeader title="Set your payday to get started" subtitle="MoneyFlow won't guess your pay dates or which months have three paychecks. Enter one payday you know for sure; every other one is generated 14 days apart." />
          <CardBody>{settingsForm}</CardBody>
        </Card>
        <IncomeSummary fig={fig} />
      </>
    );
  }

  const start = addDays(previousPayday(s.anchorPayday, addDays(today, 1), s.payIntervalDays), -s.payIntervalDays);
  const plans = paycheckPlans(ws, start, addDays(today, 7 * s.payIntervalDays), today);
  const year = Number(today.slice(0, 4));
  const threes = [...threePaycheckMonths(s.anchorPayday, year, s.payIntervalDays), ...threePaycheckMonths(s.anchorPayday, year + 1, s.payIntervalDays)].filter((m) => m.paydays[2] >= addDays(today, -40));
  const extras = ws.paychecks.filter((p) => p.kind !== "regular").slice(-6).reverse();

  return (
    <>
      <PageHeader title="My Paycheck" subtitle={`Biweekly · ${formatCents(s.netPayCents)} net per check · paydays generated from ${formatDate(s.anchorPayday, "long")}`} />
      <IncomeSummary fig={fig} />

      <Card className="mt-4">
        <CardHeader title="Your split per paycheck" subtitle={s.investingPaused ? "Investing is paused — that share is held as unassigned until you choose where it goes." : "Default targets. Edit them on the Budget page."} />
        <CardBody>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {perCheck.parts.map((p, i) => (
              <div key={p.key} className="rounded-xl bg-surface-2 p-3">
                <p className="text-xs text-muted">{p.label} · {(p.percentBps / 100).toFixed(p.percentBps % 100 ? 2 : 0)}%</p>
                <p className="mt-0.5 text-lg font-semibold tabular">{formatCents(p.amountCents)}</p>
                <p className="text-xs text-muted tabular">{formatCents(perMonth.parts[i].amountCents)} in a normal month</p>
              </div>
            ))}
          </div>
          {perCheck.pausedCents > 0 && <Notice tone="warn" className="mt-3" title={`${formatCents(perCheck.pausedCents)} per check is paused from investing`}>It isn't moved anywhere automatically. Assign it to debt, emergency savings, or another envelope on each paycheck.</Notice>}
        </CardBody>
      </Card>

      <h2 className="mb-3 mt-7 flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-5 w-5 text-brand" />Paydays</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {plans.map((p) => {
          const isNext = !p.isPast && plans.find((x) => !x.isPast)?.payDate === p.payDate;
          const part = (k: string) => p.allocation.parts.find((x) => x.key === k)?.amountCents ?? 0;
          return (
            <Link key={p.payDate} href={`/paycheck/${p.payDate}`} className={cn("group block rounded-2xl border bg-surface p-4 transition hover:shadow-sm animate-fade-up", isNext ? "border-brand/50 ring-1 ring-brand/20" : "border-border", p.income.isForecast && !p.isPast && "")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[15px] font-semibold">{formatDate(p.payDate, "weekday")}{p.payDate.slice(0, 4) !== today.slice(0, 4) && `, ${p.payDate.slice(0, 4)}`}</p>
                  <p className="text-xs text-muted">Covers through {formatDate(addDays(p.nextPayDate, -1))}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  {isNext && <Badge tone="brand">Next</Badge>}
                  {p.income.isThirdPaycheck && <Badge tone="info"><Sparkles className="h-3 w-3" />3rd check</Badge>}
                  {p.income.isForecast ? <Badge tone="forecast">Forecast</Badge> : <Badge tone="brand">Received</Badge>}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
                <Line label="Expected net" value={<Money cents={p.income.expectedCents} />} />
                <Line label="Actual net" value={p.income.actualCents === null ? <span className="text-muted">Not recorded</span> : <Money cents={p.income.actualCents} className="font-semibold text-brand" />} />
                <Line label={`Bills due (${p.billsDue.length})`} value={<Money cents={p.billsDueCents} />} />
                <Line label="Bill reserve" value={<Money cents={p.reserveCents} />} />
                <Line label="Needs" value={<Money cents={part("needs")} />} />
                <Line label="Investing" value={<Money cents={part("investing")} />} />
                <Line label="Financial goals" value={<Money cents={part("goals")} />} />
                <Line label="Guilt-free" value={<Money cents={part("guiltfree")} />} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <Mini label="Spendable" cents={p.remainingSpendableCents} />
                <Mini label="Unassigned" cents={p.unassignedCents} tone={p.unassignedCents === 0 ? "brand" : p.unassignedCents < 0 ? "danger" : undefined} />
                <Mini label={p.balanceIsActual ? "Balance (actual)" : "Balance after (proj.)"} cents={p.projectedBalanceAfterCents} dashed={!p.balanceIsActual} />
              </div>
              <p className="mt-3 flex items-center gap-1 text-[13px] font-medium text-brand">Plan this paycheck <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></p>
            </Link>
          );
        })}
      </div>
      {!primary && <Notice tone="info" className="mt-3">Add a checking account to see projected balances after each paycheck.</Notice>}

      <Card className="mt-6">
        <CardHeader title="Three-paycheck months" subtitle="Detected from your actual payday schedule. The third check is never allocated automatically — you decide." />
        <CardBody>
          {threes.length === 0 ? <p className="text-sm text-muted">None in the current window.</p> : (
            <div className="grid gap-3 sm:grid-cols-2">
              {threes.map((m) => (
                <div key={m.month} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between"><p className="font-semibold">{formatMonth(m.month)}</p><Badge tone="info">3 paydays</Badge></div>
                  <p className="mt-1 text-xs text-muted">{m.paydays.map((d) => formatDate(d)).join(" · ")}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-muted">Normal budget</p><p className="font-semibold tabular">{formatCents(fig.normalMonth)}</p></div>
                    <div><p className="text-xs text-muted">Extra check</p><p className="font-semibold tabular text-brand">+{formatCents(fig.perPaycheck)}</p></div>
                    <div><p className="text-xs text-muted">Month total</p><p className="font-semibold tabular">{formatCents(fig.threePaycheckMonth)}</p></div>
                  </div>
                  <Link href={`/paycheck/${m.paydays[2]}#extra`} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-brand">Decide where the extra goes <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Overtime, bonus, or irregular income" subtitle="Logged separately from your regular paycheck so forecasts stay honest." />
          <CardBody>
            <ActionForm action={recordPaycheck} resetOnSuccess className="grid gap-3 sm:grid-cols-2">
              <Field label="Date"><Input type="date" name="payDate" defaultValue={today} required /></Field>
              <Field label="Type"><Select name="kind" defaultValue="overtime"><option value="overtime">Overtime</option><option value="bonus">Bonus</option><option value="irregular">Irregular / side income</option></Select></Field>
              <Field label="Expected amount"><MoneyInput name="expected" required /></Field>
              <Field label="Actual received (blank = forecast)"><MoneyInput name="actual" /></Field>
              <Field label="Deposit to (creates an income transaction)" className="sm:col-span-2">
                <Select name="accountId" defaultValue=""><option value="">Don't create a transaction</option>{ws.accounts.filter((a) => ["checking", "savings", "cash"].includes(a.type) && !a.archived).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
              </Field>
              <SubmitButton className="sm:col-span-2">Save income</SubmitButton>
            </ActionForm>
            {extras.length > 0 && (
              <ul className="mt-4 divide-y divide-border text-sm">
                {extras.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2">
                    <span><span className="capitalize">{e.kind}</span> · {formatDate(e.payDate)}</span>
                    <span>{e.actualCents === null ? <span className="text-muted">Forecast <Money cents={e.expectedCents} /></span> : <Money cents={e.actualCents} className="text-brand" />}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card id="anchor">
          <CardHeader title="Pay schedule" subtitle="Changing these never rewrites income you've already recorded." />
          <CardBody>{settingsForm}</CardBody>
        </Card>
      </div>
    </>
  );
}

function Line({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-2"><span className="text-muted">{label}</span><span className="tabular">{value}</span></div>;
}
function Mini({ label, cents, tone, dashed }: { label: string; cents: number | null; tone?: "brand" | "danger"; dashed?: boolean }) {
  return (
    <div className={cn("rounded-lg py-1.5", dashed && "forecast-stripe")}>
      <p className="text-[10.5px] uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("text-sm font-semibold tabular", tone === "brand" && "text-brand", tone === "danger" && "text-danger", cents !== null && cents < 0 && "text-danger")}>{cents === null ? <span className="text-muted font-normal">Unknown</span> : formatCents(cents)}</p>
    </div>
  );
}

function IncomeSummary({ fig }: { fig: ReturnType<typeof incomeFigures> }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
      <SummaryBox label="Per paycheck" value={fig.perPaycheck} />
      <SummaryBox label="Normal month" value={fig.normalMonth} note="2 checks · budget baseline" highlight />
      <SummaryBox label="3-paycheck month" value={fig.threePaycheckMonth} note="Extra check to assign" />
      <SummaryBox label={`Annual (${fig.paychecksPerYear} checks)`} value={fig.annual} />
      <SummaryBox label="Annualized monthly avg" value={fig.annualizedMonthlyAverage} note="Average only — don't budget on it" className="col-span-2 sm:col-span-1" />
    </div>
  );
}
function SummaryBox({ label, value, note, highlight, className }: { label: string; value: number; note?: string; highlight?: boolean; className?: string }) {
  return (
    <div className={cn("rounded-2xl border p-3.5 animate-fade-up", highlight ? "border-brand/40 bg-brand/5" : "border-border bg-surface", className)}>
      <p className="text-[11.5px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular">{formatCents(value)}</p>
      {note && <p className={cn("mt-0.5 text-[11.5px]", highlight ? "text-brand" : "text-muted")}>{note}</p>}
    </div>
  );
}
