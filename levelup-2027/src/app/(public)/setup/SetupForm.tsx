"use client";
import { useActionState } from "react";
import { setupAction } from "../auth-actions";
import { Field, SubmitButton, PendingProvider, useKeepValuesSubmit } from "@/ui/form";

export function SetupForm() {
  const [state, action, pending] = useActionState(setupAction, null);
  const onSubmit = useKeepValuesSubmit(action);
  return (
    <form onSubmit={onSubmit} className="space-y-4"><PendingProvider pending={pending}>
      <Field label="Setup token" hint="The SETUP_TOKEN value from your server's .env file.">
        <input className="input" name="token" type="password" autoComplete="off" required />
      </Field>
      <Field label="Your name"><input className="input" name="name" defaultValue="Gio" required /></Field>
      <Field label="Email"><input className="input" name="email" type="email" autoComplete="username" required /></Field>
      <Field label="Password" hint="At least 12 characters. A passphrase works well.">
        <input className="input" name="password" type="password" autoComplete="new-password" minLength={12} required />
      </Field>
      <Field label="Confirm password"><input className="input" name="confirm" type="password" autoComplete="new-password" required /></Field>
      {state?.error && <p role="alert" className="text-sm text-bad">{state.error}</p>}
      <SubmitButton className="btn-primary w-full" pendingText="Creating…">Create account</SubmitButton>
    </PendingProvider></form>
  );
}
