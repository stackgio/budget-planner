/** Task views and recurrence. Pure. */
import { type LocalDate, addDays, startOfWeek } from "./dates";
import { parseRRule, ruleDates } from "./recurrence";

export type TaskView = "today" | "tomorrow" | "week" | "upcoming" | "overdue" | "completed" | "all";

export const TASK_VIEWS: { id: TaskView; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "week", label: "This Week" },
  { id: "upcoming", label: "Upcoming" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

export interface TaskLike {
  status: "OPEN" | "DONE" | "SKIPPED";
  dueDate: LocalDate | null;
}

export function inView<T extends TaskLike>(t: T, view: TaskView, today: LocalDate): boolean {
  const open = t.status === "OPEN";
  switch (view) {
    case "today":
      return open && t.dueDate !== null && t.dueDate <= today; // includes overdue so nothing is hidden
    case "tomorrow":
      return open && t.dueDate === addDays(today, 1);
    case "week": {
      const end = addDays(startOfWeek(today, 6), 6); // week runs Sat→Fri, matching the DOC rotation
      return open && t.dueDate !== null && t.dueDate >= today && t.dueDate <= end;
    }
    case "upcoming":
      return open && t.dueDate !== null && t.dueDate > today;
    case "overdue":
      return open && t.dueDate !== null && t.dueDate < today;
    case "completed":
      return t.status !== "OPEN";
    case "all":
      return true;
  }
}

/** Next due date for a recurring task after `after` (exclusive). */
export function nextDueDate(rrule: string, dtStart: LocalDate, after: LocalDate): LocalDate | null {
  const rule = parseRRule(rrule);
  for (const d of ruleDates(rule, dtStart, addDays(after, 800))) {
    if (d > after) return d;
  }
  return null;
}

export const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
