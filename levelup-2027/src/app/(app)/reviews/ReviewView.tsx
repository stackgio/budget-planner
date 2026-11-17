import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { reviewData, type ReviewKind } from "@/server/reviews";
import { addDays, formatLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { Section, Stat, Empty } from "@/ui/bits";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { cn } from "@/ui/cn";
import { saveReviewAction } from "../goals/actions";

type Data = Awaited<ReturnType<typeof reviewData>>;
const ACT: Record<string, string> = { STUDY: "Study", SPEAKING: "Speaking", READING: "Reading", LEARNING: "Learning", PROJECT: "Projects", DISCIPLINE: "Discipline", CAREER_PREP: "Career prep", OTHER: "Other" };

export function ReviewView({ d, today }: { d: Data; today: string }) {
  const kind: ReviewKind = d.kind;
  const base = kind === "WEEK" ? "/reviews" : "/reviews/month";
  const prev = kind === "WEEK" ? addDays(d.range.start, -7) : addDays(d.range.start, -1);
  const next = addDays(d.range.end, 1);
  const isCurrent = today >= d.range.start && today <= d.range.end;
  const m = d.money;
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{kind === "WEEK" ? "Weekly review · Sat–Fri" : "Monthly review"}</p>
          <h1 className="h1">{formatLocalDate(d.range.start, "weekday")} – {formatLocalDate(d.range.end, "weekday")}</h1>
        </div>
        <nav className="flex items-center gap-1" aria-label="Period">
          <Link className="btn-ghost btn-sm" href={`${base}?date=${prev}`} aria-label="Previous period"><ChevronLeft size={18} /></Link>
          {!isCurrent && <Link className="btn-secondary btn-sm" href={base}>Current</Link>}
          {next <= today && <Link className="btn-ghost btn-sm" href={`${base}?date=${next}`} aria-label="Next period"><ChevronRight size={18} /></Link>}
        </nav>
      </header>
      <nav className="flex rounded-xl border border-ink-700 bg-ink-900 p-1" aria-label="Review type">
        {(["WEEK", "MONTH"] as const).map((k) => <Link key={k} href={k === "WEEK" ? "/reviews" : "/reviews/month"} aria-current={k === kind ? "page" : undefined} className={cn("flex min-h-[40px] flex-1 items-center justify-center rounded-lg text-sm font-semibold", k === kind ? "bg-ink-700 text-white" : "text-mute-400")}>{k === "WEEK" ? "Week" : "Month"}</Link>)}
      </nav>
      <p className="text-xs text-mute-400">Everything below comes from what you recorded. Nothing is estimated or filled in.</p>

      <section className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Tasks completed" value={d.tasks.completed} tone="go" sub={d.tasks.openDue ? `${d.tasks.openDue} still open` : undefined} />
        <Stat label="Workouts" value={kind === "WEEK" && d.fitness.target !== null ? `${d.fitness.logged} / ${d.fitness.target}` : d.fitness.logged} sub={kind === "WEEK" ? (d.fitness.reducedBy ? `target eased by ${d.fitness.reducedBy}` : "logged") : `${d.fitness.weeksWithWorkout} of ${d.fitness.weeks} weeks active`} />
        <Stat label="Faith entries" value={Object.values(d.faith).reduce((a, b) => a + b, 0)} sub={Object.entries(d.faith).map(([k, v]) => `${v} ${k.toLowerCase().replace("_", " ")}`).join(" · ") || "none"} />
        <Stat label="Milestones done" value={d.goals.milestonesCompleted.length} sub={`${d.goals.completed.length} goal${d.goals.completed.length === 1 ? "" : "s"} completed`} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Goals">
          {d.goals.completed.length > 0 && <p className="mb-2 text-sm">🎉 Completed: {d.goals.completed.join(", ")}</p>}
          {d.goals.milestonesCompleted.length ? <ul className="mb-2 space-y-1 text-sm">{d.goals.milestonesCompleted.map((x, i) => <li key={i}>✓ {x.title} <span className="text-xs text-mute-400">· {x.goal}</span></li>)}</ul> : <Empty>No milestones completed this period.</Empty>}
          {d.goals.dueThisPeriodOpen.length > 0 && <p className="text-sm text-warn">Due this period, still open: {d.goals.dueThisPeriodOpen.join(", ")}</p>}
          {kind === "MONTH" && d.goals.yearly.length > 0 && (
            <div className="mt-3 space-y-2 border-t border-ink-700 pt-3">
              <p className="eyebrow">Yearly goals</p>
              {d.goals.yearly.map((y) => <div key={y.title}><div className="flex justify-between text-sm"><span>{y.title}</span><span className="num text-mute-300">{y.pct === null ? "—" : `${Math.round(y.pct)}%`}</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-700"><div className="h-full bg-go" style={{ width: `${y.pct ?? 0}%` }} /></div></div>)}
            </div>
          )}
        </Section>

        <Section title="Money (confirmed only)">
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs text-mute-400">Regular income</dt><dd className="num font-semibold">{formatCents(m.regularCents)}</dd></div>
            <div><dt className="text-xs text-mute-400">Overtime income</dt><dd className="num font-semibold">{formatCents(m.overtimeCents)}</dd></div>
            <div><dt className="text-xs text-mute-400">Moving-out saved</dt><dd className="num font-semibold">{formatCents(m.movingCents)}</dd></div>
            <div><dt className="text-xs text-mute-400">SCHD contributed</dt><dd className="num font-semibold">{formatCents(m.schdCents)}</dd></div>
            <div><dt className="text-xs text-mute-400">Roth IRA</dt><dd className="num font-semibold">{formatCents(m.rothCents)}</dd></div>
            <div><dt className="text-xs text-mute-400">Debt paid</dt><dd className="num font-semibold">{formatCents(m.debtCents)}</dd></div>
          </dl>
          <ul className="mt-3 space-y-1 border-t border-ink-700 pt-3 text-xs text-mute-400">{m.challenges.map((c) => <li key={c.name}>{c.name}: {c.status === "SETUP_REQUIRED" ? "setup required" : `${formatCents(c.confirmedCents)} of ${formatCents(c.targetCents ?? 0)}`}</li>)}</ul>
        </Section>

        <Section title="Life">
          <ul className="space-y-1.5 text-sm">
            <li>💚 Dates: {d.relationship.completed} completed{d.relationship.planned ? `, ${d.relationship.planned} planned` : ""} · Alphabet {d.relationship.alphabet.completed}/26</li>
            <li>🎓 Study: {d.growth.STUDY ?? 0} min{d.career.applied ? ` · 💼 ${d.career.applied} application${d.career.applied > 1 ? "s" : ""}` : ""}</li>
            <li>🌱 Practice: {Object.entries(d.growth).filter(([k]) => k !== "STUDY").map(([k, v]) => `${ACT[k]} ${v} min`).join(" · ") || "none logged"}</li>
            <li>✅ Habits: {d.habits.length ? d.habits.map((h) => `${h.name} ${h.count}`).join(" · ") : "no check-ins"}</li>
          </ul>
        </Section>

        <Section title="Needs attention">
          {d.attention.length ? <ul className="space-y-1 text-sm text-warn">{d.attention.map((a) => <li key={a}>• {a}</li>)}</ul> : <Empty>Nothing flagged. 👏</Empty>}
          {(d.upcoming.tasks.length > 0 || d.upcoming.dates.length > 0) && (
            <div className="mt-3 border-t border-ink-700 pt-3">
              <p className="eyebrow mb-1">Coming up</p>
              <ul className="space-y-1 text-sm">
                {d.upcoming.tasks.map((t, i) => <li key={i}>☐ {t.title} <span className="text-xs text-mute-400">{t.dueDate ? formatLocalDate(t.dueDate, "weekday") : ""}</span></li>)}
                {d.upcoming.dates.map((x, i) => <li key={`d${i}`}>💚 {x.title} <span className="text-xs text-mute-400">{formatLocalDate(x.date, "weekday")}</span></li>)}
              </ul>
            </div>
          )}
        </Section>
      </div>

      <Section title="Your reflection">
        <ActionForm action={saveReviewAction} className="space-y-3">
          <input type="hidden" name="kind" value={kind} /><input type="hidden" name="anyDay" value={d.range.start} />
          <Field label="What went well? What would you change?" hint="Private and encrypted."><textarea className="input min-h-[120px] py-2" name="reflection" defaultValue={d.saved?.reflection ?? ""} maxLength={8000} /></Field>
          <p className="label">Priorities for next {kind === "WEEK" ? "week" : "month"}</p>
          {[1, 2, 3].map((n) => <input key={n} className="input" name={`priority${n}`} defaultValue={d.saved?.priorities[n - 1] ?? ""} maxLength={120} aria-label={`Priority ${n}`} placeholder={`Priority ${n}`} />)}
          <SubmitButton className="btn-primary w-full">Save review</SubmitButton>
          {d.saved && <p className="text-xs text-mute-400">Last saved {d.saved.updatedAt.toISOString().slice(0, 16).replace("T", " ")}</p>}
        </ActionForm>
      </Section>
    </div>
  );
}
