import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, formatMonth, type YearMonth } from "@/lib/dates";

export function MonthSwitcher({ month, current, basePath, extra = "" }: { month: YearMonth; current: YearMonth; basePath: string; extra?: string }) {
  const href = (m: YearMonth) => `${basePath}?month=${m}${extra}`;
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
      <Link href={href(addMonths(month, -1))} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Link>
      <span className="min-w-[124px] text-center text-sm font-medium">{formatMonth(month)}</span>
      <Link href={href(addMonths(month, 1))} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="Next month"><ChevronRight className="h-4 w-4" /></Link>
      {month !== current && <Link href={href(current)} className="rounded-lg px-2 text-xs font-medium text-brand hover:underline">Today</Link>}
    </div>
  );
}
