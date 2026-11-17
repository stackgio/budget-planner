import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { isPublicIp, launchCheck } from "@/server/launch-check";
import { saveSubscription, sendRealTestPush } from "@/server/notifications";
import { NoopPushSender, type PushResult, type PushSender } from "@/server/push";
import { freshOwner, resetDb } from "./helpers";

class MockPush implements PushSender {
  readonly name = "mock"; readonly enabled = true; sent: string[] = [];
  async send(_t: unknown, p: { body: string }): Promise<PushResult> { this.sent.push(p.body); return { ok: true }; }
}

describe("launch check", () => {
  beforeEach(async () => { await resetDb(); });
  it("reports each item with pass/fail and never exposes secret values", async () => {
    const r = await launchCheck({ requestHost: "localhost:3100", forwardedProto: null, clientIp: "direct" }, { runBackup: false });
    const ids = r.items.map((i) => i.id);
    for (const id of ["https", "origin", "database", "migrations", "empty", "worker", "key", "passphrase", "storage", "pgdump", "setup", "ratelimit", "push"]) expect(ids).toContain(id);
    expect(r.items.find((i) => i.id === "migrations")!.ok).toBe(true);
    expect(r.items.find((i) => i.id === "database")!.ok).toBe(true);
    expect(r.items.find((i) => i.id === "pgdump")!.ok).toBe(true);
    expect(r.items.find((i) => i.id === "https")!.ok).toBe(false); // local http
    expect(r.ok).toBe(false);
    const text = JSON.stringify(r);
    for (const v of [process.env.DATA_ENCRYPTION_KEY!, process.env.SETUP_TOKEN!, "levelup_local_dev"]) expect(text).not.toContain(v);
  });
  it("only real public addresses count as a client IP for login limits", () => {
    expect(isPublicIp("203.0.113.5")).toBe(true);
    for (const ip of ["10.1.2.3", "172.20.0.1", "192.168.1.9", "100.64.0.1", "127.0.0.1", "fd12::1", "direct", "unknown"]) expect(isPublicIp(ip)).toBe(false);
  });
});

describe("one real test push", () => {
  let ownerId: string;
  beforeEach(async () => { ownerId = (await freshOwner()).id; });
  it("refuses without push configured or without a device; sends once to your devices with generic text; limited to 3/hour", async () => {
    await expect(sendRealTestPush(ownerId, new NoopPushSender())).rejects.toThrow(/isn't configured/);
    const push = new MockPush();
    await expect(sendRealTestPush(ownerId, push)).rejects.toThrow(/No device/);
    await saveSubscription(ownerId, { endpoint: "https://push.example.test/sub/1", p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u", auth: "tBHItJI5svbpez7KI4CCXg" });
    const r = await sendRealTestPush(ownerId, push);
    expect(r).toMatchObject({ devices: 1, sent: 1, failed: 0 });
    expect(push.sent).toEqual(["Test notification — push is working."]);
    expect(await prisma.pushDelivery.count({ where: { status: "SENT" } })).toBe(1);
    await sendRealTestPush(ownerId, push); await sendRealTestPush(ownerId, push);
    await expect(sendRealTestPush(ownerId, push)).rejects.toThrow(/3 test pushes/);
  });
});
