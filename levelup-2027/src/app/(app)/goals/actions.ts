"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";
import { encrypt } from "@/server/crypto";
import { UserError } from "@/server/payroll";
import { addGoalProgress, addMilestone, createGoal, createValenciaChecklist, linkTaskToGoal, setGoalStatus, setMilestoneDone, updateGoal, type GoalInput } from "@/server/growth";
import { addBodyMetric, addFaithEntry, changeDate, completeDate, logWorkout, planDate, removeWorkoutLog, saveReminderPreference, updateAlphabetEntry } from "@/server/life";
import { COURSE_STATUSES, PROGRAM_STATUSES, logActivity, saveJob, upsertOwned } from "@/server/edu";
import { checkSession, createSession } from "@/server/schedule";
import { saveReview } from "@/server/reviews";
import { run, type ActionState } from "@/ui/actions";
import { isLocalDate, isTime, todayLocal } from "@/domain/dates";
import { parseDollarsToCents, parseHoursX100 } from "@/domain/money";

const done = () => revalidatePath("/", "layout");
const s = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => s(fd, k) || null;
const date = (fd: FormData, k: string, required = true) => {
  const v = s(fd, k);
  if (!v) { if (required) throw new UserError("Choose a date."); return null; }
  if (!isLocalDate(v)) throw new UserError("Enter a valid date.");
  return v;
};
const time = (fd: FormData, k: string) => { const v = s(fd, k); if (!v) return null; if (!isTime(v)) throw new UserError("Enter a valid time."); return v; };
const money = (fd: FormData, k: string) => { const v = s(fd, k); if (!v) return null; const c = parseDollarsToCents(v); if (c === null) throw new UserError("Amounts look like 45 or 45.50."); return c; };
const int = (fd: FormData, k: string, min: number, max: number) => { const v = s(fd, k); if (!v) return null; const n = Number(v); if (!Number.isInteger(n) || n < min || n > max) throw new UserError(`Enter a whole number from ${min} to ${max}.`); return n; };
const x100 = (fd: FormData, k: string) => { const v = s(fd, k); if (!v) return null; const n = parseHoursX100(v); if (n === null) throw new UserError("Enter a number like 12 or 12.5."); return n; };
const title = (fd: FormData, k = "title", max = 120) => { const v = s(fd, k); if (!v) throw new UserError("Add a title."); return v.slice(0, max); };

// ───────────── Goals ─────────────

const CATEGORIES = ["FINANCE", "FITNESS", "FAITH", "RELATIONSHIP", "EDUCATION", "CAREER", "COMMUNICATION", "READING", "LEARNING", "DISCIPLINE", "TIME_MANAGEMENT", "PROJECT", "PERSONAL"] as const;
const SOURCES = ["MANUAL", "MILESTONES", "TASKS", "HABIT", "CHALLENGE", "WORKOUTS", "ACTIVITY"] as const;

export async function saveGoalAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const i: GoalInput = {
      title: title(fd), description: opt(fd, "description"),
      category: z.enum(CATEGORIES).parse(fd.get("category")), horizon: z.enum(["YEAR", "QUARTER", "MONTH", "WEEK"]).parse(fd.get("horizon")),
      priority: z.enum(["LOW", "MEDIUM", "HIGH"]).parse(fd.get("priority") ?? "MEDIUM"),
      startDate: date(fd, "startDate")!, targetDate: date(fd, "targetDate", false), unit: opt(fd, "unit"), targetX100: x100(fd, "target"),
      source: z.enum(SOURCES).parse(fd.get("source") ?? "MANUAL"), challengeId: opt(fd, "challengeId"), habitId: opt(fd, "habitId"),
      activityKind: opt(fd, "activityKind"), notes: opt(fd, "notes"),
    };
    const id = opt(fd, "id");
    if (id) await updateGoal(user.id, id, i);
    else {
      const milestones = s(fd, "milestones").split("\n").map((m) => m.trim()).filter(Boolean).slice(0, 30).map((t) => ({ title: t.slice(0, 120), dueDate: null }));
      await createGoal(user.id, i, milestones);
    }
    return id ? "Goal updated." : "Goal created.";
  });
  done();
  return r;
}

export async function goalStatusAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => { await setGoalStatus(user.id, z.string().parse(fd.get("id")), z.enum(["NOT_STARTED", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"]).parse(fd.get("status"))); });
  done();
  return r;
}

export async function milestoneAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const op = z.enum(["add", "done", "undo"]).parse(fd.get("op"));
    if (op === "add") await addMilestone(user.id, z.string().parse(fd.get("goalId")), title(fd), date(fd, "dueDate", false));
    else await setMilestoneDone(user.id, z.string().parse(fd.get("id")), op === "done");
  });
  done();
  return r;
}

