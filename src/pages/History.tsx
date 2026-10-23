import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Transaction } from '../lib/types';
import { formatCents } from '../lib/money';
import { addMonths, formatDay, formatMonth, monthKey, relativeDayLabel, startOfWeek, type DateRange } from '../lib/dates';
import { monthRange, spendingEffect, weekRange } from '../lib/ledger';
import { normalizeDescription } from '../lib/suggest';
import { purgeTransaction, restoreTransaction } from '../lib/ops';
import { TxnRow } from '../components/TxnRow';
import { ConfirmDialog, Segmented } from '../components/ui';
import { SearchIcon } from '../components/Icons';

type DatePreset = 'all' | 'week' | 'month' | 'last-month' | 'custom';
type View = 'list' | 'weekly' | 'monthly' | 'deleted';

export function History({ onOpen }: { onOpen: (t: Transaction) => void }) {
  const { data, today, apply } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [preset, setPreset] = useState<DatePreset>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [view, setView] = useState<View>('list');
  const [limit, setLimit] = useState(150);
  const [purging, setPurging] = useState<Transaction | null>(null);

  const range: DateRange | null = useMemo(() => {
    if (preset === 'week') return weekRange(today, data.settings.weekStartsOn);
    if (preset === 'month') return monthRange(today);
    if (preset === 'last-month') return monthRange(`${addMonths(monthKey(today), -1)}-01`);
    if (preset === 'custom' && (from || to)) return { start: from || '0000-01-01', end: to || '9999-12-31' };
    return null;
  }, [preset, from, to, today, data.settings.weekStartsOn]);

  const filtered = useMemo(() => {
    const q = normalizeDescription(query);
    return data.transactions
      .filter((t) => !t.deletedAt)
      .filter((t) => !q || normalizeDescription(t.description).includes(q) || normalizeDescription(t.notes).includes(q))
      .filter((t) => category === 'all' || (category === 'non-spending' ? t.categoryId === null : t.categoryId === category))
      .filter((t) => !range || (t.date >= range.start && t.date <= range.end))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [data, query, category, range]);

  const total = filtered.reduce((s, t) => s + spendingEffect(t), 0);
  const deleted = data.transactions.filter((t) => t.deletedAt).sort((a, b) => b.deletedAt!.localeCompare(a.deletedAt!));

  const groups = useMemo(() => {
    const out: Array<{ key: string; label: string; total: number; items: Transaction[] }> = [];
    const keyOf = (t: Transaction) =>
      view === 'weekly' ? startOfWeek(t.date, data.settings.weekStartsOn) : view === 'monthly' ? monthKey(t.date) : t.date;
    for (const t of filtered.slice(0, view === 'list' ? limit : undefined)) {
      const key = keyOf(t);
      let g = out[out.length - 1];
      if (!g || g.key !== key) {
        const label =
          view === 'weekly' ? `Week of ${formatDay(key)}` : view === 'monthly' ? formatMonth(key) : relativeDayLabel(key, today);
        g = { key, label, total: 0, items: [] };
        out.push(g);
      }
      g.total += spendingEffect(t);
      g.items.push(t);
    }
    return out;
  }, [filtered, view, limit, today, data.settings.weekStartsOn]);

  const activeCats = data.categories.filter((c) => !c.archived || data.transactions.some((t) => t.categoryId === c.id));

  return (
    <>
      <header className="page-header">
        <h1>History</h1>
      </header>

      <div className="stack">
        <label className="amount-wrap" style={{ display: 'block' }}>
          <span className="sr-only">Search purchases</span>
          <span style={{ position: 'absolute', left: 14, top: 14, color: 'var(--text-3)', width: 20, height: 20 }}><SearchIcon /></span>
          <input className="input" style={{ paddingLeft: 44 }} type="search" placeholder="Search purchases" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="grid-2">
          <select className="input" aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {activeCats.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
            <option value="non-spending">Transfers, savings & other</option>
          </select>
          <select className="input" aria-label="Filter by date" value={preset} onChange={(e) => setPreset(e.target.value as DatePreset)}>
            <option value="all">All dates</option>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="last-month">Last month</option>
            <option value="custom">Custom range…</option>
          </select>
        </div>
        {preset === 'custom' && (
          <div className="grid-2">
            <label className="field"><span>From</span><input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
            <label className="field"><span>To</span><input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
          </div>
        )}
        <Segmented
          label="View"
          value={view}
          onChange={setView}
          options={[
            { value: 'list', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'deleted', label: `Deleted${deleted.length ? ` (${deleted.length})` : ''}` },
          ]}
        />
      </div>

      {view !== 'deleted' ? (
        <>
          <div className="row between" style={{ margin: '16px 4px 0' }}>
            <span className="muted small">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</span>
            <span className="small">Spending: <b className="num">{formatCents(total)}</b></span>
          </div>
          {groups.length === 0 && (
            <div className="card empty" style={{ marginTop: 12 }}>
              <div className="big">🔍</div>
              {data.transactions.some((t) => !t.deletedAt) ? 'Nothing matches these filters.' : 'No entries yet.'}
            </div>
          )}
          {view === 'list'
            ? groups.map((g) => (
                <div key={g.key}>
                  <div className="day-head"><span>{g.label}</span><span className="num">{formatCents(g.total)}</span></div>
                  <div className="list">{g.items.map((t) => <TxnRow key={t.id} txn={t} onOpen={onOpen} />)}</div>
                </div>
              ))
            : (
              <div className="list" style={{ marginTop: 12 }}>
                {groups.map((g) => (
                  <button key={g.key} className="txn" onClick={() => {
                    setView('list');
                    setPreset('custom');
                    if (view === 'monthly') { const r = monthRange(`${g.key}-01`); setFrom(r.start); setTo(r.end); }
                    else { setFrom(g.key); setTo(weekRange(g.key, data.settings.weekStartsOn).end); }
                  }}>
                    <span className="grow">
                      <div className="txn-title">{g.label}</div>
                      <div className="txn-sub">{g.items.length} {g.items.length === 1 ? 'entry' : 'entries'}</div>
                    </span>
                    <span className="txn-amt num">{formatCents(g.total)}</span>
                  </button>
                ))}
              </div>
            )}
          {view === 'list' && filtered.length > limit && (
            <button className="btn block" style={{ marginTop: 14 }} onClick={() => setLimit((l) => l + 150)}>Show more</button>
          )}
        </>
      ) : (
        <>
          <p className="muted small" style={{ margin: '16px 4px' }}>Deleted entries don't count toward any totals. Restore anything deleted by mistake.</p>
          {deleted.length === 0 ? (
            <div className="card empty"><div className="big">🗑️</div>Nothing here.</div>
          ) : (
            <div className="list">
              {deleted.map((t) => (
                <div key={t.id} className="txn">
                  <span className="grow">
                    <div className="txn-title ellipsis">{t.description}</div>
                    <div className="txn-sub">{formatDay(t.date)} · {formatCents(t.amountCents)}</div>
                  </span>
                  <button className="btn small primary" onClick={() => apply((d) => restoreTransaction(d, t.id), { toast: 'Restored' })}>Restore</button>
                  <button className="btn small" aria-label={`Delete ${t.description} forever`} onClick={() => setPurging(t)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {purging && (
        <ConfirmDialog
          title="Delete forever?"
          danger
          message={`“${purging.description}” will be permanently removed. This can't be undone.`}
          confirmLabel="Delete forever"
          onCancel={() => setPurging(null)}
          onConfirm={() => {
            apply((d) => purgeTransaction(d, purging.id), { toast: 'Permanently deleted' });
            setPurging(null);
          }}
        />
      )}
    </>
  );
}
