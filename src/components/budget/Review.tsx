import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { BUCKET_LABELS, BUCKETS } from '../../lib/types';
import { formatCents, percentOf } from '../../lib/money';
import { addMonths, formatDay, formatMonth, monthKey } from '../../lib/dates';
import {
  currentPaycheck,
  monthlyReport,
  monthsWithActivity,
  monthView,
  paycheckView,
  reviewFor,
  sortedPaychecks,
  type BudgetView,
  type CategoryTotal,
} from '../../lib/budget';
import { monthlyCSV, reviewCSV } from '../../lib/budgetReport';
import { deliverFile } from '../../lib/files';
import { BarChart } from '../BarChart';
import { Segmented } from '../ui';
import { bucketStyle, KV, money, PeriodNav } from './parts';

export function Review() {
  const [kind, setKind] = useState<'paycheck' | 'month'>('paycheck');
  return (
    <>
      <div className="no-print">
        <Segmented label="Review type" value={kind} onChange={setKind} options={[{ value: 'paycheck', label: 'Paycheck review' }, { value: 'month', label: 'Monthly summary' }]} />
      </div>
      {kind === 'paycheck' ? <PaycheckReview /> : <MonthlySummary />}
    </>
  );
}

function ExportBar({ name, csv }: { name: string; csv: () => string }) {
  const { toast } = useStore();
  return (
    <div className="grid-2 no-print" style={{ marginTop: 14 }}>
      <button className="btn" onClick={async () => {
        try {
          const problem = await deliverFile(`${name}.csv`, 'text/csv', csv(), false);
          if (problem) toast(problem, 'error');
        } catch (e) {
          if ((e as Error).name !== 'AbortError') toast('Export failed. Try again.', 'error');
        }
      }}>Export CSV</button>
      <button className="btn" onClick={() => {
        try {
          window.print();
        } catch {
          toast('Printing isn\'t available here. Use Export CSV instead.', 'error');
        }
      }}>Save as PDF</button>
    </div>
  );
}

