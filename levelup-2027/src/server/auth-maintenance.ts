/** Housekeeping run by the worker (kept free of Next.js imports so it works outside the web server). */
import { prisma } from "./db";

/** Deletes login attempts older than a day and expired sessions. */
export async function pruneAuthRecords(now = new Date()) {
  const a = await prisma.loginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 86_400_000) } } });
  const s = await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } });
  return { attempts: a.count, sessions: s.count };
}
