import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { Transaction } from '../lib/types';
import { centsToInput, formatCents, parseCents, percentOf } from '../lib/money';
import { addDays, addMonths, daysBetween, formatDay, formatMonth, monthKey, startOfWeek } from '../lib/dates';
import { categoryBudgets, monthRange, paycheckRange, totalSpent } from '../lib/ledger';
import { buildInsights, frequentPurchases, savingsFromReduction } from '../lib/insights';
import { buildReport, monthPeriods, payPeriods, weeklyTrend, type ReportPeriod } from '../lib/reports';
import { BarChart } from '../components/BarChart';
import { Progress, Segmented, StatusChip } from '../components/ui';
import { ChevronLeft, ChevronRight } from '../components/Icons';
import { TxnRow } from '../components/TxnRow';

type PeriodKind = 'month' | 'pay' | 'week';

function weekPeriods(today: string, weekStartsOn: 0 | 1): ReportPeriod[] {
  const start = startOfWeek(today, weekStartsOn);
  return Array.from({ length: 52 }, (_, i) => {
    const s = addDays(start, -7 * i);
    const e = addDays(s, 6);
    return { key: `w:${s}`, label: i === 0 ? 'This week' : `${formatDay(s)} – ${formatDay(e)}`, range: { start: s, end: e }, kind: 'week' as const };
  });
}

export function Reports({ onOpen }: { onOpen: (t: Transaction) => void }) {
  const { data, today } = useStore();
  const [kind, setKind] = useState<PeriodKind>('month');
  const [index, setIndex] = useState(0);

  const periods = useMemo(() => {
    if (kind === 'month') return monthPeriods(data, today);
    if (kind === 'pay') return payPeriods(data, today);
    return weekPeriods(today, data.settings.weekStartsOn);
  }, [kind, data, today]);
  const period = periods[Math.min(index, periods.length - 1)];
  const insights = useMemo(() => buildInsights(data, today), [data, today]);

  return (
    <>
      <header className="page-header">
        <h1>Reports</h1>
      </header>

      {insights.length > 0 && (
        <section className="card">
          <h2 className="card-title">Insights</h2>
          {insights.map((i) => (
            <div key={i.id} className="insight">
              <div className="insight-icon" aria-hidden>{i.icon}</div>
              <div>
                <div className="insight-title">{i.title}</div>
                <div className="insight-detail">{i.detail}</div>
              </div>
            </div>
          ))}
          <div className="small faint" style={{ marginTop: 8 }}>Based only on entries you've recorded.</div>
        </section>
      )}

      <div className="stack" style={{ marginTop: 14 }}>
        <Segmented
          label="Report period"
          value={kind}
          onChange={(k) => { setKind(k); setIndex(0); }}
          options={[
            { value: 'month', label: 'Month' },
            { value: 'pay', label: 'Pay period' },
            { value: 'week', label: 'Week' },
          ]}
        />
        {period ? (
          <div className="row between">
            <button className="icon-btn" aria-label="Previous period" disabled={index >= periods.length - 1} onClick={() => setIndex((i) => Math.min(periods.length - 1, i + 1))}><ChevronLeft /></button>
            <select className="input grow" style={{ textAlign: 'center' }} aria-label="Choose period" value={index} onChange={(e) => setIndex(Number(e.target.value))}>
              {periods.map((p, i) => <option key={p.key} value={i}>{p.label}</option>)}
            </select>
            <button className="icon-btn" aria-label="Next period" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}><ChevronRight /></button>
          </div>
        ) : (
          <div className="card muted">
            {data.settings.budgetMode === 'paycheck' ? 'Add a paycheck on the Budget tab to see pay-period reports.' : 'No periods yet.'}
          </div>
        )}
      </div>

      {period && <PeriodReport period={period} onOpen={onOpen} />}
      <NeedsWantsMonthly />
      <SavingsCalculator />
    </>
  );
}

