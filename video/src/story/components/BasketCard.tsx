import React from 'react';
import {mix} from '../lib/motion';
import {story, type Palette} from '../theme';

/**
 * A fund card that turns into an open "basket" (the ETF-as-a-basket metaphor).
 *  basket 0 → solid ticker card · basket 1 → ticker label above an open container.
 *  active 0..1 lights the card in the palette accent (reserve it for the fund
 *  being explained) and lifts it slightly; `punch` adds a short scale hit.
 *  flip 0..1 squashes the card horizontally (swap the ticker at 0.5).
 * Children are positioned in card-local px (0..w, 0..h).
 */
export const BasketCard: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	ticker: string;
	tickerSize: number;
	/** y of the ticker baseline box top when basket = 1 */
	tickerTop?: number;
	/** top of the container walls (card-local) */
	basketTop: number;
	basket: number;
	active: number;
	punch?: number;
	flip?: number;
	dim?: number;
	opacity?: number;
	palette: Palette;
	children?: React.ReactNode;
}> = ({x, y, w, h, ticker, tickerSize, tickerTop = 26, basketTop, basket, active, punch = 0, flip = 0, dim = 0, opacity = 1, palette: P, children}) => {
	const line = mix(0, 1, active);
	const border = active > 0.01 ? lerpColor('#3A3F48', P.accent, line) : '#3A3F48';
	const pad = 22;
	const r = 34;
	const bottom = h - pad;
	const lip = 16;
	const path = `M ${pad - lip} ${basketTop} L ${pad} ${basketTop} L ${pad} ${bottom - r} Q ${pad} ${bottom} ${pad + r} ${bottom} L ${w - pad - r} ${bottom} Q ${w - pad} ${bottom} ${w - pad} ${bottom - r} L ${w - pad} ${basketTop} L ${w - pad + lip} ${basketTop}`;
	const tickerY = mix(h / 2 - tickerSize * 0.62, tickerTop, basket);
	const lift = -14 * active;
	const scale = 1 + 0.035 * punch;
	const sx = Math.abs(Math.cos(Math.PI * flip));
	const tickerColor = active > 0.01 ? lerpColor(P.ink, P.accent, line) : P.ink;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				transform: `translateY(${lift}px) scale(${scale * sx}, ${scale})`,
				transformOrigin: '50% 50%',
				opacity,
			}}
		>
			{/* solid card panel (fades as it becomes a basket) */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 36,
					background: P.paper,
					border: `5px solid ${border}`,
					opacity: 1 - basket,
					boxShadow: active > 0.01 ? `0 0 ${60 * active}px ${hexA(P.accent, 0.22 * active)}` : 'none',
				}}
			/>
			{/* the open container */}
			<svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
				<path d={`${path} Z`} fill={P.paper} opacity={basket} stroke="none" />
				<path
					d={path}
					fill="none"
					stroke={border}
					strokeWidth={7}
					strokeLinecap="round"
					strokeLinejoin="round"
					pathLength={1}
					strokeDasharray={1}
					strokeDashoffset={1 - basket}
				/>
			</svg>
			{children}
			<div
				style={{
					position: 'absolute',
					left: 0,
					width: w,
					top: tickerY,
					textAlign: 'center',
					fontFamily: story.font,
					fontWeight: 900,
					fontSize: tickerSize,
					letterSpacing: -2,
					lineHeight: 1,
					color: tickerColor,
				}}
			>
				{ticker}
			</div>
			{dim > 0 && <div style={{position: 'absolute', inset: -20, background: P.bg, opacity: dim, borderRadius: 40}} />}
		</div>
	);
};

/** A labelled stock/category tile that sits inside a basket. */
export const StockTile: React.FC<{
	x: number;
	y: number;
	w: number;
	h: number;
	label?: React.ReactNode;
	tone?: 'dark' | 'light' | 'ghost';
	accent?: number;
	fontSize?: number;
	palette: Palette;
	opacity?: number;
	scale?: number;
	rot?: number;
	children?: React.ReactNode;
}> = ({x, y, w, h, label, tone = 'dark', accent = 0, fontSize = 30, palette: P, opacity = 1, scale = 1, rot = 0, children}) => {
	const bg = tone === 'light' ? '#FFFFFF' : tone === 'ghost' ? 'transparent' : '#262A31';
	const fg = tone === 'light' ? '#0B0C0E' : P.ink;
	const bd = tone === 'ghost' ? 'rgba(245,242,234,0.55)' : tone === 'light' ? '#FFFFFF' : '#40454E';
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				borderRadius: 14,
				background: bg,
				border: `${tone === 'ghost' ? 4 : 3}px ${tone === 'ghost' ? 'dashed' : 'solid'} ${accent > 0.01 ? lerpColor(bd, P.accent, accent) : bd}`,
				boxShadow: accent > 0.01 ? `0 0 0 ${5 * accent}px ${hexA(P.accent, 0.9 * accent)}` : 'none',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 12,
				fontFamily: story.font,
				fontWeight: 800,
				fontSize,
				letterSpacing: 2,
				color: fg,
				opacity,
				transform: `scale(${scale}) rotate(${rot}deg)`,
				whiteSpace: 'nowrap',
			}}
		>
			{children}
			{label}
		</div>
	);
};

// ---- colour helpers -------------------------------------------------------
const parse = (c: string): [number, number, number] => {
	const h = c.replace('#', '');
	const n = parseInt(h.length === 3 ? h.replace(/./g, (m) => m + m) : h.slice(0, 6), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const lerpColor = (a: string, b: string, t: number) => {
	if (!a.startsWith('#') || !b.startsWith('#')) return t < 0.5 ? a : b;
	const A = parse(a);
	const B = parse(b);
	const k = Math.max(0, Math.min(1, t));
	return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
};
export const hexA = (c: string, a: number) => {
	const [r, g, b] = parse(c);
	return `rgba(${r},${g},${b},${a})`;
};
