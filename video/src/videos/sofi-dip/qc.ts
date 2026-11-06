type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['hook_buy', f('L2', 'opposite.', 0)],
	['hook_proof', f('L3', 'SoFi', 0.3)],
	['nasdaq', f('L4', '5.5%,', 1.4)],
	['spx', f('L5', '4%.', 0.8)],
	['revenue', f('L7', 'billion', 0.9)],
	['members', f('L8', 'members.', 0.3)],
	['marcus_laptop', f('L9', 'learning', 0)],
	['example_buy', f('L10', 'deal.', 0)],
	['example_wait', f('L11', 'further.', 0.4)],
	['proof_chips', f('L12', 'potential,', 0.2)],
	['ask_split', f('L14', 'drop?', 0.3)],
];
