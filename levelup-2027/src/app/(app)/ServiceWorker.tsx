"use client";
import { useEffect } from "react";

/** Registers the service worker (push + notification clicks). It never caches private pages. */
export function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
