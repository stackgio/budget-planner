// DMM-007 · every on-screen number, with provenance.
import {fact} from '../../../story/lib/meta';

// Federal Reserve, "Economic Well-Being of U.S. Households in 2025" (SHED, published May 2026):
// "Sixty-three percent of adults said they would cover a hypothetical $400 emergency expense
// exclusively using cash, savings, or a credit card paid off at the next statement ('cash or its equivalent')."
export const SURPRISE = fact(400, 'historical', 'Fed SHED 2025: hypothetical $400 emergency expense');
export const WOULD_COVER_PCT = fact(63, 'historical', 'Fed SHED 2025 (May 2026): 63% would cover $400 with cash or its equivalent');
export const WOULD_NOT_PCT = fact(100 - WOULD_COVER_PCT.value, 'computed', '100% − 63%');
export const SOURCE = 'Federal Reserve, Economic Well-Being of U.S. Households in 2025 (May 2026)';

// EXAMPLE plan: $10 a week, cash only, no interest.
export const WEEKLY = fact(10, 'hypothetical', 'Example weekly saving');
export const WEEKS = fact(SURPRISE.value / WEEKLY.value, 'computed', '$400 ÷ $10');

// The narration says "more than one in three" and "forty weeks".
if (!(WOULD_NOT_PCT.value / 100 > 1 / 3)) throw new Error('claim fails: must be more than 1 in 3');
if (WEEKS.value !== 40 || WOULD_NOT_PCT.value !== 37) throw new Error('facts drifted');
