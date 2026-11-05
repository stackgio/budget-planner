import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { PageHeader, Card, CardHeader, CardBody } from "@/components/ui";
import { ImportWizard } from "./ImportWizard";

export const metadata = { title: "Import CSV" };

export default async function ImportPage() {
  const ws = await loadWorkspace();
  const batches = await prisma.importBatch.findMany({ where: { userId: ws.userId }, orderBy: { createdAt: "desc" }, take: 8 });
  const accounts = ws.accounts.filter((a) => !a.archived && a.type !== "investment");
  return (
    <>
      <Link href="/transactions" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft className="h-4 w-4" />Transactions</Link>
      <PageHeader title="Import bank CSV" subtitle="Preview, map columns, and skip duplicates. Re-importing the same file never creates copies." />
      <ImportWizard accounts={accounts.map((a) => ({ id: a.id, name: a.name, type: a.type }))} />
      {batches.length > 0 && (
        <Card className="mt-4">
          <CardHeader title="Import history" />
          <CardBody className="pt-2 text-sm">
            <ul className="divide-y divide-border">{batches.map((b) => <li key={b.id} className="flex justify-between py-2"><span className="truncate">{b.fileName} · {ws.accounts.find((a) => a.id === b.accountId)?.name}</span><span className="text-muted">{b.importedCount} new · {b.duplicateCount} dup · {b.createdAt.toISOString().slice(0, 10)}</span></li>)}</ul>
          </CardBody>
        </Card>
      )}
    </>
  );
}
