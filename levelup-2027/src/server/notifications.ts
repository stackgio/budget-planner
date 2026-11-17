import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { UserError } from "./payroll";
import { encrypt, readPrivate } from "./crypto";
import { isUniqueViolation } from "./idempotency";
import { currentMode } from "./modes";
import { loadOccurrences } from "./calendar";
import { nextAnniversary } from "@/domain/growth";
import { extraPaycheckMonths } from "@/domain/payroll";
import { type LocalDate, addDays, dateToLocal, localToDbDate, todayLocal, zonedToInstant, instantToLocalDate } from "@/domain/dates";
import {
  ALL_CATEGORIES, BRIEFING_SECTIONS, DEFAULT_PREFS, decide, planDay, publicText,
  type Category, type DayFacts, type ModeRule, type Prefs, type Priority, type WorkMode,
} from "@/domain/notify";
import { type PushSender, defaultPushSender } from "./push";

const TZ_DEFAULT = "America/New_York";
const MAX_PUSH_ATTEMPTS = 3;
const SCHEDULER_LOCK = 20_270_404;

// ───────────────────────── Preferences ─────────────────────────

export async function getPrefs(ownerId: string): Promise<Prefs & { briefingSections: string[] }> {
  const [row, settings] = await Promise.all([
    prisma.notificationPreference.upsert({
      where: { ownerId },
      create: { ownerId, categories: DEFAULT_PREFS.categories, modeRules: DEFAULT_PREFS.modeRules, briefingSections: [...BRIEFING_SECTIONS] },
      update: {},
    }),
    prisma.userSettings.findUnique({ where: { userId: ownerId } }),
  ]);
  return {
    quietStart: row.quietStart, quietEnd: row.quietEnd,
    categories: { ...DEFAULT_PREFS.categories, ...(row.categories as Partial<Record<Category, boolean>>) },
    modeRules: { ...DEFAULT_PREFS.modeRules, ...(row.modeRules as Partial<Record<string, ModeRule>>) },
    previewDetail: row.previewDetail, briefingEnabled: row.briefingEnabled, checkInEnabled: row.checkInEnabled, reflectionEnabled: row.reflectionEnabled,
    briefingTime: settings?.briefingTime ?? "06:00", checkInTime: settings?.checkInTime ?? "17:00", reflectionTime: settings?.reflectionTime ?? "21:00",
    briefingSections: row.briefingSections,
  };
}

export async function savePrefs(ownerId: string, p: Partial<{
  quietStart: string; quietEnd: string; categories: Partial<Record<Category, boolean>>; modeRules: Partial<Record<"OVERTIME" | "ACTIVATION" | "RECOVERY", ModeRule>>;
  previewDetail: boolean; briefingEnabled: boolean; checkInEnabled: boolean; reflectionEnabled: boolean; briefingSections: string[];
}>) {
  await getPrefs(ownerId);
  if (p.categories && Object.keys(p.categories).some((k) => !ALL_CATEGORIES.includes(k as Category))) throw new UserError("Unknown category.");
  if (p.briefingSections && p.briefingSections.some((s) => !(BRIEFING_SECTIONS as readonly string[]).includes(s))) throw new UserError("Unknown briefing section.");
  await prisma.notificationPreference.update({ where: { ownerId }, data: p as Prisma.NotificationPreferenceUpdateInput });
}

// ───────────────────────── Facts (read-only, from stored records) ─────────────────────────

