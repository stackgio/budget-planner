import { appContext } from "@/server/context";
import { educationOverview } from "@/server/edu";
import { loadGoals } from "@/server/growth";
import { formatLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Section, Stat, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import Link from "next/link";
import { prisma } from "@/server/db";
import { archivedEducation } from "@/server/edu";
import { formatInstantTime, instantToLocalDate } from "@/domain/dates";
import { describeRule, parseRRule } from "@/domain/recurrence";
import { eduArchiveAction, eduItemAction, valenciaChecklistAction } from "../actions";
import { GoalCard } from "../GoalCard";
import { ScheduleForm } from "../ScheduleForm";
import { ActivityForm } from "../ActivityForm";

const PROGRAM_LABEL: Record<string, string> = { RESEARCHING: "Researching", PLANNING: "Planning", APPLYING: "Applying", ADMITTED: "Admitted", ENROLLED: "Enrolled", PAUSED: "Paused", NOT_PURSUING: "Not pursuing" };

export default async function EducationPage() {
  const { user, today, tz } = await appContext();
  const e = await educationOverview(user.id);
  const archived = await archivedEducation(user.id);
  const plans = await prisma.calendarEvent.findMany({ where: { ownerId: user.id, category: "STUDY" }, orderBy: { startAt: "asc" }, take: 10 });
  const goals = await loadGoals(user.id, today, { category: "EDUCATION", status: { not: "ARCHIVED" } });
  const enrolled = e.programs.some((p) => p.status === "ENROLLED");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Education" title="Valencia College plan" />
      <section className="card space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Status" value={enrolled ? "Enrolled" : "Exploring"} tone={enrolled ? "go" : "mute"} sub="only what you set" />
          <Stat label="Credits completed" value={e.credits.completed} sub={`${e.credits.inProgress} in progress · ${e.credits.planned} planned`} />
          <Stat label="Tuition (estimated)" value={formatCents(e.tuitionEstCents)} tone="mute" sub={e.tuitionActualCents ? `${formatCents(e.tuitionActualCents)} actual` : "no actuals yet"} />
        </div>
        <p className="text-xs text-mute-400">Earlier credits and DOC training only count once Valencia confirms them — track that as milestones.</p>
      </section>

      <Section title="Application milestones" action={!goals.some((g) => g.title === "Return to Valencia College") && (
        <ActionForm action={valenciaChecklistAction}><SubmitButton className="btn-secondary btn-sm" pendingText="…">Create returning-student checklist</SubmitButton></ActionForm>
      )}>
        {goals.length ? <div className="grid gap-3 sm:grid-cols-2">{goals.map((g) => <GoalCard key={g.id} g={g} />)}</div> : <Empty>Start with the returning-student checklist — transcripts, degree audit, advisor, financial aid, registration.</Empty>}
      </Section>

      <Section title="Programs I'm researching">
        <ul className="space-y-3">
          {e.programs.map((p) => (
            <li key={p.id} className="rounded-xl border border-ink-700 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{p.name} <span className="text-xs font-normal text-mute-400">· {p.credential} · {p.institution}</span></p>
                <span className={p.status === "ENROLLED" || p.status === "ADMITTED" ? "chip-go" : "chip-mute"}>{PROGRAM_LABEL[p.status]}</span>
              </div>
              {p.notes && <p className="mt-1 whitespace-pre-line text-sm text-mute-300">{p.notes}</p>}
              <Dialog title={p.name} trigger="Update" triggerClassName="btn-ghost btn-sm mt-1">
                <ActionForm action={eduItemAction} className="space-y-3">
                  <input type="hidden" name="op" value="program" /><input type="hidden" name="id" value={p.id} />
                  <Field label="Status"><select className="input" name="status" defaultValue={p.status}>{Object.entries(PROGRAM_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
                  <Field label="Research notes"><textarea className="input min-h-[100px] py-2" name="notes" defaultValue={p.notes ?? ""} maxLength={4000} /></Field>
                  <SubmitButton className="btn-primary w-full">Save</SubmitButton>
                </ActionForm>
              </Dialog>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Courses" action={
        <Dialog title="Add a course" trigger="Add" triggerClassName="btn-secondary btn-sm"><CourseForm /></Dialog>
      }>
        {e.courses.length ? <ul className="divide-line text-sm">{e.courses.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>{c.code ? `${c.code} · ` : ""}{c.title} <span className="text-xs text-mute-400">{c.term ?? ""}{c.credits !== null ? ` · ${c.credits} cr` : ""}{c.grade ? ` · ${c.grade}` : ""}</span></span>
            <span className="flex items-center gap-1"><span className="chip-mute">{c.status.replace("_", " ").toLowerCase()}</span>
              <Dialog title={`Edit ${c.title}`} trigger="Edit" triggerClassName="btn-ghost btn-sm"><CourseForm c={c} /></Dialog>
              <ArchiveButton model="eduCourse" id={c.id} />
            </span>
          </li>
        ))}</ul> : <Empty>No courses yet. Plan a single first class if you like.</Empty>}
      </Section>

      <Section title="Tuition planning" action={
        <Dialog title="Add a cost" trigger="Add" triggerClassName="btn-secondary btn-sm"><TuitionForm /></Dialog>
      }>
        {e.tuition.length ? <ul className="divide-line text-sm">{e.tuition.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>{t.label} <span className="text-xs text-mute-400">{t.term ?? ""}</span></span>
            <span className="flex items-center gap-1"><span className="num">{formatCents(t.estCents)} est.{t.actualCents !== null ? ` · ${formatCents(t.actualCents)} actual` : ""}</span>
              <Dialog title={`Edit ${t.label}`} trigger="Edit" triggerClassName="btn-ghost btn-sm"><TuitionForm t={t} /></Dialog>
              <ArchiveButton model="tuitionItem" id={t.id} />
            </span>
          </li>
        ))}</ul> : <Empty>No costs entered.</Empty>}
      </Section>

      <Section title="Study sessions" action={
        <div className="flex gap-1">
          <Dialog title="Log study time" trigger="Log" triggerClassName="btn-secondary btn-sm"><ActivityForm today={today} kind="STUDY" courses={e.courses.map((c) => ({ id: c.id, title: c.title }))} /></Dialog>
          <Dialog title="Schedule study time" trigger="Schedule" triggerClassName="btn-ghost btn-sm"><ScheduleForm category="STUDY" defaultTitle="Valencia study" today={today} defaultTime="10:00" duration={60} repeat defaultDays={[4]} /></Dialog>
        </div>
      }>
        {plans.length > 0 && (
          <div className="mb-3 rounded-xl border border-ink-700 p-3">
            <p className="eyebrow mb-1">Study plan</p>
            <ul className="space-y-1 text-sm">{plans.map((p) => <li key={p.id} className="flex justify-between gap-2"><span>{p.title} <span className="text-xs text-mute-400">· {p.rrule ? describeRule(parseRRule(p.rrule)) : formatLocalDate(instantToLocalDate(p.startAt, tz), "weekday")} · {formatInstantTime(p.startAt, tz)}</span></span><Link href={`/calendar?view=agenda&date=${instantToLocalDate(p.startAt, tz) > today ? instantToLocalDate(p.startAt, tz) : today}`} className="link text-xs">Edit in calendar</Link></li>)}</ul>
          </div>
        )}
        {e.study.length ? <ul className="divide-line text-sm">{e.study.map((s) => <li key={s.id} className="flex justify-between py-2"><span>{s.title ?? "Study"} <span className="text-xs text-mute-400">· {formatLocalDate(s.date, "weekday")}</span></span><span className="num">{s.minutes} min</span></li>)}</ul> : <Empty>No study time logged.</Empty>}
      </Section>
      {(archived.courses.length > 0 || archived.tuition.length > 0) && (
        <Section title="Archived">
          <ul className="space-y-1 text-sm">
            {archived.courses.map((c) => <li key={c.id} className="flex justify-between"><span className="text-mute-400">Course · {c.title}</span><ArchiveButton model="eduCourse" id={c.id} restore /></li>)}
            {archived.tuition.map((t) => <li key={t.id} className="flex justify-between"><span className="text-mute-400">Cost · {t.label}</span><ArchiveButton model="tuitionItem" id={t.id} restore /></li>)}
          </ul>
        </Section>
      )}
    </div>
  );
}

