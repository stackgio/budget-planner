import { CalendarClock, Check, ChevronsRight, RotateCcw, SkipForward, Star, Trash2, Plus, Pencil, Repeat } from "lucide-react";
import { Dialog } from "@/ui/dialog";
import { cn } from "@/ui/cn";
import { type LocalDate, formatLocalDate, formatTime12 } from "@/domain/dates";
import { parseRRule } from "@/domain/recurrence";
import { taskOpAction } from "./actions";
import { TaskForm } from "./TaskForm";

export interface TaskRow {
  id: string; title: string; description: string | null; category: string | null; priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: LocalDate | null; dueTime: string | null; rrule: string | null; reminderMin: number | null;
  optional: boolean; isTopThree: boolean; status: "OPEN" | "DONE" | "SKIPPED";
  subtasks: { id: string; title: string; status: "OPEN" | "DONE" | "SKIPPED" }[];
}

function Op({ id, op, label, children, className = "btn-ghost btn-sm", to }: { id: string; op: string; label: string; children: React.ReactNode; className?: string; to?: string }) {
  return (
    <form action={taskOpAction}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} />
      {to && <input type="hidden" name="to" value={to} />}
      <button className={className} aria-label={label} title={label}>{children}</button>
    </form>
  );
}

const PRIO = { HIGH: "text-bad", MEDIUM: "text-warn", LOW: "text-mute-400" };

export function TaskList({ tasks, today, showActions = true, dim }: { tasks: TaskRow[]; today: LocalDate; showActions?: boolean; dim?: (t: TaskRow) => boolean }) {
  return (
    <ul className="divide-line">
      {tasks.map((t) => {
        const overdue = t.status === "OPEN" && t.dueDate && t.dueDate < today;
        const repeatFreq = t.rrule ? parseRRule(t.rrule).freq : null;
        return (
          <li key={t.id} id={`task-${t.id}`} className={cn("py-3", dim?.(t) && "opacity-50")}>
            <div className="flex items-start gap-3">
              {t.status === "OPEN" ? (
                <Op id={t.id} op="done" label={`Complete ${t.title}`} className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink-500 text-transparent hover:border-go hover:text-go"><Check size={14} /></Op>
              ) : (
                <Op id={t.id} op="reopen" label={`Reopen ${t.title}`} className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-go bg-go text-ink-950"><Check size={14} /></Op>
              )}
              <div className="min-w-0 flex-1">
                <p className={cn("text-[15px] font-medium", t.status !== "OPEN" && "text-mute-400 line-through")}>
                  {t.isTopThree && <Star size={13} className="mr-1 inline fill-go text-go" aria-label="Top priority" />}
                  {t.title}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-mute-400">
                  <span className={PRIO[t.priority]}>{t.priority.toLowerCase()}</span>
                  {t.dueDate && <span className={cn(overdue && "font-semibold text-bad")}>{overdue ? "Overdue · " : ""}{formatLocalDate(t.dueDate, "weekday")}{t.dueTime && ` ${formatTime12(t.dueTime)}`}</span>}
                  {repeatFreq && <span className="inline-flex items-center gap-1"><Repeat size={11} /> {repeatFreq.toLowerCase()}</span>}
                  {t.category && <span>#{t.category}</span>}
                  {t.optional && <span>optional</span>}
                  {t.status === "SKIPPED" && <span>skipped</span>}
                </p>
                {t.description && <p className="mt-1 line-clamp-2 text-sm text-mute-300">{t.description}</p>}
                {t.subtasks.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {t.subtasks.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 text-sm">
                        <Op id={s.id} op={s.status === "OPEN" ? "done" : "reopen"} label={`Toggle ${s.title}`} className={cn("flex h-5 w-5 items-center justify-center rounded border", s.status === "OPEN" ? "border-ink-500" : "border-go bg-go text-ink-950")}>
                          {s.status !== "OPEN" && <Check size={11} />}
                        </Op>
                        <span className={cn(s.status !== "OPEN" && "text-mute-400 line-through")}>{s.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {showActions && (
                  <div className="mt-2 flex flex-wrap items-center gap-0.5 text-mute-400">
                    {t.status === "OPEN" && <Op id={t.id} op="postpone" label="Postpone one day"><ChevronsRight size={15} /> <span className="hidden sm:inline">Tomorrow</span></Op>}
                    {t.status === "OPEN" && <Op id={t.id} op="skip" label="Skip"><SkipForward size={15} /> <span className="hidden sm:inline">Skip</span></Op>}
                    {t.status === "OPEN" && <Op id={t.id} op={t.isTopThree ? "untop" : "top"} label={t.isTopThree ? "Remove from top 3" : "Make top 3"}><Star size={15} className={t.isTopThree ? "fill-go text-go" : ""} /></Op>}
                    {t.status === "OPEN" && (
                      <Dialog title="Postpone to…" trigger={<CalendarClock size={15} />} triggerClassName="btn-ghost btn-sm" triggerLabel="Postpone to a date">
                        <form action={taskOpAction} className="space-y-3">
                          <input type="hidden" name="id" value={t.id} /><input type="hidden" name="op" value="postpone" />
                          <input type="date" name="to" className="input" min={today} required />
                          <button className="btn-primary w-full">Move task</button>
                        </form>
                      </Dialog>
                    )}
                    <Dialog title="Add subtask" trigger={<Plus size={15} />} triggerClassName="btn-ghost btn-sm" triggerLabel="Add subtask"><TaskForm v={{ parentId: t.id }} compact /></Dialog>
                    <Dialog title="Edit task" trigger={<Pencil size={15} />} triggerClassName="btn-ghost btn-sm" triggerLabel="Edit task">
                      <TaskForm v={{ ...t, repeat: repeatFreq && repeatFreq !== "YEARLY" ? repeatFreq : "NONE" }} />
                    </Dialog>
                    {t.status !== "OPEN" && <Op id={t.id} op="reopen" label="Reopen"><RotateCcw size={15} /></Op>}
                    <Dialog title="Delete task?" trigger={<Trash2 size={15} />} triggerClassName="btn-ghost btn-sm hover:text-bad" triggerLabel="Delete task">
                      <p className="mb-4 text-sm text-mute-300">“{t.title}” and its subtasks will be removed.</p>
                      <Op id={t.id} op="delete" label="Confirm delete" className="btn-danger w-full">Delete task</Op>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