export async function gatherFacts(ownerId: string, tz: string, day: LocalDate): Promise<DayFacts> {
  const from = localToDbDate(day), to = localToDbDate(addDays(day, 3));
  const [paydays, reg, schedule, waitingLines, milestones, jobs, important, dates, faith] = await Promise.all([
    prisma.payday.findMany({ where: { ownerId, officialDate: { gte: from, lte: to }, status: "EXPECTED" } }),
    prisma.payday.findMany({ where: { ownerId, kind: "REGULAR", status: { not: "SKIPPED" }, officialDate: { gte: localToDbDate(addDays(day, -10)), lte: localToDbDate(addDays(day, 70)) } }, select: { officialDate: true } }),
    prisma.paySchedule.findUnique({ where: { ownerId_kind: { ownerId, kind: "REGULAR" } } }),
    prisma.allocationLine.findMany({ where: { status: "RESERVED", plan: { ownerId } }, select: { target: true, tileId: true, plan: { select: { approvedAt: true } } } }),
    prisma.goalMilestone.findMany({ where: { completedAt: null, archivedAt: null, dueDate: { gte: from, lte: to }, goal: { ownerId, status: { in: ["ACTIVE", "NOT_STARTED"] } } }, include: { goal: { select: { id: true, category: true } } } }),
    prisma.jobOpportunity.findMany({ where: { ownerId, status: { notIn: ["CLOSED", "NOT_PURSUING"] }, OR: [{ deadline: { gte: from, lte: to } }, { interviewOn: { gte: from, lte: to } }] } }),
    prisma.importantDate.findMany({ where: { ownerId } }),
    prisma.datePlan.findMany({ where: { ownerId, status: "PLANNED", date: { gte: from, lte: localToDbDate(addDays(day, 1)) } } }),
    prisma.reminderPreference.findMany({ where: { ownerId, enabled: true, key: { startsWith: "faith." } } }),
  ]);
  const occ = await loadOccurrences(ownerId, tz, zonedToInstant(day, "00:00", tz), zonedToInstant(addDays(day, 1), "00:00", tz), { includePaydays: false, includeTasks: false });
  const oldest = waitingLines.map((l) => l.plan.approvedAt).filter((d): d is Date => !!d).sort((a, b) => a.getTime() - b.getTime())[0];
  return {
    day,
    paydays: paydays.map((p) => ({ kind: p.kind, officialDate: dateToLocal(p.officialDate), provisional: p.kind === "REGULAR" && !schedule?.anchorVerified })),
    extraMonths: extraPaycheckMonths(reg.map((r) => dateToLocal(r.officialDate))).map((m) => ({ ...m, provisional: !schedule?.anchorVerified })),
    waiting: {
      roth: waitingLines.filter((l) => l.target === "ROTH").length,
      tiles: waitingLines.filter((l) => l.tileId).length,
      other: waitingLines.filter((l) => l.target !== "ROTH" && !l.tileId).length,
      oldestApprovedDay: oldest ? instantToLocalDate(oldest, tz) : null,
    },
    milestones: milestones.map((m) => ({ id: m.id, title: m.title, dueDate: dateToLocal(m.dueDate!), category: m.goal.category, goalId: m.goal.id })),
    jobs: jobs.map((j) => ({ id: j.id, title: j.title, deadline: j.deadline ? dateToLocal(j.deadline) : null, interviewOn: j.interviewOn ? dateToLocal(j.interviewOn) : null })),
    workouts: occ.filter((o) => o.category === "WORKOUT").map((o) => ({ key: o.key, title: o.title, start: o.start })),
    dates: dates.filter((d) => d.startTime).map((d) => ({ id: d.id, title: d.title, start: zonedToInstant(dateToLocal(d.date), d.startTime!, tz) })),
    importantDates: important.map((i) => ({ id: i.id, title: i.title, next: nextAnniversary(i.month, i.day, day) })),
    faithReminders: faith.map((r) => ({ key: r.key, label: r.key === "faith.prayer" ? "Prayer reminder" : "Bible reading reminder", time: r.time, days: r.days })),
  };
}

// ───────────────────────── Scheduler ─────────────────────────

export interface RunResult { skipped?: boolean; created: number; delivered: number; deferred: number; suppressed: number; expired: number; pushed: number; failed: number }

