// DMM-008 timing — derived from the narration's word timestamps (voice.words.json,
// ElevenLabs alignment). Pure data so the SFX script uses the same events.
import voice from './voice.words.json';

export const FPS = 30;
export const VO_OFFSET = 6; // narration starts at 0.2 s
export const WORDS = voice.words as {text: string; start: number; end: number}[];
export const ws = (i: number) => Math.round(WORDS[i].start * FPS) + VO_OFFSET;
export const we = (i: number) => Math.round(WORDS[i].end * FPS) + VO_OFFSET;

// word indices (checked against voice.words.json)
const W = {two: 0, five: 5, thousand: 6, one: 8, twenty: 13, other: 18, twoB: 20, hundred: 21, same: 22, different: 24, check: 26, savings: 28, rate: 29};
const expect: Record<keyof typeof W, string> = {two: 'Two', five: 'five', thousand: 'thousand', one: 'One', twenty: 'twenty', other: 'other', twoB: 'two', hundred: 'hundred.', same: 'Same', different: 'Different', check: 'Check', savings: 'savings', rate: 'rate.'};
for (const k of Object.keys(W) as (keyof typeof W)[]) if (WORDS[W[k]].text !== expect[k]) throw new Error(`word ${k}: expected ${expect[k]} got ${WORDS[W[k]].text}`);

const voEnd = we(WORDS.length - 1);
const MONTH_FRAMES = 15;
const yearStart = ws(W.hundred) + 6;
export const T = {
	saved: ws(W.five), // "$5,000 SAVED" cards pulse on both banks
	bankA: ws(W.one) - 2, // bank A's rate (0.39%) appears
	perYearA: ws(W.twenty), // "≈ $20 A YEAR" under A
	bankB: ws(W.other) - 2, // bank B's rate (EXAMPLE 4.00%) appears
	perYearB: ws(W.twoB), // "$200 A YEAR" under B
	yearStart, // month 1: the banks start mailing interest
	monthFrames: MONTH_FRAMES,
	yearDone: yearStart + 12 * MONTH_FRAMES, // month 12: $19.50 vs $200
	different: ws(W.different), // "Different bank": both bank names flash
	voEnd,
	headline: voEnd + 8,
	sign: voEnd + 110,
};

/** Caption pages (never more than 2 lines): break after these word indices; key words in accent. */
export const PAGE_BREAKS = [4, 7, 11, 16, 21, 25, 29];
export const KEY_WORDS = [W.five, W.thousand, W.twenty, W.twoB, W.hundred, W.different, W.savings, W.rate];

export const QC_BEATS: [string, number][] = [
	['a_frame0', 0],
	['a_1s', 30],
	['a_2s', 60],
	['b_rateA', T.perYearA + 12],
	['c_rateB', T.perYearB + 12],
	['d_month3', T.yearStart + 3 * MONTH_FRAMES + 5],
	['e_month8', T.yearStart + 8 * MONTH_FRAMES + 5],
	['f_year', T.yearDone + 6],
	['g_headline', T.headline + 30],
	['z_last', 449],
];
