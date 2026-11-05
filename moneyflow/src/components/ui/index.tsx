import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatCents, type Cents } from "@/lib/money";

/* shadcn/ui-style primitives, dependency-free, server-component friendly. */

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.03)] animate-fade-up", className)} {...p} />;
}
export function CardHeader({ title, subtitle, action, className }: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5", className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
export function CardBody({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...p} />;
}

const btnBase = "inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-medium transition active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 whitespace-nowrap";
const btnVariants = {
  primary: "bg-brand text-brand-fg hover:brightness-110 shadow-sm",
  secondary: "bg-surface-2 text-fg hover:bg-border/70",
  outline: "border border-border bg-surface hover:bg-surface-2",
  ghost: "hover:bg-surface-2 text-fg",
  danger: "bg-danger/10 text-danger hover:bg-danger/20",
};
const btnSizes = { sm: "h-8 px-3 text-[13px]", md: "h-10 px-4", lg: "h-12 px-5 text-base", icon: "h-9 w-9" };
type BtnProps = { variant?: keyof typeof btnVariants; size?: keyof typeof btnSizes };

export function Button({ variant = "primary", size = "md", className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & BtnProps) {
  return <button className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...p} />;
}
export function LinkButton({ variant = "primary", size = "md", className, href, ...p }: React.AnchorHTMLAttributes<HTMLAnchorElement> & BtnProps & { href: string }) {
  return <Link href={href} className={cn(btnBase, btnVariants[variant], btnSizes[size], className)} {...p} />;
}

export const inputCls = "h-10 w-full min-w-0 rounded-xl border border-border bg-surface px-3 text-fg placeholder:text-muted/70 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60";
export function Input({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputCls, className)} {...p} />;
}
export function MoneyInput({ className, ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative min-w-0">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
      <input inputMode="decimal" autoComplete="off" className={cn(inputCls, "pl-7 tabular", className)} placeholder="0.00" {...p} />
    </div>
  );
}
export function Select({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(inputCls, "pr-8", className)} {...p} />;
}
export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "h-auto min-h-[72px] py-2", className)} {...p} />;
}
export function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1 block text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
export function Checkbox({ label, className, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("flex items-center gap-2 text-sm", className)}>
      <input type="checkbox" className="h-4 w-4 rounded accent-[rgb(var(--brand))]" {...p} />
      <span>{label}</span>
    </label>
  );
}

const badgeTones = {
  neutral: "bg-surface-2 text-muted",
  brand: "bg-brand/12 text-brand bg-brand-soft/60 dark:bg-brand/15",
  warn: "bg-warn/15 text-warn",
  danger: "bg-danger/12 text-danger",
  info: "bg-info/12 text-info",
  forecast: "border border-dashed border-muted/50 text-muted bg-transparent",
};
export function Badge({ tone = "neutral", className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", badgeTones[tone], className)} {...p} />;
}

export function Money({ cents, className, sign, colored, compact }: { cents: Cents | null | undefined; className?: string; sign?: boolean; colored?: boolean; compact?: boolean }) {
  const tone = colored && cents ? (cents > 0 ? "text-brand" : "text-danger") : "";
  if (cents === null || cents === undefined) return <span className={cn("text-muted", className)} title="Unknown — not entered yet">Unknown</span>;
  return <span className={cn("tabular", tone, className)}>{formatCents(cents, { sign, compact })}</span>;
}

export function Progress({ value, max, tone = "brand", className, striped }: { value: number; max: number; tone?: "brand" | "warn" | "danger" | "info"; className?: string; striped?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const color = { brand: "bg-brand", warn: "bg-warn", danger: "bg-danger", info: "bg-info" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-[width] duration-700", color, striped && "forecast-stripe opacity-70")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({ label, children, hint, href, icon, className }: { label: string; children: React.ReactNode; hint?: React.ReactNode; href?: string; icon?: React.ReactNode; className?: string }) {
  const inner = (
    <>
      <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-wide text-muted">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 text-[22px] font-semibold tracking-tight sm:text-2xl">{children}</div>
      {hint && <div className="mt-1 text-[12px] leading-snug text-muted">{hint}</div>}
    </>
  );
  const cls = cn("block rounded-2xl border border-border bg-surface p-4 animate-fade-up", href && "transition hover:border-brand/40 hover:shadow-sm", className);
  return href ? <Link href={href} className={cls}>{inner}</Link> : <div className={cls}>{inner}</div>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-5 py-8 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({ tone = "info", title, children, className }: { tone?: "info" | "warn" | "danger" | "brand"; title?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  const t = { info: "border-info/30 bg-info/5", warn: "border-warn/40 bg-warn/5", danger: "border-danger/40 bg-danger/5", brand: "border-brand/30 bg-brand/5" }[tone];
  const tt = { info: "text-info", warn: "text-warn", danger: "text-danger", brand: "text-brand" }[tone];
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", t, className)}>
      {title && <p className={cn("font-semibold", tt)}>{title}</p>}
      {children && <div className={cn("text-fg/80", title && "mt-0.5")}>{children}</div>}
    </div>
  );
}

export function Row({ left, right, sub, className }: { left: React.ReactNode; right: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-2.5", className)}>
      <div className="min-w-0">
        <div className="truncate text-sm">{left}</div>
        {sub && <div className="truncate text-xs text-muted">{sub}</div>}
      </div>
      <div className="shrink-0 text-right text-sm">{right}</div>
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-4 overflow-x-auto sm:mx-0", className)}>
      <table className="w-full min-w-[560px] text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-[12px] [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted [&_tbody_tr]:border-t [&_tbody_tr]:border-border">
        {children}
      </table>
    </div>
  );
}

export function Details({ summary, children, open, className }: { summary: React.ReactNode; children: React.ReactNode; open?: boolean; className?: string }) {
  return (
    <details open={open} className={cn("group min-w-0 rounded-xl border border-border bg-surface", className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        {summary}
        <span className="text-muted transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
