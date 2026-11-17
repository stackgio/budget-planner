import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { readPrivate } from "@/server/crypto";

export const dynamic = "force-dynamic";

/**
 * Everything LEVEL UP stores for the signed-in owner, as JSON.
 * Private notes are decrypted for the owner. Never included: password hash, passkeys,
 * sessions, sign-in challenges, login attempts, or any other credential material.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const ownerId = user.id;
  const o = { where: { ownerId } };
  const [
    settings, events, modeSessions, tasks, habits, schedules, paydays, deposits, payRates, overtimeShifts, challenges, auditLog, plans, payments, rothYears, rouletteSettings,
    goals, growthSettings, reminderPreferences, exercises, workoutTemplates, workouts, bodyMetrics, faithEntries, datePlans, dateIdeas, importantDates, relationshipNotes,
    alphabet, eduPrograms, eduCourses, tuition, careerProfile, careerCredentials, jobs, activityLogs, reviews,
    notificationPreferences, notifications, pushDevices, dailyReflections, assistantDismissals,
    gigPlatforms, gigSettings, gigSessions, gigMileage, gigPayouts,
  ] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: ownerId } }),
    prisma.calendarEvent.findMany({ ...o, include: { exceptions: true } }),
    prisma.modeSession.findMany(o),
    prisma.task.findMany(o),
    prisma.habit.findMany({ ...o, include: { checkIns: true } }),
    prisma.paySchedule.findMany(o),
    prisma.payday.findMany(o),
    prisma.incomeDeposit.findMany(o),
    prisma.payRate.findMany(o),
    prisma.overtimeShift.findMany(o),
    prisma.challenge.findMany({ ...o, include: { tiles: true, balances: true } }),
    prisma.auditLog.findMany(o),
    prisma.allocationPlan.findMany({ ...o, include: { lines: true } }),
    prisma.payment.findMany(o),
    prisma.rothYear.findMany(o),
    prisma.rouletteSettings.findMany(o),
    prisma.goal.findMany({ ...o, include: { milestones: true, progress: true } }),
    prisma.growthSettings.findUnique({ where: { ownerId } }),
    prisma.reminderPreference.findMany(o),
    prisma.exercise.findMany(o),
    prisma.workoutTemplate.findMany({ ...o, include: { items: true } }),
    prisma.workoutLog.findMany({ ...o, include: { sets: true } }),
    prisma.bodyMetric.findMany(o),
    prisma.faithEntry.findMany(o),
    prisma.datePlan.findMany(o),
    prisma.dateIdea.findMany(o),
    prisma.importantDate.findMany(o),
    prisma.relationshipNote.findMany(o),
    prisma.alphabetEntry.findMany(o),
    prisma.eduProgram.findMany(o),
    prisma.eduCourse.findMany(o),
    prisma.tuitionItem.findMany(o),
    prisma.careerProfile.findUnique({ where: { ownerId } }),
    prisma.careerCredential.findMany(o),
    prisma.jobOpportunity.findMany(o),
    prisma.activityLog.findMany(o),
    prisma.review.findMany(o),
    prisma.notificationPreference.findUnique({ where: { ownerId } }),
    prisma.notification.findMany({ ...o, orderBy: { scheduledFor: "asc" } }),
    // Devices: label and dates only. Push endpoints and keys are credentials and are never exported.
    prisma.pushSubscription.findMany({ ...o, select: { id: true, label: true, createdAt: true, lastSuccessAt: true, revokedAt: true } }),
    prisma.dailyReflection.findMany(o),
    prisma.assistantDismissal.findMany(o),
    prisma.gigPlatform.findMany(o),
    prisma.gigSettings.findUnique({ where: { ownerId } }),
    prisma.gigSession.findMany({ ...o, orderBy: { workDate: "asc" } }),
    prisma.gigMileage.findMany({ ...o, orderBy: { tripDate: "asc" } }),
    prisma.gigPayout.findMany({ ...o, orderBy: { createdAt: "asc" } }),
  ]);
  const plain = <T extends Record<string, unknown>>(rows: T[], fields: [string, string][]) =>
    rows.map((r) => {
      const out: Record<string, unknown> = { ...r };
      for (const [cipherField, name] of fields) { out[name] = readPrivate(r[cipherField] as string | null); delete out[cipherField]; }
      return out;
    });

  const body = JSON.stringify(
    {
      format: "levelup-2027-export", version: 5, mileageUnits: "hundredths of a mile", exportedAt: new Date().toISOString(), moneyUnits: "integer cents", hoursUnits: "hundredths of an hour",
      note: "Contains your private notes in plain text. Store this file securely.",
      account: { email: user.email, displayName: user.displayName },
      settings, events, modeSessions, tasks, habits, schedules, paydays, deposits, payRates, overtimeShifts, challenges, plans, payments, rothYears, rouletteSettings,
      goals: plain(goals, [["notesCipher", "notes"]]),
      growthSettings, reminderPreferences, exercises, workoutTemplates, workouts, bodyMetrics,
      faithEntries: plain(faithEntries, [["bodyCipher", "body"]]),
      datePlans: plain(datePlans, [["notesCipher", "notes"]]), dateIdeas, importantDates,
      relationshipNotes: plain(relationshipNotes, [["bodyCipher", "body"]]), alphabet,
      eduPrograms, eduCourses, tuition, careerProfile, careerCredentials,
      jobs: plain(jobs, [["notesCipher", "notes"], ["prepNotesCipher", "prepNotes"]]),
      activityLogs, reviews: plain(reviews, [["reflectionCipher", "reflection"]]),
      notificationPreferences, notifications: plain(notifications, [["detailCipher", "detail"]]), pushDevices,
      dailyReflections: plain(dailyReflections, [["bodyCipher", "body"], ["answersCipher", "answers"]]), assistantDismissals,
      gig: { platforms: gigPlatforms, settings: gigSettings, workSessions: plain(gigSessions, [["notesCipher", "notes"]]), mileage: gigMileage, payouts: gigPayouts },
      assistantConversations: "not stored — questions and answers are never saved",
      auditLog,
    },
    (_k, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  );
  return new Response(body, {
    headers: {
      "content-type": "application/json",
      "content-disposition": `attachment; filename="levelup-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "no-store",
    },
  });
}
