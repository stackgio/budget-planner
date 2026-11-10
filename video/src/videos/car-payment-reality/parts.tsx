import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {E, kf} from '../../story/lib/motion';
import type {Narration} from '../../story/lib/narration';
import {cinematic, story, type Palette} from '../../story/theme';
import {CAPTIONS} from './script';

/** Matte black / white / bright green — this video's only colours. */
export const M = {
	bg: '#0B0C0E',
	bg2: '#141619',
	ink: '#F5F2EA', // white type on black
	muted: '#8A9099',
	line: '#2A2E35',
	green: '#2CE07F', // the number or action that matters right now
	paper: '#FAFAF7',
	paperInk: '#0E0F12',
	paperMuted: '#7D828A',
	paperLine: '#D9DCD8',
	font: story.font,
} as const;

export const matte: Palette = {...cinematic, bg: M.bg, ink: M.ink, accent: M.green};

/** Center column clear of the right-side platform buttons (72 … 960). */
export const CX = (story.safe.left + (story.width - story.safe.right)) / 2; // 516

/* ───────────────────────── car key ───────────────────────── */

/**
 * A plain modern car key (fob + blade), drawn upright in a 140×330 box.
 * `x/y` is the centre, `rot` in degrees, `shadow` 0..1 grounds it on a surface.
 */
export const CarKey: React.FC<{x: number; y: number; rot?: number; scale?: number; shadow?: number; opacity?: number}> = ({
	x,
	y,
	rot = 0,
	scale = 1,
	shadow = 1,
	opacity = 1,
}) => (
	<div
		style={{
			position: 'absolute',
			left: x - 70,
			top: y - 165,
			width: 140,
			height: 330,
			transform: `rotate(${rot}deg) scale(${scale})`,
			transformOrigin: '50% 50%',
			opacity,
			filter: shadow > 0 ? `drop-shadow(0 ${14 * shadow}px ${16 * shadow}px rgba(0,0,0,${0.55 * shadow}))` : undefined,
		}}
	>
		<svg width={140} height={330} viewBox="0 0 140 330" style={{overflow: 'visible'}}>
			{/* key ring */}
			<circle cx={70} cy={22} r={20} fill="none" stroke="#C9CDD3" strokeWidth={6} />
			{/* blade */}
			<path d="M56,190 H84 V300 L78,312 H62 L56,304 V286 L62,280 V266 L56,260 V246 L62,240 V226 L56,220 Z" fill="#CDD1D6" />
			<path d="M70,196 V300" stroke="#9EA4AB" strokeWidth={3} />
			{/* fob */}
			<rect x={14} y={34} width={112} height={164} rx={44} fill="#1A1C20" stroke="#F5F2EA" strokeWidth={5} />
			<rect x={24} y={44} width={92} height={144} rx={36} fill="none" stroke="#2E3238" strokeWidth={3} />
			{/* buttons: lock / unlock / trunk */}
			<circle cx={70} cy={78} r={15} fill="none" stroke="#BFC4CB" strokeWidth={4} />
			<circle cx={70} cy={118} r={15} fill="none" stroke="#BFC4CB" strokeWidth={4} />
			<circle cx={70} cy={158} r={15} fill="none" stroke="#BFC4CB" strokeWidth={4} />
			<path d="M64,80 h12 v8 h-12 z M66,80 v-5 a4,4 0 0 1 8,0 v5" fill="none" stroke="#BFC4CB" strokeWidth={2.5} />
			<path d="M64,120 h12 v8 h-12 z M66,120 v-5 a4,4 0 0 1 8,-1" fill="none" stroke="#BFC4CB" strokeWidth={2.5} />
			<path d="M62,160 h16 M64,154 h12" stroke="#BFC4CB" strokeWidth={3} strokeLinecap="round" />
		</svg>
	</div>
);

/* ───────────────────────── car silhouettes ───────────────────────── */

const Wheel: React.FC<{cx: number; cy: number; r: number}> = ({cx, cy, r}) => (
	<g>
		<circle cx={cx} cy={cy} r={r + 9} fill={M.bg} />
		<circle cx={cx} cy={cy} r={r} fill="#16181C" stroke={M.ink} strokeWidth={5} />
		<circle cx={cx} cy={cy} r={r * 0.5} fill="#3A3F46" stroke="#8E949C" strokeWidth={3} />
		<circle cx={cx} cy={cy} r={r * 0.12} fill={M.ink} />
	</g>
);

