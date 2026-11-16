import { PrismaClient } from "@prisma/client";

export default async function globalSetup() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("levelup_test")) throw new Error("E2E must run against levelup_test (use npm run test:e2e)");
  const db = new PrismaClient();
  const tables = await db.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
  await db.$disconnect();
}
