import {Easing, interpolate} from 'remotion';

const outCurve = Easing.bezier(0.16, 0.84, 0.24, 1);
const inOutCurve = Easing.bezier(0.6, 0, 0.3, 1);

/** Eased 0→1 progress for an animation starting at `start` lasting `dur` frames. */
export const prog = (f: number, start: number, dur = 8, curve: 'out' | 'inOut' = 'out') =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: curve === 'out' ? outCurve : inOutCurve,
  });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Scale that lands at 1 with a single small settle (no repeated bounce). */
export const settle = (f: number, start: number, from = 1.1, dur = 9) => {
  const t = prog(f, start, dur);
  return mix(from, 1, t);
};

/** 1 inside [a, b), else 0 — used for hard cuts. */
export const within = (f: number, a: number, b: number) => (f >= a && f < b ? 1 : 0);

/** 0→1 then 1→0: rises at `a` over `d` frames, falls at `b` over `d` frames. */
export const pulse = (f: number, a: number, b: number, d = 6) => prog(f, a, d) * (1 - prog(f, b, d));
