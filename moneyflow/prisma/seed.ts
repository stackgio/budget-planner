/* Resets BOTH workspaces: personal (your stated profile, unverified) and demo (fictional). */
import { PrismaClient } from "@prisma/client";
import { createWorkspace } from "../src/lib/seed";

const prisma = new PrismaClient();
async function main() {
  await prisma.user.deleteMany({});
  const p = await createWorkspace(prisma, "personal");
  const d = await createWorkspace(prisma, "demo");
  console.log(`Seeded personal workspace ${p} and demo workspace ${d}`);
}
main().finally(() => prisma.$disconnect());
