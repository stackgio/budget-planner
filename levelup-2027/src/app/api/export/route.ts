import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const ownerId = user.id;
  const [settings, events, modeSessions, tasks, habits, schedules, paydays, deposits, payRates, overtimeShifts, challenges, auditLog] = await Promise.all([
    prisma.userSettings.findUnique({ where: { userId: ownerId } }),
    prisma.calendarEvent.findMany({ where: { ownerId }, include: { exceptions: true } }),
    prisma.modeSession.findMany({ where: { ownerId } }),
    prisma.task.findMany({ where: { ownerId } }),
    prisma.habit.findMany({ where: { ownerId }, include: { checkIns: true } }),
    prisma.paySchedule.findMany({ where: { ownerId } }),
    prisma.payday.findMany({ where: { ownerId } }),
    prisma.incomeDeposit.findMany({ where: { ownerId } }),
    prisma.payRate.findMany({ where: { ownerId } }),
    prisma.overtimeShift.findMany({ where: { ownerId } }),
    prisma.challenge.findMany({ where: { ownerId }, include: { tiles: true } }),
    prisma.auditLog.findMany({ where: { ownerId } }),
  ]);
  const body = JSON.stringify(
    { format: "levelup-2027-export", version: 1, exportedAt: new Date().toISOString(), moneyUnits: "integer cents", hoursUnits: "hundredths of an hour",
      account: { email: user.email, displayName: user.displayName }, settings, events, modeSessions, tasks, habits, schedules, paydays, deposits, payRates, overtimeShifts, challenges, auditLog },
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
