/**
 * JSON / CSV export and import, plus validation of anything read from disk
 * or storage. Imports merge by transaction id, so re-importing the same
 * backup never creates duplicates.
 */
import type { AppData, BudgetPlan, Bucket, Category, Debt, Paycheck, PaycheckPlan, PlanLine, Settings, Transaction, TransferInfo, TxnKind } from './types';
import { BUCKETS } from './types';
import { DEFAULT_CATEGORIES, defaultBucketFor, defaultPlan, defaultSettings, OTHER_CATEGORY_ID } from './defaults';
import { addDays, isISODate } from './dates';
import { centsToInput, parseCents } from './money';
import { newId, slugify } from './ids';
import { spendingEffect } from './ledger';

export const BACKUP_FORMAT = 'spend-smarter-backup';
const KINDS: TxnKind[] = ['expense', 'refund', 'cc_payment', 'transfer', 'savings', 'uncle', 'debt_payment'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  app: 'Spend Smarter';
  schemaVersion: 2;
  exportedAt: string;
  data: AppData;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const cents = (v: unknown): number | null => (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null);
const bucketOf = (v: unknown): Bucket | null => (BUCKETS as readonly unknown[]).includes(v) ? (v as Bucket) : null;
const idOrNull = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);

function sanitizeTransfer(raw: unknown): TransferInfo | null {
  if (!isObj(raw)) return null;
  const allocations = (Array.isArray(raw.allocations) ? raw.allocations : [])
    .filter(isObj)
    .map((a) => ({ label: str(a.label).slice(0, 60), amountCents: cents(a.amountCents) ?? 0, planLineId: idOrNull(a.planLineId) }))
    .filter((a) => a.label && a.amountCents > 0);
  return { fromAccount: str(raw.fromAccount).slice(0, 40), toAccount: str(raw.toAccount).slice(0, 40), allocations };
}

function sanitizeTxn(raw: unknown, categoryIds: Set<string>): Transaction | null {
  if (!isObj(raw)) return null;
  const kind = raw.kind as TxnKind;
  const amount = cents(raw.amountCents);
  if (!KINDS.includes(kind) || !amount || !isISODate(raw.date) || typeof raw.id !== 'string' || !raw.id) return null;
  const description = str(raw.description).trim();
  if (!description) return null;
  const spending = kind === 'expense' || kind === 'refund';
  let categoryId = typeof raw.categoryId === 'string' ? raw.categoryId : null;
  if (spending && (!categoryId || !categoryIds.has(categoryId))) categoryId = OTHER_CATEGORY_ID;
  if (!spending) categoryId = null;
  const stamp = new Date().toISOString();
  return {
    id: raw.id,
    kind,
    description: description.slice(0, 120),
    amountCents: amount,
    date: raw.date,
    categoryId,
    paymentMethod: typeof raw.paymentMethod === 'string' && raw.paymentMethod ? raw.paymentMethod : null,
    needWant: spending && (raw.needWant === 'need' || raw.needWant === 'want') ? raw.needWant : null,
    notes: str(raw.notes),
    refundOf: kind === 'refund' && typeof raw.refundOf === 'string' ? raw.refundOf : null,
    createdAt: str(raw.createdAt, stamp),
    updatedAt: str(raw.updatedAt, stamp),
    deletedAt: typeof raw.deletedAt === 'string' ? raw.deletedAt : null,
    bucket: spending || kind === 'savings' ? (kind === 'savings' ? (raw.bucket === 'investing' || raw.bucket === 'goals' ? raw.bucket : null) : bucketOf(raw.bucket)) : null,
    planLineId: spending || kind === 'savings' || kind === 'debt_payment' ? idOrNull(raw.planLineId) : null,
    debtId: kind === 'debt_payment' ? idOrNull(raw.debtId) : null,
    transfer: kind === 'transfer' ? sanitizeTransfer(raw.transfer) : null,
  };
}

