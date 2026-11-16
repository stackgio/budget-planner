import Link from "next/link";
import { Plus } from "lucide-react";
import { appContext } from "@/server/context";
import { loadHabits, loadTasks } from "@/server/queries";
import { TASK_VIEWS, inView, type TaskView } from "@/domain/tasks";
import { suppressOptional } from "@/domain/modes";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { cn } from "@/ui/cn";
import { StripParam } from "@/ui/StripParam";
import { TaskList } from "./TaskList";
import { TaskForm } from "./TaskForm";
import { HabitGrid } from "./Habits";
import { habitAction } from "./actions";

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { user, today, mode } = await appContext();
  const sp = await searchParams;
  const tab = sp.tab === "habits" ? "habits" : "tasks";
  const view: TaskView = TASK_VIEWS.some((v) => v.id === sp.view) ? (sp.view as TaskView) : "today";

  const tasks = await loadTasks(user.id);
  const counts = Object.fromEntries(TASK_VIEWS.map((v) => [v.id, tasks.filter((t) => inView(t, v.id, today)).length]));
  const list = tasks.filter((t) => inView(t, view, today));
  const habits = await loadHabits(user.id, today);

  return (
    <div>
      <PageHeader eyebrow="Tasks & habits" title={tab === "habits" ? "Habits" : "Tasks"}>
        <Dialog title="New task" trigger={<><Plus size={16} /> Add task</>} triggerClassName="btn-primary">
          <TaskForm v={{ dueDate: view === "today" ? today : undefined }} />
        </Dialog>
      </PageHeader>

      <div className="mb-4 flex rounded-xl border border-ink-700 bg-ink-900 p-1" role="tablist">
        {(["tasks", "habits"] as const).map((t) => (
          <Link key={t} role="tab" aria-selected={tab === t} href={`/tasks?tab=${t}`} className={cn("flex min-h-[40px] flex-1 items-center justify-center rounded-lg text-sm font-semibold capitalize", tab === t ? "bg-ink-700 text-white" : "text-mute-400")}>{t}</Link>
        ))}
      </div>

      {tab === "tasks" ? (
        <>
          <nav aria-label="Task views" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {TASK_VIEWS.map((v) => (
              <Link key={v.id} href={`/tasks?view=${v.id}`} aria-current={v.id === view ? "page" : undefined}
                className={cn("inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold", v.id === view ? "border-go bg-go/10 text-go" : "border-ink-700 text-mute-300", v.id === "overdue" && counts.overdue! > 0 && v.id !== view && "border-bad/50 text-bad")}>
                {v.label} <span className="num text-xs opacity-70">{counts[v.id]}</span>
              </Link>
            ))}
          </nav>
          <section className="card">
            {list.length ? <TaskList tasks={list} today={today} dim={(t) => suppressOptional(mode) && t.optional} /> : <Empty>{view === "today" ? "Nothing due today. Add a task or enjoy the breathing room." : "No tasks here."}</Empty>}
          </section>
          {sp.new === "1" && <><AutoOpenNew today={today} /><StripParam name="new" /></>}
        </>
      ) : (
        <div className="space-y-4">
          <Section title="Last 7 days">
            <HabitGrid habits={habits.filter((h) => !h.archived)} today={today} paused={suppressOptional(mode)} />
          </Section>
          <Section title="Manage habits">
            <ActionForm action={habitAction} resetOnSuccess className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="op" value="add" />
              <Field label="New habit" className="min-w-[180px] flex-1"><input className="input" name="name" required maxLength={40} /></Field>
              <Field label="Times / week" className="w-28"><input className="input" type="number" name="targetPerWeek" min={1} max={7} defaultValue={7} /></Field>
              <SubmitButton>Add</SubmitButton>
            </ActionForm>
            <ul className="divide-line mt-4">
              {habits.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                  <span className={cn(h.archived && "text-mute-400 line-through")}>{h.emoji} {h.name} <span className="text-xs text-mute-400">· {h.targetPerWeek}×/week</span></span>
                  <ActionForm action={habitAction}>
                    <input type="hidden" name="op" value={h.archived ? "restore" : "archive"} /><input type="hidden" name="id" value={h.id} />
                    <SubmitButton className="btn-ghost btn-sm" pendingText="…">{h.archived ? "Restore" : "Archive"}</SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-mute-400">Progress shows “x of last 7 days” — no streaks, no guilt.</p>
          </Section>
        </div>
      )}
    </div>
  );
}

function AutoOpenNew({ today }: { today: string }) {
  return (
    <Dialog title="New task" open>
      <TaskForm v={{ dueDate: today }} />
    </Dialog>
  );
}
