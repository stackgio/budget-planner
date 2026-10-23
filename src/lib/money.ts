/**
 * All money is stored and calculated as integer cents. Floats are only used
 * when formatting for display.
 */

export type Cents = number;

/**
 * Parse user input like "14.5", "$1,234.56", "35" into integer cents.
 * Returns null for anything that is not a valid, non-negative amount with at
 * most two decimal places. No floating point arithmetic is involved.
 */
export function parseCents(input: string): Cents | null {
  const cleaned = input.trim().replace(/[$,\s]/g, '');
  if (!/^\d*(\.\d{0,2})?$/.test(cleaned) || cleaned === '' || cleaned === '.') return null;
  const [whole, frac = ''] = cleaned.split('.');
  const cents = Number(whole || '0') * 100 + Number((frac + '00').slice(0, 2));
  if (!Number.isSafeInteger(cents)) return null;
  return cents;
}

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const compactFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatCents(cents: Cents): string {
  return formatter.format(cents / 100);
}

/** Whole-dollar format for chart labels. */
export function formatCentsCompact(cents: Cents): string {
  return compactFormatter.format(Math.round(cents / 100));
}

/** Format cents as a plain editable string, e.g. 1450 -> "14.50". */
export function centsToInput(cents: Cents): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

export function sumCents(values: Iterable<Cents>): Cents {
  let total = 0;
  for (const v of values) total += v;
  return total;
}

/** Integer percentage (0-∞) of part over whole; 0 when whole is 0. */
export function percentOf(part: Cents, whole: Cents): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}
