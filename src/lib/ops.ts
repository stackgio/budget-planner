/**
 * Immutable state transitions. Each returns a new AppData or throws a
 * ValidationError with a message suitable for showing to the user.
 */
import type { AppData, Bucket, Category, Paycheck, Settings, Transaction, TransferInfo, TxnKind } from './types';
import { BUCKETS } from './types';
import { addDays, isISODate } from './dates';
import { newId, slugify } from './ids';
import { refundedAmount } from './ledger';
import { OTHER_CATEGORY_ID } from './defaults';
import { formatCents } from './money';

export class ValidationError extends Error {}

export type TxnDraft = {
  kind: TxnKind;
  description: string;
  amountCents: number;
  date: string;
  categoryId?: string | null;
  paymentMethod?: string | null;
  needWant?: Transaction['needWant'];
  notes?: string;
  refundOf?: string | null;
  bucket?: Bucket | null;
  planLineId?: string | null;
  debtId?: string | null;
  transfer?: TransferInfo | null;
};

function cleanTransfer(t: TransferInfo | null | undefined, amountCents: number): TransferInfo | null {
  if (!t) return null;
  const fromAccount = t.fromAccount.trim().slice(0, 40);
  const toAccount = t.toAccount.trim().slice(0, 40);
  const allocations = t.allocations
    .map((a) => ({ label: a.label.trim().slice(0, 60), amountCents: a.amountCents, planLineId: a.planLineId || null }))
    .filter((a) => a.label || a.amountCents);
  for (const a of allocations) {
    if (!a.label) throw new ValidationError('Give each set-aside a name, like "Capital One".');
    if (!Number.isSafeInteger(a.amountCents) || a.amountCents <= 0) throw new ValidationError('Each set-aside needs an amount greater than $0.');
  }
  const total = allocations.reduce((s, a) => s + a.amountCents, 0);
  if (total > amountCents) throw new ValidationError(`Set-asides add up to ${formatCents(total)}, more than the ${formatCents(amountCents)} transfer.`);
  if (!fromAccount && !toAccount && !allocations.length) return null;
  return { fromAccount, toAccount, allocations };
}

const nowStamp = () => new Date().toISOString();

function normalizeTxn(data: AppData, draft: TxnDraft, existing?: Transaction): Transaction {
  const description = draft.description.trim();
  if (!description) throw new ValidationError('Add what you spent money on.');
  if (description.length > 120) throw new ValidationError('Description is too long (120 characters max).');
  if (!Number.isSafeInteger(draft.amountCents) || draft.amountCents <= 0) {
    throw new ValidationError('Enter an amount greater than $0.');
  }
  if (draft.amountCents > 100_000_000) throw new ValidationError('That amount looks too large.');
  if (!isISODate(draft.date)) throw new ValidationError('Pick a valid date.');

  let categoryId: string | null = null;
  let refundOf: string | null = null;
  let needWant = draft.needWant ?? null;
  let bucket: Bucket | null = draft.bucket ?? null;
  let planLineId: string | null = draft.planLineId || null;
  let debtId: string | null = null;
  let transfer: TransferInfo | null = null;
  if (bucket && !BUCKETS.includes(bucket)) throw new ValidationError('Pick a budget bucket.');

  if (draft.kind === 'expense') {
    categoryId = draft.categoryId ?? OTHER_CATEGORY_ID;
    if (!data.categories.some((c) => c.id === categoryId)) throw new ValidationError('Pick a category.');
  } else if (draft.kind === 'refund') {
    refundOf = draft.refundOf ?? null;
    if (refundOf) {
      const original = data.transactions.find((t) => t.id === refundOf && t.kind === 'expense' && !t.deletedAt);
      if (!original) throw new ValidationError('The purchase being refunded was not found.');
      const alreadyRefunded = refundedAmount(data, original.id, existing?.id);
      const refundable = original.amountCents - alreadyRefunded;
      if (draft.amountCents > refundable) {
        throw new ValidationError(`A refund can't be more than the ${formatCents(refundable)} left on that purchase.`);
      }
      // A refund always reduces the original purchase's category.
      categoryId = original.categoryId;
      needWant = original.needWant;
      bucket = original.bucket;
      planLineId = original.planLineId;
    } else {
      categoryId = draft.categoryId ?? OTHER_CATEGORY_ID;
      if (!data.categories.some((c) => c.id === categoryId)) throw new ValidationError('Pick a category.');
    }
  } else {
    needWant = null;
    if (draft.kind === 'savings') {
      if (bucket && bucket !== 'investing' && bucket !== 'goals') throw new ValidationError('Savings go to Investing or Goals.');
    } else if (draft.kind === 'debt_payment') {
      bucket = null;
      debtId = draft.debtId || null;
      if (debtId && !data.debts.some((d) => d.id === debtId)) throw new ValidationError('That debt was not found.');
    } else {
      bucket = null;
      planLineId = null;
      if (draft.kind === 'transfer') transfer = cleanTransfer(draft.transfer, draft.amountCents);
    }
  }

  const stamp = nowStamp();
  return {
    id: existing?.id ?? newId(),
    kind: draft.kind,
    description,
    amountCents: draft.amountCents,
    date: draft.date,
    categoryId,
    paymentMethod: draft.paymentMethod?.trim() || null,
    needWant,
    notes: (draft.notes ?? '').trim(),
    refundOf,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
    deletedAt: existing?.deletedAt ?? null,
    bucket,
    planLineId,
    debtId,
    transfer,
  };
}

