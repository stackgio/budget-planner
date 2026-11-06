import Link from "next/link";
import { formatDate } from "@/lib/dates";
import { Badge, Money } from "@/components/ui";

type Tx = { id: string; date: string; merchant: string; amountCents: number; type: string; transferKind: string | null; categoryId: string | null; accountId: string; splits: unknown[]; necessity?: string | null };

export function TxList({ txs, categories, accounts }: { txs: Tx[]; categories: Array<{ id: string; name: string; color: string }>; accounts: Array<{ id: string; name: string }> }) {
  if (!txs.length) return <p className="py-4 text-sm text-muted">No transactions yet.</p>;
  return (
    <ul className="divide-y divide-border">
      {txs.map((t) => {
        const c = categories.find((x) => x.id === t.categoryId);
        const a = accounts.find((x) => x.id === t.accountId);
        return (
          <li key={t.id}>
            <Link href={`/transactions/${t.id}`} className="flex items-center gap-3 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[13px] font-semibold text-white" style={{ background: t.type === "transfer" ? "#64748b" : (c?.color ?? "#94a3b8") }}>
                {t.merchant.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.merchant}</p>
                <p className="truncate text-xs text-muted">
                  {formatDate(t.date)} · {t.type === "transfer" ? `Transfer${t.transferKind === "debt_payment" ? " · debt payment" : t.transferKind ? ` · ${t.transferKind}` : ""}` : t.splits.length ? "Split" : (c?.name ?? "Uncategorized")} · {a?.name}
                </p>
              </div>
              <div className="text-right">
                <Money cents={t.amountCents} sign className={t.amountCents > 0 ? "text-brand font-medium" : "font-medium"} />
                {t.type === "refund" && <div><Badge tone="info">Refund</Badge></div>}
                {t.type === "expense" && t.necessity && <div><Badge tone={t.necessity === "want" ? "info" : "brand"}>{t.necessity}</Badge></div>}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
