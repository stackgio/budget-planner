import React from 'react';
import {C} from '../theme';

/** Red warning triangle centred on (0,0); size = side length. */
export const Warn: React.FC<{size?: number; color?: string; glow?: number}> = ({size = 80, color = C.red, glow = 0.6}) => {
	const h = size * 0.88;
	const s = size / 2;
	return (
		<g>
			{glow > 0 ? <circle r={size * 0.75} fill={color} opacity={0.12 * glow} /> : null}
			<path
				d={`M 0 ${-h * 0.62} L ${s} ${h * 0.38} L ${-s} ${h * 0.38} Z`}
				fill={color}
				stroke={color}
				strokeWidth={size * 0.14}
				strokeLinejoin="round"
			/>
			<rect x={-size * 0.045} y={-h * 0.3} width={size * 0.09} height={h * 0.38} rx={size * 0.045} fill={C.bg} />
			<circle cx={0} cy={h * 0.2} r={size * 0.055} fill={C.bg} />
		</g>
	);
};

/** Green check badge centred on (0,0). `p` 0..1 draws the tick. */
export const CheckBadge: React.FC<{r?: number; p?: number; fill?: string}> = ({r = 34, p = 1, fill = C.green}) => {
	const len = r * 1.6;
	return (
		<g>
			<circle r={r} fill={fill} />
			<path
				d={`M ${-r * 0.42} ${r * 0.02} L ${-r * 0.1} ${r * 0.34} L ${r * 0.46} ${-r * 0.3}`}
				stroke={C.bg}
				strokeWidth={r * 0.2}
				fill="none"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeDasharray={len}
				strokeDashoffset={len * (1 - p)}
			/>
		</g>
	);
};

export const TireIcon: React.FC<{r?: number; flat?: boolean}> = ({r = 46, flat = true}) => (
	<g>
		<path
			d={
				flat
					? `M ${-r} ${-r * 0.1} A ${r} ${r} 0 1 1 ${r} ${-r * 0.1} Q ${r * 1.08} ${r * 0.72} ${r * 0.62} ${r * 0.82} L ${-r * 0.62} ${r * 0.82} Q ${-r * 1.08} ${r * 0.72} ${-r} ${-r * 0.1} Z`
					: `M ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0 Z`
			}
			fill="#1B1D1D"
			stroke="#3A3F3E"
			strokeWidth={4}
		/>
		<circle r={r * 0.52} fill="#AEB6BB" />
		<circle r={r * 0.36} fill="#7E878C" />
		{[0, 72, 144, 216, 288].map((a) => (
			<circle key={a} cx={Math.cos((a * Math.PI) / 180) * r * 0.22} cy={Math.sin((a * Math.PI) / 180) * r * 0.22} r={r * 0.06} fill="#D9DEE1" />
		))}
	</g>
);

export const WrenchIcon: React.FC<{s?: number; color?: string}> = ({s = 1, color = C.white}) => (
	<g transform={`scale(${s}) rotate(-45)`}>
		<path
			d="M -8 -40 L -8 26 Q -8 34 0 34 Q 8 34 8 26 L 8 -40 Z"
			fill={color}
		/>
		<path d="M -20 -44 A 22 22 0 1 0 20 -44 L 10 -44 L 10 -60 L -10 -60 L -10 -44 Z" fill={color} transform="translate(0 0)" />
	</g>
);

export const BillIcon: React.FC<{s?: number}> = ({s = 1}) => (
	<g transform={`scale(${s})`}>
		<path d="M -30 -40 L 18 -40 L 30 -28 L 30 40 L -30 40 Z" fill={C.paper} />
		<path d="M 18 -40 L 18 -28 L 30 -28 Z" fill={C.paperShade} />
		<rect x={-20} y={-26} width={26} height={7} rx={3} fill={C.red} />
		{[-8, 4, 16].map((y) => (
			<rect key={y} x={-20} y={y} width={40} height={5} rx={2.5} fill="#B9B4A7" />
		))}
		<rect x={4} y={27} width={16} height={6} rx={3} fill="#8E897E" />
	</g>
);

export const CarIcon: React.FC<{s?: number; color?: string}> = ({s = 1, color = '#4A6FA8'}) => (
	<g transform={`scale(${s})`}>
		<path d="M -46 8 L -42 -6 Q -38 -14 -28 -16 L -18 -30 Q -14 -34 -6 -34 L 20 -34 Q 28 -34 32 -28 L 40 -16 Q 48 -14 48 -4 L 48 8 Z" fill={color} />
		<path d="M -14 -28 L -4 -28 L -4 -17 L -22 -17 Z M 2 -28 L 18 -28 Q 22 -28 26 -24 L 30 -17 L 2 -17 Z" fill="#9FC0E3" />
		<circle cx={-26} cy={10} r={11} fill="#1B1D1D" stroke="#9AA2A6" strokeWidth={4} />
		<circle cx={28} cy={10} r={11} fill="#1B1D1D" stroke="#9AA2A6" strokeWidth={4} />
	</g>
);

export const CommentIcon: React.FC<{s?: number; color?: string}> = ({s = 1, color = C.green}) => (
	<g transform={`scale(${s})`}>
		<path d="M -22 -16 Q -22 -24 -14 -24 L 14 -24 Q 22 -24 22 -16 L 22 4 Q 22 12 14 12 L -4 12 L -14 22 L -12 12 L -14 12 Q -22 12 -22 4 Z" fill={color} />
		{[-9, 0, 9].map((x) => (
			<circle key={x} cx={x} cy={-6} r={3} fill={C.bg} />
		))}
	</g>
);
