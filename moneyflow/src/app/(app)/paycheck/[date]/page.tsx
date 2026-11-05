import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Sparkles, Trash2 } from "lucide-react";
import { loadWorkspace } from "@/lib/workspace";
import { paycheckPlans, primaryAccount, goalSaved } from "@/lib/overview";
import { addDays, formatDate, isISODate, todayISO } from "@/lib/dates";
import { centsToDecimalString, formatCents } from "@/lib/money";
import { RESERVE_MODE_LABELS, type ReserveMode } from "@/lib/bills";
import { LIABILITY_TYPES } from "@/lib/ledger";
import { addAssignment, applyStandardPlan, clearAssignments, deleteAssignment, fundReserves, recordPaycheck } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { SubmitButton } from "@/components/shell/SubmitButton";
import { Badge, Button, Card, CardBody, CardHeader, Field, Money, MoneyInput, Notice, PageHeader, Progress, Select, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

export default async function PaycheckDetail({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isISODate(date)) notFound();
  const ws = await loadWorkspace();
  const s = ws.settings;
  const today = todayISO();
  const plan = paycheckPlans(ws, date, date, today)[0];
  if (!plan) {
    return (
      <>
        <BackLink />
        <Notice tone="warn" title="Not a scheduled payday">{s.anchorPayday ? `${formatDate(date, "long")} isn't on your biweekly schedule.` : "Set a known payday first."} <Link className="text-brand underline" href="/paycheck">Back to My Paycheck</Link></Notice>
      </>
    );
  }
  const regular = ws.paychecks.find((p) => p.payDate === date && p.kind === "regular");
  const primary = primaryAccount(ws);
  const depositAccounts = ws.accounts.filter((a) => ["checking", "savings", "cash"].includes(a.type) && !a.archived);
  const debts = ws.accounts.filter((a) => LIABILITY_TYPES.has(a.type) && !a.archived);
  const goals = ws.goals.filter((g) => !g.archived);
  const pct = plan.incomeUsedCents > 0 ? Math.min(100, (plan.assignedCents / plan.incomeUsedCents) * 100) : 0;
  const mode = s.reserveMode as ReserveMode;
  const fundedIds = new Set(ws.reserves.filter((r) => r.payDate === date && r.fundedCents > 0).map((r) => r.billId));
  const emergency = goals.find((g) => g.kind === "emergency");
  const investAccounts = ws.accounts.filter((a) => a.type === "investment" && !a.archived);

  const envelopeOptions = (
    <>
      <optgroup label="Allocation buckets">
        {ws.rules.map((r) => <option key={r.key} value={`bucket:${r.key}`}>{r.label}</option>)}
      </optgroup>
      {goals.length > 0 && <optgroup label="Savings goals">{goals.map((g) => <option key={g.id} value={`goal:${g.id}`}>{g.name}</option>)}</optgroup>}
      {debts.length > 0 && <optgroup label="Debt payments">{debts.map((d) => <option key={d.id} value={`debt:${d.id}`}>{d.name}</option>)}</optgroup>}
      {ws.bills.length > 0 && <optgroup label="Bill reserves">{ws.bills.filter((b) => b.active).map((b) => <option key={b.id} value={`bill:${b.id}`}>{b.name}</option>)}</optgroup>}
      <optgroup label="Categories">{ws.categories.filter((c) => !c.archived && c.bucket !== "income" && c.bucket !== "transfer").map((c) => <option key={c.id} value={`category:${c.id}`}>{c.name}</option>)}</optgroup>
      <option value="other:">Other (label it)</option>
    </>
  );

  return (
    <>
      <BackLink />
      <PageHeader
        title={formatDate(date, "long")}
        subtitle={`Pay period ${formatDate(date)} – ${formatDate(addDays(plan.nextPayDate, -1))} · next payday ${formatDate(plan.nextPayDate, "weekday")}`}
        actions={
          <div className="flex gap-1.5">
            {plan.income.isThirdPaycheck && <Badge tone="info"><Sparkles className="h-3 w-3" />Third paycheck this month</Badge>}
            {plan.income.isForecast ? <Badge tone="forecast">Forecast</Badge> : <Badge tone="brand">Received</Badge>}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Box label="Expected net" cents={plan.income.expectedCents} forecast />
        <Box label="Actual net" cents={plan.income.actualCents} empty="Not recorded" />
        <Box label="Bills due before next check" cents={plan.billsDueCents} note={`${plan.billsDue.length} bill${plan.billsDue.length === 1 ? "" : "s"}`} />
        <Box label="Reserve for monthly bills" cents={plan.reserveCents} note={RESERVE_MODE_LABELS[mode].short + " mode"} />
        <Box label="Remaining spendable" cents={plan.remainingSpendableCents} note="After reserves, investing & goals" />
        <Box label="Needs after bill reserves" cents={plan.needsAfterReserveCents} note="For groceries, utilities, etc." />
        <Box label="Unassigned" cents={plan.unassignedCents} tone={plan.unassignedCents === 0 ? "brand" : plan.unassignedCents < 0 ? "danger" : "warn"} />
        <Box label={plan.balanceIsActual ? `${primary?.name ?? "Checking"} balance (actual)` : `${primary?.name ?? "Checking"} after planned (proj.)`} cents={plan.projectedBalanceAfterCents} forecast={!plan.balanceIsActual} empty="Enter balance" />
      </div>
      {plan.needsAfterReserveCents < 0 && <Notice tone="danger" className="mt-3" title="Bill reserves exceed this check's Needs share">Reserves of {formatCents(plan.reserveCents)} are more than the Needs allocation. Something else must give — review bills or allocations.</Notice>}

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Record this paycheck" subtitle="Actual received amounts replace the forecast. Pay changes are fine — enter what you actually got." />
          <CardBody>
            <ActionForm action={recordPaycheck} className="space-y-3">
              <input type="hidden" name="payDate" value={date} />
              <input type="hidden" name="kind" value="regular" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Expected"><MoneyInput name="expected" defaultValue={centsToDecimalString(regular?.expectedCents ?? s.netPayCents)} /></Field>
                <Field label="Actual received"><MoneyInput name="actual" defaultValue={regular?.actualCents != null ? centsToDecimalString(regular.actualCents) : ""} /></Field>
              </div>
              {!regular?.transactionId && (
                <Field label="Deposited to" hint="Creates an income transaction so balances stay in sync.">
                  <Select name="accountId" defaultValue={primary?.id ?? ""}><option value="">Don't create a transaction</option>{depositAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
                </Field>
              )}
              <Field label="Notes"><Input name="notes" defaultValue={regular?.notes ?? ""} placeholder="e.g. short check, PTO" /></Field>
              <SubmitButton className="w-full">Save paycheck</SubmitButton>
            </ActionForm>
            {plan.income.extras.length > 0 && (
              <div className="mt-4 border-t border-border pt-3 text-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Extra income this day</p>
                {plan.income.extras.map((e) => <p key={e.kind} className="flex justify-between"><span className="capitalize">{e.kind}</span><Money cents={e.actualCents ?? e.expectedCents} /></p>)}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Bills due before next paycheck" subtitle={`${formatDate(date)} – ${formatDate(addDays(plan.nextPayDate, -1))}`} />
          <CardBody className="pt-2">
            {plan.billsDue.length === 0 ? <p className="text-sm text-muted">{ws.bills.some((b) => b.active && b.dueDay === null) ? "Some bills don't have a due day yet, so they can't be placed in a pay period." : "No bills fall in this pay period."}</p> : (
              <ul className="divide-y divide-border">
                {plan.billsDue.map((b) => (
                  <li key={b.billId + b.dueDate} className="flex items-center justify-between py-2 text-sm">
                    <span>{b.name}<span className="ml-2 text-xs text-muted">{formatDate(b.dueDate, "weekday")}</span></span>
                    <Money cents={b.amountCents} />
                  </li>
                ))}
              </ul>
            )}
            {ws.bills.some((b) => b.active && b.dueDay === null && b.frequency === "monthly") && <p className="mt-2 text-xs text-warn">Bills without a due day: {ws.bills.filter((b) => b.active && b.dueDay === null).map((b) => b.name).join(", ")}. <Link className="underline" href="/bills">Add due days</Link></p>}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4" id="reserves">
        <CardHeader title="Bill reserves from this check" subtitle="Budgeting a reserve doesn't fund a bill. Confirm only after you've actually moved or set aside the money." />
        <CardBody>
          <ActionForm action={fundReserves}>
            <input type="hidden" name="payDate" value={date} />
            <ul className="divide-y divide-border">
              {plan.reserveRows.map((r) => (
                <li key={r.billId} className="flex items-center gap-3 py-2 text-sm">
                  <input type="checkbox" name="billId" value={r.billId} defaultChecked={!fundedIds.has(r.billId)} disabled={fundedIds.has(r.billId)} className="h-4 w-4 accent-[rgb(var(--brand))]" aria-label={`Confirm ${r.name}`} />
                  <span className="flex-1">{r.name}</span>
                  {fundedIds.has(r.billId) ? <Badge tone="brand"><CheckCircle2 className="h-3 w-3" />Set aside {formatCents(r.fundedCents)}</Badge> : <Badge tone="forecast">Planned</Badge>}
                  <Money cents={r.perCheckCents} className="w-20 text-right" />
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
              <span className="text-muted">Confirmed {formatCents(plan.reserveFundedCents)} of {formatCents(plan.reserveCents)}</span>
              {plan.reserveRows.length > 0 && plan.reserveFundedCents < plan.reserveCents && <SubmitButton size="sm">Confirm checked reserves are set aside</SubmitButton>}
            </div>
          </ActionForm>
          {fundedIds.size > 0 && (
            <ActionForm action={fundReserves} className="mt-2">
              <input type="hidden" name="payDate" value={date} />
              <input type="hidden" name="unfund" value="1" />
              {[...fundedIds].map((id) => <input key={id} type="hidden" name="billId" value={id} />)}
              <Button variant="ghost" size="sm" type="submit">Undo confirmations</Button>
            </ActionForm>
          )}
        </CardBody>
      </Card>

      {plan.income.isThirdPaycheck && (
        <Card className="mt-4 border-info/40" id="extra">
          <CardHeader title="Extra paycheck — your call" subtitle={`This is the third payday of the month. Your normal month is budgeted on two checks, so up to ${formatCents(plan.incomeUsedCents)} is extra. Nothing is allocated until you choose.`} />
          <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ...debts.slice(0, 1).map((d) => ({ label: "Pay down debt", target: `debt:${d.id}`, hint: d.name, select: debts.map((x) => ({ v: `debt:${x.id}`, l: x.name })) })),
              ...(emergency ? [{ label: "Emergency fund", target: `goal:${emergency.id}`, hint: `${formatCents(goalSaved(ws, emergency.id))} saved`, select: [] }] : []),
              { label: "Invest", target: "bucket:investing", hint: investAccounts.map((a) => a.name).join(", ") || "Investing bucket", select: [] },
              { label: "Other goal", target: goals[0] ? `goal:${goals[0].id}` : "other:", hint: "Pick any goal", select: goals.map((g) => ({ v: `goal:${g.id}`, l: g.name })) },
            ].map((o) => (
              <ActionForm key={o.label} action={addAssignment} resetOnSuccess className="rounded-xl border border-border p-3">
                <input type="hidden" name="payDate" value={date} />
                <p className="font-medium">{o.label}</p>
                <p className="mb-2 truncate text-xs text-muted">{o.hint}</p>
                {o.select.length > 1 ? <Select name="target" defaultValue={o.target} className="mb-2">{o.select.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}</Select> : <input type="hidden" name="target" value={o.target} />}
                <MoneyInput name="amount" placeholder={centsToDecimalString(Math.max(0, plan.unassignedCents))} required />
                <SubmitButton size="sm" variant="secondary" className="mt-2 w-full">Assign</SubmitButton>
              </ActionForm>
            ))}
          </CardBody>
        </Card>
      )}

      <Card className="mt-4" id="assign">
        <CardHeader title="Give every dollar a job" subtitle={`${formatCents(plan.assignedCents)} of ${formatCents(plan.incomeUsedCents)} assigned${plan.income.isForecast ? " (based on expected pay)" : ""}`} />
        <CardBody className="space-y-4">
          <div>
            <Progress value={plan.assignedCents} max={plan.incomeUsedCents} tone={plan.unassignedCents < 0 ? "danger" : "brand"} />
            <p className={cn("mt-1.5 text-sm", plan.unassignedCents === 0 ? "text-brand" : plan.unassignedCents < 0 ? "text-danger" : "text-muted")}>
              {plan.unassignedCents === 0 ? "Every dollar is assigned." : plan.unassignedCents < 0 ? `Over-assigned by ${formatCents(-plan.unassignedCents)}.` : `${formatCents(plan.unassignedCents)} still unassigned (${Math.round(100 - pct)}%).`}
            </p>
          </div>

          {plan.assignments.length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {plan.assignments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <Badge tone="neutral">{a.targetType}</Badge>
                  <span className="flex-1 truncate">{a.label}</span>
                  <Money cents={a.amountCents} />
                  <ActionForm action={deleteAssignment}><input type="hidden" name="id" value={a.id} /><button className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-danger/10 hover:text-danger" aria-label="Remove"><Trash2 className="h-4 w-4" /></button></ActionForm>
                </li>
              ))}
            </ul>
          )}

          <ActionForm action={addAssignment} resetOnSuccess className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="payDate" value={date} />
            <Field label="Envelope"><Select name="target" required>{envelopeOptions}</Select></Field>
            <Field label="Label (optional)"><Input name="label" placeholder="e.g. Groceries cash" /></Field>
            <Field label="Amount"><MoneyInput name="amount" required placeholder={plan.unassignedCents > 0 ? centsToDecimalString(plan.unassignedCents) : "0.00"} /></Field>
            <SubmitButton>Assign</SubmitButton>
          </ActionForm>

          <div className="flex flex-wrap gap-2 border-t border-border pt-3">
            {plan.assignments.length === 0 && (
              <ActionForm action={applyStandardPlan}>
                <input type="hidden" name="payDate" value={date} />
                <input type="hidden" name="income" value={centsToDecimalString(plan.incomeUsedCents)} />
                <SubmitButton variant="outline" size="sm">Apply my standard plan (bill reserves + {ws.rules.map((r) => `${(r.percentBps / 100).toFixed(0)}`).join("/")})</SubmitButton>
              </ActionForm>
            )}
            {plan.assignments.length > 0 && (
              <ActionForm action={clearAssignments}>
                <input type="hidden" name="payDate" value={date} />
                <SubmitButton variant="ghost" size="sm">Clear all assignments</SubmitButton>
              </ActionForm>
            )}
          </div>
          <p className="text-xs text-muted">Assignments are your plan for this check. Actual money movement is recorded as transactions/transfers so spending, savings, and debt payments never double count.</p>
        </CardBody>
      </Card>
    </>
  );
}

function BackLink() {
  return <Link href="/paycheck" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" />All paydays</Link>;
}

function Box({ label, cents, note, tone, forecast, empty = "—" }: { label: string; cents: number | null; note?: string; tone?: "brand" | "danger" | "warn"; forecast?: boolean; empty?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-3.5 animate-fade-up", forecast && "border-dashed")}>
      <p className="text-[11.5px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular", tone === "brand" && "text-brand", tone === "danger" && "text-danger", tone === "warn" && "text-warn", cents !== null && cents < 0 && "text-danger")}>
        {cents === null ? <span className="text-base font-normal text-muted">{empty}</span> : formatCents(cents)}
      </p>
      {note && <p className="mt-0.5 text-[11.5px] text-muted">{note}</p>}
    </div>
  );
}
