import {Easing, interpolate, spring, type SpringConfig} from 'remotion';

/** Spring presets — pick by intent, not by taste. */
export const springs = {
	/** UI pops, chips, labels: fast, tiny overshoot */
	snappy: {damping: 16, stiffness: 210, mass: 0.7},
	/** Hero objects arriving: visible overshoot, settles quickly */
	bouncy: {damping: 11, stiffness: 150, mass: 0.85},
	/** Heavy things (bills slamming, big numbers): weighty, little bounce */
	heavy: {damping: 18, stiffness: 95, mass: 1.5},
	/** Camera and large layout moves: no overshoot */
	smooth: {damping: 200, stiffness: 90, mass: 1},
	/** Character limbs: organic, slight follow-through */
	limb: {damping: 13, stiffness: 120, mass: 0.9},
} satisfies Record<string, Partial<SpringConfig>>;

export type SpringName = keyof typeof springs;

export const sp = (frame: number, fps: number, start = 0, cfg: SpringName | Partial<SpringConfig> = 'snappy') =>
	spring({frame: frame - start, fps, config: typeof cfg === 'string' ? springs[cfg] : cfg});

export const E = {
	out: Easing.bezier(0.16, 1, 0.3, 1),
	inOut: Easing.bezier(0.65, 0, 0.35, 1),
	in: Easing.bezier(0.55, 0, 0.8, 0.2),
	soft: Easing.bezier(0.45, 0, 0.2, 1),
	back: Easing.bezier(0.34, 1.4, 0.64, 1),
};

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Clamped keyframe interpolation. */
export const kf = (frame: number, input: number[], output: number[], easing: (t: number) => number = E.inOut) =>
	interpolate(frame, input, output, {...clamp, easing});

/** 0→1 over [start, start+dur], eased & clamped. */
export const prog = (frame: number, start: number, dur: number, easing: (t: number) => number = E.out) =>
	interpolate(frame, [start, start + Math.max(1, dur)], [0, 1], {...clamp, easing});

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Deterministic organic drift: sum of incommensurate sines. */
export const wobble = (frame: number, seed = 0, speed = 1, amp = 1) => {
	const t = frame * speed;
	return (
		amp *
		(0.55 * Math.sin(t * 0.071 + seed * 1.7) + 0.3 * Math.sin(t * 0.133 + seed * 3.1) + 0.15 * Math.sin(t * 0.289 + seed * 5.3))
	);
};

/** Point on a quadratic bezier — for objects that travel in arcs, not straight lines. */
export const arc = (t: number, from: [number, number], to: [number, number], lift = 200): [number, number] => {
	const cx = (from[0] + to[0]) / 2;
	const cy = Math.min(from[1], to[1]) - lift;
	const u = 1 - t;
	return [u * u * from[0] + 2 * u * t * cx + t * t * to[0], u * u * from[1] + 2 * u * t * cy + t * t * to[1]];
};

/** Short decaying shake for impacts (returns px offset). */
export const shake = (frame: number, at: number, amp = 14, dur = 14) => {
	const t = frame - at;
	if (t < 0 || t > dur) return {x: 0, y: 0};
	const d = Math.pow(1 - t / dur, 2);
	return {x: Math.sin(t * 2.7) * amp * d, y: Math.cos(t * 3.3) * amp * 0.6 * d};
};
