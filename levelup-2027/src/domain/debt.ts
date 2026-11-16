/** Debt challenge tile mappings. Pure — used by both the live preview and the server. */
import { parseDollarsToCents } from "./money";

export type DebtMapping = "numbered" | "equal" | "custom";

export function buildDebtTiles(mapping: DebtMapping, targetCents: number, opts: { tileAmountCents?: number | null; custom?: string }): { tiles: number[] } | { error: string } {
  if (!Number.isSafeInteger(targetCents) || targetCents <= 0) return { error: "Enter the challenge target first." };
  if (mapping === "numbered") {
    // $1, $2, … $N, plus one remainder tile when the target isn't a triangular number of dollars.
    if (targetCents % 100 !== 0) return { error: "Numbered tiles need a whole-dollar target." };
    const dollars = targetCents / 100;
    let n = 0;
    while (((n + 1) * (n + 2)) / 2 <= dollars) n++;
    const tiles = Array.from({ length: n }, (_, i) => (i + 1) * 100);
    const rem = dollars - (n * (n + 1)) / 2;
    if (rem > 0) tiles.push(rem * 100);
    return { tiles };
  }
  if (mapping === "equal") {
    const each = opts.tileAmountCents ?? 0;
    if (!Number.isSafeInteger(each) || each <= 0) return { error: "Enter a tile amount." };
    const n = Math.floor(targetCents / each);
    if (n > 500) return { error: "That makes more than 500 tiles. Use a larger tile amount." };
    const tiles = Array.from({ length: n }, () => each);
    if (targetCents - n * each > 0) tiles.push(targetCents - n * each);
    return { tiles };
  }
  const parts = (opts.custom ?? "").split(/[\s,]+/).filter(Boolean);
  const tiles: number[] = [];
  for (const x of parts) {
    const c = parseDollarsToCents(x);
    if (c === null || c <= 0) return { error: `“${x}” isn't a valid tile amount.` };
    tiles.push(c);
  }
  return { tiles };
}
