import React from 'react';
import {dmm} from '../theme';

/**
 * A tree-trunk cross-section drawn as organic concentric rings (SVG).
 * Ring i (1-based) has outer radius `radii[i-1]`; rings are painted outer → inner
 * so each one is a band. `shown` = how many rings exist (fractional: the newest
 * ring is still growing). Per-ring styling comes from `ringStyle`.
 */
export type RingStyle = {fill: string; stroke: string; strokeW?: number; opacity?: number};

const POINTS = 96;
/** Deterministic, slightly irregular circle so it reads as wood, not a target. */
export const ringPath = (cx: number, cy: number, r: number, seed: number) => {
	let d = '';
	for (let k = 0; k <= POINTS; k++) {
		const a = (k / POINTS) * Math.PI * 2;
		// one shared, smooth wobble whose phase drifts slowly with the ring index, so
		// neighbouring rings stay nested (never cross) but the trunk still looks grown
		const w = 1 + 0.016 * Math.sin(3 * a + seed * 0.06) + 0.009 * Math.sin(5 * a + 1.3 + seed * 0.04) + 0.004 * Math.sin(9 * a + 0.7 + seed * 0.03);
		const x = cx + Math.cos(a) * r * w;
		const y = cy + Math.sin(a) * r * w * 0.985;
		d += (k === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
	}
	return d + 'Z';
};

export const TreeRings: React.FC<{
	cx: number;
	cy: number;
	radii: number[];
	shown: number;
	ringStyle: (i: number) => RingStyle;
	/** ring indices (1-based) to leave out (they are drawn elsewhere, e.g. peeled) */
	skip?: (i: number) => boolean;
}> = ({cx, cy, radii, shown, ringStyle, skip}) => {
	const full = Math.floor(shown);
	const frac = shown - full;
	const items: React.ReactNode[] = [];
	for (let i = Math.min(radii.length, full + (frac > 0 ? 1 : 0)); i >= 1; i--) {
		if (skip?.(i)) continue;
		const inner = i > 1 ? radii[i - 2] : 0;
		const r = i <= full ? radii[i - 1] : inner + (radii[i - 1] - inner) * frac;
		const s = ringStyle(i);
		items.push(<path key={i} d={ringPath(cx, cy, r, i)} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeW ?? 1.4} opacity={s.opacity ?? 1} />);
	}
	return (
		<g>
			{items}
			<circle cx={cx} cy={cy} r={5} fill={dmm.color.muted} opacity={0.8} />
		</g>
	);
};
