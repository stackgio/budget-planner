import "server-only";
import type { EventCategory, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { UserError } from "./payroll";
import { type Occurrence, occurrencesFor, type Category } from "@/domain/calendar";
import {
  type LocalDate,
  addDays,
  dateToLocal,
  diffDays,
  instantToLocalDate,
  instantToLocalTime,
  localToDbDate,
  zonedToInstant,
} from "@/domain/dates";
import { expandSeries, formatRRule, parseRRule, untilBefore } from "@/domain/recurrence";
import { formatCents } from "@/domain/money";

export interface LoadOptions {
  includePaydays?: boolean;
  includeTasks?: boolean;
}

/** All occurrences in [from, to): stored events + virtual paydays + dated tasks. */
export async function loadOccurrences(ownerId: string, tz: string, from: Date, to: Date, opts: LoadOptions = {}): Promise<Occurrence[]> {
  const { includePaydays = true, includeTasks = true } = opts;
  const pad = new Date(from.getTime() - 14 * 86_400_000);
  const events = await prisma.calendarEvent.findMany({
    where: { ownerId, startAt: { lt: new Date(to.getTime() + 14 * 86_400_000) }, OR: [{ rrule: { not: null } }, { endAt: { gt: pad } }] },
    include: { exceptions: true },
  });
  const out: Occurrence[] = [];
  for (const ev of events) out.push(...occurrencesFor({ ...ev, category: ev.category as Category }, from, to));

  const fromD = instantToLocalDate(from, tz);
  const toD = instantToLocalDate(to, tz);
  const allDay = (d: LocalDate) => ({ start: zonedToInstant(d, "00:00", tz), end: zonedToInstant(addDays(d, 1), "00:00", tz) });

  if (includePaydays) {
    const paydays = await prisma.payday.findMany({
      where: { ownerId, officialDate: { gte: localToDbDate(fromD), lte: localToDbDate(toD) } },
      include: { deposit: true },
    });
    const regSchedule = await prisma.paySchedule.findUnique({ where: { ownerId_kind: { ownerId, kind: "REGULAR" } } });
    for (const p of paydays) {
      const d = dateToLocal(p.officialDate);
      const r = p.kind === "REGULAR";
      const provisional = r && !regSchedule?.anchorVerified;
      const status = p.deposit
        ? `Received ${formatCents(p.deposit.netCents)} on ${dateToLocal(p.deposit.actualDepositDate)}`
        : p.status === "ZERO" ? "Confirmed $0" : `Expected deposit ${dateToLocal(p.manualDepositDate ?? p.expectedDepositDate)} (estimate)`;
      out.push({
        key: `payday|${p.id}`,
        eventId: `payday:${p.id}`,
        originalStart: allDay(d).start,
        ...allDay(d),
        title: `${r ? "Regular payday" : "Overtime payday"}${provisional ? " (provisional)" : ""}`,
        description: [status, p.holidayNote].filter(Boolean).join(" · "),
        category: r ? "PAYDAY_REGULAR" : "PAYDAY_OVERTIME",
        allDay: true,
        recurring: false,
        modified: false,
        important: false,
        optional: false,
        readOnly: true,
        href: r ? "/money/payroll" : "/money/overtime",
      });
    }
  }

  if (includeTasks) {
    const tasks = await prisma.task.findMany({
      where: { ownerId, parentId: null, status: "OPEN", dueDate: { gte: localToDbDate(fromD), lte: localToDbDate(toD) } },
    });
    for (const t of tasks) {
      const d = dateToLocal(t.dueDate!);
      const timed = t.dueTime ? zonedToInstant(d, t.dueTime, tz) : null;
      out.push({
        key: `task|${t.id}`,
        eventId: `task:${t.id}`,
        originalStart: timed ?? allDay(d).start,
        start: timed ?? allDay(d).start,
        end: timed ? new Date(timed.getTime() + 30 * 60_000) : allDay(d).end,
        title: `☐ ${t.title}`,
        description: t.description,
        category: "TASK",
        allDay: !timed,
        recurring: !!t.rrule,
        modified: false,
        important: t.priority === "HIGH",
        optional: t.optional,
        readOnly: true,
        href: `/tasks?view=all&focus=${t.id}`,
      });
    }
  }
  return out.sort((a, b) => a.start.getTime() - b.start.getTime() || Number(b.allDay) - Number(a.allDay));
}

// ───────────── Mutations ─────────────

export interface EventInput {
  title: string;
  description: string | null;
  location: string | null;
  category: EventCategory;
  date: LocalDate;
  endDate: LocalDate;
  startTime: string;
  endTime: string;
  allDay: boolean;
  rrule: string | null;
  reminderMin: number | null;
  important: boolean;
  optional: boolean;
}

export function inputToInstants(i: EventInput, tz: string) {
  if (i.allDay) {
    return { startAt: zonedToInstant(i.date, "00:00", tz), endAt: zonedToInstant(addDays(i.endDate, 1), "00:00", tz) };
  }
  const startAt = zonedToInstant(i.date, i.startTime, tz);
  const endAt = zonedToInstant(i.endDate, i.endTime, tz);
  if (endAt <= startAt) throw new UserError("End must be after start.");
  return { startAt, endAt };
}

export async function createEvent(ownerId: string, tz: string, i: EventInput) {
  const { startAt, endAt } = inputToInstants(i, tz);
  if (i.rrule) parseRRule(i.rrule);
  return prisma.calendarEvent.create({
    data: {
      ownerId, title: i.title, description: i.description, location: i.location, category: i.category,
      startAt, endAt, allDay: i.allDay, timezone: tz, rrule: i.rrule, reminderMin: i.reminderMin,
      important: i.important, optional: i.optional,
    },
  });
}

async function ownedEvent(ownerId: string, id: string, tx: Prisma.TransactionClient) {
  const ev = await tx.calendarEvent.findFirst({ where: { id, ownerId }, include: { exceptions: true } });
  if (!ev) throw new UserError("Event not found.");
  return ev;
}

/** Count occurrences strictly before `originalStart` (used to split COUNT-limited series). */
function countBefore(ev: { startAt: Date; endAt: Date; timezone: string; rrule: string | null }, originalStart: Date): number {
  return expandSeries(ev, ev.startAt, originalStart).filter((o) => o.start < originalStart).length;
}

/** End a series just before the given occurrence. Returns the remaining COUNT for the tail, if any. */
function truncatedRule(ev: { startAt: Date; endAt: Date; timezone: string; rrule: string | null }, originalStart: Date): { headRule: string; tailCount?: number } {
  const rule = parseRRule(ev.rrule!);
  if (rule.count) {
    const n = countBefore(ev, originalStart);
    return { headRule: formatRRule({ ...rule, count: n }), tailCount: rule.count - n };
  }
  return { headRule: formatRRule({ ...rule, until: untilBefore(instantToLocalDate(originalStart, ev.timezone)) }) };
}

export type Scope = "single" | "following" | "all";

export async function updateEvent(ownerId: string, tz: string, id: string, originalStartIso: string | null, scope: Scope, i: EventInput) {
  return prisma.$transaction(async (tx) => {
    const ev = await ownedEvent(ownerId, id, tx);
    const { startAt, endAt } = inputToInstants(i, ev.timezone || tz);
    if (i.rrule) parseRRule(i.rrule);
    const originalStart = originalStartIso ? new Date(originalStartIso) : ev.startAt;

    if (!ev.rrule || scope === "all" || (scope === "following" && originalStart.getTime() <= ev.startAt.getTime())) {
      if (!ev.rrule) {
        return tx.calendarEvent.update({ where: { id }, data: { ...fields(i), startAt, endAt, rrule: i.rrule } });
      }
      // Whole series: shift the series by the same day offset the user applied to this occurrence,
      // and re-key existing exceptions so they stay attached to the right days.
      const dayShift = diffDays(i.date, instantToLocalDate(originalStart, ev.timezone));
      const seriesDate = addDays(instantToLocalDate(ev.startAt, ev.timezone), dayShift);
      const newStart = i.allDay ? zonedToInstant(seriesDate, "00:00", ev.timezone) : zonedToInstant(seriesDate, i.startTime, ev.timezone);
      const newEnd = new Date(newStart.getTime() + (endAt.getTime() - startAt.getTime()));
      const time = instantToLocalTime(newStart, ev.timezone);
      if (newStart.getTime() !== ev.startAt.getTime()) {
        for (const ex of ev.exceptions) {
          const d = addDays(instantToLocalDate(ex.originalStart, ev.timezone), dayShift);
          await tx.eventException.update({ where: { id: ex.id }, data: { originalStart: zonedToInstant(d, time, ev.timezone) } });
        }
      }
      return tx.calendarEvent.update({ where: { id }, data: { ...fields(i), startAt: newStart, endAt: newEnd, rrule: i.rrule } });
    }

    if (scope === "single") {
      return tx.eventException.upsert({
        where: { eventId_originalStart: { eventId: id, originalStart } },
        create: { eventId: id, originalStart, startAt, endAt, title: i.title, description: i.description },
        update: { cancelled: false, startAt, endAt, title: i.title, description: i.description },
      });
    }

    // "This and following": end the old series, start a new one at this occurrence.
    const { headRule, tailCount } = truncatedRule(ev, originalStart);
    await tx.calendarEvent.update({ where: { id }, data: { rrule: headRule } });
    let tailRule = i.rrule;
    if (tailRule && tailCount !== undefined) tailRule = formatRRule({ ...parseRRule(tailRule), count: tailCount });
    const created = await tx.calendarEvent.create({
      data: { ownerId, ...fields(i), startAt, endAt, allDay: i.allDay, timezone: ev.timezone, rrule: tailRule },
    });
    // Move later exceptions to the new series (re-keyed to the new time of day).
    const dayShift = diffDays(i.date, instantToLocalDate(originalStart, ev.timezone));
    const time = instantToLocalTime(startAt, ev.timezone);
    for (const ex of ev.exceptions.filter((x) => x.originalStart >= originalStart)) {
      if (ex.originalStart.getTime() === originalStart.getTime()) {
        await tx.eventException.delete({ where: { id: ex.id } });
        continue;
      }
      const d = addDays(instantToLocalDate(ex.originalStart, ev.timezone), dayShift);
      await tx.eventException.update({
        where: { id: ex.id },
        data: { eventId: created.id, originalStart: zonedToInstant(d, time, ev.timezone) },
      });
    }
    return created;
  });
}

function fields(i: EventInput) {
  return {
    title: i.title, description: i.description, location: i.location, category: i.category,
    allDay: i.allDay, reminderMin: i.reminderMin, important: i.important, optional: i.optional,
  };
}

export async function deleteEvent(ownerId: string, id: string, originalStartIso: string | null, scope: Scope) {
  return prisma.$transaction(async (tx) => {
    const ev = await ownedEvent(ownerId, id, tx);
    const originalStart = originalStartIso ? new Date(originalStartIso) : ev.startAt;
    if (!ev.rrule || scope === "all" || (scope === "following" && originalStart <= ev.startAt)) {
      await tx.calendarEvent.delete({ where: { id } });
      return;
    }
    if (scope === "single") {
      await tx.eventException.upsert({
        where: { eventId_originalStart: { eventId: id, originalStart } },
        create: { eventId: id, originalStart, cancelled: true },
        update: { cancelled: true },
      });
      return;
    }
    const { headRule } = truncatedRule(ev, originalStart);
    await tx.calendarEvent.update({ where: { id }, data: { rrule: headRule } });
    await tx.eventException.deleteMany({ where: { eventId: id, originalStart: { gte: originalStart } } });
  });
}

/** Move one occurrence by N days (user-initiated "postpone"). The rest of a series is untouched. */
export async function shiftOccurrence(ownerId: string, id: string, originalStartIso: string, days: number) {
  return prisma.$transaction(async (tx) => {
    const ev = await ownedEvent(ownerId, id, tx);
    const originalStart = new Date(originalStartIso);
    const ex = ev.exceptions.find((x) => x.originalStart.getTime() === originalStart.getTime());
    const curStart = ex?.startAt ?? (ev.rrule ? originalStart : ev.startAt);
    const curEnd = ex?.endAt ?? new Date(curStart.getTime() + (ev.endAt.getTime() - ev.startAt.getTime()));
    const move = (d: Date) => zonedToInstant(addDays(instantToLocalDate(d, ev.timezone), days), instantToLocalTime(d, ev.timezone), ev.timezone);
    if (!ev.rrule) {
      await tx.calendarEvent.update({ where: { id }, data: { startAt: move(curStart), endAt: move(curEnd) } });
      return;
    }
    await tx.eventException.upsert({
      where: { eventId_originalStart: { eventId: id, originalStart } },
      create: { eventId: id, originalStart, startAt: move(curStart), endAt: move(curEnd) },
      update: { startAt: move(curStart), endAt: move(curEnd), cancelled: false },
    });
  });
}

export async function getEventForEdit(ownerId: string, id: string) {
  return prisma.calendarEvent.findFirst({ where: { id, ownerId } });
}
