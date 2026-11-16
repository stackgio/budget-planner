"use client";
import { useState } from "react";

/**
 * One idempotency key per form instance. A double tap, a retry after a network error, or a
 * resubmitted request reuses the same key, so the server records the operation only once.
 */
export function IdemKey({ name = "idempotencyKey" }: { name?: string }) {
  const [key] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`));
  return <input type="hidden" name={name} value={key} />;
}
