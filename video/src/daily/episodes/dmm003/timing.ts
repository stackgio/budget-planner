// DMM-003 timing — derived from the narration's word timestamps (voice.words.json,
// ElevenLabs alignment). Pure data so the audio script uses the same events.
import voice from './voice.words.json';

export const FPS = 30;
export const VO_OFFSET = 6; // narration starts at 0.2 s
export const WORDS = voice.words as {text: string; start: number; end: number}[];
/** Frame where word #i (0-based) starts / ends. */
export const ws = (i: number) => Math.round(WORDS[i].start * FPS) + VO_OFFSET;
export const we = (i: number) => Math.round(WORDS[i].end * FPS) + VO_OFFSET;

// word indices (checked against voice.words.json)
const W = {saving1: 4, last: 8, rent: 9, food: 10, fun: 11, savings1: 14, left: 17, usually: 18, nothing: 19, flip: 20, savings2: 22, first: 23, payday: 25, then: 26, live: 27, rest: 30};
const expect: Record<keyof typeof W, string> = {saving1: 'saving.', last: 'last.', rent: 'Rent,', food: 'food,', fun: 'fun,', savings1: 'savings', left: 'left.', usually: 'Usually', nothing: 'nothing.', flip: 'Flip', savings2: 'Savings', first: 'first,', payday: 'payday.', then: 'Then', live: 'live', rest: 'rest.'};
for (const k of Object.keys(W) as (keyof typeof W)[]) if (WORDS[W[k]].text !== expect[k]) throw new Error(`word ${k}: expected ${expect[k]} got ${WORDS[W[k]].text}`);

export const T = {
	last: ws(W.last),
	rent: ws(W.rent),
	food: ws(W.food),
	fun: ws(W.fun),
	toSavings: ws(W.savings1),
	left: ws(W.left),
	usually: ws(W.usually),
	nothing: ws(W.nothing),
	flip: ws(W.flip),
	savings2: ws(W.savings2),
	first: ws(W.first),
	payday: ws(W.payday),
	then: ws(W.then),
	live: ws(W.live),
	rest: ws(W.rest),
	voEnd: we(WORDS.length - 1),
	endCard: we(WORDS.length - 1) + 22,
	yearCallout: we(WORDS.length - 1) + 34,
	sign: we(WORDS.length - 1) + 70,
};

/** Caption pages: break after these word indices; key words in accent. */
export const PAGE_BREAKS = [4, 8, 11, 14, 17, 19, 21, 25, 30];
export const KEY_WORDS = [W.saving1, W.last, W.nothing, W.flip, W.savings2, W.first];

export const QC_BEATS: [string, number][] = [
	['a_frame0', 0],
	['a_1s', 30],
	['b_last', T.last + 8],
	['b_fun_full', T.toSavings + 4],
	['b_nothing', T.nothing + 8],
	['c_flip_mid', T.flip + 12],
	['c_savings_full', T.payday + 4],
	['c_rest', T.rest + 14],
	['d_endcard', T.yearCallout + 20],
	['z_last', 449],
];
