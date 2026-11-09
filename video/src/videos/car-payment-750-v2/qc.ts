type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['hook_1s', 30],
	['hook_labels', f('L2', 'crazy', 0.3)],
	['just', f('L4', 'payment', 0.3)],
	['ins_200', f('L6', 'insurance', 0.3)],
	['gas_200', f('L6', 'gas', 0.3)],
	['month_1150', f('L7', 'month', 0.3)],
	['year_13800', f('L8', 'year', 0.4)],
	['tires', f('L8', 'repairs', 0.4)],
	['half_6900', f('L9', 'money', 0.2)],
	['save', f('L10', 'saving', 0.3)],
	['invest', f('L10', 'investing', 0.4)],
	['travel', f('L10', 'traveling', 0.5)],
	['afford', f('L12', 'afford', 0.4)],
	['used', f('L13', 'used', 0.3)],
	['worth', f('L14', 'month', 0.2)],
	['question', f('L15', 'payment', 0.2)],
];
