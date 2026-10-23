import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import type { Bucket, Category, Debt, GoalKind, LineType, Paycheck, PlanLine } from '../../lib/types';
import { BUCKET_LABELS, BUCKETS } from '../../lib/types';
import { centsToInput, formatCents, parseCents } from '../../lib/money';
import { addDays, formatDay } from '../../lib/dates';
import { allocate, formatPercent, paycheckPeriod, paycheckView, redirectAmount, sameSnapshot } from '../../lib/budget';
import {
  applyPlanToPaycheck,
  recordLinePayment,
  removeDebt,
  removePlanLine,
  saveDebt,
  savePlanLine,
  savePlanPaycheck,
  setLineSettled,
  snapshotPlan,
  validatePaycheckInput,
  type PaycheckInput,
} from '../../lib/budgetOps';
import { addCategory, deletePaycheck, deleteTransaction, removeCategory, updateCategory, ValidationError } from '../../lib/ops';
import { ConfirmDialog, Segmented, Sheet } from '../ui';
import { BucketPicker, bucketStyle, KV, MoneyField } from './parts';

const amountOr0 = (v: string) => (v.trim() === '' ? 0 : parseCents(v));

// ---------- paycheck ----------

export function PaycheckSheet({ paycheck, onClose }: { paycheck: Paycheck | null; onClose: () => void }) {
  const { data, today, apply } = useStore();
  const last = [...data.paychecks].sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
  const seedDate = paycheck?.date ?? (last ? addDays(last.periodEnd, 1) : today);
  const [date, setDate] = useState(seedDate);
  const [amount, setAmount] = useState(paycheck ? centsToInput(paycheck.amountCents) : centsToInput(data.budget.baselineCents));
  const [start, setStart] = useState(paycheck?.periodStart ?? seedDate);
  const [end, setEnd] = useState(paycheck?.periodEnd ?? addDays(seedDate, 13));
  const [periodTouched, setPeriodTouched] = useState(!!paycheck);
  const [overtime, setOvertime] = useState(paycheck?.overtimeCents ? centsToInput(paycheck.overtimeCents) : '');
  const [notes, setNotes] = useState(paycheck?.notes ?? '');
  const [trim, setTrim] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReplan, setConfirmReplan] = useState(false);

  const plan = paycheck?.plan ?? snapshotPlan(data.budget);
  const cents = parseCents(amount);
  const targets = cents && cents > 0 ? allocate(cents, plan.percents) : null;
  const redirect = targets ? redirectAmount(plan, targets) : 0;
  const input: PaycheckInput | null = cents === null ? null : { date, amountCents: cents, periodStart: start, periodEnd: end, overtimeCents: amountOr0(overtime) ?? -1, notes };
  const overlap = useMemo(() => {
    if (!input) return null;
    try {
      return validatePaycheckInput(data, input, paycheck?.id).overlaps;
    } catch {
      return null;
    }
  }, [data, input, paycheck]);
  const canTrim = !!overlap && overlap.periodStart < start && overlap.periodEnd <= end;
  const planChanged = !!paycheck && !sameSnapshot(paycheck.plan, data.budget);

  function save() {
    setError(null);
    if (!input || input.amountCents <= 0) return setError('Enter the net (take-home) amount, like 1482.00.');
    if (input.overtimeCents < 0) return setError('Check the overtime amount.');
    try {
      savePlanPaycheck(data, input, paycheck?.id, { trimPrevious: canTrim && trim });
    } catch (e) {
      return setError(e instanceof ValidationError ? e.message : 'Could not save.');
    }
    const ok = apply((d) => savePlanPaycheck(d, input, paycheck?.id, { trimPrevious: canTrim && trim }).data, {
      toast: paycheck ? 'Paycheck updated' : `Paycheck budget for ${formatDay(start)} – ${formatDay(end)} is ready`,
    });
    if (ok) onClose();
  }

  return (
    <Sheet title={paycheck ? 'Edit paycheck' : 'Add paycheck'} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="grid-2">
          <label className="field">
            <span>Pay date</span>
            <input className="input" type="date" value={date} onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              setDate(v);
              if (!periodTouched) { setStart(v); setEnd(addDays(v, 13)); }
            }} />
          </label>
          <MoneyField label="Net paycheck (take-home)" value={amount} onChange={setAmount} />
        </div>
        <div className="grid-2">
          <label className="field"><span>Pay period start</span><input className="input" type="date" value={start} onChange={(e) => { if (e.target.value) { setStart(e.target.value); setPeriodTouched(true); } }} /></label>
          <label className="field"><span>Pay period end</span><input className="input" type="date" value={end} onChange={(e) => { if (e.target.value) { setEnd(e.target.value); setPeriodTouched(true); } }} /></label>
        </div>
        <div className="small faint" style={{ marginTop: -4 }}>The days this paycheck needs to cover — usually payday to the day before your next payday.</div>
        <MoneyField label="Overtime included in that net pay (optional)" value={overtime} onChange={setOvertime} placeholder="0.00" />
        <div className="small faint" style={{ marginTop: -4 }}>Just for your records — it's already part of the net amount, so it's never added twice.</div>

        {overlap && (
          canTrim ? (
            <label className="check notice near">
              <input type="checkbox" checked={trim} onChange={(e) => setTrim(e.target.checked)} />
              <span>End the {formatDay(overlap.date)} paycheck's period on {formatDay(addDays(start, -1))} so the two don't overlap.</span>
            </label>
          ) : (
            <div className="notice over"><span>▲</span><span>This period overlaps your {formatDay(overlap.date)} paycheck ({formatDay(overlap.periodStart)} – {formatDay(overlap.periodEnd)}).</span></div>
          )
        )}

        {targets && (
          <div className="card" style={{ background: 'var(--surface-2)', borderColor: 'transparent' }}>
            <div className="card-title" style={{ marginBottom: 6 }}>Budget for this paycheck</div>
            {BUCKETS.map((b) => (
              <KV key={b} k={<span className="row" style={{ gap: 8 }}><span className="bucket-dot" style={bucketStyle(b)} />{BUCKET_LABELS[b]} · {formatPercent(plan.percents[b])}</span>} v={formatCents(targets[b])} />
            ))}
            {redirect > 0 && <KV sub k="Investing redirected to debt payoff" v={formatCents(redirect)} />}
            <div className="small faint" style={{ marginTop: 6 }}>{paycheck ? "Uses this paycheck's own plan." : 'Uses your current plan.'} Planned amounts aren't recorded as paid until you confirm a payment.</div>
          </div>
        )}
        {planChanged && (
          <button type="button" className="btn small" onClick={() => setConfirmReplan(true)}>Use my current plan for this paycheck</button>
        )}

        <label className="field"><span>Notes</span><input className="input" value={notes} maxLength={300} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn primary block" type="submit">{paycheck ? 'Save paycheck' : 'Add paycheck'}</button>
        {paycheck && <button className="btn danger block" type="button" onClick={() => setConfirmDelete(true)}>Delete paycheck</button>}
      </form>

      {confirmReplan && paycheck && (
        <ConfirmDialog
          title="Update this paycheck's budget?"
          message={`The ${formatDay(paycheck.periodStart)} – ${formatDay(paycheck.periodEnd)} budget will switch to your current percentages and lines. Recorded payments and expenses are not changed.`}
          confirmLabel="Update"
          onCancel={() => setConfirmReplan(false)}
          onConfirm={() => {
            apply((d) => applyPlanToPaycheck(d, paycheck.id), { toast: 'Budget updated to your current plan', undo: (d) => ({ ...d, paychecks: d.paychecks.map((p) => (p.id === paycheck.id ? paycheck : p)) }) });
            onClose();
          }}
        />
      )}
      {confirmDelete && paycheck && (
        <ConfirmDialog title="Delete paycheck?" danger message="Its budget is removed. Your expenses and payments are not affected." confirmLabel="Delete" onCancel={() => setConfirmDelete(false)}
          onConfirm={() => { apply((d) => deletePaycheck(d, paycheck.id), { toast: 'Paycheck deleted', undo: (d) => ({ ...d, paychecks: [...d.paychecks, paycheck] }) }); onClose(); }} />
      )}
    </Sheet>
  );
}

