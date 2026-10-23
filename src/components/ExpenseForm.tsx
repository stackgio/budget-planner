import { useMemo, useRef, useState } from 'react';
import type { Bucket, NeedWant, Transaction, TransferAllocation, TxnKind } from '../lib/types';
import { BUCKET_LABELS, BUCKETS, KIND_HELP, KIND_LABELS } from '../lib/types';
import { centsToInput, formatCents, parseCents } from '../lib/money';
import { addDays, formatDay } from '../lib/dates';
import { recentDescriptions, suggest } from '../lib/suggest';
import { findDuplicate, refundedAmount } from '../lib/ledger';
import { addTransaction, deleteTransaction, restoreTransaction, updateTransaction, ValidationError, type TxnDraft } from '../lib/ops';
import { useStore } from '../store';
import { ConfirmDialog, Segmented, Sheet } from './ui';
import { linesForDate, paycheckFor, paycheckView, resolveTxn, suggestBudget } from '../lib/budget';
import { BucketPicker, money } from './budget/parts';

export type FormTarget = { mode: 'new' } | { mode: 'edit'; txn: Transaction } | { mode: 'refund'; of: Transaction };

const KINDS: TxnKind[] = ['expense', 'refund', 'cc_payment', 'transfer', 'savings', 'debt_payment', 'uncle'];
const ACCOUNTS = ['Main Checking', 'Bills Checking', 'Savings'];

