import Link from "next/link";
import { Plus } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { loadGoals } from "@/server/growth";
import { formatLocalDate } from "@/domain/dates";
import { milestoneBuckets } from "@/domain/growth";
import { PageHeader, Section, Empty, Stat } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { GoalForm } from "./GoalForm";
import { GoalCard } from "./GoalCard";

const HORIZONS = [["YEAR", "This year"], ["QUARTER", "This quarter"], ["MONTH", "This month"], ["WEEK", "This week"]] as const;

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { user, today } = await appContext();
  const sp = await searchParams;
  const goals = await loadGoals(user.id, today);
  const challenges = await prisma.challenge.findMany({ where: { ownerId: user.id }, select: { id: true, name: true, status: true } });
  const habits = await prisma.habit.findMany({ where: { ownerId: user.id, archived: false }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } });
  const live = goals.filter((g) => g.status !== "ARCHIVED" && g.status !== "COMPLETED");
  const allMs = live.flatMap((g) => g.milestones.map((m) => ({ ...m, goal: g.title, goalId: g.id })));
  const { overdue, upcoming } = milestoneBuckets(allMs, today, 30);
  const recent = goals.filter((g) => g.status === "COMPLETED").sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)).slice(0, 5);
  const archived = goals.filter((g) => g.status === "ARCHIVED");

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Goals & growth" title="Goals">
        <Dialog title="New goal" trigger={<><Plus size={16} /> New goal</>} triggerClassName="btn-primary" wide>
          <GoalForm today={today} challenges={challenges} habits={habits} />
        </Dialog>
      </PageHeader>

      <section className="card grid grid-cols-3 gap-3">
        <Stat label="Active" value={live.filter((g) => g.status === "ACTIVE").length} tone="go" />
        <Stat label="Milestones next 30 days" value={upcoming.length} />
        <Stat label="Overdue milestones" value={overdue.length} tone={overdue.length ? "warn" : "mute"} />
      </section>

      {(overdue.length > 0 || upcoming.length > 0) && (
        <Section title="Milestones">
          <ul className="divide-line">
            {[...overdue, ...upcoming].slice(0, 8).map((m) => (
              <li key={m.id}><Link href={`/goals/${m.goalId}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0"><span className="block truncate font-medium">{m.title}</span><span className="text-xs text-mute-400">{m.goal}</span></span>
                <span className={m.dueDate! < today ? "chip-warn" : "chip-mute"}>{m.dueDate! < today ? "overdue · " : ""}{formatLocalDate(m.dueDate!, "weekday")}</span>
              </Link></li>
            ))}
          </ul>
        </Section>
      )}

      {live.length === 0 && <Section title="Start here"><Empty>No goals yet. Create one — progress only moves when you complete a milestone, log activity, or confirm a transfer.</Empty></Section>}
      {HORIZONS.map(([h, label]) => {
        const list = live.filter((g) => g.horizon === h);
        if (!list.length) return null;
        return (
          <section key={h} aria-label={label}>
            <p className="eyebrow mb-2">{label}</p>
            <div className="grid gap-3 sm:grid-cols-2">{list.map((g) => <GoalCard key={g.id} g={g} />)}</div>
          </section>
        );
      })}

      {recent.length > 0 && (
        <Section title="Recently completed">
          <ul className="space-y-1 text-sm">{recent.map((g) => <li key={g.id}><Link className="hover:text-go" href={`/goals/${g.id}`}>✓ {g.title}</Link> <span className="text-xs text-mute-400">{g.completedAt?.toISOString().slice(0, 10)}</span></li>)}</ul>
        </Section>
      )}
      {archived.length > 0 && (sp.show === "archived"
        ? <Section title="Archived"><div className="grid gap-3 sm:grid-cols-2">{archived.map((g) => <GoalCard key={g.id} g={g} />)}</div></Section>
        : <Link href="/goals?show=archived" className="btn-ghost btn-sm">Show {archived.length} archived</Link>)}
    </div>
  );
}