function PeriodReport({ period, onOpen }: { period: ReportPeriod; onOpen: (t: Transaction) => void }) {
  const { data, today } = useStore();
  const r = useMemo(() => buildReport(data, period.range, today, formatCents), [data, period, today]);
  const days = Math.min(daysBetween(period.range.start, period.range.end), daysBetween(period.range.start, today)) + 1;
  const elapsed = Math.max(1, days);
  const trendEnd = period.range.end < today ? period.range.end : today;
  const trend = useMemo(() => weeklyTrend(data, trendEnd, 8, data.settings.weekStartsOn), [data, trendEnd]);
  const budgets = useMemo(() => categoryBudgets(data, today, period.range), [data, today, period]);
  const overall = useMemo(() => overallBudget(data, period), [data, period]);
  const catMax = Math.max(1, ...r.byCategory.map((c) => c.spent));
  const nwTotal = Math.max(0, r.needs) + Math.max(0, r.wants) + Math.max(0, r.unmarked);
  const tickEvery = r.daily.length > 16 ? 5 : r.daily.length > 8 ? 2 : 1;

  return (
    <>
      <section className="card" style={{ marginTop: 14 }}>
        <div className="hero-label">Total spending · {formatDay(period.range.start)} – {formatDay(period.range.end)}</div>
        <div className="hero-value num">{formatCents(r.total)}</div>
        <div className="row wrap small muted" style={{ gap: 16 }}>
          <span>{r.count} purchases</span>
          {period.range.start <= today && <span className="num">{formatCents(Math.round(r.total / elapsed))}/day avg</span>}
          {r.saved > 0 && <span style={{ color: 'var(--green)' }} className="num">🏦 {formatCents(r.saved)} saved/invested</span>}
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Daily spending</h2>
        <BarChart
          data={r.daily.map((d, i) => ({
            key: d.date,
            label: formatDay(d.date, { weekday: 'short', month: 'short', day: 'numeric' }),
            tick: r.daily.length <= 7 ? formatDay(d.date, { weekday: 'narrow' }) : i % tickEvery === 0 ? String(Number(d.date.slice(8))) : '',
            value: d.spent,
            highlight: d.date === today,
          }))}
        />
      </section>

      <section className="card">
        <h2 className="card-title">By category</h2>
        {r.byCategory.length === 0 ? (
          <div className="muted">No spending recorded in this period.</div>
        ) : (
          r.byCategory.map((c) => (
            <div key={c.id} className="cat-row">
              <span className="txn-icon" aria-hidden>{c.emoji}</span>
              <div className="grow">
                <div className="row between">
                  <span style={{ fontWeight: 650 }}>{c.name}</span>
                  <span className="num" style={{ fontWeight: 700 }}>{formatCents(c.spent)}</span>
                </div>
                <div className="row between small faint">
                  <div className="bar-track grow"><span style={{ width: `${Math.max(0, (c.spent / catMax) * 100)}%` }} /></div>
                  <span style={{ width: 44, textAlign: 'right' }}>{percentOf(c.spent, r.total)}%</span>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Weekly trend · last 8 weeks</h2>
        <BarChart
          data={trend.map((w) => ({
            key: w.start,
            label: `Week of ${w.label}`,
            tick: w.label.replace(/^(\w+) /, (_, m: string) => m.slice(0, 3) + ' '),
            value: w.spent,
            highlight: w.start === startOfWeek(trendEnd, data.settings.weekStartsOn),
          }))}
        />
      </section>

      <section className="card">
        <h2 className="card-title">Budget performance</h2>
        {!overall && budgets.length === 0 && <div className="muted">Set a spending budget or category limits on the Budget tab to track performance.</div>}
        {overall && (
          <div style={{ marginBottom: budgets.length ? 14 : 0 }}>
            <div className="row between">
              <span style={{ fontWeight: 650 }}>{overall.label}</span>
              <span className="num">{formatCents(overall.spent)} / {formatCents(overall.budget)}</span>
            </div>
            <Progress percent={percentOf(overall.spent, overall.budget)} level={overall.spent >= overall.budget ? 'over' : overall.spent * 100 >= overall.budget * 80 ? 'near' : 'ok'} label={overall.label} />
            <div className="small muted">{overall.spent <= overall.budget ? `${formatCents(overall.budget - overall.spent)} under budget` : `${formatCents(overall.spent - overall.budget)} over budget`}</div>
          </div>
        )}
        {budgets.map((b) => (
          <div key={b.category.id} style={{ padding: '8px 0' }}>
            <div className="row between">
              <span>{b.category.emoji} {b.category.name}</span>
              <span className="row" style={{ gap: 8 }}>
                <span className="num small">{formatCents(b.spent)} / {formatCents(b.budget)}</span>
                <StatusChip level={b.level} percent={b.percent} />
              </span>
            </div>
            <Progress thin percent={b.percent} level={b.level} label={`${b.category.name} budget used`} />
          </div>
        ))}
        {budgets.length > 0 && data.settings.categoryBudgetPeriod === 'month' && period.kind !== 'month' && (
          <div className="small faint">Category limits are monthly; shown here against this period's spending.</div>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Needs vs. wants</h2>
        {nwTotal === 0 ? (
          <div className="muted">No spending recorded in this period.</div>
        ) : (
          <>
            <div className="split-bar" role="img" aria-label={`Needs ${formatCents(r.needs)}, wants ${formatCents(r.wants)}, not marked ${formatCents(r.unmarked)}`}>
              {r.needs > 0 && <span style={{ width: `${(r.needs / nwTotal) * 100}%`, background: 'var(--green)' }} />}
              {r.wants > 0 && <span style={{ width: `${(r.wants / nwTotal) * 100}%`, background: 'var(--blue)' }} />}
              {r.unmarked > 0 && <span style={{ width: `${(r.unmarked / nwTotal) * 100}%`, background: 'var(--surface-3)' }} />}
            </div>
            <div className="legend">
              <span><i style={{ background: 'var(--green)' }} />Needs <b className="num">{formatCents(r.needs)}</b></span>
              <span><i style={{ background: 'var(--blue)' }} />Wants <b className="num">{formatCents(r.wants)}</b></span>
              <span><i style={{ background: 'var(--surface-3)' }} />Not marked <b className="num">{formatCents(r.unmarked)}</b></span>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Largest purchases</h2>
        {r.largest.length === 0 ? <div className="muted">None in this period.</div> : (
          <div style={{ margin: '0 -14px -14px' }}>
            {r.largest.map((t) => <TxnRow key={t.id} txn={t} onOpen={onOpen} showDate />)}
          </div>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Top opportunities to reduce spending</h2>
        {r.opportunities.length === 0 ? (
          <div className="muted">Nothing stands out in this period. Marking purchases as needs or wants helps surface ideas.</div>
        ) : (
          r.opportunities.map((o, i) => (
            <div key={i} className="insight"><div className="insight-icon">💡</div><div className="insight-detail" style={{ marginTop: 0 }}>{o}</div></div>
          ))
        )}
      </section>
    </>
  );
}

function overallBudget(data: ReturnType<typeof useStore>['data'], period: ReportPeriod): { label: string; spent: number; budget: number } | null {
  const s = data.settings;
  const spent = totalSpent(data, period.range);
  if (period.kind === 'pay') {
    if (s.budgetMode === 'biweekly' && s.customBudgetCents > 0) return { label: '2-week budget', spent, budget: s.customBudgetCents };
    const p = data.paychecks.find((x) => paycheckRange(x).start === period.range.start);
    if (p) return { label: 'Spending allowance', spent, budget: p.allowanceCents };
  }
  if (period.kind === 'month' && s.budgetMode === 'monthly' && s.customBudgetCents > 0) return { label: 'Monthly budget', spent, budget: s.customBudgetCents };
  return null;
}

function NeedsWantsMonthly() {
  const { data, today } = useStore();
  const rows = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const key = addMonths(monthKey(today), -i);
      const r = buildReport(data, monthRange(`${key}-01`), today, formatCents);
      return { key, needs: r.needs, wants: r.wants, unmarked: r.unmarked };
    }).filter((r, i) => i === 0 || r.needs || r.wants || r.unmarked);
  }, [data, today]);
  if (!rows.some((r) => r.needs || r.wants)) return null;
  return (
    <section className="card">
      <h2 className="card-title">Needs vs. wants by month</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr className="faint" style={{ textAlign: 'right' }}>
            <th style={{ textAlign: 'left', fontWeight: 600 }}>Month</th><th style={{ fontWeight: 600 }}>Needs</th><th style={{ fontWeight: 600 }}>Wants</th><th style={{ fontWeight: 600 }}>Wants %</th>
          </tr>
        </thead>
        <tbody className="num">
          {rows.map((r) => (
            <tr key={r.key} style={{ textAlign: 'right', borderTop: '1px solid var(--border)' }}>
              <td style={{ textAlign: 'left', padding: '8px 0' }}>{formatMonth(r.key).replace(/ \d{4}$/, '')}</td>
              <td>{formatCents(r.needs)}</td>
              <td>{formatCents(r.wants)}</td>
              <td>{percentOf(r.wants, r.needs + r.wants)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="small faint" style={{ marginTop: 8 }}>Only purchases you've marked are counted. You can change any mark by editing the entry.</div>
    </section>
  );
}

function SavingsCalculator() {
  const { data, today } = useStore();
  const frequent = useMemo(() => frequentPurchases(data, { start: addDays(today, -29), end: today }).filter((f) => f.count >= 2).slice(0, 6), [data, today]);
  const [amount, setAmount] = useState('6.50');
  const [perWeek, setPerWeek] = useState('5');
  const [cut, setCut] = useState('2');
  const cents = parseCents(amount) ?? 0;
  const per = Math.max(0, Math.min(50, Number(perWeek) || 0));
  const result = savingsFromReduction(cents, per, Math.max(0, Number(cut) || 0));

  return (
    <section className="card">
      <h2 className="card-title">Savings calculator</h2>
      <p className="muted small" style={{ marginTop: 0 }}>See what cutting back on a recurring purchase could add up to.</p>
      {frequent.length > 0 && (
        <div className="chips" style={{ marginBottom: 10 }}>
          {frequent.map((f) => (
            <button key={f.description} className="chip" onClick={() => {
              setAmount(centsToInput(Math.round(f.total / f.count)));
              setPerWeek(String(Math.max(1, Math.round((f.count / 30) * 7))));
            }}>
              {f.description}<span className="chip-amt">{f.count}× / 30d</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}>
        <label className="field"><span>Cost each</span><input className="input num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
        <label className="field"><span>Times/week</span><input className="input num" inputMode="numeric" value={perWeek} onChange={(e) => setPerWeek(e.target.value.replace(/\D/g, ''))} /></label>
        <label className="field"><span>Cut by</span><input className="input num" inputMode="numeric" value={cut} onChange={(e) => setCut(e.target.value.replace(/\D/g, ''))} /></label>
      </div>
      <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 12 }}>
        <div className="stat"><div className="stat-label">Per week</div><div className="stat-value num" style={{ fontSize: 17 }}>{formatCents(result.weekly)}</div></div>
        <div className="stat"><div className="stat-label">Per month</div><div className="stat-value num" style={{ fontSize: 17 }}>{formatCents(result.monthly)}</div></div>
        <div className="stat"><div className="stat-label">Per year</div><div className="stat-value num" style={{ fontSize: 17, color: 'var(--green)' }}>{formatCents(result.yearly)}</div></div>
      </div>
    </section>
  );
}
