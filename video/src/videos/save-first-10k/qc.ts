/**
 * Extra QC beats for scripts/motion/report.ts. `f(line, word, offsetSec)`
 * returns the absolute frame where that word is spoken.
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['c_hook_recede', f('L2', 'about', 0.3)],
	['c_hook_1k', f('L3', '$1,000', 0.8)],
	['c_cards', f('L4', 'paycheck', 0.4)],
	['c_slider', f('L5', 'save', 0.4)],
	['c_5200', f('L6', 'year', 0.3)],
	['c_10k_weeks', f('L7', 'two', 0.5)],
	['c_25_habit', f('L10', 'habit', 0.3)],
	['c_hysa_move', f('L12', 'money', 0.3)],
	['c_auto_sheet', f('L12', 'payday', 0.35)],
	['c_spend_cuts', f('L14', 'on', 0.2)],
	['c_spend_text', f('L15', 'money', 0.2)],
	['c_extra_sources', f('L17', 'bonuses', 0.4)],
	['c_extra_split', f('L18', 'goal', 0.3)],
	['c_one_paycheck', f('L19', 'paycheck', 0.2)],
	['c_payoff_done', f('L20', 'paycheck', 0.3)],
	['c_cta_save', f('L21', 'working', 0)],
];
