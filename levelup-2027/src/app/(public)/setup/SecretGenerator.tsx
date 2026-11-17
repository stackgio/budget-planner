"use client";
import { useState } from "react";

import { type GeneratedSecret as Secret, generateLaunchSecrets } from "@/domain/secrets";

/**
 * First-time setup helper for someone with only an iPhone. Values are created IN THIS BROWSER with the
 * system's secure random generator and are never sent to the server. Copy each into the Passwords app
 * and into Railway's Variables.
 */
export function SecretGenerator() {
  const [secrets, setSecrets] = useState<Secret[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  async function generate() { setSecrets(await generateLaunchSecrets()); }
  async function copy(s: Secret) {
    await navigator.clipboard.writeText(s.value).catch(() => {});
    setCopied(s.name);
    setTimeout(() => setCopied(null), 1500);
  }
  return (
    <details className="mt-6 rounded-2xl border border-ink-700 p-4">
      <summary className="cursor-pointer text-sm font-semibold">First time? Generate your secrets</summary>
      <p className="mt-3 text-xs text-mute-400">Made on this phone and never sent anywhere. For each one: tap Copy, save it in the <strong className="text-mute-300">Passwords</strong> app as its own entry, then paste it into Railway → Variables. Do this once — generating again makes new, different values.</p>
      {!secrets ? <button type="button" className="btn-secondary mt-3 w-full" onClick={generate}>Generate</button> : (
        <ul className="mt-3 space-y-3">
          {secrets.map((s) => (
            <li key={s.name} className="rounded-xl border border-ink-700 p-3">
              <div className="flex items-center justify-between gap-2"><code className="text-xs font-semibold text-white">{s.name}</code>
                <button type="button" className="btn-ghost btn-sm" onClick={() => copy(s)}>{copied === s.name ? "Copied" : "Copy"}</button></div>
              <p className="mt-1 break-all font-mono text-[11px] text-mute-300" data-secret={s.name}>{s.value}</p>
              <p className="mt-1 text-[11px] text-mute-400">{s.note}</p>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
