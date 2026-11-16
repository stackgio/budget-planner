import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { type LocalDate, formatLocalDate, monthKey } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { cn } from "@/ui/cn";
import { IdemKey } from "@/ui/IdemKey";
import { manualDepositDateAction, paydayStatusAction, recordDepositAction, voidDepositAction } from "./actions";

export interface PaydayView {
  id: string; kind: "REGULAR" | "OVERTIME"; officialDate: LocalDate; expectedDepositDate: LocalDate; manualDepositDate: LocalDate | null;
  holidayNote: string | null; status: "EXPECTED" | "RECEIVED" | "ZERO" | "SKIPPED"; note: string | null; onSchedule: boolean;
  deposit: { id: string; netCents: number; actualDepositDate: LocalDate; notes: string | null } | null;
  shiftCount?: number; estGrossCents?: number;
}

export function PaydayRow({ p, today, provisional }: { p: PaydayView; today: LocalDate; provisional: boolean }) {
  const expected = p.manualDepositDate ?? p.expectedDepositDate;
  const crossesMonth = monthKey(expected) !== monthKey(p.officialDate);
  const needsConfirm = !p.deposit && p.status === "EXPECTED" && expected <= today;
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {formatLocalDate(p.officialDate, "weekday")}
            <span className="text-xs font-normal text-mute-400">official</span>
            {provisional && !p.deposit && <span className="chip-warn">provisional</span>}
            {!p.onSchedule && <span className="chip-mute">off current schedule · kept</span>}
            {p.status === "ZERO" && <span className="chip-mute">$0 confirmed</span>}
            {p.status === "SKIPPED" && <span className="chip-mute">skipped</span>}
            {needsConfirm && <span className="chip-warn">needs confirmation</span>}
          </p>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-mute-400">
            <dt>Expected deposit</dt>
            <dd className={cn(crossesMonth && "text-warn")}>{formatLocalDate(expected, "weekday")} <span className="opacity-70">(estimate{p.manualDepositDate ? ", your override" : ""}{crossesMonth ? ", previous month" : ""})</span></dd>
            <dt>Actual deposit</dt>
            <dd>{p.deposit ? <span className="text-go">{formatCents(p.deposit.netCents)} on {formatLocalDate(p.deposit.actualDepositDate, "weekday")}</span> : "Not confirmed"}</dd>
            {p.shiftCount !== undefined && (<><dt>Linked OT shifts</dt><dd>{p.shiftCount} {p.estGrossCents ? `· est. gross ${formatCents(p.estGrossCents)} (before taxes)` : ""}</dd></>)}
          </dl>
          {p.holidayNote && <p className="mt-1.5 flex items-start gap-1.5 text-xs text-warn"><AlertTriangle size={13} className="mt-0.5 shrink-0" />{p.holidayNote}</p>}
          {p.note && <p className="mt-1 text-xs text-mute-300">Note: {p.note}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {!p.deposit && p.status !== "ZERO" && (
            <Dialog title="Confirm actual deposit" trigger={<><CheckCircle2 size={15} /> Record deposit</>} triggerClassName={needsConfirm ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>
              <ActionForm action={recordDepositAction} className="space-y-4">
                <input type="hidden" name="paydayId" value={p.id} />
                <IdemKey />
                <p className="text-sm text-mute-300">{p.kind === "REGULAR" ? "Regular" : "Overtime"} payday {formatLocalDate(p.officialDate, "long")}. Enter what actually landed in your bank — take-home (net), not gross.</p>
                <Field label="Net amount deposited"><input className="input" name="amount" inputMode="decimal" placeholder="0.00" required /></Field>
                <Field label="Date it arrived"><input className="input" type="date" name="date" defaultValue={expected <= today ? expected : today} required /></Field>
                <Field label="Notes (optional)"><input className="input" name="notes" maxLength={500} /></Field>
                <SubmitButton className="btn-primary w-full">Confirm deposit</SubmitButton>
              </ActionForm>
            </Dialog>
          )}
          {!p.deposit && p.kind === "OVERTIME" && p.status !== "ZERO" && (
            <ActionForm action={paydayStatusAction}>
              <input type="hidden" name="paydayId" value={p.id} /><input type="hidden" name="status" value="ZERO" /><input type="hidden" name="note" value="No overtime paid this period" />
              <SubmitButton className="btn-ghost btn-sm" pendingText="…">Mark $0</SubmitButton>
            </ActionForm>
          )}
          {!p.deposit && p.status !== "EXPECTED" && (
            <ActionForm action={paydayStatusAction}>
              <input type="hidden" name="paydayId" value={p.id} /><input type="hidden" name="status" value="EXPECTED" />
              <SubmitButton className="btn-ghost btn-sm" pendingText="…">Undo</SubmitButton>
            </ActionForm>
          )}
          {!p.deposit && (
            <Dialog title="Adjust expected deposit date" trigger="Adjust date" triggerClassName="btn-ghost btn-sm">
              <ActionForm action={manualDepositDateAction} className="space-y-4">
                <input type="hidden" name="paydayId" value={p.id} />
                <p className="text-sm text-mute-300">Use this for holiday timing or a known exception. The official payday ({formatLocalDate(p.officialDate)}) is not changed.</p>
                <Field label="Expected deposit date" hint="Leave empty to go back to the automatic estimate."><input className="input" type="date" name="date" defaultValue={p.manualDepositDate ?? ""} /></Field>
                <SubmitButton className="btn-primary w-full">Save</SubmitButton>
              </ActionForm>
            </Dialog>
          )}
          {p.deposit && (
            <Dialog title="Correct this deposit" trigger="Correct" triggerClassName="btn-ghost btn-sm">
              <ActionForm action={voidDepositAction} className="space-y-4">
                <input type="hidden" name="paydayId" value={p.id} />
                <p className="text-sm text-mute-300">This voids the confirmed deposit of {formatCents(p.deposit.netCents)} so you can re-enter it. The original stays in your history. Not possible while money from it is approved or completed in a plan.</p>
                <Field label="Reason"><input className="input" name="reason" required minLength={3} maxLength={200} placeholder="e.g. typo in amount" /></Field>
                <SubmitButton className="btn-danger w-full">Void deposit</SubmitButton>
              </ActionForm>
            </Dialog>
          )}
        </div>
      </div>
    </li>
  );
}
