import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {E, kf, sp} from '../../story/lib/motion';
import {dmm} from '../theme';

export type HeadLine = {text: string; color?: string; size?: number; weight?: number};

/**
 * Stacked editorial headline. Each line is masked: it rises in from below its
 * own baseline at `at` (+ stagger) and rises out at `exitAt`. With `at <= 0`
 * the headline is fully readable on frame 0 (hooks).
 */
export const Headline: React.FC<{
	lines: HeadLine[];
	at?: number;
	exitAt?: number;
	x?: number;
	y: number;
	width?: number;
	align?: 'left' | 'center';
	stagger?: number;
	gap?: number;
}> = ({lines, at = 0, exitAt, x = dmm.safe.left, y, width = dmm.width - dmm.safe.left - dmm.safe.right, align = 'left', stagger = 4, gap = 4}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<div style={{position: 'absolute', left: x, top: y, width, display: 'flex', flexDirection: 'column', gap, alignItems: align === 'center' ? 'center' : 'flex-start', fontFamily: dmm.font}}>
			{lines.map((l, i) => {
				const size = l.size ?? dmm.type.display;
				const pIn = at <= 0 ? 1 : sp(frame, fps, at + i * stagger, 'smooth');
				const pOut = exitAt === undefined ? 0 : kf(frame, [exitAt + i * 2, exitAt + i * 2 + 10], [0, 1], E.in);
				const lh = size * 1.06;
				return (
					<div key={i} style={{height: lh, overflow: 'hidden'}}>
						<div
							style={{
								fontSize: size,
								fontWeight: l.weight ?? 900,
								lineHeight: `${lh}px`,
								letterSpacing: -size * 0.03,
								color: l.color ?? dmm.color.ink,
								whiteSpace: 'nowrap',
								transform: `translateY(${(1 - pIn) * lh * 1.05 - pOut * lh * 1.05}px)`,
							}}
						>
							{l.text}
						</div>
					</div>
				);
			})}
		</div>
	);
};
