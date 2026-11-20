/** Extra QC beats: the moment each action lands. */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['b_hook_shrink', f('L2', 'disappearing', 0.3)],
	['b_rent_highlight', f('L4', 'again', 0.2)],
	['b_rent_set_aside', f('L4', 'it', 0.3)],
	['b_last_period', f('L6', 'time', 0.2)],
	['b_budget_bracket', f('L7', 'with', 0.3)],
	['c_20_hero', f('L9', 'bucks', 0.3)],
	['c_20_landed', f('L10', 'easy', 0)],
	['b_minimums', f('L11', 'every', 0.9)],
	['b_extra_landed', f('L12', 'rate', 0.3)],
	['c_80_total', f('L15', 'total', 0.3)],
	['b_fun_bracket', f('L15', 'whatever', 0.3)],
	['b_fun_until', f('L15', 'check', 0.3)],
	['b_checklist', f('L16', 'pull', 0)],
];
