import "server-only";
import { prisma } from "./db";
import { audit } from "./audit";
import { UserError } from "./payroll";
import { encrypt, readPrivate } from "./crypto";
import { IDEMPOTENCY_KEY_RE, isUniqueViolation } from "./idempotency";
import { currentPayRate } from "./payroll";
import { type LocalDate, dateToLocal, localToDbDate } from "@/domain/dates";
import { comparePay } from "@/domain/growth";

export const ACTIVITY_KINDS = ["STUDY", "SPEAKING", "READING", "LEARNING", "PROJECT", "DISCIPLINE", "CAREER_PREP", "OTHER"] as const;
export const PROGRAM_STATUSES = ["RESEARCHING", "PLANNING", "APPLYING", "ADMITTED", "ENROLLED", "PAUSED", "NOT_PURSUING"] as const;
export const COURSE_STATUSES = ["PLANNED", "REGISTERED", "IN_PROGRESS", "COMPLETED", "DROPPED"] as const;
export const JOB_STATUSES = ["RESEARCHING", "PREPARING", "APPLIED", "INTERVIEW", "OFFER", "CLOSED", "NOT_PURSUING"] as const;
export const JOB_LEVELS = ["PROMOTION", "STATE", "COUNTY", "FEDERAL", "OTHER"] as const;

/** Time you spent studying, practicing or learning. Logged by you only; idempotent per key. */
export async function logActivity(ownerId: string, i: { kind: string; date: LocalDate; minutes: number; title: string | null; note: string | null; goalId: string | null; courseId: string | null; idempotencyKey: string }) {
  if (!IDEMPOTENCY_KEY_RE.test(i.idempotencyKey)) throw new UserError("Missing request key. Refresh and try again.");
  if (!(ACTIVITY_KINDS as readonly string[]).includes(i.kind)) throw new UserError("Unknown activity type.");
  if (!Number.isInteger(i.minutes) || i.minutes < 1 || i.minutes > 1440) throw new UserError("Minutes must be between 1 and 1440.");
  const prior = await prisma.activityLog.findUnique({ where: { idempotencyKey: i.idempotencyKey } });
  if (prior) return prior;
  if (i.goalId && !(await prisma.goal.findFirst({ where: { id: i.goalId, ownerId } }))) throw new UserError("Goal not found.");
  if (i.courseId && !(await prisma.eduCourse.findFirst({ where: { id: i.courseId, ownerId } }))) throw new UserError("Course not found.");
  try {
    return await prisma.activityLog.create({ data: { ownerId, ...i, date: localToDbDate(i.date) } });
  } catch (e) {
    if (isUniqueViolation(e)) return prisma.activityLog.findUniqueOrThrow({ where: { idempotencyKey: i.idempotencyKey } });
    throw e;
  }
}

export async function upsertOwned<T extends "eduProgram" | "eduCourse" | "tuitionItem" | "careerCredential">(model: T, ownerId: string, id: string | null, data: Record<string, unknown>) {
  // Generic owner-scoped create/update for simple records; every update checks ownership first.
  const delegate = (prisma as unknown as Record<string, { findFirst: (a: unknown) => Promise<unknown>; create: (a: unknown) => Promise<unknown>; update: (a: unknown) => Promise<unknown> }>)[model]!;
  if (id) {
    const existing = await delegate.findFirst({ where: { id, ownerId } });
    if (!existing) throw new UserError("Not found.");
    return delegate.update({ where: { id }, data });
  }
  return delegate.create({ data: { ownerId, ...data } });
}

export async function educationOverview(ownerId: string) {
  const [programs, courses, tuition, study] = await Promise.all([
    prisma.eduProgram.findMany({ where: { ownerId }, orderBy: { createdAt: "asc" } }),
    prisma.eduCourse.findMany({ where: { ownerId, archivedAt: null }, orderBy: [{ term: "asc" }, { title: "asc" }] }),
    prisma.tuitionItem.findMany({ where: { ownerId, archivedAt: null }, orderBy: { term: "asc" } }),
    prisma.activityLog.findMany({ where: { ownerId, kind: "STUDY" }, orderBy: { date: "desc" }, take: 20 }),
  ]);
  const credits = (s: string) => courses.filter((c) => c.status === s).reduce((a, c) => a + (c.credits ?? 0), 0);
  return {
    programs, courses, tuition, study: study.map((s) => ({ ...s, date: dateToLocal(s.date) })),
    credits: { planned: credits("PLANNED") + credits("REGISTERED"), inProgress: credits("IN_PROGRESS"), completed: credits("COMPLETED") },
    tuitionEstCents: tuition.reduce((a, t) => a + t.estCents, 0),
    tuitionActualCents: tuition.reduce((a, t) => a + (t.actualCents ?? 0), 0),
  };
}

