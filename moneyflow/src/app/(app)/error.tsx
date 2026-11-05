"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-danger/30 bg-surface p-6 text-center">
      <p className="font-semibold">Something went wrong loading this page.</p>
      <p className="mt-1 text-sm text-muted">{process.env.NODE_ENV === "development" ? error.message : "Your data wasn't changed."}</p>
      <button onClick={reset} className="mt-4 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-fg">Try again</button>
    </div>
  );
}
