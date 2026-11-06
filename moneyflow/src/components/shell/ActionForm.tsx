"use client";
import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import type { Result } from "@/app/actions";
import { cn } from "@/lib/utils";

type Action = (prev: unknown, fd: FormData) => Promise<Result>;

const PendingCtx = createContext(false);
export const useActionPending = () => useContext(PendingCtx);

/**
 * Form wrapper for server actions: shows validation errors inline and a brief
 * success toast. Submits through a transition (instead of React's form action
 * reset) so typed values survive a rejected submission. Without JS, the native
 * `action` fallback still submits the form.
 */
export function ActionForm({ action, children, className, resetOnSuccess, onSuccess, id }: { action: Action; children: React.ReactNode; className?: string; resetOnSuccess?: boolean; onSuccess?: (r: Result) => void; id?: string }) {
  const [state, formAction, pending] = useActionState(action, null as Result | null);
  const ref = useRef<HTMLFormElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!state) return;
    setVisible(true);
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.(state);
      const t = setTimeout(() => setVisible(false), 3500);
      return () => clearTimeout(t);
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(fd));
  };
  return (
    <PendingCtx.Provider value={pending}>
      <form ref={ref} action={formAction} onSubmit={onSubmit} className={className} id={id}>
        {children}
        {state && visible && (
          <div role="status" className={cn("mt-2 flex items-start gap-1.5 text-[13px]", state.ok ? "text-brand" : "text-danger")}>
            {state.ok ? <CheckCircle2 className="mt-px h-4 w-4 shrink-0" /> : <AlertCircle className="mt-px h-4 w-4 shrink-0" />}
            <span>{state.ok ? state.message : state.error}</span>
          </div>
        )}
      </form>
    </PendingCtx.Provider>
  );
}
