/* Resets BOTH workspaces: personal (your stated profile, unverified) and demo (fictional). */
import { PrismaClient } from "@prisma/client";
import { seedDemo, seedPersonal } from "../src/lib/seed";

const prisma = new PrismaClient();
async function main() {
  await prisma.user.deleteMany({});
  const p = await seedPersonal(prisma);
  const d = await seedDemo(prisma);
  console.log(`Seeded personal workspace ${p} and demo workspace ${d}`);
}
main().finally(() => prisma.$disconnect());
