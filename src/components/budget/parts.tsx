import type { CSSProperties, ReactNode } from 'react';
import type { Bucket } from '../../lib/types';
import { BUCKET_LABELS, BUCKETS } from '../../lib/types';
import { BUCKET_COLORS } from '../../lib/budget';
import { formatCents } from '../../lib/money';
import { ChevronLeft, ChevronRight } from '../Icons';

export const bucketStyle = (b: Bucket) => ({ '--bucket': BUCKET_COLORS[b] }) as CSSProperties;

export function KV({ k, v, sub, total, tone }: { k: ReactNode; v: ReactNode; sub?: boolean; total?: boolean; tone?: 'good' | 'over' | 'muted' }) {
  const color = tone === 'good' ? 'var(--green)' : tone === 'over' ? 'var(--over)' : tone === 'muted' ? 'var(--text-3)' : undefined;
  return (
    <div className={`kv ${sub ? 'sub' : ''} ${total ? 'total' : ''}`}>
      <span className="k">{k}</span>
      <span className="v" style={{ color }}>{v}</span>
    </div>
  );
}

/** Signed money: "−$5.00" for negatives so "over" is never hidden. */
export function money(c: number): string {
  return c < 0 ? `−${formatCents(-c)}` : formatCents(c);
}

export interface Segment {
  value: number;
  /** hatch = reserved (committed, not yet spent) */
  kind: 'solid' | 'hatch';
  label: string;
}

/**
 * Horizontal stacked bar of used money against a budget. Overspending
 * turns the whole fill to the "over" color; numbers always sit beside it.
 */
export function StackedBar({ bucket, segments, budget, label }: { bucket: Bucket; segments: Segment[]; budget: number; label: string }) {
  const used = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  const scale = Math.max(budget, used, 1);
  const over = budget > 0 && used > budget;
  return (
    <div className="stacked" style={bucketStyle(bucket)} role="img" aria-label={`${label}: ${segments.map((s) => `${s.label} ${formatCents(s.value)}`).join(', ')} of ${formatCents(budget)}`}>
      {segments.filter((s) => s.value > 0).map((s, i) => (
        <span key={i} className={`${s.kind === 'hatch' ? 'hatch' : ''} ${over ? 'over' : ''}`} style={{ width: `${(s.value / scale) * 100}%`, background: 'var(--bucket)' }} title={`${s.label}: ${formatCents(s.value)}`} />
      ))}
    </div>
  );
}

export function BucketPicker({ value, onChange, options = BUCKETS, suggested }: { value: Bucket | null; onChange: (b: Bucket) => void; options?: readonly Bucket[]; suggested?: boolean }) {
  return (
    <div className={`bucket-chips ${options.length === 2 ? 'two' : ''}`} role="radiogroup" aria-label="Budget bucket">
      {options.map((b) => (
        <button key={b} type="button" role="radio" aria-checked={value === b} className={`bucket-chip ${value === b ? 'on' : ''}`} style={bucketStyle(b)} onClick={() => onChange(b)}>
          <span className="bucket-dot" />
          {BUCKET_LABELS[b]}
        </button>
      ))}
      {suggested && <span className="sr-only">Suggested</span>}
    </div>
  );
}

export function PeriodNav<T extends { key: string; label: string }>({ items, index, onIndex, label }: { items: T[]; index: number; onIndex: (i: number) => void; label: string }) {
  if (!items.length) return null;
  return (
    <div className="row between no-print">
      <button className="icon-btn" aria-label="Previous period" disabled={index >= items.length - 1} onClick={() => onIndex(Math.min(items.length - 1, index + 1))}><ChevronLeft /></button>
      <select className="input grow" style={{ textAlign: 'center' }} aria-label={label} value={index} onChange={(e) => onIndex(Number(e.target.value))}>
        {items.map((p, i) => <option key={p.key} value={i}>{p.label}</option>)}
      </select>
      <button className="icon-btn" aria-label="Next period" disabled={index === 0} onClick={() => onIndex(Math.max(0, index - 1))}><ChevronRight /></button>
    </div>
  );
}

export function MoneyField({ label, value, onChange, placeholder = '0.00', autoFocus }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; autoFocus?: boolean }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="amount-wrap">
        <input className="input num" style={{ paddingLeft: 36 }} inputMode="decimal" placeholder={placeholder} value={value} autoFocus={autoFocus} onChange={(e) => onChange(e.target.value.replace(/[^\d.,$]/g, ''))} />
      </div>
    </label>
  );
}
