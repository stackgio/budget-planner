import { Check } from "lucide-react";
import { type LocalDate, WEEKDAYS, addDays, weekday } from "@/domain/dates";
import { cn } from "@/ui/cn";
import type { HabitRow } from "@/server/queries";
import { toggleHabitAction } from "./actions";

/** 7-day habit grid. Every check-in is an explicit tap; nothing is ever marked automatically. */
export function HabitGrid({ habits, today, paused }: { habits: HabitRow[]; today: LocalDate; paused?: boolean }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return (
    <div>
      {paused && <p className="mb-3 text-xs text-mute-400">Optional habits are paused in this mode. You can still check them off — there is no penalty for missing them.</p>}
      {/* Mobile: name on its own line, 7 day boxes below. Wider screens: one row. */}
      <div className="grid grid-cols-7 gap-1 sm:grid-cols-[minmax(0,1fr)_repeat(7,36px)] sm:items-center sm:gap-y-2">
        <span className="hidden sm:block" />
        {days.map((d) => <span key={d} className={cn("text-center text-[10px] font-semibold uppercase", d === today ? "text-go" : "text-mute-400")}>{WEEKDAYS[weekday(d)]!.slice(0, 2)}</span>)}
        {habits.map((h) => (
          <HabitRowView key={h.id} h={h} days={days} today={today} />
        ))}
      </div>
    </div>
  );
}

function HabitRowView({ h, days, today }: { h: HabitRow; days: LocalDate[]; today: LocalDate }) {
  return (
    <>
      <span className="col-span-7 mt-2 truncate text-sm sm:col-span-1 sm:mt-0">
        {h.emoji && <span className="mr-1.5" aria-hidden>{h.emoji}</span>}{h.name}
        <span className="ml-2 text-xs text-mute-400 num">{h.done.size}/{Math.min(7, h.targetPerWeek)}</span>
      </span>
      {days.map((d) => {
        const done = h.done.has(d);
        return (
          <form key={d} action={toggleHabitAction} className="flex justify-center">
            <input type="hidden" name="habitId" value={h.id} /><input type="hidden" name="date" value={d} />
            <button
              aria-label={`${h.name} on ${d}: ${done ? "done, tap to undo" : "not done, tap to check in"}`}
              aria-pressed={done}
              className={cn("flex h-9 w-full max-w-[44px] items-center sm:h-8 sm:w-8 justify-center rounded-lg border transition-colors", done ? "border-go bg-go text-ink-950" : "border-ink-600 bg-ink-900 text-transparent hover:border-go/60", d === today && !done && "border-ink-500")}
            >
              <Check size={14} />
            </button>
          </form>
        );
      })}
    </>
  );
}