/** Generate today's and tomorrow's reminders (idempotent via unique dedupe keys). */
export async function generateFor(ownerId: string, now: Date): Promise<number> {
  const settings = await prisma.userSettings.findUnique({ where: { userId: ownerId } });
  const tz = settings?.timezone ?? TZ_DEFAULT;
  const prefs = await getPrefs(ownerId);
  const today = todayLocal(tz, now);
  let created = 0;
  for (const day of [today, addDays(today, 1)]) {
    const candidates = planDay(await gatherFacts(ownerId, tz, day), prefs, tz).filter((c) => c.expiresAt > now);
    if (!candidates.length) continue;
    const r = await prisma.notification.createMany({
      data: candidates.map((c) => {
        const pub = publicText(c, prefs.previewDetail);
        return {
          ownerId, kind: c.kind, category: c.category, priority: c.priority, title: pub.title, preview: pub.preview, detailCipher: encrypt(c.detail),
          href: c.href, dedupeKey: c.dedupeKey, scheduledFor: c.scheduledFor, expiresAt: c.expiresAt,
        };
      }),
      skipDuplicates: true,
    });
    created += r.count;
  }
  return created;
}

/**
 * One scheduler tick. Safe to run from several workers at once and after restarts:
 * - generation is idempotent (unique owner+dedupe key),
 * - due rows are claimed with FOR UPDATE SKIP LOCKED inside a transaction and change state atomically,
 * - push deliveries are keyed by (notification, device, round), so retries never double-send a round.
 */
