import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { seedOwnerConfig } from "@/server/bootstrap";
import { switchMode } from "@/server/modes";
import { planDate } from "@/server/life";
import { dismissNotification, getPrefs, listNotifications, markRead, notificationDiagnostics, removeSubscription, runScheduler, runSchedulerExclusive, saveSubscription, savePrefs, sendSimulatedTest, snoozeNotification, unreadCount } from "@/server/notifications";
import { NoopPushSender, pushTopic, type PushResult, type PushSender, type PushTarget } from "@/server/push";
import { encrypt } from "@/server/crypto";
import { zonedToInstant } from "@/domain/dates";
import { freshOwner } from "./helpers";

const TZ = "America/New_York";
const t = (d: string, hm: string) => zonedToInstant(d, hm, TZ);
let ownerId: string;
beforeEach(async () => { ownerId = (await freshOwner()).id; });

class MockPush implements PushSender {
  readonly name = "mock";
  readonly enabled = true;
  sent: { endpoint: string; body: string; tag: string }[] = [];
  constructor(private behaviour: (n: number) => PushResult = () => ({ ok: true })) {}
  async send(target: PushTarget, payload: { title: string; body: string; url: string; tag: string }): Promise<PushResult> {
    const r = this.behaviour(this.sent.length);
    this.sent.push({ endpoint: target.endpoint, body: payload.body, tag: payload.tag });
    return r;
  }
}
const sub = (n = 1) => saveSubscription(ownerId, { endpoint: `https://push.example.test/sub/${n}`, p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u", auth: "tBHItJI5svbpez7KI4CCXg", label: "Test device" });
const byKey = (key: string) => prisma.notification.findFirstOrThrow({ where: { ownerId, dedupeKey: key } });

describe("generation & delivery", () => {
  it("creates 6 AM / 5 PM / 9 PM items once, delivers on time, never duplicates", async () => {
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    await runScheduler({ now: t("2027-01-12", "05:01"), push: new NoopPushSender() });
    expect(await prisma.notification.count({ where: { ownerId, dedupeKey: { startsWith: "briefing:" } } })).toBe(2); // today + tomorrow
    expect((await byKey("briefing:2027-01-12")).status).toBe("SCHEDULED");
    const r = await runScheduler({ now: t("2027-01-12", "06:01"), push: new NoopPushSender() });
    expect(r.delivered).toBe(1);
    expect((await byKey("briefing:2027-01-12")).status).toBe("DELIVERED");
    expect((await runScheduler({ now: t("2027-01-12", "06:02"), push: new NoopPushSender() })).delivered).toBe(0);
    expect(await unreadCount(ownerId)).toBe(1);
  });

  it("concurrent workers deliver and push each notification exactly once", async () => {
    await sub(1);
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    const push = new MockPush();
    const results = await Promise.all([1, 2, 3].map((i) => runScheduler({ now: t("2027-01-12", "06:01"), push, worker: `w${i}` })));
    expect(results.reduce((a, r) => a + r.delivered, 0)).toBe(1);
    expect(push.sent).toHaveLength(1);
    expect(await prisma.pushDelivery.count()).toBe(1);
  });

  it("the exclusive tick skips while another holds the lock", async () => {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(20270404)::text`;
      expect((await runSchedulerExclusive({ now: t("2027-01-12", "06:01"), push: new NoopPushSender() })).skipped).toBe(true);
    });
  });

  it("no catch-up flood after downtime: stale items expire", async () => {
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    const r = await runScheduler({ now: t("2027-01-14", "12:00"), push: new NoopPushSender() }); // worker down ~2 days
    expect(r.delivered).toBe(0);
    expect((await byKey("briefing:2027-01-12")).status).toBe("EXPIRED");
    expect((await byKey("reflection:2027-01-12")).status).toBe("EXPIRED");
  });
});

describe("quiet hours, work modes and priorities", () => {
  it("defers during quiet hours, then delivers once at quiet end", async () => {
    await prisma.notification.create({ data: { ownerId, kind: "REVIEW", category: "REVIEW", priority: "NORMAL", title: "LEVEL UP", preview: "x", href: "/reviews", dedupeKey: "test:quiet", scheduledFor: t("2027-01-15", "22:00"), expiresAt: t("2027-01-17", "12:00") } });
    await runScheduler({ now: t("2027-01-15", "22:05"), push: new NoopPushSender() });
    const n = await byKey("test:quiet");
    expect([n.status, n.snoozedUntil?.getTime()]).toEqual(["DEFERRED", t("2027-01-16", "05:45").getTime()]);
    await runScheduler({ now: t("2027-01-16", "03:00"), push: new NoopPushSender() });
    expect((await byKey("test:quiet")).status).toBe("DEFERRED");
    await runScheduler({ now: t("2027-01-16", "05:46"), push: new NoopPushSender() });
    expect((await byKey("test:quiet")).status).toBe("DELIVERED");
  });

  for (const mode of ["OVERTIME", "ACTIVATION", "RECOVERY"] as const) {
    it(`${mode.toLowerCase()} suppresses the briefing but important reminders still arrive; no backlog afterwards`, async () => {
      await planDate(ownerId, TZ, { title: "Aquarium", date: "2027-01-12", startTime: "18:30", durationMin: 150, budgetCents: null, letter: null, notes: null });
      await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
      await switchMode(ownerId, mode, { now: t("2027-01-12", "05:30") });
      await runScheduler({ now: t("2027-01-12", "06:01"), push: new NoopPushSender() });
      expect((await byKey("briefing:2027-01-12")).status).toBe("SUPPRESSED");
      await runScheduler({ now: t("2027-01-12", "15:31"), push: new NoopPushSender() });
      const date = await prisma.notification.findFirstOrThrow({ where: { ownerId, category: "RELATIONSHIP" } });
      expect([date.priority, date.status]).toEqual(["IMPORTANT", "DELIVERED"]);
      await switchMode(ownerId, "NORMAL", { now: t("2027-01-12", "16:00") });
      await runScheduler({ now: t("2027-01-12", "16:01"), push: new NoopPushSender() });
      expect((await byKey("briefing:2027-01-12")).status).toBe("SUPPRESSED"); // not re-sent later
      // Mode changes never touch tasks, habits or calendar records.
      expect(await prisma.calendarEvent.count({ where: { ownerId, category: "DATE_NIGHT" } })).toBe(1);
    });
  }

  it("a mode can be set to deliver everything; disabled categories never deliver", async () => {
    await savePrefs(ownerId, { modeRules: { OVERTIME: "ALL", ACTIVATION: "IMPORTANT_ONLY", RECOVERY: "IMPORTANT_ONLY" }, categories: { CHECKIN: false } });
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    await switchMode(ownerId, "OVERTIME", { now: t("2027-01-12", "05:30") });
    await runScheduler({ now: t("2027-01-12", "06:01"), push: new NoopPushSender() });
    expect((await byKey("briefing:2027-01-12")).status).toBe("DELIVERED");
    await runScheduler({ now: t("2027-01-12", "17:01"), push: new NoopPushSender() });
    expect((await byKey("checkin:2027-01-12")).status).toBe("SUPPRESSED");
  });
});

describe("notification center actions", () => {
  it("read, snooze (re-delivers once), dismiss — all persisted", async () => {
    await sub(1);
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    const push = new MockPush();
    await runScheduler({ now: t("2027-01-12", "06:01"), push });
    const n = await byKey("briefing:2027-01-12");
    await markRead(ownerId, n.id);
    expect(await unreadCount(ownerId)).toBe(0);
    await snoozeNotification(ownerId, n.id, t("2027-01-12", "07:00"), t("2027-01-12", "06:05"));
    await runScheduler({ now: t("2027-01-12", "06:30"), push });
    expect((await byKey("briefing:2027-01-12")).status).toBe("SNOOZED");
    await runScheduler({ now: t("2027-01-12", "07:01"), push });
    await runScheduler({ now: t("2027-01-12", "07:02"), push });
    const after = await byKey("briefing:2027-01-12");
    expect([after.status, after.readAt]).toEqual(["DELIVERED", null]); // unread again
    expect(push.sent).toHaveLength(2); // original + one snooze round, never more
    await dismissNotification(ownerId, n.id);
    expect((await listNotifications(ownerId)).some((x) => x.id === n.id)).toBe(false);
    expect((await listNotifications(ownerId, { includeHistory: true })).find((x) => x.id === n.id)?.status).toBe("DISMISSED");
    await expect(snoozeNotification(ownerId, n.id, t("2027-01-12", "06:00"), t("2027-01-12", "08:00"))).rejects.toThrow(/future/);
  });

  it("private details are encrypted at rest; lock-screen preview is generic by default", async () => {
    await planDate(ownerId, TZ, { title: "Secret anniversary dinner", date: "2027-01-12", startTime: "18:30", durationMin: 150, budgetCents: null, letter: null, notes: null });
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    const n = await prisma.notification.findFirstOrThrow({ where: { ownerId, category: "RELATIONSHIP" } });
    expect(n.preview).not.toContain("anniversary");
    expect(n.detailCipher).not.toContain("anniversary");
    await runScheduler({ now: t("2027-01-12", "15:31"), push: new NoopPushSender() });
    expect((await listNotifications(ownerId)).find((x) => x.id === n.id)?.detail).toMatch(/Secret anniversary dinner/);
  });
});

describe("push delivery: unavailable, retries, restarts, revoked devices", () => {
  it("push unavailable → still delivered in-app, nothing pushed", async () => {
    await sub(1);
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    await runScheduler({ now: t("2027-01-12", "06:01"), push: new NoopPushSender() });
    expect((await byKey("briefing:2027-01-12")).status).toBe("DELIVERED");
    expect(await prisma.pushDelivery.count()).toBe(0);
  });

  it("transient failure retries at most 3 times; success stops retries", async () => {
    await sub(1);
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    const flaky = new MockPush((i) => (i < 2 ? { ok: false, gone: false, error: "503" } : { ok: true }));
    await runScheduler({ now: t("2027-01-12", "06:01"), push: flaky });
    await runScheduler({ now: t("2027-01-12", "06:02"), push: flaky });
    await runScheduler({ now: t("2027-01-12", "06:03"), push: flaky });
    await runScheduler({ now: t("2027-01-12", "06:04"), push: flaky });
    const d = await prisma.pushDelivery.findFirstOrThrow();
    expect([d.status, d.attempts, flaky.sent.length]).toEqual(["SENT", 3, 3]);
    const dead = new MockPush(() => ({ ok: false, gone: false, error: "500" }));
    await runScheduler({ now: t("2027-01-12", "17:01"), push: dead });
    for (const m of ["17:02", "17:03", "17:04", "17:05"]) await runScheduler({ now: t("2027-01-12", m), push: dead });
    expect(dead.sent.length).toBe(3); // bounded
  });

  it("a worker that died mid-send is recovered on the next tick", async () => {
    const s = await sub(1);
    await prisma.notification.create({ data: { ownerId, kind: "REMINDER", category: "GOAL", priority: "NORMAL", title: "LEVEL UP", preview: "x", detailCipher: encrypt("x"), href: "/goals", dedupeKey: "test:crash", scheduledFor: t("2027-01-12", "06:00"), expiresAt: t("2027-01-12", "23:00"), status: "DELIVERED", deliveredAt: t("2027-01-12", "06:00") } });
    const n = await byKey("test:crash");
    await prisma.pushDelivery.create({ data: { notificationId: n.id, subscriptionId: s.id, round: 0, status: "FAILED", attempts: 0, lastError: "pending" } }); // claimed, then crash
    const push = new MockPush();
    await runScheduler({ now: t("2027-01-12", "06:10"), push });
    expect(push.sent.filter((x) => x.tag === "test:crash")).toHaveLength(1);
    expect((await prisma.pushDelivery.findFirstOrThrow({ where: { notificationId: n.id } })).status).toBe("SENT");
  });

  it("410 Gone revokes the device; unsubscribe stops pushes", async () => {
    await sub(1);
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    await runScheduler({ now: t("2027-01-12", "06:01"), push: new MockPush(() => ({ ok: false, gone: true, error: "410" })) });
    expect((await prisma.pushSubscription.findFirstOrThrow()).revokedAt).not.toBeNull();
    await sub(2);
    expect(await removeSubscription(ownerId, "https://push.example.test/sub/2")).toBe(1);
    const push = new MockPush();
    await runScheduler({ now: t("2027-01-12", "17:01"), push });
    expect(push.sent).toHaveLength(0);
  });
});

describe("authorization", () => {
  it("another account can't read, change, or hijack notifications and devices", async () => {
    await sub(1);
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    await runScheduler({ now: t("2027-01-12", "06:01"), push: new NoopPushSender() });
    const n = await byKey("briefing:2027-01-12");
    const other = (await prisma.user.create({ data: { email: "o@example.test", passwordHash: "x" } })).id;
    await seedOwnerConfig(prisma, other);
    await expect(markRead(other, n.id)).rejects.toThrow(/not found/);
    await expect(dismissNotification(other, n.id)).rejects.toThrow(/not found/);
    await expect(snoozeNotification(other, n.id, t("2027-01-12", "09:00"), t("2027-01-12", "07:00"))).rejects.toThrow(/not found/);
    expect((await listNotifications(other)).some((x) => x.id === n.id)).toBe(false);
    await expect(saveSubscription(other, { endpoint: "https://push.example.test/sub/1", p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u", auth: "tBHItJI5svbpez7KI4CCXg" })).rejects.toThrow(/another account/);
    expect(await removeSubscription(other, "https://push.example.test/sub/1")).toBe(0);
    expect((await getPrefs(other)).quietStart).toBe("21:45");
  });
});

describe("Phase 5: simulated test, diagnostics, duplicate mitigation", () => {
  it("the simulated test lands in the notification center and never sends a push", async () => {
    await sub(1); await sub(2);
    const r = await sendSimulatedTest(ownerId);
    expect(r).toMatchObject({ devices: 2, pushSent: false });
    expect(await prisma.pushDelivery.count()).toBe(0);
    expect((await listNotifications(ownerId)).some((n) => n.category === "TEST")).toBe(true);
    // Even a later scheduler run with a live sender doesn't push the test item (it was never "newly delivered").
    const push = new MockPush();
    await runScheduler({ now: new Date(), push });
    expect(push.sent.filter((x) => x.tag.startsWith("test:"))).toHaveLength(0);
  });

  it("diagnostics report worker health, devices and failures without secrets", async () => {
    let d = await notificationDiagnostics(ownerId);
    expect(d.pushConfigured).toBe(false);
    expect(d.worker.lastRunAt).toBeNull();
    await sub(1);
    await runScheduler({ now: new Date(), push: new NoopPushSender() });
    d = await notificationDiagnostics(ownerId);
    expect(d.worker.healthy).toBe(true);
    expect(d.devices.active).toBe(1);
    expect(JSON.stringify(d)).not.toMatch(/endpoint|p256dh|auth"/);
    expect(d.worker.healthy).toBe(true);
    const stale = await notificationDiagnostics(ownerId, new Date(Date.now() + 30 * 60_000));
    expect(stale.worker.healthy).toBe(false);
  });

  it("a send with unknown outcome is not retried for 10 minutes, then retried with the same tag", async () => {
    await sub(1);
    await runScheduler({ now: t("2027-01-12", "05:00"), push: new NoopPushSender() });
    // Simulate a worker that crashed mid-send: claimed (in-flight) but never recorded.
    await runScheduler({ now: t("2027-01-12", "06:01"), push: new NoopPushSender() });
    const n = await byKey("briefing:2027-01-12");
    const s1 = await prisma.pushSubscription.findFirstOrThrow({ where: { ownerId } });
    await prisma.pushDelivery.create({ data: { notificationId: n.id, subscriptionId: s1.id, round: 0, status: "FAILED", attempts: 1, lastError: "in-flight" } });
    await prisma.$executeRaw`UPDATE "PushDelivery" SET "updatedAt" = ${t("2027-01-12", "06:02")}`;
    const push = new MockPush();
    await runScheduler({ now: t("2027-01-12", "06:05"), push });
    expect(push.sent).toHaveLength(0);
    await runScheduler({ now: t("2027-01-12", "06:20"), push });
    expect(push.sent).toHaveLength(1);
    expect(push.sent[0]!.tag).toBe("briefing:2027-01-12"); // same tag → the device replaces, not duplicates
  });

  it("push topics are stable, short and URL-safe", () => {
    expect(pushTopic("briefing:2027-01-12")).toBe(pushTopic("briefing:2027-01-12"));
    expect(pushTopic("briefing:2027-01-12")).not.toBe(pushTopic("briefing:2027-01-13"));
    expect(pushTopic("x")).toMatch(/^[A-Za-z0-9_-]{32}$/);
  });
});
