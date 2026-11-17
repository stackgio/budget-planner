/** Prints whether DATA_ENCRYPTION_KEY matches the key your data was encrypted with. Never prints the key. */
import { PrismaClient } from "@prisma/client";
import { verifyKey } from "../src/server/crypto";

const db = new PrismaClient();
verifyKey(db)
  .then((s) => {
    const msg = { OK: "OK — the key matches your encrypted notes.", MISSING: "MISSING — DATA_ENCRYPTION_KEY is not set.", INVALID_FORMAT: "INVALID — must be 32 random bytes, base64.", MISMATCH: "MISMATCH — this is not the key your notes were encrypted with. Restore the right key; do not create a new one.", UNVERIFIED: "UNVERIFIED" }[s];
    console.log(`Encryption key: ${msg}`);
    process.exitCode = s === "OK" ? 0 : 1;
  })
  .finally(() => db.$disconnect());
