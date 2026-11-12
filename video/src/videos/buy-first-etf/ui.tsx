import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {Region} from '../../story/components/Screenshot';
import type {TimedRegion} from '../../story/components/ScreenRecording';
import {sp} from '../../story/lib/motion';
import {cinematic, story, type Palette} from '../../story/theme';

/** Stack With Gio white look (black / white / green) for the explainer scene. */
export const white: Palette = {
	...cinematic,
	name: 'editorial',
	bg: '#FFFFFF',
	bg2: '#F3F4F2',
	paper: '#FFFFFF',
	ink: '#0E0F12',
	body: '#2B2F36',
	muted: '#7A7F87',
	line: '#E3E5E2',
	accent: '#16A34A',
	accentDeep: '#11803A',
	accentSoft: 'rgba(22,163,74,0.12)',
	shadow: 'rgba(0,0,0,0.12)',
};

/** Gio's real Robinhood capture (HEVC 1206×2622 @60, 16.4 s). */
export const REC = {src: 'motion/buy-first-etf/assets/voo-order.mp4', natural: {w: 1206, h: 2622}};

/** Standard phone placement: large, centred, above the caption band. */
export const PHONE = {x: 190, top: 300, w: 700, h: 1080};
export const phoneStyle = (p = PHONE): React.CSSProperties => ({left: p.x - 14, top: p.top - 14});

/**
 * Private details, keyed to SOURCE seconds (they follow the footage wherever it's shown).
 * Buttons and field labels stay readable; only balances / holdings are blurred.
 */
export const REDACT: TimedRegion[] = [
	{x: 30, y: 300, w: 620, h: 240, from: 0, to: 1.3}, // portfolio value + today's change
	{x: 730, y: 320, w: 430, h: 120, from: 0, to: 1.3}, // account badge
	{x: 800, y: 1655, w: 300, h: 95, from: 0, to: 1.3}, // buying power amount
	{x: 920, y: 1900, w: 220, h: 90, from: 0, to: 1.3}, // portfolio digest gain
	{x: 190, y: 742, w: 290, h: 80, from: 3.3, to: 5.1}, // "· 2.95 shares" (existing holding)
	{x: 0, y: 2335, w: 1206, h: 287, from: 4.9, to: 7.95}, // "Your position" values
	{x: 520, y: 1440, w: 510, h: 95, from: 7.9, to: 11.45}, // "$…available" on the buy screen
	{x: 480, y: 1430, w: 600, h: 310, from: 8.2, to: 8.55}, // same line while the keypad slides up (y 1668 → 1488)
];

/** Tap targets and fields in the recording's natural pixels. */
export const R = {
	buyingPower: {x: 40, y: 1640, w: 1120, h: 125},
	searchTab: {x: 530, y: 2400, w: 140, h: 130},
	searchBar: {x: 80, y: 215, w: 880, h: 120},
	vooRow: {x: 60, y: 668, w: 1120, h: 155},
	trade: {x: 597, y: 2190, w: 538, h: 136},
	buy: {x: 597, y: 2040, w: 538, h: 128},
	sharesRow: {x: 60, y: 572, w: 1090, h: 100},
	estRow: {x: 60, y: 912, w: 1090, h: 100},
	review: {x: 72, y: 1575, w: 1062, h: 130},
	reviewEst: {x: 60, y: 972, w: 1110, h: 105},
	reviewAcct: {x: 60, y: 1142, w: 1110, h: 105},
	swipe: {x: 0, y: 2390, w: 1206, h: 180},
	queuedTitle: {x: 60, y: 708, w: 1110, h: 92},
	queuedSub: {x: 60, y: 808, w: 1110, h: 130},
	queuedShares: {x: 60, y: 1074, w: 1110, h: 96},
} satisfies Record<string, Region>;

export const centre = (r: Region) => ({x: r.x + r.w / 2, y: r.y + r.h / 2});

/** Highlight intensity: rises at `at`, optional fall at `out`. */
export const on = (frame: number, at: number, out = Infinity, dur = 7) => {
	const a = Math.min(1, Math.max(0, (frame - at) / dur));
	const b = Math.min(1, Math.max(0, (frame - out) / dur));
	return a * (1 - b);
};

/** Tap marker progress around frame `at` (the finger lands at `at`). */
export const tapP = (frame: number, at: number) => (frame - (at - 6)) / 26;

/** Persistent "STEP 0N · LABEL" header so viewers can follow with their app open. */
export const StepHeader: React.FC<{steps: {at: number; n: string; label: string}[]; palette: Palette; top?: number}> = ({steps, palette, top = story.safe.top + 6}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	let idx = -1;
	steps.forEach((s, i) => {
		if (frame >= s.at) idx = i;
	});
	if (idx < 0) return null;
	const s = steps[idx];
	const p = sp(frame, fps, s.at, 'snappy');
	const prev = idx > 0 ? steps[idx - 1] : null;
	const sameN = prev && prev.n === s.n;
	return (
		<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top, display: 'flex', alignItems: 'center', gap: 18, fontFamily: story.font}}>
			<div
				style={{
					flex: 'none',
					height: 72,
					minWidth: 72,
					padding: '0 14px',
					boxSizing: 'border-box',
					borderRadius: 16,
					background: palette.accent,
					color: '#0B0C0E',
					fontSize: 30,
					fontWeight: 900,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					letterSpacing: 1,
					transform: `scale(${sameN ? 1 : 0.6 + 0.4 * p})`,
				}}
			>
				{s.n}
			</div>
			<div style={{overflow: 'hidden', height: 72, display: 'flex', alignItems: 'center'}}>
				<div style={{fontSize: 44, fontWeight: 900, color: palette.ink, letterSpacing: 0, textTransform: 'uppercase', transform: `translateY(${(1 - p) * 60}px)`, opacity: p, whiteSpace: 'nowrap'}}>{s.label}</div>
			</div>
		</div>
	);
};

/** Short overlay pill (≤ 6 words). */
export const Chip: React.FC<{text: string; at: number; out?: number; x: number; y: number; palette: Palette; tone?: 'accent' | 'ink' | 'dark'; size?: number; anchor?: 'left' | 'center'}> = ({
	text,
	at,
	out,
	x,
	y,
	palette,
	tone = 'accent',
	size = 40,
	anchor = 'center',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	if (frame < at) return null;
	const p = sp(frame, fps, at, 'bouncy');
	const q = out === undefined ? 0 : sp(frame, fps, out, 'snappy');
	if (q >= 0.99) return null;
	const bg = tone === 'accent' ? palette.accent : tone === 'ink' ? palette.ink : 'rgba(14,15,18,0.92)';
	const fg = tone === 'dark' ? '#FFFFFF' : palette.name === 'cinematic' || tone === 'accent' ? '#0B0C0E' : '#FFFFFF';
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(${anchor === 'center' ? '-50%' : '0'}, 0) scale(${(0.5 + 0.5 * p) * (1 - 0.3 * q)})`,
				transformOrigin: anchor === 'center' ? '50% 50%' : '0 50%',
				opacity: Math.min(1, p * 1.4) * (1 - q),
				padding: `${Math.round(size * 0.32)}px ${Math.round(size * 0.6)}px`,
				borderRadius: 999,
				background: bg,
				color: fg,
				fontFamily: story.font,
				fontSize: size,
				fontWeight: 900,
				letterSpacing: 1,
				whiteSpace: 'nowrap',
				boxShadow: '0 16px 36px rgba(0,0,0,0.45)',
				border: tone === 'dark' ? `3px solid ${palette.accent}` : undefined,
			}}
		>
			{text}
		</div>
	);
};
