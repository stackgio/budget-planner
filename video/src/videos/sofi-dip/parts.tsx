import React from 'react';
import {Screenshot, type Region} from '../../story/components/Screenshot';
import {cinematic, story, type Palette} from '../../story/theme';
import {DATES, NASDAQ} from './facts';

/* ------------------------------------------------------------------ */
/* Real Nasdaq Composite closes, Oct 6 → Nov 5, 2026 (shared by panic,  */
/* opposite and opp scenes so the line carries across the cuts).        */
/* ------------------------------------------------------------------ */
export const CHART = {x: 70, y: 560, w: 940, h: 640, pad: {l: 30, r: 70, t: 40, b: 70}};
const LO = 24000;
const HI = 27800;
const PW = CHART.w - CHART.pad.l - CHART.pad.r;
const PH = CHART.h - CHART.pad.t - CHART.pad.b;
export const chartX = (i: number) => CHART.x + CHART.pad.l + (i / (NASDAQ.length - 1)) * PW;
export const chartY = (v: number) => CHART.y + CHART.pad.t + PH - ((v - LO) / (HI - LO)) * PH;
export const LAST = {x: chartX(NASDAQ.length - 1), y: chartY(NASDAQ[NASDAQ.length - 1])};

const fmtDate = (d: string) => {
	const [, m, day] = d.split('-').map(Number);
	return `${['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][m]} ${day}`;
};

/** Draws the real index line up to `progress` (0..1). */
export const NasdaqLine: React.FC<{progress: number; color: string; fill?: number; opacity?: number; labels?: number; tipGlow?: number}> = ({
	progress,
	color,
	fill = 1,
	opacity = 1,
	labels = 1,
	tipGlow = 1,
}) => {
	const n = NASDAQ.length;
	const reach = Math.max(0, Math.min(1, progress)) * (n - 1);
	const last = Math.floor(reach);
	let d = `M${chartX(0)},${chartY(NASDAQ[0])}`;
	for (let i = 1; i <= last; i++) d += `L${chartX(i).toFixed(1)},${chartY(NASDAQ[i]).toFixed(1)}`;
	let tx = chartX(last);
	let ty = chartY(NASDAQ[last]);
	if (last < n - 1) {
		const f = reach - last;
		tx = chartX(last) + (chartX(last + 1) - chartX(last)) * f;
		ty = chartY(NASDAQ[last] + (NASDAQ[last + 1] - NASDAQ[last]) * f);
		d += `L${tx.toFixed(1)},${ty.toFixed(1)}`;
	}
	const base = CHART.y + CHART.pad.t + PH;
	return (
		<div style={{position: 'absolute', inset: 0, opacity}}>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="nqfill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={color} stopOpacity={0.3 * fill} />
						<stop offset="100%" stopColor={color} stopOpacity={0} />
					</linearGradient>
				</defs>
				{/* baseline + light gridlines */}
				{[25000, 26000, 27000].map((v) => (
					<line key={v} x1={CHART.x + CHART.pad.l} x2={CHART.x + CHART.pad.l + PW} y1={chartY(v)} y2={chartY(v)} stroke="#23262C" strokeWidth={2} />
				))}
				<line x1={CHART.x + CHART.pad.l} x2={CHART.x + CHART.pad.l + PW} y1={base} y2={base} stroke="#3A3E46" strokeWidth={4} />
				<path d={`${d}L${tx},${base}L${chartX(0)},${base}Z`} fill="url(#nqfill)" />
				<path d={d} fill="none" stroke={color} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" style={{filter: `drop-shadow(0 0 ${14 * tipGlow}px ${color}88)`}} />
				<circle cx={tx} cy={ty} r={14} fill={color} stroke={cinematic.bg} strokeWidth={6} />
			</svg>
			<div style={{position: 'absolute', left: chartX(0) - 10, top: base + 18, fontSize: 26, fontWeight: 800, letterSpacing: 2, color: cinematic.muted, opacity: labels}}>
				{fmtDate(DATES[0])}
			</div>
			<div style={{position: 'absolute', left: chartX(n - 1) - 60, top: base + 18, fontSize: 26, fontWeight: 800, letterSpacing: 2, color: cinematic.ink, opacity: labels * Math.min(1, Math.max(0, (progress - 0.9) * 10))}}>
				{fmtDate(DATES[n - 1])}
			</div>
		</div>
	);
};

/** Small uppercase label with letter-spacing. */
export const Label: React.FC<{children: React.ReactNode; color: string; size?: number; style?: React.CSSProperties}> = ({children, color, size = 28, style}) => (
	<div style={{fontSize: size, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', color, ...style}}>{children}</div>
);

/* ------------------------------------------------------------------ */
/* The creator's REAL order confirmation (1206×2622, unaltered).        */
/* We only crop out the phone status bar / backdrop and highlight rows. */
/* ------------------------------------------------------------------ */
export const ORDER = {src: 'motion/sofi-dip/assets/sofi-order.png', natural: {w: 1206, h: 2622}};
/** card crop: title → Done button (status bar and empty backdrop removed) */
export const CROP: Region = {x: 0, y: 625, w: 1206, h: 1150};
export const ROWS = {
	title: {x: 50, y: 690, w: 860, h: 110},
	shares: {x: 55, y: 1060, w: 1100, h: 92},
	price: {x: 55, y: 1233, w: 1100, h: 92},
	total: {x: 55, y: 1406, w: 1100, h: 92},
} satisfies Record<string, Region>;

export const OrderShot: React.FC<{w: number; mark?: Region; highlight?: number; zoom?: Region; style?: React.CSSProperties; palette?: Palette}> = ({
	w,
	mark,
	highlight = 0,
	zoom = CROP,
	style,
	palette = cinematic,
}) => (
	<Screenshot
		src={ORDER.src}
		natural={ORDER.natural}
		w={w}
		viewportH={(w * CROP.h) / CROP.w}
		zoomTo={zoom}
		focus={1}
		mark={mark}
		highlight={highlight}
		frame="card"
		palette={palette}
		style={style}
	/>
);

export const lerpRegion = (a: Region, b: Region, t: number): Region => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
	w: a.w + (b.w - a.w) * t,
	h: a.h + (b.h - a.h) * t,
});

/** Typographic ticker badge (no logo is drawn — the official logo file was not retrievable). */
export const TickerBadge: React.FC<{scale?: number; palette: Palette; reveal?: number}> = ({scale = 1, palette, reveal = 1}) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 22 * scale,
			padding: `${22 * scale}px ${40 * scale}px`,
			borderRadius: 28 * scale,
			background: palette.name === 'cinematic' ? palette.paper : '#121316',
			boxShadow: `0 24px 50px ${palette.shadow}`,
			fontFamily: story.font,
		}}
	>
		<div style={{fontSize: 30 * scale, fontWeight: 800, letterSpacing: 4, color: '#9AA1AB'}}>NASDAQ:</div>
		<div style={{position: 'relative', fontSize: 96 * scale, fontWeight: 900, letterSpacing: -2, color: '#FFFFFF', lineHeight: 1}}>
			<span style={{filter: `blur(${(1 - reveal) * 26}px)`, opacity: 0.25 + 0.75 * reveal}}>SOFI</span>
			<span style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 - reveal, color: '#9AA1AB'}}>????</span>
		</div>
	</div>
);
