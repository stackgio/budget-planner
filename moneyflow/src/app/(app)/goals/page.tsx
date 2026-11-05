import { loadWorkspace } from "@/lib/workspace";
import { goalSaved, primaryAccount } from "@/lib/overview";
import { addMonths, diffDays, formatDate, formatMonth, monthOf, todayISO } from "@/lib/dates";
import { centsToDecimalString, formatCents } from "@/lib/money";
import { addGoalContribution, archiveGoal, deleteGoalContribution, saveGoal, verifyItem } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { SubmitButton } from "@/components/shell/SubmitButton";
import { Badge, Card, CardBody, CardHeader, Checkbox, Details, Field, Input, LinkButton, Money, MoneyInput, Notice, PageHeader, Progress, Select, Textarea } from "@/components/ui";

export const metadata = { title: "Goals" };
type WS = Awaited<ReturnType<typeof loadWorkspace>>;
const KINDS: Record<string, string> = { emergency: "Emergency fund", moving: "Apartment / moving", travel: "Travel", birthday: "Birthday", general: "General savings", custom: "Custom" };

function GoalFields({ ws, g }: { ws: WS; g?: WS["goals"][number] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {g && <input type="hidden" name="id" value={g.id} />}
      <Field label="Name"><Input name="name" defaultValue={g?.name} required /></Field>
      <Field label="Type"><Select name="kind" defaultValue={g?.kind ?? "custom"}>{Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
      <Field label="Priority (1 = first)"><Input type="number" name="priority" min={1} max={99} defaultValue={g?.priority ?? 5} /></Field>
      <Field label="Target amount" hint={g?.kind === "emergency" ? "Your own target — e.g. 3–6 months of needs" : undefined}><MoneyInput name="target" defaultValue={g?.targetCents != null ? centsToDecimalString(g.targetCents) : ""} /></Field>
      <Field label="Target date"><Input type="date" name="targetDate" defaultValue={g?.targetDate ?? ""} /></Field>
      <Field label="Planned monthly contribution"><MoneyInput name="monthly" defaultValue={g?.monthlyContributionCents != null ? centsToDecimalString(g.monthlyContributionCents) : ""} /></Field>
      <Field label="Held in account"><Select name="accountId" defaultValue={g?.accountId ?? ""}><option value="">—</option>{ws.accounts.filter((a) => ["savings", "checking", "cash"].includes(a.type) && !a.archived).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
      <Field label="Notes" className="sm:col-span-2"><Textarea name="notes" rows={1} defaultValue={g?.notes ?? ""} /></Field>
      <Checkbox name="verified" defaultChecked={g?.verified ?? true} label="Confirmed" />
    </div>
  );
}

export default async function GoalsPage() {
  const ws = await loadWorkspace();
  const today = todayISO();
  const goals = ws.goals.filter((g) => !g.archived);
  const primary = primaryAccount(ws);
  const cash = ws.accounts.filter((a) => ["checking", "savings", "cash"].includes(a.type) && !a.archived);
  return (
    <>
      <PageHeader title="Savings goals" subtitle="Goal contributions are savings transfers — never counted as spending." actions={<LinkButton href="/budget#rules" variant="outline" size="sm">Prioritize debt over investing</LinkButton>} />
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => {
          const saved = goalSaved(ws, g.id);
          const remaining = g.targetCents !== null ? Math.max(0, g.targetCents - saved) : null;
          const monthsLeft = g.targetDate ? Math.max(1, Math.ceil(diffDays(g.targetDate, today) / 30.44)) : null;
          const needPerMonth = remaining !== null && monthsLeft ? Math.ceil(remaining / monthsLeft) : null;
          const eta = remaining !== null && g.monthlyContributionCents ? (remaining === 0 ? monthOf(today) : addMonths(monthOf(today), Math.ceil(remaining / g.monthlyContributionCents))) : null;
          const contribs = ws.goalContribs.filter((c) => c.goalId === g.id).slice(-6).reverse();
          return (
            <Card key={g.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-semibold">{g.name}</p><p className="text-xs text-muted">{KINDS[g.kind] ?? g.kind} · priority {g.priority}</p></div>
                  <div className="flex gap-1">{!g.verified && <Badge tone="warn">Draft</Badge>}{remaining === 0 && <Badge tone="brand">Reached</Badge>}</div>
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div><p className="text-2xl font-semibold tabular">{formatCents(saved)}</p><p className="text-xs text-muted">{g.targetCents !== null ? `of ${formatCents(g.targetCents)} target` : "No target set yet"}</p></div>
                  {g.targetCents !== null && g.targetCents > 0 && <p className="text-sm font-semibold text-brand">{Math.min(100, Math.round((saved / g.targetCents) * 100))}%</p>}
                </div>
                {g.targetCents !== null && <Progress className="mt-2" value={saved} max={g.targetCents} />}
                <div className="mt-3 space-y-0.5 text-xs text-muted">
                  {g.targetDate && <p>Target date {formatDate(g.targetDate, "long")}{needPerMonth !== null && remaining! > 0 && <> · needs <b className="text-fg">{formatCents(needPerMonth)}/mo</b></>}</p>}
                  {g.monthlyContributionCents !== null && <p>Planned {formatCents(g.monthlyContributionCents)}/mo{eta && remaining! > 0 && <> · reaches target ~{formatMonth(eta)}</>}</p>}
                  {g.targetDate && needPerMonth !== null && g.monthlyContributionCents !== null && needPerMonth > g.monthlyContributionCents && <p className="text-warn">Planned contribution is {formatCents(needPerMonth - g.monthlyContributionCents)}/mo short of the target date.</p>}
                </div>
                {!g.verified && <ActionForm action={verifyItem} className="mt-2"><input type="hidden" name="kind" value="goal" /><input type="hidden" name="id" value={g.id} /><SubmitButton size="sm" variant="secondary">Confirm goal</SubmitButton></ActionForm>}
                <Details summary="Add or withdraw" className="mt-3">
                  <ActionForm action={addGoalContribution} resetOnSuccess className="grid grid-cols-2 gap-2">
                    <input type="hidden" name="goalId" value={g.id} />
                    <Field label="Amount"><MoneyInput name="amount" required /></Field>
                    <Field label="Date"><Input type="date" name="date" defaultValue={today} required /></Field>
                    {g.accountId && <Field label="Move money from (creates a transfer)" className="col-span-2"><Select name="fromAccountId" defaultValue={primary && primary.id !== g.accountId ? primary.id : ""}><option value="">Already in the goal account</option>{cash.filter((a) => a.id !== g.accountId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>}
                    <Field label="Note" className="col-span-2"><Input name="note" /></Field>
                    <Checkbox name="withdraw" label="This is a withdrawal" className="col-span-2" />
                    <SubmitButton size="sm" className="col-span-2">Save</SubmitButton>
                  </ActionForm>
                  {contribs.length > 0 && <ul className="mt-3 divide-y divide-border text-xs">{contribs.map((c) => <li key={c.id} className="flex items-center justify-between py-1.5"><span>{formatDate(c.date)} · <Money cents={c.amountCents} sign className={c.amountCents < 0 ? "text-danger" : "text-brand"} />{c.note ? ` · ${c.note}` : ""}</span><ActionForm action={deleteGoalContribution}><input type="hidden" name="id" value={c.id} /><button className="text-muted hover:text-danger">Remove</button></ActionForm></li>)}</ul>}
                </Details>
                <Details summary="Edit goal" className="mt-2">
                  <ActionForm action={saveGoal}><GoalFields ws={ws} g={g} /><SubmitButton size="sm" className="mt-3">Save goal</SubmitButton></ActionForm>
                  <ActionForm action={archiveGoal} className="mt-2"><input type="hidden" name="id" value={g.id} /><button className="text-xs text-muted hover:text-danger">Archive goal</button></ActionForm>
                </Details>
              </CardBody>
            </Card>
          );
        })}
      </div>
      {goals.length === 0 && <Notice title="No goals yet">Create one below.</Notice>}
      <Card className="mt-4"><CardHeader title="New goal" /><CardBody><ActionForm action={saveGoal} resetOnSuccess><GoalFields ws={ws} /><SubmitButton className="mt-3">Create goal</SubmitButton></ActionForm></CardBody></Card>
    </>
  );
}
