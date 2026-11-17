import React from 'react';
import {useCurrentFrame} from 'remotion';
import {E, kf, prog} from '../lib/motion';
import {cinematic, story, type Palette} from '../theme';

/**
 * Fund-card system for ETF / index-fund explainers.
 *  FundCard  — the fund "basket": a rounded frame positioned in scene pixels
 *              (animate x/y/w/h to expand one fund into another).
 *  StockTile — one holding. Equal-size tiles are EXAMPLES, never weights.
 *  Swap      — rolls between texts/nodes at cue frames (ticker changes, labels).
 *  TickerWord — ticker text; letters that changed from the previous ticker flash in accent.
 *  TickerChip — compact ticker pill (title cards, recaps).
 * All geometry is in the 1080×1920 scene space; keep content above story.contentBottom.
 */

export const FundCard: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	palette?: Palette;
	/** 0..1 accent border + glow */
	glow?: number;
	/** 0..1 dashed "empty basket" outline instead of a solid frame */
	empty?: number;
	opacity?: number;
	radius?: number;
	children?: React.ReactNode;
	style?: React.CSSProperties;
}> = ({x, y, w, h, palette: P = cinematic, glow = 0, empty = 0, opacity = 1, radius = 40, children, style}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: w,
			height: h,
			borderRadius: radius,
			background: `rgba(27,30,35,${0.92 * (1 - empty)})`,
			border: `3px ${empty > 0.5 ? 'dashed' : 'solid'} ${glow > 0 ? mixColor(P.line, P.accent, glow) : empty > 0.5 ? P.muted : P.line}`,
			boxShadow: `0 30px 60px rgba(0,0,0,0.45), 0 0 ${60 * glow}px rgba(44,212,122,${0.35 * glow})`,
			opacity,
			...style,
		}}
	>
		{children}
	</div>
);

export const StockTile: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	label?: string;
	fontSize?: number;
	/** 0..1 accent outline + tint (the tile the narration is about) */
	focus?: number;
	/** 0..1 dims the tile */
	dim?: number;
	/** 0..1 entrance scale */
	enter?: number;
	/** tile surface tint, e.g. for international holdings */
	tint?: string;
	palette?: Palette;
	rot?: number;
	radius?: number;
}> = ({x, y, w, h, label, fontSize = 40, focus = 0, dim = 0, enter = 1, tint, palette: P = cinematic, rot = 0, radius}) => {
	if (enter <= 0.001) return null;
	const r = radius ?? Math.min(22, h * 0.22);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				borderRadius: r,
				background: focus > 0 ? mixColor(tint ?? '#262A31', '#163F2A', focus) : (tint ?? '#262A31'),
				border: `${label ? 3 : 2}px solid ${mixColor('#353A43', P.accent, focus)}`,
				boxShadow: focus > 0 ? `0 0 ${40 * focus}px rgba(44,212,122,${0.45 * focus})` : '0 10px 20px rgba(0,0,0,0.3)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: story.font,
				fontSize,
				fontWeight: 800,
				letterSpacing: -0.5,
				color: mixColor(P.ink, '#FFFFFF', focus),
				opacity: (1 - dim * 0.7) * Math.min(1, enter * 1.4),
				transform: `scale(${(0.6 + 0.4 * enter) * (1 + 0.05 * focus)}) rotate(${rot}deg)`,
				whiteSpace: 'nowrap',
			}}
		>
			{label}
		</div>
	);
};

/** Rolls between steps at cue frames: previous content slides up and out, the next one rises in. */
export const Swap: React.FC<{
	steps: {at: number; node: React.ReactNode}[];
	dur?: number;
	height: number;
	style?: React.CSSProperties;
}> = ({steps, dur = 12, height, style}) => {
	const frame = useCurrentFrame();
	let i = -1;
	for (let k = 0; k < steps.length; k++) if (frame >= steps[k].at) i = k;
	const cur = i >= 0 ? steps[i] : null;
	const prev = i > 0 ? steps[i - 1] : null;
	const p = cur ? (cur.at <= -dur ? 1 : prog(frame, cur.at, dur, E.out)) : 0;
	return (
		<div style={{position: 'relative', height, overflow: 'hidden', ...style}}>
			{prev && p < 1 && <div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-p * 100}%)`, opacity: 1 - p}}>{prev.node}</div>}
			{cur && <div style={{position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${(1 - p) * 100}%)`, opacity: Math.min(1, p * 1.6)}}>{cur.node}</div>}
		</div>
	);
};

/** Ticker text. Letters that differ from `prev` (same index) flash accent from `at` and settle to ink. */
export const TickerWord: React.FC<{text: string; prev?: string; at?: number; fontSize: number; palette?: Palette; hold?: number; color?: string}> = ({
	text,
	prev,
	at = 0,
	fontSize,
	palette: P = cinematic,
	hold = 40,
	color,
}) => {
	const frame = useCurrentFrame();
	const settle = kf(frame, [at + hold, at + hold + 20], [0, 1]);
	return (
		<span style={{fontSize, fontWeight: 900, letterSpacing: -fontSize * 0.03, lineHeight: 1, fontFamily: story.font, whiteSpace: 'nowrap'}}>
			{text.split('').map((ch, i) => {
				const changed = prev !== undefined && prev[i] !== ch;
				return (
					<span key={i} style={{color: color ?? (changed ? mixColor(P.accent, P.ink, settle) : P.ink)}}>
						{ch}
					</span>
				);
			})}
		</span>
	);
};

export const TickerChip: React.FC<{ticker: string; fontSize?: number; palette?: Palette; active?: number; style?: React.CSSProperties}> = ({
	ticker,
	fontSize = 72,
	palette: P = cinematic,
	active = 0,
	style,
}) => (
	<div
		style={{
			padding: `${fontSize * 0.18}px ${fontSize * 0.36}px`,
			borderRadius: fontSize * 0.3,
			background: mixColor('#1B1E23', '#123222', active),
			border: `3px solid ${mixColor('#353A43', P.accent, active)}`,
			fontFamily: story.font,
			fontSize,
			fontWeight: 900,
			letterSpacing: -fontSize * 0.02,
			lineHeight: 1,
			color: P.ink,
			whiteSpace: 'nowrap',
			...style,
		}}
	>
		{ticker}
	</div>
);

/** Linear blend between two #rrggbb colours. */
export const mixColor = (a: string, b: string, t: number) => {
	const k = Math.max(0, Math.min(1, t));
	const pa = parseInt(a.slice(1), 16);
	const pb = parseInt(b.slice(1), 16);
	const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
	return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
