// DMM-006 timing — derived from the narration's word timestamps (voice.words.json,
// ElevenLabs alignment). Pure data so the SFX script uses the same events.
import voice from './voice.words.json';

export const FPS = 30;
export const VO_OFFSET = 6; // narration starts at 0.2 s
export const WORDS = voice.words as {text: string; start: number; end: number}[];
export const ws = (i: number) => Math.round(WORDS[i].start * FPS) + VO_OFFSET;
export const we = (i: number) => Math.round(WORDS[i].end * FPS) + VO_OFFSET;

// word indices (checked against voice.words.json)
const W = {fifteen: 0, nothing: 5, but: 6, one: 11, streaming: 12, music: 13, cloud: 14, app: 17, gym: 19, oneMore: 22, thats: 24, ninety: 25, over: 28, thousand: 30, year: 32, check: 33, subscriptions: 35};
const expect: Record<keyof typeof W, string> = {fifteen: 'Fifteen', nothing: 'nothing.', but: 'But', one: 'one.', streaming: 'Streaming.', music: 'Music.', cloud: 'Cloud', app: 'app.', gym: 'gym', oneMore: 'One', thats: "That's", ninety: 'ninety', over: 'Over', thousand: 'thousand', year: 'year.', check: 'Check', subscriptions: 'subscriptions'};
for (const k of Object.keys(W) as (keyof typeof W)[]) if (WORDS[W[k]].text !== expect[k]) throw new Error(`word ${k}: expected ${expect[k]} got ${WORDS[W[k]].text}`);

const voEnd = we(WORDS.length - 1);
export const T = {
	but: ws(W.but), // the big $15 shrinks away: "you don't pay just one"
	/** each receipt line prints on its own spoken word */
	items: [ws(W.streaming), ws(W.music), ws(W.cloud), ws(W.app), ws(W.gym), ws(W.oneMore)],
	monthTotal: ws(W.ninety) - 4, // PER MONTH $90.00 on "ninety"
	over: ws(W.over), // 12 monthly copies start fanning out (× 12)
	yearTotal: ws(W.thousand) - 4, // PER YEAR line on "thousand"
	fanDone: we(W.year) + 30,
	check: ws(W.check),
	voEnd,
	headline: voEnd + 8,
	sign: voEnd + 50,
};

/** Caption pages (never more than 2 lines): break after these word indices; key words in accent. */
export const PAGE_BREAKS = [5, 11, 13, 17, 21, 23, 27, 32, 36];
export const KEY_WORDS = [W.fifteen, W.nothing, W.ninety, W.thousand, W.year, W.subscriptions];

export const QC_BEATS: [string, number][] = [
	['a_frame0', 0],
	['a_1s', 30],
	['a_2s', 60],
	['b_items3', T.items[2] + 10],
	['b_items6', T.items[5] + 10],
	['c_month', T.monthTotal + 16],
	['c_year', T.yearTotal + 20],
	['d_fan', T.fanDone],
	['e_headline', T.headline + 26],
	['z_last', 449],
];
