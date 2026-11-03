import React from 'react';
import {useCurrentFrame} from 'remotion';
import {E, wobble} from '../lib/motion';
import {story} from '../theme';

export type CamKey = {at: number; zoom?: number; x?: number; y?: number; rot?: number; ease?: (t: number) => number};

/**
 * Virtual camera for a scene. Keys hold a framing; between keys the camera
 * eases (no constant zooming — hold framings, move with intent). `x/y` are the
 * scene point to centre on (default canvas centre). `handheld` adds a
 * barely-there drift for cinematic scenes.
 */
export const Camera: React.FC<{keys: CamKey[]; handheld?: number; children: React.ReactNode; shakeX?: number; shakeY?: number}> = ({keys, handheld = 0, children, shakeX = 0, shakeY = 0}) => {
	const frame = useCurrentFrame();
	const ks = [...keys].sort((a, b) => a.at - b.at);
	const val = (k: keyof Omit<CamKey, 'at' | 'ease'>, def: number) => {
		let v = ks[0]?.[k] ?? def;
		for (let i = 1; i < ks.length; i++) {
			const prev = v;
			const target = ks[i][k] ?? prev;
			const start = ks[i - 1].at;
			const end = ks[i].at;
			if (frame <= start) break;
			const t = Math.min(1, (frame - start) / Math.max(1, end - start));
			v = prev + (target - prev) * (ks[i].ease ?? E.inOut)(t);
		}
		return v;
	};
	const zoom = val('zoom', 1);
	const cx = val('x', story.width / 2);
	const cy = val('y', story.height / 2);
	const rot = val('rot', 0);
	const hx = handheld ? wobble(frame, 11, 0.8, handheld) : 0;
	const hy = handheld ? wobble(frame, 23, 0.7, handheld * 0.8) : 0;
	const tx = story.width / 2 - cx * zoom + hx + shakeX;
	const ty = story.height / 2 - cy * zoom + hy + shakeY;
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: story.width, height: story.height, transformOrigin: '0 0', transform: `translate(${tx}px,${ty}px) scale(${zoom}) rotate(${rot}deg)`}}>
				{children}
			</div>
		</div>
	);
};
