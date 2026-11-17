import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronLeft } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { decrypt } from "@/server/crypto";
import { loadGoals } from "@/server/growth";
import { formatLocalDate } from "@/domain/dates";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { IdemKey } from "@/ui/IdemKey";
import { cn } from "@/ui/cn";
import { goalProgressAction, goalStatusAction, linkTaskAction, milestoneAction } from "../actions";
import { CATEGORY_LABEL, GoalForm } from "../GoalForm";
import { ScheduleForm } from "../ScheduleForm";

const CAT_TO_EVENT: Record<string, string> = { FITNESS: "WORKOUT", EDUCATION: "STUDY", FAITH: "CHURCH", CAREER: "STUDY", RELATIONSHIP: "DATE_NIGHT" };

export default async function GoalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { user, today } = await appContext();
  const { id } = await params;
  const g = (await loadGoals(user.id, today, { id }))[0];
  if (!g) notFound();
  const [challenges, habits, openTasks, sessions] = await Promise.all([
    prisma.challenge.findMany({ where: { ownerId: user.id }, select: { id: true, name: true, status: true } }),
    prisma.habit.findMany({ where: { ownerId: user.id, archived: false }, select: { id: true, name: true } }),
    prisma.task.findMany({ where: { ownerId: user.id, status: "OPEN", parentId: null, goalId: null }, select: { id: true, title: true }, take: 50, orderBy: { createdAt: "desc" } }),
    prisma.calendarEvent.findMany({ where: { ownerId: user.id, goalId: g.id }, orderBy: { startAt: "asc" }, take: 10 }),
  ]);
  const notes = decrypt(g.notesCipher);
  const statusBtn = (status: string, label: string, cls = "btn-secondary btn-sm") => (
    <ActionForm action={goalStatusAction}><input type="hidden" name="id" value={g.id} /><input type="hidden" name="status" value={status} /><SubmitButton className={cls} pendingText="…">{label}</SubmitButton></ActionForm>
  );

  return (
    <div className="space-y-4">
      <Link href="/goals" className="btn-ghost btn-sm -ml-2"><ChevronLeft size={16} /> Goals</Link>
      <PageHeader eyebrow={`${CATEGORY_LABEL[g.category]} · ${g.horizon.toLowerCase()} goal`} title={g.title}>
        <Dialog title="Edit goal" trigger="Edit" triggerClassName="btn-secondary btn-sm" wide>
          <GoalForm today={today} challenges={challenges} habits={habits} v={{ ...g, target: g.targetX100 === null ? null : g.targetX100 / 100, notes }} />
        </Dialog>
      </PageHeader>

      <section className="card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-display text-4xl font-bold num">{g.computed.pct === null ? "—" : `${Math.round(g.computed.pct)}%`}</p>
            <p className="text-sm text-mute-400">{g.computed.label}{g.computed.target !== null && g.source !== "MILESTONES" && g.source !== "TASKS" ? ` · ${g.computed.current} of ${g.computed.target}${g.unit ? ` ${g.unit}` : ""}` : ""}</p>
          </div>
          <div className="text-right text-xs text-mute-400">
            <p>Started {formatLocalDate(g.startDate)}</p>
            {g.targetDate && <p className={cn(g.overdue && "text-warn")}>Target {formatLocalDate(g.targetDate)}</p>}
            <p>Status: <span className="text-white">{g.status.replace("_", " ").toLowerCase()}</span></p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-go" style={{ width: `${g.computed.pct ?? 0}%` }} /></div>
        {g.description && <p className="mt-3 text-sm text-mute-300">{g.description}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {g.status !== "ACTIVE" && g.status !== "COMPLETED" && statusBtn("ACTIVE", g.status === "PAUSED" ? "Resume" : "Start")}
          {g.status === "ACTIVE" && statusBtn("PAUSED", "Pause")}
          {g.status !== "COMPLETED" && statusBtn("COMPLETED", "Mark goal complete", "btn-primary btn-sm")}
          {g.status === "COMPLETED" && statusBtn("ACTIVE", "Reopen")}
          {g.status !== "ARCHIVED" && statusBtn("ARCHIVED", "Archive", "btn-ghost btn-sm")}
        </div>
        <p className="mt-2 text-xs text-mute-400">Completing a goal is always your call — it never happens automatically.</p>
      </section>

      {g.source === "MANUAL" && (
        <Section title="Progress updates" action={
          <Dialog title="Update progress" trigger="Update" triggerClassName="btn-secondary btn-sm">
            <ActionForm action={goalProgressAction} className="space-y-4">
              <input type="hidden" name="goalId" value={g.id} /><IdemKey />
              <Field label={`Current value${g.unit ? ` (${g.unit})` : ""}`}><input className="input" name="value" inputMode="decimal" required /></Field>
              <Field label="As of"><input className="input" type="date" name="date" defaultValue={today} max={today} required /></Field>
              <Field label="Note (optional)"><input className="input" name="note" maxLength={200} /></Field>
              <SubmitButton className="btn-primary w-full">Save update</SubmitButton>
            </ActionForm>
          </Dialog>
        }>
          {g.progressHistory.length ? (
            <ul className="divide-line text-sm">{[...g.progressHistory].reverse().map((p) => <li key={p.id} className="flex justify-between py-2"><span>{formatLocalDate(p.recordedOn, "weekday")}{p.note ? ` · ${p.note}` : ""}</span><span className="num font-semibold">{p.value}{g.unit ? ` ${g.unit}` : ""}</span></li>)}</ul>
          ) : <Empty>No updates yet. Each update is kept as history.</Empty>}
        </Section>
      )}

      <Section title="Milestones">
        {g.milestones.length ? (
          <ul className="divide-line">
            {g.milestones.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <ActionForm action={milestoneAction}>
                  <input type="hidden" name="op" value={m.completedAt ? "undo" : "done"} /><input type="hidden" name="id" value={m.id} />
                  <SubmitButton className={cn("flex h-7 w-7 items-center justify-center rounded-full border-2", m.completedAt ? "border-go bg-go text-ink-950" : "border-ink-500 text-transparent hover:border-go")} pendingText="…"><Check size={14} aria-label={m.completedAt ? `Reopen ${m.title}` : `Complete ${m.title}`} /></SubmitButton>
                </ActionForm>
                <span className={cn("min-w-0 flex-1 text-sm", m.completedAt && "text-mute-400 line-through")}>{m.title}</span>
                {m.dueDate && <span className={cn("text-xs", !m.completedAt && m.dueDate < today ? "text-warn" : "text-mute-400")}>{formatLocalDate(m.dueDate, "weekday")}</span>}
              </li>
            ))}
          </ul>
        ) : <Empty>No milestones yet.</Empty>}
        <ActionForm action={milestoneAction} className="mt-3 grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_160px_auto]" resetOnSuccess>
          <input type="hidden" name="op" value="add" /><input type="hidden" name="goalId" value={g.id} />
          <input className="input" name="title" placeholder="Add a milestone" required maxLength={120} aria-label="Milestone" />
          <input className="input hidden sm:block" type="date" name="dueDate" aria-label="Due date" />
          <SubmitButton className="btn-secondary">Add</SubmitButton>
        </ActionForm>
      </Section>

      <Section title="Linked tasks">
        {g.tasks.length ? <ul className="space-y-1 text-sm">{g.tasks.map((t) => <li key={t.id} className={t.status !== "OPEN" ? "text-mute-400 line-through" : ""}>{t.status === "DONE" ? "✓" : "○"} {t.title}</li>)}</ul> : <Empty>No linked tasks.</Empty>}
        {openTasks.length > 0 && (
          <ActionForm action={linkTaskAction} className="mt-3 flex gap-2">
            <input type="hidden" name="goalId" value={g.id} />
            <select className="input" name="taskId" required defaultValue="" aria-label="Task to link"><option value="" disabled>Link an existing task…</option>{openTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select>
            <SubmitButton className="btn-secondary">Link</SubmitButton>
          </ActionForm>
        )}
      </Section>

      <Section title="Calendar sessions" action={
        <Dialog title="Schedule a session for this goal" trigger="Schedule" triggerClassName="btn-secondary btn-sm">
          <ScheduleForm category={CAT_TO_EVENT[g.category] ?? "PERSONAL"} defaultTitle={g.title} today={today} goalId={g.id} repeat />
        </Dialog>
      }>
        {sessions.length ? <ul className="space-y-1 text-sm">{sessions.map((s) => <li key={s.id}>{s.title} · <span className="text-mute-400">{s.rrule ? "repeating" : s.startAt.toISOString().slice(0, 10)}</span></li>)}</ul> : <Empty>No sessions scheduled.</Empty>}
      </Section>

      {notes && <Section title="Private notes"><p className="whitespace-pre-line text-sm text-mute-300">{notes}</p></Section>}
    </div>
  );
}
