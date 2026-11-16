/** Exact money arithmetic: integer cents in, integer cents out. Never floats for stored values. */

export type Cents = number;

export function assertCents(n: number): Cents {
  if (!Number.isSafeInteger(n)) throw new Error(`Not an integer cent amount: ${n}`);
  return n;
}

/** Parse user input like "1,234.5", "$24.20", "36" → cents. Returns null when invalid. */
export function parseDollarsToCents(input: string): Cents | null {
  const s = input.trim().replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatCents(c: Cents, opts: { sign?: boolean } = {}): string {
  const neg = c < 0;
  const abs = Math.abs(c);
  const dollars = Math.floor(abs / 100).toLocaleString("en-US");
  const cents = String(abs % 100).padStart(2, "0");
  const prefix = neg ? "−" : opts.sign ? "+" : "";
  return `${prefix}$${dollars}.${cents}`;
}

/** Whole-dollar display for tiles, e.g. $141. */
export function formatWholeDollars(c: Cents): string {
  return c % 100 === 0 ? `$${(c / 100).toLocaleString("en-US")}` : formatCents(c);
}

/** Round half away from zero for non-negative integer division. */
export function divRound(numerator: number, denominator: number): number {
  if (denominator <= 0) throw new Error("denominator must be positive");
  const q = Math.floor(numerator / denominator);
  const r = numerator - q * denominator;
  return r * 2 >= denominator ? q + 1 : q;
}

// Hours are stored as integer hundredths (8.5 h = 850).
export type HoursX100 = number;

export function parseHoursX100(input: string): HoursX100 | null {
  const s = input.trim();
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

export function formatHours(h: HoursX100): string {
  const v = h / 100;
  return `${Number.isInteger(v) ? v : v.toFixed(2).replace(/0$/, "")} h`;
}

/** Multiplier is basis points: 15000 = 1.5×. */
export function overtimeRateCents(regularHourlyCents: Cents, multiplierBp: number): Cents {
  return divRound(regularHourlyCents * multiplierBp, 10_000);
}

export interface GrossEstimate {
  regularCents: Cents;
  overtimeCents: Cents;
  totalCents: Cents;
  overtimeRateCents: Cents;
}

/**
 * Estimated GROSS pay (before taxes and deductions). This is never take-home pay
 * and is never recorded as income.
 */
export function estimateGross(
  regularHoursX100: HoursX100,
  overtimeHoursX100: HoursX100,
  regularHourlyCents: Cents,
  multiplierBp: number,
): GrossEstimate {
  const otRate = overtimeRateCents(regularHourlyCents, multiplierBp);
  const regularCents = divRound(regularHoursX100 * regularHourlyCents, 100);
  const overtimeCents = divRound(overtimeHoursX100 * otRate, 100);
  return { regularCents, overtimeCents, totalCents: regularCents + overtimeCents, overtimeRateCents: otRate };
}

/** Worked minutes between two instants minus breaks → hundredths of an hour. */
export function workedHoursX100(start: Date, end: Date, breakMinutes: number): HoursX100 {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000) - breakMinutes;
  return Math.max(0, divRound(minutes * 100, 60));
}
