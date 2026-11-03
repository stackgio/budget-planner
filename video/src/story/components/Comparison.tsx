import React from 'react';
import {useCurrentFrame, useVideoConfig, spring} from 'remotion';
import {springs} from '../lib/motion';
import {editorial, type Palette} from '../theme';

export type CompareSide = {title: string; value: React.ReactNode; caption?: string; tone: 'good' | 'bad' | 'neutral'; visual?: React.ReactNode};

/**
 * Side-by-side financial comparison (A vs B). Left lands first, right lands
 * with a beat of delay so the eye reads in order; the divider draws between.
 */
export const Comparison: React.FC<{
	left: CompareSide;
	right: CompareSide;
	at?: number;
	w?: number;
	h?: number;
	palette?: Palette;
	vs?: string;
	style?: React.CSSProperties;
}> = ({left, right, at = 0, w = 936, h = 560, palette = editorial, vs = 'VS', style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pL = spring({frame: frame - at, fps, config: springs.bouncy});
	const pR = spring({frame: frame - at - 8, fps, config: springs.bouncy});
	const pD = spring({frame: frame - at - 4, fps, config: springs.smooth});
	const toneC = (t: CompareSide['tone']) => (t === 'good' ? palette.accent : t === 'bad' ? palette.danger : palette.ink);
	const panel = (s: CompareSide, p: number, side: -1 | 1) => (
		<div
			style={{
				flex: 1,
				background: palette.paper,
				borderRadius: 32,
				padding: 36,
				boxShadow: `0 20px 40px ${palette.shadow}`,
				borderTop: `10px solid ${toneC(s.tone)}`,
				transform: `translateY(${(1 - p) * 120}px) rotate(${(1 - p) * side * 4}deg)`,
				opacity: Math.min(1, p * 1.6),
				display: 'flex',
				flexDirection: 'column',
				gap: 14,
			}}
		>
			<div style={{fontSize: 28, fontWeight: 900, letterSpacing: 2.5, color: palette.muted}}>{s.title}</div>
			{s.visual && <div style={{height: h * 0.34, position: 'relative'}}>{s.visual}</div>}
			<div style={{fontSize: 72, fontWeight: 900, color: toneC(s.tone), letterSpacing: -2, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{s.value}</div>
			{s.caption && <div style={{fontSize: 28, fontWeight: 600, color: palette.body, lineHeight: 1.25}}>{s.caption}</div>}
		</div>
	);
	return (
		<div style={{position: 'absolute', width: w, height: h, display: 'flex', gap: 40, fontFamily: 'Inter', ...style}}>
			{panel(left, pL, -1)}
			<div style={{position: 'absolute', left: w / 2 - 3, top: h * 0.1, height: h * 0.8 * pD, width: 6, borderRadius: 3, background: palette.line}} />
			<div
				style={{
					position: 'absolute',
					left: w / 2 - 42,
					top: h / 2 - 42,
					width: 84,
					height: 84,
					borderRadius: 42,
					background: palette.ink,
					color: palette.bg,
					fontSize: 30,
					fontWeight: 900,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					transform: `scale(${pD})`,
					zIndex: 2,
				}}
			>
				{vs}
			</div>
			{panel(right, pR, 1)}
		</div>
	);
};
