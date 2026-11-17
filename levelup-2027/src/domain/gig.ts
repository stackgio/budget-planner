/**
 * Gig income math. Pure, integer cents, no floats for stored values.
 *
 * Vocabulary (kept separate everywhere in the UI):
 *   earnings      = what the platform reported for the work (gross + tips/bonus only when NOT already in gross)
 *   expenses      = parking/tolls + other expenses you entered
 *   mileage cost  = miles × YOUR planning cost per mile (only when you set one; never assumed)
 *   est. profit   = earnings − expenses − mileage cost  (before taxes; an estimate)
 *   deposited     = confirmed payouts only (the ledger). Logged work is never spendable money.
 */

export interface GigSessionLike {
  minutes: number;
  grossCents: number;
  tipsCents: number;
  tipsInGross: boolean;
  bonusCents: number;
  bonusInGross: boolean;
  parkingTollsCents: number;
  otherExpenseCents: number;
}

export interface MileageLike { milesHundredths: number }

/** Signed rounding half away from zero. */
export function roundDiv(n: number, d: number): number {
  if (d <= 0) throw new Error("denominator must be positive");
  const s = n < 0 ? -1 : 1;
  const a = Math.abs(n);
  const q = Math.floor(a / d);
  return s * (a - q * d >= d - (a - q * d) ? q + 1 : q) || 0;
}

/** Total earnings for one session. Tips/bonus already included in gross are never added again. */
export function sessionEarnings(s: GigSessionLike): number {
  return s.grossCents + (s.tipsInGross ? 0 : s.tipsCents) + (s.bonusInGross ? 0 : s.bonusCents);
}

export function sessionExpenses(s: GigSessionLike): number {
  return s.parkingTollsCents + s.otherExpenseCents;
}

/** Mileage cost from your own per-mile planning figure (thousandths of a dollar). Null when not set. */
export function mileageCostCents(milesHundredths: number, costPerMileMills: number | null): number | null {
  if (costPerMileMills === null) return null;
  // miles/100 × mills/1000 dollars × 100 cents = miles × mills / 1000
  return roundDiv(milesHundredths * costPerMileMills, 1000);
}

/** Per-hour rate from cents and minutes. Null when no time was recorded (never divides by zero). */
export function perHourCents(cents: number, minutes: number): number | null {
  if (!minutes || minutes <= 0) return null;
  return roundDiv(cents * 60, minutes);
}

export interface GigTotals {
  sessions: number;
  minutes: number;
  earningsCents: number;
  grossReportedCents: number;
  tipsCents: number;
  bonusCents: number;
  expensesCents: number;
  milesHundredths: number;
  mileageCostCents: number | null;
  estProfitCents: number;
  earningsPerHourCents: number | null;
  estProfitPerHourCents: number | null;
  taxReserveCents: number | null;
}

export function gigTotals(
  sessions: GigSessionLike[],
  mileage: MileageLike[],
  settings: { costPerMileMills: number | null; taxReserveBps: number | null },
): GigTotals {
  const sum = (f: (s: GigSessionLike) => number) => sessions.reduce((a, s) => a + f(s), 0);
  const minutes = sum((s) => s.minutes);
  const earnings = sum(sessionEarnings);
  const expenses = sum(sessionExpenses);
  const miles = mileage.reduce((a, m) => a + m.milesHundredths, 0);
  const mileCost = mileageCostCents(miles, settings.costPerMileMills);
  const profit = earnings - expenses - (mileCost ?? 0);
  return {
    sessions: sessions.length,
    minutes,
    earningsCents: earnings,
    grossReportedCents: sum((s) => s.grossCents),
    tipsCents: sum((s) => s.tipsCents),
    bonusCents: sum((s) => s.bonusCents),
    expensesCents: expenses,
    milesHundredths: miles,
    mileageCostCents: mileCost,
    estProfitCents: profit,
    earningsPerHourCents: perHourCents(earnings, minutes),
    estProfitPerHourCents: perHourCents(profit, minutes),
    // A planning estimate YOU configured, applied to positive estimated profit only. Not a tax calculation.
    taxReserveCents: settings.taxReserveBps === null ? null : roundDiv(Math.max(0, profit) * settings.taxReserveBps, 10_000),
  };
}

/** Progress toward the monthly target, as a whole percent capped at 100 for the bar (raw value kept). */
export function targetProgress(earningsCents: number, targetCents: number) {
  if (targetCents <= 0) return { pct: null as number | null, remainingCents: 0 };
  return { pct: Math.min(100, Math.floor((earningsCents * 100) / targetCents)), remainingCents: Math.max(0, targetCents - earningsCents) };
}

/** Minutes between two "HH:MM" times on the same work date; an end before the start means past midnight. */
export function minutesBetween(start: string, end: string): number {
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const d = toMin(end) - toMin(start);
  return d > 0 ? d : d + 1440;
}

/** Miles (hundredths) from odometer readings (tenths). */
export function milesFromOdometer(startTenths: number, endTenths: number): number | null {
  if (!Number.isSafeInteger(startTenths) || !Number.isSafeInteger(endTenths) || endTenths < startTenths) return null;
  return (endTenths - startTenths) * 10;
}

/** Parse "12.3" miles → hundredths; null when invalid. */
export function parseMiles(input: string): number | null {
  const s = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null;
  const [w, f = ""] = s.split(".");
  return Number(w) * 100 + Number((f + "00").slice(0, 2));
}

/** Parse an odometer reading "45210.4" → tenths. */
export function parseOdometer(input: string): number | null {
  const s = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d)?$/.test(s)) return null;
  const [w, f = "0"] = s.split(".");
  return Number(w) * 10 + Number(f);
}

export function formatMiles(h: number): string {
  return `${(h / 100).toLocaleString("en-US", { minimumFractionDigits: h % 100 ? 1 : 0, maximumFractionDigits: 2 })} mi`;
}

export function formatMinutes(m: number): string {
  const h = Math.floor(m / 60), r = m % 60;
  return h ? `${h}h${r ? ` ${r}m` : ""}` : `${r}m`;
}

/** CSV cell escaping, also neutralising spreadsheet formula injection. */
export function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s) && typeof v === "string") s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function centsToDecimal(c: number): string {
  const neg = c < 0, a = Math.abs(c);
  return `${neg ? "-" : ""}${Math.floor(a / 100)}.${String(a % 100).padStart(2, "0")}`;
}

export const DEFAULT_PLATFORMS = ["DoorDash", "Veho", "Instacart", "Shipt"] as const;
