import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { WEEKDAYS } from "@/domain/dates";
import { scheduleSessionAction } from "./actions";

/**
 * Put a session on the calendar. Conflicts with DOC shifts or other events are shown with free
 * alternatives; nothing is scheduled over a conflict unless you tick “schedule anyway”.
 */
export function ScheduleForm({ category, defaultTitle, today, defaultTime = "18:00", duration = 45, goalId, templates, repeat = false, defaultDays = [] }: {
  category: string; defaultTitle: string; today: string; defaultTime?: string; duration?: number; goalId?: string;
  templates?: { id: string; name: string }[]; repeat?: boolean; defaultDays?: number[];
}) {
  return (
    <ActionForm action={scheduleSessionAction} className="space-y-3">
      <input type="hidden" name="category" value={category} />
      {goalId && <input type="hidden" name="goalId" value={goalId} />}
      <Field label="Title"><input className="input" name="title" defaultValue={defaultTitle} required maxLength={120} /></Field>
      {templates && (
        <Field label="Workout"><select className="input" name="workoutTemplateId" defaultValue={templates[0]?.id}>{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
      )}
      <div className="grid grid-cols-3 gap-2">
        <Field label={repeat ? "Starting" : "Date"}><input className="input" type="date" name="date" defaultValue={today} min={today} required /></Field>
        <Field label="Time"><input className="input" type="time" name="time" defaultValue={defaultTime} required /></Field>
        <Field label="Minutes"><input className="input" type="number" name="durationMin" defaultValue={duration} min={5} max={600} required /></Field>
      </div>
      {repeat && (
        <fieldset>
          <legend className="label">Repeat weekly on (optional)</legend>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((w, i) => (
              <label key={w} className="flex h-10 w-12 cursor-pointer items-center justify-center rounded-lg border border-ink-600 text-xs font-semibold has-[:checked]:border-go has-[:checked]:bg-go has-[:checked]:text-ink-950">
                <input type="checkbox" name="weekdays" value={i} defaultChecked={defaultDays.includes(i)} className="sr-only" />{w}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className="flex min-h-[40px] items-center gap-3 text-xs text-mute-300"><input type="checkbox" name="acceptConflicts" className="h-5 w-5 accent-[#2bea7a]" /> Schedule anyway if it overlaps something (I&apos;ve checked)</label>
      <p className="text-xs text-mute-400">Checked against your DOC shifts and calendar. Conflicts are shown with free alternatives — nothing else is moved.</p>
      <SubmitButton className="btn-primary w-full">Add to calendar</SubmitButton>
    </ActionForm>
  );
}
