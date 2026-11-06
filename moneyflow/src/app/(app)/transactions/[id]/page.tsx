import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { loadWorkspace } from "@/lib/workspace";
import { centsToDecimalString, formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { deleteTransaction } from "@/app/actions";
import { ActionForm } from "@/components/shell/ActionForm";
import { ConfirmButton } from "@/components/shell/SubmitButton";
import { Badge, Card, CardBody, Notice, PageHeader } from "@/components/ui";
import { TransactionForm } from "@/components/TransactionForm";

export default async function EditTx({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ws = await loadWorkspace();
  const t = ws.transactions.find((x) => x.id === id);
  if (!t) notFound();
  const legs = t.transferGroup ? ws.transactions.filter((x) => x.transferGroup === t.transferGroup) : [];
  const name = (aid: string) => ws.accounts.find((a) => a.id === aid)?.name ?? "?";
  return (
    <>
      <Link href="/transactions" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" />Transactions</Link>
      <PageHeader title={t.merchant} subtitle={`${formatDate(t.date, "long")} · ${name(t.accountId)}`} actions={<>{t.importBatchId && <Badge tone="info">Imported</Badge>}<Badge>{t.type}</Badge></>} />
      <Card className="max-w-2xl"><CardBody>
        {t.type === "transfer" ? (
          <div className="space-y-3">
            <Notice tone="info" title={`Transfer${t.transferKind === "debt_payment" ? " · debt payment" : t.transferKind ? ` · ${t.transferKind}` : ""} — not counted as spending`}>
              {legs.length === 2 ? <>{formatCents(Math.abs(t.amountCents))} from <b>{name(legs.find((l) => l.amountCents < 0)!.accountId)}</b> to <b>{name(legs.find((l) => l.amountCents > 0)!.accountId)}</b>.</> : "Single-sided transfer."} To change it, delete it and add it again so both sides stay in sync.
            </Notice>
          </div>
        ) : (
          <TransactionForm
            initial={{ id: t.id, type: t.type, amount: centsToDecimalString(Math.abs(t.amountCents)), date: t.date, merchant: t.merchant, accountId: t.accountId, categoryId: t.categoryId, billId: t.billId, notes: t.notes, tags: t.tags, necessity: t.necessity, splits: t.splits.map((s) => ({ categoryId: s.categoryId ?? "", amount: centsToDecimalString(Math.abs(s.amountCents)), note: s.note ?? "" })) }}
            categories={ws.categories.filter((c) => !c.archived || c.id === t.categoryId)} accounts={ws.accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))} bills={ws.bills} />
        )}
        <ActionForm action={deleteTransaction} className="mt-6 border-t border-border pt-4">
          <input type="hidden" name="id" value={t.id} />
          <ConfirmButton variant="danger" size="sm" message={t.transferGroup ? "Delete both sides of this transfer?" : "Delete this transaction?"}>Delete{t.transferGroup ? " transfer" : ""}</ConfirmButton>
        </ActionForm>
      </CardBody></Card>
    </>
  );
}
