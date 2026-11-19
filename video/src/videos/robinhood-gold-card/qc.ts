/** Story beats for QC (absolute frames from word timestamps). */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['a_swipe_mid', 7],
	['a_swipe_beep', 14],
	['b_card_landed', f('L1', 'finally', -0.05)],
	['b_dashboard_matchcut', f('L1', 'finally', 0.1)],
	['c_spend_2500', f('L4', 'month', 0.2)],
	['c_receipt', f('L4', 'stuff', 0.2)],
	['c_rate_3pct', f('L5', 'spending', 0)],
	['c_75_month', f('L5', 'month', 0.2)],
	['c_900_year', f('L6', 'before', 0.6)],
	['d_chip_on_arrow', f('L9', 'points', 0.2)],
	['d_chip_landed', f('L9', 'send', 0)],
	['d_flow_etfs', f('L10', 'etfs', 0.6)],
	['d_before_voo', f('L12', 'more', -0.1)],
	['d_voo_cut', f('L12', 'more', 0.2)],
	['e_voo_hold', f('L13', 'regular', 0)],
	['e_first_statement', f('L14', 'show', 0)],
	['e_question', f('L15', 'investing', 0.3)],
];
