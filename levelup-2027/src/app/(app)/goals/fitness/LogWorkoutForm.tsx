import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { IdemKey } from "@/ui/IdemKey";
import { logWorkoutAction } from "../actions";

export interface TemplateView { id: string; name: string; items: { exerciseId: string; exercise: string; sets: number; reps: string }[] }

export function LogWorkoutForm({ template, today, eventId, originalStart, date }: { template: TemplateView | null; today: string; eventId?: string; originalStart?: string; date?: string }) {
  return (
    <ActionForm action={logWorkoutAction} className="space-y-4">
      <IdemKey />
      <input type="hidden" name="title" value={template?.name ?? "Workout"} />
      {template && <input type="hidden" name="templateId" value={template.id} />}
      {eventId && <input type="hidden" name="eventId" value={eventId} />}
      {originalStart && <input type="hidden" name="originalStart" value={originalStart} />}
      <div className="grid grid-cols-3 gap-2">
        <Field label="Date"><input className="input" type="date" name="date" defaultValue={date ?? today} max={today} required /></Field>
        <Field label="Minutes"><input className="input" type="number" name="durationMin" min={1} max={600} placeholder="45" /></Field>
        <Field label="Effort 1–10"><input className="input" type="number" name="effort" min={1} max={10} placeholder="6" /></Field>
      </div>
      {template && (
        <div className="space-y-3">
          {template.items.map((it) => (
            <fieldset key={it.exerciseId} className="rounded-xl border border-ink-700 p-3">
              <legend className="px-1 text-sm font-semibold">{it.exercise} <span className="font-normal text-mute-400">· plan {it.sets} × {it.reps}</span></legend>
              <input type="hidden" name="exerciseId" value={it.exerciseId} />
              <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-xs text-mute-400">
                <span />
                <span>Reps</span><span>Weight (lb, optional)</span>
                {Array.from({ length: Math.min(6, it.sets) }, (_, n) => (
                  <div key={n} className="contents">
                    <span className="num">Set {n + 1}</span>
                    <input className="input min-h-[40px]" name={`reps_${it.exerciseId}_${n + 1}`} inputMode="numeric" aria-label={`${it.exercise} set ${n + 1} reps`} />
                    <input className="input min-h-[40px]" name={`weight_${it.exerciseId}_${n + 1}`} inputMode="decimal" aria-label={`${it.exercise} set ${n + 1} weight`} />
                  </div>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      )}
      <Field label="How did it go?"><select className="input" name="status" defaultValue="COMPLETED"><option value="COMPLETED">Completed</option><option value="PARTIAL">Did part of it</option></select></Field>
      <Field label="Notes (optional)"><input className="input" name="notes" maxLength={500} placeholder="How you felt, anything to adjust" /></Field>
      <SubmitButton className="btn-primary w-full" pendingText="Saving…">Log workout</SubmitButton>
    </ActionForm>
  );
}
