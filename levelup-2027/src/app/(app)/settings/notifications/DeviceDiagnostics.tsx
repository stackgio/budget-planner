"use client";
import { useEffect, useState } from "react";

type Row = { label: string; value: string; ok: boolean | null };

/** What this browser reports about itself. Read-only: it never asks for permission or subscribes. */
export function DeviceDiagnostics() {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    (async () => {
      const ua = navigator.userAgent;
      const ios = /iPhone|iPad|iPod/.test(ua);
      const iosVer = ua.match(/OS (\d+)_(\d+)/);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      const hasSW = "serviceWorker" in navigator;
      const reg = hasSW ? await navigator.serviceWorker.getRegistration().catch(() => undefined) : undefined;
      const sub = reg && "pushManager" in reg ? await reg.pushManager.getSubscription().catch(() => null) : null;
      const out: Row[] = [
        { label: "Secure connection (HTTPS)", value: window.isSecureContext ? "Yes" : "No — push needs HTTPS", ok: window.isSecureContext },
        { label: "Service worker", value: reg ? (reg.active ? "Active" : "Installing") : hasSW ? "Not registered yet" : "Not supported", ok: !!reg?.active },
        { label: "Notification permission", value: "Notification" in window ? Notification.permission : "Not available", ok: "Notification" in window ? Notification.permission === "granted" : null },
        { label: "Push subscription on this device", value: sub ? "Yes" : "No", ok: !!sub },
      ];
      if (ios) {
        const major = iosVer ? Number(iosVer[1]) : null, minor = iosVer ? Number(iosVer[2]) : 0;
        out.push({ label: "iOS version", value: iosVer ? `${iosVer[1]}.${iosVer[2]}` : "Unknown", ok: major === null ? null : major > 16 || (major === 16 && minor >= 4) });
        out.push({ label: "Opened from Home Screen", value: standalone ? "Yes" : "No — required for push on iPhone", ok: standalone });
      }
      setRows(out);
    })().catch(() => setRows([]));
  }, []);
  if (!rows) return <p className="text-sm text-mute-400" aria-busy="true">Checking this device…</p>;
  return (
    <dl className="divide-line text-sm" aria-label="This device">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-3 py-2">
          <dt className="text-mute-300">{r.label}</dt>
          <dd className={r.ok === true ? "text-go" : r.ok === false ? "text-warn" : "text-mute-400"}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
