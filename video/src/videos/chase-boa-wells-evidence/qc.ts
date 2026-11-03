type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['hook_potential', f('L1', 'avoid', 0.1)],
	['hook_into_card3', f('L1', 'fee', 0.5)],
	['chase_logo', f('L2', 'Chase', 0.4)],
	['chase_15_x12', f('L3', 'month', 0.6)],
	['chase_waive', f('L3', 'criteria', 0.3)],
	['boa_timeline', f('L5', 'action', 0.1)],
	['boa_findings', f('L5', 'accounts', 0.25)],
	['wf_title', f('L6', 'Fargo', 0.5)],
	['wf_accounts', f('L7', 'permission', 0.4)],
	['end_22', f('L8', 'finance', 0.2)],
	['end_recap', f('L9', 'everybody', 0.3)],
	['end_question', f('L10', 'again', 0.6)],
];