function PaycheckReview() {
  const { data, today } = useStore();
  const list = useMemo(() => sortedPaychecks(data), [data]);
  const cur = currentPaycheck(data, today);
  // Default to the most recent period that has ended (the one to review), else the current one.
  const ended = list.findIndex((p) => p.periodEnd < today);
  const [index, setIndex] = useState<number | null>(null);
  const i = Math.min(index ?? (ended >= 0 ? ended : Math.max(0, list.findIndex((p) => p.id === cur?.paycheck.id))), Math.max(0, list.length - 1));
  const p = list[i];
  const review = useMemo(() => (p ? reviewFor(data, paycheckView(data, p)) : null), [data, p]);
  if (!p || !review) return <div className="card muted" style={{ marginTop: 14 }}>Add a paycheck to see its review.</div>;
  const v = review.view;
  const inProgress = p.periodEnd >= today;

  return (
    <>
      <div style={{ marginTop: 12 }}>
        <PeriodNav label="Choose pay period" index={i} onIndex={setIndex} items={list.map((x) => ({ key: x.id, label: `${formatDay(x.periodStart)} – ${formatDay(x.periodEnd)}${x.periodEnd >= today && x.periodStart <= today ? ' · in progress' : ''}` }))} />
      </div>
      <section className="card" style={{ marginTop: 14 }}>
        <div className="hero-label">Pay period · {v.label}{inProgress ? ' (so far)' : ''}</div>
        <div style={{ marginTop: 8 }}>
          <KV k="Received" v={formatCents(v.totals.income)} />
          <KV k="Spent" v={money(v.totals.spent)} />
          <KV k="Invested" v={formatCents(v.buckets.investing.contributed)} />
          <KV k="Contributed to goals" v={formatCents(v.buckets.goals.contributed)} />
          <KV k="Debt paid" v={formatCents(v.totals.debtPaid)} />
          <KV k="Biggest spending category" v={review.biggest ? `${review.biggest.emoji} ${review.biggest.name} · ${formatCents(review.biggest.spent)}` : '—'} />
          <KV total k="Unused budget" v={formatCents(review.unused.reduce((s, u) => s + u.cents, 0))} />
          {review.unused.map((u) => <KV key={u.bucket} sub k={BUCKET_LABELS[u.bucket]} v={formatCents(u.cents)} />)}
        </div>
        {!review.hasData && <div className="small faint" style={{ marginTop: 8 }}>Nothing recorded in this period yet — the review fills in as you log expenses and payments.</div>}
      </section>

      <BucketBars view={v} />

      <section className="card">
        <h2 className="card-title">Planned vs. actual</h2>
        <table className="tbl">
          <thead><tr><th>Line</th><th>Planned</th><th>Actual</th><th>Diff</th></tr></thead>
          <tbody>
            {BUCKETS.flatMap((b) => [
              <tr key={b}><td colSpan={4} style={{ ...bucketStyle(b), fontWeight: 750, paddingTop: 12 }}><span className="row" style={{ gap: 6 }}><span className="bucket-dot" />{BUCKET_LABELS[b]}</span></td></tr>,
              ...v.buckets[b].lines.map((ls) => {
                const diff = ls.line.type === 'contribution' ? ls.actual - ls.planned : ls.planned - ls.actual;
                return (
                  <tr key={ls.line.id}>
                    <td>{ls.line.name}</td>
                    <td>{formatCents(ls.planned)}</td>
                    <td>{money(ls.actual)}</td>
                    <td style={{ color: ls.line.type !== 'contribution' && diff < 0 ? 'var(--over)' : 'var(--text-3)' }}>{diff === 0 ? '—' : money(diff)}</td>
                  </tr>
                );
              }),
              v.buckets[b].unplannedSpent !== 0 ? <tr key={`${b}-u`}><td className="muted">Not on a plan line</td><td>—</td><td>{money(v.buckets[b].unplannedSpent)}</td><td /></tr> : null,
            ])}
          </tbody>
        </table>
        <div className="small faint" style={{ marginTop: 8 }}>Diff: for spending and bills, what's left of the plan (negative = over); for contributions, how far ahead or behind you are.</div>
      </section>

      <CategoryBreakdown rows={review.byCategory} total={v.totals.spent} />

      <section className="card">
        <h2 className="card-title">Where you went over</h2>
        {review.overspent.length === 0 ? <div className="muted">Nothing over plan in this period.</div> : review.overspent.map((o) => (
          <KV key={o.label} k={o.label} v={<span style={{ color: 'var(--over)' }}>+{formatCents(o.actual - o.planned)} <span className="faint" style={{ fontWeight: 500 }}>({formatCents(o.actual)} of {formatCents(o.planned)})</span></span>} />
        ))}
      </section>

      <section className="card reco">
        <h2 className="card-title" style={{ color: 'var(--green)' }}>Ideas for next period</h2>
        {review.recommendations.length === 0 ? <p className="muted">Not enough recorded spending yet for a useful suggestion.</p> : review.recommendations.map((r, k) => <p key={k} style={{ marginTop: k ? 10 : 0 }}>{r}</p>)}
        <div className="small faint" style={{ marginTop: 10 }}>Based only on entries you recorded.</div>
      </section>

      <ExportBar name={`budget-review-${v.range.start}`} csv={() => reviewCSV(review)} />
    </>
  );
}

