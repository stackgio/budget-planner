"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Plus, X } from "lucide-react";
import { saveTransaction } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { SubmitButton } from "@/components/shell/SubmitButton";
import { cn } from "@/lib/utils";

type Cat = { id: string; name: string; bucket: string; color: string };
type Acct = { id: string; name: string; type: string };

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * One-thumb expense entry: amount → category → done. Opens from the floating
 * "+" (iPhone) or the sidebar button (desktop). Saves a normal expense through
 * the same validated server action as the full form.
 */
export function QuickAdd({ categories, topCategoryIds, accounts, defaultAccountId, variant }: {
  categories: Cat[];
  topCategoryIds: string[];
  accounts: Acct[];
  defaultAccountId: string | null;
  variant: "fab" | "sidebar";
}) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [necessity, setNecessity] = useState("");
  const [accountId, setAccountId] = useState(defaultAccountId ?? accounts[0]?.id ?? "");
  const [date, setDate] = useState(localToday());
  const amountRef = useRef<HTMLInputElement>(null);
  // The floating button slides away while scrolling down so it never sits on top of numbers.
  const [fabHidden, setFabHidden] = useState(false);
  useEffect(() => {
    if (variant !== "fab") return;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setFabHidden(y > last && y > 80);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  const reset = () => {
    setAmount(""); setMerchant(""); setCategoryId(""); setNecessity(""); setDate(localToday());
    setAccountId(defaultAccountId ?? accounts[0]?.id ?? "");
  };
  useEffect(() => {
    if (!open) return;
    amountRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const expenseCats = categories.filter((c) => c.bucket !== "income" && c.bucket !== "transfer");
  const chips = [...topCategoryIds.map((id) => expenseCats.find((c) => c.id === id)).filter((c): c is Cat => !!c), ...expenseCats.filter((c) => !topCategoryIds.includes(c.id))].slice(0, 8);
  const selected = expenseCats.find((c) => c.id === categoryId);
  const inferred = selected ? (selected.bucket === "needs" ? "need" : selected.bucket === "guiltfree" ? "want" : null) : null;
  const merchantValue = merchant.trim() || selected?.name || "Purchase";

  if (!accounts.length) return null;

  return (
    <>
      {variant === "fab" ? (
        <button type="button" onClick={() => setOpen(true)} aria-label="Add expense"
          className={cn("fixed bottom-[calc(env(safe-area-inset-bottom)+76px)] right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-brand text-brand-fg shadow-[0_8px_24px_rgba(5,150,105,.45)] transition duration-200 active:scale-95 lg:hidden", fabHidden && "pointer-events-none translate-y-24 opacity-0")}>
          <Plus className="h-7 w-7" strokeWidth={2.6} />
        </button>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-fg shadow-sm hover:brightness-110">
          <Plus className="h-4 w-4" strokeWidth={2.6} />Add expense
        </button>
      )}

      {toast && (
        <div role="status" className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+150px)] z-50 mx-auto flex max-w-sm items-center gap-2 rounded-xl bg-fg px-4 py-3 text-sm font-medium text-bg shadow-lg lg:bottom-8">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{toast}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Add expense" onClick={(e) => e.stopPropagation()}
            className="max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 shadow-2xl animate-fade-up sm:rounded-3xl">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add expense</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-surface-2"><X className="h-5 w-5" /></button>
            </div>

            <ActionForm action={saveTransaction} className="space-y-4" onSuccess={(r) => { setOpen(false); setToast(r.message ?? "Saved"); reset(); }}>
              <input type="hidden" name="type" value="expense" />
              <input type="hidden" name="merchant" value={merchantValue} />
              <input type="hidden" name="categoryId" value={categoryId} />
              <input type="hidden" name="necessity" value={necessity} />
              <input type="hidden" name="accountId" value={accountId} />

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-semibold text-muted">$</span>
                <input ref={amountRef} autoFocus name="amount" inputMode="decimal" autoComplete="off" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required
                  className="h-16 w-full rounded-2xl border border-border bg-surface-2 pl-10 pr-4 text-[34px] font-semibold tabular tracking-tight focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/40" aria-label="Amount" />
              </div>

              <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Where? (optional, e.g. Starbucks)" aria-label="Merchant"
                className="h-11 w-full rounded-xl border border-border bg-surface px-3 focus:outline-none focus:ring-2 focus:ring-brand/40" />

              <div>
                <p className="mb-1.5 text-[13px] font-medium text-muted">Category</p>
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <button key={c.id} type="button" onClick={() => setCategoryId(categoryId === c.id ? "" : c.id)}
                      className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition", categoryId === c.id ? "border-brand bg-brand/10 text-brand" : "border-border text-fg")}>
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />{c.name}
                    </button>
                  ))}
                  <select value={chips.some((c) => c.id === categoryId) ? "" : categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="More categories"
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-[13px]">
                    <option value="">More…</option>
                    {expenseCats.filter((c) => !chips.includes(c)).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[13px] font-medium text-muted">Need or want?{inferred && !necessity && <span className="font-normal"> · {selected?.name} counts as a {inferred} unless you choose</span>}</p>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1" role="radiogroup" aria-label="Need or want">
                  {[{ v: "need", l: "Need" }, { v: "want", l: "Want" }, { v: "", l: "Skip" }].map((o) => (
                    <button key={o.l} type="button" role="radio" aria-checked={necessity === o.v} onClick={() => setNecessity(o.v)}
                      className={cn("rounded-lg py-2 text-[13px] font-semibold transition", necessity === o.v ? "bg-surface text-fg shadow-sm" : "text-muted")}>{o.l}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="block min-w-0">
                  <span className="mb-1 block text-[13px] font-medium text-muted">Paid with</span>
                  <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3">
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-[13px] font-medium text-muted">Date</span>
                  <input type="date" name="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-11 w-full min-w-0 rounded-xl border border-border bg-surface px-3" />
                </label>
              </div>

              <SubmitButton size="lg" className="w-full" disabled={!amount.trim()}>Save expense</SubmitButton>
              <p className="text-center text-xs text-muted">Card payments, income, splits or transfers? <Link href="/transactions/new" onClick={() => setOpen(false)} className="text-brand">Use the full form</Link></p>
            </ActionForm>
          </div>
        </div>
      )}
    </>
  );
}