function sanitizeCategory(raw: unknown): Category | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !raw.id || !str(raw.name).trim()) return null;
  return {
    id: raw.id,
    name: str(raw.name).trim(),
    emoji: str(raw.emoji, '🏷️') || '🏷️',
    budgetCents: raw.budgetCents === null ? null : cents(raw.budgetCents),
    archived: raw.archived === true,
    bucket: bucketOf(raw.bucket) ?? defaultBucketFor(raw.id),
  };
}

function sanitizeLine(raw: unknown): PlanLine | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !raw.id || !str(raw.name).trim()) return null;
  const bucket = bucketOf(raw.bucket);
  const type = raw.type === 'bill' || raw.type === 'spending' || raw.type === 'contribution' ? raw.type : null;
  const amount = cents(raw.amountCents);
  if (!bucket || !type || amount === null) return null;
  const goals = ['emergency', 'travel', 'birthday', 'debt', 'other'];
  return {
    id: raw.id,
    name: str(raw.name).trim().slice(0, 60),
    bucket,
    amountCents: amount,
    type,
    categoryId: type === 'contribution' ? null : idOrNull(raw.categoryId),
    goal: type === 'contribution' && goals.includes(raw.goal as string) ? (raw.goal as PlanLine['goal']) : null,
  };
}

function sanitizePercents(raw: unknown): BudgetPlan['percents'] | null {
  if (!isObj(raw)) return null;
  const out = { needs: 0, investing: 0, goals: 0, fun: 0 };
  for (const b of BUCKETS) {
    const v = raw[b];
    if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) return null;
    out[b] = v;
  }
  return out.needs + out.investing + out.goals + out.fun === 10000 ? out : null;
}

function sanitizeSnapshot(raw: unknown, fallback: Omit<PaycheckPlan, 'settledLineIds'>): Omit<PaycheckPlan, 'settledLineIds'> {
  if (!isObj(raw)) return { percents: { ...fallback.percents }, lines: fallback.lines.map((l) => ({ ...l })), debtPayoff: { ...fallback.debtPayoff } };
  const lines: PlanLine[] = [];
  for (const l of Array.isArray(raw.lines) ? raw.lines : []) {
    const clean = sanitizeLine(l);
    if (clean && !lines.some((x) => x.id === clean.id)) lines.push(clean);
  }
  const d = isObj(raw.debtPayoff) ? raw.debtPayoff : {};
  return {
    percents: sanitizePercents(raw.percents) ?? { ...fallback.percents },
    lines: Array.isArray(raw.lines) ? lines : fallback.lines.map((l) => ({ ...l })),
    debtPayoff: { enabled: d.enabled === true, redirectCents: d.redirectCents === null || d.redirectCents === undefined ? null : cents(d.redirectCents), debtId: idOrNull(d.debtId) },
  };
}

function sanitizePlan(raw: unknown): BudgetPlan {
  const d = defaultPlan();
  if (!isObj(raw)) return d;
  return { ...sanitizeSnapshot(raw, d), baselineCents: cents(raw.baselineCents) || d.baselineCents };
}

function sanitizeDebt(raw: unknown): Debt | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !raw.id || !str(raw.name).trim() || !isISODate(raw.asOf)) return null;
  const balance = cents(raw.balanceCents);
  if (balance === null) return null;
  return {
    id: raw.id,
    name: str(raw.name).trim().slice(0, 60),
    balanceCents: balance,
    asOf: raw.asOf,
    interestFree: raw.interestFree !== false,
    payoffBy: isISODate(raw.payoffBy) ? raw.payoffBy : null,
    archived: raw.archived === true,
  };
}

/**
 * Older paychecks (schema 1) have no budget plan. They get a copy of the
 * plan once, on first load, and keep it from then on.
 */
