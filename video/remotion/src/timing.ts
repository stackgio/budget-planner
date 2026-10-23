// Narration timing (seconds), measured from the ElevenLabs voiceover.
// Source: sherpa-onnx zipformer token timestamps, with phrase-initial words
// snapped to the silence boundaries found by ffmpeg silencedetect (-38 dB).

export const T = {
  // Scene 1 — hook
  three: 0.03, things: 0.24, i: 0.6, refuse: 0.84, debt1: 1.92, for1: 2.28, hookEnd: 2.37,
  // Scene 2 — expensive car
  number1: 2.95, one: 3.2, an: 3.85, expensive: 4.0, car1: 4.64, s2End: 4.87,
  // Scene 3 — opportunity cost
  imagine1: 5.38, paying: 5.72, seven: 6.12, hundred: 6.52, to: 6.84, thousand: 7.16, dollars: 7.6,
  every: 8.16, month: 8.4, car2: 9.04, car2End: 9.31,
  when: 9.52, money: 9.68, saving: 10.6, traveling: 11.16, building: 12.04, future: 12.64, s3End: 12.98,
  // Scene 4 — clothes & shoes
  number2: 13.49, two: 13.76, clothes: 14.44, shoes: 15.21, s4End: 15.72,
  // Scene 5 — cart + wearing debt
  that: 16.08, shein: 16.17, cart: 16.65, designer: 17.09, clothes2: 17.65, expensive2: 18.21, sneakers: 18.77,
  sneakersEnd: 19.39, imagine2: 19.73, literally: 20.19, wearing: 20.83, debt2: 21.55, debt2End: 21.83,
  thats: 22.12, crazy: 22.35, s5End: 22.94,
  // Scene 6 — impressing people
  and3: 23.38, number3: 23.59, three3: 24.07, impressing: 24.71, people1: 25.34, s6End: 25.67,
  // Scene 7 — approval trap
  going: 26.01, broke: 26.22, trying: 26.62, look: 27.06, rich: 27.3, richEnd: 27.67,
  just1: 27.87, approval: 28.21, from: 28.69, people2: 28.89, probably: 29.29, care: 30.33, s7End: 30.59,
  // Scene 8 — the rule
  nah: 30.98, nahEnd: 31.37, if: 31.67, debt3: 32.34, just2: 32.66, impress: 33.02, somebody: 33.38,
  ive: 33.86, already: 34.14, lost: 34.62, s8End: 35.0,
  // Scene 9 — CTA
  whats: 35.45, oneThing: 35.58, you: 36.14, refuse2: 36.38, debt4: 37.3, voEnd: 37.76,
};

// Visual scene windows (include transition overlaps)
export const SCENES = {
  hook: [0, 2.62],
  car: [2.3, 13.75],
  clothes: [13.3, 16.45],
  cart: [16.0, 19.95],
  wear: [19.45, 23.2],
  impress: [22.9, 26.25],
  trap: [25.95, 31.0],
  rule: [30.95, 35.7],
  cta: [35.35, 39.0],
} as const;

export type Word = {text: string; c?: 'g' | 'r' | 'w' | 'm'};
export type Cap = {s: number; e: number; lines: Word[][]};

const w = (s: string): Word[] =>
  s.split(' ').map((x) => {
    if (x.startsWith('*')) return {text: x.slice(1), c: 'g' as const};
    if (x.startsWith('!')) return {text: x.slice(1), c: 'r' as const};
    return {text: x};
  });

// Captions: only where the scene's own titles don't already carry the words.
export const CAPTIONS: Cap[] = [
  {s: T.imagine1, e: 6.08, lines: [w('Imagine paying...')]},
  {s: T.when, e: 10.52, lines: [w('when that money could'), w('go toward...')]},
  {s: T.that, e: 17.02, lines: [w('That SHEIN cart,')]},
  {s: T.designer, e: 18.15, lines: [w('designer clothes,')]},
  {s: T.expensive2, e: T.sneakersEnd, lines: [w('expensive sneakers...')]},
  {s: T.imagine2, e: 20.78, lines: [w('Imagine literally...')]},
  {s: T.thats, e: T.s5End, lines: [w("That's crazy!")]},
  {s: T.going, e: T.richEnd, lines: [w('Going !broke'), w('trying to look rich')]},
  {s: T.just1, e: 28.84, lines: [w('just to get approval')]},
  {s: T.people2, e: T.s7End + 0.15, lines: [w('from people who probably'), w("don't even care?")]},
  {s: T.if, e: 32.6, lines: [w('If I have to go'), w('into !debt')]},
  {s: T.just2, e: 33.8, lines: [w('just to impress somebody,')]},
  {s: T.ive, e: T.s8End + 0.2, lines: [w("I've already lost.")]},
];

// Sound effects: [time, file, volume]. Narration stays at unity gain.
export const SFX: [number, string, number][] = [
  [0.0, 'impact', 0.32],
  [0.28, 'whoosh_short', 0.14],
  [0.46, 'whoosh_short', 0.12],
  [T.debt1, 'stamp', 0.5],
  [2.1, 'snap', 0.28],
  [2.33, 'carpass', 0.42],
  [T.car1 + 0.02, 'whoosh_short', 0.16],
  [6.86, 'tick', 0.1], [7.05, 'tick', 0.1], [7.22, 'tick', 0.1], [7.38, 'tick', 0.1], [7.55, 'tick', 0.12],
  [8.2, 'coin', 0.13], [8.6, 'coin', 0.12], [9.0, 'coin', 0.12],
  [T.saving, 'pop', 0.22], [T.traveling, 'pop', 0.22], [T.building, 'pop', 0.22],
  [13.3, 'whoosh', 0.28],
  [T.shoes, 'pop', 0.18],
  [16.05, 'whoosh_short', 0.14],
  [T.cart, 'click', 0.38],
  [T.designer, 'pop', 0.2], [T.clothes2, 'pop', 0.2], [T.expensive2, 'pop', 0.2], [T.sneakers, 'pop', 0.2],
  [19.5, 'whoosh', 0.22],
  [T.wearing + 0.05, 'warn', 0.12],
  [T.debt2, 'stamp', 0.42],
  [T.thats - 0.03, 'scratch', 0.36],
  [22.95, 'whoosh', 0.26],
  [T.impressing, 'shutter', 0.38],
  [25.0, 'pop', 0.12],
  [25.72, 'ding', 0.26],
  [26.42, 'tick', 0.14], [26.92, 'tick', 0.14], [27.42, 'tick', 0.14], [27.92, 'tick', 0.16],
  [28.88, 'whoosh_short', 0.18],
  [T.nah - 0.02, 'impact', 0.42],
  [33.08, 'whoosh_short', 0.22],
  [T.already, 'chime', 0.28],
  [35.38, 'whoosh', 0.22],
  [36.85, 'pop', 0.22],
];
