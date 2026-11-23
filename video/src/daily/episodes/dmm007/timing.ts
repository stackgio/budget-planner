// DMM-007 timing — derived from the narration's word timestamps (voice.words.json,
// ElevenLabs alignment). Pure data so the SFX script uses the same events.
import voice from './voice.words.json';

export const FPS = 30;
export const VO_OFFSET = 6; // narration starts at 0.2 s
export const WORDS = voice.words as {text: string; start: number; end: number}[];
export const ws = (i: number) => Math.round(WORDS[i].start * FPS) + VO_OFFSET;
export const we = (i: number) => Math.round(WORDS[i].end * FPS) + VO_OFFSET;

// word indices (checked against voice.words.json)
const W = {surprise: 4, car: 6, doctor: 9, more: 11, one: 13, three: 15, wouldnt: 17, cash: 21, build: 22, cushion: 25, ten: 26, week: 29, forty: 34, weeks: 35};
const expect: Record<keyof typeof W, string> = {surprise: 'surprise.', car: 'car', doctor: 'doctor', more: 'More', one: 'one', three: 'three', wouldnt: "wouldn't", cash: 'cash.', build: 'Build', cushion: 'cushion.', ten: 'Ten', week: 'week', forty: 'forty', weeks: 'weeks.'};
for (const k of Object.keys(W) as (keyof typeof W)[]) if (WORDS[W[k]].text !== expect[k]) throw new Error(`word ${k}: expected ${expect[k]} got ${WORDS[W[k]].text}`);

const voEnd = we(WORDS.length - 1);
export const T = {
	surprise: ws(W.surprise), // rain gets heavy
	car: ws(W.car), // "CAR REPAIR" bill drop
	doctor: ws(W.doctor), // "DOCTOR BILL" bill drop
	people: ws(W.more) - 4, // three adults appear
	oneInThree: ws(W.one), // one of the three is marked NOT COVERED
	stat: ws(W.wouldnt), // 37% panel
	build: ws(W.build), // umbrella opens over that person
	fillStart: ws(W.ten), // EMERGENCY FUND fills $10 a week
	fillDone: voEnd + 50, // week 40 = $400 (continues past the voice: a designed payoff)
	voEnd,
	headline: voEnd + 12,
	sign: voEnd + 90,
};

/** Caption pages (never more than 2 lines): break after these word indices; key words in accent. */
export const PAGE_BREAKS = [4, 7, 10, 16, 21, 25, 29, 35];
export const KEY_WORDS = [W.surprise, W.one, W.three, W.cushion, W.ten, W.forty];

export const QC_BEATS: [string, number][] = [
	['a_frame0', 0],
	['a_1s', 30],
	['a_2s', 60],
	['b_bills', T.doctor + 12],
	['c_people', T.oneInThree + 14],
	['c_stat', T.stat + 20],
	['d_umbrella', T.build + 20],
	['e_fill_mid', Math.round((T.fillStart + T.fillDone) / 2)],
	['e_full', T.fillDone + 10],
	['f_headline', T.headline + 30],
	['z_last', 449],
];
