import { appContext } from "@/server/context";
import { loadExtraMonths } from "@/server/extra";
import { monthKey } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Section, Empty } from "@/ui/bits";
import Link from "next/link";
import { ExtraCard, monthLabel } from "../ExtraCard";

export default async function ExtraPaycheckPage() {
  const { user, today } = await appContext();
  const { months, verified, lastConfirmedNet } = await loadExtraMonths(user.id);
  const upcoming = months.filter((m) => m.month >= monthKey(today));
  const past = months.filter((m) => m.month < monthKey(today) && m.receivedCount > 0); // only months with real deposits
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Money" title="Extra Paycheck Planner" />
      <section className="card text-sm text-mute-300">
        <p>26 biweekly paychecks a year means two months usually get a third regular paycheck. These months are detected from your regular payday schedule and recalculate whenever you change it.</p>
        <p className="mt-2">An extra paycheck is a budgeting opportunity — not automatically surplus. Bills and obligations come first.</p>
        <p className="mt-2 text-xs text-mute-400">Official payday, estimated early deposit and your confirmed deposit are always shown separately.</p>
      </section>
      {upcoming.length ? upcoming.map((m) => (
        <div key={m.month} className="space-y-2">
          <ExtraCard m={m} verified={verified} today={today} />
          <Link href={`/money/extra/${m.month}`} className="btn-primary w-full">Plan {monthLabel(m.month).split(" ")[0]}&apos;s extra paycheck</Link>
        </div>
      )) : <Section title="Upcoming"><Empty>No three-paycheck months in the projected window.</Empty></Section>}
      <Section title="Estimated extra amount">
        <p className="text-sm">
          {lastConfirmedNet !== null
            ? <>About <span className="num font-semibold text-go">{formatCents(lastConfirmedNet)}</span> — based on your most recent confirmed regular deposit. An estimate only.</>
            : "Confirm at least one regular deposit (Regular Payroll) to see an estimate. No amount is assumed."}
        </p>
      </Section>
      <Section title="How planning works">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-mute-300">
          <li>Pick the confirmed regular deposit to fund the plan (or sketch a non-binding forecast before it arrives).</li>
          <li>Say how much is truly free after bills.</li>
          <li>Assign dollars or percentages to Roth, guilt-free, emergency savings or goals — and optionally spin challenge tiles.</li>
          <li>Approve to reserve. Confirm each real transfer when you make it.</li>
        </ol>
      </Section>
      {past.length > 0 && <Section title="Earlier extra-paycheck months"><div className="space-y-3">{past.map((m) => <ExtraCard key={m.month} m={m} verified={verified} today={today} compact />)}</div></Section>}
    </div>
  );
}
