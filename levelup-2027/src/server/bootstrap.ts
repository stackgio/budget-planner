import "server-only";
import type { PrismaClient } from "@prisma/client";
import { localToDbDate, todayLocal, zonedToInstant } from "@/domain/dates";
import { ensurePaydays } from "./payroll";

/**
 * Initial configuration confirmed by the owner (Phase 0/1 approval).
 * Contains settings only — no invented financial records.
 */
export const INITIAL_CONFIG = {
  timezone: "America/New_York",
  regular: { anchor: "2026-11-27", verified: false, earlyOffset: -1 },
  overtime: { anchor: "2026-12-04", verified: true, earlyOffset: 0 },
  payRate: { regularHourlyCents: 2420, overtimeMultiplierBp: 15000, provisional: true },
  docSeries: { firstShift: "2027-01-02", start: "08:00", end: "16:00", rrule: "FREQ=WEEKLY;BYDAY=SA,SU,MO,TU,WE" },
  habits: [
    ["Prayer", "🙏", 7], ["Bible reading", "📖", 7], ["Gym", "🏋️", 3], ["Speaking practice", "🎙️", 5],
    ["Studying", "🎓", 3], ["Reading", "📚", 5], ["Content creation", "🎬", 3], ["Evening reflection", "🌙", 7],
  ] as const,
  movingOutTiles: 141,
  schdDays: 100,
  schdNextDay: 38,
};

export async function seedOwnerConfig(db: PrismaClient, ownerId: string) {
  const c = INITIAL_CONFIG;
  await db.$transaction(async (tx) => {
    await tx.userSettings.create({ data: { userId: ownerId, timezone: c.timezone } });
    await tx.paySchedule.createMany({
      data: [
        { ownerId, kind: "REGULAR", anchorOfficialDate: localToDbDate(c.regular.anchor), anchorVerified: c.regular.verified, earlyDepositOffsetDays: c.regular.earlyOffset },
        { ownerId, kind: "OVERTIME", anchorOfficialDate: localToDbDate(c.overtime.anchor), anchorVerified: c.overtime.verified, earlyDepositOffsetDays: c.overtime.earlyOffset },
      ],
    });
    await tx.payRate.create({
      data: { ownerId, ...c.payRate, effectiveFrom: localToDbDate(todayLocal(c.timezone)) },
    });
    await tx.calendarEvent.create({
      data: {
        ownerId,
        title: "DOC shift",
        category: "DOC_SHIFT",
        startAt: zonedToInstant(c.docSeries.firstShift, c.docSeries.start, c.timezone),
        endAt: zonedToInstant(c.docSeries.firstShift, c.docSeries.end, c.timezone),
        timezone: c.timezone,
        rrule: c.docSeries.rrule,
        important: true,
        sourceType: "DOC_SCHEDULE",
        sourceId: "regular-rotation",
        description: "Regular DOC rotation: Sat–Wed 8:00 AM–4:00 PM. Edit a single shift without changing the series.",
      },
    });
    await tx.habit.createMany({
      data: c.habits.map(([name, emoji, target], i) => ({ ownerId, name, emoji, targetPerWeek: target, sortOrder: i, optional: true })),
    });

    // Challenge configuration (Phase 2 uses these). No payments or transfers are created.
    await tx.challenge.create({
      data: {
        ownerId, kind: "MOVING_OUT", name: "Moving-Out Savings", selectionRule: "BIG_FIRST_RANDOM_TOP_N", topN: 10,
        targetCents: (c.movingOutTiles * (c.movingOutTiles + 1) / 2) * 100, status: "ACTIVE",
        tiles: { create: Array.from({ length: c.movingOutTiles }, (_, i) => ({ number: i + 1, amountCents: (i + 1) * 100 })) },
      },
    });
    await tx.challenge.create({
      data: {
        ownerId, kind: "SCHD", name: "SCHD Investing", selectionRule: "SEQUENTIAL", topN: 1,
        targetCents: (c.schdDays * (c.schdDays + 1) / 2) * 100, nextNumber: c.schdNextDay, status: "ACTIVE",
        tiles: {
          create: Array.from({ length: c.schdDays }, (_, i) => ({
            number: i + 1, amountCents: (i + 1) * 100, status: i + 1 < c.schdNextDay ? "PROVISIONAL" : "OPEN",
          })),
        },
      },
    });
    await tx.challenge.create({
      data: { ownerId, kind: "DEBT", name: "Debt Payoff", selectionRule: "BIG_FIRST_RANDOM_TOP_N", topN: 10, targetCents: null, status: "SETUP_REQUIRED" },
    });
  });
  await ensurePaydays(ownerId, db);
}

export async function createOwner(db: PrismaClient, email: string, passwordHash: string, displayName = "Gio") {
  // Advisory lock makes "first account wins" atomic even under concurrent setup requests.
  const user = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(202701)::text`;
    if ((await tx.user.count()) > 0) throw new Error("An owner account already exists. LEVEL UP is single-user.");
    return tx.user.create({ data: { email: email.toLowerCase().trim(), passwordHash, displayName } });
  });
  await seedOwnerConfig(db, user.id);
  return user;
}
