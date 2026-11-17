import "server-only";
import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "./db";
import { audit } from "./audit";
import { UserError } from "./payroll";
import { encrypt, readPrivate } from "./crypto";
import { IDEMPOTENCY_KEY_RE, isLedgerViolation, isUniqueViolation, requestHash } from "./idempotency";
import { createSession, type ScheduleCheck } from "./schedule";
import { type LocalDate, dateToLocal, isLocalDate, localToDbDate, zonedToInstant } from "@/domain/dates";
import {
  DEFAULT_PLATFORMS, centsToDecimal, csvCell, gigTotals, minutesBetween, sessionEarnings, sessionExpenses, targetProgress, type GigTotals,
} from "@/domain/gig";
import { formatCents } from "@/domain/money";

type Tx = Prisma.TransactionClient;
type Db = PrismaClient | Tx;
const TX_OPTS = { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15_000 } as const;

// ───────────────────────── Setup & settings ─────────────────────────

/** Creates the default platforms and settings once. Never changes existing rows. */
export async function ensureGigSetup(ownerId: string, db: Db = prisma) {
  await db.gigPlatform.createMany({ data: DEFAULT_PLATFORMS.map((name, i) => ({ ownerId, name, sortOrder: i })), skipDuplicates: true });
  // createMany + skipDuplicates is race-free (ON CONFLICT DO NOTHING); a plain upsert can collide when pages load in parallel.
  await db.gigSettings.createMany({ data: [{ ownerId }], skipDuplicates: true });
  return db.gigSettings.findUniqueOrThrow({ where: { ownerId } });
}

export async function gigSettings(ownerId: string) {
  return ensureGigSetup(ownerId);
}

export async function saveGigSettings(ownerId: string, i: { monthlyTargetCents: number; taxReserveBps: number | null; costPerMileMills: number | null }) {
  if (!Number.isSafeInteger(i.monthlyTargetCents) || i.monthlyTargetCents < 0 || i.monthlyTargetCents > 10_000_000) throw new UserError("Monthly target must be between $0 and $100,000.");
  if (i.taxReserveBps !== null && (!Number.isInteger(i.taxReserveBps) || i.taxReserveBps < 0 || i.taxReserveBps > 10_000)) throw new UserError("Tax reserve must be between 0% and 100%.");
  if (i.costPerMileMills !== null && (!Number.isInteger(i.costPerMileMills) || i.costPerMileMills < 0 || i.costPerMileMills > 100_000)) throw new UserError("Cost per mile must be between $0 and $100.");
  await ensureGigSetup(ownerId);
  return prisma.$transaction(async (tx) => {
    const before = await tx.gigSettings.findUniqueOrThrow({ where: { ownerId } });
    const after = await tx.gigSettings.update({ where: { ownerId }, data: i });
    await audit(tx, ownerId, "GigSettings", ownerId, "update", before, after);
    return after;
  });
}

