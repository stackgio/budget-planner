import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { AuthShell } from "../AuthShell";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  if ((await prisma.user.count()) === 0) redirect("/setup");
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Life OS.">
      <LoginForm />
    </AuthShell>
  );
}
