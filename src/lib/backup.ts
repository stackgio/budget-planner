/**
 * JSON / CSV export and import, plus validation of anything read from disk
 * or storage. Imports merge by transaction id, so re-importing the same
 * backup never creates duplicates.
 */
import type { AppData, Category, Paycheck, Settings, Transaction, TxnKind } from './types';
import { DEFAULT_CATEGORIES, defaultSettings, OTHER_CATEGORY_ID } from './defaults';
import { isISODate } from './dates';
import { centsToInput, parseCents } from './money';
import { newId, slugify } from './ids';
import { spendingEffect } from './ledger';

export const BACKUP_FORMAT = 'spend-smarter-backup';
const KINDS: TxnKind[] = ['expense', 'refund', 'cc_payment', 'transfer', 'savings', 'uncle'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  app: 'Spend Smarter';
  schemaVersion: 1;
  exportedAt: string;
  data: AppData;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const cents = (v: unknown): number | null => (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null);

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
  };
}

function sanitizePaycheck(raw: unknown): Paycheck | null {
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
  };
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
  const paychecks = (Array.isArray(root.paychecks) ? root.paychecks : []).map(sanitizePaycheck).filter((p): p is Paycheck => !!p);

  return {
    data: { schemaVersion: 1, transactions, categories, paychecks, settings: sanitizeSettings(root.settings) },
    skipped,
  };
}

export function toBackupJSON(data: AppData, now = new Date()): string {
  const file: BackupFile = { format: BACKUP_FORMAT, app: 'Spend Smarter', schemaVersion: 1, exportedAt: now.toISOString(), data };
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
    data: { ...current, settings, categories, paychecks, transactions: [...byId.values()] },
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
] as const;

function csvCell(value: string): string {
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
    categories.push({ id, name: n, emoji: '🏷️', budgetCents: null, archived: false });
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
    });
  }
  return { data: { ...current, categories, transactions }, skipped };
}
