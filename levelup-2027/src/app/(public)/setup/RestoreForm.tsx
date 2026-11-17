"use client";
import { useState } from "react";

type Result = { ok: true; dbName: string; owners: number; ledgerIssues: string[]; keyStatus: string } | { error: string };

/** Shown only on a new, empty installation: bring your data back from a backup instead of starting fresh. */
export function RestoreForm() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setRes(null);
    const r = await fetch("/api/setup/restore", { method: "POST", body: new FormData(e.currentTarget) }).then((x) => x.json()).catch(() => ({ error: "Network error. Nothing was changed." }));
    setRes(r); setBusy(false);
  }
  return (
    <details className="mt-6 rounded-2xl border border-ink-700 p-4" onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-sm font-semibold">Restoring after a problem? Restore from a backup</summary>
      {open && <form onSubmit={submit} className="mt-4 space-y-3" aria-busy={busy}>
        <label className="block"><span className="label">Setup token (for restore)</span><input className="input" name="token" type="password" required autoComplete="off" /></label>
        <label className="block"><span className="label">Backup passphrase (for restore)</span><input className="input" name="passphrase" type="password" required autoComplete="off" /></label>
        <label className="block"><span className="label">Backup file (optional)</span><input className="input" name="file" type="file" accept=".lubk,application/octet-stream" />
          <span className="mt-1 block text-xs text-mute-400">Pick the .lubk file you saved to iCloud Drive. Leave empty to use the newest backup in storage.</span></label>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Restoring… (up to a minute)" : "Restore into a new database"}</button>
      </form>}
      {res && "error" in res && <p role="alert" className="mt-3 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{res.error}</p>}
      {res && "ok" in res && (
        <div role="status" className="mt-3 space-y-2 rounded-lg border border-go/30 bg-go/10 p-3 text-sm">
          <p className="font-semibold text-go">Restored into a new database: <code>{res.dbName}</code></p>
          <p>Ledger: {res.ledgerIssues.length ? `issues ${res.ledgerIssues.join(", ")}` : "reconciled"} · Encryption key: {res.keyStatus === "OK" ? "matches" : res.keyStatus.toLowerCase()}</p>
          <p>Last step, in the Railway app: open the LEVEL UP service → Variables → add <code>LEVELUP_DATABASE_NAME</code> = <code>{res.dbName}</code> → Deploy. Then sign in as usual.</p>
        </div>
      )}
    </details>
  );
}
