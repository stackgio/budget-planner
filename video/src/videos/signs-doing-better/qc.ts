/** Story-specific QC beats: each number landing and each key Marcus action. */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['c_hook_reveal', f('L2', 'think', 0.3)],
	['c_three_cards', f('L3', 'realize', 0.2)],
	['c_five_dollars', f('L4', 'dollars', 0.4)],
	['c_contrib_60', f('L5', 'future', 0.6)],
	['c_apr_badge', f('L6', 'debt', 0.2)],
	['c_interest_20', f('L7', 'seriously', 0.4)],
	['c_interest_leaves', f('L7', 'down', 0.4)],
	['c_fund_500', f('L8', 'thousand', 0.5)],
	['c_repair_paid', f('L9', 'debt', 0.6)],
	['c_walk_away', f('L10', 'rich', 0.4)],
	['c_age_21', f('L11', '21', 0.5)],
	['c_start_today', f('L13', 'today', 0.8)],
];
