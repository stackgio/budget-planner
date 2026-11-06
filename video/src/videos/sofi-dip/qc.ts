type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['hook_buy', f('L2', 'opposite.', 0)],
	['hook_proof', f('L3', 'stock.', 0.3)],
	['yesterday', f('L4', 'yesterday,', 0)],
	['nasdaq', f('L5', '5.5%,', 1.4)],
	['spx', f('L6', '4%.', 0.8)],
	['opportunity', f('L7', 'opportunity.', 0.4)],
	['ticker', f('L8', 'stock.', 0)],
	['revenue', f('L10', 'billion', 0.9)],
	['members', f('L11', 'members.', 0.3)],
	['marcus_laptop', f('L12', 'learning', 0)],
	['example_buy', f('L13', 'deal.', 0)],
	['example_wait', f('L14', 'further.', 0.2)],
	['decision', f('L16', 'more.', 0.3)],
	['ask_split', f('L18', 'drop?', 0.3)],
	['disclaimer', f('L20', 'research.', 0.5)],
];
