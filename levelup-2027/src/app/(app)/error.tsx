"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-md text-center">
      <p className="h2">Something went wrong</p>
      <p className="mt-2 text-sm text-mute-400">{error.message || "An unexpected error occurred."} Nothing was changed.</p>
      <button className="btn-primary mt-4" onClick={reset}>Try again</button>
    </div>
  );
}
