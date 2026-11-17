import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { rothRoom } from "@/server/ledger";
import { dateToLocal, formatLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Section, Stat, Empty } from "@/ui/bits";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { Dialog } from "@/ui/dialog";
import { IdemKey } from "@/ui/IdemKey";
import { manualPaymentAction, rothLimitAction } from "../ledger-actions";
import { Progress } from "../parts";

export default async function RothPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { user, today } = await appContext();
  const sp = await searchParams;
  const year = /^\d{4}$/.test(sp.year ?? "") ? Number(sp.year) : Number(today.slice(0, 4));
  const room = await rothRoom(prisma, user.id, year);
  const cfg = await prisma.rothYear.findUnique({ where: { ownerId_taxYear: { ownerId: user.id, taxYear: year } } });
  const history = await prisma.payment.findMany({ where: { ownerId: user.id, kind: "ROTH_CONTRIBUTION", taxYear: year }, orderBy: { paidOn: "desc" } });

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Money" title="Roth IRA">
        <div className="flex gap-1">{[year - 1, year, year + 1].map((y) => <a key={y} href={`/money/roth?year=${y}`} className={y === year ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}>{y}</a>)}</div>
      </PageHeader>
      <section className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={`Confirmed ${year}`} value={formatCents(room.confirmedCents)} tone="go" sub="contributions you made" />
        <Stat label={`Planned for ${year}`} value={formatCents(room.plannedCents)} sub="approved, not contributed yet" />
        <Stat label="Your configured limit" value={room.limitCents === null ? "Not set" : formatCents(room.limitCents)} tone="mute" />
        <Stat label="Room left" value={room.remainingCents === null ? "—" : formatCents(room.remainingCents)} tone={room.remainingCents === 0 ? "warn" : "mute"} sub="after confirmed + planned" />
        {room.limitCents !== null && <div className="col-span-2 sm:col-span-4"><Progress label="Roth contributions vs configured limit" value={room.confirmedCents} max={room.limitCents} /></div>}
      </section>
      <Section title={`${year} limit`}>
        <p className="mb-3 text-sm text-mute-300">Enter the annual contribution limit that applies to you for {year}. LEVEL UP doesn&apos;t hardcode IRS figures, and a configured limit does not establish your eligibility — check the IRS or your tax professional.</p>
        <ActionForm action={rothLimitAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="taxYear" value={year} />
          <Field label="Annual limit" className="w-40"><input className="input" name="limit" inputMode="decimal" defaultValue={cfg?.limitCents != null ? (cfg.limitCents / 100).toFixed(2) : ""} placeholder="leave blank" /></Field>
          <Field label="Source / note" className="min-w-[160px] flex-1"><input className="input" name="note" defaultValue={cfg?.note ?? ""} maxLength={200} placeholder="e.g. IRS.gov, checked Jan 2027" /></Field>
          <SubmitButton className="btn-secondary">Save</SubmitButton>
        </ActionForm>
      </Section>
      <Section title="Contribution history" action={
        <Dialog title="Record a Roth contribution" trigger="Record contribution" triggerClassName="btn-secondary btn-sm">
          <ActionForm action={manualPaymentAction} className="space-y-4">
            <input type="hidden" name="kind" value="ROTH" /><IdemKey />
            <p className="text-sm text-mute-300">For contributions made outside a Roulette or extra-paycheck plan.</p>
            <Field label="Amount"><input className="input" name="amount" inputMode="decimal" required /></Field>
            <Field label="Date"><input className="input" type="date" name="date" defaultValue={today} max={today} required /></Field>
            <Field label="Tax year"><select className="input" name="taxYear" defaultValue={String(year)}><option>{year}</option><option>{year - 1}</option></select></Field>
            <label className="flex min-h-[44px] items-center gap-3 text-xs text-mute-300"><input type="checkbox" name="ack" className="h-5 w-5 accent-[#2bea7a]" /> Record anyway if over my configured limit</label>
            <SubmitButton className="btn-primary w-full">Record</SubmitButton>
          </ActionForm>
        </Dialog>
      }>
        {history.length ? (
          <ul className="divide-line text-sm">
            {history.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <span className={p.reversedAt ? "text-mute-400 line-through" : ""}>{formatLocalDate(dateToLocal(p.paidOn), "weekday")} · {p.reversalOfId ? "correction" : p.source === "MANUAL" ? "outside Roulette" : p.source === "ROULETTE" ? "Overtime Roulette" : "extra paycheck"}</span>
                <span className={`num font-semibold ${p.amountCents < 0 ? "text-bad" : ""}`}>{formatCents(p.amountCents)}</span>
              </li>
            ))}
          </ul>
        ) : <Empty>No {year} contributions confirmed. A Roulette reservation is not a contribution until you confirm the transfer.</Empty>}
      </Section>
    </div>
  );
}
