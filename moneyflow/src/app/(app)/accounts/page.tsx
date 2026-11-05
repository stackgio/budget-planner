import { loadWorkspace } from "@/lib/workspace";
import { balancesAsOf } from "@/lib/overview";
import { formatDate, todayISO } from "@/lib/dates";
import { centsToDecimalString, formatCents } from "@/lib/money";
import { creditUtilization, LIABILITY_TYPES, netWorth } from "@/lib/ledger";
import { addSnapshot, archiveAccount, deleteSnapshot, saveAccount } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { SubmitButton } from "@/components/shell/SubmitButton";
import { Badge, Card, CardBody, CardHeader, Checkbox, Details, Field, Input, Money, MoneyInput, Notice, PageHeader, Progress, Select, Stat, Textarea } from "@/components/ui";

export const metadata = { title: "Accounts" };

const GROUPS: Array<{ title: string; types: string[] }> = [
  { title: "Cash", types: ["checking", "savings", "cash"] },
  { title: "Credit cards", types: ["credit_card"] },
  { title: "Loans & personal debt", types: ["loan", "personal_debt"] },
  { title: "Investments", types: ["investment"] },
];
const TYPE_LABEL: Record<string, string> = { checking: "Checking", savings: "Savings", cash: "Cash", credit_card: "Credit card", loan: "Loan", personal_debt: "Personal debt", investment: "Investment" };

type Acct = Awaited<ReturnType<typeof loadWorkspace>>["accounts"][number];

function AccountFields({ a }: { a?: Acct }) {
  const liability = a ? LIABILITY_TYPES.has(a.type) : false;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {a && <input type="hidden" name="id" value={a.id} />}
      <Field label="Name"><Input name="name" defaultValue={a?.name} required /></Field>
      <Field label="Type"><Select name="type" defaultValue={a?.type ?? "checking"}>{Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
      <Field label="Institution"><Input name="institution" defaultValue={a?.institution ?? ""} /></Field>
      <Field label="Subtype (investments)"><Select name="subtype" defaultValue={a?.subtype ?? ""}><option value="">—</option><option value="roth_ira">Roth IRA</option><option value="taxable">Taxable brokerage</option><option value="dividend">Dividend portfolio</option><option value="401k">401(k)</option><option value="hsa">HSA</option></Select></Field>
      <Field label="Credit limit (cards)" hint={a?.creditLimitCents && !a.verified ? "Reported — confirm with your issuer" : undefined}><MoneyInput name="creditLimit" defaultValue={a?.creditLimitCents != null ? centsToDecimalString(a.creditLimitCents) : ""} /></Field>
      <Field label="APR %" hint="Leave blank if unknown. Use 0 for interest-free."><Input name="apr" inputMode="decimal" defaultValue={a?.aprBps != null ? String(a.aprBps / 100) : ""} placeholder="e.g. 24.99" /></Field>
      <Field label={liability ? "Minimum / planned monthly payment" : "Minimum payment (debts)"}><MoneyInput name="minPayment" defaultValue={a?.minPaymentCents != null ? centsToDecimalString(a.minPaymentCents) : ""} /></Field>
      <Field label="Payment due day"><Input type="number" min={1} max={31} name="dueDay" defaultValue={a?.dueDay ?? ""} /></Field>
      {!a && <Field label="Current balance (optional)" hint="Cards/loans: enter the amount owed as a positive number."><MoneyInput name="balance" /></Field>}
      <Field label="Notes" className="sm:col-span-2"><Textarea name="notes" defaultValue={a?.notes ?? ""} rows={2} /></Field>
      <Checkbox name="verified" defaultChecked={a?.verified ?? true} label="These details are confirmed" className="sm:col-span-2" />
    </div>
  );
}

