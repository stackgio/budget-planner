/** Extra QC beats (absolute frames) for scripts/motion/report.ts. */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['b_voo_active', f('L1', 'VOO', 0.3)],
	['b_schd_active', f('L2', 'SCHD', 0.3)],
	['b_difference', f('L3', 'difference?', 0.4)],
	['b_basket', f('L4', 'stocks', 0.4)],
	['c_about500', f('L6', 'big', 0.3)],
	['b_voo_mix', f('L7', 'healthcare', 0.5)],
	['b_schd_label', f('L8', 'dividends', 0.2)],
	['b_cash', f('L9', 'stock', 0.0)],
	['b_qqqm_flip', f('L10', 'QQQM', 0.4)],
	['b_vgt_flip', f('L11', 'VGT', 0.4)],
	['b_costco_pop', f('L13', 'one?', 0.1)],
	['b_costco_snap', f('L14', 'follows', 0.3)],
	['b_nasdaq', f('L15', 'Costco', 0.3)],
	['b_vgt_chips', f('L17', 'chips', 0.4)],
	['b_costco_out', f('L18', 'out', 0.3)],
	['b_end_grid', f('L20', 'inside', 0.6)],
];
