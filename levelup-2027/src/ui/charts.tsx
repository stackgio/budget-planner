"use client";
import { useState } from "react";
import { formatCents } from "@/domain/money";

/**
 * Small, dependency-free SVG charts. Colours validated for the dark surface (#141518) with the
 * dataviz palette checker: blue/orange/aqua pass lightness, chroma, CVD (ΔE 9.4) and 3:1 contrast.
 * Every chart has a legend (≥2 series), hover/focus tooltips, and a table view.
 */
export const SERIES = { regular: "#3987e5", overtime: "#d95926", gig: "#199e70", single: "#3987e5" } as const;
const GRID = "#25282D";
const H = 160, PAD_L = 44, PAD_B = 22, PAD_T = 8, BAR_MAX = 24, GAP = 2;

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}
const compactDollars = (cents: number) => {
  const d = cents / 100;
  return d >= 10_000 ? `$${Math.round(d / 1000)}K` : `$${d.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
};
const monthLabel = (m: string) => new Date(Date.UTC(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1)).toLocaleString("en-US", { month: "short", timeZone: "UTC" });

/** A rect with a 4px rounded top (data end) and a square bottom (baseline). */
function topRounded(x: number, y: number, w: number, h: number, r = 4) {
  const rr = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

export interface IncomeMonth { month: string; regularCents: number; overtimeCents: number; gigCents: number; otherCents: number; totalCents: number }

export function IncomeChart({ data }: { data: IncomeMonth[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const keys = [
    { k: "regularCents" as const, label: "Regular (DOC)", color: SERIES.regular },
    { k: "overtimeCents" as const, label: "Overtime", color: SERIES.overtime },
    { k: "gigCents" as const, label: "Gig payouts", color: SERIES.gig },
  ];
  const W = 340;
  const max = niceMax(Math.max(...data.map((d) => d.regularCents + d.overtimeCents + d.gigCents), 0));
  const plotW = W - PAD_L - 4, slot = plotW / data.length, bw = Math.min(BAR_MAX, slot * 0.6);
  const y = (c: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - c / max);
  const ticks = [0, max / 2, max];
  const empty = data.every((d) => d.totalCents === 0);
  return (
    <figure className="m-0">
      <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute-300" aria-label="Legend">
        {keys.map((s) => <li key={s.k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />{s.label}</li>)}
      </ul>
      {empty ? <p className="py-8 text-center text-sm text-mute-400">No confirmed deposits in these months yet.</p> : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Confirmed income by month, stacked by source">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD_L} x2={W} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={PAD_L - 6} y={y(t) + 3} textAnchor="end" fontSize={10} fill="#8A9099">{compactDollars(t)}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const cx = PAD_L + slot * i + slot / 2, x = cx - bw / 2;
              let base = H - PAD_B;
              const segs = keys.map((s) => ({ ...s, v: d[s.k] })).filter((s) => s.v > 0);
              return (
                <g key={d.month} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0}
                  aria-label={`${monthLabel(d.month)}: ${keys.map((s) => `${s.label} ${formatCents(d[s.k])}`).join(", ")}`} className="outline-none">
                  <rect x={PAD_L + slot * i} y={PAD_T} width={slot} height={H - PAD_T - PAD_B} fill={hover === i ? "#ffffff08" : "transparent"} />
                  {segs.map((s, j) => {
                    const h = (H - PAD_T - PAD_B) * (s.v / max);
                    const top = base - h;
                    const isTop = j === segs.length - 1;
                    const gap = j > 0 ? GAP : 0;
                    const el = isTop
                      ? <path key={s.k} d={topRounded(x, top, bw, Math.max(0, h - gap))} fill={s.color} />
                      : <rect key={s.k} x={x} y={top} width={bw} height={Math.max(0, h - gap)} fill={s.color} />;
                    base = top;
                    return el;
                  })}
                  <text x={cx} y={H - 6} textAnchor="middle" fontSize={10} fill="#8A9099">{monthLabel(d.month)}</text>
                </g>
              );
            })}
          </svg>
          {hover !== null && data[hover] && (
            <div role="tooltip" className="pointer-events-none absolute top-0 z-10 w-44 rounded-xl border border-ink-600 bg-ink-800 p-2.5 text-xs shadow-xl"
              style={{ left: `clamp(0px, calc(${((PAD_L + slot * hover + slot / 2) / W) * 100}% - 88px), calc(100% - 176px))` }}>
              <p className="mb-1 font-semibold text-white">{monthLabel(data[hover].month)} {data[hover].month.slice(0, 4)}</p>
              {keys.map((s) => <p key={s.k} className="flex justify-between gap-2 text-mute-300"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />{s.label}</span><span className="num">{formatCents(data[hover]![s.k])}</span></p>)}
              <p className="mt-1 flex justify-between border-t border-ink-600 pt-1 font-semibold text-white"><span>Confirmed total</span><span className="num">{formatCents(data[hover].totalCents)}</span></p>
            </div>
          )}
        </div>
      )}
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-mute-400">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <thead><tr className="text-mute-400"><th className="py-1 font-medium">Month</th><th className="py-1 text-right font-medium">Regular</th><th className="py-1 text-right font-medium">Overtime</th><th className="py-1 text-right font-medium">Gig</th><th className="py-1 text-right font-medium">Total</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.month} className="border-t border-ink-800"><td className="py-1">{monthLabel(d.month)} {d.month.slice(0, 4)}</td><td className="num py-1 text-right">{formatCents(d.regularCents)}</td><td className="num py-1 text-right">{formatCents(d.overtimeCents)}</td><td className="num py-1 text-right">{formatCents(d.gigCents)}</td><td className="num py-1 text-right">{formatCents(d.totalCents)}</td></tr>)}</tbody>
        </table>
      </details>
    </figure>
  );
}

/** Single-series count per week (no legend box: the section title names the series). */
export function WeekCountChart({ data, label }: { data: { week: string; count: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 340, h = 120, pb = 20;
  const max = Math.max(1, ...data.map((d) => d.count));
  const slot = (W - 4) / Math.max(1, data.length), bw = Math.min(BAR_MAX, slot * 0.6);
  const short = (w: string) => new Date(`${w}T12:00:00Z`).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  if (data.every((d) => d.count === 0)) return <p className="py-4 text-sm text-mute-400">Nothing logged in this period.</p>;
  return (
    <figure className="relative m-0">
      <svg viewBox={`0 0 ${W} ${h}`} className="w-full" role="img" aria-label={label}>
        <line x1={0} x2={W} y1={h - pb} y2={h - pb} stroke={GRID} strokeWidth={1} />
        {data.map((d, i) => {
          const bh = ((h - pb - 14) * d.count) / max, x = slot * i + (slot - bw) / 2;
          return (
            <g key={d.week} tabIndex={0} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} aria-label={`Week of ${short(d.week)}: ${d.count}`} className="outline-none">
              <rect x={slot * i} y={0} width={slot} height={h - pb} fill={hover === i ? "#ffffff08" : "transparent"} />
              {d.count > 0 && <path d={topRounded(x, h - pb - bh, bw, bh)} fill={SERIES.single} />}
              {data.length <= 6 && <text x={slot * i + slot / 2} y={h - 5} textAnchor="middle" fontSize={10} fill="#8A9099">{short(d.week)}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && <div role="tooltip" className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-lg border border-ink-600 bg-ink-800 px-2 py-1 text-xs text-white">Week of {short(data[hover]!.week)}: <span className="num">{data[hover]!.count}</span></div>}
      <details className="mt-1 text-xs"><summary className="cursor-pointer text-mute-400">Show as table</summary>
        <ul className="mt-1">{data.map((d) => <li key={d.week} className="flex justify-between border-t border-ink-800 py-1"><span>Week of {short(d.week)}</span><span className="num">{d.count}</span></li>)}</ul>
      </details>
    </figure>
  );
}
