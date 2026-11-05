import { loadWorkspace } from "@/lib/workspace";
import { fundingStatuses, primaryAccount } from "@/lib/overview";
import { addDays, formatDate, todayISO } from "@/lib/dates";
import { centsToDecimalString, formatCents } from "@/lib/money";
import { isScheduled, perCheckReserve, RESERVE_MODE_LABELS, reserveSummary, simulateSinkingFund, type ReserveMode } from "@/lib/bills";
import { paydaysBetween } from "@/lib/paycheck";
import { LIABILITY_TYPES } from "@/lib/ledger";
import { deleteBill, payBill, saveBill, setReserveMode, verifyItem } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { ConfirmButton, SubmitButton } from "@/components/shell/SubmitButton";
import { Badge, Card, CardBody, CardHeader, Checkbox, Details, Field, Input, Money, MoneyInput, Notice, PageHeader, Select, Table, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Bills" };

type WS = Awaited<ReturnType<typeof loadWorkspace>>;

function BillFields({ ws, b }: { ws: WS; b?: WS["bills"][number] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {b && <input type="hidden" name="id" value={b.id} />}
      <Field label="Name"><Input name="name" defaultValue={b?.name} required /></Field>
      <Field label="Amount"><MoneyInput name="amount" defaultValue={b ? centsToDecimalString(b.amountCents) : ""} required /></Field>
      <Field label="Frequency"><Select name="frequency" defaultValue={b?.frequency ?? "monthly"}><option value="monthly">Monthly</option><option value="biweekly">Every 2 weeks</option><option value="weekly">Weekly</option><option value="annual">Yearly</option></Select></Field>
      <Field label="Due day of month" hint="Monthly & yearly bills"><Input type="number" name="dueDay" min={1} max={31} defaultValue={b?.dueDay ?? ""} placeholder="1–31" /></Field>
      <Field label="Due month" hint="Yearly bills only"><Input type="number" name="dueMonth" min={1} max={12} defaultValue={b?.dueMonth ?? ""} /></Field>
      <Field label="First due date" hint="Weekly / every-2-week bills"><Input type="date" name="anchorDate" defaultValue={b?.anchorDate ?? ""} /></Field>
      <Field label="Category" hint="Its bucket decides Needs vs Guilt-Free"><Select name="categoryId" defaultValue={b?.categoryId ?? ""}><option value="">Uncategorized</option>{ws.categories.filter((c) => c.bucket !== "income" && !c.archived).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.bucket})</option>)}</Select></Field>
      <Field label="Paid from"><Select name="accountId" defaultValue={b?.accountId ?? primaryAccount(ws)?.id ?? ""}><option value="">—</option>{ws.accounts.filter((a) => !a.archived && a.type !== "investment").map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
      <Field label="Pays down a debt?" hint="Payments become transfers, not spending"><Select name="debtAccountId" defaultValue={b?.debtAccountId ?? ""}><option value="">No</option>{ws.accounts.filter((a) => LIABILITY_TYPES.has(a.type)).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
      <Field label="Notes" className="sm:col-span-3"><Textarea name="notes" defaultValue={b?.notes ?? ""} rows={2} /></Field>
      <div className="flex flex-wrap gap-4 sm:col-span-3">
        <Checkbox name="autopay" defaultChecked={b?.autopay} label="Autopay" />
        <Checkbox name="verified" defaultChecked={b?.verified ?? true} label="Amount & date confirmed" />
      </div>
    </div>
  );
}

