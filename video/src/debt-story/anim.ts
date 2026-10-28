import {Easing, interpolate, spring} from 'remotion';
import {FPS} from './theme';

export const easeIO = Easing.bezier(0.45, 0, 0.2, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.5, 0, 0.75, 0);

/** Clamped tween from a→b over frames [f0, f1]. */
export const tw = (f: number, f0: number, f1: number, a = 0, b = 1, easing: (t: number) => number = easeIO) =>
	interpolate(f, [f0, f1], [a, b], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** Spring 0→1 starting at `start`, controlled overshoot. */
export const pop = (f: number, start: number, damping = 13, stiffness = 170, mass = 0.8) =>
	f < start ? 0 : spring({frame: f - start, fps: FPS, config: {damping, stiffness, mass}});

/** Snappier spring with no overshoot. */
export const settle = (f: number, start: number) => pop(f, start, 26, 160, 0.9);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Deterministic hash noise in [-1, 1]. */
export const noise = (n: number) => {
	const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return (x - Math.floor(x)) * 2 - 1;
};

/** Decaying camera shake offset. */
export const shake = (f: number, start: number, dur: number, amp: number) => {
	const t = f - start;
	if (t < 0 || t > dur) return {x: 0, y: 0, r: 0};
	const k = amp * Math.pow(1 - t / dur, 2);
	return {x: k * Math.sin(t * 2.7 + 0.3), y: k * Math.cos(t * 3.3 + 1.1) * 0.8, r: k * 0.03 * Math.sin(t * 2.1)};
};

/** Visibility envelope: fades in at a, out at b. */
export const life = (f: number, a: number, b: number, fadeIn = 6, fadeOut = 6) =>
	Math.min(tw(f, a, a + fadeIn, 0, 1, easeOut), tw(f, b - fadeOut, b, 1, 0, easeIn));
