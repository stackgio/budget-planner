import { useMemo, useState } from 'react';
import { useStore } from '../store';
import type { BudgetMode, Category, Paycheck } from '../lib/types';
import { centsToInput, formatCents, parseCents } from '../lib/money';
import { addDays, formatDay } from '../lib/dates';
import { budgetStatus, categoryBudgetRange, categoryBudgets, maxAllowance, spentByCategory, sumReserved } from '../lib/ledger';
import { addCategory, deletePaycheck, removeCategory, savePaycheck, updateCategory, updateSettings, ValidationError, validatePaycheck, type PaycheckDraft } from '../lib/ops';
import { ConfirmDialog, Progress, Segmented, Sheet, StatusChip } from '../components/ui';

const MODE_HELP: Record<BudgetMode, string> = {
  paycheck: 'Your spending budget is the allowance from your latest paycheck, after money reserved for bills, debt, savings and investing.',
  biweekly: 'A fixed spending budget that resets every 2 weeks.',
  monthly: 'A fixed spending budget that resets on the 1st of each month.',
};

export function Budget() {
  const { data, today, apply } = useStore();
  const s = data.settings;
  const [editingPaycheck, setEditingPaycheck] = useState<Paycheck | 'new' | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | 'new' | null>(null);
  const [customAmount, setCustomAmount] = useState(s.customBudgetCents ? centsToInput(s.customBudgetCents) : '');
  const status = budgetStatus(data, today);
  const paychecks = [...data.paychecks].sort((a, b) => b.date.localeCompare(a.date));
  const rows = categoryBudgets(data, today);
  const range = categoryBudgetRange(data, today);
  const spent = useMemo(() => spentByCategory(data, range), [data, range]);

  function saveCustom() {
    const cents = parseCents(customAmount);
    if (cents === null) return apply(() => { throw new ValidationError('Enter a budget amount, like 400.'); });
    apply((d) => updateSettings(d, { customBudgetCents: cents }), { toast: 'Budget saved' });
  }

  return (
    <>
      <header className="page-header">
        <h1>Budget</h1>
      </header>

      <section className="card stack">
        <h2 className="card-title" style={{ margin: 0 }}>Spending budget</h2>
        <Segmented
          label="Budget type"
          value={s.budgetMode}
          green
          onChange={(m) => apply((d) => updateSettings(d, { budgetMode: m }))}
          options={[
            { value: 'paycheck', label: 'Paycheck' },
            { value: 'biweekly', label: 'Every 2 wks' },
            { value: 'monthly', label: 'Monthly' },
          ]}
        />
        <div className="small muted">{MODE_HELP[s.budgetMode]}</div>

        {s.budgetMode !== 'paycheck' && (
          <>
            <div className="grid-2">
              <label className="field">
                <span>{s.budgetMode === 'monthly' ? 'Monthly' : '2-week'} budget</span>
                <div className="amount-wrap"><input className="input num" style={{ paddingLeft: 36 }} inputMode="decimal" value={customAmount} placeholder="400.00" onChange={(e) => setCustomAmount(e.target.value)} onBlur={saveCustom} /></div>
              </label>
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

        {status && (
          <div>
            <div className="row between small"><span className="muted">{formatDay(status.period.range.start)} – {formatDay(status.period.range.end)}</span><span className="num">{formatCents(status.spent)} of {formatCents(status.period.budgetCents)}</span></div>
            <Progress percent={status.percent} level={status.remaining < 0 || status.spent >= status.period.budgetCents ? 'over' : status.percent >= 80 ? 'near' : 'ok'} label="Budget used" />
            <div className="small muted num">{status.remaining >= 0 ? `${formatCents(status.remaining)} left` : `${formatCents(-status.remaining)} over`}</div>
          </div>
        )}
      </section>

      <h2 className="section-title">
        Paychecks
        <button className="link" onClick={() => setEditingPaycheck('new')}>+ Add paycheck</button>
      </h2>
      {paychecks.length === 0 ? (
        <div className="card muted">
          Add your paycheck to track your spending allowance between paydays. Money you reserve for bills, debt, savings and investing is kept out of your spending budget.
          <button className="btn primary block" style={{ marginTop: 12 }} onClick={() => setEditingPaycheck('new')}>Add paycheck</button>
        </div>
      ) : (
        <div className="list">
          {paychecks.slice(0, 12).map((p) => (
            <button key={p.id} className="txn" onClick={() => setEditingPaycheck(p)}>
              <span className="txn-icon" aria-hidden>💵</span>
              <span className="grow">
                <div className="txn-title">{formatDay(p.date, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="txn-sub num">Allowance {formatCents(p.allowanceCents)} · reserved {formatCents(sumReserved(p))} · next {formatDay(p.nextPayday)}</div>
              </span>
              <span className="txn-amt num">{formatCents(p.amountCents)}</span>
            </button>
          ))}
        </div>
      )}

      <h2 className="section-title">
        Categories & limits
        <button className="link" onClick={() => setEditingCategory('new')}>+ New</button>
      </h2>
      <div className="card" style={{ paddingTop: 10, paddingBottom: 10 }}>
        <div className="row between small" style={{ paddingBottom: 6 }}>
          <span className="muted">Limits reset</span>
          <select
            className="input"
            style={{ width: 'auto', minHeight: 38, padding: '6px 34px 6px 12px', backgroundPosition: 'calc(100% - 18px) 16px, calc(100% - 13px) 16px' }}
            value={s.categoryBudgetPeriod}
            onChange={(e) => apply((d) => updateSettings(d, { categoryBudgetPeriod: e.target.value as 'month' | 'budget' }))}
          >
            <option value="month">Every month</option>
            <option value="budget">Each budget period</option>
          </select>
        </div>
        {data.categories.filter((c) => !c.archived).map((c) => {
          const row = rows.find((r) => r.category.id === c.id);
          return (
            <button key={c.id} className="cat-row" style={{ width: '100%', background: 'none', border: 0, textAlign: 'left', borderTop: '1px solid var(--border)' }} onClick={() => setEditingCategory(c)}>
              <span className="txn-icon" aria-hidden>{c.emoji}</span>
              <span className="grow">
                <span className="row between">
                  <span style={{ fontWeight: 650 }}>{c.name}</span>
                  {row ? <StatusChip level={row.level} percent={row.percent} /> : <span className="small faint num">{formatCents(spent.get(c.id) ?? 0)}</span>}
                </span>
                {row && (
                  <>
                    <Progress thin percent={row.percent} level={row.level} label={`${c.name} budget used`} />
                    <span className="small muted num">{formatCents(row.spent)} spent · {row.remaining >= 0 ? `${formatCents(row.remaining)} left` : `${formatCents(-row.remaining)} over`} of {formatCents(row.budget)}</span>
                  </>
                )}
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

      {editingPaycheck && <PaycheckSheet paycheck={editingPaycheck === 'new' ? null : editingPaycheck} onClose={() => setEditingPaycheck(null)} />}
      {editingCategory && <CategorySheet category={editingCategory === 'new' ? null : editingCategory} onClose={() => setEditingCategory(null)} />}
    </>
  );
}

function PaycheckSheet({ paycheck, onClose }: { paycheck: Paycheck | null; onClose: () => void }) {
  const { data, today, apply } = useStore();
  const last = [...data.paychecks].sort((a, b) => b.date.localeCompare(a.date))[0];
  const seed = paycheck ?? (last ? { ...last, date: last.nextPayday <= today ? last.nextPayday : today, nextPayday: addDays(last.nextPayday <= today ? last.nextPayday : today, 14) } : null);
  const [date, setDate] = useState(seed?.date ?? today);
  const [nextPayday, setNextPayday] = useState(seed?.nextPayday ?? addDays(today, 14));
  const [amount, setAmount] = useState(seed ? centsToInput(seed.amountCents) : '');
  const [bills, setBills] = useState(seed ? centsToInput(seed.reserved.bills) : '');
  const [debt, setDebt] = useState(seed ? centsToInput(seed.reserved.debt) : '');
  const [savings, setSavings] = useState(seed ? centsToInput(seed.reserved.savings) : '');
  const [investing, setInvesting] = useState(seed ? centsToInput(seed.reserved.investing) : '');
  const [allowance, setAllowance] = useState(seed ? centsToInput(seed.allowanceCents) : '');
  const [allowanceTouched, setAllowanceTouched] = useState(!!seed);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const c = (v: string) => (v.trim() === '' ? 0 : parseCents(v));
  const draftReserved = { bills: c(bills) ?? 0, debt: c(debt) ?? 0, savings: c(savings) ?? 0, investing: c(investing) ?? 0 };
  const available = maxAllowance({ amountCents: c(amount) ?? 0, reserved: draftReserved } as Paycheck);
  const effectiveAllowance = allowanceTouched ? allowance : centsToInput(available);

  function save() {
    const values = [amount, bills, debt, savings, investing, effectiveAllowance].map(c);
    if (values.some((v) => v === null)) return setError('Check the amounts — use numbers like 1250.00.');
    const draft: PaycheckDraft = {
      date,
      nextPayday,
      amountCents: values[0]!,
      reserved: { bills: values[1]!, debt: values[2]!, savings: values[3]!, investing: values[4]! },
      allowanceCents: values[5]!,
      notes: '',
    };
    try {
      validatePaycheck(draft);
    } catch (e) {
      return setError((e as Error).message);
    }
    apply((d) => savePaycheck(d, draft, paycheck?.id), { toast: 'Paycheck saved' });
    onClose();
  }

  const money = (label: string, value: string, set: (v: string) => void) => (
    <label className="field">
      <span>{label}</span>
      <div className="amount-wrap"><input className="input num" style={{ paddingLeft: 36 }} inputMode="decimal" placeholder="0.00" value={value} onChange={(e) => set(e.target.value)} /></div>
    </label>
  );

  return (
    <Sheet title={paycheck ? 'Edit paycheck' : 'Add paycheck'} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="grid-2">
          <label className="field"><span>Paycheck date</span><input className="input" type="date" value={date} onChange={(e) => { if (!e.target.value) return; setDate(e.target.value); setNextPayday(addDays(e.target.value, 14)); }} /></label>
          <label className="field"><span>Next payday</span><input className="input" type="date" value={nextPayday} onChange={(e) => e.target.value && setNextPayday(e.target.value)} /></label>
        </div>
        {money('Paycheck amount (take-home)', amount, setAmount)}
        <div className="small muted" style={{ fontWeight: 600 }}>Reserved — not spending money</div>
        <div className="grid-2">
          {money('Bills', bills, setBills)}
          {money('Debt payments', debt, setDebt)}
          {money('Savings', savings, setSavings)}
          {money('Investing', investing, setInvesting)}
        </div>
        <div className="notice info"><span>🧮</span><span>After reserved money, <b className="num">{formatCents(available)}</b> is available. Your allowance can be that or less.</span></div>
        {money('Spending allowance', effectiveAllowance, (v) => { setAllowance(v); setAllowanceTouched(true); })}
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn primary block" type="submit">Save paycheck</button>
        {paycheck && <button className="btn danger block" type="button" onClick={() => setConfirmDelete(true)}>Delete paycheck</button>}
      </form>
      {confirmDelete && paycheck && (
        <ConfirmDialog title="Delete paycheck?" danger message="Your expenses are not affected." confirmLabel="Delete" onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { apply((d) => deletePaycheck(d, paycheck.id), { toast: 'Paycheck deleted', undo: (d) => ({ ...d, paychecks: [...d.paychecks, paycheck] }) }); onClose(); }} />
      )}
    </Sheet>
  );
}

const EMOJIS = ['🏷️', '🛒', '🍔', '☕', '⛽', '🚌', '🛍️', '🎬', '🔁', '💇', '🏠', '🧾', '💳', '📦', '🐶', '👶', '🎁', '💊', '📚', '✈️', '🏋️', '🎮', '🍺', '💻', '🚗', '🧸'];

function CategorySheet({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const { data, apply } = useStore();
  const [name, setName] = useState(category?.name ?? '');
  const [emoji, setEmoji] = useState(category?.emoji ?? '🏷️');
  const [budget, setBudget] = useState(category?.budgetCents ? centsToInput(category.budgetCents) : '');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const used = category ? data.transactions.some((t) => t.categoryId === category.id) : false;

  function save() {
    const cents = budget.trim() === '' ? null : parseCents(budget);
    if (budget.trim() !== '' && cents === null) return apply(() => { throw new ValidationError('Enter a limit like 100, or leave it empty.'); });
    const ok = category
      ? apply((d) => updateCategory(d, category.id, { name, emoji, budgetCents: cents || null }), { toast: 'Category saved' })
      : apply((d) => addCategory(d, name, emoji, cents || null), { toast: 'Category added' });
    if (ok) onClose();
  }

  return (
    <Sheet title={category ? 'Edit category' : 'New category'} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className="field"><span>Name</span><input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} autoFocus={!category} /></label>
        <div className="field">
          <span>Icon</span>
          <div className="chips wrap-chips">
            {EMOJIS.map((e) => (
              <button type="button" key={e} className={`chip ${emoji === e ? 'selected' : ''}`} style={{ fontSize: 20, padding: '6px 10px' }} onClick={() => setEmoji(e)} aria-label={`Icon ${e}`}>{e}</button>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Spending limit per {data.settings.categoryBudgetPeriod === 'month' ? 'month' : 'budget period'} (optional)</span>
          <div className="amount-wrap"><input className="input num" style={{ paddingLeft: 36 }} inputMode="decimal" placeholder="No limit" value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
        </label>
        <div className="small faint">You'll get a friendly heads-up at 80% and 100%.</div>
        <button className="btn primary block" type="submit">Save</button>
        {category && category.id !== 'other' && (
          <button type="button" className="btn danger block" onClick={() => setConfirmRemove(true)}>{used ? 'Archive category' : 'Delete category'}</button>
        )}
      </form>
      {confirmRemove && category && (
        <ConfirmDialog
          title={used ? 'Archive category?' : 'Delete category?'}
          danger
          message={used ? 'It has past entries, so it will be archived: hidden from new entries but kept in history and reports.' : 'This category has no entries and will be removed.'}
          confirmLabel={used ? 'Archive' : 'Delete'}
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => { apply((d) => removeCategory(d, category.id), { toast: used ? 'Category archived' : 'Category deleted' }); onClose(); }}
        />
      )}
    </Sheet>
  );
}