function MonthlySummary() {
  const { data, today } = useStore();
  const months = useMemo(() => monthsWithActivity(data, today).map((k) => ({ key: k, label: formatMonth(k) })), [data, today]);
  const def = Math.max(0, months.findIndex((m) => m.key === monthKey(today)));
  const [index, setIndex] = useState<number | null>(null);
  const i = Math.min(index ?? def, months.length - 1);
  const key = months[i]?.key ?? monthKey(today);
  const rep = useMemo(() => monthlyReport(data, key), [data, key]);
  const trend = useMemo(() => Array.from({ length: 6 }, (_, n) => addMonths(key, n - 5)).map((k) => ({ k, v: monthView(data, k) })), [data, key]);
  const v = rep.view;
  const tickEvery = rep.daily.length > 16 ? 5 : 2;
  const needs = Math.max(0, v.buckets.needs.spent);
  const wants = Math.max(0, v.buckets.fun.spent);
  const nw = needs + wants;

  return (
    <>
      <div style={{ marginTop: 12 }}><PeriodNav label="Choose month" index={i} onIndex={setIndex} items={months} /></div>
      <section className="card" style={{ marginTop: 14 }}>
        <div className="hero-label">{v.label}</div>
        <div className="hero-value num">{money(v.totals.spent)}</div>
        <div className="muted">total spending</div>
        <div style={{ marginTop: 10 }}>
          <KV k={`Monthly income · ${v.paychecks.length} paycheck${v.paychecks.length === 1 ? '' : 's'}`} v={formatCents(v.totals.income)} />
          <KV k="Investing contributions" v={formatCents(v.buckets.investing.contributed)} />
          <KV k="Savings contributions" v={formatCents(v.buckets.goals.contributed)} />
          <KV k="Debt payments" v={formatCents(v.totals.debtPaid)} />
          <KV total k="Left of this month's income" v={money(v.totals.income - v.totals.spent - v.totals.contributed - v.totals.debtPaid)} />
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Needs vs. wants</h2>
        {nw === 0 ? <div className="muted">No Needs or Guilt-Free spending recorded this month.</div> : (
          <>
            <div className="split-bar" role="img" aria-label={`Needs ${formatCents(needs)}, Guilt-Free ${formatCents(wants)}`}>
              {needs > 0 && <span style={{ width: `${(needs / nw) * 100}%`, background: 'var(--b-needs)' }} />}
              {wants > 0 && <span style={{ width: `${(wants / nw) * 100}%`, background: 'var(--b-fun)' }} />}
            </div>
            <div className="legend">
              <span><i style={{ background: 'var(--b-needs)' }} />Needs <b className="num">{formatCents(needs)}</b> · {percentOf(needs, nw)}%</span>
              <span><i style={{ background: 'var(--b-fun)' }} />Guilt-Free (wants) <b className="num">{formatCents(wants)}</b> · {percentOf(wants, nw)}%</span>
            </div>
          </>
        )}
      </section>

      <BucketBars view={v} />

      <section className="card">
        <h2 className="card-title">Daily spending</h2>
        <BarChart data={rep.daily.map((d, n) => ({ key: d.date, label: formatDay(d.date, { weekday: 'short', month: 'short', day: 'numeric' }), tick: n % tickEvery === 0 ? String(Number(d.date.slice(8))) : '', value: d.spent, highlight: d.date === today }))} />
      </section>

      <CategoryBreakdown rows={rep.byCategory} total={v.totals.spent} />

      <section className="card">
        <h2 className="card-title">Compared with {formatMonth(addMonths(key, -1)).replace(/ \d{4}$/, '')}</h2>
        <table className="tbl">
          <thead><tr><th /><th>This month</th><th>Last month</th><th>Change</th></tr></thead>
          <tbody>
            {rep.comparison.map((c) => {
              const d = c.current - c.previous;
              const spendRow = /spending/i.test(c.label);
              return (
                <tr key={c.label}>
                  <td>{c.label}</td>
                  <td>{money(c.current)}</td>
                  <td className="muted">{money(c.previous)}</td>
                  <td className={d === 0 ? 'faint' : spendRow ? (d > 0 ? 'delta-up' : 'delta-down') : ''}>{d === 0 ? '—' : `${d > 0 ? '+' : '−'}${formatCents(Math.abs(d))}`}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="card-title">Spending · last 6 months</h2>
        <BarChart data={trend.map(({ k, v: tv }) => ({ key: k, label: formatMonth(k), tick: formatMonth(k).slice(0, 3), value: Math.max(0, tv.totals.spent), highlight: k === key }))} />
      </section>

      <section className="card">
        <h2 className="card-title">Pay periods in this month</h2>
        {rep.periods.length === 0 && !rep.uncovered.spent ? <div className="muted">No pay periods or spending this month.</div> : (
          <table className="tbl">
            <thead><tr><th>Days</th><th>Spent</th><th>Saved</th><th>Debt</th></tr></thead>
            <tbody>
              {rep.periods.map((p) => (
                <tr key={p.paycheck.id}>
                  <td>{formatDay(p.inMonth.start)} – {formatDay(p.inMonth.end)}<div className="small faint">paid {formatDay(p.paycheck.date)}{p.paycheck.date.slice(0, 7) !== key ? ' (other month)' : ''}</div></td>
                  <td>{money(p.spent)}</td><td>{formatCents(p.contributed)}</td><td>{formatCents(p.debtPaid)}</td>
                </tr>
              ))}
              {(rep.uncovered.spent !== 0 || rep.uncovered.contributed > 0 || rep.uncovered.debtPaid > 0) && (
                <tr><td>No paycheck period</td><td>{money(rep.uncovered.spent)}</td><td>{formatCents(rep.uncovered.contributed)}</td><td>{formatCents(rep.uncovered.debtPaid)}</td></tr>
              )}
              <tr><td><b>Month total</b></td><td><b>{money(v.totals.spent)}</b></td><td><b>{formatCents(v.totals.contributed)}</b></td><td><b>{formatCents(v.totals.debtPaid)}</b></td></tr>
            </tbody>
          </table>
        )}
        <div className="small faint" style={{ marginTop: 8 }}>Each day belongs to one pay period, so these rows always add up to the month.</div>
      </section>

      <ExportBar name={`budget-month-${key}`} csv={() => monthlyCSV(rep)} />
    </>
  );
}

/** Target vs. actual per bucket. Grey bar = budget, colored bar = used (spent + contributed + reserved). */
function BucketBars({ view }: { view: BudgetView }) {
  const [active, setActive] = useState<string | null>(null);
  const rows = BUCKETS.map((b) => {
    const s = view.buckets[b];
    const budget = s.target - s.redirectOut + s.redirectIn;
    const used = s.spent + s.contributed + s.debtPaid + s.reserved;
    return { b, budget, used, s };
  });
  const max = Math.max(1, ...rows.map((r) => Math.max(r.budget, r.used)));
  return (
    <section className="card">
      <h2 className="card-title">Bucket performance</h2>
      <div className="hbar">
        {rows.map(({ b, budget, used, s }) => (
          <div key={b} style={{ display: 'contents' }}>
            <span className="row" style={{ gap: 6, fontWeight: 650, ...bucketStyle(b) }}><span className="bucket-dot" />{BUCKET_LABELS[b]}</span>
            <button
              className="track"
              style={{ ...bucketStyle(b), background: 'none', border: 0, padding: 0, textAlign: 'left', minHeight: 30 }}
              aria-label={`${BUCKET_LABELS[b]}: ${formatCents(used)} used of ${formatCents(budget)}`}
              onMouseEnter={() => setActive(b)} onFocus={() => setActive(b)} onClick={() => setActive(b)}
            >
              <span className="t" style={{ width: `${(Math.max(0, budget) / max) * 100}%` }} />
              <span className={`a ${budget > 0 && used > budget ? 'over' : ''}`} style={{ width: `${(Math.max(0, used) / max) * 100}%` }} />
            </button>
            {active === b && (
              <div style={{ gridColumn: '1 / -1' }} className="chart-tip">
                {BUCKET_LABELS[b]}: <b className="num">{formatCents(used)}</b> used of <b className="num">{formatCents(budget)}</b>
                {s.reserved > 0 && ` (incl. ${formatCents(s.reserved)} reserved)`}{s.redirectOut > 0 && ` · ${formatCents(s.redirectOut)} redirected to debt`}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="legend"><span><i style={{ background: 'var(--surface-3)' }} />Budget</span><span><i style={{ background: 'var(--text-2)' }} />Used (in each bucket's color)</span></div>
      <table className="tbl" style={{ marginTop: 10 }}>
        <thead><tr><th>Bucket</th><th>Budget</th><th>Used</th><th>Left</th></tr></thead>
        <tbody>
          {rows.map(({ b, budget, used, s }) => (
            <tr key={b}><td>{BUCKET_LABELS[b]}</td><td>{formatCents(budget)}</td><td>{money(used)}</td><td style={{ color: s.remaining < 0 ? 'var(--over)' : undefined }}>{money(s.remaining)}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CategoryBreakdown({ rows, total }: { rows: CategoryTotal[]; total: number }) {
  const max = Math.max(1, ...rows.map((c) => c.spent));
  return (
    <section className="card">
      <h2 className="card-title">Spending by category</h2>
      {rows.length === 0 ? <div className="muted">No spending recorded.</div> : rows.map((c) => (
        <div key={c.id} className="cat-row">
          <span className="txn-icon" aria-hidden>{c.emoji}</span>
          <div className="grow">
            <div className="row between"><span style={{ fontWeight: 650 }}>{c.name}</span><span className="num" style={{ fontWeight: 700 }}>{money(c.spent)}</span></div>
            <div className="row between small faint">
              <div className="bar-track grow"><span style={{ width: `${Math.max(0, (c.spent / max) * 100)}%` }} /></div>
              <span style={{ width: 44, textAlign: 'right' }}>{percentOf(c.spent, total)}%</span>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
