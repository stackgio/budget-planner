import Link from "next/link";
import { MODE_META, type WorkMode } from "@/domain/modes";
import { formatInstantTime, instantToLocalDate, formatLocalDate } from "@/domain/dates";
import { quickModeAction } from "./mode-actions";

export function ModeBanner({ mode, session, tz }: { mode: WorkMode; session: { id: string; startedAt: Date; estimatedEnd: Date | null } | null; tz: string }) {
  if (mode === "NORMAL" || !session) return null;
  const meta = MODE_META[mode];
  const tone = { warn: "border-warn/40 bg-warn/10 text-warn", bad: "border-bad/40 bg-bad/10 text-bad", calm: "border-sky-400/40 bg-sky-400/10 text-sky-300", go: "border-go/40 bg-go/10 text-go" }[meta.tone];
  return (
    <div className={`mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${tone}`} role="status">
      <div className="text-sm">
        <p className="font-semibold">{meta.label} mode{mode !== "RECOVERY" && " · optional reminders paused"}</p>
        <p className="text-white/70">
          Since {formatLocalDate(instantToLocalDate(session.startedAt, tz), "weekday")} {formatInstantTime(session.startedAt, tz)}
          {session.estimatedEnd && ` · est. end ${formatInstantTime(session.estimatedEnd, tz)}`}
          {" · "}<Link className="underline underline-offset-2" href={`/modes/${session.id}`}>Review schedule</Link>
        </p>
      </div>
      <div className="flex gap-2">
        {mode !== "RECOVERY" && (
          <form action={quickModeAction}><input type="hidden" name="mode" value="RECOVERY" /><button className="btn-secondary btn-sm">Start recovery</button></form>
        )}
        <form action={quickModeAction}><input type="hidden" name="mode" value="NORMAL" /><button className="btn-secondary btn-sm">Back to normal</button></form>
      </div>
    </div>
  );
}
