import { Dumbbell } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { fitnessWeek } from "@/server/life";
import { addDays, dateToLocal, formatInstantTime, formatLocalDate } from "@/domain/dates";
import { weekOf } from "@/domain/growth";
import { PageHeader, Section, Stat, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { bodyMetricAction, growthSettingsAction, removeWorkoutAction } from "../actions";
import { ScheduleForm } from "../ScheduleForm";
import { LogWorkoutForm, type TemplateView } from "./LogWorkoutForm";

export default async function FitnessPage() {
  const { user, tz, today, mode } = await appContext();
  const week = weekOf(today);
  const [fw, templatesRaw, exercises, metrics, settings, recentLogs] = await Promise.all([
    fitnessWeek(user.id, tz, week, today),
    prisma.workoutTemplate.findMany({ where: { ownerId: user.id, archived: false }, include: { items: { orderBy: { sortOrder: "asc" } } }, orderBy: { name: "asc" } }),
    prisma.exercise.findMany({ where: { ownerId: user.id, archived: false }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.bodyMetric.findMany({ where: { ownerId: user.id }, orderBy: { measuredOn: "desc" }, take: 12 }),
    prisma.growthSettings.findUnique({ where: { ownerId: user.id } }),
    prisma.workoutLog.findMany({ where: { ownerId: user.id }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 10, include: { sets: true } }),
  ]);
  const exName = new Map(exercises.map((e) => [e.id, e.name]));
  const templates: TemplateView[] = templatesRaw.map((t) => ({ id: t.id, name: t.name, items: t.items.map((i) => ({ exerciseId: i.exerciseId, exercise: exName.get(i.exerciseId) ?? "Exercise", sets: i.sets, reps: i.reps })) }));
  const tplById = new Map(templates.map((t) => [t.id, t]));
  const evTemplate = new Map((await prisma.calendarEvent.findMany({ where: { ownerId: user.id, category: "WORKOUT" }, select: { id: true, workoutTemplateId: true } })).map((e) => [e.id, e.workoutTemplateId]));
  const next = fw.scheduled.find((s) => s.day >= today && !s.logged);
  const lastWeight = metrics.find((m) => m.kind === "WEIGHT");
  // Last four weeks of logged workouts (Sat–Fri).
  const weeks = await Promise.all([3, 2, 1, 0].map(async (k) => {
    const w = weekOf(addDays(today, -7 * k));
    const n = await prisma.workoutLog.count({ where: { ownerId: user.id, date: { gte: new Date(`${w.start}T00:00:00Z`), lte: new Date(`${w.end}T00:00:00Z`) } } });
    return { label: formatLocalDate(w.start, "weekday").split(", ")[1], n };
  }));
  const maxN = Math.max(1, ...weeks.map((w) => w.n), fw.baseTarget);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Fitness" title="Training">
        <Dialog title="Log a workout" trigger={<><Dumbbell size={16} /> Log workout</>} triggerClassName="btn-primary" wide>
          <div className="space-y-2">
            {templates.map((t) => (
              <Dialog key={t.id} title={`Log: ${t.name}`} trigger={t.name} triggerClassName="btn-secondary w-full justify-start" wide>
                <LogWorkoutForm template={t} today={today} />
              </Dialog>
            ))}
            <Dialog title="Log another activity" trigger="Other (walk, sport, class…)" triggerClassName="btn-ghost w-full justify-start"><LogWorkoutForm template={null} today={today} /></Dialog>
          </div>
        </Dialog>
      </PageHeader>

      <section className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="This week" value={`${fw.completedCount} / ${fw.target}`} tone="go" sub={fw.reducedBy ? `target eased by ${fw.reducedBy} for ${fw.heavyDays} heavy work day${fw.heavyDays > 1 ? "s" : ""}` : `goal ${fw.baseTarget} per week`} />
        <Stat label="Next workout" value={next ? formatLocalDate(next.day, "weekday") : "—"} sub={next ? formatInstantTime(next.start, tz) : "Nothing scheduled"} />
        <Stat label="Body weight" value={lastWeight ? `${lastWeight.valueX100 / 100} ${lastWeight.unit}` : "—"} sub={lastWeight ? formatLocalDate(dateToLocal(lastWeight.measuredOn)) : "not recorded"} tone="mute" />
        <Stat label="Not logged" value={fw.notLogged.length} tone={fw.notLogged.length ? "warn" : "mute"} sub="scheduled, no log yet" />
      </section>
      {mode !== "NORMAL" && <p className="rounded-2xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">You&apos;re in {mode.toLowerCase()} mode. Rest counts — a short walk or the recovery template is plenty.</p>}

      <Section title="This week's sessions" action={
        <Dialog title="Schedule workouts" trigger="Schedule" triggerClassName="btn-secondary btn-sm">
          <ScheduleForm category="WORKOUT" defaultTitle="Workout" today={today} defaultTime="17:30" templates={templates} repeat defaultDays={[1, 3, 4]} />
          <p className="mt-3 text-xs text-mute-400">Mon & Wed are DOC days (8–4), so early evening avoids the shift. Thursday is off.</p>
        </Dialog>
      }>
        {fw.scheduled.length ? (
          <ul className="divide-line">
            {fw.scheduled.map((s) => {
              const tpl = tplById.get(evTemplate.get(s.eventId) ?? "") ?? null;
              return (
                <li key={s.key} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span><span className="font-medium">{formatLocalDate(s.day, "weekday")}</span> · {formatInstantTime(s.start, tz)} · {tpl?.name ?? s.title}</span>
                  {s.logged ? <span className="chip-go">Logged</span> : s.day > today ? <span className="chip-mute">Upcoming</span> : (
                    <span className="flex items-center gap-2">
                      {s.day < today && <span className="chip-warn">Not logged</span>}
                      <Dialog title={`Log: ${tpl?.name ?? s.title}`} trigger="Log it" triggerClassName="btn-secondary btn-sm" wide>
                        <LogWorkoutForm template={tpl} today={today} eventId={s.eventId} originalStart={s.originalStart.toISOString()} date={s.day} />
                      </Dialog>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : <Empty>No workouts scheduled this week. Use Schedule to add an editable weekly plan.</Empty>}
        <p className="mt-2 text-xs text-mute-400">A scheduled workout is never counted as done. Unlogged sessions stay visible — no penalties, no streaks.</p>
      </Section>

      <Section title="Last 4 weeks">
        <div className="flex h-28 items-end gap-3" role="img" aria-label={`Workouts per week: ${weeks.map((w) => w.n).join(", ")}`}>
          {weeks.map((w) => (
            <div key={w.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs num text-mute-300">{w.n}</span>
              <div className="w-full rounded-t-md bg-go/80" style={{ height: `${(w.n / maxN) * 80}px`, minHeight: w.n ? 4 : 1 }} />
              <span className="text-[10px] text-mute-400">{w.label}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recent workouts">
        {recentLogs.length ? (
          <ul className="divide-line">
            {recentLogs.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span><span className="font-medium">{l.title}</span><span className="block text-xs text-mute-400">{formatLocalDate(dateToLocal(l.date), "weekday")}{l.durationMin ? ` · ${l.durationMin} min` : ""}{l.sets.length ? ` · ${l.sets.length} set${l.sets.length === 1 ? "" : "s"}` : ""}{l.status === "PARTIAL" ? " · partial" : ""}</span></span>
                <Dialog title="Remove this workout?" trigger="Remove" triggerClassName="btn-ghost btn-sm">
                  <ActionForm action={removeWorkoutAction}><input type="hidden" name="id" value={l.id} /><p className="mb-3 text-sm text-mute-300">Only for a mistaken entry. A copy stays in your audit history.</p><SubmitButton className="btn-danger w-full">Remove</SubmitButton></ActionForm>
                </Dialog>
              </li>
            ))}
          </ul>
        ) : <Empty>No workouts logged yet.</Empty>}
      </Section>

      <Section title="Body measurements (private)" action={
        <Dialog title="Add a measurement" trigger="Add" triggerClassName="btn-secondary btn-sm">
          <ActionForm action={bodyMetricAction} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="What"><select className="input" name="kind" defaultValue="WEIGHT"><option value="WEIGHT">Body weight</option><option value="WAIST">Waist</option><option value="CHEST">Chest</option><option value="HIPS">Hips</option><option value="ARMS">Arms</option><option value="BODY_FAT">Body fat %</option></select></Field>
              <Field label="Value"><input className="input" name="value" inputMode="decimal" required /></Field>
              <Field label="Unit (weight)"><select className="input" name="unit" defaultValue={settings?.weightUnit ?? "lb"}><option>lb</option><option>kg</option></select></Field>
              <Field label="Date"><input className="input" type="date" name="date" defaultValue={today} max={today} required /></Field>
            </div>
            <SubmitButton className="btn-primary w-full">Save</SubmitButton>
          </ActionForm>
        </Dialog>
      }>
        {metrics.length ? <ul className="divide-line text-sm">{metrics.map((m) => <li key={m.id} className="flex justify-between py-2"><span>{m.kind.replace("_", " ").toLowerCase()} · {formatLocalDate(dateToLocal(m.measuredOn), "weekday")}</span><span className="num font-semibold">{m.valueX100 / 100} {m.unit}</span></li>)}</ul> : <Empty>Nothing recorded. Only numbers you enter are shown.</Empty>}
      </Section>

      <Section title="Exercise library">
        <ul className="grid gap-2 sm:grid-cols-2">{exercises.map((e) => <li key={e.id} className="rounded-xl border border-ink-700 p-3 text-sm"><p className="font-medium">{e.name} <span className="text-xs text-mute-400">· {e.category.toLowerCase()} · {e.equipment.toLowerCase()}</span></p>{e.cues && <p className="mt-1 text-xs text-mute-400">{e.cues}</p>}</li>)}</ul>
        <p className="mt-3 text-xs text-mute-400">Beginner-friendly starting points. Go light, progress slowly, and stop if something hurts. Check with a clinician if you have injuries.</p>
      </Section>

      <Section title="Weekly goal">
        <ActionForm action={growthSettingsAction} className="flex items-end gap-2">
          <Field label="Workouts per week" className="w-40"><input className="input" type="number" name="workoutsPerWeek" min={0} max={7} defaultValue={settings?.workoutsPerWeek ?? 3} /></Field>
          <SubmitButton className="btn-secondary">Save</SubmitButton>
        </ActionForm>
      </Section>
    </div>
  );
}
