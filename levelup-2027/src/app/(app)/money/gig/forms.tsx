"use client";
import { useMemo, useState } from "react";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { useDialog } from "@/ui/dialog";
import { IdemKey } from "@/ui/IdemKey";
import { formatCents, parseDollarsToCents } from "@/domain/money";
import { confirmPayoutAction, planShiftAction, saveMileageAction, saveSessionAction } from "./actions";

export interface PlatformOpt { id: string; name: string }
const money = (c: number | null | undefined) => (c ? (c / 100).toFixed(2) : "");

export interface SessionDefaults {
  id?: string; version?: number; platformId?: string; workDate: string; startTime?: string | null; endTime?: string | null; minutes?: number | null;
  grossCents?: number; tipsCents?: number; tipsInGross?: boolean; bonusCents?: number; bonusInGross?: boolean; parkingTollsCents?: number;
  otherExpenseCents?: number; milesHundredths?: number | null; notes?: string | null; plannedEventId?: string | null; paid?: boolean;
}

export function SessionForm({ platforms, d }: { platforms: PlatformOpt[]; d: SessionDefaults }) {
  const { close } = useDialog();
  const [useTimes, setUseTimes] = useState(!!d.startTime || !d.id);
  return (
    <ActionForm action={saveSessionAction} onSuccess={close} className="space-y-3">
      {d.id && <><input type="hidden" name="id" value={d.id} /><input type="hidden" name="version" value={d.version} /></>}
      {d.plannedEventId && <input type="hidden" name="plannedEventId" value={d.plannedEventId} />}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Platform"><select className="input" name="platformId" defaultValue={d.platformId ?? platforms[0]?.id} required>{platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Date"><input className="input" type="date" name="workDate" defaultValue={d.workDate} required /></Field>
      </div>
      <div role="radiogroup" aria-label="Time worked" className="flex gap-2 text-xs">
        <button type="button" role="radio" aria-checked={useTimes} className={useTimes ? "chip-go" : "chip-mute"} onClick={() => setUseTimes(true)}>Start & end</button>
        <button type="button" role="radio" aria-checked={!useTimes} className={!useTimes ? "chip-go" : "chip-mute"} onClick={() => setUseTimes(false)}>Total hours</button>
      </div>
      {useTimes ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Start"><input className="input" type="time" name="startTime" defaultValue={d.startTime ?? ""} required /></Field>
          <Field label="End"><input className="input" type="time" name="endTime" defaultValue={d.endTime ?? ""} required /></Field>
        </div>
      ) : (
        <Field label="Hours worked" hint="Actual time — used for your hourly figures."><input className="input" name="hours" inputMode="decimal" defaultValue={d.minutes ? String(Math.round((d.minutes / 60) * 100) / 100) : ""} required /></Field>
      )}
      <Field label="Gross earnings" hint="What the app reported for this session."><input className="input" name="gross" inputMode="decimal" defaultValue={money(d.grossCents)} required placeholder="0.00" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Tips"><input className="input" name="tips" inputMode="decimal" defaultValue={money(d.tipsCents)} placeholder="0.00" /></Field>
        <Field label="Tips are…"><select className="input" name="tipsMode" defaultValue={d.tipsInGross === false ? "extra" : "included"}><option value="included">Included in gross</option><option value="extra">On top of gross</option></select></Field>
        <Field label="Bonuses"><input className="input" name="bonus" inputMode="decimal" defaultValue={money(d.bonusCents)} placeholder="0.00" /></Field>
        <Field label="Bonuses are…"><select className="input" name="bonusMode" defaultValue={d.bonusInGross === false ? "extra" : "included"}><option value="included">Included in gross</option><option value="extra">On top of gross</option></select></Field>
      </div>
      <p className="text-[11px] text-mute-400">Amounts marked “included” are never added again.</p>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Miles"><input className="input" name="miles" inputMode="decimal" defaultValue={d.milesHundredths ? (d.milesHundredths / 100).toString() : ""} placeholder="0" /></Field>
        <Field label="Parking/tolls"><input className="input" name="parking" inputMode="decimal" defaultValue={money(d.parkingTollsCents)} placeholder="0.00" /></Field>
        <Field label="Other costs"><input className="input" name="other" inputMode="decimal" defaultValue={money(d.otherExpenseCents)} placeholder="0.00" /></Field>
      </div>
      <Field label="Private notes (optional)"><textarea className="input min-h-[64px]" name="notes" defaultValue={d.notes ?? ""} maxLength={1000} /></Field>
      {d.paid && (
        <Field label="Correction reason (needed if you change amounts)" hint="This session is in a confirmed payout. The payout and deposit stay as recorded.">
          <input className="input" name="correctionReason" maxLength={200} />
        </Field>
      )}
      <SubmitButton className="btn-primary w-full">{d.id ? "Save changes" : "Log session"}</SubmitButton>
    </ActionForm>
  );
}

export interface UnpaidOpt { id: string; platformId: string; label: string; earningsCents: number }