function sanitizePaycheck(raw: unknown, plan: BudgetPlan): Paycheck | null {
  if (!isObj(raw) || typeof raw.id !== 'string' || !isISODate(raw.date) || !isISODate(raw.nextPayday)) return null;
  const amount = cents(raw.amountCents);
  const allowance = cents(raw.allowanceCents);
  const r = isObj(raw.reserved) ? raw.reserved : {};
  if (amount === null || allowance === null) return null;
  return {
    id: raw.id,
    date: raw.date,
    nextPayday: raw.nextPayday,
    amountCents: amount,
    allowanceCents: allowance,
    reserved: {
      bills: cents(r.bills) ?? 0,
      debt: cents(r.debt) ?? 0,
      savings: cents(r.savings) ?? 0,
      investing: cents(r.investing) ?? 0,
    },
    notes: str(raw.notes),
    ...periodOf(raw),
    overtimeCents: Math.min(cents(raw.overtimeCents) ?? 0, amount),
    plan: {
      ...sanitizeSnapshot(raw.plan, plan),
      settledLineIds: isObj(raw.plan) && Array.isArray(raw.plan.settledLineIds) ? raw.plan.settledLineIds.filter((x): x is string => typeof x === 'string') : [],
    },
  };
}

function periodOf(raw: Record<string, unknown>): { periodStart: string; periodEnd: string } {
  if (isISODate(raw.periodStart) && isISODate(raw.periodEnd) && raw.periodEnd >= raw.periodStart) return { periodStart: raw.periodStart, periodEnd: raw.periodEnd };
  // Schema 1: the period ran from the paycheck date to the day before next payday.
  const date = raw.date as string;
  const next = raw.nextPayday as string;
  return { periodStart: date, periodEnd: next > date ? addDays(next, -1) : date };
}

function sanitizeSettings(raw: unknown): Settings {
  const d = defaultSettings();
  if (!isObj(raw)) return d;
  return {
    budgetMode: raw.budgetMode === 'biweekly' || raw.budgetMode === 'monthly' || raw.budgetMode === 'paycheck' ? raw.budgetMode : d.budgetMode,
    customBudgetCents: cents(raw.customBudgetCents) ?? d.customBudgetCents,
    biweeklyAnchor: isISODate(raw.biweeklyAnchor) ? raw.biweeklyAnchor : d.biweeklyAnchor,
    categoryBudgetPeriod: raw.categoryBudgetPeriod === 'budget' ? 'budget' : 'month',
    weekStartsOn: raw.weekStartsOn === 0 ? 0 : 1,
    paymentMethods: Array.isArray(raw.paymentMethods) ? raw.paymentMethods.filter((m): m is string => typeof m === 'string' && !!m) : d.paymentMethods,
    smallPurchaseCents: cents(raw.smallPurchaseCents) ?? d.smallPurchaseCents,
  };
}

/** Validates unknown input (a backup file or stored JSON) into AppData. Throws if it isn't recognisable. */
export function sanitizeData(raw: unknown): { data: AppData; skipped: number } {
  const root = isObj(raw) && raw.format === BACKUP_FORMAT && isObj(raw.data) ? raw.data : raw;
  if (!isObj(root) || !Array.isArray(root.transactions)) throw new Error('This file is not a Spend Smarter backup.');

  const categories: Category[] = [];
  for (const c of Array.isArray(root.categories) ? root.categories : []) {
    const clean = sanitizeCategory(c);
    if (clean && !categories.some((x) => x.id === clean.id)) categories.push(clean);
  }
  if (!categories.length) categories.push(...DEFAULT_CATEGORIES.map((c) => ({ ...c })));
  if (!categories.some((c) => c.id === OTHER_CATEGORY_ID)) categories.push({ ...DEFAULT_CATEGORIES.at(-1)! });
  const ids = new Set(categories.map((c) => c.id));

  let skipped = 0;
  const seen = new Set<string>();
  const transactions: Transaction[] = [];
  for (const t of root.transactions) {
    const clean = sanitizeTxn(t, ids);
    if (!clean || seen.has(clean.id)) {
      skipped++;
      continue;
    }
    seen.add(clean.id);
    transactions.push(clean);
  }
  const budget = sanitizePlan(root.budget);
  const paychecks: Paycheck[] = [];
  for (const p of Array.isArray(root.paychecks) ? root.paychecks : []) {
    const clean = sanitizePaycheck(p, budget);
    if (clean && !paychecks.some((x) => x.id === clean.id)) paychecks.push(clean);
  }
  const debts: Debt[] = [];
  for (const d of Array.isArray(root.debts) ? root.debts : []) {
    const clean = sanitizeDebt(d);
    if (clean && !debts.some((x) => x.id === clean.id)) debts.push(clean);
  }

  return {
    data: { schemaVersion: 2, transactions, categories, paychecks, settings: sanitizeSettings(root.settings), budget, debts },
    skipped,
  };
}