export async function goalProgressAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const v = x100(fd, "value");
    if (v === null) throw new UserError("Enter the current value.");
    await addGoalProgress(user.id, z.string().parse(fd.get("goalId")), v, date(fd, "date")!, opt(fd, "note"), s(fd, "idempotencyKey"));
    return "Progress recorded.";
  });
  done();
  return r;
}

export async function linkTaskAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => { await linkTaskToGoal(user.id, z.string().parse(fd.get("taskId")), opt(fd, "goalId")); });
  done();
  return r;
}

export async function valenciaChecklistAction(_p: ActionState, _fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    if (await prisma.goal.findFirst({ where: { ownerId: user.id, title: "Return to Valencia College", status: { not: "ARCHIVED" } } })) throw new UserError("You already have this checklist.");
    await createValenciaChecklist(user.id, todayLocal(user.timezone));
    return "Checklist created as a goal with milestones.";
  });
  done();
  return r;
}

// ───────────── Scheduling (shared) ─────────────

export async function scheduleSessionAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  let message = "";
  const r = await run(async () => {
    const weekdays = fd.getAll("weekdays").map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
    const res = await createSession(user.id, user.timezone, {
      title: title(fd), category: z.enum(["WORKOUT", "STUDY", "CHURCH", "CONTENT", "PERSONAL", "OTHER", "DATE_NIGHT"]).parse(fd.get("category")),
      date: date(fd, "date")!, time: time(fd, "time") ?? "18:00", durationMin: int(fd, "durationMin", 5, 600) ?? 45,
      goalId: opt(fd, "goalId"), workoutTemplateId: opt(fd, "workoutTemplateId"), weekdays: weekdays.length ? weekdays : null, optional: true,
    }, fd.get("acceptConflicts") === "on");
    if (!res.created) {
      const sug = res.check.suggestions.map((x) => x.label).join(" · ");
      throw new UserError(`Conflicts with: ${res.check.conflicts.join("; ")}.${sug ? ` Free alternatives: ${sug}.` : ""} Pick another time, or tick “schedule anyway”.`);
    }
    message = `Added to your calendar.${res.check.modeNote ? " " + res.check.modeNote : ""}`;
    return message;
  });
  done();
  return r;
}

// ───────────── Fitness ─────────────

export async function logWorkoutAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const sets: { exerciseId: string; setNumber: number; reps: number | null; weightX100: number | null; durationSec: number | null }[] = [];
    for (const exId of fd.getAll("exerciseId").map(String)) {
      for (let n = 1; n <= 6; n++) {
        const reps = int(fd, `reps_${exId}_${n}`, 0, 500);
        const w = x100(fd, `weight_${exId}_${n}`);
        if (reps !== null || w !== null) sets.push({ exerciseId: exId, setNumber: n, reps, weightX100: w, durationSec: null });
      }
    }
    await logWorkout(user.id, {
      date: date(fd, "date")!, title: title(fd), templateId: opt(fd, "templateId"), eventId: opt(fd, "eventId"), originalStart: opt(fd, "originalStart"),
      durationMin: int(fd, "durationMin", 1, 600), effort: int(fd, "effort", 1, 10), status: z.enum(["COMPLETED", "PARTIAL"]).parse(fd.get("status") ?? "COMPLETED"),
      notes: opt(fd, "notes"), sets, idempotencyKey: s(fd, "idempotencyKey"),
    });
    return "Workout logged. Nice work.";
  });
  done();
  return r;
}

export async function removeWorkoutAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => { await removeWorkoutLog(user.id, z.string().parse(fd.get("id"))); return "Removed. A copy is kept in your audit history."; });
  done();
  return r;
}

export async function bodyMetricAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const v = x100(fd, "value");
    if (!v) throw new UserError("Enter a value.");
    const kind = z.enum(["WEIGHT", "WAIST", "CHEST", "HIPS", "ARMS", "BODY_FAT"]).parse(fd.get("kind"));
    await addBodyMetric(user.id, { kind, valueX100: v, unit: kind === "WEIGHT" ? s(fd, "unit") || "lb" : kind === "BODY_FAT" ? "%" : "in", measuredOn: date(fd, "date")!, note: opt(fd, "note") });
    return "Saved.";
  });
  done();
  return r;
}

