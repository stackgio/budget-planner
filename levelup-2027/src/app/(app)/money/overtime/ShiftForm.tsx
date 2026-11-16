"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { useDialog } from "@/ui/dialog";
import { estimateGross, formatCents, formatHours, parseHoursX100, workedHoursX100 } from "@/domain/money";
import { zonedToInstant, addDays, formatLocalDate } from "@/domain/dates";
import { overtimeShiftAction } from "../actions";

export interface ShiftValues {
  id?: string; date: string; startTime: string; endTime: string; breakMinutes: number; regularHours: string; overtimeHours: string;
  isActivation: boolean; payrollPeriod: string; paydayId: string; status: string; notes: string;
}

export function ShiftForm({ v, paydays, rate, tz, isToday }: { v: ShiftValues; paydays: { id: string; officialDate: string }[]; rate: { hourly: number; bp: number }; tz: string; isToday?: boolean }) {
  const router = useRouter();
  const dialog = useDialog();
  const [s, setS] = useState(v);
  const set = (k: keyof ShiftValues, val: string | boolean | number) => setS((x) => ({ ...x, [k]: val }));
  const worked = useMemo(() => {
    try {
      const st = zonedToInstant(s.date, s.startTime, tz);
      let en = zonedToInstant(s.date, s.endTime, tz);
      if (en <= st) en = zonedToInstant(addDays(s.date, 1), s.endTime, tz);
      return workedHoursX100(st, en, Number(s.breakMinutes) || 0);
    } catch { return 0; }
  }, [s.date, s.startTime, s.endTime, s.breakMinutes, tz]);
  const reg = parseHoursX100(s.regularHours || "0") ?? 0;
  const ot = parseHoursX100(s.overtimeHours || "0") ?? 0;
  const est = estimateGross(reg, ot, rate.hourly, rate.bp);

  return (
    <ActionForm action={overtimeShiftAction} className="space-y-4" onSuccess={() => { router.refresh(); dialog.close(); }}>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Shift date" className="col-span-2"><input className="input" type="date" name="date" value={s.date} onChange={(e) => set("date", e.target.value)} required /></Field>
        <Field label="Start"><input className="input" type="time" name="startTime" value={s.startTime} onChange={(e) => set("startTime", e.target.value)} required /></Field>
        <Field label="End" hint="Earlier than start = ends next day"><input className="input" type="time" name="endTime" value={s.endTime} onChange={(e) => set("endTime", e.target.value)} required /></Field>
        <Field label="Unpaid breaks (min)"><input className="input" type="number" name="breakMinutes" min={0} max={600} value={s.breakMinutes} onChange={(e) => set("breakMinutes", e.target.value)} /></Field>
        <div className="flex items-end pb-2 text-sm text-mute-300">Worked: <span className="ml-1 font-semibold text-white">{formatHours(worked)}</span></div>
      </div>
      <div className="rounded-xl border border-ink-700 p-3">
        <p className="mb-2 text-xs text-mute-400">Split the hours the way payroll will pay them. Not every extra hour is time-and-a-half — enter only the hours that qualify for the overtime rate.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hours at regular rate"><input className="input" name="regularHours" inputMode="decimal" value={s.regularHours} onChange={(e) => set("regularHours", e.target.value)} /></Field>
          <Field label={`Hours at ${(rate.bp / 10000).toFixed(2).replace(/0$/, "")}× rate`}><input className="input" name="overtimeHours" inputMode="decimal" value={s.overtimeHours} onChange={(e) => set("overtimeHours", e.target.value)} /></Field>
        </div>
        {reg + ot !== worked && reg + ot > 0 && <p className="mt-2 text-xs text-warn">Rate hours ({formatHours(reg + ot)}) differ from worked time ({formatHours(worked)}). That can be correct — double-check.</p>}
        <p className="mt-2 text-sm">Estimated gross: <span className="font-semibold text-go num">{formatCents(est.totalCents)}</span> <span className="text-xs text-mute-400">before taxes & deductions — not take-home</span></p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expected payday">
          <select className="input" name="paydayId" value={s.paydayId} onChange={(e) => set("paydayId", e.target.value)}>
            <option value="">Not assigned yet</option>
            {paydays.map((p) => <option key={p.id} value={p.id}>{formatLocalDate(p.officialDate, "weekday")}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select className="input" name="status" value={s.status} onChange={(e) => set("status", e.target.value)}>
            {["WORKED", "SUBMITTED", "APPROVED", "EXPECTED", "RECEIVED", "DISPUTED"].map((x) => <option key={x} value={x}>{x === "DISPUTED" ? "Missing / disputed" : x[0] + x.slice(1).toLowerCase()}</option>)}
          </select>
        </Field>
        <Field label="Payroll period (optional)" className="col-span-2"><input className="input" name="payrollPeriod" value={s.payrollPeriod} onChange={(e) => set("payrollPeriod", e.target.value)} placeholder="e.g. Nov 14 – Nov 27" maxLength={60} /></Field>
      </div>
      <Field label="Notes (no confidential operational details)"><input className="input" name="notes" value={s.notes} onChange={(e) => set("notes", e.target.value)} maxLength={1000} /></Field>
      <div className="space-y-1 text-sm">
        <label className="flex min-h-[40px] items-center gap-3"><input type="checkbox" name="isActivation" checked={s.isActivation} onChange={(e) => set("isActivation", e.target.checked)} className="h-5 w-5 accent-[#2bea7a]" /> Special-team activation</label>
        {!v.id && <label className="flex min-h-[40px] items-center gap-3"><input type="checkbox" name="addToCalendar" defaultChecked className="h-5 w-5 accent-[#2bea7a]" /> Add to calendar</label>}
        {!v.id && isToday && <label className="flex min-h-[40px] items-center gap-3"><input type="checkbox" name="switchMode" className="h-5 w-5 accent-[#2bea7a]" /> Switch to Overtime mode now</label>}
        {v.id && <label className="flex min-h-[40px] items-center gap-3"><input type="checkbox" name="recalc" className="h-5 w-5 accent-[#2bea7a]" /> Recalculate with my current pay rate</label>}
      </div>
      <SubmitButton className="btn-primary w-full">{v.id ? "Save shift" : "Log shift"}</SubmitButton>
    </ActionForm>
  );
}
