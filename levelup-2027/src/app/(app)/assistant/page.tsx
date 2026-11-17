import Link from "next/link";
import { Check, ChevronsRight, X } from "lucide-react";
import { appContext } from "@/server/context";
import { SUGGESTED_QUESTIONS, afternoonCheckIn, eveningReflection, morningBriefing } from "@/server/assistant";
import { getPrefs } from "@/server/notifications";
import { addDays, formatLocalDate, isLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { MODE_META } from "@/domain/modes";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { cn } from "@/ui/cn";
import { taskOpAction, toggleHabitAction } from "../tasks/actions";
import { postponeOccurrenceAction } from "../mode-actions";
import { dismissSuggestionAction, saveReflectionAction } from "./actions";
import { AskBox } from "./AskBox";

const TABS = [["morning", "Morning"], ["checkin", "Check-in"], ["evening", "Evening"], ["ask", "Ask"]] as const;

function Dismiss({ day, itemKey }: { day: string; itemKey: string }) {
  return <form action={dismissSuggestionAction}><input type="hidden" name="day" value={day} /><input type="hidden" name="itemKey" value={itemKey} /><button className="btn-ghost btn-sm px-2" aria-label="Not now"><X size={14} /></button></form>;
}

export default async function AssistantPage({ searchParams }: { searchParams: Promise<{ tab?: string; date?: string }> }) {
  const { user, tz, today } = await appContext();
  const sp = await searchParams;
  const tab = TABS.some(([t]) => t === sp.tab) ? sp.tab! : "morning";
  const day = sp.date && isLocalDate(sp.date) && sp.date <= addDays(today, 1) ? sp.date : today;
  const prefs = await getPrefs(user.id);
  const on = (s: string) => prefs.briefingSections.includes(s);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow={`Level Up Assistant · ${formatLocalDate(day, "long")}`} title="Assistant" />
      <nav className="flex rounded-xl border border-ink-700 bg-ink-900 p-1" aria-label="Assistant views">
        {TABS.map(([t, l]) => <Link key={t} href={`/assistant?tab=${t}${day !== today ? `&date=${day}` : ""}`} aria-current={t === tab ? "page" : undefined} className={cn("flex min-h-[40px] flex-1 items-center justify-center rounded-lg text-sm font-semibold", t === tab ? "bg-ink-700 text-white" : "text-mute-400")}>{l}</Link>)}
      </nav>

      {tab === "morning" && <Morning ownerId={user.id} tz={tz} day={day} on={on} />}
      {tab === "checkin" && <CheckIn ownerId={user.id} tz={tz} day={day} />}
      {tab === "evening" && <Evening ownerId={user.id} tz={tz} day={day} />}
      {tab === "ask" && <AskBox suggestions={SUGGESTED_QUESTIONS} />}
    </div>
  );
}

