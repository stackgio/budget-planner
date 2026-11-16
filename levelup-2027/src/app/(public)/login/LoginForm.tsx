"use client";
import { useActionState, useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import { KeyRound } from "lucide-react";
import { loginAction } from "../auth-actions";
import { SubmitButton, Field, PendingProvider, useKeepValuesSubmit } from "@/ui/form";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  const onSubmit = useKeepValuesSubmit(action);
  const [pkError, setPkError] = useState<string | null>(null);
  const [pkBusy, setPkBusy] = useState(false);

  async function passkey() {
    setPkError(null);
    setPkBusy(true);
    try {
      const opts = await fetch("/api/auth/passkey/login/options", { method: "POST" }).then((r) => r.json());
      const response = await startAuthentication({ optionsJSON: opts });
      const res = await fetch("/api/auth/passkey/login/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(response),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Passkey sign-in failed.");
      window.location.href = "/";
    } catch (e) {
      setPkError(e instanceof Error && e.name !== "NotAllowedError" ? e.message : "Passkey sign-in was cancelled or is not available on this device.");
    } finally {
      setPkBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4"><PendingProvider pending={pending}>
        <Field label="Email">
          <input className="input" name="email" type="email" autoComplete="username webauthn" required />
        </Field>
        <Field label="Password">
          <input className="input" name="password" type="password" autoComplete="current-password" required />
        </Field>
        {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
        <SubmitButton className="btn-primary w-full" pendingText="Signing in…">Sign in</SubmitButton>
      </PendingProvider></form>
      <div className="flex items-center gap-3 text-xs text-ink-500"><span className="h-px flex-1 bg-ink-700" />or<span className="h-px flex-1 bg-ink-700" /></div>
      <button type="button" onClick={passkey} disabled={pkBusy} className="btn-secondary w-full">
        <KeyRound size={16} /> {pkBusy ? "Waiting for device…" : "Sign in with a passkey"}
      </button>
      {pkError && <p role="alert" className="text-sm text-bad">{pkError}</p>}
      <p className="text-xs text-mute-400">Passkeys use Face ID or Touch ID on your device. Your biometrics never leave the device. Add one in Settings after signing in.</p>
    </div>
  );
}
