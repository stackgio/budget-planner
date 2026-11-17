import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { loadGoals } from "@/server/growth";
import { loadHabits } from "@/server/queries";
import { dateToLocal, formatLocalDate, localToDbDate } from "@/domain/dates";
import { weekOf } from "@/domain/growth";
import { PageHeader, Section, Stat, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { HabitGrid } from "../../tasks/Habits";
import { GoalCard } from "../GoalCard";
import { ActivityForm } from "../ActivityForm";
import { ScheduleForm } from "../ScheduleForm";

const AREAS = ["COMMUNICATION", "READING", "LEARNING", "DISCIPLINE", "TIME_MANAGEMENT", "PROJECT", "PERSONAL"] as const;
const LABEL: Record<string, string> = { STUDY: "Study", SPEAKING: "Speaking", READING: "Reading", LEARNING: "Learning", PROJECT: "Projects", DISCIPLINE: "Discipline", CAREER_PREP: "Career prep", OTHER: "Other" };

export default async function GrowthPage() {
  const { user, today } = await appContext();
  const week = weekOf(today);
  const [goals, habits, logs, weekTotals] = await Promise.all([
    loadGoals(user.id, today, { category: { in: [...AREAS] }, status: { not: "ARCHIVED" } }),
    loadHabits(user.id, today),
    prisma.activityLog.findMany({ where: { ownerId: user.id, kind: { not: "STUDY" } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 15 }),
    prisma.activityLog.groupBy({ by: ["kind"], where: { ownerId: user.id, date: { gte: localToDbDate(week.start), lte: localToDbDate(week.end) } }, _sum: { minutes: true } }),
  ]);
  const minutes = (k: string) => weekTotals.find((w) => w.kind === k)?._sum.minutes ?? 0;
  const total = weekTotals.reduce((a, w) => a + (w._sum.minutes ?? 0), 0);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Personal growth" title="Growth">
        <Dialog title="Log practice time" trigger="Log time" triggerClassName="btn-primary"><ActivityForm today={today} kind="SPEAKING" goals={goals.map((g) => ({ id: g.id, title: g.title }))} /></Dialog>
      </PageHeader>
      <section className="card grid grid-cols-3 gap-3">
        <Stat label="This week" value={`${total} min`} tone="go" sub="all practice logged" />
        <Stat label="Speaking" value={`${minutes("SPEAKING")} min`} sub="aim 10–15 min a day" />
        <Stat label="Reading" value={`${minutes("READING")} min`} tone="mute" />
      </section>
      <p className="text-sm text-mute-300">Speaking practice is about clarity and confidence — your accent is part of your voice, not something to fix.</p>

      <Section title="Growth goals" action={<a href="/goals" className="link text-xs">New goal</a>}>
        {goals.length ? <div className="grid gap-3 sm:grid-cols-2">{goals.map((g) => <GoalCard key={g.id} g={g} />)}</div> : <Empty>Create goals for communication, reading, learning, discipline, time management or a personal project.</Empty>}
      </Section>

      <Section title="Habits"><HabitGrid habits={habits.filter((h) => !h.archived)} today={today} /></Section>

      <Section title="Recent practice" action={<Dialog title="Schedule practice" trigger="Schedule" triggerClassName="btn-ghost btn-sm"><ScheduleForm category="PERSONAL" defaultTitle="Speaking practice" today={today} defaultTime="19:30" duration={15} repeat defaultDays={[0, 1, 2, 3, 4, 5, 6]} /></Dialog>}>
        {logs.length ? <ul className="divide-line text-sm">{logs.map((l) => <li key={l.id} className="flex justify-between py-2"><span>{l.title ?? LABEL[l.kind]} <span className="text-xs text-mute-400">· {LABEL[l.kind]} · {formatLocalDate(dateToLocal(l.date), "weekday")}</span></span><span className="num">{l.minutes} min</span></li>)}</ul> : <Empty>Nothing logged yet. Only time you log is counted.</Empty>}
      </Section>
    </div>
  );
}
