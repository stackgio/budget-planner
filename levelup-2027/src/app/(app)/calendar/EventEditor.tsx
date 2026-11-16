"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, Copy, Trash2 } from "lucide-react";
import { CATEGORY_META, EDITABLE_CATEGORIES, type Category } from "@/domain/calendar";
import { type LocalDate, WEEKDAYS, weekday } from "@/domain/dates";
import { type Freq, type Rule, describeRule, formatRRule, parseRRule } from "@/domain/recurrence";
import { Dialog } from "@/ui/dialog";
import { Field } from "@/ui/form";
import { cn } from "@/ui/cn";
import { checkConflictsAction, deleteEventAction, saveEventAction } from "./actions";
import { occToTimes, type SerializedOcc, type SeriesMeta } from "./CalendarView";

export type EditorTarget =
  | { mode: "new"; date: LocalDate; startTime?: string; prefill?: Partial<FormState> }
  | { mode: "edit"; occ: SerializedOcc; meta: SeriesMeta | undefined };

interface FormState {
  title: string; description: string; location: string; category: Category;
  date: LocalDate; endDate: LocalDate; startTime: string; endTime: string; allDay: boolean;
  freq: Freq | "NONE"; interval: number; byDay: number[]; ends: "never" | "until" | "count"; until: string; count: number;
  reminderMin: string; important: boolean; optional: boolean;
}

