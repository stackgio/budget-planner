"use client";
import { useEffect } from "react";

/** Removes a one-shot query param (e.g. ?new=1) so a refresh doesn't repeat the action. */
export function StripParam({ name }: { name: string }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.has(name)) {
      url.searchParams.delete(name);
      window.history.replaceState(window.history.state, "", url.pathname + (url.search || ""));
    }
  }, [name]);
  return null;
}