async function Morning({ ownerId, tz, day, on }: { ownerId: string; tz: string; day: string; on: (s: string) => boolean }) {
  const b = await morningBriefing(ownerId, tz, day);
  return (
    <div className="space-y-3">
      <section className="rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-850 to-ink-900 p-5">
        <p className="eyebrow">Good morning ☀️</p>
        {on("shift") && <p className="mt-2 text-lg font-semibold">{b.shift ? `${b.shift.title} · ${b.shift.start}–${b.shift.end}` : "No shift today."}</p>}
        {on("mode") && <p className="text-sm text-mute-300">Mode: <span className={b.mode === "NORMAL" ? "text-go" : "text-warn"}>{MODE_META[b.mode].label}</span>{b.mode !== "NORMAL" && " — optional items can wait."}</p>}
      </section>
      {on("priorities") && <Section title="Top priorities">{b.priorities.length ? <ol className="list-decimal space-y-1 pl-5 text-sm">{b.priorities.map((p) => <li key={p.id}>{p.title}</li>)}</ol> : <Empty>No top priorities set. <Link className="link" href="/tasks">Star up to three tasks.</Link></Empty>}</Section>}
      {on("calendar") && <Section title="Calendar">{b.calendar.length ? <ul className="space-y-1 text-sm">{b.calendar.map((c, i) => <li key={i}><span className="text-mute-400 num">{c.time}</span> · {c.title}</li>)}</ul> : <Empty>Nothing else on the calendar today.</Empty>}</Section>}
      {on("workouts") && <Section title="Workout">{b.workouts.length ? <ul className="text-sm">{b.workouts.map((w, i) => <li key={i}>{w.time} · {w.title}</li>)}</ul> : <Empty>No workout scheduled today.</Empty>}</Section>}
      {on("tasks") && <Section title="Tasks due">{b.tasks.length ? <ul className="space-y-1 text-sm">{b.tasks.map((t) => <li key={t.id} className={t.overdue ? "text-warn" : ""}>{t.overdue ? "Overdue · " : ""}{t.title}</li>)}</ul> : <Empty>No tasks due today.</Empty>}</Section>}
      {on("paydays") && <Section title="Paydays (next 7 days)">{b.paydays.length ? <ul className="space-y-1 text-sm">{b.paydays.map((p, i) => <li key={i}>{p.kind === "REGULAR" ? "Regular" : "Overtime"} · {formatLocalDate(p.officialDate, "weekday")}{p.received !== null ? ` · received ${formatCents(p.received)}` : p.zero ? " · confirmed $0" : ` · expected deposit ${formatLocalDate(p.expected, "weekday")} (estimate${p.provisional ? ", provisional schedule" : ""})`}</li>)}</ul> : <Empty>No paydays in the next week.</Empty>}</Section>}
      {on("transfers") && <Section title="Transfers to confirm">{b.transfers.count ? <p className="text-sm">{b.transfers.count} approved allocation{b.transfers.count > 1 ? "s" : ""} ({formatCents(b.transfers.totalCents)}) waiting. <Link className="link" href="/money/roulette">Review</Link></p> : <Empty>Nothing waiting.</Empty>}</Section>}
      {on("goals") && <Section title="Goals & deadlines this week">{b.goals.length ? <ul className="space-y-1 text-sm">{b.goals.map((g, i) => <li key={i} className={g.overdue ? "text-warn" : ""}><Link className="hover:text-go" href={`/goals/${g.goalId}`}>{g.title}</Link> <span className="text-xs text-mute-400">· {g.goal} · {formatLocalDate(g.dueDate, "weekday")}</span></li>)}</ul> : <Empty>No milestones due this week.</Empty>}</Section>}
      <p className="text-xs text-mute-400">Built from your saved records. Choose which sections appear in <Link className="link" href="/settings/notifications">notification settings</Link>.</p>
    </div>
  );
}

async function CheckIn({ ownerId, tz, day }: { ownerId: string; tz: string; day: string }) {
  const c = await afternoonCheckIn(ownerId, tz, day);
  return (
    <div className="space-y-3">
      {c.modeNote && <p className="rounded-2xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">{c.modeNote}</p>}
      <p className="text-sm text-mute-300">Nothing here is marked as forgotten — just a quick look at what&apos;s still open. Every change needs your tap.</p>
      <Section title="Tasks still open">
        {c.openTasks.length ? (
          <ul className="divide-line">{c.openTasks.map((t) => (
            <li key={t.id} className="flex items-center gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{t.title}</span>
              <form action={taskOpAction}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="op" value="done" /><button className="btn-secondary btn-sm px-2" aria-label={`Complete ${t.title}`}><Check size={14} /></button></form>
              <form action={taskOpAction}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="op" value="postpone" /><button className="btn-ghost btn-sm px-2" aria-label={`Postpone ${t.title} to tomorrow`}><ChevronsRight size={14} /></button></form>
              <Dismiss day={day} itemKey={`task:${t.id}`} />
            </li>
          ))}</ul>
        ) : <Empty>No open tasks for today.</Empty>}
      </Section>
      <Section title="Habits not logged yet">
        {c.habitsNotLogged.length ? (
          <ul className="flex flex-wrap gap-2">{c.habitsNotLogged.map((h) => (
            <li key={h.id} className="flex items-center gap-1 rounded-full border border-ink-700 pl-3">
              <form action={toggleHabitAction}><input type="hidden" name="habitId" value={h.id} /><input type="hidden" name="date" value={day} /><button className="text-sm" aria-label={`Log ${h.name}`}>{h.emoji} {h.name}</button></form>
              <Dismiss day={day} itemKey={`habit:${h.id}`} />
            </li>
          ))}</ul>
        ) : <Empty>Everything you track is logged or set aside for today.</Empty>}
      </Section>
      <Section title="Workout">{c.workout ? <ul className="text-sm">{c.workout.map((w, i) => <li key={i}>{w.time} · {w.title} · {w.logged ? <span className="text-go">logged</span> : <Link className="link" href="/goals/fitness">log it</Link>}</li>)}</ul> : <Empty>No workout scheduled today.</Empty>}</Section>
      <Section title="This evening">{c.evening.length ? <ul className="space-y-1 text-sm">{c.evening.map((e, i) => <li key={i}>{e.time} · {e.title}{e.important ? " ⭐" : ""}</li>)}</ul> : <Empty>Nothing scheduled this evening.</Empty>}</Section>
      {c.postponable.length > 0 && (
        <Section title="Optional — can move if you need rest">
          <ul className="divide-line">{c.postponable.map((p) => (
            <li key={p.key} className="flex items-center gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{p.time} · {p.title}</span>
              <form action={postponeOccurrenceAction}><input type="hidden" name="eventId" value={p.eventId} /><input type="hidden" name="originalStart" value={p.originalStart} /><input type="hidden" name="days" value="1" /><button className="btn-secondary btn-sm">Move to tomorrow</button></form>
              <Dismiss day={day} itemKey={`event:${p.key}`} />
            </li>
          ))}</ul>
        </Section>
      )}
    </div>
  );
}

