import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { appContext } from "@/server/context";
import { challengeTotals } from "@/server/ledger";
import { formatCents } from "@/domain/money";
import { PageHeader } from "@/ui/bits";
import { ImportForm } from "./ImportForm";

export default async function SchdImportPage() {
  const { user, today } = await appContext();
  const schd = (await challengeTotals(user.id)).find((c) => c.kind === "SCHD")!;
  const before = schd.tiles.filter((t) => t.number < (schd.nextNumber ?? 38));
  return (
    <div className="space-y-4">
      <Link href="/money/challenges" className="btn-ghost btn-sm -ml-2"><ChevronLeft size={16} /> Challenges</Link>
      <PageHeader eyebrow="SCHD Investing" title="Verify earlier days" />
      <section className="card space-y-2 text-sm text-mute-300">
        <p>Days before Day {schd.nextNumber} are shown as provisional. They don&apos;t count as contributions until you verify them here — one at a time or as a reviewed batch.</p>
        <p className="text-xs text-mute-400">Verified so far: {formatCents(schd.verifiedHistoricalCents)}. Still unverified: {formatCents(schd.provisionalCents)}. Verifying history never changes your resume point (Day {schd.nextNumber}).</p>
      </section>
      <section className="card"><ImportForm days={before.map((t) => ({ number: t.number, status: t.status }))} today={today} /></section>
    </div>
  );
}
