import { useMemo } from 'react';
import { useStore } from '../store';
import { formatCents } from '../lib/money';
import { formatDay } from '../lib/dates';
import { activeTransactions, budgetStatus, budgetWarningText, categoryBudgets, latestPaycheck, monthRange, totalSpent, todayRange, weekRange } from '../lib/ledger';
import { topCategory, weeklyRecommendation } from '../lib/insights';
import { Progress } from '../components/ui';
import { TxnRow } from '../components/TxnRow';
import { GearIcon, PlusIcon } from '../components/Icons';
import type { Transaction } from '../lib/types';
import type { Tab } from '../App';
import { IS_ARTIFACT } from '../platform';
import { BUCKET_LABELS, BUCKETS } from '../lib/types';
import { budgetNotices, currentPaycheck, paycheckView } from '../lib/budget';
import { bucketStyle, money } from '../components/budget/parts';

export function Home({ onAdd, onOpen, go }: { onAdd: () => void; onOpen: (t: Transaction) => void; go: (t: Tab) => void }) {
  const { data, today, cloud } = useStore();

  const stats = useMemo(() => {
    const month = monthRange(today);
    const monthToDate = { start: month.start, end: today };
    const paycheck = latestPaycheck(data, today);
    const dayOfMonth = Number(today.slice(8, 10));
    const monthSpent = totalSpent(data, monthToDate);
    return {
      today: totalSpent(data, todayRange(today)),
      week: totalSpent(data, weekRange(today, data.settings.weekStartsOn)),
      month: monthSpent,
      avgDaily: Math.round(monthSpent / dayOfMonth),
      dayOfMonth,
      paycheck,
      sincePaycheck: paycheck ? totalSpent(data, { start: paycheck.date, end: today }) : null,
      top: topCategory(data, monthToDate),
      budget: budgetStatus(data, today),
      plan: data.settings.budgetMode === 'paycheck' ? currentPaycheck(data, today) : null,
      budgetNotices: data.settings.budgetMode === 'paycheck' ? budgetNotices(data, today, 2).filter((n) => n.level === 'over' || n.level === 'near') : [],
      warnings: categoryBudgets(data, today).filter((r) => r.level !== 'ok').sort((a, b) => b.percent - a.percent),
      recommendation: weeklyRecommendation(data, today),
      recent: activeTransactions(data)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 5),
    };
  }, [data, today]);

  const b = stats.budget;
  const level = !b ? 'ok' : b.spent >= b.period.budgetCents ? 'over' : b.percent >= 80 ? 'near' : 'ok';

  return (
    <>
      <header className="page-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden>$</div>
          <h1>Spend Smarter</h1>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {IS_ARTIFACT && <SyncBadge state={cloud} onClick={() => go('settings')} />}
          <button className="icon-btn" aria-label="Settings & backups" onClick={() => go('settings')}>
            <GearIcon />
          </button>
        </div>
      </header>

      {stats.plan ? (
        <PlanHero plan={stats.plan} go={go} />
      ) : (
      <section className="card" aria-label="Spending budget">
        {b ? (
          <>
            <div className="row between">
              <span className="hero-label">{b.period.label} · {formatDay(b.period.range.start)} – {formatDay(b.period.range.end)}</span>
            </div>
            <div className="hero-value num">{formatCents(b.remaining)}</div>
            <div className="muted">{b.remaining >= 0 ? 'left to spend' : 'over your spending budget'}</div>
            <Progress percent={b.percent} level={level} label="Budget used" />
            <div className="row between small">
              <span className="muted num">{formatCents(b.spent)} of {formatCents(b.period.budgetCents)} used</span>
              <span className="muted num">{b.remaining > 0 ? `${formatCents(b.perDayLeft)}/day · ${b.daysLeft}d left` : `${b.daysLeft}d left`}</span>
            </div>
            {b.period.stale && (
              <div className="notice near" style={{ marginTop: 12 }}>
                <span>📅</span>
                <span>Your next payday has passed. <button className="link" onClick={() => go('budget')}>Add your new paycheck</button> to start a fresh period.</span>
              </div>
            )}
          </>
        ) : (
          <div className="stack">
            <span className="hero-label">Spending budget</span>
            <div className="muted">Add your paycheck and spending allowance (or a monthly budget) to see how much you have left.</div>
            <button className="btn" onClick={() => go('budget')}>Set up budget</button>
          </div>
        )}
      </section>
      )}

      <button className="btn primary add-cta" onClick={onAdd}>
        <PlusIcon /> Add Expense
      </button>

      {stats.budgetNotices.map((n) => (
        <div key={n.id} className={`notice ${n.level}`} style={{ marginTop: 10 }}>
          <span>{n.level === 'over' ? '▲' : '●'}</span>
          <span>{n.text}</span>
        </div>
      ))}

      {stats.warnings.map((w) => (
        <div key={w.category.id} className={`notice ${w.level}`} style={{ marginTop: 10 }}>
          <span>{w.level === 'over' ? '▲' : '●'}</span>
          <span>{budgetWarningText(w, formatCents)}</span>
        </div>
      ))}

      <div className="stat-grid" style={{ marginTop: 14 }}>
        <div className="stat">
          <div className="stat-label">Today</div>
          <div className="stat-value num">{formatCents(stats.today)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">This week</div>
          <div className="stat-value num">{formatCents(stats.week)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">This month</div>
          <div className="stat-value num">{formatCents(stats.month)}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Since last paycheck</div>
          {stats.sincePaycheck !== null ? (
            <>
              <div className="stat-value num">{formatCents(stats.sincePaycheck)}</div>
              <div className="stat-sub">since {formatDay(stats.paycheck!.date)}</div>
            </>
          ) : (
            <button className="link" style={{ padding: '6px 0' }} onClick={() => go('budget')}>Add paycheck</button>
          )}
        </div>
        <div className="stat">
          <div className="stat-label">Avg per day</div>
          <div className="stat-value num">{formatCents(stats.avgDaily)}</div>
          <div className="stat-sub">this month, {stats.dayOfMonth} days</div>
        </div>
        <div className="stat">
          <div className="stat-label">Top category</div>
          {stats.top ? (
            <>
              <div className="stat-value ellipsis" style={{ fontSize: 17 }}>{stats.top.category.emoji} {stats.top.category.name}</div>
              <div className="stat-sub num">{formatCents(stats.top.spent)} this month</div>
            </>
          ) : (
            <div className="stat-sub" style={{ marginTop: 8 }}>No spending yet</div>
          )}
        </div>
      </div>

      {stats.recommendation && (
        <section className="card reco" style={{ marginTop: 14 }}>
          <h2 className="card-title" style={{ color: 'var(--green)' }}>This week's tip</h2>
          <p>{stats.recommendation}</p>
        </section>
      )}

      <h2 className="section-title">
        Recent
        {stats.recent.length > 0 && <button className="link" onClick={() => go('history')}>See all</button>}
      </h2>
      {stats.recent.length ? (
        <div className="list">
          {stats.recent.map((t) => (
            <TxnRow key={t.id} txn={t} onOpen={onOpen} showDate />
          ))}
        </div>
      ) : (
        <div className="card empty">
          <div className="big">🧾</div>
          <div>No expenses yet. Tap <b>+ Add Expense</b> — just a name and an amount.</div>
        </div>
      )}
    </>
  );
}

function PlanHero({ plan, go }: { plan: NonNullable<ReturnType<typeof currentPaycheck>>; go: (t: Tab) => void }) {
  const { data } = useStore();
  const v = paycheckView(data, plan.paycheck);
  return (
    <section className="card" aria-label="Paycheck budget">
      <span className="hero-label">This pay period · {formatDay(plan.paycheck.periodStart)} – {formatDay(plan.paycheck.periodEnd)}</span>
      <div className="hero-value num">{money(v.totals.remaining)}</div>
      <div className="muted">{v.totals.remaining >= 0 ? 'left in your paycheck budget' : 'over your paycheck budget'}</div>
      <div className="mini-bucket">
        {BUCKETS.map((b) => (
          <button key={b} style={bucketStyle(b)} onClick={() => go('budget')} aria-label={`${BUCKET_LABELS[b]} ${money(v.buckets[b].remaining)} left`}>
            <div className="lbl"><span className="bucket-dot" />{BUCKET_LABELS[b]}</div>
            <div className="val" style={{ color: v.buckets[b].remaining < 0 ? 'var(--over)' : undefined }}>{money(v.buckets[b].remaining)}</div>
          </button>
        ))}
      </div>
      <div className="small faint" style={{ marginTop: 8 }}>Budget left, not your bank balance.</div>
      {plan.stale && (
        <div className="notice near" style={{ marginTop: 12 }}>
          <span>📅</span>
          <span>This pay period has ended. <button className="link" onClick={() => go('budget')}>Add your next paycheck</button> to start a fresh budget.</span>
        </div>
      )}
    </section>
  );
}

function SyncBadge({ state, onClick }: { state: string; onClick: () => void }) {
  const label =
    state === 'saved' ? 'Saved' : state === 'saving' ? 'Saving…' : state === 'connecting' ? 'Connecting…' : state === 'error' ? 'Not saved' : 'This browser only';
  const tone = state === 'saved' || state === 'saving' ? 'ok' : state === 'connecting' ? '' : 'near';
  return (
    <button className={`chip-status ${tone}`} style={{ border: 0, minHeight: 32 }} onClick={onClick} aria-label={`Storage: ${label}`}>
      {state === 'saved' ? '✓ ' : ''}{label}
    </button>
  );
}
