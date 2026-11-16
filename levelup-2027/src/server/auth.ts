import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "./db";
import { env } from "./env";

export const SESSION_COOKIE = "lu_session";
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
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.secureCookies,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
}

/** Validates the session against the database. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
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
  return { id: u.id, email: u.email, displayName: u.displayName, timezone: u.settings?.timezone ?? "America/New_York" };
});

/** Server-side authorization gate for every page, action and route handler. */
export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

// ───────────── Brute-force protection ─────────────

const WINDOW_MS = 15 * 60_000;
const PER_CLIENT_LIMIT = 5;
const GLOBAL_LIMIT = 30;

export async function clientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local").slice(0, 64);
}

export async function loginBlocked(key: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const [mine, all] = await Promise.all([
    prisma.loginAttempt.count({ where: { key, success: false, createdAt: { gte: since } } }),
    prisma.loginAttempt.count({ where: { success: false, createdAt: { gte: since } } }),
  ]);
  return mine >= PER_CLIENT_LIMIT || all >= GLOBAL_LIMIT;
}

export async function recordAttempt(key: string, success: boolean) {
  await prisma.loginAttempt.create({ data: { key, success } });
  if (success) await prisma.loginAttempt.deleteMany({ where: { key, success: false } });
}

/** Same-origin check for JSON route handlers (server actions get this from Next.js). */
export async function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (origin !== env.appOrigin) throw new Response("Forbidden origin", { status: 403 });
}
