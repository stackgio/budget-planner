import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { appContext } from "@/server/context";
import { challengeTotals } from "@/server/ledger";
import { formatLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Section } from "@/ui/bits";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { debtCorrectionAction } from "../../ledger-actions";
import { DebtSetupForm } from "./DebtSetupForm";

export default async function DebtPage() {
  const { user, today } = await appContext();
  const debt = (await challengeTotals(user.id)).find((c) => c.kind === "DEBT")!;
  const locked = debt.tiles.some((t) => t.status === "COMPLETED" || t.reserved);
  return (
    <div className="space-y-4">
      <Link href="/money/challenges" className="btn-ghost btn-sm -ml-2"><ChevronLeft size={16} /> Challenges</Link>
      <PageHeader eyebrow="Debt Payoff" title={debt.status === "SETUP_REQUIRED" ? "Set up your debt challenge" : "Debt balance & setup"} />
      {debt.status !== "SETUP_REQUIRED" && (
        <Section title="Balance history">
          <ul className="divide-line text-sm">
            {debt.balances.map((b, i) => (
              <li key={i} className="flex justify-between py-2"><span>{formatLocalDate(b.asOf)}{b.note ? ` · ${b.note}` : ""}</span><span className="num font-semibold">{formatCents(b.cents)}</span></li>
            ))}
          </ul>
          {debt.priorPaidCents ? <p className="mt-2 text-xs text-mute-400">Paid before the challenge (informational): {formatCents(debt.priorPaidCents)}</p> : null}
          <ActionForm action={debtCorrectionAction} className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-700 pt-4">
            <Field label="New balance"><input className="input" name="balance" inputMode="decimal" required /></Field>
            <Field label="As of"><input className="input" type="date" name="asOf" defaultValue={today} max={today} required /></Field>
            <Field label="Note" className="col-span-2"><input className="input" name="note" maxLength={200} placeholder="e.g. statement balance" /></Field>
            <div className="col-span-2"><SubmitButton className="btn-secondary w-full">Record balance correction</SubmitButton></div>
          </ActionForm>
          <p className="mt-2 text-xs text-mute-400">Corrections add a new snapshot. Past payments are never changed.</p>
        </Section>
      )}
      {!locked ? (
        <Section title={debt.status === "SETUP_REQUIRED" ? "Configure" : "Re-map tiles"}>
          <p className="mb-4 text-sm text-mute-300">Enter your real balance. Nothing is assumed — not even a common figure like $4,000. Tiles must add up exactly to the target.</p>
          <DebtSetupForm />
        </Section>
      ) : (
        <p className="card text-sm text-mute-400">Tiles already have plans or payments, so the mapping is locked. Use a balance correction instead.</p>
      )}
    </div>
  );
}
