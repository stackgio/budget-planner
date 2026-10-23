import { useState } from 'react';
import { formatCents, formatCentsCompact } from '../lib/money';

export interface BarDatum {
  key: string;
  label: string;
  /** Short axis label; empty to skip. */
  tick: string;
  value: number;
  highlight?: boolean;
}

/** Single-series bar chart with tap/hover readout. Values in cents. */
export function BarChart({ data, height = 150, emptyText = 'No spending recorded' }: { data: BarDatum[]; height?: number; emptyText?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const width = 340;
  const padL = 34, padB = 20, padT = 8;
  const max = Math.max(0, ...data.map((d) => d.value));
  const plotH = height - padB - padT;
  const plotW = width - padL;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(26, slot - 2));
  const niceMax = max <= 0 ? 1 : niceCeil(max);
  const y = (v: number) => padT + plotH - (Math.max(0, v) / niceMax) * plotH;
  const shown = active ?? data.findIndex((d) => d.highlight);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Bar chart, total ${formatCents(total)}`} onMouseLeave={() => setActive(null)}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line className="grid-line" x1={padL} x2={width} y1={y(niceMax * f)} y2={y(niceMax * f)} />
            <text className="axis-label" x={padL - 6} y={y(niceMax * f) + 3} textAnchor="end">
              {max > 0 ? formatCentsCompact(niceMax * f) : f === 0 ? '$0' : ''}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = padL + i * slot + (slot - barW) / 2;
          const top = y(d.value);
          const h = Math.max(0, padT + plotH - top);
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.key}>
              {h > 0 && (
                <path
                  className={`bar ${shown === i ? 'hl' : ''}`}
                  d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
                />
              )}
              {d.tick && (
                <text className="axis-label" x={x + barW / 2} y={height - 5} textAnchor="middle">
                  {d.tick}
                </text>
              )}
              <rect className="hit" x={padL + i * slot} y={0} width={slot} height={height} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} />
            </g>
          );
        })}
      </svg>
      <div className="chart-tip">
        {max <= 0 ? (
          <span className="faint">{emptyText}</span>
        ) : shown !== null && shown >= 0 ? (
          <>
            {data[shown].label}: <b className="num">{formatCents(data[shown].value)}</b>
          </>
        ) : (
          <span className="faint">Tap a bar for details</span>
        )}
      </div>
    </div>
  );
}

function niceCeil(cents: number): number {
  const dollars = cents / 100;
  const pow = Math.pow(10, Math.floor(Math.log10(dollars)));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow >= dollars) ?? 10;
  return Math.round(step * pow * 100);
}
