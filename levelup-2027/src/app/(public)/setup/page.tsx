import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { AuthShell } from "../AuthShell";
import { SetupForm } from "./SetupForm";
import { RestoreForm } from "./RestoreForm";
import { SecretGenerator } from "./SecretGenerator";
import { LaunchCheck } from "./LaunchCheck";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if ((await prisma.user.count()) > 0) redirect("/login");
  return (
    <AuthShell title="Create your account" subtitle="One-time setup. LEVEL UP has a single private owner account. Your confirmed schedule, payroll and challenge settings are loaded automatically.">
      <SetupForm />
      <SecretGenerator />
      <LaunchCheck />
      <RestoreForm />
    </AuthShell>
  );
}
