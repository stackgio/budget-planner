/** Extra QC beats: the moment each action lands. */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['b_rent_tile_readable', 20],
	['b_rent_set_aside_2s', 59],
	['b_rent_highlight', f('L4', 'again', 0.2)],
	['b_rent_locked', f('L4', 'it', 0.3)],
	['b_last_period', f('L6', 'time', 0.2)],
	['b_budget_bracket', f('L7', 'with', 0.3)],
	['c_20_spoken', f('L9', '20')],
	['c_20_landed', f('L10', 'easy', 0)],
	['b_minimums', f('L11', 'every', 0.9)],
	['b_extra_landed', f('L12', 'rate', 0.3)],
	['c_80_spoken', f('L15', '80')],
	['b_fun_bracket', f('L15', 'whatever', 0.3)],
	['b_fun_until', f('L15', 'check', 0.3)],
	['b_checklist', f('L16', 'this', 0)],
	['b_checklist_hold', f('L16', 'payday', 1.0, )],
];
