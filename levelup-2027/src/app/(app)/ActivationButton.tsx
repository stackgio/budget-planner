"use client";
import { Siren } from "lucide-react";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { startModeAction } from "./mode-actions";

export function ActivationButton({ today, className }: { today: string; className?: string }) {
  return (
    <Dialog title="I've been activated" trigger={<><Siren size={16} /> I&apos;ve Been Activated</>} triggerClassName={className ?? "btn-danger"}>
      <ActionForm action={startModeAction} className="space-y-4">
        <input type="hidden" name="mode" value="ACTIVATION" />
        <p className="text-sm text-mute-300">This records the activation start now, blocks the time on your calendar, pauses optional reminders, and shows what it conflicts with. Nothing is deleted or moved without you.</p>
        <p className="text-sm font-semibold">Estimated end (optional)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input className="input" type="date" name="endDate" defaultValue={today} /></Field>
          <Field label="Time"><input className="input" type="time" name="endTime" /></Field>
        </div>
        <p className="text-xs text-mute-400">Leave the time blank if you don&apos;t know — it will show as 12 hours until you end it.</p>
        <Field label="Note (no confidential details)"><input className="input" name="notes" maxLength={200} /></Field>
        <SubmitButton className="btn-danger w-full" pendingText="Starting…">Start activation</SubmitButton>
      </ActionForm>
    </Dialog>
  );
}
