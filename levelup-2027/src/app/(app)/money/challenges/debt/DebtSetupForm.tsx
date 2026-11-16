"use client";
import { useMemo, useState } from "react";
import { ActionForm, Field, SubmitButton } from "@/ui/form";
import { buildDebtTiles, type DebtMapping } from "@/domain/debt";
import { formatCents, parseDollarsToCents } from "@/domain/money";
import { debtSetupAction } from "../../ledger-actions";

export function DebtSetupForm() {
  const [balance, setBalance] = useState("");
  const [target, setTarget] = useState("");
  const [mapping, setMapping] = useState<DebtMapping>("numbered");
  const [tileAmount, setTileAmount] = useState("");
  const [custom, setCustom] = useState("");
  const t = parseDollarsToCents(target) ?? 0;
  const b = parseDollarsToCents(balance) ?? 0;
  const result = useMemo(() => buildDebtTiles(mapping, t, { tileAmountCents: parseDollarsToCents(tileAmount), custom }), [mapping, t, tileAmount, custom]);
  const sum = "tiles" in result ? result.tiles.reduce((a, c) => a + c, 0) : 0;
  const ok = "tiles" in result && result.tiles.length > 0 && sum === t && t > 0 && (b === 0 || t <= b);

  return (
    <ActionForm action={debtSetupAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Current balance"><input className="input" name="balance" inputMode="decimal" value={balance} onChange={(e) => setBalance(e.target.value)} required placeholder="0.00" /></Field>
        <Field label="Challenge target" hint="Usually your balance"><input className="input" name="target" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} required placeholder="0.00" /></Field>
      </div>
      <Field label="Tile mapping">
        <select className="input" name="mapping" value={mapping} onChange={(e) => setMapping(e.target.value as DebtMapping)}>
          <option value="numbered">Numbered ($1, $2, $3 … + remainder tile)</option>
          <option value="equal">Equal tiles</option>
          <option value="custom">Custom list</option>
        </select>
      </Field>
      {mapping === "equal" && <Field label="Amount per tile"><input className="input" name="tileAmount" inputMode="decimal" value={tileAmount} onChange={(e) => setTileAmount(e.target.value)} required /></Field>}
      {mapping === "custom" && <Field label="Tile amounts" hint="Separate with commas or spaces, e.g. 100, 75, 50"><textarea className="input min-h-[90px] py-2" name="customTiles" value={custom} onChange={(e) => setCustom(e.target.value)} /></Field>}
      <div className={`rounded-xl border p-3 text-sm ${ok ? "border-go/40 bg-go/5" : "border-ink-700"}`} role="status">
        {"error" in result ? <p className="text-mute-400">{result.error}</p> : (
          <>
            <p><span className="num font-semibold">{result.tiles.length}</span> tiles adding up to <span className="num font-semibold">{formatCents(sum)}</span> {t > 0 && (sum === t ? <span className="text-go">✓ matches the target</span> : <span className="text-bad">≠ target {formatCents(t)}</span>)}</p>
            {b > 0 && t > b && <p className="mt-1 text-bad">Target is more than the balance.</p>}
            {result.tiles.length > 0 && <p className="mt-1 truncate text-xs text-mute-400">{result.tiles.slice(0, 12).map((c) => formatCents(c)).join(" · ")}{result.tiles.length > 12 ? " …" : ""}</p>}
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Already paid (optional)" hint="Informational only"><input className="input" name="priorPaid" inputMode="decimal" /></Field>
        <Field label="Notes (optional)"><input className="input" name="note" maxLength={300} placeholder="e.g. Credit card" /></Field>
      </div>
      <label className="flex min-h-[44px] items-center gap-3 text-sm"><input type="checkbox" name="confirm" className="h-5 w-5 accent-[#2bea7a]" /> I reviewed the balance and tiles</label>
      <SubmitButton className="btn-primary w-full">Save debt challenge</SubmitButton>
    </ActionForm>
  );
}
