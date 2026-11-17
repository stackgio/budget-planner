// DMM-005 · every on-screen number (hypothetical EXAMPLE, computed in code).
// $700 a month (an EXAMPLE car-payment-sized amount) invested for 10 years at an
// assumed 7%/yr average return (not guaranteed), compounded monthly,
// contributions at month end.
import {fact} from '../../../story/lib/meta';

export const MONTHLY = fact(700, 'hypothetical', 'Example monthly amount (car-payment sized)');
export const RATE = fact(0.07, 'hypothetical', 'Assumed average annual return (not guaranteed)');
export const YEARS = fact(10, 'hypothetical', 'Example horizon');
export const MONTHS = YEARS.value * 12;

const r = RATE.value / 12;
/** Balance after `months` monthly contributions (fractional months allowed). */
export const balance = (months: number) => {
	const n = Math.max(0, months);
	return MONTHLY.value * ((Math.pow(1 + r, n) - 1) / r);
};

export const B_FINAL = fact(balance(MONTHS), 'computed', 'FV of $700/mo for 120 months at 7%/12');
export const PUT_IN = fact(MONTHLY.value * MONTHS, 'computed', '$700 × 120 months');

export const k = (n: number) => `$${Math.round(n / 1000).toLocaleString('en-US')}K`;

// The narration says "about a hundred twenty thousand".
if (k(B_FINAL.value) !== '$121K' || PUT_IN.value !== 84000) throw new Error(`facts drifted: ${k(B_FINAL.value)} ${PUT_IN.value}`);
