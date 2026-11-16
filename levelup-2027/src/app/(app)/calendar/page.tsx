import { appContext } from "@/server/context";
import { loadOccurrences } from "@/server/calendar";
import { prisma } from "@/server/db";
import { ensurePaydays } from "@/server/payroll";
import { type LocalDate, addDays, dateToLocal, isLocalDate, makeLocalDate, parseLocalDate, daysInMonth, diffDays, startOfWeek, zonedToInstant } from "@/domain/dates";
import { extraPaycheckMonths } from "@/domain/payroll";
import { StripParam } from "@/ui/StripParam";
import { CalendarView, type CalView, type SerializedOcc, type SeriesMeta } from "./CalendarView";

const VIEWS: CalView[] = ["month", "week", "day", "agenda"];

export default async function CalendarPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { user, tz, today } = await appContext();
  const sp = await searchParams;
  const view: CalView = VIEWS.includes(sp.view as CalView) ? (sp.view as CalView) : "month";
  const anchor: LocalDate = sp.date && isLocalDate(sp.date) ? sp.date : today;

  let from: LocalDate, days: number;
  if (view === "month") {
    const { y, m } = parseLocalDate(anchor);
    from = startOfWeek(makeLocalDate(y, m, 1));
    days = diffDays(addDays(startOfWeek(makeLocalDate(y, m, daysInMonth(y, m))), 7), from);
  } else if (view === "week") {
    from = startOfWeek(anchor);
    days = 7;
  } else if (view === "day") {
    from = anchor;
    days = 1;
  } else {
    from = anchor;
    days = 31;
  }
  await ensurePaydays(user.id);
  const to = addDays(from, days);
  const occ = await loadOccurrences(user.id, tz, zonedToInstant(from, "00:00", tz), zonedToInstant(to, "00:00", tz));

  const ids = [...new Set(occ.filter((o) => !o.readOnly).map((o) => o.eventId))];
  const series = await prisma.calendarEvent.findMany({ where: { ownerId: user.id, id: { in: ids } } });
  const meta: Record<string, SeriesMeta> = Object.fromEntries(
    series.map((s) => [s.id, { rrule: s.rrule, location: s.location, reminderMin: s.reminderMin, seriesStart: s.startAt.toISOString(), generated: s.sourceType }]),
  );

  const regular = await prisma.payday.findMany({ where: { ownerId: user.id, kind: "REGULAR" }, select: { officialDate: true } });
  const extraMonths = extraPaycheckMonths(regular.map((r) => dateToLocal(r.officialDate))).map((m) => m.month);
  const regSchedule = await prisma.paySchedule.findUnique({ where: { ownerId_kind: { ownerId: user.id, kind: "REGULAR" } } });

  const serialized: SerializedOcc[] = occ.map((o) => ({ ...o, start: o.start.toISOString(), end: o.end.toISOString(), originalStart: o.originalStart.toISOString() }));
  return (
    <>
    {sp.new === "1" && <StripParam name="new" />}
    <CalendarView
      view={view}
      anchor={anchor}
      from={from}
      days={days}
      today={today}
      tz={tz}
      occurrences={serialized}
      meta={meta}
      extraMonths={extraMonths}
      payrollVerified={!!regSchedule?.anchorVerified}
      openNew={sp.new === "1"}
    />
    </>
  );
}
