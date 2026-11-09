type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['hook_2s', 60],
	['ins_200', f('L2', 'extra', 0.35)],
	['gas_200', f('L2', 'four', 0.35)],
	['total_1150', f('L2', 'goes', 0.5)],
	['year_13800', f('L3', 'year', 0.3)],
	['used', f('L4', 'used', 0.3)],
	['paycheck', f('L4', 'paycheck', 0.2)],
	['question', f('L5', 'alone', 0.2)],
];