export async function runScheduler(opts: { now?: Date; worker?: string; push?: PushSender } = {}): Promise<RunResult> {
  const now = opts.now ?? new Date();
  const push = opts.push ?? defaultPushSender();
  const res: RunResult = { created: 0, delivered: 0, deferred: 0, suppressed: 0, expired: 0, pushed: 0, failed: 0 };
  const run = await prisma.schedulerRun.create({ data: { worker: opts.worker ?? "local" } });
  try {
    for (const u of await prisma.user.findMany({ select: { id: true } })) res.created += await generateFor(u.id, now);

    const deliveredIds: string[] = await prisma.$transaction(async (tx) => {
      const due = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Notification"
         WHERE (status = 'SCHEDULED' AND "scheduledFor" <= ${now})
            OR (status IN ('DEFERRED','SNOOZED') AND "snoozedUntil" <= ${now})
         ORDER BY "scheduledFor" LIMIT 500 FOR UPDATE SKIP LOCKED`;
      if (!due.length) return [];
      const rows = await tx.notification.findMany({ where: { id: { in: due.map((d) => d.id) } } });
      const ownerCtx = new Map<string, { tz: string; prefs: Prefs; mode: WorkMode }>();
      const ids: string[] = [];
      for (const n of rows) {
        let c = ownerCtx.get(n.ownerId);
        if (!c) {
          const s = await tx.userSettings.findUnique({ where: { userId: n.ownerId } });
          const m = await currentMode(n.ownerId);
          c = { tz: s?.timezone ?? TZ_DEFAULT, prefs: await getPrefs(n.ownerId), mode: (m?.mode ?? "NORMAL") as WorkMode };
          ownerCtx.set(n.ownerId, c);
        }
        const dueAt = n.status === "SCHEDULED" ? n.scheduledFor : n.snoozedUntil!;
        const d = decide({ category: n.category as Category, priority: n.priority as Priority, dueAt, expiresAt: n.status === "SNOOZED" ? new Date(Math.max(n.expiresAt.getTime(), n.snoozedUntil!.getTime() + 3_600_000)) : n.expiresAt }, { now, ...c });
        if (d.action === "WAIT") continue;
        if (d.action === "DELIVER") {
          await tx.notification.update({ where: { id: n.id }, data: { status: "DELIVERED", deliveredAt: now, readAt: n.status === "SNOOZED" ? null : n.readAt, snoozedUntil: null, reason: null } });
          ids.push(n.id);
          res.delivered++;
        } else if (d.action === "DEFER") {
          await tx.notification.update({ where: { id: n.id }, data: { status: "DEFERRED", snoozedUntil: d.until, reason: d.reason } });
          res.deferred++;
        } else if (d.action === "SUPPRESS") {
          await tx.notification.update({ where: { id: n.id }, data: { status: "SUPPRESSED", reason: d.reason, snoozedUntil: null } });
          res.suppressed++;
        } else {
          await tx.notification.update({ where: { id: n.id }, data: { status: "EXPIRED", reason: d.reason, snoozedUntil: null } });
          res.expired++;
        }
      }
      return ids;
    }, { timeout: 30_000 });

    const pushed = await pushDelivered(deliveredIds, push, now);
    res.pushed = pushed.sent;
    res.failed = pushed.failed;
    await prisma.schedulerRun.update({ where: { id: run.id }, data: { finishedAt: new Date(), created: res.created, delivered: res.delivered, deferred: res.deferred, suppressed: res.suppressed, expired: res.expired, failed: res.failed } });
    return res;
  } catch (e) {
    await prisma.schedulerRun.update({ where: { id: run.id }, data: { finishedAt: new Date(), error: e instanceof Error ? e.name : "error" } });
    throw e;
  }
}

/** Push newly delivered notifications, plus bounded retries of earlier failed attempts. */
async function pushDelivered(ids: string[], sender: PushSender, now: Date) {
  let sent = 0, failed = 0;
  if (!sender.enabled) return { sent, failed };
  const fresh = ids.length ? await prisma.notification.findMany({ where: { id: { in: ids } } }) : [];
  const retries = await prisma.pushDelivery.findMany({
    where: { status: "FAILED", attempts: { lt: MAX_PUSH_ATTEMPTS }, notification: { status: "DELIVERED", expiresAt: { gt: now } }, subscription: { revokedAt: null } },
    include: { notification: true, subscription: true }, take: 200,
  });
  const jobs: { n: (typeof fresh)[number]; subId: string; round: number }[] = [];
  for (const n of fresh) {
    const subs = await prisma.pushSubscription.findMany({ where: { ownerId: n.ownerId, revokedAt: null } });
    for (const s of subs) jobs.push({ n, subId: s.id, round: n.snoozeCount });
  }
  for (const r of retries) jobs.push({ n: r.notification, subId: r.subscriptionId, round: r.round });

  for (const j of jobs) {
    // Claim the (notification, device, round) slot. A unique violation means another worker owns it.
    let delivery = await prisma.pushDelivery.findUnique({ where: { notificationId_subscriptionId_round: { notificationId: j.n.id, subscriptionId: j.subId, round: j.round } } });
    if (!delivery) {
      try {
        delivery = await prisma.pushDelivery.create({ data: { notificationId: j.n.id, subscriptionId: j.subId, round: j.round, status: "FAILED", attempts: 0, lastError: "pending" } });
      } catch (e) {
        if (isUniqueViolation(e)) continue;
        throw e;
      }
    }
    if (delivery.status !== "FAILED" || delivery.attempts >= MAX_PUSH_ATTEMPTS) continue;
    const claimed = await prisma.pushDelivery.updateMany({ where: { id: delivery.id, attempts: delivery.attempts, status: "FAILED" }, data: { attempts: { increment: 1 } } });
    if (!claimed.count) continue; // another worker is sending this one
    const sub = await prisma.pushSubscription.findUniqueOrThrow({ where: { id: j.subId } });
    const r = await sender.send({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, { title: j.n.title, body: j.n.preview, url: j.n.href, tag: j.n.dedupeKey });
    if (r.ok) {
      sent++;
      await prisma.pushDelivery.update({ where: { id: delivery.id }, data: { status: "SENT", lastError: null } });
      await prisma.pushSubscription.update({ where: { id: sub.id }, data: { lastSuccessAt: now, failureCount: 0 } });
    } else if ("gone" in r && r.gone) {
      failed++;
      await prisma.pushDelivery.update({ where: { id: delivery.id }, data: { status: "GONE", lastError: r.error } });
      await prisma.pushSubscription.update({ where: { id: sub.id }, data: { revokedAt: now } });
    } else {
      failed++;
      await prisma.pushDelivery.update({ where: { id: delivery.id }, data: { lastError: r.error.slice(0, 200) } });
      await prisma.pushSubscription.update({ where: { id: sub.id }, data: { failureCount: { increment: 1 } } });
    }
  }
  return { sent, failed };
}

/** Non-blocking lock so overlapping cron ticks simply skip instead of piling up. */
export async function runSchedulerExclusive(opts: Parameters<typeof runScheduler>[0] = {}): Promise<RunResult> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ locked: boolean }[]>`SELECT pg_try_advisory_xact_lock(${SCHEDULER_LOCK}) AS locked`;
    if (!rows[0]?.locked) return { skipped: true, created: 0, delivered: 0, deferred: 0, suppressed: 0, expired: 0, pushed: 0, failed: 0 };
    return runScheduler(opts);
  }, { timeout: 120_000 });
}

// ───────────────────────── Notification center ─────────────────────────

export async function listNotifications(ownerId: string, opts: { category?: string; includeHistory?: boolean } = {}) {
  const rows = await prisma.notification.findMany({
    where: {
      ownerId, ...(opts.category ? { category: opts.category } : {}),
      status: opts.includeHistory ? { in: ["DELIVERED", "DISMISSED", "SNOOZED", "SUPPRESSED", "EXPIRED", "DEFERRED"] } : { in: ["DELIVERED", "SNOOZED"] },
    },
    orderBy: [{ deliveredAt: "desc" }, { scheduledFor: "desc" }],
    take: 100,
  });
  return rows.map((n) => ({ ...n, detail: readPrivate(n.detailCipher) }));
}

export async function unreadCount(ownerId: string) {
  return prisma.notification.count({ where: { ownerId, status: "DELIVERED", readAt: null } });
}

async function owned(ownerId: string, id: string) {
  const n = await prisma.notification.findFirst({ where: { id, ownerId } });
  if (!n) throw new UserError("Notification not found.");
  return n;
}

export async function markRead(ownerId: string, id: string | "all") {
  if (id === "all") return prisma.notification.updateMany({ where: { ownerId, status: "DELIVERED", readAt: null }, data: { readAt: new Date() } });
  await owned(ownerId, id);
  return prisma.notification.updateMany({ where: { id, ownerId, readAt: null }, data: { readAt: new Date() } });
}

export async function dismissNotification(ownerId: string, id: string) {
  await owned(ownerId, id);
  return prisma.notification.updateMany({ where: { id, ownerId, status: { in: ["DELIVERED", "SNOOZED", "DEFERRED", "SCHEDULED"] } }, data: { status: "DISMISSED", dismissedAt: new Date(), readAt: new Date(), snoozedUntil: null } });
}

export async function snoozeNotification(ownerId: string, id: string, until: Date, now = new Date()) {
  const n = await owned(ownerId, id);
  if (until <= now) throw new UserError("Choose a time in the future.");
  if (until.getTime() - now.getTime() > 7 * 86_400_000) throw new UserError("Snooze for a week at most.");
  if (n.status !== "DELIVERED") throw new UserError("Only delivered notifications can be snoozed.");
  return prisma.notification.update({ where: { id }, data: { status: "SNOOZED", snoozedUntil: until, snoozeCount: { increment: 1 }, readAt: new Date() } });
}

// ───────────────────────── Push subscriptions ─────────────────────────

export async function saveSubscription(ownerId: string, s: { endpoint: string; p256dh: string; auth: string; label?: string | null; userAgent?: string | null }) {
  if (!/^https:\/\//.test(s.endpoint) || s.endpoint.length > 1000) throw new UserError("Invalid subscription endpoint.");
  if (!/^[A-Za-z0-9_-]{20,200}$/.test(s.p256dh) || !/^[A-Za-z0-9_-]{8,100}$/.test(s.auth)) throw new UserError("Invalid subscription keys.");
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint: s.endpoint } });
  if (existing && existing.ownerId !== ownerId) throw new UserError("This device is registered to another account.");
  return prisma.pushSubscription.upsert({
    where: { endpoint: s.endpoint },
    create: { ownerId, endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth, label: s.label ?? null, userAgent: s.userAgent?.slice(0, 200) ?? null },
    update: { p256dh: s.p256dh, auth: s.auth, revokedAt: null, failureCount: 0, label: s.label ?? existing?.label ?? null },
  });
}

export async function removeSubscription(ownerId: string, idOrEndpoint: string) {
  const r = await prisma.pushSubscription.updateMany({ where: { ownerId, OR: [{ id: idOrEndpoint }, { endpoint: idOrEndpoint }], revokedAt: null }, data: { revokedAt: new Date() } });
  return r.count;
}
