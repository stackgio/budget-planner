/**
 * Extra QC beats (absolute frames where each key visual should be complete).
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['b_right_card', f('L2', 'savings', 0.3)],
	['b_aligned', f('L3', 'difference?', 0.5)],
	['c_keys_500', f('L4', 'dollars', 0.6)],
	['c_500_both', f('L5', 'money', 0.3)],
	['b_interest', f('L7', 'interest', 0.6)],
	['b_highyield', f('L8', 'more.', 0.4)],
	['b_both_retire', f('L12', 'retirement.', 0.4)],
	['b_roth_deposit', f('L14', 'taxes', 0.2)],
	['b_roth_bought', f('L14', 'investments.', 0.5)],
	['b_taxfree', f('L15', 'tax-free.', 0.5)],
	['b_paycheck', f('L17', 'paycheck.', 0.5)],
	['b_match', f('L18', 'money', 0.0)],
	['b_both_labels', f('L18', 'yours.', 0.3)],
	['b_end', f('L19', '401k.', 0.6)],
];
