import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { ProvisionalBadge } from "@/ui/bits";
import { formatLocalDate, type LocalDate } from "@/domain/dates";
import { anchorWarning } from "@/domain/payroll";
import { updateScheduleAction } from "./actions";

export function ScheduleCard({ kind, anchor, verified, offset, interval }: { kind: "REGULAR" | "OVERTIME"; anchor: LocalDate; verified: boolean; offset: number; interval: number }) {
  const warn = anchorWarning(anchor);
  return (
    <section className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{kind === "REGULAR" ? "Regular pay schedule" : "Overtime pay schedule"}</p>
          <p className="mt-1 text-lg font-semibold">Every {interval} days · Fridays</p>
          <p className="mt-0.5 text-sm text-mute-400">Anchor payday: {formatLocalDate(anchor, "long")}</p>
          <p className="text-sm text-mute-400">Expected deposit: {offset === 0 ? "same day" : `${Math.abs(offset)} day${Math.abs(offset) > 1 ? "s" : ""} ${offset < 0 ? "early" : "late"}`} (estimate, not guaranteed)</p>
          {warn && <p className="mt-1 text-xs text-warn">{warn}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <ProvisionalBadge verified={verified} />
          <Dialog title="Edit pay schedule" trigger="Edit schedule" triggerClassName="btn-secondary btn-sm">
            <ActionForm action={updateScheduleAction} className="space-y-4">
              <input type="hidden" name="kind" value={kind} />
              <Field label="Official payday anchor (any real payday)"><input className="input" type="date" name="anchor" defaultValue={anchor} required /></Field>
              <Field label="Expected deposit offset (days)" hint="-1 = deposit usually arrives the Thursday before. 0 = same day.">
                <input className="input" type="number" name="offset" min={-5} max={5} defaultValue={offset} required />
              </Field>
              <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" name="verified" defaultChecked={verified} className="h-5 w-5 accent-[#2bea7a]" /> I verified this anchor against my official payroll records</label>
              <p className="rounded-lg border border-ink-700 p-3 text-xs text-mute-400">Changing the anchor recalculates projected paydays. Paydays with confirmed deposits, $0 confirmations or manual date overrides are always preserved.</p>
              <SubmitButton className="btn-primary w-full">Save schedule</SubmitButton>
            </ActionForm>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
