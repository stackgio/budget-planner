import React from 'react';
import {story, cinematic as P} from '../../../story/theme';

export const C = P;
export const FONT = story.font;

/** Descriptor text with accent words: desc("~500 large U.S. companies", ["large"]). */
export const Desc: React.FC<{text: string; hl?: string[]; fontSize?: number; color?: string; style?: React.CSSProperties}> = ({text, hl = [], fontSize = 46, color = P.ink, style}) => (
	<div style={{fontFamily: FONT, fontSize, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.12, color, ...style}}>
		{text.split(' ').map((w, i) => (
			<span key={i} style={{color: hl.includes(w) ? P.accent : undefined}}>
				{w}
				{' '}
			</span>
		))}
	</div>
);

export const Label: React.FC<{children: React.ReactNode; style?: React.CSSProperties; color?: string}> = ({children, style, color = P.muted}) => (
	<div style={{position: 'absolute', fontFamily: FONT, fontSize: 24, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color, whiteSpace: 'nowrap', ...style}}>
		{children}
	</div>
);