export interface JobInput {
  title: string; agency: string; level: string; location: string | null; payMinCents: number | null; payMaxCents: number | null;
  payPeriod: "HOURLY" | "ANNUAL"; deadline: LocalDate | null; status: string; appliedOn: LocalDate | null; interviewOn: LocalDate | null;
  notes: string | null; prepNotes: string | null;
}

export async function saveJob(ownerId: string, id: string | null, i: JobInput) {
  if (!(JOB_LEVELS as readonly string[]).includes(i.level)) throw new UserError("Unknown level.");
  if (!(JOB_STATUSES as readonly string[]).includes(i.status)) throw new UserError("Unknown status.");
  if (i.payMinCents !== null && i.payMaxCents !== null && i.payMaxCents < i.payMinCents) throw new UserError("Max pay can't be below min pay.");
  if (i.status === "APPLIED" && !i.appliedOn) throw new UserError("Add the date you applied.");
  const data = {
    title: i.title, agency: i.agency, level: i.level, location: i.location, payMinCents: i.payMinCents, payMaxCents: i.payMaxCents, payPeriod: i.payPeriod,
    deadline: i.deadline ? localToDbDate(i.deadline) : null, status: i.status, appliedOn: i.appliedOn ? localToDbDate(i.appliedOn) : null,
    interviewOn: i.interviewOn ? localToDbDate(i.interviewOn) : null, notesCipher: encrypt(i.notes), prepNotesCipher: encrypt(i.prepNotes),
  };
  return prisma.$transaction(async (tx) => {
    if (id) {
      const before = await tx.jobOpportunity.findFirst({ where: { id, ownerId } });
      if (!before) throw new UserError("Not found.");
      const after = await tx.jobOpportunity.update({ where: { id }, data });
      if (before.status !== after.status) await audit(tx, ownerId, "JobOpportunity", id, `status:${after.status}`, { status: before.status }, { status: after.status });
      return after;
    }
    const j = await tx.jobOpportunity.create({ data: { ownerId, ...data } });
    await audit(tx, ownerId, "JobOpportunity", j.id, "create", undefined, { title: j.title, status: j.status });
    return j;
  });
}

export async function careerOverview(ownerId: string) {
  const [profile, credentials, jobs, rate] = await Promise.all([
    prisma.careerProfile.findUnique({ where: { ownerId } }),
    prisma.careerCredential.findMany({ where: { ownerId }, orderBy: { name: "asc" } }),
    prisma.jobOpportunity.findMany({ where: { ownerId }, orderBy: [{ status: "asc" }, { deadline: "asc" }] }),
    currentPayRate(ownerId),
  ]);
  const hourly = rate?.regularHourlyCents ?? null;
  return {
    profile, credentials, hourlyCents: hourly, rateProvisional: rate?.provisional ?? true,
    jobs: jobs.map((j) => ({
      ...j, deadline: j.deadline ? dateToLocal(j.deadline) : null, appliedOn: j.appliedOn ? dateToLocal(j.appliedOn) : null,
      interviewOn: j.interviewOn ? dateToLocal(j.interviewOn) : null, notes: readPrivate(j.notesCipher), prepNotes: readPrivate(j.prepNotesCipher),
      compare: hourly !== null && (j.payMinCents !== null || j.payMaxCents !== null) ? comparePay(hourly, { minCents: j.payMinCents, maxCents: j.payMaxCents, period: j.payPeriod as "HOURLY" | "ANNUAL" }) : null,
    })),
  };
}

/** Archive (or restore) a course or tuition item. Nothing is deleted; history and logs stay intact. */
export async function setEduArchived(ownerId: string, model: "eduCourse" | "tuitionItem", id: string, archived: boolean) {
  const d = (prisma as unknown as Record<string, { updateMany: (a: unknown) => Promise<{ count: number }> }>)[model]!;
  const r = await d.updateMany({ where: { id, ownerId }, data: { archivedAt: archived ? new Date() : null } });
  if (!r.count) throw new UserError("Not found.");
}

export async function archivedEducation(ownerId: string) {
  const [courses, tuition] = await Promise.all([
    prisma.eduCourse.findMany({ where: { ownerId, archivedAt: { not: null } }, orderBy: { archivedAt: "desc" } }),
    prisma.tuitionItem.findMany({ where: { ownerId, archivedAt: { not: null } }, orderBy: { archivedAt: "desc" } }),
  ]);
  return { courses, tuition };
}
