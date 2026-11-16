import { Dices, Plus, Trash2 } from "lucide-react";
import { formatCents } from "@/domain/money";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import type { PlanView } from "@/server/plans";
import { approveAction, cancelPlanAction, draftEditAction } from "./ledger-actions";
import { LineIcon, MoneyFigure, lineTitle } from "./parts";

/** Draft view: proposal lines with edit controls, free-money hero, and approval. */
export function DraftView({ plan, availableCents, approveDepositChoices, rerollForm, notes }: {
  plan: PlanView;
  availableCents: number | null;
  approveDepositChoices?: { id: string; label: string; availableCents: number }[];
  rerollForm: React.ReactNode;
  notes?: string[];
}) {
  const funLine = plan.lines.find((l) => l.target === "FUN");
  const unallocated = plan.budgetCents - plan.totals.plannedCents;
  return (
    <section className="space-y-4" aria-label="Proposed allocation">
      <div className="card-tight overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
          <p className="eyebrow">Draft proposal · nothing reserved or moved</p>
          <span className="chip-mute">Draft</span>
        </div>
        <ul className="divide-line px-4">
          {plan.lines.filter((l) => l.status === "PLANNED").map((l, i) => (
            <li key={l.id} className="flex items-center gap-3 py-3 motion-safe:animate-[lu-pop_220ms_ease-out_both]" style={{ animationDelay: `${i * 40}ms` }}>
              <LineIcon target={l.target} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{lineTitle(l)}</p>
                <p className="text-xs text-mute-400">{l.tileId ? "Challenge tile" : l.target === "ROTH" ? "Contribution to make yourself" : l.target === "FUN" ? "Yours to enjoy" : "Transfer to make yourself"}</p>
              </div>
              <span className="num font-semibold">{formatCents(l.amountCents)}</span>
              <ActionForm action={draftEditAction}>
                <input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="op" value="remove" /><input type="hidden" name="lineId" value={l.id} />
                <SubmitButton className="btn-ghost btn-sm px-2" pendingText="…"><Trash2 size={15} aria-label={`Remove ${lineTitle(l)}`} /></SubmitButton>
              </ActionForm>
            </li>
          ))}
          {!plan.lines.some((l) => l.status === "PLANNED") && <li className="py-4 text-sm text-mute-400">Nothing proposed yet.</li>}
        </ul>
        <dl className="grid grid-cols-3 gap-2 border-t border-ink-700 px-4 py-3 text-xs text-mute-400">
          <div><dt>Budget</dt><dd className="num text-sm font-semibold text-white">{formatCents(plan.budgetCents)}</dd></div>
          <div><dt>Proposed</dt><dd className="num text-sm font-semibold text-white">{formatCents(plan.totals.plannedCents)}</dd></div>
          <div><dt>Unallocated</dt><dd className="num text-sm font-semibold text-white">{formatCents(unallocated)}</dd></div>
        </dl>
      </div>

      {plan.kind === "OVERTIME_ROULETTE" && (
        <div className="rounded-3xl border border-warn/30 bg-gradient-to-br from-warn/10 to-transparent p-5 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-warn">Your free money</p>
          <p className="mt-1 text-4xl"><MoneyFigure cents={funLine?.amountCents ?? 0} /> <span aria-hidden>😎</span></p>
        </div>
      )}

      {notes && notes.length > 0 && (
        <ul className="space-y-1 rounded-2xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn" role="status">{notes.map((n) => <li key={n}>{n}</li>)}</ul>
      )}

      <div className="flex flex-wrap gap-2">
        {rerollForm}
        <Dialog title="Adjust amounts" trigger={<><Plus size={16} /> Adjust</>} triggerClassName="btn-secondary">
          <div className="space-y-5">
            <ActionForm action={draftEditAction} className="space-y-3">
              <input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="op" value="setAmount" />
              <Field label="What"><select className="input" name="target" defaultValue="ROTH"><option value="ROTH">Roth IRA</option><option value="FUN">Guilt-free money</option><option value="EMERGENCY">Emergency savings</option><option value="GOAL">Other goal</option></select></Field>
              <Field label="Goal name (for “Other goal”)"><input className="input" name="label" maxLength={40} /></Field>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <Field label="Amount"><input className="input" name="value" inputMode="decimal" required placeholder="0.00" /></Field>
                <Field label="As"><select className="input" name="mode" defaultValue="dollars"><option value="dollars">$</option><option value="percent">% of budget</option></select></Field>
              </div>
              <p className="text-xs text-mute-400">Set 0 to remove. The total can never exceed the budget.</p>
              <SubmitButton className="btn-primary w-full">Save amount</SubmitButton>
            </ActionForm>
            <ActionForm action={draftEditAction} className="space-y-3 border-t border-ink-700 pt-4">
              <input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="op" value="addTile" />
              <p className="text-sm font-semibold">Add a specific tile</p>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Challenge"><select className="input" name="challenge" defaultValue="MOVING_OUT"><option value="MOVING_OUT">Moving-Out</option><option value="SCHD">SCHD (next day only)</option><option value="DEBT">Debt</option></select></Field>
                <Field label="Tile / day #"><input className="input" name="number" type="number" min={1} required /></Field>
              </div>
              <SubmitButton className="btn-secondary w-full">Add tile</SubmitButton>
            </ActionForm>
          </div>
        </Dialog>
        <ActionForm action={cancelPlanAction}>
          <input type="hidden" name="planId" value={plan.id} />
          <SubmitButton className="btn-ghost" pendingText="…">Discard draft</SubmitButton>
        </ActionForm>
      </div>

      {approveDepositChoices && approveDepositChoices.length === 0 ? (
        <p className="card text-sm text-mute-300">This is a forecast. It can be approved once a real paycheck for this month is confirmed — nothing is reserved until then.</p>
      ) : (
      <ActionForm action={approveAction} className="card space-y-3">
        <input type="hidden" name="planId" value={plan.id} /><input type="hidden" name="version" value={plan.version} />
        {approveDepositChoices && (
          <Field label="Fund this plan from a confirmed regular deposit">
            <select className="input" name="depositId" required defaultValue="">
              <option value="" disabled>Choose a deposit…</option>
              {approveDepositChoices.map((d) => <option key={d.id} value={d.id} disabled={d.availableCents < plan.totals.plannedCents}>{d.label} · {formatCents(d.availableCents)} unallocated</option>)}
            </select>
          </Field>
        )}
        <p className="text-sm text-mute-300">Approving <strong className="text-white">reserves {formatCents(plan.totals.plannedCents)}</strong>{availableCents !== null && <> of the {formatCents(availableCents)} still unallocated</>}. No money moves, and no tile is completed until you confirm each real transfer.</p>
        <SubmitButton className="btn-primary w-full" pendingText="Approving…">Approve plan</SubmitButton>
      </ActionForm>
      )}
    </section>
  );
}

export function RerollButton({ label = "REROLL 🎲" }: { label?: string }) {
  return <SubmitButton className="btn-secondary" pendingText="Spinning…"><Dices size={16} /> {label}</SubmitButton>;
}
