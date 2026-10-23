import {Easing, interpolate, staticFile} from 'remotion';

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const DURATION_S = 39.0;

export const C = {
  bg: '#0B0D0C',
  green: '#36E079',
  white: '#F5F7F5',
  gray: '#8D9690',
  red: '#FF5757',
  panel: 'rgba(17, 21, 19, 0.86)',
  line: 'rgba(245, 247, 245, 0.10)',
};

export const FONT_HEAD = "'Inter Display', 'Inter', sans-serif";
export const FONT_BODY = "'Inter', sans-serif";

// Easing curves
export const OUT = Easing.bezier(0.16, 1, 0.3, 1); // expo-like out
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const IN = Easing.bezier(0.7, 0, 0.84, 0);
export const BACK = Easing.bezier(0.34, 1.56, 0.64, 1); // gentle overshoot

/** 0..1 progress of time t between a and b (seconds), clamped and eased. */
export const p = (t: number, a: number, b: number, e: (x: number) => number = OUT) =>
  interpolate(t, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e});

export const mix = (a: number, b: number, x: number) => a + (b - a) * x;

/** Fade in at a..a+d, fade out at b-d..b */
export const window = (t: number, a: number, b: number, dIn = 0.15, dOut = 0.15) =>
  Math.min(p(t, a, a + dIn, OUT), 1 - p(t, b - dOut, b, IN_OUT));

export const img = (n: string) => staticFile(`img/${n}`);
export const cut = (n: string) => staticFile(`cut/${n}.png`);

export const money = (n: number) =>
  (n < 0 ? '−$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');

/** Deterministic pseudo-random */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** Decaying shake offset after time t0 */
export const shake = (t: number, t0: number, amp = 14, dur = 0.25) => {
  const k = t - t0;
  if (k < 0 || k > dur) return {x: 0, y: 0};
  const d = 1 - k / dur;
  return {x: Math.sin(k * 90) * amp * d * d, y: Math.cos(k * 73) * amp * 0.6 * d * d};
};
