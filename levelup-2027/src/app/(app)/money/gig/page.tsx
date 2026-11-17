import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Settings2 } from "lucide-react";
import { appContext } from "@/server/context";
import { gigSummary, listPayouts, listPlatforms, listSessions, plannedShifts, unpaidSessions } from "@/server/gig";
import { addDays, formatLocalDate, instantToLocalDate, instantToLocalTime, isLocalDate, zonedToInstant, formatInstantTime } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { formatMiles, formatMinutes, perHourCents } from "@/domain/gig";
import { parsePeriodKind, periodFor, weeksIn } from "@/domain/periods";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { ConfirmAction } from "@/ui/ConfirmAction";
import { cn } from "@/ui/cn";
import { MoneyFigure, Progress } from "../parts";
import { MileageForm, PayoutForm, PlanShiftForm, SessionForm } from "./forms";
import { gigSettingsAction, platformAction, sessionOpAction, voidPayoutAction } from "./actions";

const STATUS: Record<string, [string, string]> = { PENDING: ["chip-warn", "awaiting payout"], PAID: ["chip-go", "paid"], DISPUTED: ["chip-bad", "disputed"] };

export default async function GigPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { user, today, tz } = await appContext();
  const sp = await searchParams;
  const kind = parsePeriodKind(sp.period, "month");
  const period = periodFor(kind, sp.d && isLocalDate(sp.d) ? sp.d : today, { from: sp.from, to: sp.to });
  const [platforms, allPlatforms, summary, sessions, payouts, unpaid, planned] = await Promise.all([
    listPlatforms(user.id), listPlatforms(user.id, true), gigSummary(user.id, period.from, period.to, { monthTarget: kind === "month" }),
    listSessions(user.id, period.from, period.to), listPayouts(user.id, { includeVoided: true }), unpaidSessions(user.id),
    plannedShifts(user.id, zonedToInstant(addDays(today, -3), "00:00", tz), zonedToInstant(addDays(today, 15), "00:00", tz)),
  ]);
  const t = summary.totals;
  const unpaidCents = unpaid.reduce((a, s) => a + s.earningsCents, 0);
  const popts = platforms.map((p) => ({ id: p.id, name: p.name }));
  const href = (o: Record<string, string>) => `/money/gig?${new URLSearchParams({ period: kind, ...o }).toString()}`;
  const periodPayouts = payouts.filter((p) => p.date >= period.from && p.date <= period.to);
  const weekly = kind === "month" ? weeksIn(period.from, period.to).map((w) => {
    const ss = sessions.filter((s) => s.workDate >= w && s.workDate <= addDays(w, 6));
    return { w, earnings: ss.reduce((a, s) => a + s.earningsCents, 0), minutes: ss.reduce((a, s) => a + s.minutes, 0), count: ss.length };
  }) : [];

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Money" title="🚗 Gig Income">
        <Dialog title="Log a work session" trigger="Log session" triggerClassName="btn-primary btn-sm">
          <SessionForm platforms={popts} d={{ workDate: today }} />
        </Dialog>
        <Dialog title="Confirm a payout" trigger="Confirm payout" triggerClassName="btn-secondary btn-sm">
          <PayoutForm platforms={popts} unpaid={unpaid.map((s) => ({ id: s.id, platformId: s.platformId, label: `${formatLocalDate(s.workDate, "weekday")} · ${formatMinutes(s.minutes)}`, earningsCents: s.earningsCents }))} today={today} />
        </Dialog>
        <Dialog title="Gig settings" trigger={<Settings2 size={16} />} triggerLabel="Gig settings" triggerClassName="btn-ghost btn-sm">
          <ActionForm action={gigSettingsAction} className="space-y-3">
            <Field label="Monthly gross-income target"><input className="input" name="target" inputMode="decimal" defaultValue={(summary.settings.monthlyTargetCents / 100).toFixed(2)} required /></Field>
            <Field label="Tax reserve — your planning estimate (%)" hint="Optional. Applied to estimated profit to suggest an amount to set aside. Not a tax calculation."><input className="input" name="taxReservePct" inputMode="decimal" defaultValue={summary.settings.taxReserveBps !== null ? String(summary.settings.taxReserveBps / 100) : ""} placeholder="Not set" /></Field>
            <Field label="Your vehicle cost per mile ($, optional)" hint="Your own planning figure (gas, wear). LEVEL UP never assumes a mileage or deduction rate."><input className="input" name="costPerMile" inputMode="decimal" defaultValue={summary.settings.costPerMileMills !== null ? (summary.settings.costPerMileMills / 1000).toFixed(3) : ""} placeholder="Not set" /></Field>
            <SubmitButton className="btn-primary w-full">Save settings</SubmitButton>
          </ActionForm>
          <h3 className="eyebrow mb-2 mt-6">Income sources</h3>
          <ul className="divide-line text-sm">
            {allPlatforms.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2">
                <span className={cn(p.archivedAt && "text-mute-400 line-through")}>{p.name}{p.custom && <span className="ml-2 text-[11px] text-mute-400">custom</span>}</span>
                <ActionForm action={platformAction}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="op" value={p.archivedAt ? "restore" : "archive"} /><SubmitButton className="btn-ghost btn-sm">{p.archivedAt ? "Restore" : "Hide"}</SubmitButton></ActionForm>
              </li>
            ))}
          </ul>
          <ActionForm action={platformAction} resetOnSuccess className="mt-3 flex gap-2">
            <input type="hidden" name="op" value="add" />
            <input className="input" name="name" placeholder="Add a source (e.g. Uber Eats, cash job)" aria-label="New income source" required minLength={2} maxLength={40} />
            <SubmitButton className="btn-secondary">Add</SubmitButton>
          </ActionForm>
        </Dialog>
      </PageHeader>

      <nav aria-label="Period" className="flex flex-wrap items-center gap-2">
        {(["week", "month", "year"] as const).map((k) => (
          <Link key={k} href={`/money/gig?period=${k}`} aria-current={kind === k ? "page" : undefined} className={cn("inline-flex min-h-[36px] items-center rounded-full border px-3 text-[13px] font-semibold capitalize", kind === k ? "border-go bg-go/10 text-go" : "border-ink-700 text-mute-300")}>{k}</Link>
        ))}
        <span className="ml-auto flex items-center gap-1">
          {period.prev && <Link className="btn-ghost btn-sm" href={href({ d: period.prev })} aria-label="Previous period"><ChevronLeft size={16} /></Link>}
          <span className="text-sm font-semibold">{period.label}</span>
          {period.next && <Link className="btn-ghost btn-sm" href={href({ d: period.next })} aria-label="Next period"><ChevronRight size={16} /></Link>}
        </span>
      </nav>

      <section className="relative overflow-hidden rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 p-5">
        <p className="eyebrow">Gig earnings · {period.label}</p>
        <MoneyFigure cents={t.earningsCents} className="mt-1 block text-[40px] leading-none text-white" />
        <p className="mt-1 text-xs text-mute-400">What the apps reported for work you logged. <strong className="text-mute-300">Not spendable</strong> until a payout reaches your bank.</p>
        {summary.target && (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs"><span className="text-mute-300">Monthly target {formatCents(summary.target.monthlyTargetCents)}</span><span className="num text-mute-300">{summary.target.pct ?? 0}%</span></div>
            <Progress label="Monthly gig target" value={t.earningsCents} max={summary.target.monthlyTargetCents} />
            <p className="mt-1 text-[11px] text-mute-400">{summary.target.remainingCents ? `${formatCents(summary.target.remainingCents)} to go` : "Target reached 🎉"}</p>
          </div>
        )}
        <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-ink-700 pt-4 sm:grid-cols-4">
          <div><dt className="text-[11px] uppercase tracking-wider text-mute-400">Expenses</dt><dd className="num text-lg font-semibold">{formatCents(t.expensesCents + (t.mileageCostCents ?? 0))}</dd><dd className="text-[11px] text-mute-400">{t.mileageCostCents === null ? "parking, tolls, other" : "incl. your mileage cost"}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-mute-400">Est. profit</dt><dd className={cn("num text-lg font-semibold", t.estProfitCents < 0 && "text-bad")}>{formatCents(t.estProfitCents)}</dd><dd className="text-[11px] text-mute-400">before taxes · estimate</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-mute-400">Deposited</dt><dd className="num text-lg font-semibold text-go">{formatCents(summary.payoutsCents)}</dd><dd className="text-[11px] text-mute-400">{summary.payoutCount} confirmed payout{summary.payoutCount === 1 ? "" : "s"}</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-mute-400">Per hour</dt><dd className="num text-lg font-semibold">{t.earningsPerHourCents === null ? "—" : formatCents(t.earningsPerHourCents)}</dd><dd className="text-[11px] text-mute-400">{t.estProfitPerHourCents === null ? "log hours to see this" : `${formatCents(t.estProfitPerHourCents)} est. profit/h`}</dd></div>
        </dl>
        <p className="mt-3 text-[11px] text-mute-400">{formatMinutes(t.minutes)} worked · {formatMiles(t.milesHundredths)} · {t.sessions} session{t.sessions === 1 ? "" : "s"}
          {t.taxReserveCents !== null && <> · Tax set-aside (your {summary.settings.taxReserveBps! / 100}% planning estimate): <span className="num text-mute-300">{formatCents(t.taxReserveCents)}</span></>}
        </p>
      </section>

      {unpaidCents > 0 && (
        <section className="card flex items-center justify-between gap-3 text-sm">
          <span><span className="block font-semibold">Awaiting payout</span><span className="text-xs text-mute-400">{unpaid.length} session{unpaid.length === 1 ? "" : "s"} earned but not yet deposited — not counted as money</span></span>
          <span className="num font-semibold text-warn">{formatCents(unpaidCents)}</span>
        </section>
      )}

      <Section title="By platform">
        {summary.byPlatform.length ? (
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
              <thead><tr className="text-left text-[11px] uppercase tracking-wider text-mute-400"><th className="px-1 py-1 font-medium">Source</th><th className="px-1 py-1 text-right font-medium">Earned</th><th className="px-1 py-1 text-right font-medium">Per hour</th><th className="px-1 py-1 text-right font-medium">Deposited</th></tr></thead>
              <tbody>
                {summary.byPlatform.map((p) => (
                  <tr key={p.platformId} className="border-t border-ink-800">
                    <td className="px-1 py-2 font-medium">{p.name}<span className="block text-[11px] font-normal text-mute-400">{formatMinutes(p.totals.minutes)} · {formatMiles(p.totals.milesHundredths)}</span></td>
                    <td className="num px-1 py-2 text-right">{formatCents(p.totals.earningsCents)}</td>
                    <td className="num px-1 py-2 text-right">{p.totals.earningsPerHourCents === null ? "—" : formatCents(p.totals.earningsPerHourCents)}</td>
                    <td className="num px-1 py-2 text-right text-go">{formatCents(p.payoutsCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>No gig activity in this period yet. Log a session after your next shift.</Empty>}
      </Section>

      {weekly.some((w) => w.count) && (
        <Section title="Weekly (Sat–Fri)">
          <ul className="divide-line text-sm">
            {weekly.map((w) => (
              <li key={w.w} className="flex justify-between py-2"><span>Week of {formatLocalDate(w.w)}</span><span className="num text-mute-300">{formatCents(w.earnings)} · {formatMinutes(w.minutes)}{w.minutes ? ` · ${formatCents(perHourCents(w.earnings, w.minutes)!)}/h` : ""}</span></li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Planned shifts" action={<Dialog title="Plan a gig shift" trigger="Plan shift" triggerClassName="btn-ghost btn-sm"><PlanShiftForm platforms={popts} today={today} /></Dialog>}>
        {planned.length ? (
          <ul className="divide-line">
            {planned.map((p) => {
              const d = instantToLocalDate(p.startAt, tz);
              const platform = platforms.find((x) => p.title.startsWith(x.name));
              return (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <span><span className="block font-medium">{p.title}</span><span className="text-xs text-mute-400">{formatLocalDate(d, "weekday")} · {formatInstantTime(p.startAt, tz)}–{formatInstantTime(p.endAt, tz)} · {p.description}</span></span>
                  {p.logged ? <span className="chip-go">logged</span> : d <= today ? (
                    <Dialog title="Log this shift" trigger="Log as worked" triggerClassName="btn-secondary btn-sm">
                      <SessionForm platforms={popts} d={{ workDate: d, platformId: platform?.id, startTime: instantToLocalTime(p.startAt, tz), endTime: instantToLocalTime(p.endAt, tz), plannedEventId: p.id }} />
                    </Dialog>
                  ) : <span className="chip-mute">planned · not earned</span>}
                </li>
              );
            })}
          </ul>
        ) : <Empty>No gig shifts planned in the next two weeks.</Empty>}
      </Section>

      <Section title="Work sessions">
        {sessions.length ? (
          <ul className="divide-line">
            {sessions.map((s) => (
              <li key={s.id} className="py-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span><span className="block font-medium">{s.platform} · {formatLocalDate(s.workDate, "weekday")}</span>
                    <span className="text-xs text-mute-400">{s.startAt && s.endAt ? `${formatInstantTime(s.startAt, tz)}–${formatInstantTime(s.endAt, tz)} · ` : ""}{formatMinutes(s.minutes)}{s.milesHundredths ? ` · ${formatMiles(s.milesHundredths)}` : ""}{s.expensesCents ? ` · ${formatCents(s.expensesCents)} costs` : ""}</span>
                  </span>
                  <span className="text-right"><span className="num block font-semibold">{formatCents(s.earningsCents)}</span><span className={STATUS[s.status]![0]}>{STATUS[s.status]![1]}</span></span>
                </div>
                {s.notes && <p className="mt-1 text-xs text-mute-400">{s.notes}</p>}
                <div className="mt-1 flex flex-wrap gap-1">
                  <Dialog title="Edit session" trigger="Edit" triggerClassName="btn-ghost btn-sm">
                    <SessionForm platforms={allPlatforms.map((p) => ({ id: p.id, name: p.name }))} d={{ ...s, startTime: s.startAt ? instantToLocalTime(s.startAt, tz) : null, endTime: s.endAt ? instantToLocalTime(s.endAt, tz) : null, paid: s.status === "PAID" }} />
                  </Dialog>
                  {s.status !== "PAID" && (
                    <>
                      <ActionForm action={sessionOpAction}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="op" value={s.status === "DISPUTED" ? "undispute" : "dispute"} /><SubmitButton className="btn-ghost btn-sm">{s.status === "DISPUTED" ? "Clear dispute" : "Mark disputed"}</SubmitButton></ActionForm>
                      <ConfirmAction label="Remove" title="Remove this session?" action={sessionOpAction} fields={{ id: s.id, op: "archive" }} confirmLabel="Remove session">
                        It will no longer count toward your totals. It stays in your history and the audit log.
                      </ConfirmAction>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty>No sessions logged in {period.label}.</Empty>}
      </Section>

      <Section title="Payouts received">
        {periodPayouts.length ? (
          <ul className="divide-line">
            {periodPayouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-3 text-sm">
                <span>
                  <span className={cn("block font-medium", p.voidedAt && "text-mute-400 line-through")}>{p.platform} · {formatLocalDate(p.date, "weekday")}</span>
                  <span className="text-xs text-mute-400">{p.voidedAt ? `Voided: ${p.voidReason}` : `${p.sessions} session${p.sessions === 1 ? "" : "s"}${p.externalRef ? ` · ${p.externalRef}` : ""}${p.committedCents ? ` · ${formatCents(p.committedCents)} allocated` : " · unallocated"}`}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className={cn("num font-semibold", p.voidedAt ? "text-mute-400" : "text-go")}>{formatCents(p.netCents)}</span>
                  {!p.voidedAt && p.availableCents > 0 && <Link href={`/money/roulette/${p.depositId}`} className="btn-ghost btn-sm" aria-label={`Spin ${p.platform} payout in Roulette`}>🎲</Link>}
                  {!p.voidedAt && (
                    <ConfirmAction label="Correct" title="Correct this payout" action={voidPayoutAction} fields={{ id: p.id }} confirmLabel="Void payout" reason={{ label: "Reason", placeholder: "e.g. typed the wrong amount" }}>
                      The payout and its ledger deposit are voided and kept as history; its sessions go back to “awaiting payout”. Then re-enter the correct payout. This is refused if the money is already allocated.
                    </ConfirmAction>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : <Empty>No payouts confirmed in {period.label}. Payouts appear here only after you confirm money reached your bank.</Empty>}
      </Section>

      <Section title="Mileage & tax records">
        <p className="mb-3 text-xs text-mute-400">{formatMiles(t.milesHundredths)} logged this period. LEVEL UP doesn&apos;t assume a mileage rate or decide what&apos;s deductible — export your records for your tax preparer.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/money/gig/mileage" className="btn-secondary btn-sm">Mileage log</Link>
          <Dialog title="Add a business trip" trigger="Add trip" triggerClassName="btn-ghost btn-sm"><MileageForm platforms={popts} d={{ tripDate: today }} /></Dialog>
          {(["sessions", "mileage", "payouts"] as const).map((k) => (
            <a key={k} className="btn-ghost btn-sm" href={`/api/export/gig?kind=${k}&from=${period.from}&to=${period.to}`} download><Download size={14} /> {k} CSV</a>
          ))}
        </div>
      </Section>
    </div>
  );
}
