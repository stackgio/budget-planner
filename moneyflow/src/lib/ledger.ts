import type { ISODate } from "./dates";
import type { Cents } from "./money";

/**
 * Accounting rules that keep MoneyFlow from double counting:
 *
 *  - expense  : consumption. Counts as spending, whether paid by debit or credit card.
 *  - refund   : reverses an expense; reduces spending in its category.
 *  - income   : money earned.
 *  - transfer : money moving between YOUR accounts — savings contributions,
 *               investment contributions, and credit-card / loan payments.
 *               Never counted as spending or income.
 *
 * A credit-card purchase is an expense on the card account (card balance owed goes up).
 * Paying the card is a transfer: checking goes down, card balance owed goes down.
 * The purchase is counted as spending ONCE, at purchase time.
 */

export type TxType = "expense" | "income" | "refund" | "transfer";
export const TX_TYPES: TxType[] = ["expense", "income", "refund", "transfer"];
export type TransferKind = "internal" | "debt_payment" | "savings" | "investment";

export const LIABILITY_TYPES = new Set(["credit_card", "loan", "personal_debt"]);
export const CASH_TYPES = new Set(["checking", "savings", "cash"]);

export interface TxLike {
  id?: string;
  date: ISODate;
  amountCents: Cents;
  type: string;
  accountId: string;
  categoryId: string | null;
  merchant?: string;
  createdAt?: Date;
  splits?: Array<{ categoryId: string | null; amountCents: Cents }>;
}

/** Category lines of a transaction (splits if present, otherwise the whole amount). */
export function lines(tx: TxLike): Array<{ categoryId: string | null; amountCents: Cents }> {
  if (tx.splits && tx.splits.length > 0) return tx.splits;
  return [{ categoryId: tx.categoryId, amountCents: tx.amountCents }];
}

export function validateSplits(tx: TxLike): string | null {
  if (!tx.splits || tx.splits.length === 0) return null;
  const total = tx.splits.reduce((a, s) => a + s.amountCents, 0);
  if (total !== tx.amountCents) return `Splits add up to ${total} cents but the transaction is ${tx.amountCents} cents`;
  return null;
}

/** Spending contribution of a transaction (positive = spent). Transfers & income contribute 0. */
export function spendingOf(tx: TxLike): Cents {
  if (tx.type === "expense") return -tx.amountCents; // expenses are negative on the account
  if (tx.type === "refund") return -tx.amountCents; // refunds are positive → negative spending
  return 0;
}

export function incomeOf(tx: TxLike): Cents {
  return tx.type === "income" ? tx.amountCents : 0;
}

export function totalSpending(txs: TxLike[]): Cents {
  return txs.reduce((a, t) => a + spendingOf(t), 0);
}

export function totalIncome(txs: TxLike[]): Cents {
  return txs.reduce((a, t) => a + incomeOf(t), 0);
}

export function spendingByCategory(txs: TxLike[]): Map<string | null, Cents> {
  const m = new Map<string | null, Cents>();
  for (const t of txs) {
    if (t.type !== "expense" && t.type !== "refund") continue;
    for (const l of lines(t)) m.set(l.categoryId, (m.get(l.categoryId) ?? 0) - l.amountCents);
  }
  return m;
}

export function spendingByMerchant(txs: TxLike[]): Array<{ merchant: string; cents: Cents; count: number }> {
  const m = new Map<string, { cents: Cents; count: number }>();
  for (const t of txs) {
    const s = spendingOf(t);
    if (s === 0) continue;
    const key = (t.merchant ?? "Unknown").trim();
    const cur = m.get(key) ?? { cents: 0, count: 0 };
    cur.cents += s;
    cur.count += 1;
    m.set(key, cur);
  }
  return [...m.entries()].map(([merchant, v]) => ({ merchant, ...v })).sort((a, b) => b.cents - a.cents);
}

export interface SnapshotLike {
  accountId: string;
  date: ISODate;
  balanceCents: Cents;
  createdAt?: Date;
}

