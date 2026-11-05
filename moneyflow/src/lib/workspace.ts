import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";
import { seedDemo, seedPersonal } from "./seed";
import { unsign, WORKSPACE_COOKIE } from "./session";

/**
 * Resolve the active workspace (user) for this request. Every query in the app
 * is scoped by the id returned here — this is the per-user isolation boundary.
 */
export const getUserId = cache(async (): Promise<string> => {
  const jar = await cookies();
  const id = await unsign(jar.get(WORKSPACE_COOKIE)?.value);
  if (id) {
    const u = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (u) return u.id;
  }
  let personal = await prisma.user.findFirst({ where: { mode: "personal" }, select: { id: true } });
  if (!personal) {
    // First run: create both workspaces automatically.
    const pid = await seedPersonal(prisma);
    if (!(await prisma.user.findFirst({ where: { mode: "demo" } }))) await seedDemo(prisma);
    personal = { id: pid };
  }
  return personal.id;
});

export const loadWorkspace = cache(async () => {
  const userId = await getUserId();
  const [user, settings, rules, accounts, snapshots, categories, transactions, budgets, bills, reserves, paychecks, assignments, goals, goalContribs, holdings, invContribs, planLines] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    prisma.settings.findUniqueOrThrow({ where: { userId } }),
    prisma.allocationRule.findMany({ where: { userId }, orderBy: { sortOrder: "asc" } }),
    prisma.account.findMany({ where: { userId }, orderBy: [{ archived: "asc" }, { createdAt: "asc" }] }),
    prisma.accountSnapshot.findMany({ where: { userId }, orderBy: [{ date: "asc" }, { createdAt: "asc" }] }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({ where: { userId }, include: { splits: true }, orderBy: [{ date: "desc" }, { createdAt: "desc" }] }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.bill.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.billReserve.findMany({ where: { userId } }),
    prisma.paycheckEvent.findMany({ where: { userId }, orderBy: { payDate: "asc" } }),
    prisma.paycheckAssignment.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.savingsGoal.findMany({ where: { userId }, orderBy: [{ priority: "asc" }, { name: "asc" }] }),
    prisma.goalContribution.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.holding.findMany({ where: { userId }, orderBy: { symbol: "asc" } }),
    prisma.investmentContribution.findMany({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.planLine.findMany({ where: { userId } }),
  ]);
  return { userId, user, settings, rules, accounts, snapshots, categories, transactions, budgets, bills, reserves, paychecks, assignments, goals, goalContribs, holdings, invContribs, planLines };
});

export type Workspace = Awaited<ReturnType<typeof loadWorkspace>>;
