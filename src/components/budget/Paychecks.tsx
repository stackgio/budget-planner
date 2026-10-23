import { useState } from 'react';
import { useStore } from '../../store';
import type { Paycheck } from '../../lib/types';
import { BUCKET_LABELS, BUCKETS } from '../../lib/types';
import { formatCents } from '../../lib/money';
import { formatDay } from '../../lib/dates';
import { currentPaycheck, formatPercent, sortedPaychecks, targetsFor } from '../../lib/budget';
import { bucketStyle } from './parts';
import { PaycheckSheet } from './sheets';

export function Paychecks() {
  const { data, today } = useStore();
  const [editing, setEditing] = useState<Paycheck | 'new' | null>(null);
  const list = sortedPaychecks(data);
  const cur = currentPaycheck(data, today);

  return (
    <>
      <button className="btn primary block" onClick={() => setEditing('new')}>+ Add paycheck</button>
      <p className="small faint" style={{ margin: '10px 4px 0', lineHeight: 1.5 }}>
        Enter each paycheck as it arrives — amounts can differ, and months with a third paycheck simply show three. Each paycheck keeps the split it was created with.
      </p>
      {list.length === 0 ? (
        <div className="card empty" style={{ marginTop: 12 }}><div className="big">💵</div>No paychecks yet.</div>
      ) : (
        <div className="list" style={{ marginTop: 12 }}>
          {list.map((p) => {
            const t = targetsFor(p);
            const isCur = cur?.paycheck.id === p.id && !cur.stale;
            return (
              <button key={p.id} className="txn" style={{ alignItems: 'flex-start' }} onClick={() => setEditing(p)}>
                <span className="txn-icon" aria-hidden>💵</span>
                <span className="grow">
                  <div className="txn-title">
                    {formatDay(p.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                    {isCur && <span className="tag need">Now</span>}
                    {p.date > today && <span className="tag">Upcoming</span>}
                    {p.plan.debtPayoff.enabled && <span className="tag want">Debt mode</span>}
                  </div>
                  <div className="txn-sub num">{formatDay(p.periodStart)} – {formatDay(p.periodEnd)}{p.overtimeCents ? ` · incl. ${formatCents(p.overtimeCents)} overtime` : ''}</div>
                  <div className="row wrap small num" style={{ gap: '4px 10px', marginTop: 6, color: 'var(--text-2)' }}>
                    {BUCKETS.map((b) => (
                      <span key={b} className="row" style={{ gap: 4, ...bucketStyle(b) }} title={`${BUCKET_LABELS[b]} ${formatPercent(p.plan.percents[b])}`}>
                        <span className="bucket-dot" />{BUCKET_LABELS[b]} {formatCents(t[b])}
                      </span>
                    ))}
                  </div>
                </span>
                <span className="txn-amt num">{formatCents(p.amountCents)}</span>
              </button>
            );
          })}
        </div>
      )}
      {editing && <PaycheckSheet paycheck={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
