import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadWorkspace } from "@/lib/workspace";
import { primaryAccount } from "@/lib/overview";
import { todayISO } from "@/lib/dates";
import { Card, CardBody, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { TransactionForm } from "@/components/TransactionForm";

export const metadata = { title: "Add transaction" };

export default async function NewTx() {
  const ws = await loadWorkspace();
  const accounts = ws.accounts.filter((a) => !a.archived);
  if (!accounts.length) return <EmptyState title="Add an account first" action={<LinkButton href="/accounts">Accounts</LinkButton>} />;
  return (
    <>
      <Link href="/transactions" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" />Transactions</Link>
      <PageHeader title="Add transaction" />
      <Card className="max-w-2xl"><CardBody>
        <TransactionForm
          initial={{ type: "expense", amount: "", date: todayISO(), merchant: "", accountId: primaryAccount(ws)?.id ?? accounts[0].id, categoryId: null, billId: null, notes: null, tags: null, splits: [] }}
          categories={ws.categories.filter((c) => !c.archived)} accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))} bills={ws.bills.filter((b) => b.active)} />
      </CardBody></Card>
    </>
  );
}
