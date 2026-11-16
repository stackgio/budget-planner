"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, hashPassword, passwordProblem, verifyPassword, createSession } from "@/server/auth";
import { prisma } from "@/server/db";
import { UserError } from "@/server/payroll";
import { run, type ActionState } from "@/ui/actions";
import { isTime } from "@/domain/dates";

export async function changePasswordAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  return run(async () => {
    const i = z.object({ current: z.string(), next: z.string(), confirm: z.string() }).parse(Object.fromEntries(fd));
    const u = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!(await verifyPassword(u.passwordHash, i.current))) throw new UserError("Current password is incorrect.");
    const problem = passwordProblem(i.next);
    if (problem) throw new UserError(problem);
    if (i.next !== i.confirm) throw new UserError("New passwords do not match.");
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(i.next) } });
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await createSession(user.id, "password");
    return "Password changed. Other devices were signed out.";
  });
}

export async function routineAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    const t = z.string().refine(isTime, "Use HH:MM times.");
    const i = z.object({ wakeTime: t, bedTime: t, briefingTime: t, checkInTime: t, reflectionTime: t }).parse(Object.fromEntries(fd));
    await prisma.userSettings.update({ where: { userId: user.id }, data: i });
    return "Saved.";
  });
  revalidatePath("/settings");
  return r;
}

export async function deletePasskeyAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const r = await run(async () => {
    await prisma.passkey.deleteMany({ where: { id: String(fd.get("id")), userId: user.id } });
    return "Passkey removed.";
  });
  revalidatePath("/settings");
  return r;
}

export async function signOutEverywhereAction() {
  const user = await requireUser();
  await prisma.session.deleteMany({ where: { userId: user.id } });
  redirect("/login");
}
