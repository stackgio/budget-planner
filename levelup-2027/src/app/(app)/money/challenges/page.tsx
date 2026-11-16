import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { formatCents } from "@/domain/money";
import { PageHeader, Section, Stat } from "@/ui/bits";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { cn } from "@/ui/cn";
import { schdNextDayAction } from "../actions";

export default async function ChallengesPage() {
  const { user } = await appContext();
  const challenges = await prisma.challenge.findMany({ where: { ownerId: user.id }, include: { tiles: { orderBy: { number: "asc" } } } });
  const by = Object.fromEntries(challenges.map((c) => [c.kind, c]));
  const moving = by.MOVING_OUT, schd = by.SCHD, debt = by.DEBT;
  const confirmed = (c: (typeof challenges)[number]) => c.tiles.filter((t) => t.status === "COMPLETED").reduce((s, t) => s + t.amountCents, 0);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Money" title="Financial Challenges" />
      <p className="text-sm text-mute-300">Your confirmed challenge setup. Tiles are completed only by confirmed payments, which arrive with Money Roulette and the ledger in Phase 2.</p>

      {moving && (
        <Section title="Moving-Out Savings · 141 tiles">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Stat label="Target" value={formatCents(moving.targetCents ?? 0)} />
            <Stat label="Confirmed" value={formatCents(confirmed(moving))} tone="go" />
            <Stat label="Remaining" value={formatCents((moving.targetCents ?? 0) - confirmed(moving))} tone="mute" />
          </div>
          <TileGrid tiles={moving.tiles} />
          <p className="mt-2 text-xs text-mute-400">Selection rule: big numbers first — random among the 10 highest affordable open tiles.</p>
        </Section>
      )}

      {schd && (
        <Section title="SCHD Investing · 100 days">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Stat label="Total" value={formatCents(schd.targetCents ?? 0)} />
            <Stat label="Next day" value={`Day ${schd.nextNumber}`} tone="go" sub={`$${schd.nextNumber} contribution`} />
            <Stat label="Verified" value={formatCents(confirmed(schd))} tone="mute" />
          </div>
          <TileGrid tiles={schd.tiles} next={schd.nextNumber ?? undefined} />
          <p className="mt-2 text-xs text-warn">Days marked provisional are shown as previously done but are NOT verified financial records until you import or confirm them.</p>
          <ActionForm action={schdNextDayAction} className="mt-4 flex items-end gap-2">
            <Field label="Next planned day" className="w-40"><input className="input" type="number" name="nextDay" min={1} max={101} defaultValue={schd.nextNumber ?? 1} required /></Field>
            <SubmitButton className="btn-secondary">Update</SubmitButton>
          </ActionForm>
          <p className="mt-2 text-xs text-mute-400">Selection rule: next day first, sequential only — never skips ahead.</p>
        </Section>
      )}

      {debt && (
        <Section title="Debt Payoff">
          <p className="chip-warn">Setup required</p>
          <p className="mt-3 text-sm text-mute-300">No debt balance or tile mapping has been entered, so this challenge is excluded from Money Roulette. No amount is assumed. You will be able to enter the balance and a tile mapping that reconciles to it in Phase 2.</p>
        </Section>
      )}
    </div>
  );
}

function TileGrid({ tiles, next }: { tiles: { number: number; status: string }[]; next?: number }) {
  return (
    <div className="grid grid-cols-10 gap-1 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
      {tiles.map((t) => (
        <div key={t.number} title={`#${t.number} · $${t.number} · ${t.status.toLowerCase()}`}
          className={cn("flex aspect-square items-center justify-center rounded-md border text-[10px] font-semibold num sm:text-[11px]",
            t.status === "COMPLETED" && "border-go bg-go text-ink-950",
            t.status === "PROVISIONAL" && "border-dashed border-warn/60 bg-warn/10 text-warn",
            t.status === "OPEN" && "border-ink-700 bg-ink-900 text-mute-300",
            t.number === next && "ring-2 ring-go")}>
          {t.number}
        </div>
      ))}
    </div>
  );
}