function ArchiveButton({ model, id, restore }: { model: "eduCourse" | "tuitionItem"; id: string; restore?: boolean }) {
  return (
    <ActionForm action={eduArchiveAction}><input type="hidden" name="model" value={model} /><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={restore ? "restore" : "archive"} /><SubmitButton className="btn-ghost btn-sm" pendingText="…">{restore ? "Restore" : "Archive"}</SubmitButton></ActionForm>
  );
}

function CourseForm({ c }: { c?: { id: string; code: string | null; title: string; credits: number | null; term: string | null; status: string; grade: string | null; notes: string | null } }) {
  return (
    <ActionForm action={eduItemAction} className="space-y-3">
      <input type="hidden" name="op" value="course" />{c && <input type="hidden" name="id" value={c.id} />}
      <div className="grid grid-cols-3 gap-2"><Field label="Code"><input className="input" name="code" defaultValue={c?.code ?? ""} maxLength={20} placeholder="CCJ 1020" /></Field><Field label="Title" className="col-span-2"><input className="input" name="title" defaultValue={c?.title} required maxLength={120} /></Field></div>
      <div className="grid grid-cols-3 gap-2"><Field label="Credits"><input className="input" type="number" name="credits" min={0} max={12} defaultValue={c?.credits ?? ""} /></Field><Field label="Term"><input className="input" name="term" defaultValue={c?.term ?? ""} placeholder="Fall 2027" maxLength={30} /></Field><Field label="Status"><select className="input" name="status" defaultValue={c?.status ?? "PLANNED"}><option value="PLANNED">Planned</option><option value="REGISTERED">Registered</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="DROPPED">Dropped</option></select></Field></div>
      <div className="grid grid-cols-3 gap-2"><Field label="Grade"><input className="input" name="grade" defaultValue={c?.grade ?? ""} maxLength={4} /></Field><Field label="Notes" className="col-span-2"><input className="input" name="notes" defaultValue={c?.notes ?? ""} maxLength={300} /></Field></div>
      <SubmitButton className="btn-primary w-full">Save course</SubmitButton>
    </ActionForm>
  );
}

