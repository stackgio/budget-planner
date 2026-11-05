import { loadWorkspace } from "@/lib/workspace";
import { balancesAsOf, primaryAccount } from "@/lib/overview";
import { addMonths, formatDate, formatMonth, monthEnd, monthOf, todayISO } from "@/lib/dates";
import { centsToDecimalString, formatCents, holdingValueCents } from "@/lib/money";
import { addInvestmentContribution, addSnapshot, deleteHolding, deleteInvestmentContribution, saveHolding } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { SubmitButton } from "@/components/shell/SubmitButton";
import { Badge, Card, CardBody, CardHeader, Checkbox, Details, Field, Input, LinkButton, Money, MoneyInput, Notice, PageHeader, Progress, Select, Stat, Table } from "@/components/ui";
import { ContributionsVsValue } from "@/components/charts";
import { cn } from "@/lib/utils";

export const metadata = { title: "Investments" };
const SUGGESTED = ["VTI", "VOO", "SCHD", "QQQM", "VXUS"];

export default async function InvestmentsPage() {
  const ws = await loadWorkspace();
  const today = todayISO();
  const s = ws.settings;
  const bal = balancesAsOf(ws, today);
  const accounts = ws.accounts.filter((a) => a.type === "investment" && !a.archived);
  const cash = ws.accounts.filter((a) => ["checking", "savings", "cash"].includes(a.type) && !a.archived);
  const primary = primaryAccount(ws);
  const thisMonth = monthOf(today);
  const contribThisMonth = ws.invContribs.filter((c) => monthOf(c.date) === thisMonth).reduce((a, c) => a + c.amountCents, 0);
  const contribYTD = ws.invContribs.filter((c) => c.date.slice(0, 4) === today.slice(0, 4)).reduce((a, c) => a + c.amountCents, 0);
  const goal = s.investingGoalMonthly;

  return (
    <>
      <PageHeader title="Investments" subtitle="Manual holdings and values only. MoneyFlow never fetches or invents prices or dividends." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Contributed this month" hint={goal ? `Goal ${formatCents(goal)}/mo` : "Set a monthly goal in Settings"}><Money cents={contribThisMonth} /></Stat>
        <Stat label={`Contributed ${today.slice(0, 4)}`}><Money cents={contribYTD} /></Stat>
        <Stat label="Reported value" hint="From values you entered"><Money cents={accounts.reduce((a, x) => a + (bal.get(x.id) ?? 0), 0)} /></Stat>
        <Stat label="Accounts without a value">{accounts.filter((a) => bal.get(a.id) == null).length}</Stat>
      </div>
      {goal ? <div className="mt-3"><Progress value={contribThisMonth} max={goal} /><p className="mt-1 text-xs text-muted">{formatCents(contribThisMonth)} of {formatCents(goal)} monthly investing goal{s.investingPaused ? " · investing is currently paused by you" : ""}</p></div> : null}

      {accounts.map((a) => {
        const value = bal.get(a.id) ?? null;
        const holdings = ws.holdings.filter((h) => h.accountId === a.id);
        const contribs = ws.invContribs.filter((c) => c.accountId === a.id);
        const totalContrib = contribs.reduce((x, c) => x + c.amountCents, 0);
        const firstSnap = ws.snapshots.find((x) => x.accountId === a.id);
        const startValue = firstSnap ? firstSnap.balanceCents : null;
        // Market change = current value − starting value − contributions since the start
        const contribSinceStart = firstSnap ? contribs.filter((c) => c.date > firstSnap.date).reduce((x, c) => x + c.amountCents, 0) : 0;
        const market = value !== null && startValue !== null ? value - startValue - contribSinceStart : null;
        const holdingsValue = holdings.every((h) => h.manualPriceCents !== null) && holdings.length ? holdings.reduce((x, h) => x + holdingValueCents(h.shares, h.manualPriceCents!), 0) : null;
        const months = Array.from({ length: 12 }, (_, i) => addMonths(thisMonth, i - 11));
        const chart = months.map((m) => ({
          label: formatMonth(m, "short"),
          contributions: contribs.filter((c) => c.date <= monthEnd(m)).reduce((x, c) => x + c.amountCents, 0) + (startValue ?? 0),
          value: ws.snapshots.filter((x) => x.accountId === a.id && monthOf(x.date) === m).pop()?.balanceCents ?? null,
        }));
        return (
          <Card key={a.id} className="mt-4">
            <CardHeader title={a.name} subtitle={`${a.subtype?.replace("_", " ") ?? "investment"}${a.institution ? ` · ${a.institution}` : ""}`} action={!a.verified ? <Badge tone="warn">Unverified</Badge> : undefined} />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div><p className="text-xs text-muted">Reported value</p>{value === null ? <p className="text-muted">Not entered</p> : <Money cents={value} className="text-lg font-semibold" />}</div>
                <div><p className="text-xs text-muted">Your contributions (tracked)</p><Money cents={totalContrib} className="text-lg font-semibold" /></div>
                <div><p className="text-xs text-muted">Market change</p>{market === null ? <p className="text-sm text-muted">Needs 2 values</p> : <Money cents={market} sign colored className="text-lg font-semibold" />}</div>
                <div><p className="text-xs text-muted">Holdings × your prices</p>{holdingsValue === null ? <p className="text-sm text-muted">{holdings.length ? "Some prices missing" : "No holdings"}</p> : <Money cents={holdingsValue} className="text-lg font-semibold" />}</div>
              </div>
              <p className="text-xs text-muted">Market change separates performance from deposits: value now − first recorded value − contributions since then.</p>
              {(contribs.length > 0 || value !== null) && <ContributionsVsValue data={chart} />}

              <div>
                <p className="mb-2 text-sm font-medium">Holdings</p>
                {holdings.length === 0 ? <p className="text-sm text-muted">No holdings entered. Common ETFs: {SUGGESTED.join(", ")} — add only what you actually own.</p> : (
                  <Table>
                    <thead><tr><th>Symbol</th><th className="text-right">Shares</th><th className="text-right">Your price</th><th className="text-right">Value</th><th className="text-right">Cost basis</th><th></th></tr></thead>
                    <tbody>{holdings.map((h) => {
                      const v = h.manualPriceCents !== null ? holdingValueCents(h.shares, h.manualPriceCents) : null;
                      return (
                        <tr key={h.id}>
                          <td><span className="font-medium">{h.symbol}</span>{!h.verified && <Badge tone="warn" className="ml-1">unverified</Badge>}<div className="text-xs text-muted">{h.name}</div></td>
                          <td className="text-right tabular">{h.shares}</td>
                          <td className="text-right tabular">{h.manualPriceCents === null ? <span className="text-muted">—</span> : <>{formatCents(h.manualPriceCents)}<div className="text-[11px] text-muted">as of {formatDate(h.priceAsOf)}</div></>}</td>
                          <td className="text-right tabular">{v === null ? "—" : formatCents(v)}</td>
                          <td className={cn("text-right tabular", v !== null && h.costBasisCents !== null && (v >= h.costBasisCents ? "text-brand" : "text-danger"))}>{h.costBasisCents === null ? "—" : formatCents(h.costBasisCents)}</td>
                          <td><ActionForm action={deleteHolding}><input type="hidden" name="id" value={h.id} /><button className="text-xs text-muted hover:text-danger">Remove</button></ActionForm></td>
                        </tr>
                      );
                    })}</tbody>
                  </Table>
                )}
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                <Details summary="Add holding">
                  <ActionForm action={saveHolding} resetOnSuccess className="grid grid-cols-2 gap-2">
                    <input type="hidden" name="accountId" value={a.id} />
                    <Field label="Symbol"><Input name="symbol" list="symbols" required placeholder="VTI" /></Field>
                    <Field label="Shares"><Input name="shares" inputMode="decimal" placeholder="0" /></Field>
                    <Field label="Price (you enter)"><MoneyInput name="price" /></Field>
                    <Field label="Price date"><Input type="date" name="priceAsOf" defaultValue={today} /></Field>
                    <Field label="Cost basis"><MoneyInput name="costBasis" /></Field>
                    <Field label="Name"><Input name="name" /></Field>
                    <Checkbox name="verified" defaultChecked label="Confirmed holding" className="col-span-2" />
                    <SubmitButton size="sm" className="col-span-2">Add</SubmitButton>
                  </ActionForm>
                </Details>
                <Details summary="Record contribution">
                  <ActionForm action={addInvestmentContribution} resetOnSuccess className="grid grid-cols-2 gap-2">
                    <input type="hidden" name="accountId" value={a.id} />
                    <Field label="Amount"><MoneyInput name="amount" required /></Field>
                    <Field label="Date"><Input type="date" name="date" defaultValue={today} required /></Field>
                    <Field label="From (creates transfer)" className="col-span-2"><Select name="fromAccountId" defaultValue={primary?.id ?? ""}><option value="">Don't create a transfer</option>{cash.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
                    {a.subtype === "roth_ira" && <Field label="Tax year" className="col-span-2"><Input type="number" name="taxYear" defaultValue={today.slice(0, 4)} /></Field>}
                    <SubmitButton size="sm" className="col-span-2">Save</SubmitButton>
                  </ActionForm>
                  {contribs.length > 0 && <ul className="mt-2 divide-y divide-border text-xs">{contribs.slice(-5).reverse().map((c) => <li key={c.id} className="flex justify-between py-1"><span>{formatDate(c.date)} · {formatCents(c.amountCents)}{c.taxYear ? ` · TY${c.taxYear}` : ""}</span><ActionForm action={deleteInvestmentContribution}><input type="hidden" name="id" value={c.id} /><button className="text-muted hover:text-danger">Remove</button></ActionForm></li>)}</ul>}
                </Details>
                <Details summary="Update account value">
                  <ActionForm action={addSnapshot} resetOnSuccess className="grid grid-cols-2 gap-2">
                    <input type="hidden" name="accountId" value={a.id} />
                    <Field label="Value from statement"><MoneyInput name="balance" required /></Field>
                    <Field label="As of"><Input type="date" name="date" defaultValue={today} required /></Field>
                    <SubmitButton size="sm" className="col-span-2">Save value</SubmitButton>
                  </ActionForm>
                </Details>
              </div>
            </CardBody>
          </Card>
        );
      })}
      <datalist id="symbols">{SUGGESTED.map((s) => <option key={s} value={s} />)}</datalist>
      {accounts.length === 0 && <Notice className="mt-4" title="No investment accounts">Add a Roth IRA, taxable, or dividend account on the <LinkButton href="/accounts" variant="ghost" size="sm" className="h-auto px-1 py-0 text-brand">Accounts page</LinkButton>.</Notice>}
      <p className="mt-4 text-xs text-muted">Values are only as current as the last number you entered (shown with dates). Roth IRA contribution limits change yearly — check IRS guidance for the current limit.</p>
    </>
  );
}