export async function listPlatforms(ownerId: string, includeArchived = false) {
  await ensureGigSetup(ownerId);
  return prisma.gigPlatform.findMany({ where: { ownerId, ...(includeArchived ? {} : { archivedAt: null }) }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}

export async function addPlatform(ownerId: string, name: string) {
  const n = name.trim().replace(/\s+/g, " ");
  if (n.length < 2 || n.length > 40) throw new UserError("Name must be 2–40 characters.");
  await ensureGigSetup(ownerId);
  try {
    return await prisma.$transaction(async (tx) => {
      const count = await tx.gigPlatform.count({ where: { ownerId } });
      const p = await tx.gigPlatform.create({ data: { ownerId, name: n, custom: true, sortOrder: count } });
      await audit(tx, ownerId, "GigPlatform", p.id, "create", undefined, p);
      return p;
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new UserError(`You already have “${n}”.`);
    throw e;
  }
}

export async function setPlatformArchived(ownerId: string, id: string, archived: boolean) {
  const p = await prisma.gigPlatform.findFirst({ where: { id, ownerId } });
  if (!p) throw new UserError("Income source not found.");
  await prisma.$transaction(async (tx) => {
    const after = await tx.gigPlatform.update({ where: { id }, data: { archivedAt: archived ? new Date() : null } });
    await audit(tx, ownerId, "GigPlatform", id, archived ? "archive" : "restore", p, after);
  });
}

async function ownPlatform(db: Db, ownerId: string, platformId: string, allowArchived = false) {
  const p = await db.gigPlatform.findFirst({ where: { id: platformId, ownerId } });
  if (!p || (!allowArchived && p.archivedAt)) throw new UserError("Choose an income source.");
  return p;
}

// ───────────────────────── Work sessions ─────────────────────────

export interface SessionInput {
  platformId: string;
  workDate: LocalDate;
  startTime?: string | null; // HH:MM local
  endTime?: string | null;
  minutes?: number | null; // used when no start/end
  grossCents: number;
  tipsCents: number;
  tipsInGross: boolean;
  bonusCents: number;
  bonusInGross: boolean;
  parkingTollsCents: number;
  otherExpenseCents: number;
  milesHundredths?: number | null;
  notes?: string | null;
  plannedEventId?: string | null;
}

const MONEY_FIELDS = ["grossCents", "tipsCents", "tipsInGross", "bonusCents", "bonusInGross", "parkingTollsCents", "otherExpenseCents", "platformId"] as const;

function validateSession(i: SessionInput, tz: string) {
  if (!isLocalDate(i.workDate)) throw new UserError("Enter a valid date.");
  for (const k of ["grossCents", "tipsCents", "bonusCents", "parkingTollsCents", "otherExpenseCents"] as const) {
    if (!Number.isSafeInteger(i[k]) || i[k] < 0 || i[k] > 10_000_000) throw new UserError("Amounts must be between $0 and $100,000.");
  }
  if (i.tipsInGross && i.tipsCents > i.grossCents) throw new UserError("Tips can't be more than gross earnings when they're included in gross.");
  if (i.bonusInGross && i.bonusCents > i.grossCents) throw new UserError("Bonuses can't be more than gross earnings when they're included in gross.");
  if (i.tipsInGross && i.bonusInGross && i.tipsCents + i.bonusCents > i.grossCents) throw new UserError("Tips plus bonuses can't be more than gross earnings when both are included in gross.");
  let startAt: Date | null = null, endAt: Date | null = null, minutes: number;
  const hhmm = /^\d{2}:\d{2}$/;
  if (i.startTime || i.endTime) {
    if (!i.startTime || !i.endTime || !hhmm.test(i.startTime) || !hhmm.test(i.endTime)) throw new UserError("Enter both a start and an end time, or leave both empty and enter hours.");
    minutes = minutesBetween(i.startTime, i.endTime);
    if (minutes > 16 * 60) throw new UserError("A session can be at most 16 hours. Split longer days into two sessions.");
    startAt = zonedToInstant(i.workDate, i.startTime, tz);
    endAt = new Date(startAt.getTime() + minutes * 60_000);
  } else {
    minutes = i.minutes ?? 0;
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 16 * 60) throw new UserError("Hours worked must be between 0 and 16.");
  }
  if (i.milesHundredths != null && (!Number.isSafeInteger(i.milesHundredths) || i.milesHundredths < 0 || i.milesHundredths > 200_000)) throw new UserError("Miles must be between 0 and 2,000.");
  return { startAt, endAt, minutes };
}

/**
 * Log or edit a work session. Logging work never creates money. A session that is part of a
 * confirmed payout keeps its payout (the deposit is untouched); changing its amounts needs a reason
 * and is recorded in the audit log, never silently.
 */
export async function saveSession(ownerId: string, tz: string, id: string | null, i: SessionInput, opts: { expectedVersion?: number; correctionReason?: string | null } = {}) {
  const t = validateSession(i, tz);
  await ensureGigSetup(ownerId);
  return prisma.$transaction(async (tx) => {
    const platform = await ownPlatform(tx, ownerId, i.platformId, !!id);
    if (i.plannedEventId && !(await tx.calendarEvent.findFirst({ where: { id: i.plannedEventId, ownerId, category: "GIG" } }))) throw new UserError("Planned shift not found.");
    const data = {
      platformId: platform.id, workDate: localToDbDate(i.workDate), startAt: t.startAt, endAt: t.endAt, minutes: t.minutes,
      grossCents: i.grossCents, tipsCents: i.tipsCents, tipsInGross: i.tipsInGross, bonusCents: i.bonusCents, bonusInGross: i.bonusInGross,
      parkingTollsCents: i.parkingTollsCents, otherExpenseCents: i.otherExpenseCents, notesCipher: encrypt(i.notes?.trim() || null),
      plannedEventId: i.plannedEventId ?? null,
    };
    let session;
    if (id) {
      await tx.$queryRaw`SELECT id FROM "GigSession" WHERE id = ${id} FOR UPDATE`;
      const before = await tx.gigSession.findFirst({ where: { id, ownerId } });
      if (!before || before.archivedAt) throw new UserError("Session not found.");
      if (opts.expectedVersion !== undefined && before.version !== opts.expectedVersion) throw new UserError("This session changed in another window. Refresh and try again.");
      if (before.status === "PAID" && before.platformId !== data.platformId) throw new UserError("This session is part of a confirmed payout from another source. Correct the payout first.");
      const moneyChanged = MONEY_FIELDS.some((k) => (before as Record<string, unknown>)[k] !== (data as Record<string, unknown>)[k]);
      if (before.status === "PAID" && moneyChanged && !opts.correctionReason?.trim()) {
        throw new UserError("This session is part of a confirmed payout. Add a short correction reason — the payout and deposit stay as recorded.");
      }
      session = await tx.gigSession.update({ where: { id }, data: { ...data, version: { increment: 1 } } });
      const action = before.status === "PAID" && moneyChanged ? `correct: ${opts.correctionReason!.trim().slice(0, 200)}` : "update";
      await audit(tx, ownerId, "GigSession", id, action, { ...before, notesCipher: undefined }, { ...session, notesCipher: undefined });
    } else {
      session = await tx.gigSession.create({ data: { ownerId, ...data } });
      await audit(tx, ownerId, "GigSession", session.id, "create", undefined, { ...session, notesCipher: undefined });
    }
    // Miles for this session live in the mileage log (one row per session), so they're counted once.
    const existing = await tx.gigMileage.findUnique({ where: { sessionId: session.id } });
    if (i.milesHundredths != null && i.milesHundredths > 0) {
      const m = { ownerId, platformId: platform.id, tripDate: data.workDate, milesHundredths: i.milesHundredths, purpose: `Gig work — ${platform.name}`, archivedAt: null };
      if (existing) await tx.gigMileage.update({ where: { id: existing.id }, data: m });
      else await tx.gigMileage.create({ data: { ...m, sessionId: session.id } });
    } else if (existing && !existing.archivedAt) {
      await tx.gigMileage.update({ where: { id: existing.id }, data: { archivedAt: new Date() } });
    }
    return session;
  }, TX_OPTS);
}

/** Remove a session from your totals (kept as history). Sessions in a confirmed payout can't be removed. */
export async function archiveSession(ownerId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "GigSession" WHERE id = ${id} FOR UPDATE`;
    const s = await tx.gigSession.findFirst({ where: { id, ownerId } });
    if (!s || s.archivedAt) throw new UserError("Session not found.");
    if (s.status === "PAID") throw new UserError("This session is part of a confirmed payout. Correct the payout first if it was recorded by mistake.");
    await tx.gigSession.update({ where: { id }, data: { archivedAt: new Date(), version: { increment: 1 } } });
    await tx.gigMileage.updateMany({ where: { sessionId: id, archivedAt: null }, data: { archivedAt: new Date() } });
    await audit(tx, ownerId, "GigSession", id, "archive", { ...s, notesCipher: undefined });
  });
}

export async function setSessionDisputed(ownerId: string, id: string, disputed: boolean) {
  return prisma.$transaction(async (tx) => {
    const s = await tx.gigSession.findFirst({ where: { id, ownerId, archivedAt: null } });
    if (!s) throw new UserError("Session not found.");
    if (s.status === "PAID") throw new UserError("This session is already part of a confirmed payout.");
    const after = await tx.gigSession.update({ where: { id }, data: { status: disputed ? "DISPUTED" : "PENDING", version: { increment: 1 } } });
    await audit(tx, ownerId, "GigSession", id, disputed ? "dispute" : "undispute", { status: s.status }, { status: after.status });
  });
}

export function sessionView(s: Prisma.GigSessionGetPayload<{ include: { platform: true; mileage: true; payout: { include: { deposit: true } } } }>) {
  return {
    id: s.id, version: s.version, platformId: s.platformId, platform: s.platform.name, workDate: dateToLocal(s.workDate),
    startAt: s.startAt, endAt: s.endAt, minutes: s.minutes, grossCents: s.grossCents, tipsCents: s.tipsCents, tipsInGross: s.tipsInGross,
    bonusCents: s.bonusCents, bonusInGross: s.bonusInGross, parkingTollsCents: s.parkingTollsCents, otherExpenseCents: s.otherExpenseCents,
    earningsCents: sessionEarnings(s), expensesCents: sessionExpenses(s),
    milesHundredths: s.mileage && !s.mileage.archivedAt ? s.mileage.milesHundredths : null,
    notes: readPrivate(s.notesCipher), status: s.status, plannedEventId: s.plannedEventId,
    payout: s.payout && !s.payout.voidedAt ? { id: s.payout.id, date: dateToLocal(s.payout.deposit.actualDepositDate), netCents: s.payout.deposit.netCents } : null,
  };
}
export type SessionView = ReturnType<typeof sessionView>;

export async function listSessions(ownerId: string, from: LocalDate, to: LocalDate, opts: { status?: ("PENDING" | "PAID" | "DISPUTED")[]; platformId?: string } = {}) {
  const rows = await prisma.gigSession.findMany({
    where: { ownerId, archivedAt: null, workDate: { gte: localToDbDate(from), lte: localToDbDate(to) }, ...(opts.status ? { status: { in: opts.status } } : {}), ...(opts.platformId ? { platformId: opts.platformId } : {}) },
    include: { platform: true, mileage: true, payout: { include: { deposit: true } } },
    orderBy: [{ workDate: "desc" }, { startAt: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(sessionView);
}

export async function unpaidSessions(ownerId: string) {
  const rows = await prisma.gigSession.findMany({
    where: { ownerId, archivedAt: null, status: { in: ["PENDING", "DISPUTED"] } },
    include: { platform: true, mileage: true, payout: { include: { deposit: true } } },
    orderBy: [{ workDate: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(sessionView);
}

// ───────────────────────── Mileage ─────────────────────────

export interface MileageInput {
  platformId?: string | null;
  tripDate: LocalDate;
  milesHundredths: number;
  purpose: string;
  odometerStartTenths?: number | null;
  odometerEndTenths?: number | null;
  notes?: string | null;
}

export async function saveMileage(ownerId: string, id: string | null, i: MileageInput) {
  if (!isLocalDate(i.tripDate)) throw new UserError("Enter a valid date.");
  if (!Number.isSafeInteger(i.milesHundredths) || i.milesHundredths <= 0 || i.milesHundredths > 200_000) throw new UserError("Miles must be more than 0 and at most 2,000.");
  const purpose = i.purpose.trim();
  if (purpose.length < 2 || purpose.length > 120) throw new UserError("Describe the trip's business purpose (2–120 characters).");
  const os = i.odometerStartTenths ?? null, oe = i.odometerEndTenths ?? null;
  if ((os === null) !== (oe === null)) throw new UserError("Enter both odometer readings, or neither.");
  if (os !== null && oe !== null && oe < os) throw new UserError("The ending odometer reading must be at least the starting reading.");
  return prisma.$transaction(async (tx) => {
    if (i.platformId) await ownPlatform(tx, ownerId, i.platformId, true);
    const data = {
      platformId: i.platformId || null, tripDate: localToDbDate(i.tripDate), milesHundredths: i.milesHundredths, purpose,
      odometerStartTenths: os, odometerEndTenths: oe, notes: i.notes?.trim().slice(0, 500) || null,
    };
    if (id) {
      const before = await tx.gigMileage.findFirst({ where: { id, ownerId, archivedAt: null } });
      if (!before) throw new UserError("Trip not found.");
      const after = await tx.gigMileage.update({ where: { id }, data });
      await audit(tx, ownerId, "GigMileage", id, "update", before, after);
      return after;
    }
    const m = await tx.gigMileage.create({ data: { ownerId, ...data } });
    await audit(tx, ownerId, "GigMileage", m.id, "create", undefined, m);
    return m;
  });
}

export async function archiveMileage(ownerId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const m = await tx.gigMileage.findFirst({ where: { id, ownerId, archivedAt: null } });
    if (!m) throw new UserError("Trip not found.");
    if (m.sessionId) throw new UserError("These miles belong to a work session. Edit the session to change them.");
    await tx.gigMileage.update({ where: { id }, data: { archivedAt: new Date() } });
    await audit(tx, ownerId, "GigMileage", id, "archive", m);
  });
}

export async function listMileage(ownerId: string, from: LocalDate, to: LocalDate) {
  const rows = await prisma.gigMileage.findMany({
    where: { ownerId, archivedAt: null, tripDate: { gte: localToDbDate(from), lte: localToDbDate(to) } },
    include: { platform: true },
    orderBy: [{ tripDate: "desc" }, { createdAt: "desc" }],
  });
  return rows.map((m) => ({
    id: m.id, tripDate: dateToLocal(m.tripDate), platformId: m.platformId, platform: m.platform?.name ?? null, milesHundredths: m.milesHundredths,
    purpose: m.purpose, odometerStartTenths: m.odometerStartTenths, odometerEndTenths: m.odometerEndTenths, notes: m.notes, fromSession: !!m.sessionId,
  }));
}

// ───────────────────────── Payouts (the only path into the ledger) ─────────────────────────

export interface PayoutInput {
  platformId: string;
  netCents: number;
  depositDate: LocalDate;
  externalRef?: string | null;
  notes?: string | null;
  sessionIds: string[];
  /** You confirmed this is a different payout from one with the same source, date and amount. */
  confirmSeparate?: boolean;
  idempotencyKey: string;
}

/**
 * Confirm a payout that actually reached your bank. Creates exactly one GIG ledger deposit.
 * Idempotent per key; a same-source/same-date/same-amount payout needs explicit confirmation;
 * an owner-level advisory lock serialises concurrent confirmations so duplicates can't race in.
 */
export async function confirmPayout(ownerId: string, i: PayoutInput) {
  if (!IDEMPOTENCY_KEY_RE.test(i.idempotencyKey)) throw new UserError("Missing request key. Refresh and try again.");
  if (!Number.isSafeInteger(i.netCents) || i.netCents <= 0 || i.netCents > 10_000_000) throw new UserError("Enter the amount that reached your account.");
  if (!isLocalDate(i.depositDate)) throw new UserError("Enter the date the money arrived.");
  const ref = i.externalRef?.trim().slice(0, 80) || null;
  const sessionIds = [...new Set(i.sessionIds)].sort();
  const hash = requestHash({ op: "gig-payout", ownerId, platformId: i.platformId, netCents: i.netCents, date: i.depositDate, ref, sessionIds, notes: i.notes?.trim() || null });
  const replay = async () => {
    const prior = await prisma.gigPayout.findUnique({ where: { idempotencyKey: i.idempotencyKey } });
    if (!prior) return null;
    if (prior.ownerId !== ownerId || prior.requestHash !== hash) throw new UserError("This confirmation was already used for different data. Refresh and try again.");
    return prior;
  };
  const prior = await replay();
  if (prior) return prior;
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${"gig-payout:" + ownerId}))`;
      const again = await tx.gigPayout.findUnique({ where: { idempotencyKey: i.idempotencyKey } });
      if (again) {
        if (again.requestHash !== hash || again.ownerId !== ownerId) throw new UserError("This confirmation was already used for different data. Refresh and try again.");
        return again;
      }
      const platform = await ownPlatform(tx, ownerId, i.platformId, true);
      if (ref) {
        const dupRef = await tx.gigPayout.findFirst({ where: { ownerId, platformId: platform.id, externalRef: ref, voidedAt: null } });
        if (dupRef) throw new UserError(`Payout ${ref} from ${platform.name} is already confirmed.`);
      }
      const same = await tx.gigPayout.findFirst({
        where: { ownerId, platformId: platform.id, voidedAt: null, deposit: { netCents: i.netCents, actualDepositDate: localToDbDate(i.depositDate) } },
      });
      if (same && !i.confirmSeparate) {
        throw new UserError(`A ${formatCents(i.netCents)} ${platform.name} payout on this date is already confirmed. If this really is a second payout, tick “This is a separate payout”.`);
      }
      if (sessionIds.length) {
        await tx.$queryRaw`SELECT id FROM "GigSession" WHERE id IN (${Prisma.join(sessionIds)}) FOR UPDATE`;
        const sessions = await tx.gigSession.findMany({ where: { id: { in: sessionIds }, ownerId } });
        if (sessions.length !== sessionIds.length) throw new UserError("Some sessions weren't found.");
        if (sessions.some((s) => s.archivedAt)) throw new UserError("A removed session can't be included in a payout.");
        if (sessions.some((s) => s.payoutId)) throw new UserError("A session is already part of another confirmed payout.");
        if (sessions.some((s) => s.platformId !== platform.id)) throw new UserError(`Only ${platform.name} sessions can be included in a ${platform.name} payout.`);
      }
      const deposit = await tx.incomeDeposit.create({
        data: { ownerId, kind: "GIG", paydayId: null, netCents: i.netCents, actualDepositDate: localToDbDate(i.depositDate), notes: `${platform.name} payout${ref ? ` ${ref}` : ""}` },
      });
      const payout = await tx.gigPayout.create({
        data: { ownerId, platformId: platform.id, depositId: deposit.id, externalRef: ref, notes: i.notes?.trim().slice(0, 300) || null, idempotencyKey: i.idempotencyKey, requestHash: hash },
      });
      if (sessionIds.length) await tx.gigSession.updateMany({ where: { id: { in: sessionIds } }, data: { status: "PAID", payoutId: payout.id, version: { increment: 1 } } });
      await audit(tx, ownerId, "IncomeDeposit", deposit.id, "confirm-gig-payout", undefined, deposit);
      await audit(tx, ownerId, "GigPayout", payout.id, "confirm", undefined, { ...payout, sessionIds });
      return payout;
    }, TX_OPTS);
  } catch (e) {
    if (isUniqueViolation(e)) {
      const again = await replay();
      if (again) return again;
      throw new UserError("This payout is already confirmed.");
    }
    throw e;
  }
}