function TuitionForm({ t }: { t?: { id: string; label: string; term: string | null; estCents: number; actualCents: number | null; notes: string | null } }) {
  return (
    <ActionForm action={eduItemAction} className="space-y-3">
      <input type="hidden" name="op" value="tuition" />{t && <input type="hidden" name="id" value={t.id} />}
      <Field label="Item"><input className="input" name="label" defaultValue={t?.label} required maxLength={80} placeholder="Tuition — 3 credits" /></Field>
      <div className="grid grid-cols-3 gap-2"><Field label="Term"><input className="input" name="term" defaultValue={t?.term ?? ""} maxLength={30} /></Field><Field label="Estimate"><input className="input" name="est" inputMode="decimal" defaultValue={t ? (t.estCents / 100).toFixed(2) : ""} required /></Field><Field label="Actual"><input className="input" name="actual" inputMode="decimal" defaultValue={t?.actualCents != null ? (t.actualCents / 100).toFixed(2) : ""} /></Field></div>
      <Field label="Notes"><input className="input" name="notes" defaultValue={t?.notes ?? ""} maxLength={300} /></Field>
      <p className="text-xs text-mute-400">Planning only — enter figures from Valencia&apos;s published rates or your bill.</p>
      <SubmitButton className="btn-primary w-full">Save</SubmitButton>
    </ActionForm>
  );
}
