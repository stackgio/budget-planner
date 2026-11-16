"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserSupportsWebAuthn, startRegistration } from "@simplewebauthn/browser";
import { KeyRound } from "lucide-react";

export function AddPasskey() {
  const router = useRouter();
  const [label, setLabel] = useState("iPhone");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    setMsg(null);
    if (!browserSupportsWebAuthn()) return setMsg({ ok: false, text: "This browser does not support passkeys." });
    setBusy(true);
    try {
      const opts = await fetch("/api/auth/passkey/register/options", { method: "POST" }).then((r) => r.json());
      if (opts.error) throw new Error(opts.error);
      const response = await startRegistration({ optionsJSON: opts });
      const res = await fetch("/api/auth/passkey/register/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ response, label }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not add passkey.");
      setMsg({ ok: true, text: "Passkey added. You can now sign in with it." });
      router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error && e.name !== "NotAllowedError" ? e.message : "Cancelled or not allowed on this device." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[160px] flex-1"><span className="label">Device name</span><input className="input" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} /></label>
        <button type="button" className="btn-primary" onClick={add} disabled={busy}><KeyRound size={16} /> {busy ? "Waiting for device…" : "Add a passkey"}</button>
      </div>
      {msg && <p role="status" className={msg.ok ? "text-sm text-go" : "text-sm text-bad"}>{msg.text}</p>}
    </div>
  );
}
