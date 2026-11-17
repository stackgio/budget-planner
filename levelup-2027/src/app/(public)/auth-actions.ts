"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/server/db";
import { beginAttempt, clientKey, createSession, destroySession, finishAttempt, hashPassword, passwordProblem, safeEqual, verifyPassword } from "@/server/auth";
import { createOwner } from "@/server/bootstrap";
import { env } from "@/server/env";

type S = { error?: string } | null;

// Dummy hash so a wrong email takes as long as a wrong password.
let dummyHash: Promise<string> | null = null;
const dummy = () => (dummyHash ??= hashPassword(crypto.randomUUID()));

export async function loginAction(_prev: S, fd: FormData): Promise<S> {
  const key = await clientKey();
  const attempt = await beginAttempt(key);
  if (attempt.blocked) return { error: "Too many attempts. Wait 15 minutes, or sign in with Face ID." };
  const email = String(fd.get("email") ?? "").toLowerCase().trim().slice(0, 254);
  const password = String(fd.get("password") ?? "").slice(0, 256);
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await verifyPassword(user?.passwordHash ?? (await dummy()), password);
  await finishAttempt(attempt.id, key, ok && !!user);
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
  // Once the owner exists, setup is closed for good — before the token is even checked.
  if ((await prisma.user.count()) > 0) return { error: "LEVEL UP is already set up. Sign in instead." };
  if (!env.setupToken) return { error: "SETUP_TOKEN is not configured on the server." };
  const key = await clientKey();
  const attempt = await beginAttempt(key);
  if (attempt.blocked) return { error: "Too many attempts. Wait 15 minutes and try again." };
  if (!safeEqual(token, env.setupToken)) return { error: "Setup token is incorrect." };
  await finishAttempt(attempt.id, key, true);
  const problem = passwordProblem(password);
  if (problem) return { error: problem };
  if (password !== confirm) return { error: "Passwords do not match." };
  try {
    const user = await createOwner(prisma, email, await hashPassword(password), name);
    await createSession(user.id, "password");
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("single-user") ? "LEVEL UP is already set up. Sign in instead." : "Could not create the account.";
    return { error: msg };
  }
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
