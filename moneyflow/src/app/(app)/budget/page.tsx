import { loadWorkspace } from "@/lib/workspace";
import { categoryBudget, computeOverview, txInRange } from "@/lib/overview";
import { formatMonth, isYearMonth, monthEnd, monthOf, monthStart, todayISO } from "@/lib/dates";
import { allocate, incomeFigures } from "@/lib/paycheck";
import { centsToDecimalString, formatCents } from "@/lib/money";
import { saveAllocationRules, saveCategory, setMonthBudget, decidePlanLine, archiveCategory } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { SubmitButton } from "@/components/shell/SubmitButton";
import { Badge, Card, CardBody, CardHeader, Checkbox, Details, Field, Input, Money, MoneyInput, Notice, PageHeader, Progress, Select } from "@/components/ui";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { Warnings } from "@/components/Warnings";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";
import { categoryEmoji } from "@/lib/emoji";

export const metadata = { title: "Budget" };

const BUCKET_NAMES: Record<string, string> = { needs: "Needs", investing: "Investing", goals: "Financial Goals", guiltfree: "Guilt-Free", income: "Income", transfer: "Transfer" };

export default async function BudgetPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const ws = await loadWorkspace();
  const sp = await searchParams;
  const today = todayISO();
  const current = monthOf(today);
  const month = isYearMonth(sp.month) ? sp.month : current;
  const o = computeOverview(ws, month, today);
  const s = ws.settings;
  const fig = incomeFigures(s.netPayCents, s.payIntervalDays);
  const target = allocate(fig.normalMonth, ws.rules, { investingPaused: s.investingPaused });
  const perCheck = allocate(fig.perPaycheck, ws.rules, { investingPaused: s.investingPaused });
  const monthTx = txInRange(ws, monthStart(month), monthEnd(month));
  // Actual per bucket: spending by category bucket; investing/goals = transfers out of cash accounts
  const cashIds = new Set(ws.accounts.filter((a) => ["checking", "savings", "cash"].includes(a.type)).map((a) => a.id));
  const fullTx = ws.transactions.filter((t) => t.date >= monthStart(month) && t.date <= monthEnd(month));
  const actual: Record<string, number> = { needs: 0, investing: 0, goals: 0, guiltfree: 0 };
  for (const c of o.catRows) if (c.bucket in actual) actual[c.bucket] += c.spentCents;
  actual.needs += o.uncategorized;
  for (const t of fullTx) {
    if (t.type !== "transfer" || t.amountCents >= 0 || !cashIds.has(t.accountId)) continue;
    if (t.transferKind === "investment") actual.investing += -t.amountCents;
    if (t.transferKind === "savings" && ws.accounts.find((a) => a.id === t.accountId)?.type !== "savings") actual.goals += -t.amountCents;
  }
  const debtPaid = fullTx.filter((t) => t.type === "transfer" && t.transferKind === "debt_payment" && t.amountCents < 0).reduce((a, t) => a - t.amountCents, 0);
  const audits = await prisma.auditEvent.findMany({ where: { userId: ws.userId }, orderBy: { at: "desc" }, take: 6 });
  const cats = ws.categories.filter((c) => c.bucket !== "income" && c.bucket !== "transfer" && !c.archived);
  const drafts = ws.planLines;

  return (
    <>
      <PageHeader title="Budget" subtitle="Targets are a plan, not a rule — nothing here moves money for you." actions={<MonthSwitcher month={month} current={current} basePath="/budget" />} />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title={`${formatMonth(month)} by bucket`} subtitle={`Targets use your normal two-paycheck month (${formatCents(fig.normalMonth)}). Actuals come from transactions.`} />
          <CardBody className="space-y-4">
            {target.parts.map((p) => {
              const a = actual[p.key] ?? 0;
              const over = a > p.amountCents && p.amountCents > 0;
              return (
                <div key={p.key}>
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                    <span className="font-medium">{p.label} <span className="text-muted">· {(p.percentBps / 100).toFixed(p.percentBps % 100 ? 2 : 0)}%</span></span>
                    <span className="tabular"><span className={cn(over && "text-danger")}>{formatCents(a)}</span><span className="text-muted"> of {formatCents(p.amountCents)}</span></span>
                  </div>
                  <Progress value={a} max={p.amountCents || 1} tone={over ? (p.key === "needs" || p.key === "guiltfree" ? "danger" : "brand") : "brand"} />
                  <p className="mt-0.5 text-xs text-muted">{p.key === "investing" ? "Investment transfers (not spending)" : p.key === "goals" ? "Savings transfers (not spending)" : "Spending in this bucket's categories"}</p>
                </div>
              );
            })}
            {debtPaid > 0 && <p className="text-xs text-muted">Debt payments this month: {formatCents(debtPaid)} (transfers — the original card purchases were already counted as spending).</p>}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2" id="rules">
          <CardHeader title="Allocation rules" subtitle="Changes require your confirmation and are logged." />
          <CardBody>
            <ActionForm action={saveAllocationRules} className="space-y-3">
              {ws.rules.map((r, i) => (
                <div key={r.key} className="grid grid-cols-[1fr_96px] items-center gap-3">
                  <div>
                    <p className="text-sm font-medium">{r.label}</p>
                    <p className="text-xs text-muted tabular">{formatCents(perCheck.parts[i].amountCents)}/check · {formatCents(target.parts[i].amountCents)}/mo</p>
                  </div>
                  <div className="relative"><Input name={`pct_${r.key}`} defaultValue={(r.percentBps / 100).toString()} inputMode="decimal" className="pr-7 text-right tabular" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">%</span></div>
                </div>
              ))}
              <Checkbox name="investingPaused" defaultChecked={s.investingPaused} label="Temporarily pause investing (prioritize debt or emergencies)" />
              <Checkbox name="confirm" value="yes" label="I confirm these allocation changes" />
              <SubmitButton className="w-full">Save rules</SubmitButton>
            </ActionForm>
            {audits.length > 0 && (
              <Details summary="Change log" className="mt-3">
                <ul className="space-y-2 text-xs text-muted">{audits.map((a) => <li key={a.id}><span className="text-fg">{a.at.toISOString().slice(0, 10)}</span> · {a.message}</li>)}</ul>
              </Details>
            )}
          </CardBody>
        </Card>
      </div>

      {o.needsMargin !== null && (
        <Notice tone={o.needsMargin < 5000 ? "warn" : "info"} className="mt-4" title={`Needs budget ${formatCents(o.needsBudget)} − listed recurring needs ${formatCents(o.listedNeeds)} = ${formatCents(o.needsMargin)} margin`}>
          {o.needsMargin < 5000 ? "That margin is very small. Groceries, utilities and other essentials may not all be listed yet — missing expenses aren't zero. " : ""}Recategorize a bill (e.g. Haircut → a Guilt-Free category) in Bills to change what counts as a Need.
        </Notice>
      )}

      <Card className="mt-4">
        <CardHeader title="Category budgets" subtitle={`Spending in ${formatMonth(month)}. Refunds reduce spending; transfers and card payments are excluded.`} />
        <CardBody className="pt-2">
          <ul className="divide-y divide-border">
            {cats.map((c) => {
              const budget = categoryBudget(ws, month, c.id);
              const spent = o.catRows.find((r) => r.id === c.id)?.spentCents ?? 0;
              const isOverride = ws.budgets.some((b) => b.month === month && b.categoryId === c.id);
              return (
                <li key={c.id} className="py-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-lg leading-none" aria-hidden>{categoryEmoji(c)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.name}</span>
                    <Badge tone="neutral">{BUCKET_NAMES[c.bucket]}</Badge>
                    <span className="text-sm tabular"><Money cents={spent} className={budget !== null && spent > budget ? "text-danger" : ""} /><span className="text-muted"> / {budget === null ? "no budget" : formatCents(budget)}</span></span>
                  </div>
                  {budget !== null && budget > 0 && <Progress className="mt-2" value={spent} max={budget} tone={spent > budget ? "danger" : spent > budget * 0.85 ? "warn" : "brand"} />}
                  <Details summary={<span className="text-xs font-normal text-muted">Edit budget & category{isOverride ? " · custom for this month" : ""}</span>} className="mt-2 border-0 bg-transparent [&>summary]:px-0 [&>summary]:py-1 [&>div]:border-0 [&>div]:px-0">
                    <div className="grid gap-3 md:grid-cols-2">
                      <ActionForm action={setMonthBudget} className="space-y-2">
                        <input type="hidden" name="categoryId" value={c.id} /><input type="hidden" name="month" value={month} />
                        <Field label={`Budget (blank = none)`}><MoneyInput name="amount" defaultValue={budget !== null ? centsToDecimalString(budget) : ""} /></Field>
                        <Checkbox name="asDefault" defaultChecked={!isOverride} label="Use as default for every month" />
                        <SubmitButton size="sm" variant="secondary">Save budget</SubmitButton>
                      </ActionForm>
                      <ActionForm action={saveCategory} className="space-y-2">
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="monthlyBudget" value={c.monthlyBudgetCents !== null ? centsToDecimalString(c.monthlyBudgetCents) : ""} />
                        <div className="grid grid-cols-[56px_1fr_110px_44px] gap-2">
                          <Field label="Emoji"><Input name="emoji" defaultValue={c.emoji ?? ""} placeholder={categoryEmoji({ name: c.name, bucket: c.bucket })} className="px-2 text-center text-lg" maxLength={8} /></Field>
                          <Field label="Name"><Input name="name" defaultValue={c.name} /></Field>
                          <Field label="Bucket"><Select name="bucket" defaultValue={c.bucket}>{Object.entries(BUCKET_NAMES).filter(([k]) => k !== "transfer").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
                          <Field label="Color"><Input type="color" name="color" defaultValue={c.color} className="p-1" /></Field>
                        </div>
                        <SubmitButton size="sm" variant="secondary">Save category</SubmitButton>
                      </ActionForm>
                    </div>
                    <ActionForm action={archiveCategory} className="mt-2"><input type="hidden" name="id" value={c.id} /><button className="text-xs text-muted hover:text-danger">Archive category</button></ActionForm>
                  </Details>
                </li>
              );
            })}
          </ul>
          <Details summary="Add a category" className="mt-3">
            <ActionForm action={saveCategory} resetOnSuccess className="grid gap-2 sm:grid-cols-[64px_1fr_150px_140px_56px_auto] sm:items-end">
              <Field label="Emoji"><Input name="emoji" placeholder="🙂" className="px-2 text-center text-lg" maxLength={8} /></Field>
              <Field label="Name"><Input name="name" required /></Field>
              <Field label="Bucket"><Select name="bucket" defaultValue="needs">{Object.entries(BUCKET_NAMES).filter(([k]) => k !== "transfer").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
              <Field label="Monthly budget"><MoneyInput name="monthlyBudget" /></Field>
              <Field label="Color"><Input type="color" name="color" defaultValue="#10b981" className="p-1" /></Field>
              <SubmitButton>Add</SubmitButton>
            </ActionForm>
          </Details>
        </CardBody>
      </Card>

      {drafts.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Optional plan lines" subtitle="Older reported amounts imported as drafts. Savings and Roth lines are transfers, never spending. Accepted lines are planning targets only." />
          <CardBody className="space-y-2">
            {drafts.map((l) => (
              <ActionForm key={l.id} action={decidePlanLine} className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-3">
                <input type="hidden" name="id" value={l.id} />
                <div className="min-w-[160px] flex-1">
                  <p className="text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted">{l.nature === "spending" ? "Discretionary spending" : l.nature === "investment" ? "Investment transfer" : "Savings transfer"} · {BUCKET_NAMES[l.bucket]}</p>
                </div>
                <div className="w-32"><MoneyInput name="amount" defaultValue={centsToDecimalString(l.monthlyCents)} /></div>
                <Badge tone={l.status === "accepted" ? "brand" : l.status === "dismissed" ? "neutral" : "warn"}>{l.status}</Badge>
                <Select name="status" defaultValue={l.status} className="w-36"><option value="draft">Draft</option><option value="accepted">Accept</option><option value="dismissed">Dismiss</option></Select>
                <SubmitButton size="sm" variant="secondary">Update</SubmitButton>
              </ActionForm>
            ))}
            {(() => {
              const acc = drafts.filter((d) => d.status === "accepted");
              const byBucket = (b: string) => acc.filter((d) => d.bucket === b).reduce((a, d) => a + d.monthlyCents, 0);
              return acc.length ? (
                <p className="pt-1 text-xs text-muted">Accepted lines: Goals {formatCents(byBucket("goals"))} of {formatCents(target.parts.find((p) => p.key === "goals")!.amountCents)} target · Investing {formatCents(byBucket("investing"))} of {formatCents(target.parts.find((p) => p.key === "investing")!.amountCents)} · Guilt-free {formatCents(byBucket("guiltfree"))} of {formatCents(target.parts.find((p) => p.key === "guiltfree")!.amountCents)}</p>
              ) : null;
            })()}
          </CardBody>
        </Card>
      )}

      <Card className="mt-4">
        <CardHeader title="Budget health" subtitle="Every warning links to the fix." />
        <CardBody className="pt-1"><Warnings items={o.warnings} /></CardBody>
      </Card>
      <p className="mt-3 text-xs text-muted">{monthTx.length} transactions in {formatMonth(month)}.</p>
    </>
  );
}
