"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { useDialog } from "@/ui/dialog";
import { saveTemplateAction } from "../actions";

export interface EditorTemplate { id?: string; name: string; notes: string | null; kind: string; items: { exerciseId: string; sets: number; reps: string; weightNote: string | null; restSec: number | null }[] }

export function TemplateEditor({ t, exercises }: { t?: EditorTemplate; exercises: { id: string; name: string; archived: boolean }[] }) {
  const router = useRouter();
  const dialog = useDialog();
  const active = exercises.filter((e) => !e.archived);
  const [rows, setRows] = useState(t?.items.length ? t.items : [{ exerciseId: active[0]?.id ?? "", sets: 3, reps: "8–12", weightNote: null, restSec: 60 }]);
  const update = (i: number, patch: Partial<(typeof rows)[number]>) => setRows((r) => r.map((x, n) => (n === i ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => setRows((r) => { const c = [...r]; const j = i + d; if (j < 0 || j >= c.length) return c; [c[i], c[j]] = [c[j]!, c[i]!]; return c; });
  return (
    <ActionForm action={saveTemplateAction} className="space-y-4" onSuccess={() => { router.refresh(); dialog.close(); }}>
      {t?.id && <input type="hidden" name="id" value={t.id} />}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Field label="Workout name"><input className="input" name="name" defaultValue={t?.name} required maxLength={80} /></Field>
        <Field label="Type"><select className="input" name="kind" defaultValue={t?.kind ?? "HOME"}><option value="HOME">Home</option><option value="GYM">Gym</option><option value="RECOVERY">Recovery</option></select></Field>
      </div>
      <ul className="space-y-2" aria-label="Exercises">
        {rows.map((r, i) => (
          <li key={i} className="rounded-xl border border-ink-700 p-2.5">
            <div className="flex items-center gap-1">
              <select className="input min-h-[40px] flex-1" name="item_exerciseId" value={r.exerciseId} onChange={(e) => update(i, { exerciseId: e.target.value })} aria-label={`Exercise ${i + 1}`}>
                {exercises.filter((e) => !e.archived || e.id === r.exerciseId).map((e) => <option key={e.id} value={e.id}>{e.name}{e.archived ? " (archived)" : ""}</option>)}
              </select>
              <button type="button" className="btn-ghost btn-sm px-2" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp size={14} /></button>
              <button type="button" className="btn-ghost btn-sm px-2" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown size={14} /></button>
              <button type="button" className="btn-ghost btn-sm px-2 hover:text-bad" onClick={() => setRows((x) => x.filter((_, n) => n !== i))} disabled={rows.length === 1} aria-label="Remove exercise"><Trash2 size={14} /></button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              <input className="input min-h-[40px]" name="item_sets" type="number" min={1} max={10} value={r.sets} onChange={(e) => update(i, { sets: Number(e.target.value) })} aria-label="Sets" title="Sets" />
              <input className="input min-h-[40px]" name="item_reps" value={r.reps} onChange={(e) => update(i, { reps: e.target.value })} aria-label="Reps" placeholder="reps" />
              <input className="input min-h-[40px]" name="item_weight" value={r.weightNote ?? ""} onChange={(e) => update(i, { weightNote: e.target.value })} aria-label="Weight or resistance" placeholder="weight" />
              <input className="input min-h-[40px]" name="item_rest" type="number" min={0} max={600} value={r.restSec ?? ""} onChange={(e) => update(i, { restSec: e.target.value ? Number(e.target.value) : null })} aria-label="Rest seconds" placeholder="rest s" />
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="btn-secondary btn-sm" onClick={() => setRows((x) => [...x, { exerciseId: active[0]?.id ?? "", sets: 3, reps: "10", weightNote: null, restSec: 60 }])}><Plus size={14} /> Add exercise</button>
      <Field label="Notes"><input className="input" name="notes" defaultValue={t?.notes ?? ""} maxLength={300} /></Field>
      <p className="text-xs text-mute-400">Editing a workout never changes workouts you already logged.</p>
      <SubmitButton className="btn-primary w-full">Save workout</SubmitButton>
    </ActionForm>
  );
}