async function Evening({ ownerId, tz, day }: { ownerId: string; tz: string; day: string }) {
  const e = await eveningReflection(ownerId, tz, day);
  return (
    <div className="space-y-3">
      <Section title="Today you…">{e.accomplishments.length ? <ul className="space-y-1 text-sm">{e.accomplishments.map((a, i) => <li key={i}>{a}</li>)}</ul> : <Empty>Nothing logged today — and that&apos;s okay. Rest days count too.</Empty>}</Section>
      <Section title="Still open">{e.outstanding.length ? <ul className="space-y-1 text-sm">{e.outstanding.map((t) => <li key={t.id}>{t.title}{t.overdue ? <span className="text-xs text-mute-400"> · from earlier</span> : ""}</li>)}</ul> : <Empty>Nothing carried over.</Empty>}</Section>
      <Section title="Tomorrow">
        {e.tomorrow.length ? <ul className="space-y-1 text-sm">{e.tomorrow.map((t, i) => <li key={i}><span className="text-mute-400 num">{t.time}</span> · {t.title}</li>)}</ul> : <Empty>Nothing scheduled tomorrow.</Empty>}
        {e.paydaysTomorrow.map((p, i) => <p key={i} className="mt-2 text-sm">💵 {p.kind === "REGULAR" ? "Regular" : "Overtime"} payday tomorrow{p.provisional ? " (projected)" : ""}.</p>)}
      </Section>
      {e.money.waiting.count > 0 && <Section title="Money"><p className="text-sm">{e.money.waiting.count} approved transfer{e.money.waiting.count > 1 ? "s" : ""} still waiting for confirmation. <Link className="link" href="/money/roulette">Review</Link></p></Section>}
      <Section title="Reflection (private)">
        <ActionForm action={saveReflectionAction} className="space-y-3">
          <input type="hidden" name="day" value={day} />
          {e.questions.map((q) => <Field key={q} label={q}><input className="input" name={`q:${q}`} defaultValue={e.saved?.answers[q] ?? ""} maxLength={2000} /></Field>)}
          <Field label="Anything else"><textarea className="input min-h-[90px] py-2" name="body" defaultValue={e.saved?.body ?? ""} maxLength={8000} /></Field>
          <SubmitButton className="btn-primary w-full">Save reflection</SubmitButton>
          <p className="text-xs text-mute-400">Encrypted. Optional. Unfinished things aren&apos;t failures — they&apos;re just tomorrow&apos;s list.</p>
        </ActionForm>
      </Section>
    </div>
  );
}
