import { loadWorkspace } from "@/lib/workspace";
import { completeOnboarding } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { SubmitButton } from "@/components/shell/SubmitButton";
import { Badge, Card, CardBody, CardHeader, Checkbox, Field, Input, MoneyInput, Notice, PageHeader, Select } from "@/components/ui";
import { centsToDecimalString, formatCents } from "@/lib/money";
import { allocate, incomeFigures } from "@/lib/paycheck";
import { LIABILITY_TYPES } from "@/lib/ledger";

export const metadata = { title: "Confirm your profile" };

export default async function Welcome() {
  const ws = await loadWorkspace();
  const fig = incomeFigures(ws.settings.netPayCents, ws.settings.payIntervalDays);
  const month = allocate(fig.normalMonth, ws.rules).parts;
  const check = allocate(fig.perPaycheck, ws.rules).parts;
  const billTotal = ws.bills.reduce((a, b) => a + b.amountCents, 0);
  const needs = month.find((p) => p.key === "needs")?.amountCents ?? 0;
  const debts = ws.accounts.filter((a) => LIABILITY_TYPES.has(a.type));
  if (ws.user.mode === "demo") {
    return <Notice tone="warn" title="This is the demo workspace">The first-run confirmation is for your personal workspace. Switch to Personal to review your amounts.</Notice>;
  }
  return (
    <>
      <PageHeader title="Confirm your starting numbers" subtitle="MoneyFlow imported only what you told it. Nothing is treated as verified until you confirm it here or later." />
      <ActionForm action={completeOnboarding} className="space-y-4">
        <Card>
          <CardHeader title="1 · Paycheck" subtitle="Biweekly (every 14 days)" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Net pay per regular paycheck"><MoneyInput name="netPay" defaultValue={centsToDecimalString(ws.settings.netPayCents)} required /></Field>
            <Field label="A known payday (any past or upcoming one)" hint="Every other payday is generated from this date. Leave blank if unsure — three-paycheck months stay unknown until it's set.">
              <Input type="date" name="anchorPayday" defaultValue={ws.settings.anchorPayday ?? ""} />
            </Field>
            <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-3 text-sm sm:col-span-2 sm:grid-cols-4">
              <div><p className="text-xs text-muted">Normal month (2 checks)</p><p className="font-semibold tabular">{formatCents(fig.normalMonth)}</p><p className="text-[11px] text-brand">Budget baseline</p></div>
              <div><p className="text-xs text-muted">3-paycheck month</p><p className="font-semibold tabular">{formatCents(fig.threePaycheckMonth)}</p></div>
              <div><p className="text-xs text-muted">Annual (26 checks)</p><p className="font-semibold tabular">{formatCents(fig.annual)}</p></div>
              <div><p className="text-xs text-muted">Annualized monthly avg</p><p className="font-semibold tabular">{formatCents(fig.annualizedMonthlyAverage)}</p><p className="text-[11px] text-muted">Average only — not your budget</p></div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="2 · Allocation framework" subtitle="Default targets — not mandatory spending or transfers. Change them anytime on the Budget page." />
          <CardBody>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {month.map((p, i) => (
                <div key={p.key} className="rounded-xl border border-border p-3">
                  <p className="text-xs text-muted">{p.label} · {(p.percentBps / 100).toFixed(0)}%</p>
                  <p className="font-semibold tabular">{formatCents(p.amountCents)}<span className="text-xs font-normal text-muted"> /mo</span></p>
                  <p className="text-xs text-muted tabular">{formatCents(check[i].amountCents)} /check</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="3 · Recurring expenses" subtitle="Your reported estimates. Confirm each amount and add a due day (needed for bill funding & alerts)." />
          <CardBody className="space-y-3">
            {ws.bills.map((b) => (
              <div key={b.id} className="grid grid-cols-[1fr_110px] items-end gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_140px_110px_auto]">
                <div className="col-span-2 sm:col-span-1">
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted">{ws.categories.find((c) => c.id === b.categoryId)?.name ?? "Uncategorized"} · monthly</p>
                </div>
                <Field label="Amount"><MoneyInput name={`bill_${b.id}`} defaultValue={centsToDecimalString(b.amountCents)} required /></Field>
                <Field label="Due day"><Input name={`due_${b.id}`} type="number" min={1} max={31} placeholder="1–31" defaultValue={b.dueDay ?? ""} /></Field>
                <Checkbox name={`confirm_${b.id}`} label="Confirmed" defaultChecked={b.verified} className="col-span-2 pb-2 sm:col-span-1" />
              </div>
            ))}
            <Notice tone={needs - billTotal < 5000 ? "warn" : "info"} title={`Listed: ${formatCents(billTotal)}/mo · Needs budget: ${formatCents(needs)} · Margin: ${formatCents(needs - billTotal)}`}>
              This margin is very small. Groceries, utilities, health costs, and other essentials may not all be represented yet — missing expenses are not zero. You can add bills and recategorize (e.g. move Haircut to Guilt-Free) on the Bills and Budget pages.
            </Notice>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="4 · Optional older plan amounts" subtitle="Imported as drafts. They are NOT counted as expenses, and savings/investing lines are transfers — never consumption spending." />
          <CardBody className="space-y-2">
            {ws.planLines.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
                <div>
                  <p className="font-medium">{l.name} <span className="tabular text-muted">· {formatCents(l.monthlyCents)}/mo</span></p>
                  <p className="text-xs text-muted">{l.nature === "spending" ? "Discretionary spending plan" : l.nature === "investment" ? "Investment transfer (not spending)" : "Savings transfer (not spending)"} · {l.bucket}</p>
                </div>
                <Select name={`plan_${l.id}`} defaultValue={l.status} className="w-40">
                  <option value="draft">Keep as draft</option>
                  <option value="accepted">Use in my plan</option>
                  <option value="dismissed">Dismiss</option>
                </Select>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="5 · Accounts & debts" subtitle="Created as editable drafts. No balances, APRs, minimum payments, or due dates were invented — add them on the Accounts and Debt pages." />
          <CardBody className="grid gap-2 sm:grid-cols-2">
            {debts.map((d) => (
              <div key={d.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-muted">{d.creditLimitCents ? `Reported limit ${formatCents(d.creditLimitCents)}` : "Balance to be confirmed"} · balance <b>unknown</b> · APR {d.aprBps === null ? <b>unknown</b> : `${d.aprBps / 100}%`}</p>
                <Badge tone="warn" className="mt-1.5">Unverified</Badge>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <Checkbox name="ack" label="I've reviewed these amounts. Unchecked bills stay marked as unverified." required />
            <SubmitButton size="lg" className="w-full sm:w-auto">Save and open my dashboard</SubmitButton>
          </CardBody>
        </Card>
      </ActionForm>
    </>
  );
}
