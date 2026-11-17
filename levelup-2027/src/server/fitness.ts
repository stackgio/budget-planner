import "server-only";
import { prisma } from "./db";
import { audit } from "./audit";
import { UserError } from "./payroll";
import { isUniqueViolation } from "./idempotency";

export interface TemplateItemInput { exerciseId: string; sets: number; reps: string; weightNote: string | null; restSec: number | null }
export interface TemplateInput { name: string; notes: string | null; kind: "HOME" | "GYM" | "RECOVERY"; items: TemplateItemInput[] }

/**
 * Create or edit a workout template. Past workout logs are untouched: a log keeps its own title,
 * date and sets, so changing or archiving a template never rewrites history.
 */
export async function saveTemplate(ownerId: string, id: string | null, i: TemplateInput) {
  if (!i.name.trim()) throw new UserError("Name the workout.");
  if (!i.items.length) throw new UserError("Add at least one exercise.");
  if (i.items.length > 20) throw new UserError("Keep it to 20 exercises or fewer.");
  for (const it of i.items) {
    if (!Number.isInteger(it.sets) || it.sets < 1 || it.sets > 10) throw new UserError("Sets must be 1–10.");
    if (!it.reps.trim()) throw new UserError("Add reps or a time for each exercise.");
    if (it.restSec !== null && (!Number.isInteger(it.restSec) || it.restSec < 0 || it.restSec > 600)) throw new UserError("Rest must be 0–600 seconds.");
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const exIds = [...new Set(i.items.map((x) => x.exerciseId))];
      if ((await tx.exercise.count({ where: { ownerId, id: { in: exIds } } })) !== exIds.length) throw new UserError("Unknown exercise.");
      const data = { name: i.name.trim().slice(0, 80), notes: i.notes, kind: i.kind };
      let t;
      if (id) {
        const before = await tx.workoutTemplate.findFirst({ where: { id, ownerId }, include: { items: true } });
        if (!before) throw new UserError("Workout not found.");
        t = await tx.workoutTemplate.update({ where: { id }, data });
        await tx.workoutTemplateItem.deleteMany({ where: { templateId: id } });
        await audit(tx, ownerId, "WorkoutTemplate", id, "edit", { name: before.name, items: before.items.length }, { name: t.name, items: i.items.length });
      } else {
        t = await tx.workoutTemplate.create({ data: { ownerId, ...data } });
      }
      await tx.workoutTemplateItem.createMany({
        data: i.items.map((it, n) => ({ templateId: t.id, exerciseId: it.exerciseId, sets: it.sets, reps: it.reps.trim().slice(0, 30), weightNote: it.weightNote?.trim().slice(0, 60) || null, restSec: it.restSec, sortOrder: n })),
      });
      return t;
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new UserError("You already have a workout with that name.");
    throw e;
  }
}

export async function duplicateTemplate(ownerId: string, id: string) {
  const t = await prisma.workoutTemplate.findFirst({ where: { id, ownerId }, include: { items: { orderBy: { sortOrder: "asc" } } } });
  if (!t) throw new UserError("Workout not found.");
  const names = new Set((await prisma.workoutTemplate.findMany({ where: { ownerId }, select: { name: true } })).map((x) => x.name));
  let name = `${t.name} (copy)`;
  for (let n = 2; names.has(name); n++) name = `${t.name} (copy ${n})`;
  return saveTemplate(ownerId, null, { name, notes: t.notes, kind: t.kind as TemplateInput["kind"], items: t.items.map((i) => ({ exerciseId: i.exerciseId, sets: i.sets, reps: i.reps, weightNote: i.weightNote, restSec: i.restSec })) });
}

export async function setTemplateArchived(ownerId: string, id: string, archived: boolean) {
  const r = await prisma.workoutTemplate.updateMany({ where: { id, ownerId }, data: { archived } });
  if (!r.count) throw new UserError("Workout not found.");
}

export async function saveExercise(ownerId: string, id: string | null, i: { name: string; category: string; equipment: string; cues: string | null }) {
  if (!["UPPER", "LOWER", "CORE", "FULL", "CARDIO", "MOBILITY"].includes(i.category)) throw new UserError("Choose a category.");
  if (!["BODYWEIGHT", "DUMBBELL", "BAND", "MACHINE", "BARBELL", "OTHER"].includes(i.equipment)) throw new UserError("Choose equipment.");
  const data = { name: i.name.trim().slice(0, 60), category: i.category, equipment: i.equipment, cues: i.cues };
  if (!data.name) throw new UserError("Name the exercise.");
  try {
    if (id) {
      const r = await prisma.exercise.updateMany({ where: { id, ownerId }, data });
      if (!r.count) throw new UserError("Exercise not found.");
      return;
    }
    await prisma.exercise.create({ data: { ownerId, ...data } });
  } catch (e) {
    if (isUniqueViolation(e)) throw new UserError("You already have an exercise with that name.");
    throw e;
  }
}

/** Exercises are archived, never deleted — past logs still reference them. */
export async function setExerciseArchived(ownerId: string, id: string, archived: boolean) {
  const r = await prisma.exercise.updateMany({ where: { id, ownerId }, data: { archived } });
  if (!r.count) throw new UserError("Exercise not found.");
}
