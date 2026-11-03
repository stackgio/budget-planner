type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['chase_logo', f('L2', 'Chase', 0.5)],
	['chase_fee_highlight', f('L3', '$15', 0.8)],
	['chase_waive_highlight', f('L3', 'criteria', 0.3)],
	['chase_180', f('L4', 'year', 0.4)],
	['boa_timeline', f('L7', 'action', 0.2)],
	['boa_fees_highlight', f('L7', 'fees', 0.5)],
	['boa_accounts_highlight', f('L7', 'accounts', 0.4)],
	['boa_trust', f('L8', 'matters', 0.3)],
	['wf_title', f('L9', 'Fargo', 0.6)],
	['wf_accounts', f('L10', 'permission', 0.2)],
	['wf_redflag', f('L11', 'me', 0.2)],
	['end_recap', f('L13', 'everybody', 0.3)],
	['end_question', f('L14', 'again', 0.4)],
];
