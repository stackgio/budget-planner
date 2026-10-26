import {Easing, interpolate, spring} from 'remotion';

// Shared easing vocabulary. Keep motion consistent across videos by picking
// from these instead of inventing new curves per scene.
export const ease = {
	out: Easing.bezier(0.16, 1, 0.3, 1), // fast start, soft landing (entrances)
	inOut: Easing.bezier(0.65, 0, 0.35, 1), // camera moves
	in: Easing.bezier(0.7, 0, 0.84, 0), // exits
	snap: Easing.bezier(0.2, 0.9, 0.1, 1),
};

export const springs = {
	soft: {damping: 200},
	pop: {damping: 12, stiffness: 160, mass: 0.6},
	bouncy: {damping: 9, stiffness: 120, mass: 0.7},
	heavy: {damping: 18, stiffness: 90, mass: 1.2},
};

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0 → 1 progress between two frames with an easing curve. */
export const progress = (frame: number, from: number, to: number, easing = ease.out) =>
	interpolate(frame, [from, to], [0, 1], {...clamp, easing});

/** Spring that starts at `delay`. */
export const springAt = (frame: number, fps: number, delay: number, config = springs.soft, durationInFrames?: number) =>
	spring({frame: frame - delay, fps, config, durationInFrames});

/** Deterministic pseudo-random in [0,1) from a seed (no Math.random in renders). */
export const seeded = (seed: number) => {
	const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
	return x - Math.floor(x);
};

/** Short decaying shake (haptic buzz, impact). Returns px offset. */
export const shake = (frame: number, start: number, length = 8, amplitude = 6) => {
	const t = frame - start;
	if (t < 0 || t > length) return {x: 0, y: 0};
	const decay = 1 - t / length;
	return {x: Math.sin(t * 2.7) * amplitude * decay, y: Math.cos(t * 3.3) * amplitude * 0.6 * decay};
};
