/** Story-specific QC beats (absolute frames where each number / action lands). */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['c_hook_5000', f('L1', 'same', 0.1)],
	['c_hook_zero', f('L1', 'life', 0.3)],
	['c_old_3000', f('L2', '$3,000', 0.8)],
	['c_old_gone', f('L2', 'gone', 0.1)],
	['c_raise_5000', f('L4', 'thousand', 0.3)],
	['b_car', f('L6', 'car', 0.5)],
	['b_food', f('L6', 'DoorDash', 0.5)],
	['b_shop', f('L6', 'shopping', 0.8)],
	['c_spend_gone', f('L7', 'gone', 0.6)],
	['c_realize', f('L8', "didn't", 0.6)],
	['b_inflation', f('L10', 'spend', 0.6)],
	['c_500', f('L12', 'dollars', 0.4)],
	['c_6000', f('L13', 'thousand', 0.8)],
	['b_chips', f('L13', 'debt', 0.4)],
	['b_keep', f('L15', 'keeping', 0.8)],
	['b_end', f('L17', 'lifestyle', 0.6)],
];
