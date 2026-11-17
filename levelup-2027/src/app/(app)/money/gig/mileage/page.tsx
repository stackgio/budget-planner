import Link from "next/link";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { appContext } from "@/server/context";
import { listMileage, listPlatforms } from "@/server/gig";
import { formatLocalDate, isLocalDate } from "@/domain/dates";
import { formatMiles } from "@/domain/gig";
import { periodFor } from "@/domain/periods";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { Dialog } from "@/ui/dialog";
import { ConfirmAction } from "@/ui/ConfirmAction";
import { MileageForm } from "../forms";
import { archiveMileageAction } from "../actions";

export default async function MileagePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { user, today } = await appContext();
  const sp = await searchParams;
  const period = periodFor("year", sp.d && isLocalDate(sp.d) ? sp.d : today);
  const [trips, platforms] = await Promise.all([listMileage(user.id, period.from, period.to), listPlatforms(user.id, true)]);
  const popts = platforms.filter((p) => !p.archivedAt).map((p) => ({ id: p.id, name: p.name }));
  const total = trips.reduce((a, t) => a + t.milesHundredths, 0);
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Gig Income" title="Mileage log">
        <Dialog title="Add a business trip" trigger="Add trip" triggerClassName="btn-primary btn-sm"><MileageForm platforms={popts} d={{ tripDate: today }} /></Dialog>
      </PageHeader>
      <div className="flex items-center justify-between">
        <Link href="/money/gig" className="link text-sm">← Gig Income</Link>
        <span className="flex items-center gap-1">
          <Link className="btn-ghost btn-sm" href={`/money/gig/mileage?d=${period.prev}`} aria-label="Previous year"><ChevronLeft size={16} /></Link>
          <span className="text-sm font-semibold">{period.label}</span>
          <Link className="btn-ghost btn-sm" href={`/money/gig/mileage?d=${period.next}`} aria-label="Next year"><ChevronRight size={16} /></Link>
        </span>
      </div>
      <section className="card">
        <p className="eyebrow">Business miles · {period.label}</p>
        <p className="num mt-1 font-display text-3xl font-bold">{formatMiles(total)}</p>
        <p className="mt-2 text-xs text-mute-400">Records you entered. LEVEL UP doesn&apos;t apply a mileage rate or decide deductibility — ask a tax professional. Miles from work sessions are edited on the session.</p>
        <a className="btn-secondary btn-sm mt-3" href={`/api/export/gig?kind=mileage&from=${period.from}&to=${period.to}`} download><Download size={14} /> Export {period.label} CSV</a>
      </section>
      <Section title="Trips">
        {trips.length ? (
          <ul className="divide-line">
            {trips.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-2 py-3 text-sm">
                <span>
                  <span className="block font-medium">{t.purpose}</span>
                  <span className="text-xs text-mute-400">{formatLocalDate(t.tripDate, "weekday")}{t.platform ? ` · ${t.platform}` : ""}{t.odometerStartTenths !== null ? ` · odometer ${(t.odometerStartTenths / 10).toFixed(1)}→${(t.odometerEndTenths! / 10).toFixed(1)}` : ""}{t.fromSession ? " · from a work session" : ""}</span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="num font-semibold">{formatMiles(t.milesHundredths)}</span>
                  {!t.fromSession && (
                    <span className="flex gap-1">
                      <Dialog title="Edit trip" trigger="Edit" triggerClassName="btn-ghost btn-sm"><MileageForm platforms={popts} d={t} /></Dialog>
                      <ConfirmAction label="Remove" title="Remove this trip?" action={archiveMileageAction} fields={{ id: t.id }} confirmLabel="Remove trip">It will no longer count in your totals. It stays in history.</ConfirmAction>
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        ) : <Empty>No business trips logged in {period.label}.</Empty>}
      </Section>
    </div>
  );
}
