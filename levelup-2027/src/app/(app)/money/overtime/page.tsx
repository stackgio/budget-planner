import { Plus } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { currentPayRate } from "@/server/payroll";
import { loadPayroll } from "@/server/money-queries";
import { loadOccurrences } from "@/server/calendar";
import { addDays, dateToLocal, formatLocalDate, formatInstantTime, instantToLocalTime, startOfWeek, zonedToInstant } from "@/domain/dates";
import { formatCents, formatHours, overtimeRateCents, workedHoursX100 } from "@/domain/money";
import { PageHeader, Section, Stat, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { PaydayRow } from "../PaydayRow";
import { StripParam } from "@/ui/StripParam";
import { ScheduleCard } from "../ScheduleCard";
import { ShiftForm } from "./ShiftForm";
import { deleteOvertimeShiftAction, payRateAction } from "../actions";

export default async function OvertimePage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const { user, tz, today } = await appContext();
  const sp = await searchParams;
  const rate = await currentPayRate(user.id);
  const { schedule, paydays } = await loadPayroll(user.id, "OVERTIME");
  const shifts = await prisma.overtimeShift.findMany({ where: { ownerId: user.id }, orderBy: { date: "desc" }, include: { payday: true } });
  const deposits = paydays.filter((p) => p.deposit);

  const weekStart = startOfWeek(today, 6); // Sat → Fri, matching the DOC rotation
  const monthStart = today.slice(0, 7) + "-01";
  const yearStart = today.slice(0, 4) + "-01-01";
  const sumShifts = (from: string) => {
    const s = shifts.filter((x) => dateToLocal(x.date) >= from && dateToLocal(x.date) <= today);
    return { ot: s.reduce((a, x) => a + x.overtimeHoursX100, 0), reg: s.reduce((a, x) => a + x.regularHoursX100, 0), gross: s.reduce((a, x) => a + x.estimatedGrossCents, 0) };
  };
  const netSince = (from: string) => deposits.filter((p) => p.deposit!.actualDepositDate >= from && p.deposit!.actualDepositDate <= today).reduce((a, p) => a + p.deposit!.netCents, 0);

  // Scheduled DOC hours come from the calendar (exceptions included).
  const docOcc = (await loadOccurrences(user.id, tz, zonedToInstant(yearStart, "00:00", tz), zonedToInstant(addDays(today, 1), "00:00", tz), { includePaydays: false, includeTasks: false }))
    .filter((o) => o.category === "DOC_SHIFT");
  const docHours = (from: string) => docOcc.filter((o) => o.start >= zonedToInstant(from, "00:00", tz)).reduce((a, o) => a + workedHoursX100(o.start, o.end, 0), 0);

  const periods = [
    { label: "This week (Sat–Fri)", from: weekStart },
    { label: "This month", from: monthStart },
    { label: `Year ${today.slice(0, 4)}`, from: yearStart },
  ];
  const otPaydays = paydays.filter((p) => p.officialDate >= addDays(today, -28)).slice(0, 12).map((p) => ({ id: p.id, officialDate: p.officialDate }));
  const needs = paydays.filter((p) => !p.deposit && p.status === "EXPECTED" && p.officialDate <= today && p.officialDate >= "2026-11-01");
  const upcoming = paydays.filter((p) => p.officialDate > today).slice(0, 6);
  const rateInfo = rate ? { hourly: rate.regularHourlyCents, bp: rate.overtimeMultiplierBp } : { hourly: 0, bp: 15000 };
  const blank = { date: today, startTime: "16:00", endTime: "00:00", breakMinutes: 0, regularHours: "0", overtimeHours: "8", isActivation: false, payrollPeriod: "", paydayId: upcoming[0]?.id ?? "", status: "WORKED", notes: "" };

  return (
    <div className="space-y-4">
      {sp.new === "1" && <StripParam name="new" />}
      <PageHeader eyebrow="Money" title="Overtime Payroll">
        {rate && (
          <Dialog title="Log overtime shift" trigger={<><Plus size={16} /> Log overtime</>} triggerClassName="btn-primary" open={sp.new === "1"}>
            <ShiftForm v={blank} paydays={otPaydays} rate={rateInfo} tz={tz} isToday />
          </Dialog>
        )}
      </PageHeader>

      <section className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Pay rate</p>
            {rate ? (
              <>
                <p className="mt-1 text-lg font-semibold num">{formatCents(rate.regularHourlyCents)}/h regular · {(rate.overtimeMultiplierBp / 10000).toString()}× = <span className="text-go">{formatCents(overtimeRateCents(rate.regularHourlyCents, rate.overtimeMultiplierBp))}/h</span></p>
                <p className="text-xs text-mute-400">Effective {formatLocalDate(dateToLocal(rate.effectiveFrom))}. Used for gross estimates only — never take-home.</p>
              </>
            ) : <p className="mt-1 text-sm text-warn">No pay rate set.</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            {rate?.provisional && <span className="chip-warn">Provisional multiplier</span>}
            <Dialog title="Edit pay rate" trigger="Edit rate" triggerClassName="btn-secondary btn-sm">
              <ActionForm action={payRateAction} className="space-y-4">
                <Field label="Regular hourly rate"><input className="input" name="hourly" inputMode="decimal" defaultValue={rate ? (rate.regularHourlyCents / 100).toFixed(2) : ""} required /></Field>
                <Field label="Overtime multiplier"><input className="input" name="multiplier" inputMode="decimal" defaultValue={rate ? String(rate.overtimeMultiplierBp / 10000) : "1.5"} required /></Field>
                <Field label="Effective from"><input className="input" type="date" name="effectiveFrom" defaultValue={today} required /></Field>
                <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" name="provisional" defaultChecked={rate?.provisional ?? true} className="h-5 w-5 accent-[#2bea7a]" /> Still provisional</label>
                <SubmitButton className="btn-primary w-full">Save rate</SubmitButton>
              </ActionForm>
            </Dialog>
          </div>
        </div>
      </section>

      <section className="card">
        <p className="eyebrow mb-3">Hours & earnings</p>
        <div className="space-y-4">
          {periods.map((p) => {
            const s = sumShifts(p.from);
            return (
              <div key={p.label}>
                <p className="mb-2 text-sm font-semibold">{p.label}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Stat label="DOC scheduled" value={formatHours(docHours(p.from))} tone="mute" />
                  <Stat label="Extra @ regular" value={formatHours(s.reg)} tone="mute" />
                  <Stat label="Overtime hours" value={formatHours(s.ot)} />
                  <Stat label="Est. gross" value={formatCents(s.gross)} sub="before taxes" />
                  <Stat label="Confirmed net OT" value={formatCents(netSince(p.from))} tone="go" sub="deposits you confirmed" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {needs.length > 0 && (
        <Section title="Overtime paydays to confirm">
          <p className="mb-2 text-xs text-mute-400">An overtime payday does not mean overtime was earned. Record what arrived, or mark $0.</p>
          <ul className="divide-line">{needs.map((p) => <PaydayRow key={p.id} p={p} today={today} provisional={false} />)}</ul>
        </Section>
      )}

      <Section title="Logged shifts">
        {shifts.length ? (
          <ul className="divide-line">
            {shifts.map((s) => {
              const d = dateToLocal(s.date);
              return (
                <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-semibold">{formatLocalDate(d, "weekday")} · {formatInstantTime(s.startAt, tz)}–{formatInstantTime(s.endAt, tz)} {s.isActivation && <span className="chip-bad ml-1">activation</span>}</p>
                    <p className="text-xs text-mute-400 num">
                      {formatHours(s.overtimeHoursX100)} OT{s.regularHoursX100 ? ` + ${formatHours(s.regularHoursX100)} regular` : ""} · est. gross {formatCents(s.estimatedGrossCents)} · {s.status === "DISPUTED" ? "missing/disputed" : s.status.toLowerCase()}
                      {s.payday ? ` · payday ${formatLocalDate(dateToLocal(s.payday.officialDate), "weekday")}` : " · payday not assigned"}
                    </p>
                    {s.notes && <p className="text-xs text-mute-300">{s.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Dialog title="Edit shift" trigger="Edit" triggerClassName="btn-ghost btn-sm">
                      <ShiftForm tz={tz} rate={{ hourly: s.rateHourlyCents, bp: s.rateMultiplierBp }} paydays={otPaydays.some((p) => p.id === s.paydayId) || !s.payday ? otPaydays : [{ id: s.payday.id, officialDate: dateToLocal(s.payday.officialDate) }, ...otPaydays]}
                        v={{ id: s.id, date: d, startTime: instantToLocalTime(s.startAt, tz), endTime: instantToLocalTime(s.endAt, tz), breakMinutes: s.breakMinutes, regularHours: String(s.regularHoursX100 / 100), overtimeHours: String(s.overtimeHoursX100 / 100), isActivation: s.isActivation, payrollPeriod: s.payrollPeriod ?? "", paydayId: s.paydayId ?? "", status: s.status, notes: s.notes ?? "" }} />
                    </Dialog>
                    <Dialog title="Delete shift?" trigger="Delete" triggerClassName="btn-ghost btn-sm hover:text-bad">
                      <ActionForm action={deleteOvertimeShiftAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <p className="mb-4 text-sm text-mute-300">This also removes its calendar block. The audit log keeps a copy.</p>
                        <SubmitButton className="btn-danger w-full">Delete shift</SubmitButton>
                      </ActionForm>
                    </Dialog>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : <Empty>No overtime logged yet.</Empty>}
      </Section>

      <ScheduleCard kind="OVERTIME" anchor={dateToLocal(schedule.anchorOfficialDate)} verified={schedule.anchorVerified} offset={schedule.earlyDepositOffsetDays} interval={schedule.intervalDays} />
      <Section title="Upcoming overtime paydays">
        <ul className="divide-line">{upcoming.map((p) => <PaydayRow key={p.id} p={p} today={today} provisional={false} />)}</ul>
      </Section>
      {deposits.length > 0 && (
        <Section title="Confirmed overtime deposits">
          <ul className="divide-line">{[...deposits].reverse().slice(0, 12).map((p) => <PaydayRow key={p.id} p={p} today={today} provisional={false} />)}</ul>
        </Section>
      )}
    </div>
  );
}
