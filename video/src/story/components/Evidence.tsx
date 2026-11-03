import React from 'react';
import {Img, staticFile} from 'remotion';
import {editorial, story, type Palette} from '../theme';

/**
 * Evidence chrome for real-source videos.
 *  LogoChip    — an official logo (cropped from the company's own website) on a white card
 *  SourceLabel — "Source: CFPB · Jul 11, 2023" + domain, always shown under evidence
 *  StatusTag   — CURRENT vs HISTORICAL, so past misconduct never reads as present-day
 */
export const LogoChip: React.FC<{src: string; natural: {w: number; h: number}; h: number; bg?: string; padX?: number; padY?: number; style?: React.CSSProperties}> = ({
	src,
	natural,
	h,
	bg = '#FFFFFF',
	padX = 34,
	padY = 26,
	style,
}) => {
	const w = (natural.w / natural.h) * h;
	return (
		<div
			style={{
				position: 'absolute',
				padding: `${padY}px ${padX}px`,
				background: bg,
				borderRadius: 28,
				boxShadow: '0 24px 50px rgba(30,25,15,0.20)',
				...style,
			}}
		>
			<Img src={staticFile(src)} style={{width: w, height: h, display: 'block'}} />
		</div>
	);
};

export const SourceLabel: React.FC<{source: string; date?: string; detail?: string; palette?: Palette; opacity?: number; style?: React.CSSProperties}> = ({
	source,
	date,
	detail,
	palette = editorial,
	opacity = 1,
	style,
}) => (
	<div style={{position: 'absolute', fontFamily: story.font, opacity, ...style}}>
		<div style={{fontSize: 28, fontWeight: 800, color: palette.ink, letterSpacing: 0.5}}>
			<span style={{color: palette.muted, fontWeight: 700}}>Source: </span>
			{source}
			{date ? <span style={{color: palette.accent}}>{` · ${date}`}</span> : null}
		</div>
		{detail ? <div style={{fontSize: 24, fontWeight: 700, color: palette.muted, marginTop: 6}}>{detail}</div> : null}
	</div>
);

export const StatusTag: React.FC<{kind: 'current' | 'historical'; text: string; palette?: Palette; t?: number; style?: React.CSSProperties}> = ({
	kind,
	text,
	palette = editorial,
	t = 1,
	style,
}) => {
	const c = kind === 'current' ? palette.accent : palette.muted;
	return (
		<div
			style={{
				position: 'absolute',
				fontFamily: story.font,
				display: 'inline-flex',
				alignItems: 'center',
				gap: 12,
				padding: '10px 18px',
				borderRadius: 12,
				border: `3px solid ${c}`,
				color: c,
				fontSize: 26,
				fontWeight: 900,
				letterSpacing: 3,
				background: palette.name === 'cinematic' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.7)',
				opacity: Math.min(1, t * 1.5),
				transform: `translateY(${(1 - t) * 16}px)`,
				...style,
			}}
		>
			<span style={{width: 12, height: 12, borderRadius: 6, background: c}} />
			{text}
		</div>
	);
};
