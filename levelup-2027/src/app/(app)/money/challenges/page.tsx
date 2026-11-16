import Link from "next/link";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { challengeTotals } from "@/server/ledger";
import { formatLocalDate, dateToLocal } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import { PageHeader, Section, Stat, Empty } from "@/ui/bits";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { Dialog } from "@/ui/dialog";
import { IdemKey } from "@/ui/IdemKey";
import { schdNextDayAction } from "../actions";
import { manualPaymentAction, reverseAction } from "../ledger-actions";
import { Progress, TileGrid } from "../parts";

export default async function ChallengesPage() {
  const { user, today } = await appContext();
  const totals = await challengeTotals(user.id);
  const by = Object.fromEntries(totals.map((c) => [c.kind, c]));
  const moving = by.MOVING_OUT!, schd = by.SCHD!, debt = by.DEBT!;
  const history = await prisma.payment.findMany({
    where: { ownerId: user.id, tileId: { not: null } }, include: { tile: { include: { challenge: true } }, reversal: true }, orderBy: { createdAt: "desc" }, take: 25,
  });

  const recordForm = (kind: "MOVING_OUT" | "SCHD" | "DEBT", label: string) => {
    const c = by[kind]!;
    const open = c.tiles.filter((t) => t.status !== "COMPLETED" && !t.reserved && (kind !== "SCHD" || t.number >= (c.nextNumber ?? 1)));
    return (
      <Dialog title={`Record a ${label} transfer`} trigger="Record transfer made outside Roulette" triggerClassName="btn-ghost btn-sm">
        <ActionForm action={manualPaymentAction} className="space-y-4">
          <input type="hidden" name="kind" value="TILE" /><IdemKey />
          <p className="text-sm text-mute-300">Only record a transfer you actually made. The tile completes at its exact amount.</p>
          <Field label={kind === "SCHD" ? "Day" : "Tile"}>
            <select className="input" name="tileId" required defaultValue="">
              <option value="" disabled>Choose…</option>
              {(kind === "SCHD" ? open.slice(0, 1) : [...open].reverse()).map((t) => <option key={t.id} value={t.id}>#{t.number} · {formatCents(t.amountCents)}</option>)}
            </select>
          </Field>
          <Field label="Date"><input className="input" type="date" name="date" defaultValue={today} max={today} required /></Field>
          <Field label="Note (optional)"><input className="input" name="note" maxLength={300} /></Field>
          <SubmitButton className="btn-primary w-full">Record transfer</SubmitButton>
        </ActionForm>
      </Dialog>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Money" title="Financial Challenges" />
      <p className="text-sm text-mute-300">Progress counts only confirmed transfers. Reserved tiles are earmarked in an approved plan but not paid yet.</p>

      <Section title="🏠 Moving-Out Savings · 141 tiles">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Goal" value={formatCents(moving.targetCents ?? 0)} />
          <Stat label="Confirmed savings" value={formatCents(moving.confirmedCents)} tone="go" sub={`${((moving.confirmedCents / (moving.targetCents || 1)) * 100).toFixed(1)}% complete`} />
          <Stat label="Remaining" value={formatCents(moving.remainingCents ?? 0)} tone="mute" />
          <Stat label="Tiles" value={`${moving.completedTiles}/${moving.tileCount}`} tone="mute" sub={`${moving.tileCount - moving.completedTiles} incomplete${moving.reservedCents ? ` · ${formatCents(moving.reservedCents)} reserved` : ""}`} />
        </div>
        <div className="mb-4"><Progress label="Moving-out progress" value={moving.confirmedCents} max={moving.targetCents ?? 1} /></div>
        <TileGrid tiles={moving.tiles} label="Moving-out tiles" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-mute-400">Roulette rule: random among the 10 largest affordable open tiles.</p>{recordForm("MOVING_OUT", "Moving-Out")}</div>
      </Section>

      <Section title="📈 SCHD Investing · 100 days">
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Next day" value={schd.nextDay ? `Day ${schd.nextDay}` : "Done"} tone="go" sub={schd.nextDay ? `${formatCents(schd.nextDay * 100)} contribution` : undefined} />
          <Stat label="Confirmed contributions" value={formatCents(schd.confirmedCents)} sub={`incl. ${formatCents(schd.verifiedHistoricalCents)} verified history`} />
          <Stat label="Unverified history" value={formatCents(schd.provisionalCents)} tone="warn" sub="not counted" />
          <Stat label="Remaining target" value={formatCents(schd.remainingCents ?? 0)} tone="mute" sub={`of ${formatCents(schd.targetCents ?? 0)}`} />
        </div>
        <div className="mb-4"><Progress label="SCHD progress" value={schd.confirmedCents} max={schd.targetCents ?? 1} /></div>
        <TileGrid tiles={schd.tiles} next={schd.nextDay} label="SCHD days" />
        <p className="mt-3 text-xs text-mute-400">Tracks contribution amounts — not the market value of your shares. LEVEL UP never buys securities. Roulette always takes the next day in order.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {schd.provisionalCents > 0 && <Link href="/money/challenges/schd-import" className="btn-secondary btn-sm">Verify Days 1–{(schd.nextNumber ?? 38) - 1} history</Link>}
          {recordForm("SCHD", "SCHD")}
          <Dialog title="Resume point" trigger="Change resume day" triggerClassName="btn-ghost btn-sm">
            <ActionForm action={schdNextDayAction} className="space-y-4">
              <p className="text-sm text-mute-300">Roulette starts from this day. Earlier unverified days stay provisional; verified days are never changed.</p>
              <Field label="Next planned day"><input className="input" type="number" name="nextDay" min={1} max={101} defaultValue={schd.nextNumber ?? 1} required /></Field>
              <SubmitButton className="btn-primary w-full">Save</SubmitButton>
            </ActionForm>
          </Dialog>
        </div>
      </Section>

      <Section title="⛓️ Debt Payoff">
        {debt.status === "SETUP_REQUIRED" ? (
          <div>
            <p className="chip-warn">Setup required</p>
            <p className="mt-3 text-sm text-mute-300">No balance or tile mapping yet, so debt is excluded from Money Roulette and shows no progress. Nothing is assumed.</p>
            <Link href="/money/challenges/debt" className="btn-primary btn-sm mt-3">Set up debt challenge</Link>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Latest balance" value={debt.latestBalance ? formatCents(debt.latestBalance.cents) : "—"} sub={debt.latestBalance ? `as of ${formatLocalDate(debt.latestBalance.asOf)}` : undefined} />
              <Stat label="Challenge target" value={formatCents(debt.targetCents ?? 0)} />
              <Stat label="Confirmed payments" value={formatCents(debt.confirmedCents)} tone="go" />
              <Stat label="Tiles" value={`${debt.completedTiles}/${debt.tileCount}`} tone="mute" />
            </div>
            <div className="mb-4"><Progress label="Debt challenge progress" value={debt.confirmedCents} max={debt.targetCents ?? 1} /></div>
            <TileGrid tiles={debt.tiles} label="Debt tiles" />
            <div className="mt-3 flex flex-wrap gap-2">{recordForm("DEBT", "debt")}<Link href="/money/challenges/debt" className="btn-ghost btn-sm">Balance & setup</Link></div>
          </>
        )}
      </Section>

      <Section title="Contribution history">
        {history.length ? (
          <ul className="divide-line">
            {history.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className={p.reversedAt ? "text-mute-400 line-through" : ""}>
                  {p.tile!.challenge.kind === "SCHD" ? `SCHD Day ${p.tile!.number}` : `${p.tile!.challenge.name} #${p.tile!.number}`}
                  <span className="ml-2 text-xs text-mute-400">{formatLocalDate(dateToLocal(p.paidOn), "weekday")} · {p.source === "HISTORICAL_IMPORT" ? "verified history" : p.source === "MANUAL" ? "outside Roulette" : p.source === "ROULETTE" ? "Roulette" : "extra paycheck"}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="num font-semibold">{formatCents(p.amountCents)}</span>
                  {!p.reversedAt && !p.lineId && (
                    <Dialog title="Correct this record" trigger="Correct" triggerClassName="btn-ghost btn-sm">
                      <ActionForm action={reverseAction} className="space-y-4">
                        <input type="hidden" name="paymentId" value={p.id} /><IdemKey />
                        <Field label="Reason"><input className="input" name="reason" required minLength={3} maxLength={200} /></Field>
                        <SubmitButton className="btn-danger w-full">Record correction</SubmitButton>
                      </ActionForm>
                    </Dialog>
                  )}
                  {p.reversedAt && <span className="chip-mute">corrected</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : <Empty>No confirmed contributions yet.</Empty>}
      </Section>
    </div>
  );
}