/**
 * Correction: void a payout recorded by mistake (both the payout and its deposit stay as history),
 * then re-enter it. Refused while any of the money is reserved or completed in a plan.
 */
export async function voidPayout(ownerId: string, payoutId: string, reason: string) {
  const why = reason.trim();
  if (why.length < 3) throw new UserError("Add a short reason for the correction.");
  try {
    return await prisma.$transaction(async (tx) => {
      const p = await tx.gigPayout.findFirst({ where: { id: payoutId, ownerId } });
      if (!p || p.voidedAt) throw new UserError("Payout not found.");
      await tx.$queryRaw`SELECT id FROM "IncomeDeposit" WHERE id = ${p.depositId} FOR UPDATE`;
      const committed = await tx.allocationLine.count({ where: { plan: { depositId: p.depositId }, status: { in: ["RESERVED", "COMPLETED"] } } });
      if (committed) throw new UserError("Money from this payout is already approved or completed in a plan. Cancel or reverse those allocations first.");
      await tx.allocationPlan.updateMany({ where: { depositId: p.depositId, status: "DRAFT" }, data: { status: "CANCELLED", closedAt: new Date() } });
      const now = new Date();
      const d = await tx.incomeDeposit.update({ where: { id: p.depositId }, data: { voidedAt: now, voidReason: why.slice(0, 200) } });
      const after = await tx.gigPayout.update({ where: { id: p.id }, data: { voidedAt: now, voidReason: why.slice(0, 200) } });
      await tx.gigSession.updateMany({ where: { payoutId: p.id }, data: { status: "PENDING", payoutId: null, version: { increment: 1 } } });
      await audit(tx, ownerId, "IncomeDeposit", d.id, `void: ${why.slice(0, 200)}`, undefined, d);
      await audit(tx, ownerId, "GigPayout", p.id, `void: ${why.slice(0, 200)}`, p, after);
    }, TX_OPTS);
  } catch (e) {
    if (isLedgerViolation(e)) throw new UserError("Money from this payout is committed in a plan. Cancel or reverse those allocations first.");
    throw e;
  }
}

