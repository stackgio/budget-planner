// DMM-004 · every on-screen number (hypothetical EXAMPLE, computed in code).
// $250 a month, 7%/yr average return (assumed, not guaranteed), compounded
// monthly, contributions at month end. Start at 25 → 40 years to 65;
// start at 35 → 30 years to 65.
import {fact} from '../../../story/lib/meta';

export const MONTHLY = fact(250, 'hypothetical', 'Example monthly investment');
export const RATE = fact(0.07, 'hypothetical', 'Assumed average annual return (not guaranteed)');
export const AGE_EARLY = fact(25, 'hypothetical', 'Early starter age');
export const AGE_LATE = fact(35, 'hypothetical', 'Late starter age');
export const AGE_END = fact(65, 'hypothetical', 'Both stop at 65');
export const YEARS_EARLY = AGE_END.value - AGE_EARLY.value; // 40
export const YEARS_LATE = AGE_END.value - AGE_LATE.value; // 30

const r = RATE.value / 12;
/** Balance after `years` of monthly contributions (fractional years allowed). */
export const balance = (years: number) => {
	const n = Math.max(0, years) * 12;
	return MONTHLY.value * ((Math.pow(1 + r, n) - 1) / r);
};

export const B_EARLY = fact(balance(YEARS_EARLY), 'computed', 'FV of $250/mo for 40 yrs at 7%/12 monthly');
// A late starter's 30 years end with exactly the balance the early starter had after year 30.
export const B_LATE = fact(balance(YEARS_LATE), 'computed', 'FV of $250/mo for 30 yrs at 7%/12 monthly');
export const LAST_TEN = fact(B_EARLY.value - B_LATE.value, 'computed', 'Growth added by years 31-40');
export const PUT_IN_EARLY = fact(MONTHLY.value * 12 * YEARS_EARLY, 'computed', '$250 × 480 months');
export const PUT_IN_LATE = fact(MONTHLY.value * 12 * YEARS_LATE, 'computed', '$250 × 360 months');

/** "$656K"-style rounding used on screen. */
export const k = (n: number) => `$${Math.round(n / 1000).toLocaleString('en-US')}K`;

// The narration's claim: "the last ten add more than the first thirty".
if (!(LAST_TEN.value > B_LATE.value)) throw new Error('claim fails: last 10 years must add more than the first 30');
if (k(B_EARLY.value) !== '$656K' || k(B_LATE.value) !== '$305K' || k(LAST_TEN.value) !== '$351K')
	throw new Error(`facts drifted: ${k(B_EARLY.value)} ${k(B_LATE.value)} ${k(LAST_TEN.value)}`);