export async function growthSettingsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const data: Record<string, number | string> = {};
    const w = int(fd, "workoutsPerWeek", 0, 7); if (w !== null) data.workoutsPerWeek = w;
    const f = int(fd, "faithDaysPerWeek", 0, 7); if (f !== null) data.faithDaysPerWeek = f;
    const d = int(fd, "dateNightWeekday", 0, 6); if (d !== null) data.dateNightWeekday = d;
    const t = time(fd, "dateNightTime"); if (t) data.dateNightTime = t;
    await prisma.growthSettings.update({ where: { ownerId: user.id }, data });
    return "Saved.";
  });
  done();
  return r;
}

// ───────────── Faith ─────────────

export async function faithEntryAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await addFaithEntry(user.id, { kind: s(fd, "kind"), date: date(fd, "date")!, minutes: int(fd, "minutes", 1, 1440), passage: opt(fd, "passage"), body: opt(fd, "body"), idempotencyKey: s(fd, "idempotencyKey") });
    return "Saved privately.";
  });
  done();
  return r;
}

export async function reminderPrefAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await saveReminderPreference(user.id, s(fd, "key"), time(fd, "time") ?? "07:00", fd.getAll("days").map(Number).filter((n) => n >= 0 && n <= 6), fd.get("enabled") === "on");
    return "Saved for later. Reminders are not delivered until notifications are set up and tested (Phase 4).";
  });
  done();
  return r;
}

// ───────────── Relationship ─────────────

export async function planDateAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const letter = opt(fd, "letter");
    if (letter && !/^[A-Z]$/.test(letter)) throw new UserError("Letter must be A–Z.");
    const check = await checkSession(user.id, user.timezone, { title: "Date night", category: "DATE_NIGHT", date: date(fd, "date")!, time: time(fd, "time") ?? "18:30", durationMin: int(fd, "durationMin", 15, 720) ?? 150, optional: false });
    if (check.conflicts.length && fd.get("acceptConflicts") !== "on") {
      throw new UserError(`Overlaps: ${check.conflicts.join("; ")}.${check.suggestions.length ? ` Free alternatives: ${check.suggestions.map((x) => x.label).join(" · ")}.` : ""} Pick another time or tick “plan anyway”.`);
    }
    await planDate(user.id, user.timezone, { title: title(fd), date: date(fd, "date")!, startTime: time(fd, "time"), durationMin: int(fd, "durationMin", 15, 720) ?? 150, budgetCents: money(fd, "budget"), letter, notes: opt(fd, "notes") });
    return "Date planned and added to your calendar. Nothing was booked or purchased.";
  });
  done();
  return r;
}

export async function completeDateAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await completeDate(user.id, z.string().parse(fd.get("id")), { actualCostCents: opt(fd, "paymentId") ? null : money(fd, "actualCost"), paymentId: opt(fd, "paymentId") }, todayLocal(user.timezone));
    return "Marked as done. 💚";
  });
  done();
  return r;
}

export async function changeDateAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await changeDate(user.id, user.timezone, z.string().parse(fd.get("id")), { status: z.enum(["POSTPONED", "CANCELLED"]).parse(fd.get("status")), newDate: date(fd, "newDate", false), newTime: time(fd, "newTime") });
  });
  done();
  return r;
}

export async function alphabetAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const letter = z.string().regex(/^[A-Z]$/).parse(fd.get("letter"));
    const skip = fd.get("op") === "skip" ? true : fd.get("op") === "unskip" ? false : undefined;
    await updateAlphabetEntry(user.id, letter, { activity: opt(fd, "activity"), estBudgetCents: money(fd, "estBudget"), notes: opt(fd, "notes"), skip });
  });
  done();
  return r;
}

export async function relationshipItemAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const op = z.enum(["idea", "importantDate", "note", "archiveIdea"]).parse(fd.get("op"));
    if (op === "idea") await prisma.dateIdea.create({ data: { ownerId: user.id, title: title(fd), category: opt(fd, "category"), estCostCents: money(fd, "estCost"), letter: opt(fd, "letter")?.toUpperCase().slice(0, 1) ?? null, notes: opt(fd, "notes") } });
    if (op === "archiveIdea") await prisma.dateIdea.updateMany({ where: { id: s(fd, "id"), ownerId: user.id }, data: { archived: true } });
    if (op === "importantDate") {
      const d = date(fd, "date")!;
      await prisma.importantDate.create({ data: { ownerId: user.id, title: title(fd), kind: z.enum(["ANNIVERSARY", "BIRTHDAY", "OTHER"]).parse(fd.get("kind")), month: Number(d.slice(5, 7)), day: Number(d.slice(8, 10)), year: fd.get("knowYear") === "on" ? Number(d.slice(0, 4)) : null, notes: opt(fd, "notes") } });
    }
    if (op === "note") {
      const body = opt(fd, "body");
      if (!body) throw new UserError("Write something first.");
      await prisma.relationshipNote.create({ data: { ownerId: user.id, bodyCipher: encrypt(body)! } });
    }
    return "Saved.";
  });
  done();
  return r;
}

