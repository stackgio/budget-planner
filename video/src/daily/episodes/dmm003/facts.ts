// DMM-003 · every on-screen number (hypothetical example, computed in code).
import {fact} from '../../../story/lib/meta';

export const PAYCHECK = fact(3000, 'hypothetical', 'Example monthly take-home pay');
export const SAVE_RATE = fact(0.1, 'hypothetical', 'Example: save 10% first');
export const SAVE_MONTHLY = fact(Math.round(PAYCHECK.value * SAVE_RATE.value), 'computed', '3000 × 10%');
export const SAVE_YEARLY = fact(SAVE_MONTHLY.value * 12, 'computed', '300 × 12 months, cash only, no interest');
if (SAVE_MONTHLY.value !== 300 || SAVE_YEARLY.value !== 3600) throw new Error('facts mismatch');
