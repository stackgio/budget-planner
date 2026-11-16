import { prisma } from "@/server/db";
import { createOwner } from "@/server/bootstrap";

export async function resetDb() {
  if (!process.env.DATABASE_URL?.includes("levelup_test")) throw new Error("Integration tests must run against levelup_test");
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`;
  await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
}

export async function freshOwner() {
  await resetDb();
  return createOwner(prisma, "owner@example.test", "not-a-real-hash");
}
