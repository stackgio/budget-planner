import { appContext } from "@/server/context";
import { loadPayroll } from "@/server/money-queries";
import { dateToLocal, formatLocalDate, MONTHS } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { paydaysPerMonth } from "@/domain/payroll";
import { PageHeader, Section, Stat, Empty } from "@/ui/bits";
import { cn } from "@/ui/cn";
import { PaydayRow } from "../PaydayRow";
import { ScheduleCard } from "../ScheduleCard";

export default async function RegularPayrollPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { user, today } = await appContext();
  const { schedule, paydays } = await loadPayroll(user.id, "REGULAR");
  const sp = await searchParams;
  const year = /^\d{4}$/.test(sp.year ?? "") ? Number(sp.year) : Math.max(2027, Number(today.slice(0, 4)));
  const provisional = !schedule.anchorVerified;

  const needs = paydays.filter((p) => !p.deposit && p.status === "EXPECTED" && (p.manualDepositDate ?? p.expectedDepositDate) <= today && p.officialDate >= "2026-11-01");
  const upcoming = paydays.filter((p) => p.officialDate >= today && !needs.includes(p)).slice(0, 8);
  const confirmed = paydays.filter((p) => p.deposit).reverse();
  const yearKey = String(year);
  const receivedYear = confirmed.filter((p) => p.deposit!.actualDepositDate.startsWith(yearKey)).reduce((s, p) => s + p.deposit!.netCents, 0);
  const counts = paydaysPerMonth(paydays.filter((p) => p.officialDate.startsWith(yearKey) && p.status !== "SKIPPED").map((p) => p.officialDate));
  const next = upcoming[0];

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Money" title="Regular DOC Payroll" />
      <ScheduleCard kind="REGULAR" anchor={dateToLocal(schedule.anchorOfficialDate)} verified={schedule.anchorVerified} offset={schedule.earlyDepositOffsetDays} interval={schedule.intervalDays} />

      <section className="card grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Next official payday" value={next ? formatLocalDate(next.officialDate, "weekday") : "—"} sub={next ? `Expected deposit ${formatLocalDate(next.manualDepositDate ?? next.expectedDepositDate, "weekday")} (est.)` : undefined} />
        <Stat label={`Confirmed regular income ${yearKey}`} value={formatCents(receivedYear)} tone="go" sub={`${confirmed.filter((p) => p.deposit!.actualDepositDate.startsWith(yearKey)).length} deposits confirmed`} />
        <Stat label="Waiting for confirmation" value={needs.length} tone={needs.length ? "warn" : "mute"} sub="Never marked received automatically" />
      </section>

      {needs.length > 0 && (
        <Section title="Did these arrive?">
          <ul className="divide-line">{needs.map((p) => <PaydayRow key={p.id} p={p} today={today} provisional={provisional} />)}</ul>
        </Section>
      )}

      <Section title="Upcoming paydays">
        {upcoming.length ? <ul className="divide-line">{upcoming.map((p) => <PaydayRow key={p.id} p={p} today={today} provisional={provisional} />)}</ul> : <Empty>No upcoming paydays.</Empty>}
      </Section>

      <Section title={`${year} at a glance`} action={
        <div className="flex gap-1 text-xs">
          {[year - 1, year + 1].map((y) => <a key={y} className="btn-ghost btn-sm" href={`/money/payroll?year=${y}`}>{y}</a>)}
        </div>
      }>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {MONTHS.map((m, i) => {
            const c = counts.get(`${yearKey}-${String(i + 1).padStart(2, "0")}`) ?? 0;
            return (
              <div key={m} className={cn("rounded-xl border p-2 text-center", c >= 3 ? "border-go/60 bg-go/10" : "border-ink-700")}>
                <p className="text-xs text-mute-400">{m.slice(0, 3)}</p>
                <p className={cn("num text-xl font-bold", c >= 3 && "text-go")}>{c}</p>
                {c >= 3 && <p className="text-[10px] font-bold uppercase text-go">extra 💰</p>}
              </div>
            );
          })}
        </div>
        {provisional && <p className="mt-3 text-xs text-warn">Projected from your provisional anchor. Verify the anchor to confirm these months.</p>}
      </Section>

      <Section title="Confirmed deposits">
        {confirmed.length ? <ul className="divide-line">{confirmed.slice(0, 12).map((p) => <PaydayRow key={p.id} p={p} today={today} provisional={false} />)}</ul> : <Empty>No deposits confirmed yet. Income only counts once you confirm it.</Empty>}
      </Section>
    </div>
  );
}
