// Narration timing (seconds), measured from the ElevenLabs voiceover.
// Source: sherpa-onnx zipformer token timestamps, with phrase-initial words
// snapped to the silence boundaries found by ffmpeg silencedetect (-38 dB).

export const T = {
  three: 0.03, things: 0.24, i: 0.6, refuse: 0.84, debt1: 1.92, for1: 2.28, hookEnd: 2.37,
  number1: 2.95, one: 3.2, an: 3.85, expensive: 4.0, car1: 4.64, s2End: 4.87,
  imagine1: 5.38, paying: 5.72, seven: 6.12, to: 6.84, thousand: 7.16, every: 8.16, month: 8.4, car2: 9.04, car2End: 9.31,
  when: 9.52, money: 9.68, saving: 10.6, traveling: 11.16, building: 12.04, future: 12.64, s3End: 12.98,
  number2: 13.49, two: 13.76, clothes: 14.44, shoes: 15.21, s4End: 15.72,
  that: 16.08, shein: 16.17, cart: 16.65, designer: 17.09, clothes2: 17.65, expensive2: 18.21, sneakers: 18.77,
  sneakersEnd: 19.39, imagine2: 19.73, literally: 20.19, wearing: 20.83, your: 21.31, debt2: 21.55, debt2End: 21.83,
  thats: 22.12, crazy: 22.35, s5End: 22.94,
  and3: 23.38, number3: 23.59, three3: 24.07, impressing: 24.71, people1: 25.34, s6End: 25.67,
  going: 26.01, broke: 26.22, look: 27.06, rich: 27.3, richEnd: 27.67,
  just1: 27.87, approval: 28.21, from: 28.69, people2: 28.89, probably: 29.29, dont: 29.77, care: 30.33, s7End: 30.59,
  nah: 30.98, nahEnd: 31.37, if: 31.67, debt3: 32.34, just2: 32.66, impress: 33.02, somebody: 33.38,
  ive: 33.86, already: 34.14, lost: 34.62, s8End: 35.0,
  whats: 35.45, oneThing: 35.58, thing: 35.82, you: 36.14, refuse2: 36.38, to2: 36.82, go2: 36.94, into2: 37.1,
  debt4: 37.3, for4: 37.62, voEnd: 37.76,
};

export const END_S = 38.5;

// Visual scene windows (include transition overlaps)
export const SCENES = {
  hook: [0, 2.5],
  car: [2.3, 5.55],
  calendar: [5.3, 10.95],
  alts: [10.5, 13.75],
  clothes: [13.3, 16.45],
  cart: [16.0, 19.95],
  wear: [19.45, 23.2],
  impress: [22.9, 26.25],
  trap: [25.95, 31.0],
  rule: [30.9, 35.7],
  cta: [35.3, 38.5],
} as const;

/** One spoken word: display text, start, emphasis. End = next word's start (or group end). */
export type W = {w: string; s: number; g?: boolean};
export type Group = {words: W[]; e: number; y?: number};

const g = (e: number, ...words: [string, number, boolean?][]): Group => ({
  e, words: words.map(([w, s, em]) => ({w, s, g: !!em})),
});

// Every spoken word, grouped 3–6 words per caption, ≤ 2 lines.
// Green (g=true) only on the key phrases.
export const GROUPS: Group[] = [
  g(1.3, ['Three', 0.03], ['things', 0.24], ['I', 0.6], ['refuse', 0.84, true]),
  g(2.37, ['to', 1.36], ['go', 1.52], ['into', 1.72], ['debt', 1.92], ['for.', 2.28]),
  g(3.7, ['Number', 2.95], ['one,', 3.2]),
  g(4.87, ['an', 3.85], ['expensive', 4.0], ['car.', 4.64]),
  g(6.8, ['Imagine', 5.38], ['paying', 5.72], ['$700', 6.12, true]),
  g(7.95, ['to', 6.84], ['a', 7.0], ['thousand', 7.16, true], ['dollars', 7.6, true]),
  g(9.31, ['every', 8.16], ['month', 8.4], ['for', 8.72], ['a', 8.88], ['car,', 9.04]),
  g(10.08, ['when', 9.52], ['that', 9.58], ['money', 9.68], ['could', 9.96]),
  g(11.1, ['go', 10.12], ['towards', 10.28], ['saving,', 10.6, true]),
  g(12.98, ['traveling,', 11.16, true], ['or', 11.8], ['building', 12.04], ['your', 12.48], ['future.', 12.64]),
  g(15.72, ['Number', 13.49], ['two,', 13.76], ['clothes', 14.44], ['and', 14.93], ['shoes.', 15.21]),
  g(17.05, ['That', 16.08], ['SHEIN', 16.17, true], ['cart,', 16.65, true]),
  g(19.39, ['designer', 17.09], ['clothes,', 17.65], ['expensive', 18.21], ['sneakers...', 18.77]),
  g(21.83, ['Imagine', 19.73], ['literally', 20.19], ['wearing', 20.83, true], ['your', 21.31, true], ['debt.', 21.55, true]),
  g(22.94, ["That's", 22.12], ['crazy!', 22.35]),
  g(24.4, ['And', 23.38], ['number', 23.59], ['three,', 24.07]),
  g(25.67, ['impressing', 24.71, true], ['people.', 25.34, true]),
  g(27.67, ['Going', 26.01], ['broke', 26.22], ['trying', 26.62], ['to', 26.9], ['look', 27.06, true], ['rich,', 27.3, true]),
  g(28.66, ['just', 27.87], ['to', 27.93], ['get', 28.05], ['approval', 28.21]),
  g(29.74, ['from', 28.69], ['people', 28.89], ['who', 29.13], ['probably', 29.29]),
  g(30.59, ["don't", 29.77], ['even', 30.05], ['care?', 30.33]),
  g(31.37, ['Nah.', 30.98]),
  g(32.12, ['If', 31.67], ['I', 31.72], ['have', 31.78], ['to', 31.9], ['go', 31.98]),
  g(33.82, ['into', 32.14], ['debt', 32.34], ['just', 32.66], ['to', 32.86], ['impress', 33.02, true], ['somebody,', 33.38]),
  g(35.0, ["I've", 33.86], ['already', 34.14, true], ['lost.', 34.62, true]),
];

// Final question: shown as the prominent end-card headline, word-synced (no duplicate subtitle).
export const QUESTION: W[] = [
  {w: "What's", s: 35.45}, {w: 'one', s: 35.58}, {w: 'thing', s: 35.82}, {w: 'YOU', s: 36.14, g: true},
  {w: 'refuse', s: 36.38, g: true}, {w: 'to', s: 36.82}, {w: 'go', s: 36.94}, {w: 'into', s: 37.1},
  {w: 'debt', s: 37.3}, {w: 'for?', s: 37.62},
];

// Sound effects: [time, file, volume]. Kept sparse; narration stays at unity gain.
export const SFX: [number, string, number][] = [
  [T.debt1, 'stamp', 0.3],
  [2.32, 'whoosh_short', 0.14],
  [5.32, 'whoosh_short', 0.12],
  [13.3, 'whoosh', 0.2],
  [T.cart, 'click', 0.28],
  [T.debt2, 'stamp', 0.3],
  [T.thats - 0.03, 'scratch', 0.26],
  [T.impressing, 'shutter', 0.26],
  [T.nah - 0.02, 'impact', 0.32],
  [T.lost, 'snap', 0.26],
];