export async function listPayouts(ownerId: string, opts: { from?: LocalDate; to?: LocalDate; includeVoided?: boolean } = {}) {
  const rows = await prisma.gigPayout.findMany({
    where: {
      ownerId, ...(opts.includeVoided ? {} : { voidedAt: null }),
      ...(opts.from || opts.to ? { deposit: { actualDepositDate: { ...(opts.from ? { gte: localToDbDate(opts.from) } : {}), ...(opts.to ? { lte: localToDbDate(opts.to) } : {}) } } } : {}),
    },
    include: { platform: true, deposit: true, sessions: true },
    orderBy: [{ deposit: { actualDepositDate: "desc" } }, { createdAt: "desc" }],
  });
  const lines = await prisma.allocationLine.findMany({ where: { plan: { depositId: { in: rows.map((r) => r.depositId) } }, status: { in: ["RESERVED", "COMPLETED"] } }, include: { plan: { select: { depositId: true } } } });
  return rows.map((p) => {
    const committed = lines.filter((l) => l.plan.depositId === p.depositId).reduce((a, l) => a + (l.status === "COMPLETED" ? (l.paidCents ?? 0) : l.amountCents), 0);
    return {
      id: p.id, platform: p.platform.name, platformId: p.platformId, depositId: p.depositId, date: dateToLocal(p.deposit.actualDepositDate), netCents: p.deposit.netCents,
      externalRef: p.externalRef, notes: p.notes, sessions: p.sessions.length, sessionEarningsCents: p.sessions.reduce((a, s) => a + sessionEarnings(s), 0),
      voidedAt: p.voidedAt, voidReason: p.voidReason, committedCents: committed, availableCents: p.voidedAt ? 0 : p.deposit.netCents - committed,
    };
  });
}