export function PayoutForm({ platforms, unpaid, today }: { platforms: PlatformOpt[]; unpaid: UnpaidOpt[]; today: string }) {
  const { close } = useDialog();
  const [platformId, setPlatformId] = useState(platforms[0]?.id ?? "");
  const [picked, setPicked] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const options = unpaid.filter((u) => u.platformId === platformId);
  const sessionTotal = useMemo(() => options.filter((o) => picked.includes(o.id)).reduce((a, o) => a + o.earningsCents, 0), [options, picked]);
  const amt = parseDollarsToCents(amount);
  return (
    <ActionForm action={confirmPayoutAction} onSuccess={close} className="space-y-3">
      <IdemKey />
      <p className="rounded-xl border border-go/30 bg-go/10 p-3 text-xs text-mute-300">Only confirm money that has <strong className="text-white">actually reached your bank</strong>. This adds one gig deposit to your ledger. It is not sent to Roulette unless you choose to.</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Platform"><select className="input" name="platformId" value={platformId} onChange={(e) => { setPlatformId(e.target.value); setPicked([]); }}>{platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Date it arrived"><input className="input" type="date" name="depositDate" defaultValue={today} max={today} required /></Field>
      </div>
      <Field label="Amount deposited"><input className="input" name="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" /></Field>
      <Field label="Platform payout ID (optional)" hint="Helps catch the same payout entered twice."><input className="input" name="externalRef" maxLength={80} /></Field>
      <fieldset>
        <legend className="label">Sessions this payout covers (optional)</legend>
        {options.length ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {options.map((o) => (
              <li key={o.id}>
                <label className="flex min-h-[44px] items-center gap-3 rounded-lg border border-ink-700 px-3 text-sm">
                  <input type="checkbox" name="sessionIds" value={o.id} checked={picked.includes(o.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, o.id] : p.filter((x) => x !== o.id)))} className="h-5 w-5 accent-[#2bea7a]" />
                  <span className="flex-1">{o.label}</span><span className="num text-mute-300">{formatCents(o.earningsCents)}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : <p className="text-xs text-mute-400">No unpaid sessions for this platform.</p>}
        {picked.length > 0 && amt !== null && amt !== sessionTotal && (
          <p className="mt-2 text-xs text-warn">Sessions total {formatCents(sessionTotal)}; deposit is {formatCents(amt)}. That&apos;s fine (fees, timing, instant-pay charges) — the deposit amount is what counts as money.</p>
        )}
      </fieldset>
      <label className="flex min-h-[40px] items-center gap-3 text-xs text-mute-300"><input type="checkbox" name="confirmSeparate" className="h-5 w-5 accent-[#2bea7a]" /> This is a separate payout (only if one with the same amount and date is already confirmed)</label>
      <Field label="Note (optional)"><input className="input" name="notes" maxLength={300} /></Field>
      <SubmitButton className="btn-primary w-full">Confirm payout received</SubmitButton>
    </ActionForm>
  );
}

export interface MileageDefaults { id?: string; platformId?: string | null; tripDate: string; milesHundredths?: number; purpose?: string; odometerStartTenths?: number | null; odometerEndTenths?: number | null; notes?: string | null }

export function MileageForm({ platforms, d }: { platforms: PlatformOpt[]; d: MileageDefaults }) {
  const { close } = useDialog();
  return (
    <ActionForm action={saveMileageAction} onSuccess={close} className="space-y-3">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Date"><input className="input" type="date" name="tripDate" defaultValue={d.tripDate} required /></Field>
        <Field label="Platform"><select className="input" name="platformId" defaultValue={d.platformId ?? ""}><option value="">None</option>{platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      </div>
      <Field label="Business purpose"><input className="input" name="purpose" defaultValue={d.purpose ?? ""} required minLength={2} maxLength={120} placeholder="e.g. Drive to Veho hub and route" /></Field>
      <Field label="Miles" hint="Or leave empty and enter both odometer readings."><input className="input" name="miles" inputMode="decimal" defaultValue={d.milesHundredths ? (d.milesHundredths / 100).toString() : ""} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Odometer start (optional)"><input className="input" name="odoStart" inputMode="decimal" defaultValue={d.odometerStartTenths != null ? (d.odometerStartTenths / 10).toString() : ""} /></Field>
        <Field label="Odometer end (optional)"><input className="input" name="odoEnd" inputMode="decimal" defaultValue={d.odometerEndTenths != null ? (d.odometerEndTenths / 10).toString() : ""} /></Field>
      </div>
      <Field label="Notes (optional)"><input className="input" name="notes" defaultValue={d.notes ?? ""} maxLength={500} /></Field>
      <SubmitButton className="btn-primary w-full">{d.id ? "Save trip" : "Add trip"}</SubmitButton>
    </ActionForm>
  );
}

export function PlanShiftForm({ platforms, today }: { platforms: PlatformOpt[]; today: string }) {
  return (
    <ActionForm action={planShiftAction} className="space-y-3">
      <Field label="Platform"><select className="input" name="platformId">{platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Date"><input className="input" type="date" name="date" defaultValue={today} min={today} required /></Field>
        <Field label="Start"><input className="input" type="time" name="time" defaultValue="17:00" required /></Field>
        <Field label="Minutes"><input className="input" type="number" name="durationMin" defaultValue={180} min={15} max={600} required /></Field>
      </div>
      <Field label="Income target (optional)" hint="A goal for this shift — never counted as earned."><input className="input" name="target" inputMode="decimal" placeholder="0.00" /></Field>
      <label className="flex min-h-[40px] items-center gap-3 text-xs text-mute-300"><input type="checkbox" name="override" className="h-5 w-5 accent-[#2bea7a]" /> Plan it anyway if it overlaps a DOC shift or other event (I&apos;ve checked)</label>
      <p className="text-xs text-mute-400">Checked against your DOC shifts and calendar. Nothing else is moved.</p>
      <SubmitButton className="btn-primary w-full">Add to calendar</SubmitButton>
    </ActionForm>
  );
}
