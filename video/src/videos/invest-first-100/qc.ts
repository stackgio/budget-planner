/**
 * Extra QC beats (absolute frames where each number / proof lands).
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['c_hook_split', f('L1', 'buy', 0.3)],
	['c_vti_70', f('L2', 'VTI.', 0.5)],
	['c_vti_3519', f('L3', 'companies,', 0.4)],
	['c_vti_logos', f('L3', 'Amazon.', 0.5)],
	['c_market_pick', f('L4', 'stock,', 0.2)],
	['c_market_lit', f('L4', 'market.', 0.3)],
	['c_schd_102', f('L5', 'SCHD.', 1.0)],
	['c_schd_dividends', f('L6', 'dividends.', 0.4)],
	['c_schd_overlap', f('L7', 'stocks.', 0.4)],
	['c_vxus_map', f('L9', 'States.', 0.4)],
	['c_vxus_8901', f('L10', 'companies', 0.2)],
	['c_vxus_countries', f('L10', 'Canada.', 0.3)],
	['c_final_donut', f('L11', 'rich', 0.3)],
	['c_final_recurring', f('L12', 'term', 0.4)],
];
