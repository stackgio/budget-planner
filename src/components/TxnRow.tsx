import type { Transaction } from '../lib/types';
import { KIND_LABELS } from '../lib/types';
import { formatCents } from '../lib/money';
import { formatDay } from '../lib/dates';
import { useStore } from '../store';

const KIND_ICONS: Record<string, string> = { cc_payment: '💳', transfer: '🔄', savings: '🏦', uncle: '👤', refund: '↩️', debt_payment: '📉' };

export function TxnRow({ txn, onOpen, showDate }: { txn: Transaction; onOpen: (t: Transaction) => void; showDate?: boolean }) {
  const { data } = useStore();
  const category = data.categories.find((c) => c.id === txn.categoryId);
  const icon = txn.kind === 'expense' ? category?.emoji ?? '📦' : KIND_ICONS[txn.kind];
  const sub = [
    showDate ? formatDay(txn.date) : null,
    txn.kind === 'expense' ? category?.name : txn.kind === 'refund' ? `Refund · ${category?.name ?? ''}` : KIND_LABELS[txn.kind],
    txn.paymentMethod,
  ]
    .filter(Boolean)
    .join(' · ');
  const amountClass = txn.kind === 'refund' ? 'credit' : txn.kind === 'expense' ? '' : 'neutral';
  return (
    <button className="txn" onClick={() => onOpen(txn)}>
      <span className="txn-icon" aria-hidden>{icon}</span>
      <span className="grow">
        <div className="txn-title ellipsis">
          {txn.description}
          {txn.needWant && <span className={`tag ${txn.needWant}`}>{txn.needWant === 'need' ? 'Need' : 'Want'}</span>}
        </div>
        <div className="txn-sub ellipsis">{sub}</div>
      </span>
      <span className={`txn-amt num ${amountClass}`}>
        {txn.kind === 'refund' ? '+' : txn.kind === 'expense' ? '' : ''}
        {formatCents(txn.amountCents)}
      </span>
    </button>
  );
}
