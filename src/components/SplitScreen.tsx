import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts, SAFE} from '../brand/theme';
import {clamp, ease, springAt, springs} from '../lib/motion';

type Side = {label: string; color?: string; background?: string; children?: React.ReactNode};

type Props = {
	a: Side;
	b: Side;
	startFrame: number;
	/** 'stack' = top/bottom (best for 9:16), 'side' = left/right. */
	layout?: 'stack' | 'side';
	/** Optional verdict: the other side dims from `at`. */
	winner?: {side: 'a' | 'b'; at: number};
};

/** Comparison layout: the divider wipes in, then each panel and label lands. */
export const SplitScreen: React.FC<Props> = ({a, b, startFrame, layout = 'stack', winner}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const wipe = interpolate(frame, [startFrame, startFrame + 14], [0, 1], {...clamp, easing: ease.inOut});
	const stack = layout === 'stack';
	const verdict = winner ? interpolate(frame, [winner.at, winner.at + 10], [0, 1], {...clamp, easing: ease.out}) : 0;

	const panel = (s: Side, which: 'a' | 'b', delay: number) => {
		const inP = springAt(frame, fps, startFrame + delay, springs.soft, 16);
		const lab = springAt(frame, fps, startFrame + delay + 6, springs.pop);
		const isLoser = winner && winner.side !== which;
		const isWinner = winner && winner.side === which;
		const offset = (which === 'a' ? -1 : 1) * (1 - inP) * 80;
		return (
			<div
				style={{
					position: 'relative',
					flex: 1,
					overflow: 'hidden',
					background: s.background ?? colors.matte,
					opacity: inP * (isLoser ? 1 - verdict * 0.55 : 1),
					filter: isLoser ? `grayscale(${verdict})` : undefined,
				}}
			>
				<AbsoluteFill style={{translate: stack ? `0px ${offset}px` : `${offset}px 0px`}}>{s.children}</AbsoluteFill>
				<div
					style={{
						position: 'absolute',
						left: '50%',
						// Top panel label under the top UI, bottom panel label above the caption UI.
						...(which === 'b' && stack ? {bottom: SAFE.bottom + 10} : {top: SAFE.top + 20}),
						translate: '-50% 0px',
						scale: interpolate(lab, [0, 1], [0.6, 1]) * (isWinner ? 1 + verdict * 0.08 : 1),
						opacity: Math.min(1, lab),
						padding: '14px 34px',
						borderRadius: 999,
						background: isWinner && verdict > 0 ? colors.green : (s.color ?? colors.white),
						color: colors.black,
						fontFamily: fonts.display,
						fontWeight: 900,
						fontSize: 46,
						whiteSpace: 'nowrap',
					}}
				>
					{s.label}
				</div>
			</div>
		);
	};

	return (
		<AbsoluteFill style={{flexDirection: stack ? 'column' : 'row', background: colors.black}}>
			{panel(a, 'a', 0)}
			<div
				style={{
					[stack ? 'height' : 'width']: 8,
					[stack ? 'width' : 'height']: `${wipe * 100}%`,
					alignSelf: 'center',
					background: colors.green,
					boxShadow: `0 0 30px ${colors.green}`,
					zIndex: 2,
				}}
			/>
			{panel(b, 'b', 4)}
		</AbsoluteFill>
	);
};
