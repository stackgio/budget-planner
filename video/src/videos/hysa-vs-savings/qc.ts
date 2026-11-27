/**
 * Extra QC beats (added to the automatic ones). `f(line, word, offsetSec)`
 * returns the absolute frame where that word is spoken.
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['c_hundreds_tag', f('L1', 'hundreds', 0.6)],
	['c_big_ladder', f('L4', 'earns', 0.2)],
	['c_one_fifty', f('L4', 'fifty', 0.5)],
	['c_gum', f('L5', 'than', 0)],
	['c_hysa_ladder', f('L7', 'seven', 0)],
	['c_705', f('L7', 'for', 0)],
	['c_tags', f('L8', 'tellers', 0.5)],
	['c_cash_to_you', f('L9', 'cash', 0.1)],
	['c_250k', f('L10', '$250,000', 1.2)],
];
