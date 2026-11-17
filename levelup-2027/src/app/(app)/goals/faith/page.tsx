import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { listFaith } from "@/server/life";
import { loadHabits } from "@/server/queries";
import { loadGoals } from "@/server/growth";
import { WEEKDAYS, addDays, formatLocalDate } from "@/domain/dates";
import { weekOf } from "@/domain/growth";
import { PageHeader, Section, Stat, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { IdemKey } from "@/ui/IdemKey";
import { HabitGrid } from "../../tasks/Habits";
import { GoalCard } from "../GoalCard";
import { faithEntryAction, growthSettingsAction, reminderPrefAction } from "../actions";

const KIND = { PRAYER: ["🙏", "Prayer"], BIBLE_READING: ["📖", "Bible reading"], REFLECTION: ["✍️", "Reflection"], GRATITUDE: ["💚", "Gratitude"] } as const;

export default async function FaithPage() {
  const { user, today } = await appContext();
  const week = weekOf(today);
  const [entries, habits, goals, settings, reminders] = await Promise.all([
    listFaith(user.id, addDays(today, -60), today),
    loadHabits(user.id, today),
    loadGoals(user.id, today, { category: "FAITH", status: { in: ["ACTIVE", "NOT_STARTED", "PAUSED"] } }),
    prisma.growthSettings.findUnique({ where: { ownerId: user.id } }),
    prisma.reminderPreference.findMany({ where: { ownerId: user.id, key: { startsWith: "faith." } } }),
  ]);
  const thisWeek = entries.filter((e) => e.date >= week.start && e.date <= week.end);
  const faithDays = new Set(thisWeek.map((e) => e.date)).size;
  const faithHabits = habits.filter((h) => ["Prayer", "Bible reading"].includes(h.name) && !h.archived);
  const habitDays = new Set(faithHabits.flatMap((h) => [...h.done].filter((d) => d >= week.start))).size;
  const days = Math.max(faithDays, habitDays);
  const target = settings?.faithDaysPerWeek ?? 5;
  const reminder = (key: string) => reminders.find((r) => r.key === key);

  const entryForm = (kind: keyof typeof KIND) => (
    <ActionForm action={faithEntryAction} className="space-y-4" resetOnSuccess>
      <IdemKey /><input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input className="input" type="date" name="date" defaultValue={today} max={today} required /></Field>
        <Field label="Minutes (optional)"><input className="input" type="number" name="minutes" min={1} max={1440} /></Field>
      </div>
      {kind === "BIBLE_READING" && <Field label="Passage"><input className="input" name="passage" placeholder="e.g. Psalm 23" maxLength={120} /></Field>}
      <Field label={kind === "GRATITUDE" ? "I'm grateful for…" : kind === "REFLECTION" ? "Reflection" : "Private note (optional)"}>
        <textarea className="input min-h-[100px] py-2" name="body" maxLength={5000} required={kind === "GRATITUDE" || kind === "REFLECTION"} />
      </Field>
      <p className="text-xs text-mute-400">Private and encrypted. Only you can see it.</p>
      <SubmitButton className="btn-primary w-full">Save</SubmitButton>
    </ActionForm>
  );

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Faith" title="Faith & spiritual growth" />
      <section className="card">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Days with faith time" value={`${days}`} tone="go" sub={`this week · your aim ${target}`} />
          <Stat label="Entries this week" value={thisWeek.length} />
          <Stat label="Gratitude notes" value={entries.filter((e) => e.kind === "GRATITUDE").length} tone="mute" sub="last 60 days" />
        </div>
        <p className="mt-3 text-sm text-mute-300">{days === 0 ? "A fresh week. Even a short prayer counts." : days >= target ? "You made room for God most days this week. 💚" : `${days} day${days > 1 ? "s" : ""} so far this week — every one counts.`}</p>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(Object.keys(KIND) as (keyof typeof KIND)[]).map((k) => (
          <Dialog key={k} title={KIND[k][1]} trigger={<><span aria-hidden>{KIND[k][0]}</span> {KIND[k][1]}</>} triggerClassName="btn-secondary">{entryForm(k)}</Dialog>
        ))}
      </div>

      {faithHabits.length > 0 && <Section title="Daily habits"><HabitGrid habits={faithHabits} today={today} /></Section>}

      <Section title="Weekly spiritual goals" action={<a href="/goals" className="link text-xs">New goal</a>}>
        {goals.length ? <div className="grid gap-3 sm:grid-cols-2">{goals.map((g) => <GoalCard key={g.id} g={g} />)}</div> : <Empty>Create a Faith goal (e.g. “Read the Gospel of John”) from the Goals tab.</Empty>}
      </Section>

      <Section title="Journal (private)">
        {entries.length ? (
          <ul className="space-y-3">
            {entries.slice(0, 20).map((e) => (
              <li key={e.id} className="rounded-xl border border-ink-700 p-3">
                <p className="text-xs text-mute-400"><span aria-hidden>{KIND[e.kind as keyof typeof KIND]?.[0]}</span> {KIND[e.kind as keyof typeof KIND]?.[1]} · {formatLocalDate(e.date, "weekday")}{e.minutes ? ` · ${e.minutes} min` : ""}{e.passage ? ` · ${e.passage}` : ""}</p>
                {e.body && <p className="mt-1 whitespace-pre-line text-sm">{e.body}</p>}
              </li>
            ))}
          </ul>
        ) : <Empty>Nothing yet. Entries appear only when you add them.</Empty>}
      </Section>

      <Section title="Reminders (saved for later)">
        <p className="mb-3 text-xs text-mute-400">Your choices are saved now. Notifications are not sent until push is set up and tested on your iPhone in a later phase.</p>
        {[["faith.prayer", "Prayer reminder", "06:15"], ["faith.reading", "Bible reading reminder", "20:30"]].map(([key, label, def]) => {
          const r = reminder(key!);
          return (
            <ActionForm key={key} action={reminderPrefAction} className="mb-3 space-y-2 rounded-xl border border-ink-700 p-3">
              <input type="hidden" name="key" value={key} />
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex min-h-[40px] items-center gap-2 text-sm font-medium"><input type="checkbox" name="enabled" defaultChecked={r?.enabled} className="h-5 w-5 accent-[#2bea7a]" /> {label}</label>
                <input className="input w-28" type="time" name="time" defaultValue={r?.time ?? def} aria-label={`${label} time`} />
              </div>
              <div className="flex flex-wrap gap-1">
                {WEEKDAYS.map((w, i) => <label key={w} className="flex h-8 w-11 cursor-pointer items-center justify-center rounded-md border border-ink-600 text-[11px] has-[:checked]:border-go has-[:checked]:text-go"><input type="checkbox" name="days" value={i} defaultChecked={r ? r.days.includes(i) : true} className="sr-only" />{w}</label>)}
              </div>
              <SubmitButton className="btn-ghost btn-sm">Save</SubmitButton>
            </ActionForm>
          );
        })}
        <ActionForm action={growthSettingsAction} className="flex items-end gap-2">
          <Field label="Days per week I'm aiming for" className="w-56"><input className="input" type="number" name="faithDaysPerWeek" min={0} max={7} defaultValue={target} /></Field>
          <SubmitButton className="btn-secondary">Save</SubmitButton>
        </ActionForm>
      </Section>
    </div>
  );
}