export function addTransaction(data: AppData, draft: TxnDraft): { data: AppData; txn: Transaction } {
  const txn = normalizeTxn(data, draft);
  return { data: { ...data, transactions: [...data.transactions, txn] }, txn };
}

export function updateTransaction(data: AppData, id: string, draft: TxnDraft): AppData {
  const existing = data.transactions.find((t) => t.id === id);
  if (!existing) throw new ValidationError('That entry no longer exists.');
  if (existing.kind === 'expense' && draft.kind !== 'expense' && refundedAmount(data, id) > 0) {
    throw new ValidationError('This purchase has refunds. Delete the refunds before changing its type.');
  }
  if (existing.kind === 'expense' && draft.amountCents < refundedAmount(data, id)) {
    throw new ValidationError(`This purchase has ${formatCents(refundedAmount(data, id))} in refunds; the amount can't be lower than that.`);
  }
  const updated = normalizeTxn(data, draft, existing);
  // Keep linked refunds in the same category as their purchase.
  const transactions = data.transactions.map((t) => {
    if (t.id === id) return updated;
    if (t.kind === 'refund' && t.refundOf === id && (t.categoryId !== updated.categoryId || t.bucket !== updated.bucket || t.planLineId !== updated.planLineId)) {
      return { ...t, categoryId: updated.categoryId, needWant: updated.needWant, bucket: updated.bucket, planLineId: updated.planLineId, updatedAt: updated.updatedAt };
    }
    return t;
  });
  return { ...data, transactions };
}

/** Soft delete. Refunds linked to a deleted purchase are deleted with it. */
export function deleteTransaction(data: AppData, id: string): AppData {
  const stamp = nowStamp();
  return {
    ...data,
    transactions: data.transactions.map((t) =>
      (t.id === id || (t.refundOf === id && t.kind === 'refund')) && !t.deletedAt ? { ...t, deletedAt: stamp, updatedAt: stamp } : t,
    ),
  };
}

/** Restores an entry and any refunds that were deleted together with it. */
export function restoreTransaction(data: AppData, id: string): AppData {
  const target = data.transactions.find((t) => t.id === id);
  if (!target || !target.deletedAt) return data;
  if (target.kind === 'refund' && target.refundOf) {
    const original = data.transactions.find((t) => t.id === target.refundOf);
    if (original?.deletedAt) throw new ValidationError('Restore the original purchase first.');
  }
  const stamp = nowStamp();
  return {
    ...data,
    transactions: data.transactions.map((t) =>
      t.id === id || (t.kind === 'refund' && t.refundOf === id && t.deletedAt === target.deletedAt)
        ? { ...t, deletedAt: null, updatedAt: stamp }
        : t,
    ),
  };
}

/** Permanently removes a deleted entry (and its deleted refunds). */
export function purgeTransaction(data: AppData, id: string): AppData {
  return {
    ...data,
    transactions: data.transactions.filter((t) => !(t.deletedAt && (t.id === id || t.refundOf === id))),
  };
}

// ---------- categories ----------

export function addCategory(data: AppData, name: string, emoji = '🏷️', budgetCents: number | null = null, bucket: Bucket = 'fun'): AppData {
  const trimmed = name.trim();
  if (!trimmed) throw new ValidationError('Give the category a name.');
  if (data.categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() && !c.archived)) {
    throw new ValidationError('A category with that name already exists.');
  }
  let id = slugify(trimmed);
  while (data.categories.some((c) => c.id === id)) id = `${slugify(trimmed)}-${newId().slice(0, 4)}`;
  if (!BUCKETS.includes(bucket)) throw new ValidationError('Pick a budget bucket.');
  const category: Category = { id, name: trimmed, emoji: emoji || '🏷️', budgetCents, archived: false, bucket };
  return { ...data, categories: [...data.categories, category] };
}

