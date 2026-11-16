/**
 * Create the single owner account from the command line (alternative to /setup).
 * Usage: OWNER_EMAIL=you@example.com OWNER_PASSWORD='long passphrase' npm run owner:create
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { createOwner } from "../src/server/bootstrap";

async function main() {
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password) throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD.");
  if (password.length < 12) throw new Error("Password must be at least 12 characters.");
  const db = new PrismaClient();
  try {
    const user = await createOwner(db, email, await hash(password, { memoryCost: 19_456, timeCost: 2, parallelism: 1 }), process.env.OWNER_NAME || "Gio");
    console.log(`Owner created: ${user.email}`);
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => { console.error(e.message); process.exit(1); });
