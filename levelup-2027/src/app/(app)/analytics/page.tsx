import Link from "next/link";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { appContext } from "@/server/context";
import { loadAnalytics } from "@/server/analytics";
import { MONTHS, isLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { formatMinutes } from "@/domain/gig";
import { PERIOD_KINDS, parsePeriodKind, periodFor } from "@/domain/periods";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { IncomeChart, SERIES, WeekCountChart } from "@/ui/charts";
import { cn } from "@/ui/cn";

const FAITH: Record<string, string> = { PRAYER: "Prayer", BIBLE_READING: "Bible reading", REFLECTION: "Reflection", GRATITUDE: "Gratitude" };
const LEARN: Record<string, string> = { STUDY: "Study", SPEAKING: "Speaking", READING: "Reading", LEARNING: "Learning", PROJECT: "Project", DISCIPLINE: "Discipline", CAREER_PREP: "Career prep", OTHER: "Other" };

function Tile({ label, value, sub, dot }: { label: string; value: React.ReactNode; sub?: React.ReactNode; dot?: string }) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900 p-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-mute-400">{dot && <span className="h-2 w-2 rounded-sm" style={{ background: dot }} aria-hidden />}{label}</p>
      <p className="num mt-1 text-lg font-semibold text-white">{value}</p>
      {sub && <p className="text-[11px] text-mute-400">{sub}</p>}
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { user, today, tz, trackingStart } = await appContext();
  const sp = await searchParams;
  const kind = parsePeriodKind(sp.period, "month");
  const period = periodFor(kind, sp.d && isLocalDate(sp.d) ? sp.d : today, { from: sp.from, to: sp.to });
  const a = await loadAnalytics(user.id, period, today, tz, trackingStart);
  const f = a.finance, g = a.growth;
  const href = (o: Record<string, string>) => `/analytics?${new URLSearchParams({ period: kind, ...o }).toString()}`;
  const future = period.from > today;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Insights" title="Analytics" />

      <div className="card space-y-3">
        <nav aria-label="Period" className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
          {PERIOD_KINDS.map((k) => (
            <Link key={k} href={`/analytics?period=${k}`} aria-current={kind === k ? "page" : undefined} className={cn("inline-flex min-h-[36px] shrink-0 items-center rounded-full border px-3 text-[13px] font-semibold capitalize", kind === k ? "border-go bg-go/10 text-go" : "border-ink-700 text-mute-300")}>{k}</Link>
          ))}
        </nav>
        {kind === "custom" ? (
          <form method="get" className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="period" value="custom" />
            <label className="block"><span className="label">From</span><input className="input" type="date" name="from" defaultValue={period.from} required /></label>
            <label className="block"><span className="label">To</span><input className="input" type="date" name="to" defaultValue={period.to} required /></label>
            <button className="btn-secondary" type="submit">Apply</button>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            {period.prev ? <Link className="btn-ghost btn-sm" href={href({ d: period.prev })} aria-label="Previous period"><ChevronLeft size={16} /></Link> : <span />}
            <span className="text-sm font-semibold">{period.label}</span>
            {period.next ? <Link className="btn-ghost btn-sm" href={href({ d: period.next })} aria-label="Next period"><ChevronRight size={16} /></Link> : <span />}
          </div>
        )}
        <p className="text-[11px] text-mute-400">{period.label} · dates in your time zone ({tz}). Built only from records you confirmed or logged — nothing is estimated to fill gaps.</p>
      </div>

      {future && <p className="card text-sm text-mute-300">This period hasn&apos;t started yet, so there&apos;s nothing to show.</p>}

      <Section title="Confirmed income">
        <p className="num font-display text-3xl font-bold">{formatCents(f.income.totalCents)}</p>
        <p className="mb-3 text-xs text-mute-400">Deposits you confirmed in {period.label}. Transfers between your own accounts are not counted as income.</p>
        <div className="grid grid-cols-3 gap-2">
          <Tile label="Regular" dot={SERIES.regular} value={formatCents(f.income.regularCents)} sub="DOC pay" />
          <Tile label="Overtime" dot={SERIES.overtime} value={formatCents(f.income.overtimeCents)} />
          <Tile label="Gig" dot={SERIES.gig} value={formatCents(f.income.gigCents)} sub="payouts" />
        </div>
        {f.projectedUnconfirmedPaydays > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-ink-700 p-2.5 text-xs text-mute-300"><Info size={14} className="mt-0.5 shrink-0" />
            {f.projectedUnconfirmedPaydays} projected payday{f.projectedUnconfirmedPaydays === 1 ? "" : "s"} in this period {f.projectedUnconfirmedPaydays === 1 ? "isn't" : "aren't"} confirmed yet — not included above.</p>
        )}
        <h3 className="eyebrow mb-2 mt-5">Monthly trend · confirmed only</h3>
        <IncomeChart data={f.trend} />
      </Section>

      <Section title="Where confirmed money went">
        <div className="grid grid-cols-2 gap-2">
          <Tile label="Roth IRA" value={formatCents(f.rothCents)} sub="contributions confirmed" />
          <Tile label="Challenges" value={formatCents(f.challengeContributionsCents)} sub="moving-out · SCHD · debt" />
          <Tile label="All allocations" value={formatCents(f.allocationsConfirmedCents)} sub="transfers you confirmed" />
          <Tile label="Unallocated now" value={formatCents(f.balances.availableCents)} sub={`${formatCents(f.balances.reservedCents)} reserved · today`} />
        </div>
        {f.historicalImportCents > 0 && <p className="mt-2 text-[11px] text-mute-400">Includes {formatCents(f.historicalImportCents)} of verified history you imported.</p>}
        <ul className="mt-4 space-y-2 text-sm">
          {f.challenges.map((c) => (
            <li key={c.kind} className="flex justify-between gap-2"><span>{c.name}</span>
              <span className="num text-mute-300">{c.status === "SETUP_REQUIRED" ? <span className="chip-warn">Setup required</span> : <>{formatCents(c.confirmedCents)}{c.targetCents ? ` / ${formatCents(c.targetCents)}` : ""} · {c.completedTiles}/{c.tileCount} tiles</>}</span></li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-mute-400">Challenge totals are all-time. Balances are as of today.</p>
      </Section>

      <Section title="Gig work">
        {f.gig.minutes || f.gig.payoutsCents ? (
          <div className="grid grid-cols-3 gap-2">
            <Tile label="Earned" value={formatCents(f.gig.earningsCents)} sub="reported, not cash" />
            <Tile label="Est. profit" value={formatCents(f.gig.estProfitCents)} sub="before taxes" />
            <Tile label="Deposited" value={formatCents(f.gig.payoutsCents)} sub={formatMinutes(f.gig.minutes)} />
          </div>
        ) : <Empty>No gig work logged in this period.</Empty>}
      </Section>

      {f.extraMonths.length > 0 && (
        <Section title="Extra-paycheck months">
          <ul className="space-y-1 text-sm">
            {f.extraMonths.map((m) => (
              <li key={m.month} className="flex justify-between"><span>{MONTHS[Number(m.month.slice(5)) - 1]} {m.month.slice(0, 4)}</span><span className="text-mute-300">{m.received} of {m.paydays} paydays confirmed{!m.verified && <span className="chip-warn ml-2">projected</span>}</span></li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Workouts per week">
        <p className="mb-2 text-sm"><span className="num font-semibold">{g.workouts.completed}</span> completed{g.workouts.partial ? <span className="text-mute-400"> · {g.workouts.partial} partial</span> : null}</p>
        <WeekCountChart data={g.workouts.byWeek} label="Completed workouts per week" />
      </Section>

      <Section title="Goals & milestones">
        <div className="grid grid-cols-2 gap-2">
          <Tile label="Goals completed" value={g.goals.completed} sub={`${g.goals.open} still open`} />
          <Tile label="Milestones done" value={g.milestones.completedInPeriod} sub={g.milestones.dueInPeriod ? `${g.milestones.dueInPeriod} were due this period` : "none were due"} />
        </div>
      </Section>

      <Section title="Habits">
        {a.elapsedDays === 0 ? <Empty>No days of this period have passed since you started LEVEL UP.</Empty> : g.habits.length ? (
          <ul className="space-y-3">
            {g.habits.map((h) => (
              <li key={h.name}>
                <div className="mb-1 flex justify-between text-sm"><span>{h.emoji} {h.name}</span><span className="num text-mute-300">{h.done} of ~{h.expected}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-ink-700" role="progressbar" aria-label={`${h.name} check-ins`} aria-valuenow={h.pct ?? 0} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full" style={{ width: `${h.pct ?? 0}%`, background: SERIES.single }} /></div>
              </li>
            ))}
          </ul>
        ) : <Empty>No active habits.</Empty>}
        <p className="mt-3 text-[11px] text-mute-400">Compared with each habit&apos;s weekly target over the {a.elapsedDays} day{a.elapsedDays === 1 ? "" : "s"} that have passed. No streaks, no scores — rest days are fine.</p>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="Faith routines">
          {g.faith.total ? <ul className="space-y-1 text-sm">{Object.entries(g.faith.byKind).map(([k, n]) => <li key={k} className="flex justify-between"><span>{FAITH[k] ?? k}</span><span className="num text-mute-300">{n}</span></li>)}</ul> : <Empty>Nothing logged this period.</Empty>}
        </Section>
        <Section title="Relationship">
          {g.relationship.planned ? <p className="text-sm"><span className="num font-semibold">{g.relationship.completed}</span> date{g.relationship.completed === 1 ? "" : "s"} completed of {g.relationship.planned} planned</p> : <Empty>No dates planned this period.</Empty>}
        </Section>
        <Section title="Education & career" className="sm:col-span-2">
          {g.learning.activities || g.learning.jobsApplied || g.learning.coursesCompleted ? (
            <div className="space-y-2 text-sm">
              <p><span className="num font-semibold">{g.learning.activities}</span> activities logged · <span className="num font-semibold">{g.learning.coursesCompleted}</span> course{g.learning.coursesCompleted === 1 ? "" : "s"} completed (all-time) · <span className="num font-semibold">{g.learning.jobsApplied}</span> application{g.learning.jobsApplied === 1 ? "" : "s"}</p>
              {g.learning.activities > 0 && <ul className="flex flex-wrap gap-1.5">{Object.entries(g.learning.byKind).map(([k, n]) => <li key={k} className="chip-mute">{LEARN[k] ?? k} · {n}</li>)}</ul>}
            </div>
          ) : <Empty>No education or career activity this period.</Empty>}
        </Section>
      </div>
    </div>
  );
}
