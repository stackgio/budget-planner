import React from 'react';
import {useCurrentFrame} from 'remotion';
import {E, kf} from '../../story/lib/motion';
import {cinematic as P, story} from '../../story/theme';

/** Small factual footnote: example labels, simplifications, sources. Never under 24px. */
export const Footnote: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties; color?: string}> = ({at, children, style, color = P.muted}) => {
	const frame = useCurrentFrame();
	const o = kf(frame, [at, at + 10], [0, 1], E.out);
	return (
		<div
			style={{
				position: 'absolute',
				left: story.safe.left,
				right: story.safe.right,
				fontFamily: story.font,
				fontSize: 24,
				fontWeight: 700,
				letterSpacing: 1,
				lineHeight: 1.3,
				color,
				opacity: o,
				transform: `translateY(${(1 - o) * 10}px)`,
				...style,
			}}
		>
			{children}
		</div>
	);
};

/** "EXAMPLE" pill for hypothetical numbers. */
export const ExampleTag: React.FC<{style?: React.CSSProperties; text?: string}> = ({style, text = 'EXAMPLE'}) => (
	<div
		style={{
			position: 'absolute',
			fontFamily: story.font,
			fontSize: 24,
			fontWeight: 900,
			letterSpacing: 3,
			color: P.bg,
			background: P.gold,
			borderRadius: 10,
			padding: '6px 14px',
			...style,
		}}
	>
		{text}
	</div>
);

/** Subtle handle watermark, top-right inside the safe area, on every frame. */
export const Watermark: React.FC = () => (
	<div
		style={{
			position: 'absolute',
			right: story.safe.right,
			top: story.safe.top + 6,
			fontFamily: story.font,
			fontSize: 26,
			fontWeight: 800,
			letterSpacing: 1,
			color: 'rgba(245,242,234,0.38)',
		}}
	>
		@stackwithgio
	</div>
);
