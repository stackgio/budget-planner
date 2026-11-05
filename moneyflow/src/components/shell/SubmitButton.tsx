"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";
import type { ComponentProps } from "react";
import { useActionPending } from "./ActionForm";

export function SubmitButton({ children, pendingText, ...p }: ComponentProps<typeof Button> & { pendingText?: string }) {
  const status = useFormStatus();
  const ctxPending = useActionPending();
  const pending = status.pending || ctxPending;
  return (
    <Button type="submit" disabled={pending || p.disabled} {...p}>
      {pending ? (pendingText ?? "Saving…") : children}
    </Button>
  );
}

export function ConfirmButton({ children, message, ...p }: ComponentProps<typeof Button> & { message: string }) {
  const status = useFormStatus();
  const ctxPending = useActionPending();
  const pending = status.pending || ctxPending;
  return (
    <Button type="submit" disabled={pending} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }} {...p}>
      {children}
    </Button>
  );
}
