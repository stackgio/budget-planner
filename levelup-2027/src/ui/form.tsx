"use client";
import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "./cn";

type State = { ok?: boolean; error?: string; message?: string; nonce?: number } | null;

const PendingCtx = createContext(false);

/**
 * React 19 resets uncontrolled fields after a form *action* completes. We submit through
 * onSubmit instead, so typed values survive a validation error; forms reset only on success when asked.
 */
export function useKeepValuesSubmit(dispatch: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(fd));
  };
}

export function PendingProvider({ pending, children }: { pending: boolean; children: ReactNode }) {
  return <PendingCtx.Provider value={pending}>{children}</PendingCtx.Provider>;
}

export function SubmitButton({ children, className = "btn-primary", pendingText }: { children: ReactNode; className?: string; pendingText?: string }) {
  const status = useFormStatus();
  const ctxPending = useContext(PendingCtx);
  const pending = status.pending || ctxPending;
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending ? pendingText ?? "Saving…" : children}
    </button>
  );
}

/** Form bound to a server action with inline success/error feedback. */
export function ActionForm({
  action,
  children,
  className,
  onSuccess,
  resetOnSuccess = false,
}: {
  action: (prev: State, fd: FormData) => Promise<State>;
  children: ReactNode;
  className?: string;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const onSubmit = useKeepValuesSubmit(formAction);
  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.nonce]);
  return (
    <form ref={ref} onSubmit={onSubmit} className={className}>
      <PendingProvider pending={pending}>{children}</PendingProvider>
      {state?.error && (
        <p role="alert" className="mt-3 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">
          {state.error}
        </p>
      )}
      {state?.ok && state.message && (
        <p role="status" className="mt-3 rounded-lg border border-go/30 bg-go/10 px-3 py-2 text-sm text-go">
          {state.message}
        </p>
      )}
    </form>
  );
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute-400">{hint}</span>}
    </label>
  );
}
