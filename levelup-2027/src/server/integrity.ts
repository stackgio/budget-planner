/**
 * Integrity snapshot of a LEVEL UP database, used after a restore to prove nothing was lost:
 * row counts, ledger reconciliation, challenge progress, auth records, decryptability of private
 * notes, notification settings, gig records and analytics totals. Read-only. Never prints a key.
 */
import { prisma } from "./db";
import { challengeTotals, ledgerOverview, reconcile } from "./ledger";
import { PRIVATE_UNAVAILABLE, readPrivate, verifyKey } from "./crypto";
import { gigSummary } from "./gig";
import { createHash } from "node:crypto";

const TABLES = [
  "user", "session", "passkey", "userSettings", "calendarEvent", "task", "habit", "habitCheckIn", "payday", "incomeDeposit", "allocationPlan",
  "allocationLine", "payment", "challenge", "challengeTile", "auditLog", "goal", "goalMilestone", "faithEntry", "relationshipNote", "review",
  "notificationPreference", "notification", "pushSubscription", "dailyReflection", "gigPlatform", "gigSession", "gigMileage", "gigPayout",
] as const;

export async function integritySnapshot() {
  const counts: Record<string, number> = {};
  for (const t of TABLES) counts[t] = await (prisma[t] as unknown as { count: () => Promise<number> }).count();
  const owners = await prisma.user.findMany({ select: { id: true, email: true, passwordHash: true } });
  const perOwner = [];
  for (const o of owners) {
    const ov = await ledgerOverview(o.id);
    const ch = await challengeTotals(o.id);
    const gig = await gigSummary(o.id, "2000-01-01", "2100-12-31");
    const prefs = await prisma.notificationPreference.findUnique({ where: { ownerId: o.id } });
    perOwner.push({
      email: o.email,
      // A hash of the password hash proves auth records survived without exposing them.
      authFingerprint: createHash("sha256").update(o.passwordHash).digest("hex").slice(0, 16),
      reconcileIssues: (await reconcile(o.id)).map((i) => i.code),
      ledger: { totalIncomeCents: ov.totalIncomeCents, regularCents: ov.regularCents, overtimeCents: ov.overtimeCents, gigCents: ov.gigCents, reservedCents: ov.reservedCents, completedCents: ov.allocatedCompletedCents, availableCents: ov.availableCents },
      challenges: ch.map((c) => ({ kind: c.kind, confirmedCents: c.confirmedCents, completedTiles: c.completedTiles })),
      gig: { earningsCents: gig.totals.earningsCents, payoutsCents: gig.payoutsCents, miles: gig.totals.milesHundredths, sessions: gig.totals.sessions },
      notificationPrefs: prefs ? { quietStart: prefs.quietStart, quietEnd: prefs.quietEnd, previewDetail: prefs.previewDetail } : null,
    });
  }
  const ciphers = [
    ...(await prisma.goal.findMany({ where: { notesCipher: { not: null } }, select: { notesCipher: true }, orderBy: { id: "asc" } })).map((x) => x.notesCipher),
    ...(await prisma.faithEntry.findMany({ where: { bodyCipher: { not: null } }, select: { bodyCipher: true }, orderBy: { id: "asc" } })).map((x) => x.bodyCipher),
    ...(await prisma.gigSession.findMany({ where: { notesCipher: { not: null } }, select: { notesCipher: true }, orderBy: { id: "asc" } })).map((x) => x.notesCipher),
  ];
  const plain = ciphers.map((c) => readPrivate(c));
  return {
    counts, owners: perOwner, keyStatus: await verifyKey(prisma),
    privateNotes: { total: plain.length, readable: plain.filter((p) => p && p !== PRIVATE_UNAVAILABLE).length, safelyUnavailable: plain.filter((p) => p === PRIVATE_UNAVAILABLE).length, digest: createHash("sha256").update(JSON.stringify(plain)).digest("hex").slice(0, 16) },
  };
}
export type IntegritySnapshot = Awaited<ReturnType<typeof integritySnapshot>>;