// ───────────── Education, career, personal growth ─────────────

export async function activityAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const minutes = int(fd, "minutes", 1, 1440);
    if (!minutes) throw new UserError("Enter minutes.");
    await logActivity(user.id, { kind: s(fd, "kind"), date: date(fd, "date")!, minutes, title: opt(fd, "title"), note: opt(fd, "note"), goalId: opt(fd, "goalId"), courseId: opt(fd, "courseId"), idempotencyKey: s(fd, "idempotencyKey") });
    return "Logged.";
  });
  done();
  return r;
}

export async function eduItemAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const op = z.enum(["program", "course", "tuition", "credential"]).parse(fd.get("op"));
    const id = opt(fd, "id");
    if (op === "program") await upsertOwned("eduProgram", user.id, id, { ...(id ? {} : { name: title(fd, "name"), institution: s(fd, "institution") || "Valencia College", credential: opt(fd, "credential") }), status: z.enum(PROGRAM_STATUSES).parse(fd.get("status")), notes: opt(fd, "notes") });
    if (op === "course") await upsertOwned("eduCourse", user.id, id, { title: title(fd), code: opt(fd, "code"), credits: int(fd, "credits", 0, 12), term: opt(fd, "term"), status: z.enum(COURSE_STATUSES).parse(fd.get("status") ?? "PLANNED"), grade: opt(fd, "grade") });
    if (op === "tuition") { const est = money(fd, "est"); if (est === null) throw new UserError("Enter an estimate."); await upsertOwned("tuitionItem", user.id, id, { label: title(fd, "label"), term: opt(fd, "term"), estCents: est, actualCents: money(fd, "actual"), notes: opt(fd, "notes") }); }
    if (op === "credential") await upsertOwned("careerCredential", user.id, id, { name: title(fd, "name"), kind: z.enum(["TRAINING", "CERTIFICATION"]).parse(fd.get("kind")), status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]).parse(fd.get("status")), notes: opt(fd, "notes") });
    return "Saved.";
  });
  done();
  return r;
}

export async function jobAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await saveJob(user.id, opt(fd, "id"), {
      title: title(fd), agency: title(fd, "agency"), level: s(fd, "level"), location: opt(fd, "location"),
      payMinCents: money(fd, "payMin"), payMaxCents: money(fd, "payMax"), payPeriod: z.enum(["HOURLY", "ANNUAL"]).parse(fd.get("payPeriod") ?? "HOURLY"),
      deadline: date(fd, "deadline", false), status: s(fd, "status") || "RESEARCHING", appliedOn: date(fd, "appliedOn", false), interviewOn: date(fd, "interviewOn", false),
      notes: opt(fd, "notes"), prepNotes: opt(fd, "prepNotes"),
    });
    return "Saved.";
  });
  done();
  return r;
}

export async function careerProfileAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const hireDate = date(fd, "hireDate", false);
    const data = { employer: title(fd, "employer"), title: title(fd, "role"), hireDate: hireDate ? new Date(`${hireDate}T00:00:00Z`) : null, notes: opt(fd, "notes") };
    await prisma.$transaction(async (tx) => {
      const row = await tx.careerProfile.upsert({ where: { ownerId: user.id }, create: { ownerId: user.id, ...data }, update: data });
      await audit(tx, user.id, "CareerProfile", user.id, "update", undefined, { employer: row.employer, title: row.title });
    });
    return "Saved.";
  });
  done();
  return r;
}

// ───────────── Reviews ─────────────

export async function saveReviewAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await saveReview(user.id, z.enum(["WEEK", "MONTH"]).parse(fd.get("kind")), date(fd, "anyDay")!, opt(fd, "reflection"), [1, 2, 3].map((n) => s(fd, `priority${n}`)));
    return "Review saved. Your reflection is stored encrypted.";
  });
  done();
  return r;
}
