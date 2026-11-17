"use client";
import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";

type State = "checking" | "unsupported" | "ios-browser" | "denied" | "not-configured" | "ready" | "subscribed" | "error";

function b64ToUint8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Permission and subscription controls. Asks for permission only when you tap the button. */
export function PushControls() {
  const [state, setState] = useState<State>("checking");
  const [msg, setMsg] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState(ios && !standalone ? "ios-browser" : "unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const { publicKey } = await fetch("/api/push/key").then((r) => r.json()).catch(() => ({ publicKey: null }));
      if (!publicKey) return setState("not-configured");
      setKey(publicKey);
      const reg = await navigator.serviceWorker.ready;
      setState((await reg.pushManager.getSubscription()) ? "subscribed" : "ready");
    })().catch(() => setState("error"));
  }, []);

  async function enable() {
    setMsg(null);
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return setState(perm === "denied" ? "denied" : "ready");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8(key!) });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, label: /iPhone/.test(navigator.userAgent) ? "iPhone" : "This device" }) });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save");
      setState("subscribed");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not enable notifications.");
      setState("error");
    }
  }

  async function disable() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
    setState("ready");
  }

  const text: Record<State, string> = {
    checking: "Checking this device…",
    unsupported: "This browser doesn't support web push. In-app notifications still work.",
    "ios-browser": "On iPhone, push works only after you add LEVEL UP to your Home Screen (Share → Add to Home Screen) and open it from there. iOS 16.4 or later.",
    denied: "Notifications are blocked for this site. You can allow them again in your device settings. In-app notifications still work.",
    "not-configured": "Push isn't set up on this server yet. It needs an HTTPS deployment with push keys, which hasn't been approved. In-app notifications work now.",
    ready: "This device can receive push notifications.",
    subscribed: "Push is on for this device.",
    error: msg ?? "Something went wrong.",
  };
  return (
    <div className="space-y-3" data-push-state={state}>
      <p role="status" className="text-sm text-mute-300">{text[state]}</p>
      {state === "ready" && <button type="button" className="btn-primary btn-sm" onClick={enable}><BellRing size={14} /> Enable on this device</button>}
      {state === "subscribed" && <button type="button" className="btn-secondary btn-sm" onClick={disable}>Turn off on this device</button>}
    </div>
  );
}
