import Link from "next/link";
import { CalendarPlus, CheckCircle2, Clock, Dices, ListPlus, Moon, Sparkles, Timer } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { loadOccurrences } from "@/server/calendar";
import { loadHabits, loadTasks } from "@/server/queries";
import { loadPayroll } from "@/server/money-queries";
import { loadExtraMonths, nextExtraMonth } from "@/server/extra";
import { CATEGORY_META } from "@/domain/calendar";
import { addDays, dateToLocal, diffDays, formatInstantTime, formatLocalDate, instantToLocalDate, localToDbDate, zonedToInstant } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { MODE_META, suppressOptional } from "@/domain/modes";
import { inView } from "@/domain/tasks";
import { weekOf } from "@/domain/growth";
import { ensureGrowthDefaults } from "@/server/growth";
import { fitnessWeek, relationshipOverview } from "@/server/life";
import { Section, Empty } from "@/ui/bits";
import { cn } from "@/ui/cn";
import { TaskList } from "./tasks/TaskList";
import { HabitGrid } from "./tasks/Habits";
import { ExtraCard } from "./money/ExtraCard";
import { ActivationButton } from "./ActivationButton";
import { quickModeAction } from "./mode-actions";

export default async function HomePage() {
  const { user, tz, today, mode, trackingStart } = await appContext();
  const now = new Date();
  const occ = await loadOccurrences(user.id, tz, zonedToInstant(today, "00:00", tz), zonedToInstant(addDays(today, 14), "00:00", tz), { includeTasks: false });
  const todays = occ.filter((o) => instantToLocalDate(o.start, tz) === today || (o.start < zonedToInstant(today, "00:00", tz) && o.end > zonedToInstant(today, "00:00", tz)));
  const shift = todays.find((o) => o.category === "DOC_SHIFT" || o.category === "OVERTIME_SHIFT" || o.category === "ACTIVATION");
  const nextEvent = occ.find((o) => !o.readOnly && !o.allDay && o.end > now && o.category !== "DOC_SHIFT");
  const workout = todays.find((o) => o.category === "WORKOUT");

  const tasks = await loadTasks(user.id);
  const top = tasks.filter((t) => t.isTopThree && t.status === "OPEN").slice(0, 3);
  const todo = tasks.filter((t) => inView(t, "today", today) && !t.isTopThree).slice(0, 6);
  const deadlines = tasks.filter((t) => t.status === "OPEN" && t.dueDate && t.dueDate > today && t.dueDate <= addDays(today, 14)).slice(0, 4);
  await ensureGrowthDefaults(user.id);
  const week = weekOf(today);
  const [fit, faithRows, activeGoals, milestones, rel] = await Promise.all([
    fitnessWeek(user.id, tz, week, today),
    prisma.faithEntry.findMany({ where: { ownerId: user.id, date: { gte: localToDbDate(week.start), lte: localToDbDate(week.end) } }, select: { date: true } }),
    prisma.goal.count({ where: { ownerId: user.id, status: "ACTIVE" } }),
    prisma.goalMilestone.findMany({ where: { goal: { ownerId: user.id, status: { in: ["ACTIVE", "NOT_STARTED"] } }, completedAt: null, dueDate: { gte: localToDbDate(today), lte: localToDbDate(addDays(today, 14)) } }, include: { goal: { select: { id: true } } }, take: 4 }),
    relationshipOverview(user.id, today),
  ]);
  const faithDays = new Set(faithRows.map((f) => dateToLocal(f.date))).size;
  const nextWorkout = fit.scheduled.find((s) => s.day >= today && !s.logged);
  const comingUp = [
    ...deadlines.map((t) => ({ icon: "☐", title: t.title, date: t.dueDate!, href: "/tasks?view=upcoming" })),
    ...milestones.map((m) => ({ icon: "🎯", title: m.title, date: dateToLocal(m.dueDate!), href: `/goals/${m.goal.id}` })),
    ...rel.upcoming.slice(0, 2).filter((d) => d.date <= addDays(today, 14)).map((d) => ({ icon: "💚", title: d.title, date: d.date, href: "/goals/relationship" })),
    ...rel.importantDates.filter((d) => d.next <= addDays(today, 21)).map((d) => ({ icon: "🎂", title: d.title, date: d.next, href: "/goals/relationship" })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 7);
  const habits = (await loadHabits(user.id, today)).filter((h) => !h.archived);

  const reg = await loadPayroll(user.id, "REGULAR");
  const ot = await loadPayroll(user.id, "OVERTIME");
  const nextReg = reg.paydays.find((p) => p.officialDate >= today);
  const nextOt = ot.paydays.find((p) => p.officialDate >= today);
  const toConfirm = [...reg.paydays, ...ot.paydays].filter((p) => !p.deposit && p.status === "EXPECTED" && (p.manualDepositDate ?? p.expectedDepositDate) <= today && (p.manualDepositDate ?? p.expectedDepositDate) >= trackingStart);
  const { months, verified } = await loadExtraMonths(user.id);
  const extra = nextExtraMonth(months, today);

  const challenges = await prisma.challenge.findMany({ where: { ownerId: user.id }, include: { tiles: { where: { status: "COMPLETED" }, select: { amountCents: true } } } });
  const waitingTransfers = await prisma.allocationLine.count({ where: { status: "RESERVED", plan: { ownerId: user.id } } });
  const overdue = tasks.filter((t) => inView(t, "overdue", today)).length;
  const paused = suppressOptional(mode);

  const headsUp: { text: string; href: string }[] = [];
  if (toConfirm.length) headsUp.push({ text: `${toConfirm.length} payday${toConfirm.length > 1 ? "s" : ""} waiting for you to confirm what arrived.`, href: toConfirm[0]!.kind === "REGULAR" ? "/money/payroll" : "/money/overtime" });
  if (overdue) headsUp.push({ text: `${overdue} overdue task${overdue > 1 ? "s" : ""}. Postpone or skip — no guilt.`, href: "/tasks?view=overdue" });
  if (!reg.schedule.anchorVerified) headsUp.push({ text: "Your regular payday anchor is still provisional. Verify it against a pay stub when you can.", href: "/money/payroll" });
  if (extra && diffDays(`${extra.month}-01`, today) <= 31) headsUp.push({ text: `${formatLocalDate(`${extra.month}-01`).split(" ")[0]} is a projected three-paycheck month.`, href: "/money/extra" });

  return (
    <div className="space-y-4">
      <header className="mb-2">
        <p className="eyebrow">{formatLocalDate(today, "long")}</p>
        <h1 className="h1 mt-1">Hey {user.displayName} 👋</h1>
        <p className="mt-1 text-sm text-mute-400">
          Mode: <span className={cn("font-semibold", mode === "NORMAL" ? "text-go" : "text-warn")}>{MODE_META[mode].label}</span>
          {shift ? ` · ${shift.title} ${formatInstantTime(shift.start, tz)}–${formatInstantTime(shift.end, tz)}` : " · No shift today"}
        </p>
      </header>

      <nav aria-label="Quick actions" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href="/calendar?new=1" className="btn-secondary shrink-0"><CalendarPlus size={16} /> Add Event</Link>
        <Link href="/tasks?new=1" className="btn-secondary shrink-0"><ListPlus size={16} /> Add Task</Link>
        <Link href="/money/overtime?new=1" className="btn-secondary shrink-0"><Timer size={16} /> Log Overtime</Link>
        {mode !== "ACTIVATION" && <ActivationButton today={today} className="btn-danger shrink-0" />}
        {mode !== "RECOVERY" && (
          <form action={quickModeAction} className="shrink-0"><input type="hidden" name="mode" value="RECOVERY" /><button className="btn-secondary"><Moon size={16} /> Start Recovery Mode</button></form>
        )}
        <Link href="/money/roulette" className="btn-secondary shrink-0"><Dices size={16} /> Spin My Overtime</Link>
        <Link href="/money/extra" className="btn-secondary shrink-0"><Sparkles size={16} /> Plan Extra Paycheck</Link>
        {waitingTransfers > 0 && <Link href="/money/roulette" className="btn-primary shrink-0"><CheckCircle2 size={16} /> Confirm Payment ({waitingTransfers})</Link>}
        {toConfirm.length > 0 && <Link href={toConfirm[0]!.kind === "REGULAR" ? "/money/payroll" : "/money/overtime"} className="btn-primary shrink-0"><CheckCircle2 size={16} /> Confirm payday</Link>}
      </nav>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Today's schedule" action={<Link href={`/calendar?view=day&date=${today}`} className="link text-xs">Open day</Link>}>
          {todays.filter((o) => !o.readOnly).length ? (
            <ul className="space-y-2">
              {todays.filter((o) => !o.readOnly).map((o) => (
                <li key={o.key} className={cn("flex items-center gap-3 text-sm", paused && o.optional && "opacity-50")}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_META[o.category].color }} />
                  <span className="w-28 shrink-0 text-mute-400 num">{o.allDay ? "All day" : `${formatInstantTime(o.start, tz)}–${formatInstantTime(o.end, tz)}`}</span>
                  <span className="truncate font-medium">{o.title}</span>
                </li>
              ))}
            </ul>
          ) : <Empty>Nothing scheduled today.</Empty>}
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-ink-700 pt-3 text-sm">
            <div><p className="eyebrow">Next event</p><p className="mt-1">{nextEvent ? <>{nextEvent.title}<span className="block text-xs text-mute-400">{formatLocalDate(instantToLocalDate(nextEvent.start, tz), "weekday")} {formatInstantTime(nextEvent.start, tz)}</span></> : <span className="text-mute-400">None in the next 2 weeks</span>}</p></div>
            <div><p className="eyebrow">Workout</p><p className="mt-1">{workout ? <>{workout.title}<span className="block text-xs text-mute-400">{formatInstantTime(workout.start, tz)}</span></> : <span className="text-mute-400">{paused ? "Rest is the plan" : "None planned"}</span>}</p></div>
          </div>
        </Section>

        <Section title="Paydays">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="eyebrow">Next regular</p>
              {nextReg ? (<>
                <p className="mt-1 text-lg font-semibold">{formatLocalDate(nextReg.officialDate, "weekday")}</p>
                <p className="text-xs text-mute-400">Est. deposit {formatLocalDate(nextReg.manualDepositDate ?? nextReg.expectedDepositDate, "weekday")}</p>
                {!reg.schedule.anchorVerified && <p className="mt-1 chip-warn">provisional</p>}
              </>) : <p className="text-mute-400">—</p>}
            </div>
            <div>
              <p className="eyebrow">Next overtime</p>
              {nextOt ? (<>
                <p className="mt-1 text-lg font-semibold">{formatLocalDate(nextOt.officialDate, "weekday")}</p>
                <p className="text-xs text-mute-400">Paid only if OT was worked</p>
              </>) : <p className="text-mute-400">—</p>}
            </div>
          </div>
          {extra && <div className="mt-4"><ExtraCard m={extra} verified={verified} today={today} compact /></div>}
        </Section>

        <Section title="Top 3 priorities" action={<Link href="/tasks?view=all" className="link text-xs">All tasks</Link>}>
          {top.length ? <TaskList tasks={top} today={today} showActions={false} /> : <Empty>Star up to three tasks to focus on.</Empty>}
        </Section>

        <Section title="To-do today" action={<Link href="/tasks" className="link text-xs">Tasks</Link>}>
          {todo.length ? <TaskList tasks={todo} today={today} showActions={false} dim={(t) => paused && t.optional} /> : <Empty>All clear for today.</Empty>}
        </Section>

        <Section title="Habits" action={<Link href="/tasks?tab=habits" className="link text-xs">Manage</Link>}>
          <HabitGrid habits={habits} today={today} paused={paused} />
        </Section>

        <Section title="This week" action={<Link href="/reviews" className="link text-xs">Weekly review</Link>}>
          <div className="grid grid-cols-3 gap-3">
            <div><p className="eyebrow">Workouts</p><p className="mt-1 num text-xl font-bold">{fit.completedCount}<span className="text-sm text-mute-400"> / {fit.target}</span></p>{fit.reducedBy > 0 && <p className="text-[11px] text-mute-400">eased for work</p>}</div>
            <div><p className="eyebrow">Faith days</p><p className="mt-1 num text-xl font-bold">{faithDays}</p></div>
            <div><p className="eyebrow">Goals</p><p className="mt-1 num text-xl font-bold">{activeGoals}</p><p className="text-[11px] text-mute-400">active</p></div>
          </div>
          <p className="mt-3 text-sm text-mute-300">Next workout: {nextWorkout ? `${formatLocalDate(nextWorkout.day, "weekday")} ${formatInstantTime(nextWorkout.start, tz)}` : <Link href="/goals/fitness" className="link">schedule one</Link>}</p>
        </Section>

        <Section title="Coming up">
          {comingUp.length ? (
            <ul className="space-y-2 text-sm">
              {comingUp.map((c, i) => (
                <li key={i}><Link href={c.href} className="flex items-center justify-between gap-2 hover:text-go"><span className="truncate">{c.icon} {c.title}</span><span className="flex shrink-0 items-center gap-1 text-xs text-mute-400"><Clock size={12} />{formatLocalDate(c.date, "weekday")}</span></Link></li>
              ))}
            </ul>
          ) : <Empty>Nothing due in the next two weeks.</Empty>}
        </Section>

        <Section title="Financial challenges" action={<Link href="/money/challenges" className="link text-xs">Details</Link>}>
          <ul className="space-y-3 text-sm">
            {challenges.sort((a, b) => a.kind.localeCompare(b.kind)).map((c) => {
              const done = c.tiles.reduce((s, t) => s + t.amountCents, 0);
              const pct = c.targetCents ? Math.min(100, (done / c.targetCents) * 100) : 0;
              return (
                <li key={c.id}>
                  <div className="flex justify-between"><span className="font-medium">{c.name}</span>
                    <span className="text-xs text-mute-400 num">{c.status === "SETUP_REQUIRED" ? "Setup required" : c.kind === "SCHD" ? `Next: Day ${c.nextNumber}` : `${formatCents(done)} / ${formatCents(c.targetCents ?? 0)}`}</span>
                  </div>
                  {c.status !== "SETUP_REQUIRED" && <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-700"><div className="h-full rounded-full bg-go" style={{ width: `${pct}%` }} /></div>}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs text-mute-400">Gig-income tracking arrives in Phase 5.</p>
        </Section>

        <Section title="Heads-up">
          {headsUp.length ? (
            <ul className="space-y-2 text-sm">{headsUp.map((h) => <li key={h.text}><Link href={h.href} className="hover:text-go">• {h.text}</Link></li>)}</ul>
          ) : <Empty>Nothing needs your attention.</Empty>}
          <p className="mt-3 text-xs text-mute-400">Simple rule-based notes from your data. The full assistant (briefings, check-ins, reflection) arrives in Phase 3.</p>
        </Section>
      </div>
    </div>
  );
}
