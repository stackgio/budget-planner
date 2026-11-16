import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { appContext } from "@/server/context";
import { loadExtraMonths } from "@/server/extra";
import { depositsWithBalance, listPlans, loadDraft } from "@/server/plans";
import { formatLocalDate, monthKey } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Section } from "@/ui/bits";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { spinAction } from "../../ledger-actions";
import { DraftView, RerollButton } from "../../PlanEditor";
import { ExtraCard, monthLabel } from "../../ExtraCard";

export default async function ExtraMonthPage({ params, searchParams }: { params: Promise<{ month: string }>; searchParams: Promise<{ deposit?: string }> }) {
  const { user, today } = await appContext();
  const { month } = await params;
  const sp = await searchParams;
  if (!/^\d{4}-\d{2}$/.test(month)) notFound();
  const { months, verified } = await loadExtraMonths(user.id);
  const m = months.find((x) => x.month === month);
  if (!m) notFound();

  // Funding: only confirmed REGULAR deposits for this month's official paydays.
  const monthPaydayIds = new Set(m.paydays.map((p) => p.deposit?.id).filter(Boolean));
  const deposits = (await depositsWithBalance(user.id, "REGULAR")).filter((d) => monthPaydayIds.has(d.id));
  const third = m.paydays[2]?.deposit?.id;
  const chosen = deposits.find((d) => d.id === sp.deposit) ?? deposits.find((d) => d.id === third) ?? null;
  const draft = chosen ? await loadDraft(user.id, "EXTRA_PAYCHECK", chosen.id) : await loadDraft(user.id, "EXTRA_PAYCHECK", null, month);
  const plans = (await listPlans(user.id, { kind: "EXTRA_PAYCHECK" })).filter((p) => p.deposit && monthPaydayIds.has(p.deposit.id));

  const fundingFields = chosen
    ? <input type="hidden" name="depositId" value={chosen.id} />
    : <input type="hidden" name="forecastMonth" value={month} />;
  const dollars = (c?: number | null) => (c == null ? "" : (c / 100).toFixed(2));

  return (
    <div className="space-y-4">
      <Link href="/money/extra" className="btn-ghost btn-sm -ml-2"><ChevronLeft size={16} /> Extra Paycheck Planner</Link>
      <PageHeader eyebrow="Extra paycheck plan" title={monthLabel(month)} />
      <ExtraCard m={m} verified={verified} today={today} />

      <Section title="Funding">
        {deposits.length ? (
          <div className="space-y-2 text-sm">
            <p className="text-mute-300">Binding plans use only confirmed, unallocated regular-paycheck money from this month.</p>
            <div className="flex flex-wrap gap-2">
              {deposits.map((d) => (
                <Link key={d.id} href={`/money/extra/${month}?deposit=${d.id}`} className={chosen?.id === d.id ? "btn-secondary btn-sm border-go text-go" : "btn-ghost btn-sm"}>
                  {formatLocalDate(d.official ?? d.date, "weekday")} · {formatCents(d.availableCents)} free
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-mute-300">No paycheck for {monthLabel(month)} is confirmed yet. You can sketch a <strong className="text-white">non-binding forecast</strong> now; it can only be approved once a real deposit is confirmed and attached.</p>
        )}
      </Section>

      {!draft && (
        <ActionForm action={spinAction} className="card space-y-4">
          <input type="hidden" name="kind" value="EXTRA_PAYCHECK" />
          {fundingFields}
          <input type="hidden" name="challengeBudget" value="0" />
          {chosen ? (
            <Field label="How much of this paycheck is free after bills?" hint={`Up to ${formatCents(chosen.availableCents)} unallocated. Bills and obligations come first.`}>
              <input className="input" name="budget" inputMode="decimal" required placeholder="0.00" />
            </Field>
          ) : (
            <Field label="Amount you expect to have free (forecast)" hint="An estimate only — not income."><input className="input" name="forecastAmount" inputMode="decimal" required placeholder="0.00" /></Field>
          )}
          <p className="text-xs text-mute-400">Overtime defaults (Roth $100, fun $50) are not applied here. Add Roth, guilt-free, emergency or goal amounts yourself on the next step, by dollars or percentage.</p>
          <SubmitButton className="btn-primary w-full">Start plan</SubmitButton>
        </ActionForm>
      )}

      {draft && (
        <>
          <ActionForm action={spinAction} className="card space-y-3">
            <input type="hidden" name="kind" value="EXTRA_PAYCHECK" />
            {fundingFields}
            <input type="hidden" name="budget" value={dollars(draft.budgetCents)} />
            {!chosen && <input type="hidden" name="forecastAmount" value={dollars(draft.forecastCents)} />}
            <input type="hidden" name="challengesSet" value="1" />
            <p className="eyebrow">Optional · Spin my extra paycheck 🎲</p>
            <Field label="Amount for challenge tiles" hint={`Up to ${formatCents(draft.budgetCents - draft.lines.filter((l) => l.status === "PLANNED" && !l.tileId).reduce((a, l) => a + l.amountCents, 0))} after your planned amounts`}>
              <input className="input" name="challengeBudget" inputMode="decimal" defaultValue={draft.params.challengeBudgetCents ? dollars(draft.params.challengeBudgetCents) : ""} placeholder="0.00" />
            </Field>
            <fieldset className="flex flex-wrap gap-3 text-sm">
              <legend className="sr-only">Challenges</legend>
              {[["MOVING_OUT", "Moving-Out"], ["SCHD", "SCHD"], ["DEBT", "Debt (if set up)"]].map(([v, l]) => (
                <label key={v} className="flex min-h-[40px] items-center gap-2"><input type="checkbox" name="challenges" value={v} defaultChecked={!draft.params.challengesOnly || draft.params.challengesOnly.includes(v!)} className="h-5 w-5 accent-[#2bea7a]" /> {l}</label>
              ))}
            </fieldset>
            <RerollButton label="SPIN MY EXTRA PAYCHECK 🎲" />
          </ActionForm>
          <DraftView
            plan={draft}
            availableCents={chosen?.availableCents ?? null}
            approveDepositChoices={chosen ? undefined : []}
            rerollForm={null}
          />
          {!chosen && <p className="text-xs text-warn">Forecast only. Confirm a regular paycheck for this month on Regular Payroll to approve a binding plan.</p>}
        </>
      )}

      {plans.length > 0 && (
        <Section title="Approved plans this month">
          <ul className="divide-line">{plans.map((p) => <li key={p.id}><Link href={`/money/plans/${p.id}`} className="flex justify-between py-2 text-sm"><span>{formatCents(p.totals.allocatedCents)} · {p.status.toLowerCase()}</span><span className="text-go">Open →</span></Link></li>)}</ul>
        </Section>
      )}
      <p className="text-xs text-mute-400">Official paydays group the month. An early deposit landing in the previous month ({m.paydays.filter((p) => monthKey(p.manualDepositDate ?? p.expectedDepositDate) !== month).length ? "as happens here" : "e.g. Oct 1 → Sep 30"}) does not create an extra month of its own.</p>
    </div>
  );
}