function addHour(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${String(Math.min(23, (h ?? 0) + 1)).padStart(2, "0")}:${String(m ?? 0).padStart(2, "0")}`;
}

function initial(target: EditorTarget, tz: string): FormState {
  if (target.mode === "new") {
    const st = target.startTime ?? "09:00";
    return {
      title: "", description: "", location: "", category: "PERSONAL", date: target.date, endDate: target.date,
      startTime: st, endTime: addHour(st), allDay: false, freq: "NONE", interval: 1, byDay: [weekday(target.date)],
      ends: "never", until: "", count: 10, reminderMin: "", important: false, optional: false, ...target.prefill,
    };
  }
  const o = target.occ;
  const t = occToTimes(o, tz);
  let rule: Rule | null = null;
  try { rule = target.meta?.rrule ? parseRRule(target.meta.rrule) : null; } catch { rule = null; }
  return {
    title: o.title, description: o.description ?? "", location: target.meta?.location ?? "", category: o.category,
    ...t, allDay: o.allDay, freq: rule?.freq ?? "NONE", interval: rule?.interval ?? 1, byDay: rule?.byDay ?? [weekday(t.date)],
    ends: rule?.until ? "until" : rule?.count ? "count" : "never", until: rule?.until ?? "", count: rule?.count ?? 10,
    reminderMin: target.meta?.reminderMin != null ? String(target.meta.reminderMin) : "", important: o.important, optional: o.optional,
  };
}

function toRRule(f: FormState): string | null {
  if (f.freq === "NONE") return null;
  const r: Rule = { freq: f.freq, interval: Math.max(1, f.interval || 1) };
  if (f.freq === "WEEKLY") r.byDay = f.byDay.length ? [...f.byDay].sort() : [weekday(f.date)];
  if (f.ends === "until" && f.until) r.until = f.until;
  if (f.ends === "count") r.count = Math.max(1, f.count || 1);
  return formatRRule(r);
}

export function EventEditor({ target, tz, onClose, onDuplicate }: { target: EditorTarget; tz: string; onClose: () => void; onDuplicate: (t: EditorTarget) => void }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => initial(target, tz));
  const [scope, setScope] = useState<"single" | "following" | "all">("single");
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const editing = target.mode === "edit" ? target : null;
  const recurring = !!editing?.meta?.rrule;
  const seriesOnlyLocked = recurring && scope === "single";

  const payload = useMemo(() => ({
    title: f.title.trim(), description: f.description.trim() || null, location: f.location.trim() || null,
    category: f.category as Exclude<Category, "PAYDAY_REGULAR" | "PAYDAY_OVERTIME" | "TASK">,
    date: f.date, endDate: f.endDate < f.date ? f.date : f.endDate, startTime: f.startTime, endTime: f.endTime, allDay: f.allDay,
    rrule: seriesOnlyLocked ? (editing?.meta?.rrule ?? null) : toRRule(f),
    reminderMin: f.reminderMin === "" ? null : Number(f.reminderMin), important: f.important, optional: f.optional,
  }), [f, seriesOnlyLocked, editing]);

  useEffect(() => {
    if (f.allDay) { setConflicts([]); return; }
    const t = setTimeout(async () => {
      setConflicts(await checkConflictsAction({ event: { ...payload, title: payload.title || "x" }, ignoreEventId: editing?.occ.eventId, ignoreKey: editing?.occ.key }));
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.date, f.endDate, f.startTime, f.endTime, f.allDay]);

  const save = () => start(async () => {
    setError(null);
    const res = await saveEventAction({ id: editing?.occ.eventId, originalStart: editing?.occ.originalStart ?? null, scope, event: payload });
    if (res?.error) return setError(res.error);
    router.refresh();
    onClose();
  });

  const remove = () => start(async () => {
    if (!editing) return;
    const res = await deleteEventAction({ id: editing.occ.eventId, originalStart: editing.occ.originalStart, scope: recurring ? scope : "all" });
    if (res?.error) return setError(res.error);
    router.refresh();
    onClose();
  });

  return (
    <Dialog title={editing ? "Edit event" : "New event"} open onOpenChange={(o) => !o && onClose()} wide>
      <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
        {recurring && (
          <fieldset className="rounded-xl border border-ink-700 p-3">
            <legend className="px-1 text-xs font-semibold text-mute-300">This is a repeating event. Apply changes to:</legend>
            <div className="grid grid-cols-3 gap-2">
              {([["single", "This event"], ["following", "This & following"], ["all", "All events"]] as const).map(([v, l]) => (
                <label key={v} className={cn("flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border px-2 text-center text-xs font-semibold", scope === v ? "border-go bg-go/10 text-go" : "border-ink-600 text-mute-300")}>
                  <input type="radio" name="scope" value={v} checked={scope === v} onChange={() => setScope(v)} className="sr-only" />{l}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <Field label="Title"><input className="input" value={f.title} onChange={(e) => set("title", e.target.value)} required maxLength={120} autoFocus={!editing} /></Field>

        <Field label="Category">
          <select className="input" value={f.category} disabled={seriesOnlyLocked} onChange={(e) => set("category", e.target.value as Category)}>
            {EDITABLE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
          </select>
        </Field>

        <label className="flex min-h-[44px] items-center gap-3 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-[#2bea7a]" checked={f.allDay} disabled={seriesOnlyLocked} onChange={(e) => set("allDay", e.target.checked)} /> All day
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date"><input type="date" className="input" value={f.date} required onChange={(e) => { const d = e.target.value; setF((s) => ({ ...s, date: d, endDate: s.endDate < d || s.endDate === s.date ? d : s.endDate })); }} /></Field>
          {!f.allDay && <Field label="Start time"><input type="time" className="input" value={f.startTime} required onChange={(e) => set("startTime", e.target.value)} /></Field>}
          <Field label="End date"><input type="date" className="input" value={f.endDate} min={f.date} required onChange={(e) => set("endDate", e.target.value)} /></Field>
          {!f.allDay && <Field label="End time"><input type="time" className="input" value={f.endTime} required onChange={(e) => set("endTime", e.target.value)} /></Field>}
        </div>

        {conflicts.length > 0 && (
          <div role="alert" className="rounded-xl border border-warn/40 bg-warn/10 p-3 text-sm text-warn">
            <p className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} /> Overlaps with:</p>
            <ul className="mt-1 list-disc pl-5 text-white/80">{conflicts.map((c) => <li key={c}>{c}</li>)}</ul>
            <p className="mt-1 text-xs text-white/60">You can still save. Nothing else is changed automatically.</p>
          </div>
        )}

        {!seriesOnlyLocked ? (
          <fieldset className="space-y-3 rounded-xl border border-ink-700 p-3">
            <legend className="px-1 text-xs font-semibold text-mute-300">Repeat</legend>
            <div className="grid grid-cols-2 gap-3">
              <select className="input" value={f.freq} onChange={(e) => set("freq", e.target.value as FormState["freq"])} aria-label="Repeat frequency">
                <option value="NONE">Does not repeat</option><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option>
              </select>
              {f.freq !== "NONE" && (
                <label className="flex items-center gap-2 text-sm">Every <input type="number" min={1} max={52} className="input w-20" value={f.interval} onChange={(e) => set("interval", Number(e.target.value))} aria-label="Interval" /></label>
              )}
            </div>
            {f.freq === "WEEKLY" && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Repeat on">
                {WEEKDAYS.map((w, i) => (
                  <button type="button" key={w} aria-pressed={f.byDay.includes(i)} onClick={() => set("byDay", f.byDay.includes(i) ? f.byDay.filter((x) => x !== i) : [...f.byDay, i])}
                    className={cn("h-10 w-10 rounded-full border text-xs font-bold", f.byDay.includes(i) ? "border-go bg-go text-ink-950" : "border-ink-600 text-mute-300")}>{w.slice(0, 2)}</button>
                ))}
              </div>
            )}
            {f.freq !== "NONE" && (
              <div className="grid grid-cols-2 gap-3">
                <select className="input" value={f.ends} onChange={(e) => set("ends", e.target.value as FormState["ends"])} aria-label="Ends">
                  <option value="never">Never ends</option><option value="until">Ends on date</option><option value="count">Ends after…</option>
                </select>
                {f.ends === "until" && <input type="date" className="input" value={f.until} min={f.date} onChange={(e) => set("until", e.target.value)} aria-label="End repeat on" required />}
                {f.ends === "count" && <input type="number" className="input" min={1} max={1000} value={f.count} onChange={(e) => set("count", Number(e.target.value))} aria-label="Occurrences" />}
              </div>
            )}
            {f.freq !== "NONE" && <p className="text-xs text-mute-400">{describeRule(parseRRule(toRRule(f)!))}</p>}
          </fieldset>
        ) : (
          <p className="rounded-xl border border-ink-700 p-3 text-xs text-mute-400">Category, all-day and repeat settings belong to the whole series. Choose “All events” to change them.</p>
        )}

        <Field label="Notes"><textarea className="input min-h-[80px] py-2" value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} /></Field>
        {!seriesOnlyLocked && (
          <>
            <Field label="Location"><input className="input" value={f.location} onChange={(e) => set("location", e.target.value)} maxLength={200} /></Field>
            <Field label="Reminder" hint="Saved now. Push delivery arrives in Phase 4 — no notifications are sent yet.">
              <select className="input" value={f.reminderMin} onChange={(e) => set("reminderMin", e.target.value)}>
                <option value="">None</option><option value="10">10 min before</option><option value="30">30 min before</option><option value="60">1 hour before</option><option value="1440">1 day before</option>
              </select>
            </Field>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[#2bea7a]" checked={f.important} onChange={(e) => set("important", e.target.checked)} /> Important (never suggested for postponing)</label>
              <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" className="h-5 w-5 accent-[#2bea7a]" checked={f.optional} onChange={(e) => set("optional", e.target.checked)} /> Optional</label>
            </div>
          </>
        )}

        {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button type="submit" className="btn-primary flex-1" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
          {editing && (
            <button type="button" className="btn-secondary" onClick={() => onDuplicate({ mode: "new", date: f.date, startTime: f.startTime, prefill: { ...f, title: `${f.title} (copy)`, freq: "NONE" } })}>
              <Copy size={16} /> Duplicate
            </button>
          )}
          {editing && !confirmDelete && <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> Delete</button>}
        </div>
        {editing && confirmDelete && (
          <div className="rounded-xl border border-bad/40 bg-bad/10 p-3 text-sm">
            <p>Delete {recurring ? (scope === "single" ? "this occurrence only" : scope === "following" ? "this and all following occurrences" : "the entire series") : "this event"}?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn-danger btn-sm" onClick={remove} disabled={pending}>Yes, delete</button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          </div>
        )}
      </form>
    </Dialog>
  );
}
