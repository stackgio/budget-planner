import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { rothRoom } from "@/server/ledger";
import { loadPlan } from "@/server/plans";
import { formatLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { IdemKey } from "@/ui/IdemKey";
import { cancelLineAction, cancelPlanAction, completeLineAction, reverseAction } from "../../ledger-actions";
import { LineIcon, MoneyFigure, Progress, StatusPill, lineTitle } from "../../parts";

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, today } = await appContext();
  const { id } = await params;
  const plan = await loadPlan(user.id, id);
  if (!plan) notFound();
  const year = Number(today.slice(0, 4));
  const room = await rothRoom(prisma, user.id, year);
  const live = plan.lines.filter((l) => l.status !== "PLANNED");
  const done = live.filter((l) => l.status === "COMPLETED").length;
  const waiting = live.filter((l) => l.status === "RESERVED");
  const back = plan.kind === "OVERTIME_ROULETTE" ? (plan.deposit ? `/money/roulette/${plan.deposit.id}` : "/money/roulette") : "/money/extra";

  return (
    <div className="space-y-4">
      <Link href={back} className="btn-ghost btn-sm -ml-2"><ChevronLeft size={16} /> Back</Link>
      <header className="rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-850 to-ink-900 p-5">
        <p className="eyebrow">{plan.kind === "OVERTIME_ROULETTE" ? "Overtime Roulette plan" : "Extra paycheck plan"}{plan.deposit && ` · deposit ${formatLocalDate(plan.deposit.date, "weekday")}`}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-mute-400">{plan.status === "APPROVED" ? "Plan total" : plan.status === "COMPLETED" ? "Plan complete" : "Plan cancelled"}</p>
            <MoneyFigure cents={plan.totals.reservedCents + plan.totals.completedCents} className="text-4xl" />
            <p className="mt-1 text-xs text-mute-400"><span className="text-go">{formatCents(plan.totals.completedCents)} confirmed</span> · {formatCents(plan.totals.reservedCents)} reserved, not paid</p>
          </div>
          <span className={plan.status === "COMPLETED" ? "chip-go" : plan.status === "CANCELLED" ? "chip-mute" : "chip-warn"}>{done}/{live.filter((l) => l.status !== "CANCELLED").length} confirmed</span>
        </div>
        <div className="mt-4"><Progress label="Confirmed share of plan" value={plan.totals.completedCents} max={plan.totals.reservedCents + plan.totals.completedCents} /></div>
        <p className="mt-3 text-xs text-mute-400">Make each transfer in your bank or brokerage app yourself, then confirm it below. LEVEL UP never moves money.</p>
      </header>

      <ul className="space-y-2" aria-label="Allocations">
        {live.map((l) => (
          <li key={l.id} className="card">
            <div className="flex items-center gap-3">
              <LineIcon target={l.target} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{lineTitle(l)}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-mute-400">
                  <StatusPill status={l.status} />
                  {l.payment && <span>{l.payment.reversed ? "Corrected" : `Paid ${formatLocalDate(l.payment.paidOn, "weekday")}`}{l.payment.taxYear ? ` · tax year ${l.payment.taxYear}` : ""}</span>}
                  {l.reversal && <span className="text-warn">{l.reversal.note}</span>}
                </div>
              </div>
              <div className="text-right">
                <p className="num font-semibold">{formatCents(l.status === "COMPLETED" ? (l.paidCents ?? 0) : l.amountCents)}</p>
                {l.status === "COMPLETED" && l.paidCents !== l.amountCents && <p className="text-[11px] text-mute-400">of {formatCents(l.amountCents)} · rest released</p>}
              </div>
            </div>
            {l.status === "RESERVED" && (
              <div className="mt-3 flex gap-2">
                <Dialog title={`Confirm: ${lineTitle(l)}`} trigger="I made this transfer" triggerClassName="btn-primary btn-sm flex-1">
                  <ActionForm action={completeLineAction} className="space-y-4">
                    <input type="hidden" name="lineId" value={l.id} />
                    <IdemKey />
                    <Field label="Amount actually transferred" hint={l.tileId ? "Tiles must be paid in full." : `Up to ${formatCents(l.amountCents)}. Anything less is released back to unallocated.`}>
                      <input className="input" name="amount" inputMode="decimal" defaultValue={(l.amountCents / 100).toFixed(2)} readOnly={!!l.tileId} required />
                    </Field>
                    <Field label="Date"><input className="input" type="date" name="date" defaultValue={today} max={today} required /></Field>
                    {l.target === "ROTH" && (
                      <>
                        <Field label="Tax year" hint={room.limitCents !== null ? `${year}: ${formatCents(room.confirmedCents)} contributed of your ${formatCents(room.limitCents)} limit` : "No limit configured — set one on the Roth IRA page"}>
                          <select className="input" name="taxYear" defaultValue={String(year)}><option value={year}>{year}</option><option value={year - 1}>{year - 1} (prior-year contribution)</option></select>
                        </Field>
                        <label className="flex min-h-[44px] items-center gap-3 text-xs text-mute-300"><input type="checkbox" name="ack" className="h-5 w-5 accent-[#2bea7a]" /> Record anyway if this exceeds my configured limit</label>
                      </>
                    )}
                    <Field label="Note (optional)"><input className="input" name="note" maxLength={300} /></Field>
                    <SubmitButton className="btn-primary w-full" pendingText="Confirming…">Confirm transfer</SubmitButton>
                  </ActionForm>
                </Dialog>
                <ActionForm action={cancelLineAction}>
                  <input type="hidden" name="lineId" value={l.id} />
                  <SubmitButton className="btn-ghost btn-sm" pendingText="…">Release</SubmitButton>
                </ActionForm>
              </div>
            )}
            {l.status === "COMPLETED" && l.payment && !l.payment.reversed && (
              <div className="mt-3">
                <Dialog title="Correct this transfer" trigger="Correct" triggerClassName="btn-ghost btn-sm">
                  <ActionForm action={reverseAction} className="space-y-4">
                    <input type="hidden" name="paymentId" value={l.payment.id} />
                    <IdemKey />
                    <p className="text-sm text-mute-300">Use this if the transfer didn&apos;t happen or was recorded by mistake. A correcting entry of −{formatCents(l.payment.amountCents)} is added; nothing is erased{l.tileId ? ", and the tile reopens" : ""}.</p>
                    <Field label="Reason"><input className="input" name="reason" required minLength={3} maxLength={200} /></Field>
                    <SubmitButton className="btn-danger w-full">Record correction</SubmitButton>
                  </ActionForm>
                </Dialog>
              </div>
            )}
          </li>
        ))}
      </ul>

      {waiting.length > 0 && (
        <ActionForm action={cancelPlanAction} className="card">
          <input type="hidden" name="planId" value={plan.id} />
          <p className="mb-3 text-sm text-mute-300">Cancel the {waiting.length} remaining reservation{waiting.length > 1 ? "s" : ""}? {formatCents(plan.totals.reservedCents)} goes back to unallocated. Confirmed transfers stay.</p>
          <SubmitButton className="btn-danger btn-sm">Cancel remaining</SubmitButton>
        </ActionForm>
      )}
    </div>
  );
}
