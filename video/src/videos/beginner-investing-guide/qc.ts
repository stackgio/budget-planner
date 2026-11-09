/**
 * Extra QC beats for scripts/motion/report.ts. `f(line, word, offsetSec)`
 * returns the absolute frame where that word is spoken.
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['hook_roadmap', f('L1', 'exactly', 0.8)],
	['apps_robinhood_pick', f('L6', 'use', 0.7)],
	['account_roth_rules', f('L11', 'rules', 0.6)],
	['etf_basket_full', f('L16', 'investments', 0.2)],
	['voo_500', f('L18', 'companies', 0.6)],
	['fraction_lit', f('L19', 'started', 0.2)],
	['buy_search', f('L20', 'VOO', 0.1)],
	['buy_voo_row', f('L20', 'tap', -0.15)],
	['buy_trade_btn', f('L20', 'Trade', 0.3)],
	['buy_trade_menu', f('L20', 'Buy', -0.05)],
	['buy_est_cost', f('L20', 'dollars', 0.3)],
	['buy_review', f('L21', 'order', 0.3)],
	['buy_queued', f('L21', 'fraction', 0.5)],
	['div_amount', f('L22', 'first', 0.2)],
	['div_drip_enabled', f('L23', 'reinvestment', 0.5)],
	['div_step_reinvested', f('L23', 'automatically', 0.3)],
	['div_shares', f('L23', 'shares', 0.8)],
	['habit_total', f('L25', 'maintain', 0.2)],
	['risk_list', f('L27', 'first', 0.5)],
	['end_cta', f('L29', 'wealth', 0.1)],
];
