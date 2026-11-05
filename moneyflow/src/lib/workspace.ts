import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./db";
import { createWorkspace } from "./seed";
import { unsign, WORKSPACE_COOKIE } from "./session";

/**
 * Resolve the active workspace (user) for this request. Every query in the app
 * is scoped by the id returned here — this is the per-user isolation boundary.
 */
// A workspace is usable only once its Settings row exists (created last by the seed).
const COMPLETE = { settings: { isNot: null } } as const;

// One first-run setup per server process, shared by concurrent requests.
let firstRun: Promise<string> | null = null;

async function ensureWorkspaces(): Promise<string> {
  // Repair anything a crashed older version may have left half-created.
  await prisma.user.deleteMany({ where: { settings: { is: null } } });
  const personal = await prisma.user.findFirst({ where: { mode: "personal", ...COMPLETE }, select: { id: true } });
  const pid = personal?.id ?? (await createWorkspace(prisma, "personal"));
  if (!(await prisma.user.findFirst({ where: { mode: "demo", ...COMPLETE }, select: { id: true } }))) {
    await createWorkspace(prisma, "demo");
  }
  return pid;
}

export const getUserId = cache(async (): Promise<string> => {
  const jar = await cookies();
  const id = await unsign(jar.get(WORKSPACE_COOKIE)?.value);
  if (id) {
    const u = await prisma.user.findFirst({ where: { id, ...COMPLETE }, select: { id: true } });
    if (u) return u.id;
  }
  const personal = await prisma.user.findFirst({ where: { mode: "personal", ...COMPLETE }, select: { id: true } });
  if (personal) return personal.id;
  firstRun ??= ensureWorkspaces().finally(() => {
    firstRun = null;
  });
  return firstRun;
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
