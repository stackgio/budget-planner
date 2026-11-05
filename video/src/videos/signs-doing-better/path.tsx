import React from 'react';
import {cinematic as P, story} from '../../story/theme';
import {IconInvest, IconJar, IconNoDebt} from './icons';

/** Shared progress path (story → end match cut): quadratic curve from Marcus's feet up to the right. */
export const P0: [number, number] = [300, story.ground - 4];
export const PC: [number, number] = [760, story.ground - 10];
export const P1: [number, number] = [930, 760];
export const at = (t: number): [number, number] => {
	const u = 1 - t;
	return [u * u * P0[0] + 2 * u * t * PC[0] + t * t * P1[0], u * u * P0[1] + 2 * u * t * PC[1] + t * t * P1[1]];
};
export const STOPS = [0.32, 0.62, 0.9];
const D = `M${P0[0]},${P0[1]} Q${PC[0]},${PC[1]} ${P1[0]},${P1[1]}`;

/** `drawn` 0..1 shows the dashed path, `done` 0..1 paints it green, `icons`/`lit` per stop 0..1. */
export const ProgressPath: React.FC<{drawn: number; done: number; icons: number[]; lit: number[]}> = ({drawn, done, icons, lit}) => {
	const Icons = [IconInvest, IconNoDebt, IconJar];
	return (
		<>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<path d={D} fill="none" stroke={P.line} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={`${drawn} 1`} />
				<path d={D} fill="none" stroke={P.muted} strokeWidth={4} strokeDasharray="4 22" opacity={0.6 * drawn} />
				{done > 0 && <path d={D} fill="none" stroke={P.accent} strokeWidth={14} strokeLinecap="round" pathLength={1} strokeDasharray={`${done} 1`} />}
			</svg>
			{STOPS.map((s, i) => {
				const [x, y] = at(s);
				const show = Math.min(1, Math.max(0, drawn * 1.2 - s));
				const Icon = Icons[i];
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x - 52,
							top: y - 52,
							width: 104,
							height: 104,
							borderRadius: 52,
							background: lit[i] > 0.5 ? P.accent : P.bg2,
							border: `5px solid ${lit[i] > 0.5 ? P.accent : P.line}`,
							boxSizing: 'border-box',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							opacity: show > 0 ? 1 : 0,
							transform: `scale(${(0.4 + 0.6 * Math.min(1, show * 3)) * (1 + 0.15 * Math.sin(Math.PI * Math.min(1, lit[i])))})`,
						}}
					>
						<div style={{opacity: icons[i], transform: `scale(${0.5 + 0.5 * icons[i]})`}}>
							<Icon size={56} color={lit[i] > 0.5 ? P.bg : P.accent} />
						</div>
					</div>
				);
			})}
		</>
	);
};
