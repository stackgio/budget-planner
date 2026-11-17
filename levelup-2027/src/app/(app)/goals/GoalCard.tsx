import Link from "next/link";
import type { GoalView } from "@/server/growth";
import { formatLocalDate } from "@/domain/dates";
import { cn } from "@/ui/cn";
import { CATEGORY_LABEL } from "./GoalForm";

const STATUS: Record<string, string> = { NOT_STARTED: "chip-mute", ACTIVE: "chip-go", PAUSED: "chip-warn", COMPLETED: "chip-go", ARCHIVED: "chip-mute" };

export function GoalCard({ g }: { g: GoalView }) {
  const pct = g.computed.pct;
  return (
    <Link href={`/goals/${g.id}`} className="card block transition-colors hover:border-go/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{g.title}</p>
          <p className="mt-0.5 text-xs text-mute-400">{CATEGORY_LABEL[g.category]} · {g.horizon.toLowerCase()}{g.targetDate ? ` · by ${formatLocalDate(g.targetDate, "weekday")}` : ""}</p>
        </div>
        <span className={cn(STATUS[g.status], g.overdue && "chip-bad")}>{g.overdue ? "past target" : g.status.replace("_", " ").toLowerCase()}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-700" role="progressbar" aria-label={`${g.title} progress`} aria-valuenow={pct === null ? undefined : Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-go" style={{ width: `${pct ?? 0}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-mute-400">{pct === null ? g.computed.label : `${Math.round(pct)}% · ${g.computed.label}`}</p>
    </Link>
  );
}
