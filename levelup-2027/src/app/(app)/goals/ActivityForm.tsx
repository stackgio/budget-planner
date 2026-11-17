import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { IdemKey } from "@/ui/IdemKey";
import { activityAction } from "./actions";

const KINDS: [string, string][] = [["STUDY", "Study"], ["SPEAKING", "Speaking practice"], ["READING", "Reading"], ["LEARNING", "Learning"], ["PROJECT", "Personal project"], ["DISCIPLINE", "Discipline / routine"], ["CAREER_PREP", "Career prep"], ["OTHER", "Other"]];

export function ActivityForm({ today, kind, goals = [], courses = [] }: { today: string; kind?: string; goals?: { id: string; title: string }[]; courses?: { id: string; title: string }[] }) {
  return (
    <ActionForm action={activityAction} className="space-y-3" resetOnSuccess>
      <IdemKey />
      <div className="grid grid-cols-3 gap-2">
        <Field label="What" className="col-span-3 sm:col-span-1">
          <select className="input" name="kind" defaultValue={kind ?? "LEARNING"}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </Field>
        <Field label="Date"><input className="input" type="date" name="date" defaultValue={today} max={today} required /></Field>
        <Field label="Minutes"><input className="input" type="number" name="minutes" min={1} max={1440} required placeholder="15" /></Field>
      </div>
      <Field label="Title (optional)"><input className="input" name="title" maxLength={120} placeholder="e.g. Read aloud, chapter 3" /></Field>
      {courses.length > 0 && <Field label="Course (optional)"><select className="input" name="courseId" defaultValue=""><option value="">—</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></Field>}
      {goals.length > 0 && <Field label="Goal (optional)"><select className="input" name="goalId" defaultValue=""><option value="">—</option>{goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></Field>}
      <Field label="Note (optional)"><input className="input" name="note" maxLength={500} /></Field>
      <SubmitButton className="btn-primary w-full">Log time</SubmitButton>
    </ActionForm>
  );
}
