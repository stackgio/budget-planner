import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import type { Bucket } from '../../lib/types';
import { BUCKET_LABELS } from '../../lib/types';
import { formatCents } from '../../lib/money';
import { formatDay, formatMonth, monthKey } from '../../lib/dates';
import {
  allocate,
  budgetNotices,
  currentPaycheck,
  debtRemaining,
  formatPercent,
  monthsWithActivity,
  monthView,
  paycheckView,
  sameSnapshot,
  sortedPaychecks,
  type BucketSummary,
  type BudgetView,
  type LineSummary,
} from '../../lib/budget';
import { applyPlanToPaycheck, setDebtMode } from '../../lib/budgetOps';
import { ConfirmDialog, Segmented } from '../ui';
import { bucketStyle, KV, money, PeriodNav, StackedBar } from './parts';
import { PaycheckSheet, PaymentSheet } from './sheets';
import { MoneyField } from './parts';
import { centsToInput, parseCents } from '../../lib/money';

export function Overview({ goPlan }: { goPlan: () => void }) {
  const { data, today, apply } = useStore();
  const [scope, setScope] = useState<'paycheck' | 'month'>('paycheck');
  const [payIndex, setPayIndex] = useState<number | null>(null);
  const [monthIndex, setMonthIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState<{ paycheckId: string; lineId: string } | null>(null);
  const [confirmUpdate, setConfirmUpdate] = useState(false);

  const paychecks = useMemo(() => sortedPaychecks(data), [data]);
  const cur = currentPaycheck(data, today);
  const defaultPay = Math.max(0, cur ? paychecks.findIndex((p) => p.id === cur.paycheck.id) : 0);
  const pIndex = Math.min(payIndex ?? defaultPay, Math.max(0, paychecks.length - 1));
  const months = useMemo(() => monthsWithActivity(data, today).map((k) => ({ key: k, label: formatMonth(k) })), [data, today]);
  const defaultMonth = Math.max(0, months.findIndex((m) => m.key === monthKey(today)));
  const mIndex = Math.min(monthIndex ?? defaultMonth, months.length - 1);

  const selected = paychecks[pIndex] ?? null;
  const view: BudgetView | null = useMemo(() => {
    if (scope === 'month') return monthView(data, months[mIndex]?.key ?? monthKey(today));
    return selected ? paycheckView(data, selected) : null;
  }, [scope, data, selected, months, mIndex, today]);
  const notices = useMemo(() => (scope === 'paycheck' && selected && cur?.paycheck.id === selected.id ? budgetNotices(data, today) : []), [scope, selected, cur, data, today]);
  const planChanged = scope === 'paycheck' && selected && selected.periodEnd >= today && !sameSnapshot(selected.plan, data.budget);
  const dm = data.budget.debtPayoff;

  if (!paychecks.length) {
    const t = allocate(data.budget.baselineCents, data.budget.percents);
    return (
      <>
        <section className="card stack">
          <h2 className="card-title" style={{ margin: 0 }}>Start with a paycheck</h2>
          <p className="muted" style={{ margin: 0, lineHeight: 1.5 }}>Add a paycheck and it's split into your four buckets automatically. Here's how your usual {formatCents(data.budget.baselineCents)} would look:</p>
          <div className="mini-bucket">
            {(['needs', 'investing', 'goals', 'fun'] as Bucket[]).map((b) => (
              <div key={b} style={bucketStyle(b)}><div className="lbl"><span className="bucket-dot" />{BUCKET_LABELS[b]}</div><div className="val">{formatCents(t[b])}</div></div>
            ))}
          </div>
          <button className="btn primary block" onClick={() => setAdding(true)}>Add paycheck</button>
          <button className="link" onClick={goPlan}>Review your plan first</button>
        </section>
        {adding && <PaycheckSheet paycheck={null} onClose={() => setAdding(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="stack no-print">
        <Segmented
          label="Budget mode"
          value={dm.enabled ? 'debt' : 'normal'}
          onChange={(m) => {
            const enabled = m === 'debt';
            if (enabled === dm.enabled) return;
            apply((d) => setDebtMode(d, { enabled }, today), {
              toast: enabled ? 'Debt Payoff Mode on for this and upcoming paychecks' : 'Back to your normal budget',
              undo: (d) => setDebtMode(d, { enabled: !enabled }, today),
            });
          }}
          options={[{ value: 'normal', label: 'Normal Budget' }, { value: 'debt', label: 'Debt Payoff Mode' }]}
        />
        {dm.enabled && <DebtModeSettings />}
        <div className="stack" style={{ gap: 8 }}>
          <Segmented label="View" value={scope} onChange={setScope} options={[{ value: 'paycheck', label: 'This paycheck' }, { value: 'month', label: 'This month' }]} />
          {scope === 'paycheck' ? (
            <PeriodNav label="Choose paycheck" index={pIndex} onIndex={setPayIndex} items={paychecks.map((p) => ({ key: p.id, label: `${formatDay(p.periodStart)} – ${formatDay(p.periodEnd)}${cur?.paycheck.id === p.id && !cur.stale ? ' · now' : ''}` }))} />
          ) : (
            <PeriodNav label="Choose month" index={mIndex} onIndex={setMonthIndex} items={months} />
          )}
        </div>
      </div>

      {planChanged && (
        <div className="notice info no-print" style={{ marginTop: 12 }}>
          <span>✏️</span>
          <span>Your plan changed since this paycheck's budget was made. <button className="link" onClick={() => setConfirmUpdate(true)}>Update this budget</button></span>
        </div>
      )}
      {cur?.stale && scope === 'paycheck' && pIndex === defaultPay && (
        <div className="notice near no-print" style={{ marginTop: 12 }}>
          <span>📅</span>
          <span>This pay period ended {formatDay(cur.paycheck.periodEnd)}. <button className="link" onClick={() => setAdding(true)}>Add your next paycheck</button> to start its budget.</span>
        </div>
      )}

      {view && <Summary view={view} />}

      {notices.length > 0 && (
        <div style={{ marginTop: 12 }} aria-label="Budget notices">
          {notices.map((n) => (
            <div key={n.id} className={`notice ${n.level}`}><span>{n.level === 'over' ? '▲' : n.level === 'near' ? '●' : n.level === 'good' ? '✓' : 'ℹ️'}</span><span>{n.text}</span></div>
          ))}
        </div>
      )}

      {view && (
        <>
          <NeedsCard s={view.buckets.needs} view={view} onPay={setPaying} />
          <InvestingCard s={view.buckets.investing} view={view} onPay={setPaying} />
          <GoalsCard s={view.buckets.goals} view={view} onPay={setPaying} />
          <FunCard s={view.buckets.fun} view={view} />
        </>
      )}

      <button className="btn block no-print" style={{ marginTop: 14 }} onClick={() => setAdding(true)}>+ Add paycheck</button>

      {adding && <PaycheckSheet paycheck={null} onClose={() => setAdding(false)} />}
      {paying && <PaymentSheet paycheckId={paying.paycheckId} lineId={paying.lineId} onClose={() => setPaying(null)} />}
      {confirmUpdate && selected && (
        <ConfirmDialog
          title="Update this paycheck's budget?"
          message={`${formatDay(selected.periodStart)} – ${formatDay(selected.periodEnd)} will switch to your current percentages and lines. Recorded payments and expenses are not changed.`}
          confirmLabel="Update"
          onCancel={() => setConfirmUpdate(false)}
          onConfirm={() => {
            const before = selected;
            apply((d) => applyPlanToPaycheck(d, before.id), { toast: 'Budget updated to your current plan', undo: (d) => ({ ...d, paychecks: d.paychecks.map((p) => (p.id === before.id ? before : p)) }) });
            setConfirmUpdate(false);
          }}
        />
      )}
    </>
  );
}

function DebtModeSettings() {
  const { data, today, apply } = useStore();
  const dm = data.budget.debtPayoff;
  const [custom, setCustom] = useState(dm.redirectCents === null ? '' : centsToInput(dm.redirectCents));
  const debts = data.debts.filter((d) => !d.archived);
  const target = debts.find((d) => d.id === dm.debtId);
  return (
    <div className="card stack" style={{ borderColor: 'color-mix(in srgb, var(--b-goals) 45%, var(--border))' }}>
      <div className="small muted" style={{ lineHeight: 1.5 }}>
        Your 55/20/15/10 targets stay as your long-term plan. Planned <b>investing</b> is shown as redirected to <b>debt payoff</b> — no investing is recorded unless you actually make a contribution. Ended pay periods keep the mode they had.
      </div>
      <Segmented
        label="Redirect amount"
        value={dm.redirectCents === null ? 'all' : 'custom'}
        onChange={(v) => apply((d) => setDebtMode(d, { redirectCents: v === 'all' ? null : parseCents(custom) ?? 0 }, today))}
        options={[{ value: 'all', label: 'All investing' }, { value: 'custom', label: 'Custom amount' }]}
      />
      {dm.redirectCents !== null && (
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div className="grow"><MoneyField label="Redirect per paycheck" value={custom} onChange={setCustom} /></div>
          <button className="btn" onClick={() => { const c = parseCents(custom); if (c !== null) apply((d) => setDebtMode(d, { redirectCents: c }, today), { toast: 'Redirect amount saved' }); }}>Save</button>
        </div>
      )}
      {debts.length > 0 ? (
        <label className="field">
          <span>Paying down</span>
          <select className="input" value={dm.debtId ?? ''} onChange={(e) => apply((d) => setDebtMode(d, { debtId: e.target.value || null }, today))}>
            <option value="">Any debt</option>
            {debts.map((d) => <option key={d.id} value={d.id}>{d.name} · {formatCents(debtRemaining(data, d))} left</option>)}
          </select>
        </label>
      ) : (
        <div className="small faint">Add your debts on the Plan tab to track the remaining balance.</div>
      )}
      {target && <DebtProgress debtId={target.id} />}
    </div>
  );
}

export function DebtProgress({ debtId }: { debtId: string }) {
  const { data, today } = useStore();
  const d = data.debts.find((x) => x.id === debtId);
  if (!d) return null;
  const left = debtRemaining(data, d);
  const paid = d.balanceCents - left;
  const pct = d.balanceCents > 0 ? Math.round((paid / d.balanceCents) * 100) : 100;
  const days = d.payoffBy ? Math.max(0, Math.round((Date.parse(d.payoffBy) - Date.parse(today)) / 86_400_000)) : null;
  return (
    <div>
      <div className="row between small"><span className="muted">{d.name}{d.interestFree ? ' · 0% interest' : ''}</span><span className="num">{formatCents(left)} left</span></div>
      <StackedBar bucket="goals" budget={d.balanceCents} label={`${d.name} paid`} segments={[{ value: paid, kind: 'solid', label: 'Paid' }]} />
      <div className="small faint num">{pct}% paid{d.payoffBy ? ` · goal ${formatDay(d.payoffBy, { month: 'short', day: 'numeric', year: 'numeric' })}${days !== null && left > 0 ? ` (${days} days)` : ''}` : ''}</div>
    </div>
  );
}

function Summary({ view }: { view: BudgetView }) {
  const t = view.totals;
  return (
    <section className="card" style={{ marginTop: 14 }} aria-label="Budget summary">
      <div className="row between">
        <span className="hero-label">{view.kind === 'month' ? view.label : `Pay period · ${view.label}`}</span>
        {view.debtMode && <span className="pill debt">Debt Payoff Mode</span>}
      </div>
      <div className="hero-value num">{money(t.remaining)}</div>
      <div className="muted">{t.remaining >= 0 ? 'budget remaining' : 'over budget'}</div>
      <div style={{ marginTop: 10 }}>
        <KV k={`Total income${view.paychecks.length > 1 ? ` · ${view.paychecks.length} paychecks` : ''}`} v={formatCents(t.income)} />
        {t.overtime > 0 && <KV sub k="incl. overtime (already in net pay)" v={formatCents(t.overtime)} />}
        <KV k="Total allocated to plan lines" v={formatCents(t.allocated)} />
        <KV k="Total spent" v={formatCents(t.spent)} />
        <KV k="Saved, invested & debt paid" v={formatCents(t.contributed + t.debtPaid)} />
        <KV k="Total reserved (unpaid bills)" v={formatCents(t.reserved)} />
        <KV total k="Remaining budget" v={money(t.remaining)} tone={t.remaining < 0 ? 'over' : undefined} />
      </div>
      <div className="small faint" style={{ marginTop: 8 }}>
        This is what's left in your plan, not your bank balance. Transfers between your accounts and credit card payments don't change it.
        {view.kind === 'month' && ' Month view counts paychecks paid this month and entries dated this month.'}
      </div>
    </section>
  );
}

function CardHead({ s, view, big, caption }: { s: BucketSummary; view: BudgetView; big: number; caption: string }) {
  return (
    <>
      <div className="bucket-head">
        <span className="bucket-dot" />
        <span className="bucket-name">{BUCKET_LABELS[s.bucket]}</span>
        <span className="bucket-pct">{s.percent !== null ? formatPercent(s.percent) : view.paychecks.length ? 'mixed %' : '—'}</span>
      </div>
      <div className="bucket-big num" style={{ color: big < 0 ? 'var(--over)' : undefined }}>{money(big)}</div>
      <div className="small muted">{caption}</div>
    </>
  );
}

function LineRow({ ls, onPay }: { ls: LineSummary; onPay?: (x: { paycheckId: string; lineId: string }) => void }) {
  const l = ls.line;
  const payable = !!ls.paycheckId && !!onPay && (l.type === 'bill' || l.type === 'contribution');
  const status =
    l.type === 'bill'
      ? ls.settled || (ls.actual >= ls.planned && ls.actual > 0)
        ? <span className="chip-status ok">✓ Paid</span>
        : ls.reserved > 0
          ? <span className="chip-status near num">Reserved {formatCents(ls.reserved)}</span>
          : null
      : l.type === 'contribution'
        ? ls.actual > 0 ? <span className="chip-status ok num">{formatCents(ls.actual)} in</span> : null
        : ls.planned > 0 && ls.actual > ls.planned ? <span className="chip-status over">▲ Over</span> : null;
  const meta = [
    `planned ${formatCents(ls.planned)}`,
    l.type === 'spending' ? `spent ${formatCents(ls.actual)}` : l.type === 'bill' && ls.actual ? `paid ${formatCents(ls.actual)}` : null,
    ls.funded ? `${formatCents(ls.funded)} set aside` : null,
  ].filter(Boolean).join(' · ');
  const body = (
    <>
      <span className="grow">
        <div className="name ellipsis">{l.name}</div>
        <div className="meta num">{meta}</div>
      </span>
      {status}
      {payable && <span className="link small" aria-hidden>Record</span>}
    </>
  );
  return payable ? (
    <button className="line-row" onClick={() => onPay!({ paycheckId: ls.paycheckId!, lineId: l.id })} aria-label={`Record payment for ${l.name}`}>{body}</button>
  ) : (
    <div className="line-row">{body}</div>
  );
}

function Lines({ s, onPay, filter, title = 'Plan lines' }: { s: BucketSummary; onPay?: (x: { paycheckId: string; lineId: string }) => void; filter?: (l: LineSummary) => boolean; title?: string }) {
  const lines = s.lines.filter((l) => !filter || filter(l));
  if (!lines.length && !s.unplannedSpent) return null;
  return (
    <details className="more" style={{ marginTop: 6 }}>
      <summary>{title} ({lines.length})</summary>
      <div>
        {lines.map((ls) => <LineRow key={ls.line.id} ls={ls} onPay={onPay} />)}
        {s.unplannedSpent !== 0 && (
          <div className="line-row"><span className="grow"><div className="name">Not on a plan line</div><div className="meta">other {BUCKET_LABELS[s.bucket]} spending</div></span><span className="num" style={{ fontWeight: 700 }}>{money(s.unplannedSpent)}</span></div>
        )}
      </div>
    </details>
  );
}

function PlannedVsTarget({ s }: { s: BucketSummary }) {
  if (!s.target || s.planned <= s.target) return null;
  return <div className="notice info" style={{ marginTop: 8 }}><span>ℹ️</span><span>Planned lines ({formatCents(s.planned)}) are {formatCents(s.planned - s.target)} above this bucket's target.</span></div>;
}

type PayFn = (x: { paycheckId: string; lineId: string }) => void;

function NeedsCard({ s, view, onPay }: { s: BucketSummary; view: BudgetView; onPay: PayFn }) {
  return (
    <section className="card bucket-card" style={bucketStyle('needs')}>
      <CardHead s={s} view={view} big={s.remaining} caption={s.remaining >= 0 ? 'remaining, after spending and unpaid bills' : 'over, counting unpaid bills'} />
      <StackedBar bucket="needs" budget={s.target} label="Needs used" segments={[{ value: s.spent, kind: 'solid', label: 'Spent' }, { value: s.reserved, kind: 'hatch', label: 'Reserved' }]} />
      <KV k="Budgeted" v={formatCents(s.target)} />
      <KV k="Actual spending" v={money(s.spent)} />
      <KV k="Reserved for unpaid bills" v={formatCents(s.reserved)} />
      <KV total k="Remaining uncommitted" v={money(s.remaining)} tone={s.remaining < 0 ? 'over' : undefined} />
      <PlannedVsTarget s={s} />
      <Lines s={s} onPay={onPay} title="Bills & lines" />
    </section>
  );
}

function InvestingCard({ s, view, onPay }: { s: BucketSummary; view: BudgetView; onPay: PayFn }) {
  const plannedLines = s.planned;
  const planned = Math.max(0, plannedLines - s.redirectOut);
  const remainingTarget = s.target - s.redirectOut - s.contributed - s.spent;
  return (
    <section className="card bucket-card" style={bucketStyle('investing')}>
      <CardHead s={s} view={view} big={s.contributed} caption="actually invested" />
      <StackedBar bucket="investing" budget={Math.max(0, s.target - s.redirectOut)} label="Investing" segments={[{ value: s.contributed, kind: 'solid', label: 'Invested' }]} />
      {view.debtMode && <KV k="Long-term target" v={formatCents(s.target)} />}
      {s.redirectOut > 0 && <KV k="Redirected to debt payoff" v={`−${formatCents(s.redirectOut)}`} tone="muted" />}
      <KV k="Planned contributions" v={formatCents(planned)} />
      <KV k="Actual contributions" v={formatCents(s.contributed)} />
      {s.spent !== 0 && <KV k="Spending classed as investing" v={money(s.spent)} />}
      <KV total k="Remaining target" v={money(Math.max(0, remainingTarget))} />
      {remainingTarget < 0 && <div className="small" style={{ color: 'var(--green)' }}>{formatCents(-remainingTarget)} ahead of target</div>}
      {view.debtMode && <div className="small faint" style={{ marginTop: 4 }}>Only contributions you actually record are counted here.</div>}
      <Lines s={s} onPay={onPay} />
    </section>
  );
}

const GOAL_ROWS = [['debt', 'Debt payoff'], ['emergency', 'Emergency savings'], ['travel', 'Travel savings'], ['birthday', 'Birthday savings'], ['other', 'Other goals']] as const;

function GoalsCard({ s, view, onPay }: { s: BucketSummary; view: BudgetView; onPay: PayFn }) {
  const { data } = useStore();
  const budget = s.target + s.redirectIn;
  const byGoal = (g: string) => s.lines.filter((l) => (l.line.goal ?? (l.line.type === 'contribution' ? 'other' : null)) === g);
  const debtLines = byGoal('debt');
  const linkedDebt = debtLines.reduce((x, l) => x + l.actual, 0);
  const otherDebt = s.debtPaid - linkedDebt;
  const target = data.debts.find((d) => d.id === data.budget.debtPayoff.debtId);
  return (
    <section className="card bucket-card" style={bucketStyle('goals')}>
      <CardHead s={s} view={view} big={s.contributed + s.debtPaid} caption="actually contributed this period" />
      <StackedBar bucket="goals" budget={budget} label="Goals" segments={[{ value: s.contributed + s.debtPaid, kind: 'solid', label: 'Contributed' }, { value: s.reserved, kind: 'hatch', label: 'Reserved' }]} />
      <KV k="Budgeted" v={formatCents(s.target)} />
      {s.redirectIn > 0 && <KV sub k="+ redirected from Investing" v={formatCents(s.redirectIn)} />}
      {GOAL_ROWS.map(([g, label]) => {
        const rows = byGoal(g);
        const planned = rows.reduce((x, l) => x + l.planned, 0) + (g === 'debt' ? s.redirectIn : 0);
        const actual = rows.reduce((x, l) => x + l.actual, 0) + (g === 'debt' ? otherDebt : 0);
        if (!planned && !actual && g !== 'debt') return null;
        return <KV key={g} sub k={label} v={<span>{formatCents(actual)} <span className="faint" style={{ fontWeight: 500 }}>/ {formatCents(planned)}</span></span>} />;
      })}
      <KV total k="Actual contributions" v={formatCents(s.contributed + s.debtPaid)} />
      <KV k="Left to contribute" v={money(Math.max(0, s.remaining))} />
      {s.spent !== 0 && <KV k="Spending classed as goals" v={money(s.spent)} />}
      <PlannedVsTarget s={s} />
      {target && <div style={{ marginTop: 8 }}><DebtProgress debtId={target.id} /></div>}
      <Lines s={s} onPay={onPay} title="Goals & debt lines" />
    </section>
  );
}

function FunCard({ s, view }: { s: BucketSummary; view: BudgetView }) {
  const pct = s.target > 0 ? Math.round((s.spent / s.target) * 100) : 0;
  return (
    <section className="card bucket-card" style={bucketStyle('fun')}>
      <CardHead s={s} view={view} big={s.remaining} caption={s.remaining >= 0 ? 'left to spend, guilt-free' : 'over the Guilt-Free budget'} />
      <StackedBar bucket="fun" budget={s.target} label="Guilt-Free used" segments={[{ value: s.spent, kind: 'solid', label: 'Spent' }]} />
      <KV k="Spending allowance" v={formatCents(s.target)} />
      {s.lines.length > 0 && <KV sub k="Planned on lines" v={formatCents(s.planned)} />}
      <KV k={`Actual discretionary spending${s.target ? ` · ${pct}%` : ''}`} v={money(s.spent)} />
      <KV total k="Remaining allowance" v={money(s.remaining)} tone={s.remaining < 0 ? 'over' : undefined} />
      <Lines s={s} />
    </section>
  );
}
