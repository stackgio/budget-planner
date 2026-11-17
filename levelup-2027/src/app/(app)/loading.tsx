/** Shown instantly while a page's data loads (server rendering). Matches the card layout to avoid layout jumps. */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-4 w-24 animate-pulse rounded bg-ink-800" />
      <div className="h-8 w-48 animate-pulse rounded-lg bg-ink-800" />
      <div className="h-40 animate-pulse rounded-3xl border border-ink-800 bg-ink-900" />
      <div className="h-24 animate-pulse rounded-3xl border border-ink-800 bg-ink-900" />
      <div className="h-24 animate-pulse rounded-3xl border border-ink-800 bg-ink-900" />
    </div>
  );
}
