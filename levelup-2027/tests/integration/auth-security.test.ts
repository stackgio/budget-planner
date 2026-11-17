import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db";
import { GLOBAL_LIMIT, PER_CLIENT_LIMIT, beginAttempt, finishAttempt } from "@/server/auth";
import { pruneAuthRecords } from "@/server/auth-maintenance";
import { createOwner } from "@/server/bootstrap";
import { resetDb } from "./helpers";

beforeEach(async () => { await resetDb(); });

describe("login rate limiting (database-backed)", () => {
  it("blocks the 6th failed attempt from one client", async () => {
    for (let i = 0; i < PER_CLIENT_LIMIT; i++) expect((await beginAttempt("198.51.100.1")).blocked).toBe(false);
    expect((await beginAttempt("198.51.100.1")).blocked).toBe(true);
    expect((await beginAttempt("198.51.100.2")).blocked).toBe(false); // another client is unaffected
  });
  it("parallel guesses can't slip past the limit", async () => {
    const r = await Promise.all(Array.from({ length: 20 }, () => beginAttempt("198.51.100.7")));
    expect(r.filter((x) => !x.blocked)).toHaveLength(PER_CLIENT_LIMIT);
  });
  it("a successful sign-in clears that client's failures", async () => {
    for (let i = 0; i < 3; i++) await beginAttempt("198.51.100.3");
    const ok = await beginAttempt("198.51.100.3");
    if (ok.blocked) throw new Error("unexpected");
    await finishAttempt(ok.id, "198.51.100.3", true);
    expect(await prisma.loginAttempt.count({ where: { key: "198.51.100.3", success: false } })).toBe(0);
  });
  it("many clients together hit the account-wide limit, but passkey sign-in still works", async () => {
    for (let i = 0; i < GLOBAL_LIMIT; i++) await beginAttempt(`203.0.113.${i}`);
    expect((await beginAttempt("192.0.2.200")).blocked).toBe(true);
    expect((await beginAttempt("192.0.2.200", { global: false })).blocked).toBe(false);
  });
  it("old attempts and expired sessions are pruned", async () => {
    await prisma.loginAttempt.create({ data: { key: "x", success: false, createdAt: new Date(Date.now() - 2 * 86_400_000) } });
    const u = await prisma.user.create({ data: { email: "p@example.test", passwordHash: "x" } });
    await prisma.session.create({ data: { id: "expired-session-hash", userId: u.id, expiresAt: new Date(Date.now() - 1000) } });
    await prisma.session.create({ data: { id: "live-session-hash", userId: u.id, expiresAt: new Date(Date.now() + 86_400_000) } });
    expect(await pruneAuthRecords()).toEqual({ attempts: 1, sessions: 1 });
    expect(await prisma.session.count()).toBe(1);
  });
});

describe("single-owner registration", () => {
  it("concurrent setups create exactly one owner; later attempts are refused", async () => {
    const r = await Promise.allSettled([1, 2, 3, 4].map((i) => createOwner(prisma, `o${i}@example.test`, "x")));
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.user.count()).toBe(1);
    await expect(createOwner(prisma, "late@example.test", "x")).rejects.toThrow(/single-user/);
  });
});
