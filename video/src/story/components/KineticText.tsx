import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {E, kf, springs} from '../lib/motion';
import {norm} from '../lib/narration';

export type KineticMode = 'rise' | 'pop' | 'slam' | 'none';

/**
 * Dynamic typography. Words enter by `mode` with a spring stagger, optional
 * per-word colour (`colors`) and a marker sweep behind key words (`marker`),
 * then exit (masked rise-out) at `exitAt`. Visible on its first frame when
 * `at <= 0` and mode is 'none' (use for hooks that must read on frame 0).
 */
export const KineticText: React.FC<{
	text: string;
	at?: number;
	mode?: KineticMode;
	exitAt?: number;
	fontSize: number;
	color: string;
	weight?: number;
	colors?: Record<string, string>;
	marker?: {words: string[]; color: string; at?: number};
	stagger?: number;
	/** extra scale at the start of a slam (0.55 = big hit, 0.2 = tight) */
	slamScale?: number;
	align?: 'left' | 'center' | 'right';
	lineHeight?: number;
	letterSpacing?: number;
	style?: React.CSSProperties;
}> = ({text, at = 0, mode = 'rise', exitAt, fontSize, color, weight = 900, colors = {}, marker, stagger = 3, slamScale = 0.55, align = 'left', lineHeight = 1.02, letterSpacing, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const words = text.split(' ');
	const ls = letterSpacing ?? -fontSize * 0.025;
	const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
	const slam = mode === 'slam' ? spring({frame: frame - at, fps, config: springs.heavy}) : 1;
	return (
		<div
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				justifyContent: justify,
				columnGap: fontSize * 0.26,
				fontSize,
				fontWeight: weight,
				lineHeight,
				letterSpacing: ls,
				color,
				transform: mode === 'slam' ? `scale(${1 + (1 - slam) * slamScale})` : undefined,
				opacity: mode === 'slam' ? Math.min(1, slam * 2) : 1,
				filter: mode === 'slam' && slam < 0.6 ? `blur(${(0.6 - slam) * 14}px)` : undefined,
				transformOrigin: align === 'center' ? '50% 50%' : '0% 50%',
				...style,
			}}
		>
			{words.map((w, i) => {
				const local = frame - at - i * stagger;
				const pIn = mode === 'none' || mode === 'slam' ? 1 : spring({frame: local, fps, config: mode === 'pop' ? springs.bouncy : springs.snappy});
				const pOut = exitAt === undefined ? 0 : kf(frame, [exitAt + i * 1.5, exitAt + i * 1.5 + 9], [0, 1], E.in);
				const key = norm(w);
				const c = colors[key] ?? color;
				const mk = marker && marker.words.map(norm).includes(key) ? kf(frame, [(marker.at ?? at + 10) + i, (marker.at ?? at + 10) + i + 10], [0, 1], E.out) : 0;
				const inner =
					mode === 'pop'
						? {transform: `scale(${0.4 + 0.6 * pIn}) translateY(${-pOut * 110}%)`, opacity: Math.min(1, pIn * 1.5) * (1 - pOut)}
						: {transform: `translateY(${(1 - pIn) * 105 - pOut * 110}%)`, opacity: 1};
				return (
					<span key={i} style={{display: 'inline-block', overflow: mode === 'pop' ? 'visible' : 'hidden', paddingBottom: fontSize * 0.08, marginBottom: -fontSize * 0.08, position: 'relative'}}>
						{mk > 0 && (
							<span
								style={{
									position: 'absolute',
									left: -fontSize * 0.06,
									right: -fontSize * 0.06,
									top: '18%',
									bottom: '4%',
									background: marker!.color,
									transformOrigin: '0 50%',
									transform: `scaleX(${mk})`,
									borderRadius: fontSize * 0.06,
								}}
							/>
						)}
						<span style={{display: 'inline-block', position: 'relative', color: c, ...inner}}>{w}</span>
					</span>
				);
			})}
		</div>
	);
};
