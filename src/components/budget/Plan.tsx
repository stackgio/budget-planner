import { useState } from 'react';
import { useStore } from '../../store';
import type { Bucket, BudgetMode, Category, Debt, PlanLine } from '../../lib/types';
import { BUCKET_LABELS, BUCKETS } from '../../lib/types';
import { centsToInput, formatCents, parseCents } from '../../lib/money';
import { formatDay } from '../../lib/dates';
import { allocate, debtRemaining, formatPercent, parsePercent, plannedByBucket } from '../../lib/budget';
import { updatePlan } from '../../lib/budgetOps';
import { categoryBudgets, spentByCategory, categoryBudgetRange } from '../../lib/ledger';
import { updateCategory, updateSettings, ValidationError } from '../../lib/ops';
import { Progress, Segmented, StatusChip } from '../ui';
import { bucketStyle, MoneyField } from './parts';
import { CategorySheet, DebtSheet, LineSheet } from './sheets';

const TYPE_LABEL = { bill: 'Bill', spending: 'Spending', contribution: 'Contribution' } as const;

export function Plan() {
  const { data } = useStore();
  const [editingLine, setEditingLine] = useState<{ line: PlanLine | null; bucket: Bucket } | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | 'new' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);
  const plan = data.budget;
  const targets = allocate(plan.baselineCents, plan.percents);
  const planned = plannedByBucket(plan.lines);

  return (
    <>
      <SplitEditor key={JSON.stringify([plan.baselineCents, plan.percents])} />

      {BUCKETS.map((b) => {
        const lines = plan.lines.filter((l) => l.bucket === b);
        const over = planned[b] > targets[b];
        return (
          <section key={b} className="card bucket-card" style={bucketStyle(b)}>
            <div className="bucket-head">
              <span className="bucket-dot" />
              <span className="bucket-name">{BUCKET_LABELS[b]}</span>
              <span className="bucket-pct">{formatPercent(plan.percents[b])}</span>
              <span className="grow" />
              <span className="small num muted">{formatCents(planned[b])} / {formatCents(targets[b])}</span>
            </div>
            {over ? (
              <div className="notice near" style={{ marginTop: 10 }}><span>●</span><span>Planned {BUCKET_LABELS[b]} ({formatCents(planned[b])}) exceed your {formatPercent(plan.percents[b])} target by {formatCents(planned[b] - targets[b])}.</span></div>
            ) : (
              <div className="small faint" style={{ marginTop: 6 }}>{formatCents(targets[b] - planned[b])} of the target not assigned to a line{b === 'fun' || b === 'needs' ? ' — still yours to spend in this bucket' : ''}.</div>
            )}
            <div style={{ marginTop: 6 }}>
              {lines.map((l) => {
                const cat = data.categories.find((c) => c.id === l.categoryId);
                return (
                  <button key={l.id} className="line-row" onClick={() => setEditingLine({ line: l, bucket: b })}>
                    <span className="grow">
                      <div className="name ellipsis">{l.name}</div>
                      <div className="meta">{TYPE_LABEL[l.type]}{l.type === 'spending' && cat ? ` · all ${cat.name}` : ''}{l.amountCents === 0 ? ' · set an amount' : ''}</div>
                    </span>
                    <span className="num" style={{ fontWeight: 700, color: l.amountCents === 0 ? 'var(--text-3)' : undefined }}>{formatCents(l.amountCents)}</span>
                  </button>
                );
              })}
            </div>
            <button className="link" style={{ marginTop: 4 }} onClick={() => setEditingLine({ line: null, bucket: b })}>+ Add {BUCKET_LABELS[b]} line</button>
          </section>
        );
      })}

      <h2 className="section-title">Debts<button className="link" onClick={() => setEditingDebt('new')}>+ Add debt</button></h2>
      {data.debts.filter((d) => !d.archived).length === 0 ? (
        <div className="card muted small" style={{ lineHeight: 1.5 }}>Add interest-free balances you're paying off. Debt payments lower the balance and count toward Goals — never as spending.</div>
      ) : (
        <div className="list">
          {data.debts.filter((d) => !d.archived).map((d) => {
            const left = debtRemaining(data, d);
            return (
              <button key={d.id} className="txn" onClick={() => setEditingDebt(d)}>
                <span className="txn-icon" aria-hidden>📉</span>
                <span className="grow">
                  <div className="txn-title ellipsis">{d.name}</div>
                  <div className="txn-sub num">{formatCents(d.balanceCents - left)} paid of {formatCents(d.balanceCents)}{d.payoffBy ? ` · by ${formatDay(d.payoffBy, { month: 'short', year: 'numeric' })}` : ''}{d.interestFree ? ' · 0%' : ''}</div>
                </span>
                <span className="txn-amt num">{formatCents(left)}</span>
              </button>
            );
          })}
        </div>
      )}

      <CategoriesCard onEdit={setEditingCategory} />
      <HomeBudgetCard />

      {editingLine && <LineSheet line={editingLine.line} bucket={editingLine.bucket} onClose={() => setEditingLine(null)} />}
      {editingDebt && <DebtSheet debt={editingDebt === 'new' ? null : editingDebt} onClose={() => setEditingDebt(null)} />}
      {editingCategory && <CategorySheet category={editingCategory === 'new' ? null : editingCategory} onClose={() => setEditingCategory(null)} />}
    </>
  );
}

