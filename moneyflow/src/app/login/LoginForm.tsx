"use client";
import { login } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { Input } from "@/components/ui";
import { SubmitButton } from "@/components/shell/SubmitButton";

export function LoginForm() {
  return (
    <ActionForm action={login} className="mt-5 space-y-3">
      <Input type="password" name="passcode" autoComplete="current-password" placeholder="Passcode" autoFocus required />
      <SubmitButton className="w-full" pendingText="Checking…">Unlock</SubmitButton>
    </ActionForm>
  );
}
