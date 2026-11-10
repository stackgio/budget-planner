/**
 * Extra QC beats (absolute frames). `f(line, word, offsetSec)` → frame where the word is spoken.
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['key_landed', 18],
	['car_beneath_1s', 30],
	['receipt_opening', f('L3', 'worst', 0.2)],
	['just_pullback', f('L4', 'just', 0.7)],
	['insurance_200', f('L6', 'insurance', 0.2)],
	['gas_200', f('L6', 'gas', 0.3)],
	['total_1150_lands', f('L7', 'one', 0.15)],
	['total_1150', f('L7', 'month', 0.3)],
	['annual_13800_lands', f('L8', 'fourteen', 0.15)],
	['annual_13800', f('L8', 'year', 0.2)],
	['tires_note', f('L8', 'yet', 0.1)],
	['half_575', f('L9', 'money', 0.2)],
	['option_traveling', f('L10', 'traveling', 0.3)],
	['go_for_it', f('L12', 'go', 0.5)],
	['key_returns_used_car', f('L13', 'reliable', 0.6)],
	['paycheck_drain', f('L14', 'money', 0.4)],
	['every_month', f('L14', 'every', 0.5)],
	['final_question', f('L15', 'payment', 0.3)],
];
