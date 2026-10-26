import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {colors} from '../../brand/theme';
import {clamp, seeded} from '../../lib/motion';

type Props = {
	startFrame: number;
	count?: number;
	/** Frame the bills stop and drop out (comedic freeze). Omit to let them fall through. */
	freezeAt?: number;
	/** Horizontal band they fall in (px). */
	left?: number;
	right?: number;
	seed?: number;
};

/** A restrained shower of bills that tumble and flutter (deterministic). */
export const DollarBills: React.FC<Props> = ({startFrame, count = 7, freezeAt, left = 120, right = 900, seed = 3}) => {
	const raw = useCurrentFrame();
	const frozen = freezeAt !== undefined && raw >= freezeAt;
	const frame = frozen ? freezeAt! : raw;
	const fade = freezeAt === undefined ? 1 : interpolate(raw, [freezeAt, freezeAt + 6], [1, 0], clamp);
	return (
		<>
			{Array.from({length: count}).map((_, i) => {
				const r1 = seeded(seed * 100 + i);
				const r2 = seeded(seed * 200 + i);
				const r3 = seeded(seed * 300 + i);
				const t = frame - startFrame - r1 * 12;
				if (t < 0) return null;
				const x = left + (right - left) * ((i + 0.5) / count) + Math.sin(t / (9 + r2 * 6)) * 60;
				const y = -150 + t * (30 + r3 * 12);
				const rot = Math.sin(t / (7 + r1 * 5)) * 35 + r2 * 40 - 20;
				const flip = Math.cos(t / (5 + r3 * 4));
				return (
					<div
						key={i}
						style={{position: 'absolute', left: x, top: y, rotate: `${rot}deg`, scale: `1 ${0.35 + 0.65 * Math.abs(flip)}`, opacity: fade}}
					>
						<Bill />
					</div>
				);
			})}
		</>
	);
};

export const Bill: React.FC<{width?: number}> = ({width = 150}) => (
	<svg width={width} height={width * 0.45} viewBox="0 0 150 68">
		<rect x={1} y={1} width={148} height={66} rx={6} fill="#1E7A47" stroke={colors.greenSoft} strokeWidth={2} />
		<rect x={9} y={9} width={132} height={50} rx={4} fill="none" stroke="#7CF2AE88" strokeWidth={1.5} />
		<circle cx={75} cy={34} r={17} fill="#2B9A5C" stroke="#7CF2AE99" strokeWidth={1.5} />
		<text x={75} y={42} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={22} fill={colors.white}>
			$
		</text>
	</svg>
);
