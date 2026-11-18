// DMM-005 (v2, clarity rework) timing — derived from the narration's word timestamps
// (voice.words.json, ElevenLabs alignment). Pure data so the SFX script uses the same events.
import voice from './voice.words.json';

export const FPS = 30;
export const VO_OFFSET = 6; // narration starts at 0.2 s
export const WORDS = voice.words as {text: string; start: number; end: number}[];
export const ws = (i: number) => Math.round(WORDS[i].start * FPS) + VO_OFFSET;
export const we = (i: number) => Math.round(WORDS[i].end * FPS) + VO_OFFSET;

// word indices (checked against voice.words.json)
const W = {two: 0, same: 2, seven: 3, one: 7, spends: 8, car: 12, payment: 13, everyone: 15, other: 19, invests: 20, instead: 22, nobody: 24, ten: 27, investor: 31, hundred: 36, twenty: 37, thousand: 38};
const expect: Record<keyof typeof W, string> = {two: 'Two', same: 'same', seven: 'seven', one: 'One', spends: 'spends', car: 'car', payment: 'payment,', everyone: 'everyone', other: 'other', invests: 'invests', instead: 'instead,', nobody: 'nobody', ten: 'Ten', investor: 'investor', hundred: 'hundred', twenty: 'twenty', thousand: 'thousand.'};
for (const k of Object.keys(W) as (keyof typeof W)[]) if (WORDS[W[k]].text !== expect[k]) throw new Error(`word ${k}: expected ${expect[k]} got ${WORDS[W[k]].text}`);

const voEnd = we(WORDS.length - 1);
export const T = {
	same: ws(W.same), // "$700/MO" appears over both people
	one: ws(W.one), // person A's role pill
	car: ws(W.car), // the car lands on A's floe
	everyone: ws(W.everyone), // A's car is "seen" (glow rays)
	other: ws(W.other), // person B's role pill
	invests: ws(W.invests), // B's hidden mass starts growing, month 0
	nobody: ws(W.nobody), // "NOBODY SEES IT" tag under water
	ten: ws(W.ten),
	growDone: we(W.thousand), // month 120 lands with "thousand."
	thousand: ws(W.thousand),
	voEnd,
	headline: voEnd + 10,
	glint: voEnd + 40,
	sign: voEnd + 60,
};

/** Caption pages: break after these word indices; key words in accent. */
export const PAGE_BREAKS = [1, 6, 13, 17, 22, 26, 29, 33, 38]; // short pages: never more than 2 lines (clarity rule)
export const KEY_WORDS = [W.spends, W.invests, W.instead, W.investor, W.hundred, W.twenty, W.thousand];

export const QC_BEATS: [string, number][] = [
	['a_frame0', 0],
	['a_1s', 30],
	['a_2s', 60],
	['b_car', T.everyone + 8],
	['b_invests', T.nobody + 8],
	['c_grow_mid', Math.round((T.invests + T.growDone) / 2)],
	['c_grow_done', T.growDone + 4],
	['d_headline', T.headline + 26],
	['e_glint', T.glint + 30],
	['z_last', 449],
];
