import { Heart } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { relationshipOverview } from "@/server/life";
import { WEEKDAYS, WEEKDAYS_LONG, dateToLocal, formatLocalDate, formatTime12 } from "@/domain/dates";
import { nextWeekdays } from "@/domain/growth";
import { formatCents } from "@/domain/money";
import { PageHeader, Section, Stat, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { cn } from "@/ui/cn";
import { alphabetAction, changeDateAction, completeDateAction, growthSettingsAction, planDateAction, relationshipItemAction } from "../actions";

function PlanForm({ date, time, letter, activity, budget }: { date: string; time: string; letter?: string; activity?: string | null; budget?: number | null }) {
  return (
    <ActionForm action={planDateAction} className="space-y-3">
      {letter && <input type="hidden" name="letter" value={letter} />}
      <Field label={letter ? `Activity for “${letter}”` : "What are you doing?"}><input className="input" name="title" defaultValue={activity ?? ""} required maxLength={120} /></Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Date"><input className="input" type="date" name="date" defaultValue={date} required /></Field>
        <Field label="Time"><input className="input" type="time" name="time" defaultValue={time} /></Field>
        <Field label="Hours"><select className="input" name="durationMin" defaultValue="150"><option value="90">1.5</option><option value="150">2.5</option><option value="240">4</option><option value="480">All day</option></select></Field>
      </div>
      <Field label="Budget (optional)"><input className="input" name="budget" inputMode="decimal" defaultValue={budget ? (budget / 100).toFixed(2) : ""} placeholder="0.00" /></Field>
      <Field label="Private notes (encrypted)"><input className="input" name="notes" maxLength={1000} /></Field>
      <label className="flex min-h-[40px] items-center gap-3 text-xs text-mute-300"><input type="checkbox" name="acceptConflicts" className="h-5 w-5 accent-[#2bea7a]" /> Plan anyway if it overlaps something</label>
      <p className="text-xs text-mute-400">Adds it to your calendar. Nothing is booked or purchased.</p>
      <SubmitButton className="btn-primary w-full">Plan date</SubmitButton>
    </ActionForm>
  );
}

export default async function RelationshipPage() {
  const { user, today } = await appContext();
  const r = await relationshipOverview(user.id, today);
  const wd = r.settings?.dateNightWeekday ?? 5;
  const tm = r.settings?.dateNightTime ?? "18:30";
  const nextDateNight = nextWeekdays(today, [wd], 1)[0]!;
  const funPayments = await prisma.payment.findMany({ where: { ownerId: user.id, kind: "FUN_MONEY", reversedAt: null, reversalOfId: null, datePlan: null }, orderBy: { paidOn: "desc" }, take: 20 });

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Relationship" title="Us">
        <Dialog title="Plan a date" trigger={<><Heart size={16} /> Plan a date</>} triggerClassName="btn-primary"><PlanForm date={nextDateNight} time={tm} /></Dialog>
      </PageHeader>

      <section className="card grid grid-cols-3 gap-3">
        <Stat label="Next date night" value={r.upcoming[0] ? formatLocalDate(r.upcoming[0].date, "weekday") : "Not planned"} sub={r.upcoming[0]?.title ?? `Usually ${WEEKDAYS_LONG[wd]}s`} tone={r.upcoming[0] ? "go" : "mute"} />
        <Stat label="Alphabet Dating" value={`${r.alphabetProgress.completed}/26`} sub={r.alphabetProgress.next ? `next letter: ${r.alphabetProgress.next}` : "complete!"} />
        <Stat label="Spent on dates" value={formatCents(r.spending.totalCents)} tone="mute" sub="completed dates, counted once" />
      </section>

      <Section title="Upcoming">
        {r.upcoming.length ? (
          <ul className="divide-line">
            {r.upcoming.map((p) => (
              <li key={p.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span><span className="font-semibold">{p.letter ? `${p.letter} · ` : ""}{p.title}</span><span className="block text-xs text-mute-400">{formatLocalDate(p.date, "weekday")}{p.startTime ? ` · ${formatTime12(p.startTime)}` : ""}{p.budgetCents !== null ? ` · budget ${formatCents(p.budgetCents)}` : ""}</span></span>
                  <span className="flex gap-1">
                    {p.date <= today && <Dialog title="How was it?" trigger="Mark done" triggerClassName="btn-primary btn-sm">
                      <ActionForm action={completeDateAction} className="space-y-4">
                        <input type="hidden" name="id" value={p.id} />
                        <Field label="What it cost (optional)" hint="Record it here, or link a guilt-free money transfer you already confirmed — never both."><input className="input" name="actualCost" inputMode="decimal" /></Field>
                        {funPayments.length > 0 && (
                          <Field label="…or link a confirmed guilt-free transfer"><select className="input" name="paymentId" defaultValue=""><option value="">Don&apos;t link</option>{funPayments.map((f) => <option key={f.id} value={f.id}>{formatCents(f.amountCents)} · {dateToLocal(f.paidOn)}</option>)}</select></Field>
                        )}
                        <SubmitButton className="btn-primary w-full">Mark as done</SubmitButton>
                      </ActionForm>
                    </Dialog>}
                    <Dialog title="Move this date" trigger="Postpone" triggerClassName="btn-ghost btn-sm">
                      <ActionForm action={changeDateAction} className="space-y-4">
                        <input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="POSTPONED" />
                        <div className="grid grid-cols-2 gap-2"><Field label="New date"><input className="input" type="date" name="newDate" min={today} required /></Field><Field label="Time"><input className="input" type="time" name="newTime" defaultValue={p.startTime ?? tm} /></Field></div>
                        <SubmitButton className="btn-primary w-full">Move</SubmitButton>
                      </ActionForm>
                    </Dialog>
                    <ActionForm action={changeDateAction}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="CANCELLED" /><SubmitButton className="btn-ghost btn-sm" pendingText="…">Cancel</SubmitButton></ActionForm>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty>No dates planned. {formatLocalDate(nextDateNight, "weekday")} is your next usual date night.</Empty>}
      </Section>

      <Section title={`Alphabet Dating · ${r.alphabetProgress.completed} of 26`}>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-go" style={{ width: `${r.alphabetProgress.pct}%` }} /></div>
        <ul className="grid grid-cols-6 gap-1.5 sm:grid-cols-9" aria-label="Alphabet letters">
          {r.alphabet.map((a) => (
            <li key={a.letter}>
              <Dialog title={`Letter ${a.letter}`} triggerLabel={`Letter ${a.letter}, ${a.status.toLowerCase()}`} trigger={<><span className="text-lg font-bold">{a.letter}</span><span className="block truncate text-[9px] font-normal opacity-80">{a.activity ?? (a.status === "SKIPPED" ? "skipped" : "")}</span></>}
                triggerClassName={cn("flex aspect-square w-full flex-col items-center justify-center rounded-xl border px-0.5 text-center",
                  a.status === "COMPLETED" ? "border-go bg-go text-ink-950" : a.status === "PLANNED" ? "border-go/70 bg-go/10 text-go" : a.status === "SKIPPED" ? "border-ink-700 text-ink-500 line-through" : "border-ink-600 text-white",
                  a.letter === r.alphabetProgress.next && a.status === "OPEN" && "ring-2 ring-go")}>
                {a.status === "COMPLETED" ? (
                  <p className="text-sm">✓ {a.activity} — completed {a.completedAt?.toISOString().slice(0, 10)}. Kept in your history.</p>
                ) : (
                  <div className="space-y-5">
                    <ActionForm action={alphabetAction} className="space-y-3">
                      <input type="hidden" name="letter" value={a.letter} />
                      <Field label="Idea / activity"><input className="input" name="activity" defaultValue={a.activity ?? ""} maxLength={120} placeholder={`Something starting with ${a.letter}`} /></Field>
                      <Field label="Estimated budget"><input className="input" name="estBudget" inputMode="decimal" defaultValue={a.estBudgetCents ? (a.estBudgetCents / 100).toFixed(2) : ""} /></Field>
                      <Field label="Notes"><input className="input" name="notes" defaultValue={a.notes ?? ""} maxLength={300} /></Field>
                      <div className="flex gap-2">
                        <SubmitButton className="btn-secondary flex-1">Save idea</SubmitButton>
                        <button className="btn-ghost" name="op" value={a.status === "SKIPPED" ? "unskip" : "skip"}>{a.status === "SKIPPED" ? "Unskip" : "Skip letter"}</button>
                      </div>
                    </ActionForm>
                    {a.status !== "PLANNED" && a.status !== "SKIPPED" && <div className="border-t border-ink-700 pt-4"><p className="mb-2 text-sm font-semibold">Plan the {a.letter} date</p><PlanForm date={nextDateNight} time={tm} letter={a.letter} activity={a.activity} budget={a.estBudgetCents} /></div>}
                    {a.status === "PLANNED" && <p className="text-sm text-mute-300">Planned — mark it done from Upcoming after the date.</p>}
                  </div>
                )}
              </Dialog>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Important dates" action={
        <Dialog title="Add an important date" trigger="Add" triggerClassName="btn-secondary btn-sm">
          <ActionForm action={relationshipItemAction} className="space-y-3">
            <input type="hidden" name="op" value="importantDate" />
            <Field label="What"><input className="input" name="title" required maxLength={80} placeholder="e.g. Our anniversary" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Kind"><select className="input" name="kind"><option value="ANNIVERSARY">Anniversary</option><option value="BIRTHDAY">Birthday</option><option value="OTHER">Other</option></select></Field>
              <Field label="Date"><input className="input" type="date" name="date" required /></Field>
            </div>
            <label className="flex items-center gap-2 text-xs text-mute-300"><input type="checkbox" name="knowYear" defaultChecked className="h-4 w-4 accent-[#2bea7a]" /> Remember the year</label>
            <SubmitButton className="btn-primary w-full">Save</SubmitButton>
          </ActionForm>
        </Dialog>
      }>
        {r.importantDates.length ? <ul className="divide-line text-sm">{r.importantDates.map((d) => <li key={d.id} className="flex justify-between py-2"><span>{d.title}</span><span className="text-mute-300">{formatLocalDate(d.next, "weekday")}</span></li>)}</ul> : <Empty>Add anniversaries and birthdays so they show up on Home.</Empty>}
      </Section>

      <Section title="Date ideas" action={
        <Dialog title="Add an idea" trigger="Add" triggerClassName="btn-secondary btn-sm">
          <ActionForm action={relationshipItemAction} className="space-y-3" resetOnSuccess>
            <input type="hidden" name="op" value="idea" />
            <Field label="Idea"><input className="input" name="title" required maxLength={120} /></Field>
            <div className="grid grid-cols-2 gap-2"><Field label="Est. cost"><input className="input" name="estCost" inputMode="decimal" /></Field><Field label="Letter (optional)"><input className="input" name="letter" maxLength={1} /></Field></div>
            <SubmitButton className="btn-primary w-full">Save idea</SubmitButton>
          </ActionForm>
        </Dialog>
      }>
        {r.ideas.length ? <ul className="flex flex-wrap gap-2">{r.ideas.map((i) => <li key={i.id} className="chip-mute normal-case">{i.letter ? `${i.letter} · ` : ""}{i.title}{i.estCostCents !== null ? ` · ${formatCents(i.estCostCents)}` : ""}</li>)}</ul> : <Empty>Collect ideas as they come up.</Empty>}
      </Section>

      <Section title="Private notes (encrypted)">
        <ActionForm action={relationshipItemAction} className="mb-3 flex gap-2" resetOnSuccess>
          <input type="hidden" name="op" value="note" />
          <input className="input" name="body" placeholder="Something to remember…" maxLength={2000} aria-label="Private note" />
          <SubmitButton className="btn-secondary">Save</SubmitButton>
        </ActionForm>
        {r.notes.length ? <ul className="space-y-2 text-sm">{r.notes.map((n) => <li key={n.id} className="rounded-lg border border-ink-700 p-2.5"><p className="whitespace-pre-line">{n.body}</p><p className="mt-1 text-[11px] text-mute-400">{n.createdAt.toISOString().slice(0, 10)}</p></li>)}</ul> : null}
      </Section>

      <Section title="Past dates">
        {r.past.length ? <ul className="divide-line text-sm">{r.past.slice(0, 15).map((p) => (
          <li key={p.id} className="flex justify-between gap-2 py-2"><span>{p.letter ? `${p.letter} · ` : ""}{p.title} <span className="text-xs text-mute-400">· {formatLocalDate(p.date, "weekday")}</span></span>
            <span className={p.status === "COMPLETED" ? "chip-go" : "chip-mute"}>{p.status === "COMPLETED" ? (p.linkedPaymentCents !== null ? `${formatCents(p.linkedPaymentCents)} · linked` : p.actualCostCents !== null ? formatCents(p.actualCostCents) : "done") : p.status.toLowerCase()}</span></li>
        ))}</ul> : <Empty>No past dates yet.</Empty>}
      </Section>

      <Section title="Date night preference">
        <ActionForm action={growthSettingsAction} className="flex flex-wrap items-end gap-2">
          <Field label="Usual day"><select className="input" name="dateNightWeekday" defaultValue={String(wd)}>{WEEKDAYS_LONG.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></Field>
          <Field label="Time"><input className="input" type="time" name="dateNightTime" defaultValue={tm} /></Field>
          <SubmitButton className="btn-secondary">Save</SubmitButton>
        </ActionForm>
        <p className="mt-2 text-xs text-mute-400">Fridays are off from DOC, which is why Friday is the default — change it anytime. ({WEEKDAYS.join(" ")})</p>
      </Section>
    </div>
  );
}
