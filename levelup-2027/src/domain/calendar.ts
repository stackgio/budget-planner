/** Calendar occurrence building: series expansion + per-occurrence exceptions + conflicts. Pure. */
import { expandSeries } from "./recurrence";

export type Category =
  | "DOC_SHIFT" | "OVERTIME_SHIFT" | "ACTIVATION" | "APPOINTMENT" | "WORKOUT" | "STUDY" | "GIG"
  | "DATE_NIGHT" | "CHURCH" | "CONTENT" | "FINANCIAL" | "PERSONAL" | "OTHER"
  // virtual (not stored as events)
  | "PAYDAY_REGULAR" | "PAYDAY_OVERTIME" | "TASK";

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  DOC_SHIFT: { label: "DOC shift", color: "#5B8DEF" },
  OVERTIME_SHIFT: { label: "Overtime", color: "#F5B53D" },
  ACTIVATION: { label: "Activation", color: "#FF6B6B" },
  APPOINTMENT: { label: "Appointment", color: "#B98CFF" },
  WORKOUT: { label: "Workout", color: "#2BEA7A" },
  STUDY: { label: "Study", color: "#4FD1C5" },
  GIG: { label: "Gig work", color: "#F59E6B" },
  DATE_NIGHT: { label: "Date night", color: "#FF7EB6" },
  CHURCH: { label: "Church / faith", color: "#E9D78C" },
  CONTENT: { label: "Content", color: "#7AA2FF" },
  FINANCIAL: { label: "Financial", color: "#2BEA7A" },
  PERSONAL: { label: "Personal", color: "#C9CED6" },
  OTHER: { label: "Other", color: "#8A9099" },
  PAYDAY_REGULAR: { label: "Regular payday", color: "#2BEA7A" },
  PAYDAY_OVERTIME: { label: "Overtime payday", color: "#9BE15D" },
  TASK: { label: "Task", color: "#9AA0A8" },
};

export const EDITABLE_CATEGORIES = Object.keys(CATEGORY_META).filter(
  (c) => !c.startsWith("PAYDAY") && c !== "TASK",
) as Category[];

export interface SeriesInput {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  timezone: string;
  rrule: string | null;
  important: boolean;
  optional: boolean;
  exceptions: {
    originalStart: Date;
    cancelled: boolean;
    startAt: Date | null;
    endAt: Date | null;
    title: string | null;
    description: string | null;
  }[];
}

export interface Occurrence {
  key: string; // stable: `${eventId}|${originalStartISO}`
  eventId: string;
  originalStart: Date;
  start: Date;
  end: Date;
  title: string;
  description: string | null;
  category: Category;
  allDay: boolean;
  recurring: boolean;
  modified: boolean;
  important: boolean;
  optional: boolean;
  readOnly?: boolean;
  href?: string;
}

export function occurrenceKey(eventId: string, originalStart: Date): string {
  return `${eventId}|${originalStart.toISOString()}`;
}

/** Expand one stored event (series or single) into concrete occurrences in [from, to). */
export function occurrencesFor(ev: SeriesInput, from: Date, to: Date): Occurrence[] {
  const exByStart = new Map(ev.exceptions.map((e) => [e.originalStart.getTime(), e]));
  // Search a wider window so occurrences moved INTO the range by an exception are found.
  const pad = 14 * 86_400_000;
  const base = expandSeries(
    { startAt: ev.startAt, endAt: ev.endAt, timezone: ev.timezone, rrule: ev.rrule },
    new Date(from.getTime() - pad),
    new Date(to.getTime() + pad),
  );
  const out: Occurrence[] = [];
  for (const { start, end } of base) {
    const ex = exByStart.get(start.getTime());
    if (ex?.cancelled) continue;
    const s = ex?.startAt ?? start;
    const e = ex?.endAt ?? end;
    if (!(s < to && (e > from || (s.getTime() === e.getTime() && s >= from)))) continue;
    out.push({
      key: occurrenceKey(ev.id, start),
      eventId: ev.id,
      originalStart: start,
      start: s,
      end: e,
      title: ex?.title ?? ev.title,
      description: ex?.description ?? ev.description,
      category: ev.category,
      allDay: ev.allDay,
      recurring: !!ev.rrule,
      modified: !!ex,
      important: ev.important,
      optional: ev.optional,
    });
  }
  return out;
}

export function overlaps(a: { start: Date; end: Date }, b: { start: Date; end: Date }): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Timed (non-all-day, non-virtual) occurrences that overlap the window, excluding `ignoreEventId`. */
export function findConflicts(
  window: { start: Date; end: Date },
  occurrences: Occurrence[],
  ignoreEventId?: string,
): Occurrence[] {
  return occurrences
    .filter((o) => !o.allDay && !o.readOnly && o.end.getTime() - o.start.getTime() >= 60_000 && o.eventId !== ignoreEventId && overlaps(window, o))
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}