/**
 * Account balance as of a date = latest snapshot on/before that date + transactions
 * after the snapshot up to `asOf`. Same-day transactions count only if they were
 * entered after the snapshot (the snapshot is "the balance at the moment you typed it"). Returns null (UNKNOWN) when the
 * account has no snapshot — a missing balance is never treated as zero.
 */
export function accountBalance(accountId: string, snapshots: SnapshotLike[], txs: TxLike[], asOf: ISODate): Cents | null {
  const snap = snapshots
    .filter((s) => s.accountId === accountId && s.date <= asOf)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0))
    .pop();
  if (!snap) return null;
  return txs
    .filter(
      (t) =>
        t.accountId === accountId &&
        t.date <= asOf &&
        (t.date > snap.date || (t.date === snap.date && !!t.createdAt && !!snap.createdAt && t.createdAt > snap.createdAt)),
    )
    .reduce((a, t) => a + t.amountCents, snap.balanceCents);
}

export interface AccountLike {
  id: string;
  type: string;
  creditLimitCents: Cents | null;
  archived?: boolean;
}

export interface NetWorth {
  assets: Cents;
  liabilities: Cents; // positive number owed
  netWorth: Cents;
  unknownAccounts: string[]; // account ids with no balance — excluded, flagged
}

export function netWorth(accounts: AccountLike[], balances: Map<string, Cents | null>): NetWorth {
  let assets = 0;
  let liabilities = 0;
  const unknownAccounts: string[] = [];
  for (const a of accounts) {
    if (a.archived) continue;
    const b = balances.get(a.id);
    if (b === null || b === undefined) {
      unknownAccounts.push(a.id);
      continue;
    }
    if (LIABILITY_TYPES.has(a.type)) liabilities += -b;
    else assets += b;
  }
  return { assets, liabilities, netWorth: assets - liabilities, unknownAccounts };
}

/** Available cash = known balances of checking/savings/cash. Credit availability is NOT cash. */
export function availableCash(accounts: AccountLike[], balances: Map<string, Cents | null>, types: Set<string> = new Set(["checking", "cash"])): { cents: Cents; unknown: string[] } {
  let cents = 0;
  const unknown: string[] = [];
  for (const a of accounts) {
    if (a.archived || !types.has(a.type)) continue;
    const b = balances.get(a.id);
    if (b === null || b === undefined) unknown.push(a.id);
    else cents += b;
  }
  return { cents, unknown };
}

export interface Utilization {
  owedCents: Cents | null;
  limitCents: Cents | null;
  /** basis points, e.g. 3000 = 30% */
  utilizationBps: number | null;
  availableCreditCents: Cents | null; // informational — never spendable cash
}

export function creditUtilization(owedCents: Cents | null, limitCents: Cents | null): Utilization {
  if (owedCents === null || limitCents === null || limitCents <= 0) {
    return { owedCents, limitCents, utilizationBps: null, availableCreditCents: null };
  }
  return {
    owedCents,
    limitCents,
    utilizationBps: Math.round((Math.max(0, owedCents) * 10_000) / limitCents),
    availableCreditCents: Math.max(0, limitCents - owedCents),
  };
}

/** Build both legs of a transfer (from → to) with a shared group id. */
export function transferLegs(params: {
  fromAccountId: string;
  toAccountId: string;
  amountCents: Cents;
  date: ISODate;
  kind: TransferKind;
  group: string;
  memo: string;
}): Array<TxLike & { transferKind: TransferKind; transferGroup: string; merchant: string }> {
  if (params.amountCents <= 0) throw new Error("Transfer amount must be positive");
  if (params.fromAccountId === params.toAccountId) throw new Error("Transfer accounts must differ");
  return [
    { date: params.date, accountId: params.fromAccountId, amountCents: -params.amountCents, type: "transfer", transferKind: params.kind, transferGroup: params.group, categoryId: null, merchant: params.memo },
    { date: params.date, accountId: params.toAccountId, amountCents: params.amountCents, type: "transfer", transferKind: params.kind, transferGroup: params.group, categoryId: null, merchant: params.memo },
  ];
}
