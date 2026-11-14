// DMM-002 · "Saving is invisible. Until it isn't." — every on-screen number.
// Hypothetical cash-saving example. No interest, no returns, no projections.
import {fact} from '../../../story/lib/meta';
import {DAYS, PER_DAY} from './timing';

export const DAILY = fact(PER_DAY, 'hypothetical', 'Example: $20 set aside per day');
export const PERIOD = fact(DAYS, 'hypothetical', 'One year of days');
export const TOTAL = fact(DAILY.value * PERIOD.value, 'computed', '20 × 365 (cash only, no interest)');

if (TOTAL.value !== 7300) throw new Error('TOTAL must be 7300');
