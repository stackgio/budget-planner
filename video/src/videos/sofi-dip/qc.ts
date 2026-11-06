type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['buy_marker', f('L4', 'bought', 0.6)],
	['nasdaq', f('L5', '5.5%', 1.4)],
	['spx', f('L6', '4%.', 0.8)],
	['sofi_ticker', f('L8', 'SoFi', 0.4)],
	['proof_1', f('L9', 'Why?', 0.3)],
	['revenue', f('L10', 'billion', 0.9)],
	['members', f('L11', 'members.', 0.3)],
	['marcus_laptop', f('L12', 'learning', 0)],
	['example_buy', f('L13', 'deal.', 0)],
	['example_further', f('L14', 'further.', 0.3)],
	['proof_chips', f('L16', 'more.', 0.3)],
	['ask_split', f('L18', 'drop?', 0.3)],
];
