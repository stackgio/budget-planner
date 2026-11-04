import React from 'react';
import {story, type Palette} from '../theme';

/**
 * Source line for any time-sensitive number or screenshot:
 * "SOURCE · Vanguard · VTI fund page · as of 09/30/2026". Never under 24 px.
 */
export const SourceTag: React.FC<{text: string; asOf?: string; palette: Palette; opacity?: number; style?: React.CSSProperties; align?: 'left' | 'center'}> = ({
	text,
	asOf,
	palette,
	opacity = 1,
	style,
	align = 'left',
}) => (
	<div
		style={{
			position: 'absolute',
			display: 'flex',
			justifyContent: align === 'center' ? 'center' : 'flex-start',
			alignItems: 'center',
			gap: 12,
			fontFamily: story.font,
			fontSize: 24,
			fontWeight: 700,
			color: palette.muted,
			letterSpacing: 0.5,
			opacity,
			...style,
		}}
	>
		<span style={{width: 12, height: 12, borderRadius: 3, background: palette.accent, flex: 'none'}} />
		<span>
			<span style={{fontWeight: 900, letterSpacing: 3, color: palette.body}}>SOURCE</span>
			{'  '}
			{text}
			{asOf ? <span style={{color: palette.body, fontWeight: 800}}>{` · as of ${asOf}`}</span> : null}
		</span>
	</div>
);

/** Small chip that says what kind of evidence this is (e.g. OFFICIAL SCREENSHOT / VERIFIED DATA). */
export const EvidenceChip: React.FC<{text: string; palette: Palette; style?: React.CSSProperties; tone?: 'accent' | 'ink'}> = ({text, palette, style, tone = 'accent'}) => (
	<div
		style={{
			position: 'absolute',
			fontFamily: story.font,
			fontSize: 24,
			fontWeight: 900,
			letterSpacing: 3,
			color: tone === 'accent' ? '#fff' : palette.bg,
			background: tone === 'accent' ? palette.accentDeep : palette.ink,
			padding: '8px 16px',
			borderRadius: 10,
			whiteSpace: 'nowrap',
			...style,
		}}
	>
		{text}
	</div>
);
