import React from 'react';
import {dmm} from '../theme';

/**
 * A faceted iceberg split by a waterline at y = `waterY`.
 * - The floe above water (fixed size) is "what people see".
 * - The submerged mass scales by `s` (0..1) in BOTH width and depth, so its
 *   AREA ∝ s² — pass s = √(value / final) to keep the picture honest.
 * `glint` (0..1, or <0 for none) is a light band sweeping bottom → top.
 */
const MASS: [number, number][] = [
	[-0.5, 0], [-0.8, 0.16], [-1.0, 0.4], [-0.88, 0.68], [-0.52, 0.92], [-0.08, 1.0], [0.36, 0.9], [0.78, 0.66], [1.0, 0.38], [0.84, 0.13], [0.52, 0],
];
const CORE: [number, number] = [0.18, 0.34]; // off-centre so the facets read as ice, not a pinwheel
const FLOE: [number, number][] = [
	[-1, 0], [-0.78, -0.52], [-0.22, -0.86], [0.34, -0.8], [0.84, -0.44], [1, 0],
];

export const Iceberg: React.FC<{cx: number; waterY: number; s: number; halfW?: number; depth?: number; floeW?: number; floeH?: number; glint?: number}> = ({
	cx,
	waterY,
	s,
	halfW = 330,
	depth = 700,
	floeW = 150,
	floeH = 110,
	glint = -1,
}) => {
	const C = dmm.color;
	const P = (p: [number, number]) => [cx + p[0] * halfW * s, waterY + p[1] * depth * s] as const;
	const core = P(CORE);
	const tris = MASS.map((a, i) => {
		const b = MASS[(i + 1) % MASS.length];
		const pa = P(a);
		const pb = P(b);
		const midDepth = (a[1] + b[1] + CORE[1]) / 3; // 0 top … 1 bottom
		const lit = glint >= 0 ? Math.max(0, 1 - Math.abs(1 - glint - midDepth) / 0.22) : 0;
		const base = i % 2 === 0 ? 0.2 : 0.1;
		return <path key={i} d={`M${pa[0]} ${pa[1]}L${pb[0]} ${pb[1]}L${core[0]} ${core[1]}Z`} fill={`rgba(54,217,121,${base + 0.3 * lit})`} stroke="rgba(54,217,121,0.35)" strokeWidth={1} />;
	});
	const outline = MASS.map((p, i) => {
		const q = P(p);
		return `${i === 0 ? 'M' : 'L'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
	}).join('') + 'Z';
	const floe = FLOE.map((p, i) => `${i === 0 ? 'M' : 'L'}${(cx + p[0] * floeW).toFixed(1)} ${(waterY + p[1] * floeH).toFixed(1)}`).join('') + 'Z';
	return (
		<g>
			{s > 0.02 && (
				<>
					{tris}
					<path d={outline} fill="none" stroke={C.accent} strokeOpacity={0.85} strokeWidth={2.5} />
				</>
			)}
			<path d={floe} fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.7)" strokeWidth={2.5} />
			<path d={`M${cx - floeW * 0.22} ${waterY - floeH * 0.86}L${cx - floeW * 0.05} ${waterY}M${cx + floeW * 0.34} ${waterY - floeH * 0.8}L${cx + floeW * 0.1} ${waterY}`} stroke="rgba(255,255,255,0.25)" strokeWidth={1.5} />
		</g>
	);
};

/** Minimal line-art car (no brand), sitting with its wheels on y = `ground`. */
export const CarIcon: React.FC<{cx: number; ground: number; w?: number; stroke?: string}> = ({cx, ground, w = 150, stroke = dmm.color.ink}) => {
	const h = w * 0.36;
	const x0 = cx - w / 2;
	const wheelR = w * 0.09;
	const body = `M${x0} ${ground - wheelR}L${x0} ${ground - h * 0.55}Q${x0} ${ground - h * 0.62} ${x0 + w * 0.08} ${ground - h * 0.64}L${x0 + w * 0.26} ${ground - h * 0.66}L${x0 + w * 0.38} ${ground - h}L${x0 + w * 0.7} ${ground - h}L${x0 + w * 0.82} ${ground - h * 0.64}L${x0 + w * 0.96} ${ground - h * 0.58}Q${x0 + w} ${ground - h * 0.52} ${x0 + w} ${ground - h * 0.4}L${x0 + w} ${ground - wheelR}Z`;
	return (
		<g>
			<path d={body} fill="rgba(8,13,10,0.85)" stroke={stroke} strokeWidth={3} strokeLinejoin="round" />
			<path d={`M${x0 + w * 0.4} ${ground - h * 0.92}L${x0 + w * 0.68} ${ground - h * 0.92}L${x0 + w * 0.77} ${ground - h * 0.66}L${x0 + w * 0.32} ${ground - h * 0.66}Z`} fill="rgba(255,255,255,0.12)" stroke={stroke} strokeWidth={2} />
			{[0.24, 0.76].map((f) => (
				<circle key={f} cx={x0 + w * f} cy={ground - wheelR} r={wheelR} fill={dmm.color.bg} stroke={stroke} strokeWidth={3} />
			))}
		</g>
	);
};