export function ExpenseSheet({ target, onClose, onSwitch }: { target: FormTarget; onClose: () => void; onSwitch: (t: FormTarget) => void }) {
  const { data, today, apply } = useStore();
  const editing = target.mode === 'edit' ? target.txn : null;
  const refundSource = target.mode === 'refund' ? target.of : null;

  const [description, setDescription] = useState(editing?.description ?? (refundSource ? `${refundSource.description} refund` : ''));
  const [amount, setAmount] = useState(
    editing ? centsToInput(editing.amountCents) : refundSource ? centsToInput(refundSource.amountCents - refundedAmount(data, refundSource.id)) : '',
  );
  const [kind, setKind] = useState<TxnKind>(editing?.kind ?? (refundSource ? 'refund' : 'expense'));
  const [kindTouched, setKindTouched] = useState(!!editing || !!refundSource);
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null);
  const [categoryTouched, setCategoryTouched] = useState(!!editing);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(editing?.paymentMethod ?? null);
  const [paymentTouched, setPaymentTouched] = useState(!!editing);
  const [needWant, setNeedWant] = useState<NeedWant | null>(editing?.needWant ?? null);
  const [needTouched, setNeedTouched] = useState(!!editing);
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [date, setDate] = useState(editing?.date ?? today);
  const [refundOf, setRefundOf] = useState<string | null>(editing?.refundOf ?? refundSource?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDuplicate, setConfirmDuplicate] = useState<Transaction | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(!editing && !refundSource);
  const [bucket, setBucket] = useState<Bucket | null>(editing?.bucket ?? null);
  const [bucketTouched, setBucketTouched] = useState(!!editing?.bucket);
  const [planLineId, setPlanLineId] = useState<string | null>(editing?.planLineId ?? null);
  const [lineTouched, setLineTouched] = useState(!!editing);
  const [debtId, setDebtId] = useState<string | null>(editing?.debtId ?? data.budget.debtPayoff.debtId ?? null);
  const [fromAccount, setFromAccount] = useState(editing?.transfer?.fromAccount ?? '');
  const [toAccount, setToAccount] = useState(editing?.transfer?.toAccount ?? '');
  const [allocations, setAllocations] = useState<Array<{ label: string; amount: string; planLineId: string | null }>>(
    editing?.transfer?.allocations.map((a) => ({ label: a.label, amount: centsToInput(a.amountCents), planLineId: a.planLineId })) ?? [],
  );
  const amountRef = useRef<HTMLInputElement>(null);

  const suggestion = useMemo(() => suggest(data, description), [data, description]);
  const effectiveKind = kindTouched ? kind : suggestion.kind;
  const effectiveCategory = categoryTouched ? categoryId : suggestion.categoryId;
  const effectivePayment = paymentTouched ? paymentMethod : suggestion.paymentMethod;
  const effectiveNeed = needTouched ? needWant : suggestion.needWant;
  const isSpending = effectiveKind === 'expense' || (effectiveKind === 'refund' && !refundOf);
  const budgetable = isSpending || effectiveKind === 'savings' || effectiveKind === 'debt_payment';
  const budgetSuggestion = useMemo(
    () => suggestBudget(data, { kind: effectiveKind, description, categoryId: effectiveCategory, date }),
    [data, effectiveKind, description, effectiveCategory, date],
  );
  const effectiveLine = lineTouched ? planLineId : budgetSuggestion.planLineId;
  const lineOptions = useMemo(() => {
    const all = linesForDate(data, date);
    if (effectiveKind === 'savings') return all.filter((l) => l.type === 'contribution' && l.goal !== 'debt');
    if (effectiveKind === 'debt_payment') return all.filter((l) => l.type === 'contribution' && l.goal === 'debt');
    return all.filter((l) => l.type !== 'contribution');
  }, [data, date, effectiveKind]);
  const chosenLine = lineOptions.find((l) => l.id === effectiveLine) ?? null;
  const effectiveBucket: Bucket | null = bucketTouched ? bucket : chosenLine?.bucket ?? budgetSuggestion.bucket;

  const recents = useMemo(() => (showSuggestions ? recentDescriptions(data, description, 8) : []), [data, description, showSuggestions]);
  const categories = data.categories.filter((c) => !c.archived || c.id === effectiveCategory);

  const refundable = useMemo(
    () =>
      data.transactions
        .filter((t) => !t.deletedAt && t.kind === 'expense' && t.date >= addDays(today, -120))
        .map((t) => ({ t, left: t.amountCents - refundedAmount(data, t.id, editing?.id) }))
        .filter((x) => x.left > 0 || x.t.id === refundOf)
        .sort((a, b) => b.t.date.localeCompare(a.t.date))
        .slice(0, 80),
    [data, today, editing, refundOf],
  );

  function buildDraft(): TxnDraft | null {
    const cents = parseCents(amount);
    if (!description.trim()) return setError('What did you spend money on?'), null;
    if (cents === null || cents <= 0) return setError('Enter how much you spent, like 14.50.'), null;
    return {
      kind: effectiveKind,
      description,
      amountCents: cents,
      date,
      categoryId: effectiveCategory,
      paymentMethod: effectivePayment,
      needWant: isSpending || effectiveKind === 'refund' ? effectiveNeed : null,
      notes,
      refundOf: effectiveKind === 'refund' ? refundOf : null,
      // Only store a bucket you chose (or for savings, where it decides Investing vs Goals);
      // otherwise it follows the line / category so fixing a category fixes its entries.
      bucket: effectiveKind === 'savings' ? effectiveBucket : isSpending && bucketTouched ? bucket : null,
      planLineId: budgetable && chosenLine ? chosenLine.id : null,
      debtId: effectiveKind === 'debt_payment' ? debtId : null,
      transfer: effectiveKind === 'transfer' ? {
        fromAccount,
        toAccount,
        allocations: allocations.map((a): TransferAllocation => ({ label: a.label, amountCents: parseCents(a.amount) ?? -1, planLineId: a.planLineId })),
      } : null,
    };
  }

  /** What's left in the entry's bucket for its pay period once it's saved — computed on a copy, never saved. */
  const preview = useMemo(() => {
    const draft = (() => {
      const cents = parseCents(amount);
      if (!budgetable || !description.trim() || !cents) return null;
      return { kind: effectiveKind, description, amountCents: cents, date, categoryId: effectiveCategory, refundOf: effectiveKind === 'refund' ? refundOf : null,
        bucket: effectiveKind === 'savings' ? effectiveBucket : isSpending && bucketTouched ? bucket : null, planLineId: chosenLine?.id ?? null, debtId };
    })();
    const p = paycheckFor(data, date);
    if (!draft || !p) return null;
    try {
      const next = editing ? updateTransaction(data, editing.id, draft) : addTransaction(data, draft).data;
      const txn = editing ? next.transactions.find((t) => t.id === editing.id)! : next.transactions[next.transactions.length - 1];
      const r = resolveTxn(next, txn);
      if (!r) return null;
      const s = paycheckView(next, next.paychecks.find((x) => x.id === p.id)!).buckets[r.bucket];
      return { bucket: r.bucket, remaining: s.remaining, flow: r.flow };
    } catch {
      return null;
    }
  }, [data, amount, budgetable, description, effectiveKind, date, effectiveCategory, refundOf, effectiveBucket, isSpending, bucketTouched, bucket, chosenLine, debtId, editing]);

  function save(skipDuplicateCheck = false) {
    setError(null);
    const draft = buildDraft();
    if (!draft) return;
    if (!skipDuplicateCheck) {
      const dup = findDuplicate(data, draft, editing?.id);
      if (dup) return setConfirmDuplicate(dup);
    }
    try {
      if (editing) {
        updateTransaction(data, editing.id, draft); // validate before applying
        apply((d) => updateTransaction(d, editing.id, draft), { toast: 'Changes saved' });
      } else {
        const { txn } = addTransaction(data, draft);
        const left = preview ? ` · ${BUCKET_LABELS[preview.bucket]} ${preview.remaining >= 0 ? `${formatCents(preview.remaining)} left` : `${formatCents(-preview.remaining)} over`}` : '';
        apply((d) => ({ ...d, transactions: [...d.transactions, txn] }), {
          toast: `Saved ${txn.description} · ${formatCents(txn.amountCents)}${left}`,
          undo: (d) => deleteTransaction(d, txn.id),
        });
      }
      onClose();
    } catch (e) {
      setError(e instanceof ValidationError ? e.message : 'Could not save.');
    }
  }

  function remove() {
    if (!editing) return;
    const id = editing.id;
    const refunds = data.transactions.filter((t) => t.refundOf === id && !t.deletedAt).length;
    apply((d) => deleteTransaction(d, id), {
      toast: refunds ? `Deleted with ${refunds} refund${refunds > 1 ? 's' : ''}` : 'Deleted',
      undo: (d) => restoreTransaction(d, id),
    });
    onClose();
  }

  const title = editing ? 'Edit entry' : refundSource ? 'Record refund' : 'Add expense';
  const already = editing && editing.kind === 'expense' ? refundedAmount(data, editing.id) : 0;

  return (
    <Sheet title={title} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <label className="field">
          <span>What did you spend money on?</span>
          <input
            className="input input-big"
            value={description}
            placeholder="McDonald’s"
            autoFocus={!editing}
            autoComplete="off"
            autoCorrect="off"
            enterKeyHint="next"
            maxLength={120}
            onChange={(e) => {
              setDescription(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                amountRef.current?.focus();
              }
            }}
          />
        </label>

        {recents.length > 0 && (
          <div>
            <div className="small faint" style={{ marginBottom: 6 }}>{description ? 'Matches' : 'Recent — tap to repeat'}</div>
            <div className="chips">
              {recents.map((r) => (
                <button
                  type="button"
                  key={r.description}
                  className="chip"
                  onClick={() => {
                    setDescription(r.description);
                    if (!amount) setAmount(centsToInput(r.amountCents));
                    setShowSuggestions(false);
                    amountRef.current?.focus();
                  }}
                >
                  {r.description}
                  <span className="chip-amt num">{formatCents(r.amountCents)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="field">
          <span>How much?</span>
          <div className="amount-wrap">
            <input
              ref={amountRef}
              className="input amount-input num"
              value={amount}
              placeholder="0.00"
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              aria-label="Amount in dollars"
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.,$]/g, ''))}
            />
          </div>
        </label>

        {effectiveKind !== 'expense' && (
          <div className="notice info">
            <span>ℹ️</span>
            <span>
              <b>{KIND_LABELS[effectiveKind]}.</b> {KIND_HELP[effectiveKind]}{' '}
              {!kindTouched && (
                <button type="button" className="link" onClick={() => { setKind('expense'); setKindTouched(true); }}>
                  It's an expense
                </button>
              )}
            </span>
          </div>
        )}

        {isSpending && (
          <div>
            <div className="row between" style={{ marginBottom: 6 }}>
              <span className="small muted" style={{ fontWeight: 600 }}>Category</span>
              {!categoryTouched && description.trim() && (
                <span className="small faint">{suggestion.source === 'history' ? 'Suggested from your history' : suggestion.source === 'rule' ? 'Suggested' : 'Tap to choose'}</span>
              )}
            </div>
            <div className="chips wrap-chips">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={`chip ${effectiveCategory === c.id ? 'selected' : ''}`}
                  aria-pressed={effectiveCategory === c.id}
                  onClick={() => {
                    setCategoryId(c.id);
                    setCategoryTouched(true);
                  }}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {effectiveKind === 'refund' && (
          <label className="field">
            <span>Which purchase was refunded?</span>
            <select className="input" value={refundOf ?? ''} onChange={(e) => setRefundOf(e.target.value || null)}>
              <option value="">Not linked (choose a category)</option>
              {refundable.map(({ t, left }) => (
                <option key={t.id} value={t.id}>
                  {formatDay(t.date)} · {t.description} · {formatCents(t.amountCents)}
                  {left !== t.amountCents ? ` (${formatCents(left)} left)` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        {budgetable && (
          <div className="field">
            <div className="row between">
              <span className="small muted" style={{ fontWeight: 600 }}>{effectiveKind === 'expense' || effectiveKind === 'refund' ? 'Counts toward' : effectiveKind === 'savings' ? 'Goes to' : 'Counts toward Goals · debt payoff'}</span>
              {preview && (
                <span className="small num" style={{ color: preview.remaining < 0 ? 'var(--over)' : 'var(--text-2)' }}>
                  {BUCKET_LABELS[preview.bucket]}: {preview.remaining >= 0 ? `${formatCents(preview.remaining)} left after this` : `${money(preview.remaining)} after this`}
                </span>
              )}
            </div>
            {effectiveKind !== 'debt_payment' && (!refundOf || effectiveKind !== 'refund') && (
              <BucketPicker
                value={effectiveBucket}
                options={effectiveKind === 'savings' ? (['investing', 'goals'] as const) : BUCKETS}
                onChange={(b) => { setBucket(b); setBucketTouched(true); }}
              />
            )}
            {effectiveKind === 'debt_payment' && data.debts.some((d) => !d.archived) && (
              <select className="input" aria-label="Which debt" value={debtId ?? ''} onChange={(e) => setDebtId(e.target.value || null)}>
                <option value="">Not linked to a debt</option>
                {data.debts.filter((d) => !d.archived || d.id === debtId).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            {lineOptions.length > 0 && (!refundOf || effectiveKind !== 'refund') && (
              <select className="input" aria-label="Budget line" value={chosenLine?.id ?? ''} onChange={(e) => { setPlanLineId(e.target.value || null); setLineTouched(true); }}>
                <option value="">{effectiveKind === 'savings' ? 'No specific goal' : 'No budget line'}</option>
                {lineOptions.map((l) => <option key={l.id} value={l.id}>{l.name} · {BUCKET_LABELS[l.bucket]}</option>)}
              </select>
            )}
          </div>
        )}

        {effectiveKind === 'transfer' && (
          <div className="stack">
            <div className="grid-2">
              <label className="field"><span>From account</span><input className="input" list="accounts" value={fromAccount} maxLength={40} onChange={(e) => setFromAccount(e.target.value)} placeholder="Main Checking" /></label>
              <label className="field"><span>To account</span><input className="input" list="accounts" value={toAccount} maxLength={40} onChange={(e) => setToAccount(e.target.value)} placeholder="Bills Checking" /></label>
            </div>
            <datalist id="accounts">{ACCOUNTS.map((a) => <option key={a} value={a} />)}</datalist>
            <div className="field">
              <span>Set aside for (optional)</span>
              {allocations.map((a, i) => (
                <div key={i} className="row" style={{ gap: 6 }}>
                  <input className="input grow" aria-label={`Set-aside ${i + 1} name`} value={a.label} placeholder="Capital One" maxLength={60} onChange={(e) => setAllocations(allocations.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <input className="input num" style={{ width: 96 }} aria-label={`Set-aside ${i + 1} amount`} inputMode="decimal" value={a.amount} placeholder="0.00" onChange={(e) => setAllocations(allocations.map((x, j) => (j === i ? { ...x, amount: e.target.value.replace(/[^\d.,$]/g, '') } : x)))} />
                  <button type="button" className="icon-btn" aria-label={`Remove set-aside ${i + 1}`} onClick={() => setAllocations(allocations.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
              {allocations.map((a, i) => linesForDate(data, date).some((l) => l.type === 'bill') && (
                <select key={`l${i}`} className="input" aria-label={`Set-aside ${i + 1} budget line`} value={a.planLineId ?? ''} onChange={(e) => setAllocations(allocations.map((x, j) => (j === i ? { ...x, planLineId: e.target.value || null } : x)))}>
                  <option value="">{a.label || `Set-aside ${i + 1}`}: not a budget bill</option>
                  {linesForDate(data, date).filter((l) => l.type === 'bill').map((l) => <option key={l.id} value={l.id}>{a.label || `Set-aside ${i + 1}`} → {l.name}</option>)}
                </select>
              ))}
              <button type="button" className="link" style={{ alignSelf: 'flex-start' }} onClick={() => setAllocations([...allocations, { label: '', amount: '', planLineId: null }])}>+ Add set-aside</button>
              <span className="small faint" style={{ fontWeight: 400 }}>Earmarks only — the transfer and its set-asides never count as spending. Bills stay reserved until you record the actual payment.</span>
            </div>
          </div>
        )}

        <details className="more" open={!!editing && (!!editing.notes || editing.kind !== 'expense')}>
          <summary>More options</summary>
          <div className="stack" style={{ marginTop: 8 }}>
            <div className="grid-2">
              <label className="field">
                <span>Date</span>
                <input className="input" type="date" value={date} max={addDays(today, 365)} onChange={(e) => e.target.value && setDate(e.target.value)} />
              </label>
              <label className="field">
                <span>Type</span>
                <select
                  className="input"
                  value={effectiveKind}
                  onChange={(e) => {
                    setKind(e.target.value as TxnKind);
                    setKindTouched(true);
                  }}
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>{KIND_LABELS[k]}</option>
                  ))}
                </select>
              </label>
            </div>
            {date !== today && <div className="small faint">Saving for {formatDay(date, { weekday: 'long', month: 'long', day: 'numeric' })}</div>}

            {(isSpending || effectiveKind === 'refund') && !refundOf && (
              <div className="field">
                <span className="small muted" style={{ fontWeight: 600 }}>Need or want? (optional)</span>
                <Segmented
                  label="Need or want"
                  value={effectiveNeed ?? 'none'}
                  onChange={(v) => {
                    setNeedWant(v === 'none' ? null : (v as NeedWant));
                    setNeedTouched(true);
                  }}
                  options={[
                    { value: 'none', label: 'Not set' },
                    { value: 'need', label: 'Need' },
                    { value: 'want', label: 'Want' },
                  ]}
                />
              </div>
            )}

            <div className="field">
              <span className="small muted" style={{ fontWeight: 600 }}>Payment method</span>
              <div className="chips wrap-chips">
                {data.settings.paymentMethods.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className={`chip ${effectivePayment === m ? 'selected' : ''}`}
                    aria-pressed={effectivePayment === m}
                    onClick={() => {
                      setPaymentMethod(effectivePayment === m ? null : m);
                      setPaymentTouched(true);
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <label className="field">
              <span>Notes</span>
              <textarea className="input" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Optional" />
            </label>
          </div>
        </details>

        {error && <div className="form-error" role="alert">{error}</div>}

        <button type="submit" className="btn primary block" style={{ minHeight: 56, fontSize: 18 }}>
          {editing ? 'Save changes' : 'Save'}
        </button>

        {editing && (
          <div className="grid-2">
            {editing.kind === 'expense' && editing.amountCents - already > 0 ? (
              <button type="button" className="btn" onClick={() => onSwitch({ mode: 'refund', of: editing })}>
                ↩️ Refund
              </button>
            ) : (
              <span />
            )}
            <button type="button" className="btn danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          </div>
        )}
        {already > 0 && <div className="small faint center">{formatCents(already)} refunded so far — net {formatCents(editing!.amountCents - already)}</div>}
      </form>

      {confirmDuplicate && (
        <ConfirmDialog
          title="Possible duplicate"
          message={`You already have “${confirmDuplicate.description}” for ${formatCents(confirmDuplicate.amountCents)} on ${formatDay(confirmDuplicate.date)}. Save another one?`}
          confirmLabel="Save anyway"
          onCancel={() => setConfirmDuplicate(null)}
          onConfirm={() => {
            setConfirmDuplicate(null);
            save(true);
          }}
        />
      )}
      {confirmDelete && editing && (
        <ConfirmDialog
          title="Delete this entry?"
          danger
          message={`“${editing.description}” (${formatCents(editing.amountCents)}) will move to Recently deleted. You can restore it from History.`}
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </Sheet>
  );
}
