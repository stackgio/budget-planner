// DMM-001 · "Same $500 raise. Two moves." — every on-screen number lives here.
// All figures are HYPOTHETICAL (an illustrative example), computed in code.
import {fact} from '../../../story/lib/meta';

export const RAISE = fact(500, 'hypothetical', 'Example monthly raise (after tax), chosen for illustration');
export const YEARS = fact(10, 'hypothetical', 'Example horizon');
export const RATE = fact(0.07, 'hypothetical', 'Hypothetical 7% nominal annual return, compounded monthly. Not a forecast; not guaranteed.');

/** How the spender's raise gets absorbed (illustrative split, sums to RAISE). */
export const SPEND_SPLIT = [
	{label: 'Nicer car', amount: 250},
	{label: 'Eating out', amount: 150},
	{label: 'Subs', amount: 100},
];

const MONTHS = YEARS.value * 12;
const r = RATE.value / 12;

/** End-of-month balance after m monthly contributions (ordinary annuity). */
export const valueAfter = (m: number) => RAISE.value * ((Math.pow(1 + r, m) - 1) / r);
/** Continuous version for smooth counters/curves (m may be fractional). */
export const valueAt = (m: number) => (m <= 0 ? 0 : valueAfter(m));

export const VALUE_SERIES = Array.from({length: MONTHS + 1}, (_, m) => valueAfter(m));
export const BASE_SERIES = Array.from({length: MONTHS + 1}, (_, m) => RAISE.value * m);

export const FINAL_VALUE = fact(Math.round(valueAfter(MONTHS)), 'computed', '500 × ((1+0.07/12)^120 − 1)/(0.07/12)');
export const TOTAL_PUT_IN = fact(RAISE.value * MONTHS, 'computed', '500 × 120 months');
export const GROWTH = fact(FINAL_VALUE.value - TOTAL_PUT_IN.value, 'computed', 'FINAL_VALUE − TOTAL_PUT_IN');
export const TOTAL_SPENT = fact(RAISE.value * MONTHS, 'computed', 'Spender: 500 × 120 months, nothing kept');

if (SPEND_SPLIT.reduce((a, b) => a + b.amount, 0) !== RAISE.value) throw new Error('SPEND_SPLIT must sum to RAISE');
