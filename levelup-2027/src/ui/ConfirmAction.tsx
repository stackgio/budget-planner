"use client";
import type { ReactNode } from "react";
import { Dialog, useDialog } from "./dialog";
import { ActionForm, Field, SubmitButton } from "./form";

type State = { ok?: boolean; error?: string; message?: string; nonce?: number } | null;

function CloseOnSuccess({ children, action, fields, confirmLabel, danger, reason }: {
  children?: ReactNode; action: (p: State, fd: FormData) => Promise<State>; fields: Record<string, string>; confirmLabel: string; danger?: boolean;
  reason?: { label: string; placeholder?: string };
}) {
  const { close } = useDialog();
  return (
    <ActionForm action={action} onSuccess={close} className="space-y-4">
      {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {children}
      {reason && <Field label={reason.label}><input className="input" name="reason" required minLength={3} maxLength={200} placeholder={reason.placeholder} /></Field>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-secondary" onClick={close}>Keep it</button>
        <SubmitButton className={danger ? "btn-danger" : "btn-primary"}>{confirmLabel}</SubmitButton>
      </div>
    </ActionForm>
  );
}

/**
 * A destructive or hard-to-undo action behind a confirmation sheet. Nothing happens on the first tap.
 */
export function ConfirmAction({ label, title, children, action, fields, confirmLabel, danger = true, reason, triggerClassName = "btn-ghost btn-sm", triggerLabel }: {
  label: ReactNode; title: string; children?: ReactNode; action: (p: State, fd: FormData) => Promise<State>; fields: Record<string, string>;
  confirmLabel: string; danger?: boolean; reason?: { label: string; placeholder?: string }; triggerClassName?: string; triggerLabel?: string;
}) {
  return (
    <Dialog title={title} trigger={label} triggerClassName={triggerClassName} triggerLabel={triggerLabel}>
      <CloseOnSuccess action={action} fields={fields} confirmLabel={confirmLabel} danger={danger} reason={reason}>
        {children && <div className="text-sm text-mute-300">{children}</div>}
      </CloseOnSuccess>
    </Dialog>
  );
}
