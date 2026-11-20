/**
 * Story beats to inspect (absolute frames from the narration).
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['hook_deposit', f('L1', 'paid', 0.6)],
	['bills_order_visible', f('L3', 'paycheck', 0.8)],
	['bills_rent_circled', f('L4', 'again', 0)],
	['bills_set_aside', f('L4', 'set', 1.2)],
	['groc_last_period', f('L6', 'last', 0.2)],
	['groc_this_paycheck', f('L7', 'with', 0.3)],
	['save_20_lands', f('L9', '20', 0.4)],
	['save_transfer_done', f('L9', 'now', 0.4)],
	['save_wide_after', f('L10', 'checking', 0.4)],
	['cards_both_minimums', f('L12', 'Then', -0.1)],
	['cards_extra_docked', f('L12', 'rate', 0.2)],
	['cards_most', f('L13', 'dollar', 0)],
	['fun_80_total', f('L15', 'that\'s', 0)],
	['fun_eating', f('L15', 'out', 0.1)],
	['fun_hanging', f('L15', 'hanging', 0.3)],
	['fun_bracket_until', f('L15', 'check', 0.2)],
	['end_checklist', f('L16', 'up', 0)],
];
