import Link from "next/link";
import { notFound } from "next/navigation";
import { appContext } from "@/server/context";
import { prisma } from "@/server/db";
import { loadOccurrences } from "@/server/calendar";
import { adjustmentSuggestions, MODE_META } from "@/domain/modes";
import { CATEGORY_META } from "@/domain/calendar";
import { formatInstantTime, formatLocalDate, instantToLocalDate } from "@/domain/dates";
import { PageHeader, Section, Empty } from "@/ui/bits";
import { postponeOccurrenceAction, quickModeAction } from "../../mode-actions";

export default async function ModeReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, tz } = await appContext();
  const { id } = await params;
  const s = await prisma.modeSession.findFirst({ where: { id, ownerId: user.id } });
  if (!s) notFound();
  const end = s.endedAt ?? s.estimatedEnd ?? new Date(s.startedAt.getTime() + (s.mode === "ACTIVATION" ? 12 : 16) * 3_600_000);
  const occ = await loadOccurrences(user.id, tz, new Date(s.startedAt.getTime() - 3_600_000), new Date(end.getTime() + 24 * 3_600_000), { includePaydays: false, includeTasks: false });
  const suggestions = adjustmentSuggestions({ start: s.startedAt, end }, occ, { selfEventId: s.eventId ?? undefined });
  const when = (d: Date) => `${formatLocalDate(instantToLocalDate(d, tz), "weekday")} ${formatInstantTime(d, tz)}`;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow={`${MODE_META[s.mode].label} mode`} title="Schedule check" />
      <section className="card text-sm">
        <p>Started {when(s.startedAt)} · {s.endedAt ? `ended ${when(s.endedAt)}` : s.estimatedEnd ? `estimated end ${when(s.estimatedEnd)}` : "end time unknown (assuming " + (s.mode === "ACTIVATION" ? "12" : "16") + " h)"}</p>
        <p className="mt-2 text-mute-400">{MODE_META[s.mode].blurb} These are suggestions only — nothing has been moved or deleted.</p>
        {!s.endedAt && (
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={quickModeAction}><input type="hidden" name="mode" value="RECOVERY" /><button className="btn-secondary">End & start recovery</button></form>
            <form action={quickModeAction}><input type="hidden" name="mode" value="NORMAL" /><button className="btn-ghost">Back to normal</button></form>
          </div>
        )}
      </section>
      <Section title="Affected by this shift / recovery window">
        {suggestions.length ? (
          <ul className="divide-line">
            {suggestions.map((sg) => (
              <li key={sg.occurrence.key} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold"><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_META[sg.occurrence.category].color }} />{sg.occurrence.title}</p>
                  <p className="text-xs text-mute-400">{when(sg.occurrence.start)} · {sg.reason}</p>
                </div>
                <div className="flex gap-1">
                  {sg.kind !== "keep" && sg.occurrence.category !== "DOC_SHIFT" && (
                    <form action={postponeOccurrenceAction}>
                      <input type="hidden" name="eventId" value={sg.occurrence.eventId} />
                      <input type="hidden" name="originalStart" value={sg.occurrence.originalStart.toISOString()} />
                      <input type="hidden" name="days" value="1" />
                      <button className="btn-secondary btn-sm">Postpone 1 day</button>
                    </form>
                  )}
                  <Link className="btn-ghost btn-sm" href={`/calendar?view=day&date=${instantToLocalDate(sg.occurrence.start, tz)}`}>Open day</Link>
                </div>
              </li>
            ))}
          </ul>
        ) : <Empty>No conflicts found. Rest well.</Empty>}
      </Section>
      <p className="text-xs text-mute-400">Avoid gig driving while fatigued. Sleep and recovery come first.</p>
    </div>
  );
}
