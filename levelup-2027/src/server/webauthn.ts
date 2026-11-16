import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { env } from "./env";

const COOKIE = "lu_webauthn";
const TTL_MS = 5 * 60_000;

export async function storeChallenge(challenge: string, purpose: "register" | "login", userId?: string) {
  const id = randomBytes(24).toString("base64url");
  await prisma.authChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.authChallenge.create({ data: { id, challenge, purpose, userId, expiresAt: new Date(Date.now() + TTL_MS) } });
  (await cookies()).set(COOKIE, id, { httpOnly: true, secure: env.secureCookies, sameSite: "strict", path: "/api/auth/passkey", maxAge: TTL_MS / 1000 });
}

/** Single-use: the challenge is deleted as soon as it is read. */
export async function takeChallenge(purpose: "register" | "login", userId?: string): Promise<string | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  jar.delete(COOKIE);
  if (!id) return null;
  const row = await prisma.authChallenge.findUnique({ where: { id } });
  if (!row) return null;
  await prisma.authChallenge.delete({ where: { id } }).catch(() => {});
  if (row.purpose !== purpose || row.expiresAt < new Date()) return null;
  if (purpose === "register" && row.userId !== userId) return null;
  return row.challenge;
}
