import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {sp} from '../../story/lib/motion';
import {story, type Palette} from '../../story/theme';
import {EXAMPLE_LABEL} from './facts';

/** Required label on any scene that shows hypothetical figures. */
export const ExampleChip: React.FC<{palette: Palette; at?: number; top?: number}> = ({palette, at = 0, top = story.safe.top + 26}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, 'snappy');
	return (
		<div
			style={{
				position: 'absolute',
				right: story.safe.right,
				top,
				fontFamily: story.font,
				fontSize: 24,
				fontWeight: 900,
				letterSpacing: 3,
				color: palette.muted,
				border: `2px solid ${palette.line}`,
				borderRadius: 10,
				padding: '6px 12px',
				opacity: p,
				transform: `translateY(${(1 - p) * -12}px)`,
			}}
		>
			{EXAMPLE_LABEL}
		</div>
	);
};

export const Label: React.FC<{children: React.ReactNode; color: string; style?: React.CSSProperties}> = ({children, color, style}) => (
	<div style={{position: 'absolute', fontFamily: story.font, fontSize: 30, fontWeight: 900, letterSpacing: 4, color, ...style}}>{children}</div>
);
