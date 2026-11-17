import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Dices } from "lucide-react";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { depositBalance, getRouletteSettings, rothRoom } from "@/server/ledger";
import { listPlans, loadDraft } from "@/server/plans";
import { formatLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { spinAction } from "../../ledger-actions";
import { DraftView, RerollButton } from "../../PlanEditor";
import { MoneyFigure } from "../../parts";

const dollars = (c: number | null | undefined) => (c === null || c === undefined ? "" : (c / 100).toFixed(2));

export default async function RouletteSpinPage({ params }: { params: Promise<{ depositId: string }> }) {
  const { user } = await appContext();
  const { depositId } = await params;
  const dep = await prisma.incomeDeposit.findFirst({ where: { id: depositId, ownerId: user.id, kind: { in: ["OVERTIME", "GIG"] } }, include: { payday: true, gigPayout: { include: { platform: true } } } });
  if (!dep) notFound();
  const bal = await depositBalance(prisma, user.id, dep.id);
  const settings = await getRouletteSettings(prisma, user.id, "OVERTIME_ROULETTE");
  const draft = await loadDraft(user.id, "OVERTIME_ROULETTE", dep.id);
  const plans = await listPlans(user.id, { depositId: dep.id });
  const room = await rothRoom(prisma, user.id, new Date().getFullYear());
  const p = draft?.params ?? {};
  const roth = p.rothCents ?? settings.rothCents;
  const fun = p.funCents ?? settings.funCents;
  const leftoverToFun = p.leftoverToFun ?? settings.leftoverToFun;
  const budget = p.budgetCents ?? null;

  const notes: string[] = [];
  if (draft) {
    const rothLine = draft.lines.find((l) => l.target === "ROTH")?.amountCents ?? 0;
    const funBase = Math.min(fun, Math.max(0, draft.budgetCents - rothLine));
    if (rothLine < roth) notes.push(`Roth is ${formatCents(rothLine)} instead of ${formatCents(roth)}${room.remainingCents !== null && room.remainingCents < roth ? " (capped at your configured limit)" : " — this paycheck can't cover the full default"}.`);
    if (funBase < fun) notes.push(`Only ${formatCents(funBase)} of your ${formatCents(fun)} guilt-free money fits. Adjust the defaults or approve a partial plan.`);
  }

  const hidden = (
    <>
      <input type="hidden" name="kind" value="OVERTIME_ROULETTE" />
      <input type="hidden" name="depositId" value={dep.id} />
    </>
  );

  return (
    <div className="space-y-4">
      <Link href="/money/roulette" className="btn-ghost btn-sm -ml-2"><ChevronLeft size={16} /> Roulette</Link>
      <header className="rounded-3xl border border-ink-700 bg-gradient-to-br from-ink-850 to-ink-900 p-5">
        <p className="eyebrow">{dep.kind === "GIG" ? `${dep.gigPayout?.platform.name ?? "Gig"} payout (you chose to spin it)` : "Overtime deposit"} · {formatLocalDate(bal.deposit.actualDepositDate.toISOString().slice(0, 10), "weekday")}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-mute-400">Unallocated</p>
            <MoneyFigure cents={bal.availableCents} className="text-4xl text-go" />
          </div>
          <dl className="grid grid-cols-3 gap-4 text-right text-xs text-mute-400">
            <div><dt>Deposited</dt><dd className="num text-sm font-semibold text-white">{formatCents(bal.netCents)}</dd></div>
            <div><dt>Reserved</dt><dd className="num text-sm font-semibold text-white">{formatCents(bal.reservedCents)}</dd></div>
            <div><dt>Confirmed</dt><dd className="num text-sm font-semibold text-white">{formatCents(bal.completedCents)}</dd></div>
          </dl>
        </div>
      </header>

      {!draft && bal.availableCents > 0 && (
        <ActionForm action={spinAction} className="card space-y-4">
          {hidden}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Roth IRA" hint={room.remainingCents !== null ? `${formatCents(room.remainingCents)} room left (your limit)` : "Limit not configured"}><input className="input" name="roth" inputMode="decimal" defaultValue={dollars(roth)} /></Field>
            <Field label="Guilt-free (minimum)"><input className="input" name="fun" inputMode="decimal" defaultValue={dollars(fun)} /></Field>
            <Field label="Spend from this deposit" hint={`Up to ${formatCents(bal.availableCents)}`}><input className="input" name="budget" inputMode="decimal" placeholder={dollars(bal.availableCents)} defaultValue={dollars(budget)} /></Field>
            <Field label="Leftover">
              <select className="input" name="leftoverMode" defaultValue={leftoverToFun ? "fun" : "keep"}><option value="fun">Free money 😎</option><option value="keep">Keep unallocated</option></select>
            </Field>
          </div>
          <SubmitButton className="btn-primary min-h-[56px] w-full text-base" pendingText="Spinning…"><Dices size={20} /> SPIN MY OVERTIME</SubmitButton>
        </ActionForm>
      )}

      {draft && (
        <DraftView
          plan={draft}
          availableCents={bal.availableCents}
          notes={notes}
          rerollForm={
            <ActionForm action={spinAction}>
              {hidden}
              <input type="hidden" name="roth" value={dollars(p.rothCents)} />
              <input type="hidden" name="fun" value={dollars(p.funCents)} />
              <input type="hidden" name="budget" value={dollars(p.budgetCents)} />
              <input type="hidden" name="leftoverMode" value={leftoverToFun ? "fun" : "keep"} />
              <RerollButton />
            </ActionForm>
          }
        />
      )}

      {!draft && bal.availableCents === 0 && <p className="card text-sm text-mute-300">Every dollar of this deposit is already reserved or confirmed.</p>}

      {plans.length > 0 && (
        <section className="card">
          <p className="eyebrow mb-2">Plans for this deposit</p>
          <ul className="divide-line">
            {plans.map((pl) => (
              <li key={pl.id}><Link className="flex justify-between py-2 text-sm" href={`/money/plans/${pl.id}`}><span>{formatCents(pl.totals.allocatedCents)} · {pl.lines.filter((l) => l.status === "RESERVED").length} waiting</span><span className="text-go">Open →</span></Link></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
