import "server-only";
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { __levelupPrisma?: PrismaClient };
export const prisma = g.__levelupPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.__levelupPrisma = prisma;
