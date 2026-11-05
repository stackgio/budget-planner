import { redirect } from "next/navigation";
import { authEnabled } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  if (!authEnabled()) redirect("/");
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Unlock MoneyFlow</h1>
        <p className="mt-1 text-sm text-muted">Enter your passcode to view your finances.</p>
        <LoginForm />
      </div>
    </main>
  );
}
