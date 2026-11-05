import { loadWorkspace } from "@/lib/workspace";
import { filterTransactions } from "@/lib/txfilter";
import { toCsv } from "@/lib/csv";
import { centsToDecimalString } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ws = await loadWorkspace(); // scoped to the active workspace
  const p = new URL(req.url).searchParams;
  const txs = filterTransactions(ws.transactions, { q: p.get("q") ?? undefined, month: p.get("month") ?? undefined, account: p.get("account") ?? undefined, category: p.get("category") ?? undefined, type: p.get("type") ?? undefined });
  const acct = new Map(ws.accounts.map((a) => [a.id, a.name]));
  const cat = new Map(ws.categories.map((c) => [c.id, c.name]));
  const rows: Array<Array<string | null>> = [];
  for (const t of [...txs].reverse()) {
    if (t.splits.length) {
      for (const s of t.splits) rows.push([t.date, t.merchant, centsToDecimalString(s.amountCents), acct.get(t.accountId) ?? "", s.categoryId ? (cat.get(s.categoryId) ?? "") : "", t.type, t.transferKind, t.notes, t.tags, t.id, "split"]);
    } else rows.push([t.date, t.merchant, centsToDecimalString(t.amountCents), acct.get(t.accountId) ?? "", t.categoryId ? (cat.get(t.categoryId) ?? "") : "", t.type, t.transferKind, t.notes, t.tags, t.id, ""]);
  }
  const csv = toCsv(["Date", "Merchant", "Amount", "Account", "Category", "Type", "Transfer kind", "Notes", "Tags", "Id", "Split"], rows);
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="moneyflow-transactions-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" } });
}
