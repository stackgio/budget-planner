import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import type {RecMask} from '../../story/components/ScreenRecording';
import {E, kf, sp} from '../../story/lib/motion';
import {brandDark as P, story} from '../../story/theme';

export {P};
export const FONT = story.font;
export const L = story.safe.left; // 72
export const R = story.width - story.safe.right; // 960
export const CW = R - L; // 888 content width

/** Matte black stage with a faint green key from the top and a soft vignette. */
export const BrandBg: React.FC<{glowX?: number; glowY?: number; glow?: number}> = ({glowX = 540, glowY = 420, glow = 1}) => (
	<AbsoluteFill style={{background: P.bg}}>
		<AbsoluteFill style={{background: `radial-gradient(1000px 900px at ${glowX}px ${glowY}px, rgba(57,255,20,${0.06 * glow}) 0%, rgba(0,0,0,0) 70%)`}} />
		<AbsoluteFill
			style={{
				backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
				backgroundSize: '90px 90px',
				maskImage: 'radial-gradient(80% 60% at 50% 40%, black 0%, transparent 100%)',
				WebkitMaskImage: 'radial-gradient(80% 60% at 50% 40%, black 0%, transparent 100%)',
			}}
		/>
		<AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.65) 100%)'}} />
	</AbsoluteFill>
);

/** Numbered step chip — the rail that ties the tutorial together ("02 · ACCOUNT"). */
export const StepTag: React.FC<{n: string; label: string; at: number; style?: React.CSSProperties}> = ({n, label, at, style}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, 'bouncy');
	const pl = sp(frame, fps, at + 5, 'snappy');
	return (
		<div style={{position: 'absolute', display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONT, ...style}}>
			<div
				style={{
					width: 74,
					height: 74,
					borderRadius: 20,
					background: P.accent,
					color: P.bg,
					fontSize: 36,
					fontWeight: 900,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					transform: `scale(${p})`,
				}}
			>
				{n}
			</div>
			<div style={{overflow: 'hidden'}}>
				<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 4, color: P.body, transform: `translateX(${(1 - pl) * -110}%)`}}>{label}</div>
			</div>
		</div>
	);
};

/** Small letter-spaced uppercase label. */
export const Label: React.FC<{children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties}> = ({children, color = P.muted, size = 26, style}) => (
	<div style={{fontFamily: FONT, fontSize: size, fontWeight: 800, letterSpacing: 3.5, textTransform: 'uppercase', color, ...style}}>{children}</div>
);

/** Pill / chip. */
export const Pill: React.FC<{children: React.ReactNode; tone?: 'accent' | 'ghost' | 'gold' | 'dark'; size?: number; style?: React.CSSProperties}> = ({children, tone = 'ghost', size = 28, style}) => {
	const bg = tone === 'accent' ? P.accent : tone === 'gold' ? 'rgba(240,182,74,0.14)' : tone === 'dark' ? '#000' : 'rgba(255,255,255,0.06)';
	const fg = tone === 'accent' ? P.bg : tone === 'gold' ? P.gold : P.ink;
	const bd = tone === 'accent' ? P.accent : tone === 'gold' ? 'rgba(240,182,74,0.5)' : 'rgba(255,255,255,0.14)';
	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 12,
				padding: `${size * 0.42}px ${size * 0.8}px`,
				borderRadius: 999,
				background: bg,
				border: `2px solid ${bd}`,
				color: fg,
				fontFamily: FONT,
				fontWeight: 800,
				fontSize: size,
				letterSpacing: 2,
				textTransform: 'uppercase',
				whiteSpace: 'nowrap',
				...style,
			}}
		>
			{children}
		</div>
	);
};

/** "EXAMPLE" stamp for hypothetical numbers. */
export const ExampleTag: React.FC<{style?: React.CSSProperties; text?: string}> = ({style, text = 'Example'}) => (
	<div style={{position: 'absolute', ...style}}>
		<Pill tone="gold" size={24}>
			{text}
		</Pill>
	</div>
);

/** Decimal number that counts to an exact value and settles (tabular). */
export const Num: React.FC<{value: number; p: number; decimals: number; prefix?: string; suffix?: string; size: number; color?: string; style?: React.CSSProperties}> = ({value, p, decimals, prefix = '', suffix = '', size, color = P.ink, style}) => {
	const v = p >= 0.999 ? value : value * Math.max(0, p);
	return (
		<span style={{fontFamily: FONT, fontSize: size, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', letterSpacing: -size * 0.02, whiteSpace: 'nowrap', ...style}}>
			{prefix}
			{v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals})}
			{suffix}
		</span>
	);
};

/** Fade+rise helper for blocks. */
export const useIn = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (at: number, kind: 'snappy' | 'bouncy' | 'heavy' | 'smooth' = 'snappy', dist = 40) => {
		const p = sp(frame, fps, at, kind);
		return {opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * dist}px)`} as React.CSSProperties;
	};
};
export const fadeOut = (frame: number, at: number, dur = 10) => kf(frame, [at, at + dur], [1, 0], E.in);

// ---------------------------------------------------------------------------
// The creator's Robinhood recording (image sequence of the ORIGINAL file,
// extracted from 1.5 s onward so the home screen balance is never used).
// Index n = original time 1.5 s + n/30 s.
// ---------------------------------------------------------------------------
export const REC = {
	dir: 'motion/beginner-investing-guide/assets/rec',
	count: 447,
	natural: {w: 1206, h: 2622},
	/** recording-frame landmarks */
	at: {
		searchEmpty: 20,
		typing: 42,
		vooResults: 66,
		vooDetail: 112,
		tradeMenu: 150,
		buyLoading: 192,
		buyReady: 210,
		sharesTyped: 262,
		review: 300,
		sending: 336,
		queued: 392,
		last: 446,
	},
};

/** Privacy masks (natural px) — holdings, position value, buying power. */
export const REC_MASKS: RecMask[] = [
	{x: 36, y: 742, w: 440, h: 80, from: 55, to: 106}, // "VOO · 2.95 shares" in search results
	{x: 0, y: 2316, w: 1206, h: 306, from: 99, to: 193}, // "Your position" rows (shares, value, return)
	{x: 190, y: 1430, w: 870, h: 1192, from: 199, to: 208}, // buying-power line while the sheet slides up
	{x: 230, y: 1432, w: 800, h: 114, from: 209, to: 292}, // "Individual · $X available"
];

/** Regions of interest in the recording (natural px). */
export const REC_ROI = {
	searchField: {x: 60, y: 205, w: 910, h: 145},
	vooRow: {x: 40, y: 670, w: 1126, h: 150},
	vooName: {x: 40, y: 682, w: 560, h: 136},
	title: {x: 60, y: 370, w: 1100, h: 360},
	tradeBtn: {x: 598, y: 2188, w: 548, h: 146},
	buyBtn: {x: 588, y: 2030, w: 556, h: 146},
	// buy entry screen
	sharesRow: {x: 50, y: 575, w: 1100, h: 95},
	estCost: {x: 50, y: 915, w: 1100, h: 95},
	// review screen
	reviewEst: {x: 50, y: 975, w: 1100, h: 95},
	accountRow: {x: 50, y: 1145, w: 1100, h: 95},
	swipe: {x: 260, y: 2400, w: 690, h: 150},
	// queued confirmation
	queuedTitle: {x: 50, y: 700, w: 1110, h: 260},
	queuedRows: {x: 50, y: 1060, w: 1110, h: 470},
};
