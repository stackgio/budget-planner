import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { challengeTotals, ledgerOverview, reconcile, rothRoom } from "@/server/ledger";
import { loadExtraMonths, nextExtraMonth } from "@/server/extra";
import { dateToLocal, formatLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { ExtraCard } from "./ExtraCard";
import { MoneyFigure, Progress } from "./parts";

const KIND_LABEL: Record<string, string> = {
  ROTH_CONTRIBUTION: "Roth IRA contribution", SAVINGS_TRANSFER: "Moving-out savings", INVESTMENT_CONTRIBUTION: "SCHD contribution",
  DEBT_PAYMENT: "Debt payment", FUN_MONEY: "Guilt-free money", EMERGENCY_SAVINGS: "Emergency savings", GOAL_TRANSFER: "Goal transfer",
};

export default async function MoneyDashboard() {
  const { user, today } = await appContext();
  const year = Number(today.slice(0, 4));
  const [ov, totals, room, issues, { months, verified }] = await Promise.all([
    ledgerOverview(user.id, year), challengeTotals(user.id), rothRoom(prisma, user.id, year), reconcile(user.id), loadExtraMonths(user.id),
  ]);
  const extra = nextExtraMonth(months, today);
  const by = Object.fromEntries(totals.map((c) => [c.kind, c]));
  const moving = by.MOVING_OUT!, schd = by.SCHD!, debt = by.DEBT!;
  const otReady = ov.deposits.filter((d) => d.kind === "OVERTIME" && d.availableCents > 0);
  const waiting = await prisma.allocationLine.count({ where: { status: "RESERVED", plan: { ownerId: user.id } } });
  const [payments, deposits] = await Promise.all([
    prisma.payment.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.incomeDeposit.findMany({ where: { ownerId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const activity = [
    ...payments.map((p) => ({ at: p.createdAt, title: p.reversalOfId ? `Correction · ${KIND_LABEL[p.kind]}` : KIND_LABEL[p.kind]!, sub: `${formatLocalDate(dateToLocal(p.paidOn), "weekday")} · ${p.source === "HISTORICAL_IMPORT" ? "verified history" : p.source.toLowerCase().replace("_", " ")}`, cents: p.amountCents, tone: p.amountCents < 0 ? "bad" : "" })),
    ...deposits.map((d) => ({ at: d.createdAt, title: `${d.kind === "REGULAR" ? "Regular" : d.kind === "OVERTIME" ? "Overtime" : "Other"} deposit${d.voidedAt ? " (voided)" : ""}`, sub: formatLocalDate(dateToLocal(d.actualDepositDate), "weekday"), cents: d.netCents, tone: d.voidedAt ? "mute" : "go" })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 8);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Money" title="Overview" />

      <section className="relative overflow-hidden rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-850 via-ink-900 to-ink-950 p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-go/10 blur-3xl" aria-hidden />
        <p className="eyebrow">Confirmed money not yet allocated</p>
        <MoneyFigure cents={ov.availableCents} className="mt-1 block text-[44px] leading-none text-white" />
        <p className="mt-2 text-xs text-mute-400">From deposits you confirmed. Estimates and scheduled paydays are never included.</p>
        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-700 pt-4">
          <div><dt className="text-[11px] uppercase tracking-wider text-mute-400">Reserved</dt><dd className="num text-lg font-semibold">{formatCents(ov.reservedCents)}</dd><dd className="text-[11px] text-mute-400">approved, not paid</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-mute-400">Regular {year}</dt><dd className="num text-lg font-semibold">{formatCents(ov.regularCents)}</dd><dd className="text-[11px] text-mute-400">confirmed</dd></div>
          <div><dt className="text-[11px] uppercase tracking-wider text-mute-400">Overtime {year}</dt><dd className="num text-lg font-semibold">{formatCents(ov.overtimeCents)}</dd><dd className="text-[11px] text-mute-400">confirmed</dd></div>
        </dl>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={otReady[0] ? `/money/roulette/${otReady[0].id}` : "/money/roulette"} className="flex items-center justify-between gap-3 rounded-2xl border border-go/40 bg-go/10 p-4 transition-colors hover:bg-go/15">
          <span><span className="block font-semibold text-go">💰 Overtime Money Roulette</span><span className="text-xs text-mute-300">{otReady.length ? `${formatCents(otReady.reduce((a, d) => a + d.availableCents, 0))} of overtime ready to spin` : ov.deposits.some((d) => d.kind === "OVERTIME") ? "All overtime money is allocated" : "Record an overtime deposit to spin"}</span></span>
          <ArrowRight className="text-go" size={18} />
        </Link>
        <Link href="/money/roulette" className="flex items-center justify-between gap-3 rounded-2xl border border-ink-700 bg-ink-850 p-4">
          <span><span className="block font-semibold">Waiting for your transfers</span><span className="text-xs text-mute-400">{waiting ? `${waiting} approved allocation${waiting > 1 ? "s" : ""} to confirm` : "Nothing waiting"}</span></span>
          {waiting ? <span className="chip-warn">{waiting}</span> : <CheckCircle2 size={18} className="text-go" />}
        </Link>
      </div>

      <Section title="Challenges" action={<Link href="/money/challenges" className="link text-xs">Tiles</Link>}>
        <ul className="space-y-4">
          <li>
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">🏠 Moving-Out</span><span className="num text-mute-300">{formatCents(moving.confirmedCents)} <span className="text-mute-400">/ {formatCents(moving.targetCents ?? 0)}</span></span></div>
            <Progress label="Moving-out" value={moving.confirmedCents} max={moving.targetCents ?? 1} />
            <p className="mt-1 text-[11px] text-mute-400">{moving.completedTiles} of 141 tiles{moving.reservedCents ? ` · ${formatCents(moving.reservedCents)} reserved` : ""}</p>
          </li>
          <li>
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">📈 SCHD</span><span className="num text-mute-300">{formatCents(schd.confirmedCents)} <span className="text-mute-400">/ {formatCents(schd.targetCents ?? 0)}</span></span></div>
            <Progress label="SCHD" value={schd.confirmedCents} max={schd.targetCents ?? 1} />
            <p className="mt-1 text-[11px] text-mute-400">Next: Day {schd.nextDay ?? "—"} · {formatCents(schd.provisionalCents)} history unverified</p>
          </li>
          <li>
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">⛓️ Debt</span>
              <span className="text-mute-300">{debt.status === "SETUP_REQUIRED" ? <span className="chip-warn">Setup required</span> : <span className="num">{formatCents(debt.confirmedCents)} <span className="text-mute-400">/ {formatCents(debt.targetCents ?? 0)}</span></span>}</span>
            </div>
            {debt.status !== "SETUP_REQUIRED" ? <Progress label="Debt" value={debt.confirmedCents} max={debt.targetCents ?? 1} /> : <p className="text-[11px] text-mute-400">Excluded from Roulette until you enter your balance. <Link className="link" href="/money/challenges/debt">Set up</Link></p>}
          </li>
          <li>
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-medium">🏦 Roth IRA {year}</span><span className="num text-mute-300">{formatCents(room.confirmedCents)}{room.limitCents !== null && <span className="text-mute-400"> / {formatCents(room.limitCents)}</span>}</span></div>
            {room.limitCents !== null ? <Progress label="Roth" value={room.confirmedCents} max={room.limitCents} /> : <p className="text-[11px] text-mute-400">Limit not configured. <Link className="link" href="/money/roth">Set it</Link></p>}
            {room.plannedCents > 0 && <p className="mt-1 text-[11px] text-mute-400">{formatCents(room.plannedCents)} planned, not yet contributed</p>}
          </li>
        </ul>
      </Section>

      {extra && <Link href={`/money/extra/${extra.month}`} className="block"><ExtraCard m={extra} verified={verified} today={today} compact /></Link>}

      <Section title="Recent activity">
        {activity.length ? (
          <ul className="divide-line">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0"><span className="block truncate text-sm font-medium">{a.title}</span><span className="text-xs text-mute-400">{a.sub}</span></span>
                <span className={`num shrink-0 text-sm font-semibold ${a.tone === "go" ? "text-go" : a.tone === "bad" ? "text-bad" : a.tone === "mute" ? "text-mute-400 line-through" : ""}`}>{a.cents > 0 && a.tone === "go" ? "+" : ""}{formatCents(a.cents)}</span>
              </li>
            ))}
          </ul>
        ) : <Empty>No financial activity yet. Everything here comes from deposits and transfers you confirm.</Empty>}
      </Section>

      <p className={`flex items-center gap-2 text-xs ${issues.length ? "text-bad" : "text-mute-400"}`} role="status">
        {issues.length ? <AlertTriangle size={14} /> : <ShieldCheck size={14} className="text-go" />}
        {issues.length ? `Ledger check found ${issues.length} issue(s): ${issues[0]!.code}` : "Ledger reconciled — deposits, allocations, payments and tiles agree."}
      </p>
    </div>
  );
}
