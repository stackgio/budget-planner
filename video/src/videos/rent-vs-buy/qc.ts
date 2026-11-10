/**
 * Extra QC beats for scripts/motion/report.ts (absolute frames; the cold-open
 * offset is added by report.ts via INTRO_FRAMES).
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['boom_dead', f('L1', 'boom', 0.3)],
	['ac_5000_hit', f('L1', 'five', 0.7)],
	['ac_5000_settled', f('L1', 'AC.', 0.3)],
	['bubble_buy_house', f('L3', 'buy a house', 0.6)],
	['roth_ira', f('L5', 'Roth IRA', 0.4)],
	['paycheck_30yrs', f('L8', 'plan?', 0.3)],
	['keys_closeup', f('L9', 'keys.', 0.4)],
	['july_florida', f('L10', 'July,', 0.5)],
	['ac_out', f('L10', 'out.', 0.4)],
	['call_landlord', f('L11', 'fixed.', 0)],
	['estimate_your_name', f('L12', 'your', 0.5)],
	['cooked_hold', f('L13', 'Florida', 0.5)],
	['equity_equation', f('L16', 'owe.', 0.5)],
	['mortgage_bar', f('L17', 'interest.', 0.5)],
	['price_increase', f('L18', 'four hundred', 0.9)],
	['not_profit', f('L19', 'profit.', 0.5)],
	['paid_off_stamp', f('L20', 'mortgage', 0.6)],
	['tax_deed', f('L21', 'auctioned', 0.4)],
	['reasons', f('L22', 'move.', 0.3)],
	['q_stay', f('L24', 'neighborhood?', 0.3)],
	['q_breaks', f('L25', 'breaks?', 0.5)],
	['cards_fan', f('L27', 'today,', 0.3)],
	['buy_now', f('L27', 'buying', 0.5)],
	['stack_longer', f('L27', 'longer?', 0.4)],
];
