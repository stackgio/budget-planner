// DMM-008 timing — derived from the narration's word timestamps (voice.words.json,
// ElevenLabs alignment). Pure data so the SFX script uses the same events.
import voice from './voice.words.json';

export const FPS = 30;
export const VO_OFFSET = 6; // narration starts at 0.2 s
export const WORDS = voice.words as {text: string; start: number; end: number}[];
export const ws = (i: number) => Math.round(WORDS[i].start * FPS) + VO_OFFSET;
export const we = (i: number) => Math.round(WORDS[i].end * FPS) + VO_OFFSET;

// word indices (checked against voice.words.json)
const W = {ten: 5, times: 6, more: 7, two: 8, five: 13, thousand: 14, one: 16, twenty: 21, other: 26, twoB: 28, hundred: 29, check: 30, savings: 32, rate: 33, follow: 35};
const expect: Record<keyof typeof W, string> = {ten: 'ten', times: 'times', more: 'more.', two: 'Two', five: 'five', thousand: 'thousand', one: 'One', twenty: 'twenty', other: 'other', twoB: 'two', hundred: 'hundred.', check: 'Check', savings: 'savings', rate: 'rate,', follow: 'follow'};
for (const k of Object.keys(W) as (keyof typeof W)[]) if (WORDS[W[k]].text !== expect[k]) throw new Error(`word ${k}: expected ${expect[k]} got ${WORDS[W[k]].text}`);

const voEnd = we(WORDS.length - 1);
const MONTH_FRAMES = 11;
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
	people: ws(W.two), // "Two people": both banks pulse
	check: ws(W.check), // "Check your savings rate": both bank names flash
	cta: ws(W.follow) - 4, // spoken CTA "follow for more" → CTA card
	voEnd,
	headline: voEnd + 8,
};

/** Caption pages (never more than 2 lines): break after these word indices; key words in accent. */
export const PAGE_BREAKS = [4, 7, 12, 15, 19, 24, 29, 33, 37];
export const KEY_WORDS = [W.ten, W.times, W.more, W.five, W.thousand, W.twenty, W.twoB, W.hundred, W.savings, W.rate, W.follow];

export const QC_BEATS: [string, number][] = [
	['a_frame0', 0],
	['a_1s', 30],
	['a_2s', 60],
	['a_people', T.people + 20],
	['b_rateA', T.perYearA + 12],
	['c_rateB', T.perYearB + 12],
	['d_month3', T.yearStart + 3 * MONTH_FRAMES + 5],
	['e_month8', T.yearStart + 8 * MONTH_FRAMES + 5],
	['f_year', T.yearDone + 6],
	['g_cta', T.cta + 20],
	['h_headline', T.headline + 30],
	['z_last', 449],
];
