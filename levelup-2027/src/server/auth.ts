import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./db";
import { env } from "./env";

export const SESSION_COOKIE = "lu_session";
/** Over HTTPS the cookie uses the __Host- prefix: Secure, path=/, no Domain — no other subdomain can set or overwrite it. */
export const sessionCookieName = () => (env.secureCookies ? `__Host-${SESSION_COOKIE}` : SESSION_COOKIE);
const SESSION_DAYS = 30;
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const; // OWASP argon2id baseline

export const MIN_PASSWORD_LENGTH = 12;

export async function hashPassword(pw: string): Promise<string> {
  return hash(pw, ARGON);
}

export async function verifyPassword(stored: string, pw: string): Promise<boolean> {
  try {
    return await verify(stored, pw);
  } catch {
    return false;
  }
}

export function passwordProblem(pw: string): string | null {
  if (pw.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  if (pw.length > 256) return "Password is too long.";
  return null;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(sha256(a));
  const bb = Buffer.from(sha256(b));
  return timingSafeEqual(ab, bb);
}

export async function createSession(userId: string, method: "password" | "passkey") {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const h = await headers();
  await prisma.session.create({
    data: { id: sha256(token), userId, expiresAt, method, userAgent: h.get("user-agent")?.slice(0, 200) },
  });
  const jar = await cookies();
  jar.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(sessionCookieName());
}

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  createdAt: Date;
}

/** Validates the session against the database. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(sessionCookieName())?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { include: { settings: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  const u = session.user;
  return { id: u.id, email: u.email, displayName: u.displayName, timezone: u.settings?.timezone ?? "America/New_York", createdAt: u.createdAt };
});

/** Server-side authorization gate for every page, action and route handler. */
export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

// ───────────── Brute-force protection (database-backed, shared by every instance) ─────────────

const WINDOW_MS = 15 * 60_000;
export const PER_CLIENT_LIMIT = 5;
export const GLOBAL_LIMIT = 30;

/**
 * The client's IP as seen by the LAST trusted proxy. A client can put anything in X-Forwarded-For, so
 * we never trust the leftmost value: with TRUSTED_PROXY_HOPS=1 (Railway's edge appends the real IP)
 * we take the rightmost entry. With 0 hops (local), every request is "direct".
 */
export function clientKeyFrom(xff: string | null, hops: number): string {
  if (!hops || hops < 1) return "direct";
  const parts = (xff ?? "").split(",").map((p) => p.trim()).filter(Boolean);
  const ip = parts[parts.length - hops];
  return (ip && /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip : "unknown").slice(0, 64);
}

export async function clientKey(): Promise<string> {
  const h = await headers();
  return clientKeyFrom(h.get("x-forwarded-for"), Number(process.env.TRUSTED_PROXY_HOPS ?? 0));
}

/**
 * Atomically check the limits and reserve an attempt BEFORE verifying a password, so parallel guesses
 * are all counted. The reservation is a failure until finishAttempt(id, true).
 * `global: false` (passkeys) ignores the account-wide limit: a passkey can't be guessed, and this keeps
 * Face ID working even while someone is hammering the password form.
 */
export async function beginAttempt(key: string, opts: { global: boolean } = { global: true }): Promise<{ blocked: true } | { blocked: false; id: string }> {
  const since = new Date(Date.now() - WINDOW_MS);
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('levelup:login-limit'))`;
    const [mine, all] = await Promise.all([
      tx.loginAttempt.count({ where: { key, success: false, createdAt: { gte: since } } }),
      opts.global ? tx.loginAttempt.count({ where: { success: false, createdAt: { gte: since } } }) : Promise.resolve(0),
    ]);
    if (mine >= PER_CLIENT_LIMIT || all >= GLOBAL_LIMIT) return { blocked: true as const };
    const a = await tx.loginAttempt.create({ data: { key, success: false } });
    return { blocked: false as const, id: a.id };
  });
}

export async function finishAttempt(id: string, key: string, success: boolean) {
  if (!success) return; // the reservation already counts as a failure
  await prisma.loginAttempt.update({ where: { id }, data: { success: true } });
  await prisma.loginAttempt.deleteMany({ where: { key, success: false } });
}

/** Same-origin check for JSON route handlers (server actions get this from Next.js). */
export async function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin !== env.appOrigin) throw new Response("Forbidden origin", { status: 403 });
}
