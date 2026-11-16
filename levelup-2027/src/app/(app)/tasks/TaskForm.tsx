"use client";
import { useRouter } from "next/navigation";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { useDialog } from "@/ui/dialog";
import { saveTaskAction } from "./actions";

export interface TaskFormValues {
  id?: string; parentId?: string; title?: string; description?: string | null; category?: string | null;
  priority?: "LOW" | "MEDIUM" | "HIGH"; dueDate?: string | null; dueTime?: string | null;
  repeat?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY"; reminderMin?: number | null; optional?: boolean; isTopThree?: boolean;
}

export function TaskForm({ v = {}, compact }: { v?: TaskFormValues; compact?: boolean }) {
  const router = useRouter();
  const dialog = useDialog();
  return (
    <ActionForm action={saveTaskAction} className="space-y-4" resetOnSuccess={!v.id} onSuccess={() => { router.refresh(); dialog.close(); }}>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      {v.parentId && <input type="hidden" name="parentId" value={v.parentId} />}
      <Field label="Title"><input className="input" name="title" defaultValue={v.title} required maxLength={200} autoFocus /></Field>
      {!compact && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Due date"><input className="input" type="date" name="dueDate" defaultValue={v.dueDate ?? ""} /></Field>
            <Field label="Time (optional)"><input className="input" type="time" name="dueTime" defaultValue={v.dueTime ?? ""} /></Field>
            <Field label="Priority">
              <select className="input" name="priority" defaultValue={v.priority ?? "MEDIUM"}><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select>
            </Field>
            <Field label="Repeat">
              <select className="input" name="repeat" defaultValue={v.repeat ?? "NONE"}><option value="NONE">Never</option><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option></select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category"><input className="input" name="category" defaultValue={v.category ?? ""} placeholder="e.g. Valencia" maxLength={40} /></Field>
            <Field label="Reminder" hint="Delivery in Phase 4">
              <select className="input" name="reminderMin" defaultValue={v.reminderMin != null ? String(v.reminderMin) : ""}><option value="">None</option><option value="0">At due time</option><option value="60">1 h before</option><option value="1440">1 day before</option></select>
            </Field>
          </div>
          <Field label="Notes"><textarea className="input min-h-[72px] py-2" name="description" defaultValue={v.description ?? ""} maxLength={4000} /></Field>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" name="isTopThree" defaultChecked={v.isTopThree} className="h-5 w-5 accent-[#2bea7a]" /> Top 3 priority</label>
            <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" name="optional" defaultChecked={v.optional} className="h-5 w-5 accent-[#2bea7a]" /> Optional (paused in OT/activation)</label>
          </div>
        </>
      )}
      <SubmitButton className="btn-primary w-full">{v.id ? "Save task" : v.parentId ? "Add subtask" : "Add task"}</SubmitButton>
    </ActionForm>
  );
}
