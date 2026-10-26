import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {clamp, ease} from '../lib/motion';

export type CameraKey = {
	frame: number;
	/** Point of the 1080x1920 frame to center on (px). Default: frame center. */
	x?: number;
	y?: number;
	zoom?: number;
	rotate?: number;
	/** Easing of the move that ends at this key (defaults to the Camera's easing). */
	ease?: (t: number) => number;
};

type Props = {
	keys: CameraKey[];
	/** Easing between consecutive keys. */
	easing?: (t: number) => number;
	/** Gentle handheld drift in px. 0 = locked-off tripod. */
	drift?: number;
	children: React.ReactNode;
};

const W = 1080;
const H = 1920;

/**
 * A virtual camera over its children: push-ins, pans, reframes and slight
 * rotations between keyframes. Motion is eased per segment so moves feel
 * operated, not linear.
 */
export const Camera: React.FC<Props> = ({keys, easing = ease.inOut, drift = 0, children}) => {
	const frame = useCurrentFrame();
	const frames = keys.map((k) => k.frame);
	const pick = (f: (k: CameraKey) => number) =>
		keys.length === 1
			? f(keys[0])
			: interpolate(frame, frames, keys.map(f), {...clamp, easing: keys.slice(1).map((k) => k.ease ?? easing)});

	const zoom = pick((k) => k.zoom ?? 1);
	const cx = pick((k) => k.x ?? W / 2);
	const cy = pick((k) => k.y ?? H / 2);
	const rotate = pick((k) => k.rotate ?? 0);
	const dx = drift * (Math.sin(frame / 37) + 0.5 * Math.sin(frame / 17));
	const dy = drift * (Math.cos(frame / 41) + 0.5 * Math.sin(frame / 23));

	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					transformOrigin: `${cx}px ${cy}px`,
					translate: `${W / 2 - cx + dx}px ${H / 2 - cy + dy}px`,
					scale: zoom,
					rotate: `${rotate}deg`,
				}}
			>
				{children}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