function SplitEditor() {
  const { data, today, apply } = useStore();
  const plan = data.budget;
  const [baseline, setBaseline] = useState(centsToInput(plan.baselineCents));
  const [pct, setPct] = useState<Record<Bucket, string>>(() => Object.fromEntries(BUCKETS.map((b) => [b, String(plan.percents[b] / 100)])) as Record<Bucket, string>);
  const parsed = BUCKETS.map((b) => parsePercent(pct[b]));
  const valid = parsed.every((v) => v !== null);
  const total = parsed.reduce<number>((s, v) => s + (v ?? 0), 0);
  const base = parseCents(baseline);
  const ok = valid && total === 10000 && !!base && base > 0;
  const percents = Object.fromEntries(BUCKETS.map((b, i) => [b, parsed[i] ?? 0])) as Record<Bucket, number>;
  const preview = ok ? allocate(base!, percents) : null;
  const dirty = base !== plan.baselineCents || BUCKETS.some((b, i) => parsed[i] !== plan.percents[b]);

  function save() {
    if (!ok) return apply(() => { throw new ValidationError(total !== 10000 ? `Your percentages add up to ${formatPercent(total)}. They need to total exactly 100%.` : 'Check your paycheck amount and percentages.'); });
    const before = data.budget;
    apply((d) => updatePlan(d, { baselineCents: base!, percents }, today), {
      toast: 'Plan saved — upcoming paychecks use the new split',
      undo: (d) => updatePlan(d, { baselineCents: before.baselineCents, percents: before.percents }, today),
    });
  }

  return (
    <section className="card stack">
      <h2 className="card-title" style={{ margin: 0 }}>Your split</h2>
      <MoneyField label="Usual take-home paycheck (every 2 weeks)" value={baseline} onChange={setBaseline} />
      <div className="pct-grid">
        {BUCKETS.map((b) => (
          <label key={b} className="field" style={bucketStyle(b)}>
            <span className="row" style={{ gap: 5, fontSize: 12 }}><span className="bucket-dot" />{BUCKET_LABELS[b]}</span>
            <input className="input num" inputMode="decimal" aria-label={`${BUCKET_LABELS[b]} percent`} value={pct[b]} onChange={(e) => setPct({ ...pct, [b]: e.target.value.replace(/[^\d.]/g, '') })} />
            <span className="small faint num" style={{ textAlign: 'center', fontWeight: 600 }}>{preview ? formatCents(preview[b]) : '—'}</span>
          </label>
        ))}
      </div>
      <div className={`notice ${total === 10000 && valid ? 'good' : 'over'}`} role="status">
        <span>{total === 10000 && valid ? '✓' : '▲'}</span>
        <span>{!valid ? 'Use numbers like 55 or 12.5.' : total === 10000 ? 'Adds up to 100%.' : `Adds up to ${formatPercent(total)} — needs to be exactly 100% (${total < 10000 ? `${formatPercent(10000 - total)} to assign` : `${formatPercent(total - 10000)} too much`}).`}</span>
      </div>
      <button className="btn primary block" disabled={!ok || !dirty} onClick={save}>Save split</button>
      <div className="small faint">These are targets, not required spending. New and upcoming paychecks use them; past pay periods keep the split they had, and your current paycheck updates only if you choose.</div>
    </section>
  );
}

