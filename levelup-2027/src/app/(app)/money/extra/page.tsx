import { appContext } from "@/server/context";
import { loadExtraMonths } from "@/server/extra";
import { monthKey } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { ExtraCard } from "../ExtraCard";

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
      {upcoming.length ? upcoming.map((m) => <ExtraCard key={m.month} m={m} verified={verified} today={today} />) : <Section title="Upcoming"><Empty>No three-paycheck months in the projected window.</Empty></Section>}
      <Section title="Estimated extra amount">
        <p className="text-sm">
          {lastConfirmedNet !== null
            ? <>About <span className="num font-semibold text-go">{formatCents(lastConfirmedNet)}</span> — based on your most recent confirmed regular deposit. An estimate only.</>
            : "Confirm at least one regular deposit (Regular Payroll) to see an estimate. No amount is assumed."}
        </p>
      </Section>
      <Section title="Allocation plan">
        <p className="text-sm text-mute-300">Planning how to use the extra paycheck (debt, moving-out savings, emergency savings, SCHD, Roth IRA, guilt-free money) — including the optional <span className="font-semibold">Spin My Extra Paycheck 🎲</span> — is part of Phase 2 (Money System). Nothing is allocated or transferred yet.</p>
      </Section>
      {past.length > 0 && <Section title="Earlier extra-paycheck months"><div className="space-y-3">{past.map((m) => <ExtraCard key={m.month} m={m} verified={verified} today={today} compact />)}</div></Section>}
    </div>
  );
}