// ───────────────────────── Summaries ─────────────────────────

export interface GigSummary {
  from: LocalDate; to: LocalDate;
  totals: GigTotals;
  byPlatform: { platformId: string; name: string; totals: GigTotals; payoutsCents: number }[];
  payoutsCents: number;
  payoutCount: number;
  target: { monthlyTargetCents: number; pct: number | null; remainingCents: number } | null;
  settings: { taxReserveBps: number | null; costPerMileMills: number | null; monthlyTargetCents: number };
}

export async function gigSummary(ownerId: string, from: LocalDate, to: LocalDate, opts: { monthTarget?: boolean } = {}): Promise<GigSummary> {
  const settings = await ensureGigSetup(ownerId);
  const range = { gte: localToDbDate(from), lte: localToDbDate(to) };
  const [sessions, mileage, payouts, platforms] = await Promise.all([
    prisma.gigSession.findMany({ where: { ownerId, archivedAt: null, workDate: range } }),
    prisma.gigMileage.findMany({ where: { ownerId, archivedAt: null, tripDate: range } }),
    prisma.gigPayout.findMany({ where: { ownerId, voidedAt: null, deposit: { actualDepositDate: range, voidedAt: null } }, include: { deposit: true } }),
    prisma.gigPlatform.findMany({ where: { ownerId }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);
  const s = { taxReserveBps: settings.taxReserveBps, costPerMileMills: settings.costPerMileMills };
  const totals = gigTotals(sessions, mileage, s);
  const byPlatform = platforms
    .map((p) => ({
      platformId: p.id, name: p.name,
      totals: gigTotals(sessions.filter((x) => x.platformId === p.id), mileage.filter((m) => m.platformId === p.id), s),
      payoutsCents: payouts.filter((x) => x.platformId === p.id).reduce((a, x) => a + x.deposit.netCents, 0),
    }))
    .filter((p) => p.totals.sessions || p.payoutsCents || p.totals.milesHundredths);
  const payoutsCents = payouts.reduce((a, x) => a + x.deposit.netCents, 0);
  return {
    from, to, totals, byPlatform, payoutsCents, payoutCount: payouts.length,
    target: opts.monthTarget ? { monthlyTargetCents: settings.monthlyTargetCents, ...targetProgress(totals.earningsCents, settings.monthlyTargetCents) } : null,
    settings: { ...s, monthlyTargetCents: settings.monthlyTargetCents },
  };
}

// ───────────────────────── Scheduling ─────────────────────────

/**
 * Plan a gig shift on the calendar. A planned shift is never work done and never income.
 * Conflicts (e.g. a DOC shift) block it unless you explicitly override. Nothing else is moved.
 */
export async function planGigShift(ownerId: string, tz: string, i: { platformId: string; date: LocalDate; time: string; durationMin: number; targetCents?: number | null }, override: boolean): Promise<{ created: { id: string } | null; check: ScheduleCheck }> {
  const platform = await ownPlatform(prisma, ownerId, i.platformId);
  if (i.targetCents != null && (!Number.isSafeInteger(i.targetCents) || i.targetCents < 0)) throw new UserError("Target must be a dollar amount.");
  return createSession(ownerId, tz, {
    title: `${platform.name} shift`, category: "GIG", date: i.date, time: i.time, durationMin: i.durationMin, optional: true,
    description: i.targetCents ? `Optional target ${formatCents(i.targetCents)} — planned, not earned.` : "Planned — not earned.",
  }, override);
}

export async function plannedShifts(ownerId: string, from: Date, to: Date) {
  const events = await prisma.calendarEvent.findMany({ where: { ownerId, category: "GIG", rrule: null, startAt: { gte: from, lt: to } }, orderBy: { startAt: "asc" } });
  const logged = await prisma.gigSession.findMany({ where: { ownerId, archivedAt: null, plannedEventId: { in: events.map((e) => e.id) } }, select: { plannedEventId: true } });
  const done = new Set(logged.map((l) => l.plannedEventId));
  return events.map((e) => ({ id: e.id, title: e.title, startAt: e.startAt, endAt: e.endAt, description: e.description, logged: done.has(e.id) }));
}

// ───────────────────────── Tax-prep export ─────────────────────────

export async function gigCsv(ownerId: string, kind: "sessions" | "mileage" | "payouts", from: LocalDate, to: LocalDate): Promise<string> {
  const range = { gte: localToDbDate(from), lte: localToDbDate(to) };
  const rows: (string | number | null)[][] = [];
  if (kind === "sessions") {
    rows.push(["date", "source", "minutes", "gross_reported", "tips", "tips_in_gross", "bonus", "bonus_in_gross", "total_earnings", "parking_tolls", "other_expenses", "miles", "status", "payout_date"]);
    const s = await prisma.gigSession.findMany({ where: { ownerId, archivedAt: null, workDate: range }, include: { platform: true, mileage: true, payout: { include: { deposit: true } } }, orderBy: { workDate: "asc" } });
    for (const x of s) rows.push([
      dateToLocal(x.workDate), x.platform.name, x.minutes, centsToDecimal(x.grossCents), centsToDecimal(x.tipsCents), x.tipsInGross ? "yes" : "no",
      centsToDecimal(x.bonusCents), x.bonusInGross ? "yes" : "no", centsToDecimal(sessionEarnings(x)), centsToDecimal(x.parkingTollsCents), centsToDecimal(x.otherExpenseCents),
      x.mileage && !x.mileage.archivedAt ? (x.mileage.milesHundredths / 100).toFixed(2) : "", x.status.toLowerCase(), x.payout && !x.payout.voidedAt ? dateToLocal(x.payout.deposit.actualDepositDate) : "",
    ]);
  } else if (kind === "mileage") {
    rows.push(["date", "source", "miles", "business_purpose", "odometer_start", "odometer_end", "from_work_session"]);
    const m = await prisma.gigMileage.findMany({ where: { ownerId, archivedAt: null, tripDate: range }, include: { platform: true }, orderBy: { tripDate: "asc" } });
    for (const x of m) rows.push([dateToLocal(x.tripDate), x.platform?.name ?? "", (x.milesHundredths / 100).toFixed(2), x.purpose, x.odometerStartTenths !== null ? (x.odometerStartTenths / 10).toFixed(1) : "", x.odometerEndTenths !== null ? (x.odometerEndTenths / 10).toFixed(1) : "", x.sessionId ? "yes" : "no"]);
  } else {
    rows.push(["deposit_date", "source", "net_deposited", "platform_payout_id", "sessions_included", "status"]);
    const p = await prisma.gigPayout.findMany({ where: { ownerId, deposit: { actualDepositDate: range } }, include: { platform: true, deposit: true, sessions: true }, orderBy: { deposit: { actualDepositDate: "asc" } } });
    for (const x of p) rows.push([dateToLocal(x.deposit.actualDepositDate), x.platform.name, centsToDecimal(x.deposit.netCents), x.externalRef ?? "", x.sessions.length, x.voidedAt ? "voided (correction)" : "confirmed"]);
  }
  const header = `# LEVEL UP 2027 gig ${kind} ${from} to ${to}. Records you entered; not tax advice. Verify deductibility with a tax professional.`;
  return [header, ...rows.map((r) => r.map(csvCell).join(","))].join("\r\n") + "\r\n";
}

