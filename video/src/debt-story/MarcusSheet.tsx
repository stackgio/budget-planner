import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Marcus, POSES, type Expr} from './Marcus';
import {C, FONT} from './theme';

/** Dev QC: every named pose and expression on one frame. */
export const MarcusSheet: React.FC = () => {
	const frame = useCurrentFrame();
	const names = Object.keys(POSES) as (keyof typeof POSES)[];
	const exprs: Expr[] = ['neutral', 'happy', 'confused', 'shocked', 'frustrated', 'sad', 'determined', 'relieved', 'curious', 'deadpan', 'strain'];
	return (
		<AbsoluteFill style={{background: C.bg, fontFamily: FONT}}>
			<svg width={1080} height={1920}>
				{names.map((n, i) => {
					const cx = 120 + (i % 5) * 210;
					const cy = 380 + Math.floor(i / 5) * 470;
					return (
						<g key={n}>
							<Marcus x={cx} y={cy} scale={0.62} pose={POSES[n]} expr={exprs[i % exprs.length]} frame={frame} facing={i % 2 ? -1 : 1} />
							<text x={cx} y={cy + 40} fill={C.gray} fontSize={20} textAnchor="middle">{n} · {exprs[i % exprs.length]}</text>
						</g>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};