export default async function AccountsPage() {
  const ws = await loadWorkspace();
  const today = todayISO();
  const bal = balancesAsOf(ws, today);
  const nw = netWorth(ws.accounts, bal);
  const active = ws.accounts.filter((a) => !a.archived);
  const archived = ws.accounts.filter((a) => a.archived);

  return (
    <>
      <PageHeader title="Accounts" subtitle="Balances come from the balances you enter plus transactions after that date. No bank logins, ever." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Assets"><Money cents={nw.assets} /></Stat>
        <Stat label="Debts"><Money cents={nw.liabilities} /></Stat>
        <Stat label="Net worth"><Money cents={nw.netWorth} /></Stat>
        <Stat label="Missing balances" hint="Excluded from totals until entered">{nw.unknownAccounts.length}</Stat>
      </div>
      {nw.unknownAccounts.length > 0 && <Notice tone="warn" className="mt-3" title="Some balances are unknown">{nw.unknownAccounts.map((id) => ws.accounts.find((a) => a.id === id)?.name).join(", ")} — MoneyFlow treats these as unknown, not $0. Use “Update balance” to enter one.</Notice>}

      {GROUPS.map((g) => {
        const list = active.filter((a) => g.types.includes(a.type));
        if (!list.length) return null;
        return (
          <section key={g.title} className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{g.title}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((a) => {
                const b = bal.get(a.id) ?? null;
                const liability = LIABILITY_TYPES.has(a.type);
                const owed = liability && b !== null ? -b : null;
                const u = liability ? creditUtilization(owed, a.creditLimitCents) : null;
                const snaps = ws.snapshots.filter((s) => s.accountId === a.id).slice(-5).reverse();
                const last = snaps[0];
                return (
                  <Card key={a.id}>
                    <CardBody>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{a.name}</p>
                          <p className="text-xs text-muted">{TYPE_LABEL[a.type]}{a.subtype ? ` · ${a.subtype.replace("_", " ")}` : ""}{a.institution ? ` · ${a.institution}` : ""}</p>
                        </div>
                        {!a.verified && <Badge tone="warn">Unverified</Badge>}
                      </div>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <p className="text-xs text-muted">{liability ? "Owed" : "Balance"}</p>
                          <p className="text-2xl font-semibold tracking-tight">{b === null ? <span className="text-base font-normal text-muted">Unknown — not entered</span> : <Money cents={liability ? owed : b} />}</p>
                          {last && <p className="text-[11px] text-muted">Last entered {formatDate(last.date)}{b !== null && last.balanceCents !== b ? " + later transactions" : ""}</p>}
                        </div>
                        {u && u.limitCents !== null && (
                          <div className="text-right text-xs text-muted">
                            <p>Limit {formatCents(u.limitCents, { noCents: true })}</p>
                            {u.utilizationBps !== null && <p className={u.utilizationBps > 3000 ? "text-warn" : ""}>{(u.utilizationBps / 100).toFixed(0)}% used</p>}
                          </div>
                        )}
                      </div>
                      {u?.utilizationBps != null && <><Progress className="mt-2" value={u.utilizationBps} max={10000} tone={u.utilizationBps > 3000 ? "warn" : "brand"} /><p className="mt-1 text-[11px] text-muted">{formatCents(u.availableCreditCents)} available credit — not spendable cash</p></>}
                      {liability && <p className="mt-2 text-xs text-muted">APR {a.aprBps === null ? <b className="text-warn">unknown</b> : `${a.aprBps / 100}%`} · Min {a.minPaymentCents === null ? <b className="text-warn">unknown</b> : formatCents(a.minPaymentCents)} · Due {a.dueDay ? `day ${a.dueDay}` : <b className="text-warn">unknown</b>}</p>}
                      {a.notes && <p className="mt-2 text-xs text-muted">{a.notes}</p>}

                      <Details summary="Update balance" className="mt-3">
                        <ActionForm action={addSnapshot} resetOnSuccess className="grid grid-cols-[1fr_1fr] gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                          <input type="hidden" name="accountId" value={a.id} />
                          <Field label={liability ? "Amount owed" : "Balance"}><MoneyInput name="balance" required /></Field>
                          <Field label="As of"><Input type="date" name="date" defaultValue={today} required /></Field>
                          <SubmitButton className="col-span-2 sm:col-span-1">Save</SubmitButton>
                        </ActionForm>
                        {snaps.length > 0 && (
                          <ul className="mt-3 divide-y divide-border text-xs">
                            {snaps.map((s) => (
                              <li key={s.id} className="flex items-center justify-between py-1.5">
                                <span>{formatDate(s.date)} · {formatCents(liability ? -s.balanceCents : s.balanceCents)}{s.note ? ` · ${s.note}` : ""}</span>
                                <ActionForm action={deleteSnapshot}><input type="hidden" name="id" value={s.id} /><button className="text-muted hover:text-danger">Remove</button></ActionForm>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Details>
                      <Details summary="Edit details" className="mt-2">
                        <ActionForm action={saveAccount}><AccountFields a={a} /><SubmitButton className="mt-3">Save account</SubmitButton></ActionForm>
                        <ActionForm action={archiveAccount} className="mt-3"><input type="hidden" name="id" value={a.id} /><button className="text-xs text-muted hover:text-danger">Archive account</button></ActionForm>
                      </Details>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      <Card className="mt-6">
        <CardHeader title="Add an account" subtitle="Checking, savings, cards, loans, money owed to a friend, or investment accounts." />
        <CardBody><ActionForm action={saveAccount} resetOnSuccess><AccountFields /><SubmitButton className="mt-3">Add account</SubmitButton></ActionForm></CardBody>
      </Card>

      {archived.length > 0 && (
        <Details summary={`Archived (${archived.length})`} className="mt-4">
          <ul className="space-y-2 text-sm">{archived.map((a) => <li key={a.id} className="flex justify-between"><span>{a.name}</span><ActionForm action={archiveAccount}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="restore" value="1" /><button className="text-brand">Restore</button></ActionForm></li>)}</ul>
        </Details>
      )}
    </>
  );
}
