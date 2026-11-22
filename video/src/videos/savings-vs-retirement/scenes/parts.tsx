import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {desk} from '../../../story/components/Desk';
import {E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';

/** Shared geometry: the two-card overhead framing used by every comparison. */
export const CARD = {w: 416, h: 560, y: 300, lx: 76, rx: 524};
export const CONTENT_CX = (CARD.lx + CARD.rx + CARD.w) / 2; // 508 — centre of the two-card row

export type Box = {x: number; y: number; w: number; h: number; s: number; dim: number};
export const lerpBox = (a: Box, b: Box, t: number): Box => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
	w: a.w + (b.w - a.w) * t,
	h: a.h + (b.h - a.h) * t,
	s: a.s + (b.s - a.s) * t,
	dim: a.dim + (b.dim - a.dim) * t,
});
/** A card of size w×h shown at scale s with its visual top-left at (vx, vy) (cards scale about their centre). */
export const scaledBox = (vx: number, vy: number, w: number, h: number, s: number, dim = 0): Box => ({
	x: vx + (w * s) / 2 - w / 2,
	y: vy + (h * s) / 2 - h / 2,
	w,
	h,
	s,
	dim,
});

/** Masked rise-in for labels. Visible from `at`, optional exit. */
export const Reveal: React.FC<{at: number; exitAt?: number; dy?: number; children: React.ReactNode; style?: React.CSSProperties; spring?: 'snappy' | 'bouncy' | 'smooth'}> = ({
	at,
	exitAt,
	dy = 26,
	children,
	style,
	spring = 'snappy',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, spring);
	const out = exitAt === undefined ? 0 : kf(frame, [exitAt, exitAt + 8], [0, 1], E.in);
	if (frame < at) return null;
	return <div style={{opacity: Math.min(1, p * 1.6) * (1 - out), transform: `translateY(${(1 - p) * dy - out * 12}px)`, ...style}}>{children}</div>;
};

export const Kicker: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = desk.muted}) => (
	<div style={{fontFamily: story.font, fontSize: 24, fontWeight: 800, letterSpacing: 4, color, textTransform: 'uppercase'}}>{children}</div>
);

/** Rounded label chip (exact on-screen wording, sentence case). */
export const Chip: React.FC<{children: React.ReactNode; tone?: 'green' | 'greenOutline' | 'muted' | 'gold' | 'ink'; size?: number; style?: React.CSSProperties}> = ({
	children,
	tone = 'green',
	size = 30,
	style,
}) => {
	const t = {
		green: {bg: desk.green, fg: '#FFFFFF', bd: desk.green},
		greenOutline: {bg: desk.greenSoft, fg: desk.greenDeep, bd: desk.green},
		muted: {bg: 'rgba(17,18,20,0.04)', fg: desk.body, bd: '#CFC9BE'},
		gold: {bg: desk.gold, fg: '#1B1407', bd: desk.gold},
		ink: {bg: desk.ink, fg: '#FFFFFF', bd: desk.ink},
	}[tone];
	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 12,
				padding: `${size * 0.36}px ${size * 0.62}px`,
				borderRadius: size * 0.6,
				background: t.bg,
				color: t.fg,
				border: `3px solid ${t.bd}`,
				fontFamily: story.font,
				fontSize: size,
				fontWeight: 800,
				letterSpacing: -0.2,
				lineHeight: 1.12,
				...style,
			}}
		>
			{children}
		</div>
	);
};

/** Small uppercase owner tag used on deposits ("YOU" / "EMPLOYER"). */
export const OwnerTag: React.FC<{children: React.ReactNode; bg: string; fg: string}> = ({children, bg, fg}) => (
	<div style={{display: 'inline-block', padding: '5px 12px', borderRadius: 8, background: bg, color: fg, fontFamily: story.font, fontSize: 24, fontWeight: 900, letterSpacing: 3, lineHeight: 1}}>{children}</div>
);

/** Dashed empty slot inside an account (where a deposit will land). */
export const Slot: React.FC<{w: number; h: number; style?: React.CSSProperties; opacity?: number}> = ({w, h, style, opacity = 1}) => (
	<div style={{width: w, height: h, borderRadius: 18, border: `3px dashed #D6D0C5`, opacity, ...style}} />
);

/** Simple coin/cash glyph for money chips. */
export const CashGlyph: React.FC<{size?: number; color?: string; bg?: string}> = ({size = 34, color = '#FFFFFF', bg = 'rgba(255,255,255,0.18)'}) => (
	<svg width={size * 1.5} height={size} viewBox="0 0 48 32">
		<rect x={1.5} y={1.5} width={45} height={29} rx={6} fill={bg} stroke={color} strokeWidth={3} />
		<circle cx={24} cy={16} r={7} fill="none" stroke={color} strokeWidth={3} />
	</svg>
);

/** Tiny rising-line glyph for the investment tile. */
export const GrowthGlyph: React.FC<{w?: number; h?: number; color?: string; draw?: number}> = ({w = 120, h = 64, color = desk.green, draw = 1}) => {
	const pts = 'M4 56 L 30 42 L 52 48 L 78 26 L 98 30 L 116 8';
	return (
		<svg width={w} height={h} viewBox="0 0 120 64">
			<path d={pts} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={200} strokeDashoffset={200 * (1 - draw)} />
		</svg>
	);
};
