"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { clientKey, createSession, destroySession, hashPassword, loginBlocked, passwordProblem, recordAttempt, safeEqual, verifyPassword } from "@/server/auth";
import { createOwner } from "@/server/bootstrap";
import { env } from "@/server/env";

type S = { error?: string } | null;

// Dummy hash so a wrong email takes as long as a wrong password.
let dummyHash: Promise<string> | null = null;
const dummy = () => (dummyHash ??= hashPassword(crypto.randomUUID()));

export async function loginAction(_prev: S, fd: FormData): Promise<S> {
  const key = await clientKey();
  if (await loginBlocked(key)) return { error: "Too many attempts. Wait 15 minutes and try again." };
  const email = String(fd.get("email") ?? "").toLowerCase().trim();
  const password = String(fd.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(user?.passwordHash ?? (await dummy()), password);
  await recordAttempt(key, ok && !!user);
  if (!ok || !user) return { error: "Email or password is incorrect." };
  await createSession(user.id, "password");
  redirect("/");
}

const setupSchema = z.object({
  token: z.string().min(1, "Setup token is required."),
  email: z.string().email("Enter a valid email."),
  name: z.string().trim().min(1).max(40),
  password: z.string(),
  confirm: z.string(),
});

export async function setupAction(_prev: S, fd: FormData): Promise<S> {
  const parsed = setupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const { token, email, name, password, confirm } = parsed.data;
  const key = await clientKey();
  if (await loginBlocked(key)) return { error: "Too many attempts. Wait 15 minutes and try again." };
  if (!env.setupToken) return { error: "SETUP_TOKEN is not configured on the server." };
  if (!safeEqual(token, env.setupToken)) {
    await recordAttempt(key, false);
    return { error: "Setup token is incorrect." };
  }
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  if (password !== confirm) return { error: "Passwords do not match." };
  try {
    const user = await createOwner(prisma, email, await hashPassword(password), name);
    await createSession(user.id, "password");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the account." };
  }
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
