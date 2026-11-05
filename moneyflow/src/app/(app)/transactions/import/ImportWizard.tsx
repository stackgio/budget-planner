"use client";
import { useState, useTransition } from "react";
import { commitImport, previewImport, type ImportPreview } from "@/app/actions";
import type { CsvMapping } from "@/lib/csv";
import { Badge, Button, Card, CardBody, CardHeader, Checkbox, Field, Notice, Select } from "@/components/ui";
import { formatCents } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function ImportWizard({ accounts }: { accounts: Array<{ id: string; name: string; type: string }> }) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [skip, setSkip] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();

  const run = (csv: string, acct: string, mapping: CsvMapping | null) =>
    start(async () => {
      setResult(null);
      const p = await previewImport(csv, acct, mapping);
      setPreview(p);
      setSkip(new Set());
    });

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const t = await f.text();
    setText(t);
    setFileName(f.name);
    run(t, accountId, null);
  };
  const m = preview?.mapping;
  const setMap = (patch: Partial<CsvMapping>) => m && run(text, accountId, { ...m, ...patch });
  const cols = preview?.headers ?? [];
  const colSelect = (label: string, key: keyof CsvMapping, optional = true) => (
    <Field label={label}>
      <Select value={m?.[key] === null || m?.[key] === undefined ? "" : String(m[key])} onChange={(e) => setMap({ [key]: e.target.value === "" ? null : Number(e.target.value) } as Partial<CsvMapping>)}>
        {optional && <option value="">— none —</option>}
        {cols.map((h, i) => <option key={i} value={i}>{h}</option>)}
      </Select>
    </Field>
  );
  const rows = preview?.rows ?? [];
  const fresh = rows.filter((r) => !r.duplicate && !skip.has(r.rowIndex));
  const dups = rows.filter((r) => r.duplicate).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="1 · Choose account and file" subtitle="Download a CSV from your bank's website. MoneyFlow never asks for or stores bank passwords." />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <Field label="Import into account">
            <Select value={accountId} onChange={(e) => { setAccountId(e.target.value); if (text) run(text, e.target.value, m ?? null); }}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field label="CSV file"><input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="block w-full text-sm file:mr-3 file:h-10 file:rounded-xl file:border-0 file:bg-surface-2 file:px-4 file:text-sm file:font-medium" /></Field>
        </CardBody>
      </Card>

      {preview && !preview.ok && <Notice tone="danger" title="Couldn't read the file">{preview.error}</Notice>}

      {preview?.ok && m && (
        <Card>
          <CardHeader title="2 · Map columns" subtitle="We guessed from the header names — adjust if anything looks off." />
          <CardBody className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {colSelect("Date", "date", false)}
              {colSelect("Description", "description", false)}
              {colSelect("Amount (signed)", "amount")}
              {colSelect("Debit / money out", "debit")}
              {colSelect("Credit / money in", "credit")}
              {colSelect("Bank category", "category")}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Field label="Date format" className="w-44"><Select value={m.dateFormat ?? "auto"} onChange={(e) => setMap({ dateFormat: e.target.value as CsvMapping["dateFormat"] })}><option value="auto">Auto (MM/DD/YYYY)</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></Select></Field>
              <Checkbox label="Bank shows purchases as positive numbers (flip signs)" checked={!!m.invertAmount} onChange={(e) => setMap({ invertAmount: e.target.checked })} />
            </div>
          </CardBody>
        </Card>
      )}

      {preview?.ok && (
        <Card>
          <CardHeader title="3 · Preview" subtitle={`${rows.length} rows read · ${dups} already imported · ${preview.errors?.length ?? 0} unreadable`} />
          <CardBody className="space-y-3">
            {(preview.errors?.length ?? 0) > 0 && <Notice tone="warn" title="Some rows were skipped">{preview.errors!.slice(0, 5).map((e) => `Row ${e.rowIndex}: ${e.error}`).join(" · ")}{preview.errors!.length > 5 ? " …" : ""}</Notice>}
            <div className="max-h-[420px] overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface-2 text-left text-xs uppercase tracking-wide text-muted"><tr><th className="p-2">Import</th><th className="p-2">Date</th><th className="p-2">Description</th><th className="p-2 text-right">Amount</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.rowIndex} className={cn("border-t border-border", r.duplicate && "opacity-50")}>
                      <td className="p-2">{r.duplicate ? <Badge tone="warn">Duplicate</Badge> : <input type="checkbox" aria-label={`Import row ${r.rowIndex}`} checked={!skip.has(r.rowIndex)} onChange={(e) => { const n = new Set(skip); if (e.target.checked) n.delete(r.rowIndex); else n.add(r.rowIndex); setSkip(n); }} className="h-4 w-4 accent-[rgb(var(--brand))]" />}</td>
                      <td className="whitespace-nowrap p-2">{formatDate(r.date)}</td>
                      <td className="max-w-[260px] truncate p-2">{r.merchant}</td>
                      <td className={cn("p-2 text-right tabular", r.amountCents > 0 && "text-brand")}>{formatCents(r.amountCents, { sign: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">Outflows import as expenses and inflows as income (or refunds on cards). After importing, re-label card payments and transfers between your own accounts as <b>Transfer</b> so they aren't counted as spending.</p>
            <Button disabled={pending || fresh.length === 0} onClick={() => start(async () => { const r = await commitImport(text, accountId, m!, fileName, [...skip]); setResult(r); if (r.ok) setPreview(null); })}>
              {pending ? "Working…" : `Import ${fresh.length} transaction${fresh.length === 1 ? "" : "s"}`}
            </Button>
          </CardBody>
        </Card>
      )}
      {result && <Notice tone={result.ok ? "brand" : "danger"} title={result.ok ? "Import complete" : "Import failed"}>{result.ok ? result.message : result.error} {result.ok && <a className="text-brand underline" href="/transactions">View transactions</a>}</Notice>}
      {pending && !preview && <p className="text-sm text-muted">Reading file…</p>}
    </div>
  );
}
