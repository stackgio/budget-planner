import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5 py-12">
      <div className="mb-8">
        <p className="eyebrow text-go">LEVEL UP 2027</p>
        <h1 className="h1 mt-2">{title}</h1>
        <p className="mt-2 text-sm text-mute-400">{subtitle}</p>
      </div>
      {children}
      <p className="mt-10 text-center text-xs text-ink-500">Private. Your data stays on your own server.</p>
    </main>
  );
}
