import "server-only";
import { prisma } from "./db";
import { type LocalDate, addDays, dateToLocal, localToDbDate } from "@/domain/dates";
import { PRIORITY_RANK } from "@/domain/tasks";
import type { TaskRow } from "@/app/(app)/tasks/TaskList";

export async function loadTasks(ownerId: string): Promise<TaskRow[]> {
  const rows = await prisma.task.findMany({
    where: { ownerId, parentId: null },
    include: { subtasks: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ createdAt: "asc" }],
  });
  return rows
    .map((t) => ({
      id: t.id, title: t.title, description: t.description, category: t.category, priority: t.priority,
      dueDate: t.dueDate ? dateToLocal(t.dueDate) : null, dueTime: t.dueTime, rrule: t.rrule, reminderMin: t.reminderMin,
      optional: t.optional, isTopThree: t.isTopThree, status: t.status,
      subtasks: t.subtasks.map((s) => ({ id: s.id, title: s.title, status: s.status })),
    }))
    .sort((a, b) =>
      Number(b.isTopThree) - Number(a.isTopThree) ||
      (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
      (a.dueTime ?? "99").localeCompare(b.dueTime ?? "99") ||
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
    );
}

export interface HabitRow { id: string; name: string; emoji: string | null; targetPerWeek: number; optional: boolean; archived: boolean; done: Set<LocalDate> }

export async function loadHabits(ownerId: string, today: LocalDate, days = 7): Promise<HabitRow[]> {
  const since = addDays(today, -(days - 1));
  const habits = await prisma.habit.findMany({
    where: { ownerId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { checkIns: { where: { date: { gte: localToDbDate(since), lte: localToDbDate(today) } } } },
  });
  return habits.map((h) => ({ id: h.id, name: h.name, emoji: h.emoji, targetPerWeek: h.targetPerWeek, optional: h.optional, archived: h.archived, done: new Set(h.checkIns.map((c) => dateToLocal(c.date))) }));
}