export default async function BillsPage() {
  const ws = await loadWorkspace();
  const s = ws.settings;
  const today = todayISO();
  const mode = s.reserveMode as ReserveMode;
  const active = ws.bills.filter((b) => b.active);
  const half = reserveSummary(active, "half_month");
  const ann = reserveSummary(active, "annualized");
  const funding = fundingStatuses(ws, today);
  const horizon = addDays(today, 365);
  const paydays = s.anchorPayday ? paydaysBetween(s.anchorPayday, today, horizon, s.payIntervalDays) : [];
  const sims = s.anchorPayday
    ? active.filter(isScheduled).map((b) => {
        const f = funding.find((x) => x.billId === b.id);
        const startReserve = f?.fundedCents ?? 0;
        return { b, sim: simulateSinkingFund(b, paydays, perCheckReserve(b, mode), startReserve, today, horizon), startReserve };
      })
    : [];
  const unscheduled = active.filter((b) => !isScheduled(b));
  const primary = primaryAccount(ws);

  return (
    <>
      <PageHeader title="Bills" subtitle="Recurring bills, the reserve each paycheck sets aside for them, and any funding gaps before due dates." />

      {active.some((b) => !b.verified) && (
        <Notice tone="warn" className="mb-4" title={`${active.filter((b) => !b.verified).length} bill${active.filter((b) => !b.verified).length === 1 ? " is" : "s are"} unverified`}>
          These are your reported estimates. Confirm amounts and add due days — missing expenses (groceries, utilities…) are not assumed to be zero.
        </Notice>
      )}

      <Card>
        <CardHeader title="Recurring bills" subtitle={`${formatCents(half.totalMonthly)}/month listed`} />
        <CardBody className="pt-2">
          <ul className="divide-y divide-border">
            {ws.bills.map((b) => {
              const cat = ws.categories.find((c) => c.id === b.categoryId);
              const f = funding.find((x) => x.billId === b.id);
              return (
                <li key={b.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{b.name}</span>
                      <span className="ml-2 text-xs text-muted">{b.frequency}{b.dueDay ? ` · due day ${b.dueDay}` : ""}{b.anchorDate ? ` · from ${formatDate(b.anchorDate)}` : ""} · {cat?.name ?? "Uncategorized"} ({cat?.bucket ?? "needs"})</span>
                    </span>
                    {!isScheduled(b) && <Badge tone="warn">No due date</Badge>}
                    {b.verified ? <Badge tone="brand">Confirmed</Badge> : <Badge tone="warn">Unverified</Badge>}
                    {b.autopay && <Badge>Autopay</Badge>}
                    {f && <Badge tone={f.status === "gap" ? "danger" : f.status === "funded" ? "brand" : "info"}>{f.status === "gap" ? "Gap" : f.status === "funded" ? "Funded" : "On track"}</Badge>}
                    <Money cents={b.amountCents} className="font-semibold" />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {!b.verified && <ActionForm action={verifyItem}><input type="hidden" name="kind" value="bill" /><input type="hidden" name="id" value={b.id} /><SubmitButton size="sm" variant="secondary">Confirm amount</SubmitButton></ActionForm>}
                  </div>
                  <Details summary={<span className="text-xs font-normal text-muted">Edit · record payment</span>} className="mt-1 border-0 bg-transparent [&>summary]:px-0 [&>summary]:py-1 [&>div]:border-0 [&>div]:px-0">
                    <ActionForm action={saveBill}><BillFields ws={ws} b={b} /><SubmitButton className="mt-3" size="sm">Save bill</SubmitButton></ActionForm>
                    <ActionForm action={payBill} className="mt-4 grid gap-2 rounded-xl bg-surface-2 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
                      <input type="hidden" name="billId" value={b.id} />
                      <Field label="Paid on"><Input type="date" name="date" defaultValue={today} /></Field>
                      <Field label="Amount"><MoneyInput name="amount" defaultValue={centsToDecimalString(b.amountCents)} /></Field>
                      <Field label="From"><Select name="accountId" defaultValue={b.accountId ?? primary?.id ?? ""}>{ws.accounts.filter((a) => !a.archived && a.type !== "investment").map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
                      <SubmitButton size="sm">Record payment</SubmitButton>
                    </ActionForm>
                    <ActionForm action={deleteBill} className="mt-3"><input type="hidden" name="id" value={b.id} /><ConfirmButton variant="ghost" size="sm" message={`Delete ${b.name}?`}>Delete bill</ConfirmButton></ActionForm>
                  </Details>
                </li>
              );
            })}
          </ul>
          <Details summary="Add a bill" className="mt-3"><ActionForm action={saveBill} resetOnSuccess><BillFields ws={ws} /><SubmitButton className="mt-3">Add bill</SubmitButton></ActionForm></Details>
        </CardBody>
      </Card>

      <Card className="mt-4" id="reserves">
        <CardHeader title="Per-paycheck reserves" subtitle="Two clearly-labeled ways to fund monthly bills from biweekly pay. Pick one; you can switch anytime." />
        <CardBody className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {(["half_month", "annualized"] as const).map((m) => {
              const sum = m === "half_month" ? half : ann;
              return (
                <ActionForm key={m} action={setReserveMode} className={cn("rounded-2xl border p-4", mode === m ? "border-brand/60 bg-brand/5" : "border-border")}>
                  <input type="hidden" name="mode" value={m} />
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{RESERVE_MODE_LABELS[m].title}</p>
                    {mode === m ? <Badge tone="brand">Active</Badge> : <SubmitButton size="sm" variant="outline">Use this</SubmitButton>}
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-muted">{RESERVE_MODE_LABELS[m].explain}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-muted">Per check</p><p className="font-semibold tabular">{formatCents(sum.totalPerCheck)}</p></div>
                    <div><p className="text-xs text-muted">Reserved / yr</p><p className="font-semibold tabular">{formatCents(sum.reservedPerYear, { noCents: true })}</p></div>
                    <div><p className="text-xs text-muted">vs needed</p><p className={cn("font-semibold tabular", sum.extraPerYear > 0 && "text-brand")}>{sum.extraPerYear >= 0 ? "+" : ""}{formatCents(sum.extraPerYear)}</p></div>
                  </div>
                </ActionForm>
              );
            })}
          </div>
          <Table>
            <thead><tr><th>Bill</th><th className="text-right">Monthly</th><th className="text-right">Half-month / check</th><th className="text-right">Annualized / check</th><th className="text-right">Annual cost</th></tr></thead>
            <tbody>
              {half.rows.map((r, i) => (
                <tr key={r.billId}><td>{r.name}</td><td className="text-right tabular">{formatCents(r.monthlyCents)}</td><td className={cn("text-right tabular", mode === "half_month" && "font-semibold")}>{formatCents(r.perCheckCents)}</td><td className={cn("text-right tabular", mode === "annualized" && "font-semibold")}>{formatCents(ann.rows[i].perCheckCents)}</td><td className="text-right tabular text-muted">{formatCents(r.annualCents)}</td></tr>
              ))}
              <tr className="font-semibold"><td>Total</td><td className="text-right tabular">{formatCents(half.totalMonthly)}</td><td className="text-right tabular">{formatCents(half.totalPerCheck)}</td><td className="text-right tabular">{formatCents(ann.totalPerCheck)}</td><td className="text-right tabular">{formatCents(half.totalAnnualCost)}</td></tr>
            </tbody>
          </Table>
          <p className="text-xs text-muted">Half-month: {formatCents(half.totalPerCheck)} × 26 checks = {formatCents(half.reservedPerYear)} reserved vs {formatCents(half.totalAnnualCost)} needed — about {formatCents(half.extraPerYear)} of extra buffer a year. Annualized: {formatCents(ann.totalPerCheck)} × 26 = {formatCents(ann.reservedPerYear)}.</p>
        </CardBody>
      </Card>

      <Card className="mt-4" id="funding">
        <CardHeader title="Funding status — next due date" subtitle="Funded = reserves you've confirmed as set aside. Planned = this mode's reserves from paychecks still to come before the due date." />
        <CardBody className="pt-2">
          {!s.anchorPayday ? <p className="text-sm text-muted">Set your payday on My Paycheck to see funding status.</p> : funding.length === 0 ? <p className="text-sm text-muted">Add due days to your bills to track funding.</p> : (
            <Table>
              <thead><tr><th>Bill</th><th>Due</th><th className="text-right">Amount</th><th className="text-right">Funded</th><th className="text-right">Planned before due</th><th className="text-right">Gap</th></tr></thead>
              <tbody>
                {funding.map((f) => (
                  <tr key={f.billId}>
                    <td>{f.name}</td><td>{formatDate(f.dueDate, "weekday")}</td>
                    <td className="text-right tabular">{formatCents(f.amountCents)}</td>
                    <td className="text-right tabular">{formatCents(f.fundedCents)}</td>
                    <td className="text-right tabular text-muted">{formatCents(f.plannedBeforeDueCents)}</td>
                    <td className={cn("text-right tabular font-semibold", f.gapCents > 0 ? "text-danger" : "text-brand")}>{f.gapCents > 0 ? formatCents(f.gapCents) : "None"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {unscheduled.length > 0 && <p className="mt-3 text-xs text-warn">Not tracked (no due date): {unscheduled.map((b) => b.name).join(", ")}.</p>}
        </CardBody>
      </Card>

      {sims.length > 0 && (
        <Card className="mt-4">
          <CardHeader title={`12-month reserve simulation · ${RESERVE_MODE_LABELS[mode].short} mode`} subtitle="Walks every real payday and due date for the next year, starting from what you've confirmed as set aside." />
          <CardBody className="pt-2">
            <Table>
              <thead><tr><th>Bill</th><th className="text-right">Per check</th><th className="text-right">Starting reserve</th><th className="text-right">Due dates short</th><th className="text-right">Total shortfall</th><th className="text-right">Cushion needed today</th></tr></thead>
              <tbody>
                {sims.map(({ b, sim, startReserve }) => (
                  <tr key={b.id}>
                    <td>{b.name}</td>
                    <td className="text-right tabular">{formatCents(perCheckReserve(b, mode))}</td>
                    <td className="text-right tabular">{formatCents(startReserve)}</td>
                    <td className="text-right tabular">{sim.occurrences.filter((o) => o.shortfallCents > 0).length} / {sim.occurrences.length}</td>
                    <td className={cn("text-right tabular", sim.totalShortfall > 0 && "text-danger font-semibold")}>{formatCents(sim.totalShortfall)}</td>
                    <td className="text-right tabular">{formatCents(Math.max(0, sim.startingReserveNeeded - startReserve))}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            {(() => {
              const first = sims.flatMap((x) => x.sim.occurrences.filter((o) => o.shortfallCents > 0).map((o) => ({ ...o, name: x.b.name }))).sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
              return first ? <Notice tone="warn" className="mt-3" title={`First gap: ${first.name} on ${formatDate(first.dueDate, "long")}`}>Only {formatCents(first.reserveBefore)} would be reserved for a {formatCents(first.amountCents)} bill. Confirm reserves you've already set aside, add a starting cushion, or use half-month mode.</Notice> : <Notice tone="brand" className="mt-3" title="No reserve gaps in the next 12 months">Assuming each paycheck's reserve is actually set aside.</Notice>;
            })()}
          </CardBody>
        </Card>
      )}
    </>
  );
}
