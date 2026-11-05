import Link from "next/link";
import { AlertOctagon, AlertTriangle, Info, ChevronRight } from "lucide-react";
import type { Warning } from "@/lib/health";
import { cn } from "@/lib/utils";

export function Warnings({ items, limit }: { items: Warning[]; limit?: number }) {
  if (!items.length) return <p className="text-sm text-muted">No issues found in your data right now.</p>;
  const shown = limit ? items.slice(0, limit) : items;
  return (
    <ul className="divide-y divide-border">
      {shown.map((w) => {
        const Icon = w.severity === "critical" ? AlertOctagon : w.severity === "warning" ? AlertTriangle : Info;
        const tone = w.severity === "critical" ? "text-danger" : w.severity === "warning" ? "text-warn" : "text-info";
        return (
          <li key={w.id}>
            <Link href={w.action.href} className="group flex items-start gap-3 py-3">
              <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", tone)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{w.title}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted">{w.detail}</p>
              </div>
              <span className="mt-0.5 flex shrink-0 items-center text-[12px] font-medium text-brand opacity-80 group-hover:opacity-100">{w.action.label}<ChevronRight className="h-3.5 w-3.5" /></span>
            </Link>
          </li>
        );
      })}
      {limit && items.length > limit && <li className="pt-3 text-[13px] text-muted">+{items.length - limit} more on the Budget page</li>}
    </ul>
  );
}
