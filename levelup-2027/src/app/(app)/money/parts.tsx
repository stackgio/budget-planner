import type { ReactNode } from "react";
import { formatCents } from "@/domain/money";
import { cn } from "@/ui/cn";

export type LineTarget = "ROTH" | "FUN" | "EMERGENCY" | "GOAL" | "MOVING_TILE" | "SCHD_DAY" | "DEBT_TILE";

export const TARGET_META: Record<LineTarget, { label: string; emoji: string; color: string }> = {
  ROTH: { label: "Roth IRA", emoji: "🏦", color: "#7AA2FF" },
  FUN: { label: "Guilt-free money", emoji: "😎", color: "#F5B53D" },
  EMERGENCY: { label: "Emergency savings", emoji: "🛟", color: "#4FD1C5" },
  GOAL: { label: "Goal", emoji: "🎯", color: "#B98CFF" },
  MOVING_TILE: { label: "Moving-Out", emoji: "🏠", color: "#2BEA7A" },
  SCHD_DAY: { label: "SCHD", emoji: "📈", color: "#9BE15D" },
  DEBT_TILE: { label: "Debt payoff", emoji: "⛓️", color: "#FF6B6B" },
};

export function lineTitle(l: { target: LineTarget; label?: string | null; tileNumber?: number | null }) {
  const m = TARGET_META[l.target];
  if (l.target === "SCHD_DAY") return `SCHD · Day ${l.tileNumber}`;
  if (l.target === "MOVING_TILE") return `Moving-Out · Tile #${l.tileNumber}`;
  if (l.target === "DEBT_TILE") return `Debt · Tile #${l.tileNumber}`;
  if (l.target === "GOAL") return l.label || "Goal";
  return m.label;
}

export function LineIcon({ target }: { target: LineTarget }) {
  const m = TARGET_META[target];
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: `${m.color}1f`, border: `1px solid ${m.color}40` }} aria-hidden>
      {m.emoji}
    </span>
  );
}

export function StatusPill({ status }: { status: "PLANNED" | "RESERVED" | "COMPLETED" | "CANCELLED" }) {
  const map = {
    PLANNED: ["chip-mute", "Proposed"],
    RESERVED: ["chip-warn", "Reserved · not paid"],
    COMPLETED: ["chip-go", "Confirmed"],
    CANCELLED: ["chip-mute", "Released"],
  } as const;
  const [cls, text] = map[status];
  return <span className={cls}>{text}</span>;
}

export function Progress({ value, max, tone = "go", label }: { value: number; max: number; tone?: "go" | "warn"; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} className="h-2 overflow-hidden rounded-full bg-ink-700">
      <div className={cn("h-full rounded-full transition-[width] duration-500", tone === "go" ? "bg-go" : "bg-warn")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function MoneyFigure({ cents, className, sub }: { cents: number; className?: string; sub?: ReactNode }) {
  const [d, c] = formatCents(cents).split(".");
  return (
    <span className={cn("num font-display font-bold tracking-tight", className)}>
      {d}<span className="text-[0.55em] opacity-70">.{c}</span>
      {sub && <span className="ml-1 text-sm font-medium text-mute-400">{sub}</span>}
    </span>
  );
}

export interface TileView {
  id: string;
  number: number;
  amountCents: number;
  status: "OPEN" | "PROVISIONAL" | "COMPLETED";
  reserved: boolean;
  payment: { paidOn: string; source: string } | null;
}

export function TileGrid({ tiles, next, label }: { tiles: TileView[]; next?: number | null; label: string }) {
  return (
    <div>
      <ul aria-label={label} className="grid grid-cols-10 gap-1 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
        {tiles.map((t) => {
          const state = t.status === "COMPLETED" ? "completed" : t.reserved ? "reserved" : t.status === "PROVISIONAL" ? "provisional (unverified)" : "open";
          return (
            <li key={t.id}
              title={`#${t.number} · ${formatCents(t.amountCents)} · ${state}${t.payment ? ` · paid ${t.payment.paidOn}` : ""}`}
              aria-label={`Tile ${t.number}, ${formatCents(t.amountCents)}, ${state}`}
              className={cn("relative flex aspect-square items-center justify-center rounded-md border text-[10px] font-semibold num sm:text-[11px]",
                t.status === "COMPLETED" && "border-go bg-go text-ink-950",
                t.status !== "COMPLETED" && t.reserved && "border-go/70 bg-go/10 text-go",
                t.status === "PROVISIONAL" && !t.reserved && "border-dashed border-warn/60 bg-warn/5 text-warn",
                t.status === "OPEN" && !t.reserved && "border-ink-700 bg-ink-900 text-mute-300",
                t.number === next && t.status === "OPEN" && !t.reserved && "ring-2 ring-go ring-offset-1 ring-offset-ink-850")}>
              {t.number}
              {t.reserved && t.status !== "COMPLETED" && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-go" aria-hidden />}
            </li>
          );
        })}
      </ul>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mute-400" aria-label="Legend">
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-go bg-go" /> Confirmed</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-go/70 bg-go/10" /> Reserved (not paid yet)</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed border-warn/60" /> Provisional · unverified</li>
        <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-ink-700 bg-ink-900" /> Open</li>
      </ul>
    </div>
  );
}
