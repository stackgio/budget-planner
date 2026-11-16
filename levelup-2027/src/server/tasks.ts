import "server-only";
import type { Priority } from "@prisma/client";
import { prisma } from "./db";
import { UserError } from "./payroll";
import { type LocalDate, addDays, dateToLocal, localToDbDate } from "@/domain/dates";
import { nextDueDate } from "@/domain/tasks";
import { parseRRule } from "@/domain/recurrence";

export interface TaskInput {
  title: string;
  description: string | null;
  category: string | null;
  priority: Priority;
  dueDate: LocalDate | null;
  dueTime: string | null;
  rrule: string | null;
  reminderMin: number | null;
  optional: boolean;
  isTopThree: boolean;
  parentId: string | null;
}

async function owned(ownerId: string, id: string) {
  const t = await prisma.task.findFirst({ where: { id, ownerId } });
  if (!t) throw new UserError("Task not found.");
  return t;
}

function validate(i: Omit<TaskInput, "parentId">) {
  if (i.rrule) {
    parseRRule(i.rrule);
    if (!i.dueDate) throw new UserError("A repeating task needs a due date.");
  }
}

export async function createTask(ownerId: string, i: TaskInput) {
  validate(i);
  if (i.parentId) await owned(ownerId, i.parentId);
  return prisma.task.create({ data: { ownerId, ...i, dueDate: i.dueDate ? localToDbDate(i.dueDate) : null } });
}

export async function updateTask(ownerId: string, id: string, i: Omit<TaskInput, "parentId">) {
  validate(i);
  await owned(ownerId, id);
  return prisma.task.update({ where: { id }, data: { ...i, dueDate: i.dueDate ? localToDbDate(i.dueDate) : null } });
}

/** Complete (or skip). A repeating task spawns its next occurrence; the finished one stays in history. */
export async function finishTask(ownerId: string, id: string, status: "DONE" | "SKIPPED") {
  return prisma.$transaction(async (tx) => {
    const t = await tx.task.findFirst({ where: { id, ownerId }, include: { subtasks: true } });
    if (!t) throw new UserError("Task not found.");
    if (t.status !== "OPEN") return;
    await tx.task.update({ where: { id }, data: { status, completedAt: new Date() } });
    if (t.rrule && t.dueDate) {
      const next = nextDueDate(t.rrule, dateToLocal(t.dueDate), dateToLocal(t.dueDate));
      if (next) {
        const copy = await tx.task.create({
          data: {
            ownerId, title: t.title, description: t.description, category: t.category, priority: t.priority,
            dueDate: localToDbDate(next), dueTime: t.dueTime, rrule: t.rrule, reminderMin: t.reminderMin,
            optional: t.optional, isTopThree: false,
          },
        });
        for (const s of t.subtasks) {
          await tx.task.create({ data: { ownerId, parentId: copy.id, title: s.title, priority: s.priority } });
        }
      }
    }
  });
}

export async function reopenTask(ownerId: string, id: string) {
  await owned(ownerId, id);
  return prisma.task.update({ where: { id }, data: { status: "OPEN", completedAt: null } });
}

export async function postponeTask(ownerId: string, id: string, to: LocalDate | null, today: LocalDate) {
  const t = await owned(ownerId, id);
  const base = t.dueDate ? dateToLocal(t.dueDate) : today;
  const target = to ?? addDays(base < today ? today : base, 1);
  return prisma.task.update({ where: { id }, data: { dueDate: localToDbDate(target), isTopThree: false } });
}

export async function deleteTask(ownerId: string, id: string) {
  await owned(ownerId, id);
  await prisma.task.delete({ where: { id } });
}

export async function setTopThree(ownerId: string, id: string, on: boolean) {
  await owned(ownerId, id);
  if (on) {
    const n = await prisma.task.count({ where: { ownerId, isTopThree: true, status: "OPEN" } });
    if (n >= 3) throw new UserError("You already have three top priorities. Remove one first.");
  }
  return prisma.task.update({ where: { id }, data: { isTopThree: on } });
}

// ───────────── Habits ─────────────

export async function toggleHabit(ownerId: string, habitId: string, date: LocalDate) {
  const h = await prisma.habit.findFirst({ where: { id: habitId, ownerId } });
  if (!h) throw new UserError("Habit not found.");
  const where = { habitId_date: { habitId, date: localToDbDate(date) } };
  const existing = await prisma.habitCheckIn.findUnique({ where });
  if (existing) await prisma.habitCheckIn.delete({ where });
  else await prisma.habitCheckIn.create({ data: { habitId, date: localToDbDate(date) } }).catch(() => {});
}