/** Long, low "nice car" coupe. viewBox 800×280, ground at y=272. */
export const CoupeSilhouette: React.FC<{w: number; style?: React.CSSProperties}> = ({w, style}) => (
	<svg width={w} height={(w * 280) / 800} viewBox="0 0 800 280" style={{overflow: 'visible', ...style}}>
		<ellipse cx={400} cy={274} rx={360} ry={10} fill="rgba(0,0,0,0.6)" />
		<path
			d="M28,214 C26,190 40,170 82,163 L238,146 C290,104 352,80 432,78 C506,77 566,98 628,140 L722,154 C760,160 782,182 784,208 L786,226 C786,234 780,238 772,238 L40,238 C32,238 28,232 28,224 Z"
			fill={M.ink}
		/>
		<path d="M300,146 C338,112 382,96 432,94 C476,93 520,108 566,142 Z" fill={M.bg} />
		<path d="M444,94 L436,146" stroke={M.ink} strokeWidth={9} />
		<path d="M80,190 H130 M700,182 L760,186" stroke={M.bg} strokeWidth={6} strokeLinecap="round" />
		<path d="M250,186 H600" stroke="#C9CDD3" strokeWidth={3} />
		<Wheel cx={192} cy={232} r={40} />
		<Wheel cx={630} cy={232} r={40} />
	</svg>
);

/** Everyday compact hatchback: taller cabin, shorter nose. viewBox 800×300, ground at y=292. */
export const HatchSilhouette: React.FC<{w: number; style?: React.CSSProperties}> = ({w, style}) => (
	<svg width={w} height={(w * 300) / 800} viewBox="0 0 800 300" style={{overflow: 'visible', ...style}}>
		<ellipse cx={400} cy={294} rx={330} ry={10} fill="rgba(0,0,0,0.6)" />
		<path
			d="M70,226 C68,196 80,178 120,170 L216,158 C246,110 290,70 352,62 L590,58 C640,58 668,80 690,150 L720,160 C742,168 748,190 748,214 L748,246 C748,254 742,258 734,258 L84,258 C76,258 70,252 70,244 Z"
			fill={M.ink}
		/>
		<path d="M250,156 C276,112 308,84 356,78 L456,76 L456,156 Z" fill={M.bg} />
		<path d="M474,76 L586,74 C620,74 640,96 660,156 L474,156 Z" fill={M.bg} />
		<path d="M110,200 H150 M690,188 L736,192" stroke={M.bg} strokeWidth={6} strokeLinecap="round" />
		<path d="M466,170 V246 M300,176 H330 M496,176 H526" stroke="#B9BEC5" strokeWidth={3} />
		<Wheel cx={206} cy={252} r={42} />
		<Wheel cx={608} cy={252} r={42} />
	</svg>
);

/* ───────────────────────── phrase captions ───────────────────────── */

type Phrase = {text: string; start: number; end: number};

const buildPhrases = (n: Narration): Phrase[] => {
	const out: Phrase[] = [];
	for (const line of n.lines) {
		const spec = CAPTIONS[line.id];
		if (!spec) throw new Error(`captions: no phrases for ${line.id}`);
		const total = spec.reduce((a, [, k]) => a + k, 0);
		if (total !== line.words.length) throw new Error(`captions: ${line.id} covers ${total} words, line has ${line.words.length}`);
		let i = 0;
		for (const [text, k] of spec) {
			out.push({text, start: line.words[i].start, end: line.words[i + k - 1].end});
			i += k;
		}
	}
	return out;
};

/** Phrase-level captions (max two lines) in the band above the platform UI. Plain white: green stays on screen for the math. */
export const PhraseCaptions: React.FC<{narration: Narration}> = ({narration}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	const phrases = React.useMemo(() => buildPhrases(narration), [narration]);
	const idx = phrases.findIndex((p, i) => t >= p.start - 0.06 && t < Math.min(phrases[i + 1]?.start ?? Infinity, p.end + 0.5) - 0.06);
	if (idx < 0) return null;
	const p = phrases[idx];
	const local = frame - Math.round((p.start - 0.06) * fps);
	const pIn = kf(local, [0, 4], [0, 1], E.out);
	const next = phrases[idx + 1]?.start ?? Infinity;
	const fade = next - p.end > 0.45 ? kf(t, [p.end + 0.3, p.end + 0.44], [1, 0]) : 1;
	return (
		<div
			style={{
				position: 'absolute',
				left: story.safe.left + 8,
				right: story.safe.right + 8,
				top: story.captionTop + 6,
				display: 'flex',
				justifyContent: 'center',
				textAlign: 'center',
				fontFamily: M.font,
				fontSize: 54,
				fontWeight: 900,
				letterSpacing: -0.5,
				textTransform: 'uppercase',
				lineHeight: 1.12,
				color: M.ink,
				textShadow: '0 3px 14px rgba(0,0,0,0.85)',
				transform: `translateY(${(1 - pIn) * 10}px)`,
				opacity: pIn * fade,
				maxHeight: 54 * 1.12 * 2 + 4,
				overflow: 'hidden',
			}}
		>
			<span style={{maxWidth: '100%'}}>{p.text}</span>
		</div>
	);
};
