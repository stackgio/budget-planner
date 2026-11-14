import React from 'react';
import {useCurrentFrame} from 'remotion';
import {E, kf} from '../../story/lib/motion';

export type CamKey = {at: number; zoom: number; fx: number; fy: number};

/**
 * Keyed 2D camera over a 1080×1920 "world". Each key says: at frame `at`,
 * world point (fx, fy) sits at the screen anchor, magnified `zoom`×.
 * Keys are interpolated with an ease-in-out (no linear robo-moves); optional
 * sub-pixel handheld drift for a filmed feel.
 */
export const Camera2D: React.FC<{keys: CamKey[]; anchor?: [number, number]; drift?: number; children: React.ReactNode}> = ({
	keys,
	anchor = [540, 960],
	drift = 0,
	children,
}) => {
	const frame = useCurrentFrame();
	const at = keys.map((k) => k.at);
	const pick = (sel: (k: CamKey) => number) => (keys.length === 1 ? sel(keys[0]) : kf(frame, at, keys.map(sel), E.inOut));
	const z = pick((k) => k.zoom);
	const fx = pick((k) => k.fx) + Math.sin(frame / 47) * drift;
	const fy = pick((k) => k.fy) + Math.cos(frame / 61) * drift * 0.7;
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${anchor[0] - fx * z}px, ${anchor[1] - fy * z}px) scale(${z})`}}>
			{children}
		</div>
	);
};
