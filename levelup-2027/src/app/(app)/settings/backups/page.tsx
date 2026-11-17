import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { verifyKey } from "@/server/crypto";
import { backupStatus, DAILY_BACKUP_TIME } from "@/server/backup-service";
import { formatTime12 } from "@/domain/dates";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { ActionForm, SubmitButton } from "@/ui/form";
import { cn } from "@/ui/cn";
import { backupNowAction, testRestoreAction } from "./actions";

export default async function BackupsPage() {
  const { user } = await appContext();
  const [st, keyStatus] = await Promise.all([backupStatus(), verifyKey(prisma)]);
  const when = (d: Date | null | undefined) => (d ? d.toLocaleString("en-US", { timeZone: user.timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never");
  const daysSince = (d: Date | null | undefined) => (d ? Math.floor((Date.now() - d.getTime()) / 86_400_000) : null);
  const dl = daysSince(st.lastDownload?.startedAt);
  const ok = (good: boolean) => (good ? "text-go" : "text-warn");
  const rows: [string, string, boolean][] = [
    ["Encryption key", keyStatus === "OK" ? "Matches your private notes" : keyStatus === "MISSING" ? "Missing" : keyStatus === "MISMATCH" ? "Doesn't match your notes" : "Invalid format", keyStatus === "OK"],
    ["Backup passphrase", st.cfg.passphraseSet ? "Set (never shown)" : "Not set — backups are off", st.cfg.passphraseSet],
    ["Where backups are kept", st.cfg.storeLabel, st.cfg.offsite],
    ["Automatic backups", st.cfg.passphraseSet ? `Daily at ${formatTime12(DAILY_BACKUP_TIME)} New York time` : "Off", st.cfg.passphraseSet],
    ["Last backup", st.lastOk ? `${when(st.lastOk.startedAt)} · verified` : "None yet", !!st.lastOk && (daysSince(st.lastOk.startedAt) ?? 9) <= 1],
    ["Last restore test", st.lastTest ? `${when(st.lastTest.startedAt)} · ${st.lastTest.status === "SUCCEEDED" ? "passed" : st.lastTest.status === "FAILED" ? "failed" : "running"}` : "Never", st.lastTest?.status === "SUCCEEDED"],
    ["Last saved to your iPhone", st.lastDownload ? `${when(st.lastDownload.startedAt)}${dl !== null && dl > 7 ? " — over a week ago" : ""}` : "Never", dl !== null && dl <= 7],
  ];

  return (
    <div className="space-y-4">
      <Link href="/settings" className="btn-ghost btn-sm -ml-2"><ChevronLeft size={16} /> Settings</Link>
      <PageHeader eyebrow="Settings" title="Backups & recovery" />

      <section className="card" aria-labelledby="bk-status">
        <h2 id="bk-status" className="eyebrow mb-2">Status</h2>
        <dl className="divide-line text-sm">
          {rows.map(([k, v, good]) => (
            <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-mute-300">{k}</dt><dd className={cn("text-right", ok(good))}>{v}</dd></div>
          ))}
        </dl>
        {st.lastFail && <p role="alert" className="mt-3 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">Last attempt failed {when(st.lastFail.startedAt)}: {st.lastFail.error}</p>}
        {st.storeError && <p role="alert" className="mt-3 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{st.storeError}</p>}
        {!st.cfg.offsite && <p className="mt-3 text-xs text-mute-400">Development mode: backups are on this server&apos;s disk. In production they go to a private storage bucket that is separate from the database.</p>}
      </section>

      <Section title="Do it now">
        <div className="flex flex-wrap gap-2">
          <ActionForm action={backupNowAction}><SubmitButton className="btn-primary btn-sm" pendingText="Backing up…">Back up now</SubmitButton></ActionForm>
          <ActionForm action={testRestoreAction}><SubmitButton className="btn-secondary btn-sm" pendingText="Testing…">Test restore</SubmitButton></ActionForm>
        </div>
        <p className="mt-3 text-xs text-mute-400">“Test restore” restores the newest backup into a temporary copy, checks the ledger and your notes, then deletes the copy. Your live data is never touched.</p>
      </Section>

      <Section title="Saved backups">
        {st.files.length ? (
          <ul className="divide-line">
            {st.files.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span><span className="block font-medium">{when(new Date(f.key.replace(/^levelup-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z\.lubk$/, "$1-$2-$3T$4:$5:$6Z")))}</span><span className="text-xs text-mute-400">{Math.max(1, Math.round(f.bytes / 1024))} KB · encrypted</span></span>
                <a className="btn-ghost btn-sm" href={`/api/backups/download?key=${encodeURIComponent(f.key)}`} download aria-label={`Download backup from ${f.key}`}><Download size={14} /> Save</a>
              </li>
            ))}
          </ul>
        ) : <Empty>No backups yet. Tap “Back up now”, or wait for tonight&apos;s automatic backup.</Empty>}
        <p className="mt-3 text-xs text-mute-400">Once a week, tap <strong className="text-mute-300">Save</strong> on the newest backup, then choose <strong className="text-mute-300">Save to Files → iCloud Drive</strong>. That copy is yours, outside of the hosting company. The file is encrypted — it can only be opened with your backup passphrase.</p>
      </Section>

      <Section title="Keep these two secrets safe">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-mute-300">
          <li><strong className="text-white">Encryption key</strong> (DATA_ENCRYPTION_KEY): locks your private notes. Without it, notes in any backup stay unreadable — money, goals and tasks are still restorable.</li>
          <li><strong className="text-white">Backup passphrase</strong> (BACKUP_PASSPHRASE): opens backup files.</li>
        </ol>
        <p className="mt-3 text-sm text-mute-300">Save each one as its <strong className="text-white">own entry</strong> in the iPhone <strong className="text-white">Passwords</strong> app (Settings → Passwords on older iOS): tap <em>+</em>, title it “LEVEL UP encryption key” or “LEVEL UP backup passphrase”, paste the value into Password. It syncs through iCloud Keychain with end-to-end encryption and is protected by Face ID. Optionally also write both on paper and keep it somewhere safe at home.</p>
        <p className="mt-2 text-xs text-mute-400">Never paste them into notes, email, messages, screenshots, or a chat. LEVEL UP never shows them.</p>
      </Section>
    </div>
  );
}
