import { ConfirmAction } from "@/ui/ConfirmAction";
import { Download, LogOut } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { env } from "@/server/env";
import { verifyKey } from "@/server/crypto";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { Dialog } from "@/ui/dialog";
import { logoutAction } from "@/app/(public)/auth-actions";
import { AddPasskey } from "./Passkeys";
import { changePasswordAction, deletePasskeyAction, routineAction, signOutEverywhereAction } from "./actions";

export default async function SettingsPage() {
  const { user } = await appContext();
  const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
  const passkeys = await prisma.passkey.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const keyStatus = await verifyKey(prisma);
  const sessions = await prisma.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } });

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Settings" title="Settings" />

      <Section title="Account">
        <p className="text-sm">{user.displayName} · <span className="text-mute-400">{user.email}</span></p>
        <p className="mt-1 text-xs text-mute-400">Time zone: {user.timezone} · {sessions} active session{sessions === 1 ? "" : "s"}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Dialog title="Change password" trigger="Change password" triggerClassName="btn-secondary btn-sm">
            <ActionForm action={changePasswordAction} className="space-y-4" resetOnSuccess>
              <Field label="Current password"><input className="input" type="password" name="current" autoComplete="current-password" required /></Field>
              <Field label="New password" hint="At least 12 characters."><input className="input" type="password" name="next" autoComplete="new-password" minLength={12} required /></Field>
              <Field label="Confirm new password"><input className="input" type="password" name="confirm" autoComplete="new-password" required /></Field>
              <SubmitButton className="btn-primary w-full">Change password</SubmitButton>
            </ActionForm>
          </Dialog>
          <form action={logoutAction}><button className="btn-secondary btn-sm"><LogOut size={14} /> Sign out</button></form>
          <form action={signOutEverywhereAction}><button className="btn-ghost btn-sm">Sign out everywhere</button></form>
        </div>
      </Section>

      <Section title="Passkeys (Face ID / Touch ID)">
        <p className="mb-3 text-sm text-mute-300">A passkey lets you sign in with your device&apos;s own unlock (Face ID, Touch ID or device passcode). Only a public key is stored here — your biometrics never leave your device and are never sent to LEVEL UP.</p>
        {passkeys.length ? (
          <ul className="divide-line mb-4">
            {passkeys.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span>{p.label} <span className="text-xs text-mute-400">· added {p.createdAt.toISOString().slice(0, 10)}{p.lastUsedAt ? ` · last used ${p.lastUsedAt.toISOString().slice(0, 10)}` : ""}{p.backedUp ? " · synced" : ""}</span></span>
                <ConfirmAction label="Remove" title="Remove this passkey?" action={deletePasskeyAction} fields={{ id: p.id }} confirmLabel="Remove passkey">You won&apos;t be able to sign in with {p.label} any more. Your password still works. This can&apos;t be undone — you&apos;d add the passkey again.</ConfirmAction>
              </li>
            ))}
          </ul>
        ) : <Empty>No passkeys yet.</Empty>}
        <AddPasskey />
        <p className="mt-3 text-xs text-mute-400">Passkeys are bound to this site&apos;s address ({env.rpId}). On iPhone they need the HTTPS address you deploy to; a passkey created on localhost will not work on the deployed site.</p>
      </Section>

      <Section title="Notifications & assistant">
        <p className="mb-3 text-sm text-mute-300">Briefing times, quiet hours, work-mode behavior, reminder types, lock-screen privacy and push on this device.</p>
        <a href="/settings/notifications" className="btn-secondary btn-sm">Notification settings</a>
      </Section>

      <Section title="Integrations">
        <p className="mb-3 text-sm text-mute-300">Optional connections such as Google Calendar. None are connected; each needs your approval and consent.</p>
        <a href="/settings/integrations" className="btn-secondary btn-sm">View integrations</a>
      </Section>

      <Section title="Encryption key">
        <p className="text-sm">{keyStatus === "OK" ? <span className="text-go">✓ Your encryption key matches your private notes.</span> : <span className="text-bad">⚠ {keyStatus === "MISSING" ? "No encryption key is configured." : keyStatus === "INVALID_FORMAT" ? "The configured key has the wrong format." : "The configured key doesn't match the one your notes were encrypted with."} Private notes show as unavailable until the right key is restored.</span>}</p>
        <p className="mt-2 text-xs text-mute-400">The key itself is never shown here, logged, or exported. Keep a recovery copy in your password manager — see docs/ENCRYPTION-KEY-RECOVERY.md.</p>
      </Section>

      <Section title="Daily rhythm">
        <ActionForm action={routineAction} className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Field label="Wake"><input className="input" type="time" name="wakeTime" defaultValue={settings?.wakeTime} required /></Field>
          <Field label="Bedtime"><input className="input" type="time" name="bedTime" defaultValue={settings?.bedTime} required /></Field>
          <Field label="Briefing"><input className="input" type="time" name="briefingTime" defaultValue={settings?.briefingTime} required /></Field>
          <Field label="Check-in"><input className="input" type="time" name="checkInTime" defaultValue={settings?.checkInTime} required /></Field>
          <Field label="Reflection"><input className="input" type="time" name="reflectionTime" defaultValue={settings?.reflectionTime} required /></Field>
          <div className="col-span-2 sm:col-span-5"><SubmitButton className="btn-secondary">Save times</SubmitButton></div>
        </ActionForm>
        <p className="mt-3 text-xs text-mute-400">Saved now and used by the assistant (Phase 3). No notifications are sent until push is set up and tested on your iPhone (Phase 4).</p>
      </Section>

      <Section title="Your data">
        <p className="mb-3 text-sm text-mute-300">Download everything LEVEL UP stores about you as JSON. Nothing is shared with MoneyFlow or any third party.</p>
        <a href="/api/export" className="btn-secondary btn-sm"><Download size={14} /> Export all data (JSON)</a>
      </Section>
    </div>
  );
}
