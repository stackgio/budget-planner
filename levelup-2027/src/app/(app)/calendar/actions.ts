"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { createEvent, deleteEvent, inputToInstants, loadOccurrences, updateEvent, type EventInput } from "@/server/calendar";
import { findConflicts } from "@/domain/calendar";
import { isLocalDate, isTime, addDays, zonedToInstant, formatInstantTime } from "@/domain/dates";
import { parseRRule } from "@/domain/recurrence";
import { run, type ActionState } from "@/ui/actions";

const CATS = ["DOC_SHIFT", "OVERTIME_SHIFT", "ACTIVATION", "APPOINTMENT", "WORKOUT", "STUDY", "GIG", "DATE_NIGHT", "CHURCH", "CONTENT", "FINANCIAL", "PERSONAL", "OTHER"] as const;
const date = z.string().refine(isLocalDate, "Invalid date.");
const time = z.string().refine(isTime, "Invalid time.");

const eventSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(120),
  description: z.string().max(2000).nullable(),
  location: z.string().max(200).nullable(),
  category: z.enum(CATS),
  date, endDate: date, startTime: time, endTime: time,
  allDay: z.boolean(),
  rrule: z.string().max(200).nullable().refine((r) => { if (!r) return true; try { parseRRule(r); return true; } catch { return false; } }, "Invalid repeat rule."),
  reminderMin: z.number().int().min(0).max(40320).nullable(),
  important: z.boolean(),
  optional: z.boolean(),
});

const saveSchema = z.object({
  id: z.string().optional(),
  originalStart: z.string().datetime().nullable().optional(),
  scope: z.enum(["single", "following", "all"]).default("single"),
  event: eventSchema,
});

export type SavePayload = z.input<typeof saveSchema>;

export async function saveEventAction(payload: SavePayload): Promise<ActionState> {
  const user = await requireUser();
  const res = await run(async () => {
    const p = saveSchema.parse(payload);
    const ev = p.event as EventInput;
    if (p.id) await updateEvent(user.id, user.timezone, p.id, p.originalStart ?? null, p.scope, ev);
    else await createEvent(user.id, user.timezone, ev);
    return p.id ? "Saved." : "Event added.";
  });
  revalidatePath("/", "layout");
  return res;
}

export async function deleteEventAction(payload: { id: string; originalStart: string | null; scope: "single" | "following" | "all" }): Promise<ActionState> {
  const user = await requireUser();
  const res = await run(async () => {
    const p = z.object({ id: z.string().min(1), originalStart: z.string().datetime().nullable(), scope: z.enum(["single", "following", "all"]) }).parse(payload);
    await deleteEvent(user.id, p.id, p.originalStart, p.scope);
    return "Deleted.";
  });
  revalidatePath("/", "layout");
  return res;
}

export async function checkConflictsAction(payload: { event: z.input<typeof eventSchema>; ignoreEventId?: string; ignoreKey?: string }) {
  const user = await requireUser();
  try {
    const ev = eventSchema.parse(payload.event) as EventInput;
    if (ev.allDay) return [];
    const { startAt, endAt } = inputToInstants(ev, user.timezone);
    const occ = await loadOccurrences(user.id, user.timezone, zonedToInstant(addDays(ev.date, -1), "00:00", user.timezone), zonedToInstant(addDays(ev.endDate, 2), "00:00", user.timezone), { includePaydays: false, includeTasks: false });
    return findConflicts({ start: startAt, end: endAt }, occ.filter((o) => o.key !== payload.ignoreKey && (ev.rrule ? o.eventId !== payload.ignoreEventId : true)))
      .map((o) => `${o.title} · ${formatInstantTime(o.start, user.timezone)}–${formatInstantTime(o.end, user.timezone)}`);
  } catch {
    return [];
  }
}
