// DMM-006 · every on-screen number (hypothetical EXAMPLE, computed in code).
// Six example subscriptions at $15/month each. Cash totals only (no interest, no growth).
import {fact} from '../../../story/lib/meta';

export const EACH = fact(15, 'hypothetical', 'Example price of one subscription per month');
export const ITEMS = ['STREAMING', 'MUSIC', 'CLOUD STORAGE', 'AN APP', 'GYM YOU SKIP', 'ONE MORE'] as const;
export const COUNT = fact(ITEMS.length, 'hypothetical', 'Example number of subscriptions');
export const MONTHLY = fact(EACH.value * COUNT.value, 'computed', '$15 × 6');
export const YEARLY = fact(MONTHLY.value * 12, 'computed', '$90 × 12 months');

export const money = (n: number) => `$${n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

// The narration says "ninety a month" and "over a thousand a year".
if (MONTHLY.value !== 90 || YEARLY.value !== 1080 || !(YEARLY.value > 1000)) throw new Error('facts drifted');
