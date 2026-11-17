/**
 * Used by scripts/key-recovery-drill.sh. Never prints a key.
 *   seed   — write synthetic encrypted records with the current DATA_ENCRYPTION_KEY
 *   verify — confirm records decrypt (expects "OK", "MISMATCH" or "MISSING" as argv[3])
 */
import { PrismaClient } from "@prisma/client";
import { PRIVATE_UNAVAILABLE, encrypt, readPrivate, verifyKey } from "../src/server/crypto";

const SECRET = "Synthetic drill note — not real data";

async function main() {
  const db = new PrismaClient();
  const mode = process.argv[2];
  try {
    if (mode === "seed") {
      const u = await db.user.create({ data: { email: "drill@example.test", passwordHash: "x" } });
      await db.faithEntry.create({ data: { ownerId: u.id, kind: "REFLECTION", date: new Date("2027-01-01"), bodyCipher: encrypt(SECRET), idempotencyKey: "drill-entry-0001" } });
      await db.relationshipNote.create({ data: { ownerId: u.id, bodyCipher: encrypt(SECRET)! } });
      console.log("seeded:", await verifyKey(db));
      return;
    }
    const expect = process.argv[3];
    const status = await verifyKey(db);
    const entry = await db.faithEntry.findFirstOrThrow();
    const note = await db.relationshipNote.findFirstOrThrow();
    const texts = [readPrivate(entry.bodyCipher), readPrivate(note.bodyCipher)];
    const readable = texts.every((t) => t === SECRET);
    const safeFailure = texts.every((t) => t === PRIVATE_UNAVAILABLE);
    console.log(`key status: ${status}; notes readable: ${readable}; safe failure notice: ${safeFailure}`);
    const ok = expect === "OK" ? status === "OK" && readable : status === expect && safeFailure;
    if (!ok) { console.error("DRILL CHECK FAILED"); process.exit(1); }
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
