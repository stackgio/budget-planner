import type { ReactNode } from "react";
import { cn } from "./cn";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="h1">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("card", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="eyebrow">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-mute-400">{children}</p>;
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "go" | "warn" | "mute" }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={cn("num mt-1 font-display text-2xl font-bold", tone === "go" && "text-go", tone === "warn" && "text-warn", tone === "mute" && "text-mute-300")}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-mute-400">{sub}</p>}
    </div>
  );
}

export function ProvisionalBadge({ verified }: { verified: boolean }) {
  return verified ? <span className="chip-go">Verified anchor</span> : <span className="chip-warn">Provisional · unverified</span>;
}
