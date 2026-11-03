/**
 * Extra QC beats for scripts/motion/report.ts. `f(line, word, offsetSec)`
 * returns the absolute frame where that word is spoken.
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['hook_stop', f('L1', 'money', 0.3)],
	['hook_worst', f('L2', 'mistake', 0.2)],
	['car_450', f('L4', 'month', 0.3)],
	['car_5400', f('L5', 'drive', 0.2)],
	['card_apr', f('L7', 'percent', 0.4)],
	['card_interest', f('L8', 'interest', 0.4)],
	['match_1600', f('L10', 'year', 0.4)],
	['match_skipped', f('L11', 'no', 0.6)],
];
