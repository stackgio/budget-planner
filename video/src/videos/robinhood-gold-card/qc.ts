/** Story beats for QC (absolute frames from word timestamps). */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['b_pullback_heading', f('L1', 'approved', 0.3)],
	['c_spend_2500', f('L4', 'month', 0.2)],
	['c_rate_3pct', f('L5', 'spending', 0)],
	['c_75_month', f('L5', 'month', 0.2)],
	['c_900_year', f('L6', 'before', 0.6)],
	['d_example_chip_fly', f('L9', 'points', 0.25)],
	['d_example_chip_landed', f('L9', 'send', 0)],
	['d_flow_etfs', f('L10', 'etfs', 0.6)],
	['e_first_statement', f('L14', 'show', 0)],
	['e_question', f('L15', 'investing', 0.3)],
];