export function toBackupJSON(data: AppData, now = new Date()): string {
  const file: BackupFile = { format: BACKUP_FORMAT, app: 'Spend Smarter', schemaVersion: 2, exportedAt: now.toISOString(), data };
  return JSON.stringify(file, null, 2);
}

export interface MergeResult {
  data: AppData;
  added: number;
  updated: number;
  unchanged: number;
  duplicates: number;
  skipped: number;
}

/**
 * Merge imported data into existing data. Transactions match by id (the
 * newer `updatedAt` wins). Entries without a matching id that are identical
 * in kind/date/amount/description to an existing entry are treated as
 * duplicates and skipped.
 */
export function mergeData(current: AppData, incoming: AppData, skipped = 0): MergeResult {
  const byId = new Map(current.transactions.map((t) => [t.id, t]));
  const fingerprint = (t: Transaction) => `${t.kind}|${t.date}|${t.amountCents}|${t.description.trim().toLowerCase()}`;
  const fingerprints = new Set(current.transactions.filter((t) => !t.deletedAt).map(fingerprint));

  // Restoring into a fresh install: take the backup's categories and settings as-is.
  const fresh = current.transactions.length === 0 && current.paychecks.length === 0;
  // Otherwise keep existing categories (and their limits), add new ones by id.
  const categories = fresh ? [...incoming.categories] : [...current.categories];
  for (const c of fresh ? current.categories : incoming.categories) if (!categories.some((x) => x.id === c.id)) categories.push(c);
  const settings = fresh ? incoming.settings : current.settings;
  // The budget plan is a setting too: keep yours unless restoring into a fresh install.
  const budget = fresh ? incoming.budget : current.budget;
  const debts = [...current.debts];
  for (const d of incoming.debts) if (!debts.some((x) => x.id === d.id)) debts.push(d);

  let added = 0, updated = 0, unchanged = 0, duplicates = 0;
  for (const t of incoming.transactions) {
    const existing = byId.get(t.id);
    if (existing) {
      if (t.updatedAt > existing.updatedAt) {
        byId.set(t.id, t);
        updated++;
      } else unchanged++;
      continue;
    }
    if (!t.deletedAt && fingerprints.has(fingerprint(t))) {
      duplicates++;
      continue;
    }
    byId.set(t.id, t);
    fingerprints.add(fingerprint(t));
    added++;
  }

  const paychecks = [...current.paychecks];
  for (const p of incoming.paychecks) {
    if (!paychecks.some((x) => x.id === p.id || (x.date === p.date && x.amountCents === p.amountCents))) paychecks.push(p);
  }

  return {
    data: { ...current, settings, categories, paychecks, budget, debts, transactions: [...byId.values()] },
    added,
    updated,
    unchanged,
    duplicates,
    skipped,
  };
}

// ---------- CSV ----------

const CSV_COLUMNS = [
  'id', 'date', 'kind', 'description', 'amount', 'spending_effect', 'category', 'payment_method', 'need_want', 'notes', 'refund_of', 'created_at', 'updated_at',
  'bucket', 'plan_line_id', 'debt_id',
] as const;