function CategoriesCard({ onEdit }: { onEdit: (c: Category | 'new') => void }) {
  const { data, today, apply } = useStore();
  const rows = categoryBudgets(data, today);
  const spent = spentByCategory(data, categoryBudgetRange(data, today));
  return (
    <>
      <h2 className="section-title">Categories<button className="link" onClick={() => onEdit('new')}>+ New</button></h2>
      <div className="card" style={{ paddingTop: 10, paddingBottom: 10 }}>
        <div className="row between small" style={{ paddingBottom: 6 }}>
          <span className="muted">Limits reset</span>
          <select
            className="input"
            style={{ width: 'auto', minHeight: 38, padding: '6px 34px 6px 12px', backgroundPosition: 'calc(100% - 18px) 16px, calc(100% - 13px) 16px' }}
            value={data.settings.categoryBudgetPeriod}
            onChange={(e) => apply((d) => updateSettings(d, { categoryBudgetPeriod: e.target.value as 'month' | 'budget' }))}
          >
            <option value="month">Every month</option>
            <option value="budget">Each budget period</option>
          </select>
        </div>
        {data.categories.filter((c) => !c.archived).map((c) => {
          const row = rows.find((r) => r.category.id === c.id);
          return (
            <button key={c.id} className="cat-row" style={{ width: '100%', background: 'none', border: 0, textAlign: 'left', borderTop: '1px solid var(--border)', color: 'inherit' }} onClick={() => onEdit(c)}>
              <span className="txn-icon" aria-hidden>{c.emoji}</span>
              <span className="grow">
                <span className="row between">
                  <span style={{ fontWeight: 650 }}>{c.name}</span>
                  {row ? <StatusChip level={row.level} percent={row.percent} /> : <span className="small faint num">{formatCents(spent.get(c.id) ?? 0)}</span>}
                </span>
                <span className="small muted row" style={{ gap: 6, marginTop: 2 }} >
                  <span className="bucket-dot" style={bucketStyle(c.bucket)} />{BUCKET_LABELS[c.bucket]}
                  {row && <span className="num"> · {formatCents(row.spent)} of {formatCents(row.budget)}</span>}
                </span>
                {row && <Progress thin percent={row.percent} level={row.level} label={`${c.name} budget used`} />}
              </span>
            </button>
          );
        })}
      </div>
      {data.categories.some((c) => c.archived) && (
        <details className="more" style={{ marginTop: 10 }}>
          <summary>Archived categories</summary>
          <div className="list">
            {data.categories.filter((c) => c.archived).map((c) => (
              <div key={c.id} className="txn">
                <span className="txn-icon">{c.emoji}</span>
                <span className="grow txn-title">{c.name}</span>
                <button className="btn small" onClick={() => apply((d) => updateCategory(d, c.id, { archived: false }), { toast: `${c.name} restored` })}>Unarchive</button>
              </div>
            ))}
          </div>
        </details>
      )}
    </>
  );
}

const MODE_HELP: Record<BudgetMode, string> = {
  paycheck: 'Home shows your current paycheck budget from the 55/20/15/10 plan.',
  biweekly: 'Home shows a fixed spending budget that resets every 2 weeks.',
  monthly: 'Home shows a fixed spending budget that resets on the 1st of each month.',
};

function HomeBudgetCard() {
  const { data, apply } = useStore();
  const s = data.settings;
  const [customAmount, setCustomAmount] = useState(s.customBudgetCents ? centsToInput(s.customBudgetCents) : '');
  function saveCustom() {
    const cents = parseCents(customAmount);
    if (cents === null) return apply(() => { throw new ValidationError('Enter a budget amount, like 400.'); });
    apply((d) => updateSettings(d, { customBudgetCents: cents }), { toast: 'Budget saved' });
  }
  return (
    <section className="card stack" style={{ marginTop: 14 }}>
      <h2 className="card-title" style={{ margin: 0 }}>Home screen budget</h2>
      <Segmented label="Budget type" value={s.budgetMode} green onChange={(m) => apply((d) => updateSettings(d, { budgetMode: m }))}
        options={[{ value: 'paycheck', label: 'Paycheck' }, { value: 'biweekly', label: 'Every 2 wks' }, { value: 'monthly', label: 'Monthly' }]} />
      <div className="small muted">{MODE_HELP[s.budgetMode]}</div>
      {s.budgetMode !== 'paycheck' && (
        <>
          <div className="grid-2">
            <MoneyField label={`${s.budgetMode === 'monthly' ? 'Monthly' : '2-week'} budget`} value={customAmount} onChange={setCustomAmount} placeholder="400.00" />
            {s.budgetMode === 'biweekly' && (
              <label className="field">
                <span>A period start date</span>
                <input className="input" type="date" value={s.biweeklyAnchor} onChange={(e) => e.target.value && apply((d) => updateSettings(d, { biweeklyAnchor: e.target.value }))} />
              </label>
            )}
          </div>
          <button className="btn primary" onClick={saveCustom}>Save budget</button>
        </>
      )}
    </section>
  );
}