// ---------- plan line ----------

const TYPE_HELP: Record<LineType, string> = {
  bill: 'A fixed bill. Until you record the payment, its amount shows as reserved.',
  spending: 'Variable spending. Link a category to count all of its spending here.',
  contribution: 'Money you move to investing, savings goals or debt payoff. Never counted as spending.',
};

export function LineSheet({ line, bucket, onClose }: { line: PlanLine | null; bucket: Bucket; onClose: () => void }) {
  const { data, today, apply } = useStore();
  const [name, setName] = useState(line?.name ?? '');
  const [b, setB] = useState<Bucket>(line?.bucket ?? bucket);
  const [type, setType] = useState<LineType>(line?.type ?? (bucket === 'investing' || bucket === 'goals' ? 'contribution' : 'spending'));
  const [amount, setAmount] = useState(line ? centsToInput(line.amountCents) : '');
  const [categoryId, setCategoryId] = useState<string | null>(line?.categoryId ?? null);
  const [goal, setGoal] = useState<GoalKind | null>(line?.goal ?? (bucket === 'goals' ? 'other' : null));
  const [confirmRemove, setConfirmRemove] = useState(false);
  const contributionOnly = b === 'investing';

  function save() {
    const cents = amountOr0(amount);
    if (cents === null) return apply(() => { throw new ValidationError('Enter a planned amount like 50.00, or 0.'); });
    const t: LineType = contributionOnly ? 'contribution' : type;
    const next: PlanLine = { id: line?.id ?? '', name, bucket: b, amountCents: cents, type: t, categoryId: t === 'contribution' ? null : categoryId, goal: t === 'contribution' && b === 'goals' ? goal ?? 'other' : null };
    const before = data.budget;
    if (apply((d) => savePlanLine(d, next, today), { toast: line ? 'Line saved — upcoming paychecks updated' : 'Line added', undo: (d) => ({ ...d, budget: before }) })) onClose();
  }

  return (
    <Sheet title={line ? 'Edit budget line' : `New ${BUCKET_LABELS[bucket]} line`} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className="field"><span>Name</span><input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} autoFocus={!line} placeholder="e.g. Groceries" /></label>
        <MoneyField label="Planned per paycheck" value={amount} onChange={setAmount} />
        <div className="field">
          <span>Bucket</span>
          <BucketPicker value={b} onChange={(x) => { setB(x); if (x === 'investing') setType('contribution'); }} />
        </div>
        {!contributionOnly && (
          <div className="field">
            <span>Type</span>
            <Segmented label="Line type" value={type} onChange={setType}
              options={(b === 'goals' ? (['contribution', 'bill', 'spending'] as const) : (['bill', 'spending'] as const)).map((v) => ({ value: v, label: v === 'bill' ? 'Bill' : v === 'spending' ? 'Spending' : 'Saving / debt' }))} />
            <span className="small faint" style={{ fontWeight: 400 }}>{TYPE_HELP[type]}</span>
          </div>
        )}
        {type !== 'contribution' && !contributionOnly && (
          <label className="field">
            <span>{type === 'spending' ? 'Count all spending in category (optional)' : 'Category for payments'}</span>
            <select className="input" value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value || null)}>
              <option value="">{type === 'spending' ? 'None — link entries by name or by choosing this line' : 'Bills (default)'}</option>
              {data.categories.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </label>
        )}
        {b === 'goals' && type === 'contribution' && (
          <label className="field">
            <span>Goal type</span>
            <select className="input" value={goal ?? 'other'} onChange={(e) => setGoal(e.target.value as GoalKind)}>
              <option value="debt">Debt payoff</option>
              <option value="emergency">Emergency savings</option>
              <option value="travel">Travel</option>
              <option value="birthday">Birthdays</option>
              <option value="other">Other goal</option>
            </select>
          </label>
        )}
        <div className="small faint">Changes apply to your plan and upcoming paychecks. Past and current pay periods keep their budget unless you update them.</div>
        <button className="btn primary block" type="submit">Save</button>
        {line && <button type="button" className="btn danger block" onClick={() => setConfirmRemove(true)}>Remove line</button>}
      </form>
      {confirmRemove && line && (
        <ConfirmDialog title={`Remove ${line.name}?`} danger message="It's removed from your plan and upcoming paychecks. Past budgets and any payments you recorded stay as they are." confirmLabel="Remove"
          onCancel={() => setConfirmRemove(false)}
          onConfirm={() => { const before = data.budget; apply((d) => removePlanLine(d, line.id, today), { toast: 'Line removed', undo: (d) => ({ ...d, budget: before }) }); onClose(); }} />
      )}
    </Sheet>
  );
}

