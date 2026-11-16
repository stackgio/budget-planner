import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { getRouletteSettings } from "@/server/ledger";
import { depositsWithBalance, listPlans } from "@/server/plans";
import { formatLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { Dialog } from "@/ui/dialog";
import { rouletteSettingsAction } from "../ledger-actions";
import { MoneyFigure } from "../parts";

export default async function RoulettePage() {
  const { user } = await appContext();
  const deposits = await depositsWithBalance(user.id, "OVERTIME");
  const settings = await getRouletteSettings(prisma, user.id, "OVERTIME_ROULETTE");
  const plans = await listPlans(user.id, { kind: "OVERTIME_ROULETTE" });
  const ready = deposits.filter((d) => d.availableCents > 0);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Money" title="💰 Overtime Money Roulette">
        <Dialog title="Roulette defaults" trigger="Defaults" triggerClassName="btn-secondary btn-sm">
          <ActionForm action={rouletteSettingsAction} className="space-y-4">
            <input type="hidden" name="kind" value="OVERTIME_ROULETTE" />
            <Field label="Roth IRA reserve per overtime paycheck"><input className="input" name="roth" inputMode="decimal" defaultValue={(settings.rothCents / 100).toFixed(2)} required /></Field>
            <Field label="Protected guilt-free money"><input className="input" name="fun" inputMode="decimal" defaultValue={(settings.funCents / 100).toFixed(2)} required /></Field>
            <Field label="Money left after challenges">
              <select className="input" name="leftoverMode" defaultValue={settings.leftoverToFun ? "fun" : "keep"}><option value="fun">Becomes free money 😎</option><option value="keep">Stays unallocated</option></select>
            </Field>
            <SubmitButton className="btn-primary w-full">Save defaults</SubmitButton>
          </ActionForm>
        </Dialog>
      </PageHeader>

      <section className="card text-sm text-mute-300">
        <p>Enter an overtime paycheck&apos;s <strong className="text-white">actual net deposit</strong>, then spin. Roulette sets aside {formatCents(settings.rothCents)} for your Roth IRA and {formatCents(settings.funCents)} of guilt-free money, then picks challenge tiles: big numbers first for Moving-Out (and Debt once set up), the next day in order for SCHD.</p>
        <p className="mt-2 text-xs text-mute-400">A spin is only a proposal. LEVEL UP never moves money — you make each transfer yourself, then confirm it here.</p>
      </section>

      <Section title="Overtime deposits ready to spin">
        {ready.length ? (
          <ul className="space-y-2">
            {ready.map((d) => (
              <li key={d.id}>
                <Link href={`/money/roulette/${d.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-ink-700 bg-ink-900 p-4 transition-colors hover:border-go/60">
                  <div>
                    <p className="font-semibold">Overtime deposit · {formatLocalDate(d.date, "weekday")}</p>
                    <p className="text-xs text-mute-400">{formatCents(d.netCents)} confirmed{d.reservedCents + d.completedCents > 0 ? ` · ${formatCents(d.reservedCents + d.completedCents)} already allocated` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-mute-400">Unallocated</p>
                    <MoneyFigure cents={d.availableCents} className="text-xl text-go" />
                  </div>
                  <ArrowRight size={18} className="shrink-0 text-go" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>
            No overtime money to allocate yet. When an overtime check lands, record its net amount on{" "}
            <Link className="link" href="/money/overtime">Overtime Payroll</Link> — then come back and spin. Scheduled paydays and estimated gross pay never count.
          </Empty>
        )}
      </Section>

      <Section title="Plans">
        {plans.length ? (
          <ul className="divide-line">
            {plans.map((p) => (
              <li key={p.id}>
                <Link href={`/money/plans/${p.id}`} className="flex items-center justify-between gap-3 py-3">
                  <span>
                    <span className="block font-medium">{p.deposit ? `Deposit ${formatLocalDate(p.deposit.date, "weekday")}` : "Plan"} · {formatCents(p.totals.allocatedCents)}</span>
                    <span className="text-xs text-mute-400">{p.lines.filter((l) => l.status === "COMPLETED").length} confirmed · {p.lines.filter((l) => l.status === "RESERVED").length} waiting</span>
                  </span>
                  <span className={p.status === "COMPLETED" ? "chip-go" : p.status === "CANCELLED" ? "chip-mute" : "chip-warn"}>{p.status === "APPROVED" ? "In progress" : p.status.toLowerCase()}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : <Empty>No approved plans yet.</Empty>}
      </Section>
    </div>
  );
}
