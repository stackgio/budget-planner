/** Extra QC beats (absolute frames). */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['keys_closeup', f('L4', 'Say', 0.15)],
	['500_both', f('L4', 'dollars', 0.4)],
	['interest', f('L7', 'interest', 0.7)],
	['hy_more', f('L8', 'more', 0.6)],
	['retire_cards', f('L11', '401(k)', 0.6)],
	['retirement_investing', f('L13', 'retirement', 0.5)],
	['roth_invest', f('L15', 'investments', 0.8)],
	['roth_taxfree', f('L16', 'tax-free', 0.6)],
	['paystub_closeup', f('L17', 'A', 0.3)],
	['paycheck_deposit', f('L18', 'paycheck', 0.6)],
	['match_both', f('L19', 'yours', 0.2)],
	['final', f('L20', '401(k)', 0.9)],
];
