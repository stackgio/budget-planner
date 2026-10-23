import { useEffect, useRef, type ReactNode } from 'react';
import { CloseIcon } from './Icons';
import type { WarningLevel } from '../lib/ledger';
import { useStore } from '../store';

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="sheet-backdrop" style={{ alignItems: 'center', zIndex: 50 }} onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="grid-2">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'danger' : 'primary'}`} onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Progress({ percent, level = 'ok', thin, label }: { percent: number; level?: WarningLevel; thin?: boolean; label: string }) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`progress ${level} ${thin ? 'thin' : ''}`} role="progressbar" aria-label={label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function StatusChip({ level, percent }: { level: WarningLevel; percent: number }) {
  if (level === 'ok') return <span className="chip-status ok">{percent}%</span>;
  return <span className={`chip-status ${level}`}>{level === 'over' ? '▲ Over' : '● ' + percent + '%'}</span>;
}

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <span className="grow">{t.message}</span>
          {t.undo && (
            <button
              onClick={() => {
                t.undo!();
                dismissToast(t.id);
              }}
            >
              Undo
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  green,
  label,
}: {
  value: T | null;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  green?: boolean;
  label: string;
}) {
  return (
    <div className={`segmented ${green ? 'green' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
