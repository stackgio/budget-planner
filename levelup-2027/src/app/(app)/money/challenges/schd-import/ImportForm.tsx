"use client";
import { useMemo, useState } from "react";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { IdemKey } from "@/ui/IdemKey";
import { cn } from "@/ui/cn";
import { formatCents } from "@/domain/money";
import { schdImportAction } from "../../ledger-actions";

export function ImportForm({ days, today }: { days: { number: number; status: string }[]; today: string }) {
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [review, setReview] = useState(false);
  const [doneMsg, setDoneMsg] = useState<string | null>(null);
  const list = useMemo(() => [...sel].sort((a, b) => a - b), [sel]);
  const total = list.reduce((a, n) => a + n * 100, 0);
  const toggle = (n: number) => setSel((s) => { const x = new Set(s); if (x.has(n)) x.delete(n); else x.add(n); return x; });
  const selectable = days.filter((d) => d.status !== "COMPLETED");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-sm">
        <button type="button" className="btn-ghost btn-sm" onClick={() => setSel(new Set(selectable.map((d) => d.number)))}>Select all unverified</button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setSel(new Set())}>Clear</button>
      </div>
      <ul className="grid grid-cols-8 gap-1.5 sm:grid-cols-10" aria-label="Historical days">
        {days.map((d) => {
          const verified = d.status === "COMPLETED";
          const on = sel.has(d.number);
          return (
            <li key={d.number}>
              <button type="button" disabled={verified} aria-pressed={on} onClick={() => toggle(d.number)} aria-label={`Day ${d.number}${verified ? ", already verified" : ""}`}
                className={cn("flex aspect-square w-full items-center justify-center rounded-lg border text-xs font-semibold num",
                  verified ? "border-go bg-go text-ink-950" : on ? "border-go bg-go/15 text-go" : "border-dashed border-warn/60 text-warn")}>
                {d.number}
              </button>
            </li>
          );
        })}
      </ul>
      {doneMsg && <p role="status" className="rounded-lg border border-go/30 bg-go/10 px-3 py-2 text-sm text-go">{doneMsg}</p>}
      <p className="text-sm">{list.length} day{list.length === 1 ? "" : "s"} selected · <span className="num font-semibold">{formatCents(total)}</span></p>
      {!review ? (
        <button type="button" className="btn-primary w-full" disabled={!list.length} onClick={() => setReview(true)}>Review {list.length || ""} contribution{list.length === 1 ? "" : "s"}</button>
      ) : (
        <ActionForm action={schdImportAction} className="card space-y-4" onSuccess={() => { setDoneMsg(`${list.length} day${list.length === 1 ? "" : "s"} verified.`); setSel(new Set()); setReview(false); }}>
          <IdemKey />
          <input type="hidden" name="days" value={list.join(",")} />
          <p className="text-sm">You&apos;re confirming that you actually invested <strong>{formatCents(total)}</strong> for SCHD day{list.length === 1 ? "" : "s"} <strong className="num">{list.join(", ")}</strong>.</p>
          <Field label="When (best known date)"><input className="input" type="date" name="date" max={today} required /></Field>
          <Field label="Note (optional)"><input className="input" name="note" maxLength={300} placeholder="e.g. checked brokerage history" /></Field>
          <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" name="confirmReviewed" className="h-5 w-5 accent-[#2bea7a]" required /> I checked these against my records</label>
          <div className="flex gap-2">
            <SubmitButton className="btn-primary flex-1" pendingText="Verifying…">Verify {list.length} day{list.length === 1 ? "" : "s"}</SubmitButton>
            <button type="button" className="btn-ghost" onClick={() => setReview(false)}>Back</button>
          </div>
        </ActionForm>
      )}
    </div>
  );
}
