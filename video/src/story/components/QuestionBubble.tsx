import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useCues} from '../lib/cues';
import {norm} from '../lib/narration';
import {E, kf, sp} from '../lib/motion';
import {story} from '../theme';

/**
 * White chat bubble that shows one spoken line (a question from a second
 * voice). The full text is readable as soon as the bubble lands; each word
 * firms up from grey to ink as it is spoken, so the bubble IS the caption.
 * `at < 0` = already on screen at the scene's first frame.
 */
export const QuestionBubble: React.FC<{
	lineId: string;
	at: number;
	x: number;
	y: number;
	w: number;
	fontSize?: number;
	/** speaker tag above the bubble, e.g. "FRIEND" */
	label?: string;
	labelColor?: string;
	/** words (normalised) drawn in an accent colour */
	colors?: Record<string, string>;
	tail?: 'left' | 'right';
	exitAt?: number;
}> = ({lineId, at, x, y, w, fontSize = 62, label, labelColor = '#9AA0A6', colors = {}, tail = 'left', exitAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {narration, sceneStartFrame} = useCues();
	const line = narration.lines.find((l) => l.id === lineId);
	if (!line) throw new Error(`QuestionBubble: unknown line ${lineId}`);
	const pIn = sp(frame, fps, at, 'bouncy');
	const out = exitAt === undefined ? 0 : kf(frame, [exitAt, exitAt + 8], [0, 1], E.in);
	const ink = '#0E0F12';
	const accents = Object.fromEntries(Object.entries(colors).map(([k, v]) => [norm(k), v]));
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				fontFamily: story.font,
				transformOrigin: tail === 'left' ? '0% 100%' : '100% 100%',
				transform: `translateY(${(1 - Math.min(1, pIn)) * 40 - out * 60}px) scale(${0.86 + 0.14 * pIn})`,
				opacity: Math.min(1, pIn * 1.6) * (1 - out),
			}}
		>
			{label && (
				<div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, marginLeft: tail === 'left' ? 10 : 0, justifyContent: tail === 'left' ? 'flex-start' : 'flex-end'}}>
					<div style={{width: 14, height: 14, borderRadius: 7, background: labelColor}} />
					<div style={{fontSize: 26, fontWeight: 800, letterSpacing: 4, color: labelColor}}>{label}</div>
				</div>
			)}
			<div
				style={{
					position: 'relative',
					background: '#FFFFFF',
					borderRadius: 46,
					padding: '38px 46px 42px',
					boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
					fontSize,
					fontWeight: 800,
					lineHeight: 1.14,
					letterSpacing: -1.2,
					color: ink,
				}}
			>
				{line.words.map((wd, i) => {
					const local = Math.round(wd.start * fps) - sceneStartFrame;
					const said = kf(frame, [local - 2, local + 3], [0, 1], E.out);
					const accent = accents[norm(wd.text)];
					return (
						<React.Fragment key={i}>
							<span style={{color: accent ?? ink, opacity: 0.5 + 0.5 * said}}>{wd.text}</span>
							{i < line.words.length - 1 ? ' ' : ''}
						</React.Fragment>
					);
				})}
				<svg
					width={58}
					height={44}
					viewBox="0 0 58 44"
					style={{position: 'absolute', bottom: -30, ...(tail === 'left' ? {left: 34} : {right: 34, transform: 'scaleX(-1)'})}}
				>
					<path d="M2 0 C 10 22, 6 34, 0 44 C 22 40, 40 26, 50 0 Z" fill="#FFFFFF" />
				</svg>
			</div>
		</div>
	);
};