// ---------- payment for a line ----------

export function PaymentSheet({ paycheckId, lineId, onClose }: { paycheckId: string; lineId: string; onClose: () => void }) {
  const { data, today, apply } = useStore();
  const paycheck = data.paychecks.find((p) => p.id === paycheckId);
  const view = paycheck ? paycheckView(data, paycheck) : null;
  const summary = view ? BUCKETS.flatMap((b) => view.buckets[b].lines).find((l) => l.line.id === lineId) : undefined;
  const period = paycheck ? paycheckPeriod(paycheck) : null;
  const line = summary?.line;
  const left = summary ? Math.max(0, summary.planned - summary.actual) : 0;
  const [amount, setAmount] = useState(centsToInput(left || summary?.planned || 0));
  const [date, setDate] = useState(period ? (today < period.start ? period.start : today > period.end ? period.end : today) : today);
  const [method, setMethod] = useState<string | null>(null);
  const [full, setFull] = useState(true);
  const [debtId, setDebtId] = useState<string | null>(data.budget.debtPayoff.debtId ?? data.debts.find((d) => !d.archived)?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  if (!paycheck || !summary || !line || !period) return null;
  const isDebt = line.type === 'contribution' && line.goal === 'debt';

  function save() {
    setError(null);
    const cents = parseCents(amount);
    if (!cents) return setError('Enter the amount you actually paid.');
    const input = { paycheckId, lineId, amountCents: cents, date, paymentMethod: method, paidInFull: full, debtId };
    try {
      recordLinePayment(data, input);
    } catch (e) {
      return setError(e instanceof ValidationError ? e.message : 'Could not save.');
    }
    let id = '';
    const ok = apply((d) => { const r = recordLinePayment(d, input); id = r.txn.id; return r.data; }, {
      toast: `Recorded ${line!.name} · ${formatCents(cents)}`,
      undo: (d) => setLineSettled(deleteTransaction(d, id), paycheckId, lineId, summary!.settled),
    });
    if (ok) onClose();
  }

  return (
    <Sheet title={line.type === 'contribution' ? `Record ${isDebt ? 'debt payment' : 'contribution'}` : `Record payment`} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <div className="card" style={{ background: 'var(--surface-2)', borderColor: 'transparent' }}>
          <div className="row between"><b>{line.name}</b><span className="pill" style={bucketStyle(line.bucket)}><span className="bucket-dot" />{BUCKET_LABELS[line.bucket]}</span></div>
          <KV k="Planned" v={formatCents(summary.planned)} />
          <KV k="Recorded so far" v={formatCents(summary.actual)} />
          {summary.funded > 0 && <KV k="Set aside by transfer" v={formatCents(summary.funded)} />}
        </div>
        <MoneyField label="Amount actually paid" value={amount} onChange={setAmount} autoFocus />
        <label className="field"><span>Date</span><input className="input" type="date" min={period.start} max={period.end} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
        {line.type !== 'contribution' && (
          <div className="field">
            <span>Paid with (optional)</span>
            <div className="chips wrap-chips">
              {data.settings.paymentMethods.map((m) => (
                <button type="button" key={m} className={`chip ${method === m ? 'selected' : ''}`} aria-pressed={method === m} onClick={() => setMethod(method === m ? null : m)}>{m}</button>
              ))}
            </div>
            {method === 'Credit card' && <span className="small faint" style={{ fontWeight: 400 }}>Counted as spending now. When you pay the card, record a credit card payment — it won't be counted again.</span>}
          </div>
        )}
        {line.type === 'bill' && (
          <label className="check"><input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} /> Paid in full — stop reserving anything more for this bill</label>
        )}
        {isDebt && (
          <label className="field">
            <span>Which debt?</span>
            <select className="input" value={debtId ?? ''} onChange={(e) => setDebtId(e.target.value || null)}>
              <option value="">Not linked to a debt</option>
              {data.debts.filter((d) => !d.archived).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
        )}
        <div className="small faint">
          {line.type === 'contribution'
            ? isDebt ? 'Saved as a debt payment: not spending, counted under Goals and taken off the debt balance.' : `Saved as ${BUCKET_LABELS[line.bucket].toLowerCase()} money moved — not spending.`
            : 'Saved as one expense in your history. You can edit or delete it there.'}
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="btn primary block" type="submit">Save payment</button>
        {summary.settled && (
          <button type="button" className="btn block" onClick={() => { apply((d) => setLineSettled(d, paycheckId, lineId, false), { toast: `${line.name} is no longer marked paid in full` }); onClose(); }}>Not paid in full after all</button>
        )}
      </form>
    </Sheet>
  );
}

// ---------- debts ----------

export function DebtSheet({ debt, onClose }: { debt: Debt | null; onClose: () => void }) {
  const { data, today, apply } = useStore();
  const [name, setName] = useState(debt?.name ?? '');
  const [balance, setBalance] = useState(debt ? centsToInput(debt.balanceCents) : '');
  const [asOf, setAsOf] = useState(debt?.asOf ?? today);
  const [payoffBy, setPayoffBy] = useState(debt?.payoffBy ?? '2026-12-31');
  const [interestFree, setInterestFree] = useState(debt?.interestFree ?? true);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const used = debt ? data.transactions.some((t) => t.debtId === debt.id) : false;

  function save() {
    const cents = parseCents(balance);
    if (cents === null) return apply(() => { throw new ValidationError('Enter the balance, like 1200.00.'); });
    if (apply((d) => saveDebt(d, { name, balanceCents: cents, asOf, payoffBy: payoffBy || null, interestFree, archived: debt?.archived }, debt?.id), { toast: debt ? 'Debt saved' : 'Debt added' })) onClose();
  }

  return (
    <Sheet title={debt ? 'Edit debt' : 'Add debt'} onClose={onClose}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className="field"><span>Name</span><input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. 0% Amex balance" autoFocus={!debt} /></label>
        <div className="grid-2">
          <MoneyField label="Balance owed" value={balance} onChange={setBalance} />
          <label className="field"><span>As of</span><input className="input" type="date" value={asOf} onChange={(e) => e.target.value && setAsOf(e.target.value)} /></label>
        </div>
        <label className="field"><span>Pay off by (optional)</span><input className="input" type="date" value={payoffBy} onChange={(e) => setPayoffBy(e.target.value)} /></label>
        <label className="check"><input type="checkbox" checked={interestFree} onChange={(e) => setInterestFree(e.target.checked)} /> Interest-free</label>
        <div className="small faint">Debt payments you record on or after the "as of" date lower the balance. They're never counted as spending.</div>
        <button className="btn primary block" type="submit">Save</button>
        {debt && <button type="button" className="btn danger block" onClick={() => setConfirmRemove(true)}>{used ? 'Archive debt' : 'Delete debt'}</button>}
      </form>
      {confirmRemove && debt && (
        <ConfirmDialog title={used ? 'Archive debt?' : 'Delete debt?'} danger message={used ? 'It has payments, so it will be hidden but kept for your history.' : 'This debt has no payments and will be removed.'} confirmLabel={used ? 'Archive' : 'Delete'}
          onCancel={() => setConfirmRemove(false)} onConfirm={() => { apply((d) => removeDebt(d, debt.id), { toast: used ? 'Debt archived' : 'Debt deleted' }); onClose(); }} />
      )}
    </Sheet>
  );
}

// ---------- categories (with bucket) ----------

const EMOJIS = ['🏷️', '🛒', '🍔', '☕', '⛽', '🚌', '🛍️', '🎬', '🔁', '💇', '🏠', '🧾', '💳', '📦', '🐶', '👶', '🎁', '💊', '📚', '✈️', '🏋️', '🎮', '🍺', '💻', '🚗', '🧸'];

export function CategorySheet({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const { data, apply } = useStore();
  const [name, setName] = useState(category?.name ?? '');
  const [emoji, setEmoji] = useState(category?.emoji ?? '🏷️');
  const [bucket, setBucket] = useState<Bucket>(category?.bucket ?? 'fun');
  const [budget, setBudget] = useState(category?.budgetCents ? centsToInput(category.budgetCents) : '');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const used = category ? data.transactions.some((t) => t.categoryId === category.id) : false;

  function save() {
    const cents = budget.trim() === '' ? null : parseCents(budget);
    if (budget.trim() !== '' && cents === null) return apply(() => { throw new ValidationError('Enter a limit like 100, or leave it empty.'); });
    const ok = category
      ? apply((d) => updateCategory(d, category.id, { name, emoji, bucket, budgetCents: cents || null }), { toast: 'Category saved' })
      : apply((d) => addCategory(d, name, emoji, cents || null, bucket), { toast: 'Category added' });
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
        <div className="field">
          <span>Spending here counts toward</span>
          <BucketPicker value={bucket} onChange={setBucket} />
          <span className="small faint" style={{ fontWeight: 400 }}>You can still change it on any single entry.</span>
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
