/**
 * Extra QC beats for scripts/motion/report.ts (added to the automatic ones:
 * frame 0, 1s, 2s, every scene, every line, last frame). `f(line, word, offsetSec)`
 * returns the absolute frame where that word is spoken.
 */
type F = (line: string, word?: string, offsetSec?: number) => number;
export const qcBeats = (f: F): [string, number][] => [
	['hook_number', f('L1', 'attention', 0.4)],
	['body_counter', f('L2', 'money', 0.8)],
];
