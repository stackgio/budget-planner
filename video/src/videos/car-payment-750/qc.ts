type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['750_hook', f('L1', 'dollars', 0.4)],
	['just_payment', f('L4', 'payment', 0.3)],
	['ins_200', f('L6', 'insurance', 0.4)],
	['gas_200', f('L6', 'gas', 0.3)],
	['1150', f('L7', 'month', 0.3)],
	['13800', f('L8', 'year', 0.4)],
	['tires', f('L8', 'repairs', 0.4)],
	['6900', f('L9', 'money', 0.3)],
	['save', f('L10', 'saving', 0.3)],
	['invest', f('L10', 'investing', 0.4)],
	['travel', f('L10', 'traveling', 0.5)],
	['afford', f('L12', 'afford', 0.5)],
	['pocket', f('L13', 'pocket', 0.2)],
	['worth', f('L14', 'month', 0.2)],
	['limit', f('L15', 'payment', 0.2)],
];
