/**
 * Decimal-safe money helpers. All amounts are integer cents.
 * Floating point is only ever used for display, never for stored values.
 */

export type Cents = number;

export function assertCents(n: number, label = "amount"): Cents {
  if (!Number.isSafeInteger(n)) throw new Error(`${label} must be an integer number of cents, got ${n}`);
  return n;
}

/** Parse a user-typed dollar string ("1,482.00", "$12.5", "(40.10)", "-3") into cents without floats. */
export function parseDollars(input: string | number | null | undefined): Cents | null {
  if (input === null || input === undefined) return null;
  let s = String(input).trim();
  if (s === "") return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) { negative = true; s = s.slice(1, -1); }
  s = s.replace(/[$,\s]/g, "").replace(/USD$/i, "");
  if (s.startsWith("-")) { negative = !negative; s = s.slice(1); }
  else if (s.startsWith("+")) s = s.slice(1);
  if (s.endsWith("-")) { negative = !negative; s = s.slice(0, -1); }
  if (!/^\d*(\.\d*)?$/.test(s) || s === "" || s === ".") return null;
  const [whole, frac = ""] = s.split(".");
  // Round half-up on the third decimal place using string arithmetic.
  const frac2 = (frac + "000").slice(0, 3);
  let cents = Number(whole || "0") * 100 + Number(frac2.slice(0, 2));
  if (Number(frac2[2]) >= 5) cents += 1;
  if (!Number.isSafeInteger(cents)) return null;
  return negative ? -cents : cents;
}

export function formatCents(c: Cents | null | undefined, opts: { sign?: boolean; compact?: boolean; noCents?: boolean } = {}): string {
  if (c === null || c === undefined) return "—";
  const neg = c < 0;
  const abs = Math.abs(c);
  let body: string;
  if (opts.compact && abs >= 100_000_00) {
    body = "$" + (abs / 100_000_00).toFixed(1).replace(/\.0$/, "") + "M";
  } else if (opts.compact && abs >= 10_000_00) {
    body = "$" + (abs / 100_000).toFixed(1).replace(/\.0$/, "") + "k";
  } else {
    const dollars = Math.floor(abs / 100).toLocaleString("en-US");
    const cents = String(abs % 100).padStart(2, "0");
    body = opts.noCents ? `$${dollars}` : `$${dollars}.${cents}`;
  }
  if (neg) return "-" + body;
  if (opts.sign && c > 0) return "+" + body;
  return body;
}

/** Plain decimal string for inputs/CSV ("1482.00"). */
export function centsToDecimalString(c: Cents): string {
  const neg = c < 0;
  const abs = Math.abs(c);
  return `${neg ? "-" : ""}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function sum(values: Array<Cents | null | undefined>): Cents {
  let t = 0;
  for (const v of values) if (typeof v === "number") t += v;
  return t;
}

/** Multiply cents by a basis-point percentage (5500 = 55%), rounding half away from zero. */
export function applyBps(cents: Cents, bps: number): Cents {
  const raw = cents * bps; // exact integer
  const q = Math.trunc(raw / 10_000);
  const r = raw - q * 10_000;
  if (Math.abs(r) * 2 >= 10_000) return q + Math.sign(raw);
  return q;
}

/** Multiply cents by a rational (num/den), rounding up (ceil) — used for conservative reserves. */
export function mulDivCeil(cents: Cents, num: number, den: number): Cents {
  const raw = cents * num;
  const q = Math.floor(raw / den);
  return raw % den === 0 ? q : q + 1;
}

export function mulDivRound(cents: Cents, num: number, den: number): Cents {
  const raw = cents * num;
  const q = Math.floor(raw / den);
  const r = raw - q * den;
  return r * 2 >= den ? q + 1 : q;
}

/**
 * Split `total` across weights (basis points) so the parts sum EXACTLY to total
 * (largest-remainder method). Weights need not sum to 10000; remainder stays unassigned
 * proportionally only if weights < 10000.
 */
export function allocateByBps(total: Cents, weights: number[]): Cents[] {
  const wsum = weights.reduce((a, b) => a + b, 0);
  if (wsum === 0) return weights.map(() => 0);
  const target = wsum === 10_000 ? total : applyBps(total, wsum);
  const exact = weights.map((w) => (total * w) / 10_000);
  const floors = exact.map((x) => Math.floor(x));
  let remaining = target - floors.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  const out = [...floors];
  for (let k = 0; remaining > 0 && k < order.length; k++, remaining--) out[order[k].i] += 1;
  return out;
}

/** Decimal share strings <-> integer micro-shares (1e-6). */
export function parseShares(s: string): number {
  const t = s.trim();
  if (!/^\d*(\.\d*)?$/.test(t) || t === "" || t === ".") throw new Error(`Invalid share quantity: ${s}`);
  const [w, f = ""] = t.split(".");
  return Number(w || "0") * 1_000_000 + Number((f + "000000").slice(0, 6));
}

/** Market value of a holding = shares * price, cents, rounded. */
export function holdingValueCents(shares: string, priceCents: Cents): Cents {
  const micro = parseShares(shares);
  return mulDivRound(priceCents, micro, 1_000_000);
}
