import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {E, kf} from '../../story/lib/motion';
import {cinematic, story, type Palette} from '../../story/theme';

/** Brief palette: matte black, white, green #39FF88, red #FF4655, muted gray. */
export const C = {
	bg: '#0B0D0C',
	bg2: '#131715',
	panel: '#151917',
	line: '#26302B',
	ink: '#F5F7F5',
	body: '#C9D0CB',
	muted: '#8A938D',
	green: '#39FF88',
	red: '#FF4655',
};

const base: Palette = {
	...cinematic,
	bg: C.bg,
	bg2: C.bg2,
	paper: C.panel,
	ink: C.ink,
	body: C.body,
	muted: C.muted,
	line: C.line,
	accent: C.green,
	accentDeep: '#1FB862',
	accentSoft: 'rgba(57,255,136,0.14)',
	danger: C.red,
	dangerSoft: 'rgba(255,70,85,0.14)',
};
/** Caption emphasis follows the story: red while the market falls, green for the decision, white for risk. */
export const RED: Palette = {...base, accent: C.red};
export const GREEN: Palette = base;
export const NEUTRAL: Palette = {...base, accent: C.ink};

/** Matte black stage: soft tinted key light, faint editorial grid, vignette, grain. */
export const NewsBg: React.FC<{tint?: 'red' | 'green' | 'none'; lightX?: number; lightY?: number; light?: number; grid?: boolean}> = ({
	tint = 'none',
	lightX = 540,
	lightY = 760,
	light = 1,
	grid = true,
}) => {
	const col = tint === 'red' ? '255,70,85' : tint === 'green' ? '57,255,136' : '235,240,236';
	const a = (tint === 'none' ? 0.06 : 0.12) * light;
	return (
		<AbsoluteFill style={{background: C.bg}}>
			<AbsoluteFill style={{background: `radial-gradient(1000px 1000px at ${lightX}px ${lightY}px, rgba(${col},${a}) 0%, rgba(0,0,0,0) 70%)`}} />
			{grid && (
				<AbsoluteFill
					style={{
						backgroundImage:
							'linear-gradient(rgba(255,255,255,0.028) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.028) 2px, transparent 2px)',
						backgroundSize: '120px 120px',
						backgroundPosition: '-12px 40px',
					}}
				/>
			)}
			<AbsoluteFill style={{background: 'radial-gradient(120% 85% at 50% 45%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%)'}} />
			<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.08, mixBlendMode: 'overlay'}}>
				<filter id="mcgrain">
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={5} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#mcgrain)" />
			</svg>
		</AbsoluteFill>
	);
};

/** Small uppercase label. */
export const Kicker: React.FC<{children: React.ReactNode; color?: string; style?: React.CSSProperties; size?: number}> = ({children, color = C.muted, style, size = 30}) => (
	<div style={{position: 'absolute', fontFamily: story.font, fontSize: size, fontWeight: 800, letterSpacing: 4, color, textTransform: 'uppercase', ...style}}>{children}</div>
);

/** Source credit: small but readable (24 px), sits just above the caption band, never over it. */
export const SourceTag: React.FC<{text: string; at?: number; extra?: string}> = ({text, at = 0, extra}) => {
	const frame = useCurrentFrame();
	const o = kf(frame, [at, at + 10], [0, 1], E.out);
	return (
		<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: extra ? 1318 : 1352, fontFamily: story.font, opacity: o}}>
			{extra && <div style={{fontSize: 24, fontWeight: 700, letterSpacing: 2, color: C.body, marginBottom: 8}}>{extra}</div>}
			<div style={{fontSize: 24, fontWeight: 700, letterSpacing: 2.5, color: C.muted}}>{text}</div>
		</div>
	);
};

/** Signed percentage, one decimal, tabular. `v` is the live (animated) magnitude. */
export const Pct: React.FC<{v: number; size: number; color: string; style?: React.CSSProperties}> = ({v, size, color, style}) => (
	<span style={{fontFamily: story.font, fontSize: size, fontWeight: 900, color, letterSpacing: -size * 0.03, fontVariantNumeric: 'tabular-nums', lineHeight: 1, whiteSpace: 'nowrap', ...style}}>
		{Math.abs(v) < 0.05 ? '' : '−'}{Math.abs(v).toFixed(1)}%
	</span>
);

/** One shared scale for every decline in the video: 0 … −10 %. Bars are true to scale. */
export const SCALE_MAX = 10;
export const ScaleBar: React.FC<{
	value: number; // live magnitude (positive number = % drop)
	w: number;
	h?: number;
	color?: string;
	ticks?: boolean;
	ghosts?: {v: number; label: string}[];
	ghostOpacity?: number;
	style?: React.CSSProperties;
}> = ({value, w, h = 26, color = C.red, ticks = true, ghosts = [], ghostOpacity = 1, style}) => {
	const px = (v: number) => (Math.min(SCALE_MAX, Math.abs(v)) / SCALE_MAX) * w;
	return (
		<div style={{position: 'absolute', width: w, height: h + (ticks ? 44 : 0), fontFamily: story.font, ...style}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: h / 2, background: 'rgba(255,255,255,0.07)'}} />
			<div style={{position: 'absolute', left: 0, top: 0, width: px(value), height: h, borderRadius: h / 2, background: color, boxShadow: `0 0 30px ${color}55`}} />
			{ghosts.map((g) => (
				<div key={g.label} style={{position: 'absolute', left: px(g.v) - 2, top: -16, width: 4, height: h + 32, background: C.ink, opacity: 0.75 * ghostOpacity, borderRadius: 2}}>
					<div style={{position: 'absolute', top: -38, left: -150, width: 300, textAlign: 'center', fontSize: 24, fontWeight: 800, letterSpacing: 1, color: C.body}}>{g.label}</div>
				</div>
			))}
			{ticks &&
				[0, 2, 4, 6, 8, 10].map((t) => (
					<div key={t} style={{position: 'absolute', left: px(t) - 40, top: h + 12, width: 80, textAlign: 'center', fontSize: 24, fontWeight: 700, color: C.muted}}>
						{t === 0 ? '0%' : `−${t}%`}
					</div>
				))}
		</div>
	);
};