export function updateCategory(data: AppData, id: string, patch: Partial<Omit<Category, 'id'>>): AppData {
  if (patch.name !== undefined) {
    const trimmed = patch.name.trim();
    if (!trimmed) throw new ValidationError('Category name cannot be empty.');
    if (data.categories.some((c) => c.id !== id && !c.archived && c.name.toLowerCase() === trimmed.toLowerCase())) {
      throw new ValidationError('A category with that name already exists.');
    }
    patch = { ...patch, name: trimmed };
  }
  if (patch.budgetCents !== undefined && patch.budgetCents !== null && (!Number.isSafeInteger(patch.budgetCents) || patch.budgetCents < 0)) {
    throw new ValidationError('Budget must be $0 or more.');
  }
  if (patch.bucket !== undefined && !BUCKETS.includes(patch.bucket)) throw new ValidationError('Pick a budget bucket.');
  if (patch.archived && id === OTHER_CATEGORY_ID) throw new ValidationError('"Other" is always kept as a fallback.');
  return { ...data, categories: data.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

/** Deletes an unused category; a category with history is archived instead so totals stay correct. */
export function removeCategory(data: AppData, id: string): AppData {
  if (id === OTHER_CATEGORY_ID) throw new ValidationError('"Other" is always kept as a fallback.');
  const used = data.transactions.some((t) => t.categoryId === id);
  if (used) return updateCategory(data, id, { archived: true });
  return { ...data, categories: data.categories.filter((c) => c.id !== id) };
}

// ---------- paychecks ----------

/** Older paycheck shape (allowance + reserved). Budget fields are filled in when missing. */
export type PaycheckDraft = Omit<Paycheck, 'id' | 'periodStart' | 'periodEnd' | 'overtimeCents' | 'plan'> &
  Partial<Pick<Paycheck, 'periodStart' | 'periodEnd' | 'overtimeCents' | 'plan'>>;

export function validatePaycheck(p: PaycheckDraft): void {
  if (!isISODate(p.date)) throw new ValidationError('Pick the paycheck date.');
  if (!isISODate(p.nextPayday) || p.nextPayday <= p.date) throw new ValidationError('Next payday must be after the paycheck date.');
  const parts = [p.amountCents, p.allowanceCents, p.reserved.bills, p.reserved.debt, p.reserved.savings, p.reserved.investing];
  if (parts.some((v) => !Number.isSafeInteger(v) || v < 0)) throw new ValidationError('Amounts must be $0 or more.');
  if (p.amountCents <= 0) throw new ValidationError('Enter the paycheck amount.');
  const reserved = p.reserved.bills + p.reserved.debt + p.reserved.savings + p.reserved.investing;
  if (reserved > p.amountCents) throw new ValidationError('Reserved money is more than the paycheck.');
  if (p.allowanceCents > p.amountCents - reserved) {
    throw new ValidationError(`Spending allowance can't be more than what's left after reserved money (${formatCents(p.amountCents - reserved)}).`);
  }
}

export function savePaycheck(data: AppData, draft: PaycheckDraft, id?: string): AppData {
  validatePaycheck(draft);
  const existing = id ? data.paychecks.find((p) => p.id === id) : undefined;
  const full: Omit<Paycheck, 'id'> = {
    ...draft,
    periodStart: draft.periodStart ?? draft.date,
    periodEnd: draft.periodEnd ?? addDays(draft.nextPayday, -1),
    overtimeCents: draft.overtimeCents ?? 0,
    plan: draft.plan ?? existing?.plan ?? { percents: { ...data.budget.percents }, lines: data.budget.lines.map((l) => ({ ...l })), debtPayoff: { ...data.budget.debtPayoff }, settledLineIds: [] },
  };
  if (id) return { ...data, paychecks: data.paychecks.map((p) => (p.id === id ? { ...full, id } : p)) };
  return { ...data, paychecks: [...data.paychecks, { ...full, id: newId() }] };
}

export function deletePaycheck(data: AppData, id: string): AppData {
  return { ...data, paychecks: data.paychecks.filter((p) => p.id !== id) };
}

export function updateSettings(data: AppData, patch: Partial<Settings>): AppData {
  const settings = { ...data.settings, ...patch };
  if (!Number.isSafeInteger(settings.customBudgetCents) || settings.customBudgetCents < 0) {
    throw new ValidationError('Budget must be $0 or more.');
  }
  if (!isISODate(settings.biweeklyAnchor)) throw new ValidationError('Pick a valid start date.');
  return { ...data, settings };
}
