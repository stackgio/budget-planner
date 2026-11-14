// DMM-004 timing — derived from the narration's word timestamps (voice.words.json,
// ElevenLabs alignment). Pure data so the SFX script uses the same events.
import voice from './voice.words.json';

export const FPS = 30;
export const VO_OFFSET = 6; // narration starts at 0.2 s
export const WORDS = voice.words as {text: string; start: number; end: number}[];
export const ws = (i: number) => Math.round(WORDS[i].start * FPS) + VO_OFFSET;
export const we = (i: number) => Math.round(WORDS[i].end * FPS) + VO_OFFSET;

// word indices (checked against voice.words.json)
const W = {invest: 4, small: 9, years2: 10, biggest: 15, ones: 16, every: 17, ring: 21, last: 23, ten: 24, first: 29, thirty: 30, start: 31, now: 32};
const expect: Record<keyof typeof W, string> = {invest: 'invest', small: 'small', years2: 'years.', biggest: 'biggest', ones: 'ones.', every: 'Every', ring: 'ring.', last: 'last', ten: 'ten', first: 'first', thirty: 'thirty.', start: 'Start', now: 'now.'};
for (const k of Object.keys(W) as (keyof typeof W)[]) if (WORDS[W[k]].text !== expect[k]) throw new Error(`word ${k}: expected ${expect[k]} got ${WORDS[W[k]].text}`);

const voEnd = we(WORDS.length - 1);
export const T = {
	small: ws(W.small),
	biggest: ws(W.biggest),
	every: ws(W.every),
	ring: ws(W.ring),
	growDone: we(W.ring), // all 40 rings are in by the end of "ring."
	last: ws(W.last),
	first: ws(W.first),
	thirty: ws(W.thirty),
	start: ws(W.start),
	now: ws(W.now),
	voEnd,
	peel: voEnd + 4, // the outer 10 rings lift off: what a 35-year-old starter never grows
	lateTag: voEnd + 14,
	headline: voEnd + 22, // bridges the caption hand-off (no empty top)
	regrow: voEnd + 76, // start 10 years earlier: the outer rings grow back, one per year
	regrowDone: voEnd + 180,
	sign: voEnd + 88,
};

/** Caption pages: break after these word indices; key words in accent. */
export const PAGE_BREAKS = [4, 10, 16, 21, 26, 30];
export const KEY_WORDS = [W.biggest, W.ones, W.ring, W.last, W.ten, W.start, W.now];

export const QC_BEATS: [string, number][] = [
	['a_frame0', 0],
	['a_1s', 30],
	['a_2s', 60],
	['b_biggest', T.biggest + 8],
	['b_rings_done', T.growDone + 4],
	['c_last_ten', T.last + 14],
	['c_first_thirty', T.thirty + 10],
	['d_peel', T.peel + 30],
	['d_headline', T.headline + 20],
	['e_regrow_mid', Math.round((T.regrow + T.regrowDone) / 2)],
	['z_last', 449],
];
