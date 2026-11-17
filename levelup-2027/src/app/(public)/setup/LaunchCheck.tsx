"use client";
import { useState } from "react";

type Item = { id: string; label: string; ok: boolean; detail: string };

/** Production readiness check, run before entering any personal information. */
export function LaunchCheck() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<{ ok: boolean; items: Item[] } | { error: string } | null>(null);
  async function run(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true); setRes(null);
    const r = await fetch("/api/setup/check", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: fd.get("checkToken"), runBackup: fd.get("runBackup") === "on" }) })
      .then((x) => x.json()).catch(() => ({ error: "Network error." }));
    setRes(r); setBusy(false);
  }
  return (
    <details className="mt-6 rounded-2xl border border-ink-700 p-4" onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-sm font-semibold">Launch check (run before creating your account)</summary>
      {open && (
        <form onSubmit={run} className="mt-4 space-y-3" aria-busy={busy}>
          <label className="block"><span className="label">Setup token (for the check)</span><input className="input" name="checkToken" type="password" required autoComplete="off" /></label>
          <label className="flex min-h-[40px] items-center gap-3 text-sm"><input type="checkbox" name="runBackup" className="h-5 w-5 accent-[#2bea7a]" /> Also make a test backup and test-restore it</label>
          <button className="btn-secondary w-full" disabled={busy}>{busy ? "Checking… (up to a minute)" : "Run launch check"}</button>
        </form>
      )}
      {res && "error" in res && <p role="alert" className="mt-3 rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{res.error}</p>}
      {res && "items" in res && (
        <div className="mt-3">
          <p role="status" className={res.ok ? "font-semibold text-go" : "font-semibold text-warn"}>{res.ok ? "✓ All checks passed" : "Some checks need attention"}</p>
          <ul className="mt-2 divide-line text-sm" aria-label="Launch check results">
            {res.items.map((i) => (
              <li key={i.id} data-check={i.id} data-ok={i.ok} className="flex items-start gap-2 py-2">
                <span aria-hidden className={i.ok ? "text-go" : "text-bad"}>{i.ok ? "✓" : "✗"}</span>
                <span><span className="block">{i.label}</span><span className="text-xs text-mute-400">{i.detail}</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}
