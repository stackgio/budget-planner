import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { loadPayroll } from "@/server/money-queries";
import { loadExtraMonths, nextExtraMonth } from "@/server/extra";
import { formatLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Stat } from "@/ui/bits";
import { ExtraCard } from "./ExtraCard";

export default async function MoneyPage() {
  const { user, today } = await appContext();
  const reg = await loadPayroll(user.id, "REGULAR");
  const ot = await loadPayroll(user.id, "OVERTIME");
  const { months, verified } = await loadExtraMonths(user.id);
  const extra = nextExtraMonth(months, today);
  const year = today.slice(0, 4);
  const sumYear = (ps: typeof reg.paydays) => ps.filter((p) => p.deposit?.actualDepositDate.startsWith(year)).reduce((s, p) => s + p.deposit!.netCents, 0);
  const nextReg = reg.paydays.find((p) => p.officialDate >= today);
  const nextOt = ot.paydays.find((p) => p.officialDate >= today);
  const shifts = await prisma.overtimeShift.aggregate({ where: { ownerId: user.id, date: { gte: new Date(`${year}-01-01`) } }, _sum: { overtimeHoursX100: true, estimatedGrossCents: true } });

  const sections = [
    { href: "/money/payroll", title: "Regular Payroll", body: nextReg ? `Next: ${formatLocalDate(nextReg.officialDate, "weekday")}${reg.schedule.anchorVerified ? "" : " (provisional)"}` : "" },
    { href: "/money/overtime", title: "Overtime Payroll", body: `${((shifts._sum.overtimeHoursX100 ?? 0) / 100).toString()} OT hours logged in ${year}` },
    { href: "/money/extra", title: "Extra Paycheck Planner", body: extra ? `Next: ${extra.month}` : "No upcoming month" },
    { href: "/money/challenges", title: "Financial Challenges", body: "Moving-out · SCHD · Debt (setup required)" },
  ];
  const later = ["Overtime Money Roulette", "Gig Income", "Financial Goals"];

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Money" title="Overview" />
      <section className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={`Regular received ${year}`} value={formatCents(sumYear(reg.paydays))} tone="go" sub="confirmed deposits only" />
        <Stat label={`Overtime received ${year}`} value={formatCents(sumYear(ot.paydays))} tone="go" sub="confirmed deposits only" />
        <Stat label="Next regular payday" value={nextReg ? formatLocalDate(nextReg.officialDate, "weekday") : "—"} sub={reg.schedule.anchorVerified ? "verified schedule" : "provisional schedule"} />
        <Stat label="Next OT payday" value={nextOt ? formatLocalDate(nextOt.officialDate, "weekday") : "—"} sub={`est. OT gross ${year}: ${formatCents(shifts._sum.estimatedGrossCents ?? 0)}`} />
      </section>
      {extra && <Link href="/money/extra" className="block"><ExtraCard m={extra} verified={verified} today={today} compact /></Link>}
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="card flex items-center justify-between gap-3 transition-colors hover:border-go/50">
            <div><p className="font-semibold">{s.title}</p><p className="text-sm text-mute-400">{s.body}</p></div>
            <ArrowRight size={18} className="text-go" />
          </Link>
        ))}
        {later.map((t) => (
          <div key={t} className="card flex items-center justify-between opacity-60" aria-disabled>
            <div><p className="font-semibold">{t}</p><p className="text-sm text-mute-400">{t === "Overtime Money Roulette" ? "Phase 2" : "Phase 5"}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}
