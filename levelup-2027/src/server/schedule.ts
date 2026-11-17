import "server-only";
import type { EventCategory } from "@prisma/client";
import { prisma } from "./db";
import { audit } from "./audit";
import { UserError } from "./payroll";
import { loadOccurrences } from "./calendar";
import { currentMode } from "./modes";
import { findConflicts } from "@/domain/calendar";
import { type LocalDate, addDays, formatInstantTime, instantToLocalDate, zonedToInstant } from "@/domain/dates";
import { suggestSlots } from "@/domain/growth";
import { formatRRule } from "@/domain/recurrence";

export interface SessionRequest {
  title: string;
  category: EventCategory;
  date: LocalDate;
  time: string;
  durationMin: number;
  goalId?: string | null;
  workoutTemplateId?: string | null;
  weekdays?: number[] | null; // repeat weekly on these days
  optional?: boolean;
  description?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
}

export interface ScheduleCheck {
  conflicts: string[];
  suggestions: { date: LocalDate; time: string; label: string }[];
  modeNote: string | null;
}

/**
 * Check a proposed session against the calendar (DOC shifts, overtime, appointments…).
 * Returns conflicts and alternative slots. It never moves or cancels anything.
 */
export async function checkSession(ownerId: string, tz: string, r: SessionRequest): Promise<ScheduleCheck> {
  const start = zonedToInstant(r.date, r.time, tz);
  const end = new Date(start.getTime() + r.durationMin * 60_000);
  const occ = await loadOccurrences(ownerId, tz, zonedToInstant(addDays(r.date, -1), "00:00", tz), zonedToInstant(addDays(r.date, 8), "00:00", tz), { includePaydays: false, includeTasks: false });
  const conflicts = findConflicts({ start, end }, occ).map((o) => `${o.title} · ${formatInstantTime(o.start, tz)}–${formatInstantTime(o.end, tz)}`);
  const settings = await prisma.userSettings.findUnique({ where: { userId: ownerId } });
  const suggestions = conflicts.length
    ? suggestSlots({
        days: [r.date, addDays(r.date, 1), addDays(r.date, 2), addDays(r.date, 3), addDays(r.date, 4)],
        durationMin: r.durationMin,
        busy: occ.filter((o) => !o.allDay).map((o) => ({ start: o.start, end: o.end, title: o.title })),
        toInstant: (d, t) => zonedToInstant(d, t, tz),
        preferredTime: r.time,
        earliest: "07:00",
        latest: settings?.bedTime && settings.bedTime > "19:00" ? settings.bedTime.replace(/:\d\d$/, ":00") : "21:00",
      }).filter((s) => s.start > new Date()).map((s) => ({ date: instantToLocalDate(s.start, tz), time: formatTimeHHMM(s.start, tz), label: `${instantToLocalDate(s.start, tz)} ${formatInstantTime(s.start, tz)}` }))
    : [];
  const mode = await currentMode(ownerId);
  const modeNote = mode && mode.mode !== "NORMAL" && (r.optional ?? true) ? `You're in ${mode.mode.toLowerCase()} mode — consider keeping this light or scheduling it after you've rested.` : null;
  return { conflicts, suggestions, modeNote };
}

function formatTimeHHMM(d: Date, tz: string) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", hour: "2-digit", minute: "2-digit" }).formatToParts(d);
  return `${p.find((x) => x.type === "hour")!.value}:${p.find((x) => x.type === "minute")!.value}`;
}

/** Create the calendar event you approved. Conflicts are allowed only when you explicitly confirm. */
export async function createSession(ownerId: string, tz: string, r: SessionRequest, acceptConflicts: boolean) {
  if (!Number.isInteger(r.durationMin) || r.durationMin < 5 || r.durationMin > 600) throw new UserError("Duration must be 5–600 minutes.");
  const check = await checkSession(ownerId, tz, r);
  if (check.conflicts.length && !acceptConflicts) return { created: null, check };
  if (r.goalId && !(await prisma.goal.findFirst({ where: { id: r.goalId, ownerId } }))) throw new UserError("Goal not found.");
  if (r.workoutTemplateId && !(await prisma.workoutTemplate.findFirst({ where: { id: r.workoutTemplateId, ownerId } }))) throw new UserError("Workout not found.");
  const startAt = zonedToInstant(r.date, r.time, tz);
  const ev = await prisma.$transaction(async (tx) => {
    const e = await tx.calendarEvent.create({
      data: {
        ownerId, title: r.title, category: r.category, startAt, endAt: new Date(startAt.getTime() + r.durationMin * 60_000), timezone: tz,
        rrule: r.weekdays?.length ? formatRRule({ freq: "WEEKLY", interval: 1, byDay: [...r.weekdays].sort() }) : null,
        optional: r.optional ?? true, goalId: r.goalId ?? null, workoutTemplateId: r.workoutTemplateId ?? null, description: r.description ?? null,
        sourceType: r.sourceType ?? null, sourceId: r.sourceId ?? null,
      },
    });
    await audit(tx, ownerId, "CalendarEvent", e.id, check.conflicts.length ? "create-with-accepted-conflicts" : "create", undefined, { title: e.title, conflicts: check.conflicts });
    return e;
  });
  return { created: ev, check };
}
