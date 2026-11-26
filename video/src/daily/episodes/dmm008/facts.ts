// DMM-008 · every on-screen number, with provenance.
import {fact} from '../../../story/lib/meta';

// FDIC, "National Rates and Rate Caps – November 2026" (fdic.gov, last updated November 16, 2026):
// national deposit rate for Savings = 0.39 (%).
export const AVG_RATE = fact(0.39, 'historical', 'FDIC national rate, savings accounts, Nov 16 2026: 0.39%');
export const SOURCE = 'FDIC national rate for savings accounts, November 2026';

// EXAMPLE rate for a high-yield (often online) savings account. Advertised top rates on
// Nov 24–25, 2026 were up to 4.70%–5.00% APY (Fortune, Investopedia). 4.00% is a rounder,
// lower example. Rates are variable: not guaranteed.
export const EXAMPLE_RATE = fact(4.0, 'hypothetical', 'EXAMPLE high-yield savings APY (variable, not guaranteed)');

// EXAMPLE balance, the same for both people, untouched for one year.
export const SAVED = fact(5000, 'hypothetical', 'Example savings balance (both people)');

// Interest is credited monthly; with an APY, one full year = balance × APY exactly.
const monthly = (apyPct: number) => Math.pow(1 + apyPct / 100, 1 / 12) - 1;
/** Interest earned after m months (0–12), compounded monthly at the given APY. */
export const earned = (apyPct: number, m: number) => SAVED.value * (Math.pow(1 + monthly(apyPct), m) - 1);

export const YEAR_A = fact(earned(AVG_RATE.value, 12), 'computed', '$5,000 × 0.39% = $19.50');
export const YEAR_B = fact(earned(EXAMPLE_RATE.value, 12), 'computed', '$5,000 × 4.00% = $200');
export const MONTHS = 12;
export const DIFF = fact(YEAR_B.value - YEAR_A.value, 'computed', '$200 − $19.50 = $180.50');

// The narration says "ten times more", "about twenty dollars" and "two hundred".
if (Math.round(EXAMPLE_RATE.value / AVG_RATE.value) !== 10) throw new Error('claim fails: ten times more');
if (Math.abs(YEAR_A.value - 19.5) > 0.01 || Math.abs(YEAR_B.value - 200) > 0.01) throw new Error('facts drifted');
if (Math.round(YEAR_A.value / 10) * 10 !== 20) throw new Error('claim fails: about $20');
