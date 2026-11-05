import Link from "next/link";
import { Download, Plus, Search, Upload } from "lucide-react";
import { loadWorkspace } from "@/lib/workspace";
import { filterTransactions } from "@/lib/txfilter";
import { formatDate } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { totalIncome, totalSpending } from "@/lib/ledger";
import { Card, CardBody, EmptyState, Input, LinkButton, PageHeader, Select } from "@/components/ui";
import { TxList } from "@/components/TxList";

export const metadata = { title: "Transactions" };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const ws = await loadWorkspace();
  const sp = await searchParams;
  const f = { q: sp.q, month: sp.month, account: sp.account, category: sp.category, type: sp.type, tag: sp.tag };
  const txs = filterTransactions(ws.transactions, f);
  const shown = txs.slice(0, 300);
  const groups = new Map<string, typeof shown>();
  for (const t of shown) groups.set(t.date, [...(groups.get(t.date) ?? []), t]);
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v) as [string, string][]).toString();
  const active = Object.values(f).some(Boolean);

  return (
    <>
      <PageHeader title="Transactions" subtitle={`${txs.length} transaction${txs.length === 1 ? "" : "s"}${active ? " match your filters" : ""}`}
        actions={<>
          <LinkButton href="/transactions/new" size="sm"><Plus className="h-4 w-4" />Add</LinkButton>
          <LinkButton href="/transactions/import" size="sm" variant="outline"><Upload className="h-4 w-4" />Import CSV</LinkButton>
          <a href={`/api/export${qs ? `?${qs}` : ""}`} className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-[13px] font-medium hover:bg-surface-2"><Download className="h-4 w-4" />Export</a>
        </>} />

      <form className="mb-4 grid gap-2 sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]" role="search">
        <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><Input name="q" defaultValue={f.q} placeholder="Search merchant, notes, tags" className="pl-9" /></div>
        <Input type="month" name="month" defaultValue={f.month} aria-label="Month" />
        <Select name="account" defaultValue={f.account ?? ""} aria-label="Account"><option value="">All accounts</option>{ws.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select>
        <Select name="category" defaultValue={f.category ?? ""} aria-label="Category"><option value="">All categories</option>{ws.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Select name="type" defaultValue={f.type ?? ""} aria-label="Type"><option value="">All types</option><option value="expense">Expenses</option><option value="income">Income</option><option value="refund">Refunds</option><option value="transfer">Transfers</option></Select>
        <div className="flex gap-2"><button className="h-10 flex-1 rounded-xl bg-fg px-4 text-sm font-medium text-bg">Filter</button>{active && <Link href="/transactions" className="grid h-10 place-items-center px-2 text-sm text-muted">Clear</Link>}</div>
      </form>

      {txs.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <span className="text-muted">Spending <b className="tabular text-fg">{formatCents(totalSpending(txs))}</b></span>
          <span className="text-muted">Income <b className="tabular text-brand">{formatCents(totalIncome(txs))}</b></span>
          <span className="text-muted">Transfers <b className="tabular text-fg">{txs.filter((t) => t.type === "transfer").length}</b> <span className="text-xs">(not spending)</span></span>
        </div>
      )}

      {txs.length === 0 ? (
        <EmptyState title={active ? "No matching transactions" : "No transactions yet"} action={<div className="flex gap-2"><LinkButton href="/transactions/new">Add manually</LinkButton><LinkButton href="/transactions/import" variant="outline">Import bank CSV</LinkButton></div>}>
          {active ? "Try clearing a filter." : "Start with manual entries or import a CSV export from your bank. MoneyFlow never asks for bank passwords."}
        </EmptyState>
      ) : (
        <Card><CardBody className="py-1">
          {[...groups.entries()].map(([d, items]) => (
            <section key={d}>
              <h3 className="sticky top-[57px] z-10 -mx-4 bg-surface/95 px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-muted backdrop-blur sm:-mx-5 sm:px-5 lg:top-0">{formatDate(d, "weekday")}</h3>
              <TxList txs={items} categories={ws.categories} accounts={ws.accounts} />
            </section>
          ))}
          {txs.length > shown.length && <p className="py-3 text-center text-sm text-muted">Showing the latest 300. Narrow the filters or export to see all.</p>}
        </CardBody></Card>
      )}
    </>
  );
}
