// DMM-005 timing — derived from the narration's word timestamps (voice.words.json,
// ElevenLabs alignment). Pure data so the SFX script uses the same events.
import voice from './voice.words.json';

export const FPS = 30;
export const VO_OFFSET = 6; // narration starts at 0.2 s
export const WORDS = voice.words as {text: string; start: number; end: number}[];
export const ws = (i: number) => Math.round(WORDS[i].start * FPS) + VO_OFFSET;
export const we = (i: number) => Math.round(WORDS[i].end * FPS) + VO_OFFSET;

// word indices (checked against voice.words.json)
const W = {car: 3, payment: 4, nobody: 5, invest: 9, seven: 10, ten: 15, could: 17, twenty: 23, thousand: 24, thats: 25, under: 28, surface: 30};
const expect: Record<keyof typeof W, string> = {car: 'car', payment: 'payment.', nobody: 'Nobody', invest: 'invest.', seven: 'Seven', ten: 'ten', could: 'could', twenty: 'twenty', thousand: 'thousand.', thats: "That's", under: 'under', surface: 'surface.'};
for (const k of Object.keys(W) as (keyof typeof W)[]) if (WORDS[W[k]].text !== expect[k]) throw new Error(`word ${k}: expected ${expect[k]} got ${WORDS[W[k]].text}`);

const voEnd = we(WORDS.length - 1);
export const T = {
	payment: ws(W.payment),
	nobody: ws(W.nobody), // the camera dives under the waterline
	invest: ws(W.invest),
	seven: ws(W.seven), // monthly deposits start building the hidden mass
	ten: ws(W.ten),
	could: ws(W.could),
	thousand: ws(W.thousand),
	growDone: we(W.thousand), // month 120 lands with "thousand."
	thats: ws(W.thats), // camera pulls out: tiny visible tip, huge hidden mass
	under: ws(W.under),
	voEnd,
	totals: voEnd + 6,
	headline: voEnd + 22,
	glint: voEnd + 80, // light sweeps up through the hidden mass
	sign: voEnd + 96,
};

/** Caption pages: break after these word indices; key words in accent. */
export const PAGE_BREAKS = [4, 9, 13, 16, 19, 24, 30];
export const KEY_WORDS = [W.car, W.payment, W.nobody, W.invest, W.twenty, W.thousand, W.surface];

export const QC_BEATS: [string, number][] = [
	['a_frame0', 0],
	['a_1s', 30],
	['a_2s', 60],
	['b_dive', T.invest + 6],
	['b_grow_mid', Math.round((T.seven + T.growDone) / 2)],
	['b_grow_done', T.growDone + 4],
	['c_pullout', T.under + 6],
	['d_totals', T.totals + 24],
	['d_headline', T.headline + 24],
	['e_glint', T.glint + 30],
	['z_last', 449],
];
