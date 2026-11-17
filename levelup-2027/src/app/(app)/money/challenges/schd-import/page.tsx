import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { appContext } from "@/server/context";
import { challengeTotals } from "@/server/ledger";
import { formatCents } from "@/domain/money";
import { PageHeader } from "@/ui/bits";
import { ImportForm } from "./ImportForm";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { schdNotDoneAction } from "../../ledger-actions";

export default async function SchdImportPage() {
  const { user, today } = await appContext();
  const schd = (await challengeTotals(user.id)).find((c) => c.kind === "SCHD")!;
  const before = schd.tiles.filter((t) => t.number < (schd.nextNumber ?? 38) && t.status !== "OPEN");
  return (
    <div className="space-y-4">
      <Link href="/money/challenges" className="btn-ghost btn-sm -ml-2"><ChevronLeft size={16} /> Challenges</Link>
      <PageHeader eyebrow="SCHD Investing" title="Verify earlier days" />
      <section className="card space-y-2 text-sm text-mute-300">
        <p>Days before Day {schd.nextNumber} are shown as provisional. They don&apos;t count as contributions until you verify them here — one at a time or as a reviewed batch.</p>
        <p className="text-xs text-mute-400">Verified so far: {formatCents(schd.verifiedHistoricalCents)}. Still unverified: {formatCents(schd.provisionalCents)}. Verifying history never changes your resume point (Day {schd.nextNumber}).</p>
      </section>
      <section className="card"><ImportForm days={before.map((t) => ({ number: t.number, status: t.status }))} today={today} /></section>
      <section className="card space-y-3">
        <p className="eyebrow">A day never happened?</p>
        <p className="text-sm text-mute-300">Mark an unverified day as not done. It reopens and automatically becomes the next SCHD day in the sequence — no need to change the resume point. Confirmed contributions can&apos;t be changed here; use “Correct” in the history instead.</p>
        <ActionForm action={schdNotDoneAction} className="flex items-end gap-2">
          <Field label="Day" className="w-28"><input className="input" type="number" name="day" min={1} max={100} required /></Field>
          <SubmitButton className="btn-secondary">Mark not done</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
