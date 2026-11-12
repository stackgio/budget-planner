/**
 * Extra QC beats for scripts/motion/report.ts. `f(line, word, offsetSec)`
 * returns the absolute frame where that word is spoken.
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['b_brokers', f('L4', 'Vanguard', 0.4)],
	['b_buying_power', f('L6', 'power', 0.2)],
	['b_text_steps', f('L9', 'confirm', 0.2)],
	['b_tap_search', f('L10', 'search', 0.1)],
	['b_apple_msft', f('L12', 'Microsoft', 0.6)],
	['b_gios_example', f('L15', 'example', 0)],
	['b_search_voo', f('L17', 'VOO', 0.5)],
	['b_open_voo', f('L17', 'S&P', 0)],
	['b_trade', f('L17', 'trade', 0.15)],
	['b_buy', f('L17', 'buy', 0.1)],
	['c_fraction', f('L18', 'share', 0.1)],
	['c_estimate', f('L20', 'cent', 0)],
	['c_account', f('L21', 'account', 0.3)],
	['b_swipe', f('L21', 'up', 0.1)],
	['c_queued', f('L22', 'queued', 0.4)],
	['c_zero_shares', f('L24', 'own', 0)],
	['b_recurring', f('L25', 'month', 0.3)],
	['b_dyor', f('L28', 'research', 0.2)],
	['b_cta', f('L30', 'investing', 0)],
];
