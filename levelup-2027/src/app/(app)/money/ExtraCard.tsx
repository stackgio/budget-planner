import { type LocalDate, MONTHS, formatLocalDate, monthKey, parseLocalDate } from "@/domain/dates";
import { formatCents } from "@/domain/money";
import type { ExtraMonth } from "@/server/extra";

export function monthLabel(month: string) {
  const { y, m } = parseLocalDate(`${month}-01`);
  return `${MONTHS[m - 1]} ${y}`;
}

export function ExtraCard({ m, verified, compact, today }: { m: ExtraMonth; verified: boolean; compact?: boolean; today: LocalDate }) {
  return (
    <article className="relative overflow-hidden rounded-3xl border border-go/40 bg-gradient-to-br from-ink-850 to-ink-900 p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-go/10 blur-2xl" aria-hidden />
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-go">Extra paycheck month 💰</p>
      <h3 className="mt-1 font-display text-3xl font-bold">{monthLabel(m.month)}</h3>
      {!verified && <p className="mt-1 text-xs font-semibold text-warn">Projected from an unverified anchor — not guaranteed</p>}
      <ol className="mt-4 grid grid-cols-3 gap-2">
        {m.paydays.map((p, i) => {
          const exp = p.manualDepositDate ?? p.expectedDepositDate;
          return (
            <li key={p.id} className="rounded-xl border border-ink-700 bg-ink-950/50 p-2.5">
              <p className="text-[10px] font-semibold uppercase text-mute-400">Paycheck {i + 1}</p>
              <p className="num whitespace-nowrap text-sm font-semibold">{formatLocalDate(p.officialDate, "weekday")}</p>
              {!compact && (
                <>
                  <p className={`mt-1 text-[11px] ${monthKey(exp) !== m.month ? "text-warn" : "text-mute-400"}`}>Est. deposit {formatLocalDate(exp, "weekday")}</p>
                  <p className="text-[11px]">{p.deposit ? <span className="text-go">{formatCents(p.deposit.netCents)} ✓</span> : p.officialDate < today ? <span className="text-warn">Not confirmed</span> : <span className="text-mute-400">Upcoming</span>}</p>
                </>
              )}
            </li>
          );
        })}
      </ol>
      {!compact && <p className="mt-3 text-sm text-mute-300">Confirmed regular income this month: <span className="num font-semibold text-white">{formatCents(m.receivedCents)}</span> <span className="text-mute-400">({m.receivedCount} of {m.paydays.length})</span></p>}
    </article>
  );
}