export function csvCell(value: string): string {
  // Neutralise spreadsheet formula injection and quote when needed.
  const safe = /^[=+\-@\t\r]/.test(value) && !/^-?\d+(\.\d+)?$/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV of active (non-deleted) transactions. `spending_effect` is signed: refunds negative, non-spending 0. */
export function toCSV(data: AppData): string {
  const catName = new Map(data.categories.map((c) => [c.id, c.name]));
  const rows = data.transactions
    .filter((t) => !t.deletedAt)
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt))
    .map((t) =>
      [
        t.id, t.date, t.kind, t.description, centsToInput(t.amountCents), centsToInput(spendingEffect(t)),
        t.categoryId ? catName.get(t.categoryId) ?? '' : '', t.paymentMethod ?? '', t.needWant ?? '', t.notes, t.refundOf ?? '', t.createdAt, t.updatedAt,
        t.bucket ?? '', t.planLineId ?? '', t.debtId ?? '',
      ].map((v) => csvCell(String(v))).join(','),
    );
  return [CSV_COLUMNS.join(','), ...rows].join('\n') + '\n';
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/**
 * Reads a CSV (our own export, or a simple sheet with at least
 * date, description and amount columns) into AppData ready for mergeData.
 * Unknown categories are created.
 */
export function fromCSV(text: string, current: AppData): { data: AppData; skipped: number } {
  const rows = parseCSV(text.replace(/^﻿/, ''));
  if (!rows.length) throw new Error('The CSV file is empty.');
  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const col = (name: string) => header.indexOf(name);
  if (col('date') < 0 || col('description') < 0 || col('amount') < 0) {
    throw new Error('CSV needs at least "date", "description" and "amount" columns.');
  }
  const categories = current.categories.map((c) => ({ ...c }));
  const findCategory = (name: string): string => {
    const n = name.trim();
    if (!n) return OTHER_CATEGORY_ID;
    const hit = categories.find((c) => c.name.toLowerCase() === n.toLowerCase() || c.id === n);
    if (hit) return hit.id;
    let id = slugify(n);
    while (categories.some((c) => c.id === id)) id = `${slugify(n)}-${newId().slice(0, 4)}`;
    categories.push({ id, name: n, emoji: '🏷️', budgetCents: null, archived: false, bucket: 'fun' });
    return id;
  };

  let skipped = 0;
  const stamp = new Date().toISOString();
  const transactions: Transaction[] = [];
  for (const r of rows.slice(1)) {
    const get = (name: string) => (col(name) >= 0 ? (r[col(name)] ?? '').trim().replace(/^'(?=[=+\-@])/, '') : '');
    const rawAmount = get('amount');
    const negative = rawAmount.startsWith('-') || /^\(.*\)$/.test(rawAmount);
    const amountCents = parseCents(rawAmount.replace(/^-|^\(|\)$/g, ''));
    let kind = get('kind') as TxnKind;
    if (!KINDS.includes(kind)) kind = negative ? 'refund' : 'expense';
    const date = get('date');
    if (!amountCents || !isISODate(date) || !get('description')) { skipped++; continue; }
    const id = UUID_RE.test(get('id')) ? get('id') : newId();
    const spending = kind === 'expense' || kind === 'refund';
    const nw = get('need_want');
    const bucket = bucketOf(get('bucket'));
    transactions.push({
      id,
      kind,
      description: get('description').slice(0, 120),
      amountCents,
      date,
      categoryId: spending ? findCategory(get('category')) : null,
      paymentMethod: get('payment_method') || null,
      needWant: spending && (nw === 'need' || nw === 'want') ? nw : null,
      notes: get('notes'),
      refundOf: kind === 'refund' ? get('refund_of') || null : null,
      createdAt: get('created_at') || stamp,
      updatedAt: get('updated_at') || stamp,
      deletedAt: null,
      bucket: spending ? bucket : kind === 'savings' && (bucket === 'investing' || bucket === 'goals') ? bucket : null,
      planLineId: spending || kind === 'savings' || kind === 'debt_payment' ? get('plan_line_id') || null : null,
      debtId: kind === 'debt_payment' ? get('debt_id') || null : null,
      transfer: null,
    });
  }
  return { data: { ...current, categories, transactions }, skipped };
}
