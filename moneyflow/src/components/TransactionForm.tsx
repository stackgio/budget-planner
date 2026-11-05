"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { saveTransaction } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { SubmitButton } from "@/components/shell/SubmitButton";
import { Button, Field, Input, MoneyInput, Select, Textarea } from "@/components/ui";
import { formatCents, parseDollars } from "@/lib/money";
import { cn } from "@/lib/utils";

type Opt = { id: string; name: string };
type Cat = Opt & { bucket: string };
type Acct = Opt & { type: string };
export type TxInitial = {
  id?: string;
  type: string;
  amount: string;
  date: string;
  merchant: string;
  accountId: string;
  categoryId: string | null;
  billId: string | null;
  notes: string | null;
  tags: string | null;
  splits: Array<{ categoryId: string; amount: string; note?: string }>;
};

const TYPES = [
  { v: "expense", l: "Expense", hint: "Spending — debit card or credit card purchase" },
  { v: "income", l: "Income", hint: "Money earned" },
  { v: "refund", l: "Refund", hint: "Reduces spending in its category" },
  { v: "transfer", l: "Transfer", hint: "Between your accounts: savings, investing, card or loan payments. Never counted as spending." },
];

export function TransactionForm({ initial, categories, accounts, bills }: { initial: TxInitial; categories: Cat[]; accounts: Acct[]; bills: Opt[] }) {
  const router = useRouter();
  const [type, setType] = useState(initial.type);
  const [amount, setAmount] = useState(initial.amount);
  const [splitOn, setSplitOn] = useState(initial.splits.length > 0);
  const [splits, setSplits] = useState(initial.splits.length ? initial.splits : [{ categoryId: "", amount: "" }, { categoryId: "", amount: "" }]);
  const editingTransfer = !!initial.id && initial.type === "transfer";
  const total = parseDollars(amount) ?? 0;
  const splitSum = useMemo(() => splits.reduce((a, s) => a + (parseDollars(s.amount) ?? 0), 0), [splits]);
  const catOpts = categories.filter((c) => (type === "income" ? c.bucket === "income" : c.bucket !== "income"));

  return (
    <ActionForm action={saveTransaction} className="space-y-4" onSuccess={() => setTimeout(() => router.push("/transactions"), 600)}>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="type" value={type} />
      <div>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-surface-2 p-1" role="radiogroup" aria-label="Transaction type">
          {TYPES.map((t) => (
            <button key={t.v} type="button" role="radio" aria-checked={type === t.v} disabled={!!initial.id && (t.v === "transfer" || editingTransfer)}
              onClick={() => setType(t.v)}
              className={cn("rounded-lg py-2 text-[13px] font-semibold transition disabled:opacity-40", type === t.v ? "bg-surface shadow-sm text-fg" : "text-muted")}>{t.l}</button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-muted">{TYPES.find((t) => t.v === type)?.hint}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Amount"><MoneyInput name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required autoFocus={!initial.id} /></Field>
        <Field label="Date"><Input type="date" name="date" defaultValue={initial.date} required /></Field>
        <Field label={type === "transfer" ? "Memo" : "Merchant / description"} className="sm:col-span-2"><Input name="merchant" defaultValue={initial.merchant} required placeholder={type === "transfer" ? "e.g. Card payment" : "e.g. Grocery store"} /></Field>
        <Field label={type === "transfer" ? "From account" : "Account"} hint={type === "expense" ? "Pick the credit card if you paid by card — it's still spending, once." : undefined}>
          <Select name="accountId" defaultValue={initial.accountId} required>{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
        </Field>
        {type === "transfer" ? (
          <Field label="To account" hint="Card/loan → debt payment · investment → contribution · savings → savings">
            <Select name="toAccountId" required defaultValue="">{<option value="" disabled>Choose…</option>}{accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
          </Field>
        ) : !splitOn ? (
          <Field label="Category"><Select name="categoryId" defaultValue={initial.categoryId ?? ""}><option value="">Uncategorized</option>{catOpts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        ) : <div />}
      </div>

      {type !== "transfer" && type !== "income" && (
        <div className="rounded-xl border border-border p-3">
          <label className="flex items-center justify-between text-sm font-medium">
            Split across categories
            <input type="checkbox" checked={splitOn} onChange={(e) => setSplitOn(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--brand))]" />
          </label>
          {splitOn && (
            <div className="mt-3 space-y-2">
              {splits.map((s, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_36px] gap-2">
                  <Select value={s.categoryId} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, categoryId: e.target.value } : x)))} aria-label="Split category">
                    <option value="">Uncategorized</option>{catOpts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </Select>
                  <MoneyInput value={s.amount} onChange={(e) => setSplits(splits.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} aria-label="Split amount" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSplits(splits.filter((_, j) => j !== i))} aria-label="Remove split"><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <Button type="button" variant="ghost" size="sm" onClick={() => setSplits([...splits, { categoryId: "", amount: "" }])}><Plus className="h-4 w-4" />Add split</Button>
                <span className={cn("text-xs tabular", splitSum === total ? "text-brand" : "text-warn")}>{formatCents(splitSum)} of {formatCents(total)}{splitSum !== total && ` · ${formatCents(total - splitSum)} left`}</span>
              </div>
              <input type="hidden" name="splits" value={JSON.stringify(splits)} />
            </div>
          )}
        </div>
      )}

      {type !== "transfer" && bills.length > 0 && (
        <Field label="Recurring bill (optional)"><Select name="billId" defaultValue={initial.billId ?? ""}><option value="">Not a bill payment</option>{bills.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tags" hint="Comma separated"><Input name="tags" defaultValue={initial.tags ?? ""} placeholder="vacation, reimbursable" /></Field>
        <Field label="Notes"><Textarea name="notes" defaultValue={initial.notes ?? ""} rows={2} /></Field>
      </div>
      <SubmitButton size="lg" className="w-full sm:w-auto">{initial.id ? "Save changes" : "Add transaction"}</SubmitButton>
    </ActionForm>
  );
}
