/**
 * Extra QC beats for scripts/motion/report.ts. `f(line, word, offsetSec)` → absolute frame.
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['nasdaq_card', f('L3', 'percent,', 0.4)],
	['spx_settled', f('L3', 'four', 1.0)],
	['question_whatcaused', f('L2', 'it?', 0.2)],
	['flow_3steps', f('L5b', 'centers.', 0.3)],
	['payoff', f('L7', 'off.', 0.3)],
	['nvda_settled', f('L8', 'percent.', 0.6)],
	['green_reset', f('L10', 'dip.', 0.3)],
	['sofi_highlight', f('L11', 'long-term', 0.2)],
	['age_learning', f('L12', 'investing.', 0.2)],
	['scenarios', f('L14', 'further,', 0.5)],
	['plan', f('L14', 'plan.', 0.2)],
	['debate', f('L16', 'worse?', 0.4)],
];
