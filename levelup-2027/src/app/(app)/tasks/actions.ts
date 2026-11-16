"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { createTask, deleteTask, finishTask, postponeTask, reopenTask, setTopThree, toggleHabit, updateTask } from "@/server/tasks";
import { prisma } from "@/server/db";
import { UserError } from "@/server/payroll";
import { run, type ActionState } from "@/ui/actions";
import { isLocalDate, isTime, todayLocal, weekday } from "@/domain/dates";
import { formatRRule } from "@/domain/recurrence";

const opt = (s: unknown) => (typeof s === "string" && s.trim() !== "" ? s.trim() : null);

const taskSchema = z.object({
  id: z.string().optional(),
  parentId: z.string().optional(),
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().max(4000).optional(),
  category: z.string().max(40).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  repeat: z.enum(["NONE", "DAILY", "WEEKLY", "MONTHLY"]).default("NONE"),
  reminderMin: z.string().optional(),
  optional: z.string().optional(),
  isTopThree: z.string().optional(),
});

export async function saveTaskAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const res = await run(async () => {
    const i = taskSchema.parse(Object.fromEntries(fd));
    const dueDate = opt(i.dueDate);
    const dueTime = opt(i.dueTime);
    if (dueDate && !isLocalDate(dueDate)) throw new UserError("Invalid due date.");
    if (dueTime && !isTime(dueTime)) throw new UserError("Invalid due time.");
    if (dueTime && !dueDate) throw new UserError("Add a due date to use a due time.");
    const rrule = i.repeat === "NONE" ? null : formatRRule({ freq: i.repeat, interval: 1, ...(i.repeat === "WEEKLY" && dueDate ? { byDay: [weekday(dueDate)] } : {}) });
    const data = {
      title: i.title, description: opt(i.description), category: opt(i.category), priority: i.priority,
      dueDate, dueTime, rrule, reminderMin: opt(i.reminderMin) ? Number(i.reminderMin) : null,
      optional: i.optional === "on", isTopThree: i.isTopThree === "on",
    };
    if (data.isTopThree && !i.id) {
      const n = await prisma.task.count({ where: { ownerId: user.id, isTopThree: true, status: "OPEN" } });
      if (n >= 3) throw new UserError("You already have three top priorities.");
    }
    if (i.id) await updateTask(user.id, i.id, data);
    else await createTask(user.id, { ...data, parentId: opt(i.parentId) });
    return i.id ? "Task updated." : "Task added.";
  });
  revalidatePath("/", "layout");
  return res;
}

export async function taskOpAction(fd: FormData) {
  const user = await requireUser();
  const id = z.string().min(1).parse(fd.get("id"));
  const op = z.enum(["done", "skip", "reopen", "postpone", "delete", "top", "untop"]).parse(fd.get("op"));
  const to = opt(fd.get("to"));
  if (op === "done") await finishTask(user.id, id, "DONE");
  if (op === "skip") await finishTask(user.id, id, "SKIPPED");
  if (op === "reopen") await reopenTask(user.id, id);
  if (op === "postpone") await postponeTask(user.id, id, to && isLocalDate(to) ? to : null, todayLocal(user.timezone));
  if (op === "delete") await deleteTask(user.id, id);
  if (op === "top" || op === "untop") {
    try { await setTopThree(user.id, id, op === "top"); } catch (e) { if (!(e instanceof UserError)) throw e; }
  }
  revalidatePath("/", "layout");
}

export async function toggleHabitAction(fd: FormData) {
  const user = await requireUser();
  const habitId = z.string().min(1).parse(fd.get("habitId"));
  const date = z.string().refine(isLocalDate).parse(fd.get("date"));
  if (date > todayLocal(user.timezone)) return; // can't check in for the future
  await toggleHabit(user.id, habitId, date);
  revalidatePath("/", "layout");
}

export async function habitAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const res = await run(async () => {
    const op = z.enum(["add", "archive", "restore"]).parse(fd.get("op"));
    if (op === "add") {
      const name = z.string().trim().min(1).max(40).parse(fd.get("name"));
      const target = z.coerce.number().int().min(1).max(7).parse(fd.get("targetPerWeek") ?? 7);
      const exists = await prisma.habit.findUnique({ where: { ownerId_name: { ownerId: user.id, name } } });
      if (exists) throw new UserError("You already track a habit with that name.");
      await prisma.habit.create({ data: { ownerId: user.id, name, targetPerWeek: target, sortOrder: 100 } });
      return "Habit added.";
    }
    const id = z.string().parse(fd.get("id"));
    await prisma.habit.updateMany({ where: { id, ownerId: user.id }, data: { archived: op === "archive" } });
  });
  revalidatePath("/", "layout");
  return res;
}
