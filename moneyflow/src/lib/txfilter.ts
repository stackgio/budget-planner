import { isYearMonth, monthEnd, monthStart } from "./dates";

export type TxFilter = { q?: string; month?: string; account?: string; category?: string; type?: string; tag?: string };

type T = { date: string; merchant: string; notes: string | null; tags: string | null; accountId: string; categoryId: string | null; type: string; splits: Array<{ categoryId: string | null }> };

export function filterTransactions<X extends T>(txs: X[], f: TxFilter): X[] {
  const q = f.q?.trim().toLowerCase();
  return txs.filter((t) => {
    if (f.month && isYearMonth(f.month) && (t.date < monthStart(f.month) || t.date > monthEnd(f.month))) return false;
    if (f.account && t.accountId !== f.account) return false;
    if (f.category && t.categoryId !== f.category && !t.splits.some((s) => s.categoryId === f.category)) return false;
    if (f.type && t.type !== f.type) return false;
    if (f.tag && !(t.tags ?? "").split(",").includes(f.tag)) return false;
    if (q && !`${t.merchant} ${t.notes ?? ""} ${t.tags ?? ""}`.toLowerCase().includes(q)) return false;
    return true;
  });
}
