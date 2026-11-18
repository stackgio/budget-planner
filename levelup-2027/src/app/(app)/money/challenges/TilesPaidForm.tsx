"use client";
import { useState } from "react";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { IdemKey } from "@/ui/IdemKey";
import { formatCents } from "@/domain/money";
import { recordTilesAction } from "../ledger-actions";

type T = { id: string; number: number; amountCents: number };

/** "I paid these from my paycheck": pick tiles you already transferred yourself; they complete and Roulette skips them. */
export function TilesPaidForm({ tiles, sequential, today, unit }: { tiles: T[]; sequential: boolean; today: string; unit: "Tile" | "Day" }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [days, setDays] = useState(1);
  const chosen = sequential ? tiles.slice(0, days) : tiles.filter((t) => picked.includes(t.id));
  const total = chosen.reduce((a, t) => a + t.amountCents, 0);
  return (
    <ActionForm action={recordTilesAction} className="space-y-4">
      <IdemKey />
      {chosen.map((t) => <input key={t.id} type="hidden" name="tileIds" value={t.id} />)}
      <p className="text-sm text-mute-300">Only record money you <strong className="text-white">already moved yourself</strong> (for example from your regular paycheck). These {unit === "Day" ? "days" : "tiles"} are marked done and Roulette will never offer them again.</p>
      {sequential ? (
        <Field label="How many days did you fund?" hint={tiles.length ? `Starting at Day ${tiles[0]!.number}, in order.` : undefined}>
          <select className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {Array.from({ length: Math.min(10, tiles.length) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} day{n > 1 ? "s" : ""}: Day {tiles[0]!.number}{n > 1 ? `–${tiles[n - 1]!.number}` : ""} · {formatCents(tiles.slice(0, n).reduce((a, t) => a + t.amountCents, 0))}</option>
            ))}
          </select>
        </Field>
      ) : (
        <fieldset>
          <legend className="label">Tap every tile you paid</legend>
          <ul className="grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-6" aria-label="Open tiles">
            {[...tiles].reverse().map((t) => {
              const on = picked.includes(t.id);
              return (
                <li key={t.id}>
                  <button type="button" aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== t.id) : [...p, t.id]))}
                    className={on ? "w-full rounded-lg border border-go bg-go/15 py-2 text-xs font-semibold text-go" : "w-full rounded-lg border border-ink-600 py-2 text-xs text-mute-300"}>
                    #{t.number}<span className="block text-[10px] opacity-80">{formatCents(t.amountCents)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
      <Field label="Date you moved the money"><input className="input" type="date" name="date" defaultValue={today} max={today} required /></Field>
      <Field label="Note (optional)"><input className="input" name="note" maxLength={300} placeholder="e.g. from Nov 27 paycheck" /></Field>
      <p role="status" className="text-sm"><span className="text-mute-400">Selected:</span> <strong className="num">{chosen.length} · {formatCents(total)}</strong></p>
      <SubmitButton className="btn-primary w-full">Record {chosen.length || ""} as paid</SubmitButton>
    </ActionForm>
  );
}
