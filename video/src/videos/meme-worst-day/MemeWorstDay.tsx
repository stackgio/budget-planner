import React from 'react';
import {
	AbsoluteFill,
	Audio,
	Easing,
	Img,
	interpolate,
	OffthreadVideo,
	Sequence,
	staticFile,
	useCurrentFrame,
} from 'remotion';
import '../../fonts';

/**
 * "This is the worst" portfolio meme, 10 s, 1080x1920 @ 30 fps.
 *
 * Assets (public/meme-worst/):
 *  - portfolio.png  real Robinhood screenshot, cropped to balance + daily loss + 1D chart (pixels untouched)
 *  - michael.webm   original meme footage, source 1.6s-8.6s, chroma-keyed (VP9 + alpha), TikTok UI cropped away
 *  - michael.wav    original meme audio for the same 7 s window ("This is the worst" lands at ~3.9 s)
 */

export const MEME_FPS = 30;
export const MEME_FRAMES = 300;

const GREEN = '#2CD47A';
const INK = '#0B0C0E';
const FONT = "'Inter', 'Noto Color Emoji', system-ui, sans-serif";

// Screenshot crop is 1206 x 1180. Points of interest in crop pixels.
const IMG_W = 1206;
const IMG_H = 1180;
const LOSS = {x: 285, y: 192}; // "▼ $373.18 (7.97%)"
const CLIFF = {x: 560, y: 800}; // the steep drop in the 1D chart
const BADGE = {x: 740, y: 30, w: 410, h: 108}; // promo pill next to the balance (app chrome, not data)

type Cam = {zoom: number; fx: number; fy: number; cx: number; cy: number};

// Camera keyframes: image point (fx, fy) is placed at canvas point (cx, cy).
const KEYS: {f: number; cam: Cam; ease?: (t: number) => number}[] = [
	{f: 0, cam: {zoom: 0.8955, fx: IMG_W / 2, fy: IMG_H / 2, cx: 540, cy: 1010}},
	{f: 3, cam: {zoom: 0.8955, fx: IMG_W / 2, fy: IMG_H / 2, cx: 540, cy: 1010}},
	// Hook: push in on the loss number.
	{f: 30, cam: {zoom: 2.1, fx: 318, fy: LOSS.y, cx: 540, cy: 900}, ease: Easing.bezier(0.6, 0, 0.2, 1)},
	{f: 45, cam: {zoom: 2.2, fx: 318, fy: LOSS.y, cx: 540, cy: 900}},
	// Reveal: whip down into the cliff.
	{f: 53, cam: {zoom: 1.95, fx: CLIFF.x, fy: CLIFF.y, cx: 540, cy: 1000}, ease: Easing.out(Easing.cubic)},
	{f: 90, cam: {zoom: 2.1, fx: CLIFF.x, fy: CLIFF.y, cx: 540, cy: 1000}},
	// Reaction: loss number up top, chart behind Michael.
	{f: 98, cam: {zoom: 1.5, fx: LOSS.x, fy: LOSS.y, cx: 430, cy: 625}, ease: Easing.out(Easing.cubic)},
	{f: 300, cam: {zoom: 1.6, fx: LOSS.x, fy: LOSS.y, cx: 440, cy: 625}},
];

const camAt = (frame: number): Cam => {
	let i = 0;
	while (i < KEYS.length - 2 && frame >= KEYS[i + 1].f) i++;
	const a = KEYS[i];
	const b = KEYS[i + 1];
	const t = interpolate(frame, [a.f, b.f], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: b.ease ?? Easing.linear,
	});
	const mix = (k: keyof Cam) => a.cam[k] + (b.cam[k] - a.cam[k]) * t;
	return {zoom: mix('zoom'), fx: mix('fx'), fy: mix('fy'), cx: mix('cx'), cy: mix('cy')};
};

// Deterministic decaying shake for the reveal impact.
const shake = (frame: number) => {
	const start = 45;
	const len = 12;
	if (frame < start || frame > start + len) return {x: 0, y: 0, r: 0};
	const k = frame - start;
	const amp = 16 * Math.pow(1 - k / len, 2);
	return {x: Math.sin(k * 2.9) * amp, y: Math.cos(k * 3.7) * amp, r: Math.sin(k * 2.1) * amp * 0.03};
};

const Portfolio: React.FC<{frame: number}> = ({frame}) => {
	const c = camAt(frame);
	const s = shake(frame);
	const left = c.cx - c.fx * c.zoom + s.x;
	const top = c.cy - c.fy * c.zoom + s.y;
	return (
		<div
			style={{
				position: 'absolute',
				left,
				top,
				width: IMG_W,
				height: IMG_H,
				transform: `scale(${c.zoom}) rotate(${s.r}deg)`,
				transformOrigin: '0 0',
			}}
		>
			<Img src={staticFile('meme-worst/portfolio.png')} style={{width: IMG_W, height: IMG_H, display: 'block'}} />
			{/* hide the promo pill (app chrome) — no financial figures are touched */}
			<div style={{position: 'absolute', left: BADGE.x, top: BADGE.y, width: BADGE.w, height: BADGE.h, background: '#000'}} />
		</div>
	);
};

const Caption: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div
		style={{
			fontFamily: FONT,
			fontWeight: 900,
			fontSize: 72,
			lineHeight: 1.08,
			letterSpacing: -1,
			color: '#fff',
			textAlign: 'center',
			textShadow: '0 4px 0 #000, 0 0 18px rgba(0,0,0,0.9)',
			...style,
		}}
	>
		{children}
	</div>
);

const Wordmark: React.FC = () => (
	<div style={{position: 'absolute', left: 72, top: 1530, display: 'flex', alignItems: 'center', gap: 10, opacity: 0.9}}>
		<svg width={30} height={30} viewBox="0 0 30 30">
			<rect x={1} y={18} width={7} height={11} rx={2} fill={GREEN} />
			<rect x={11} y={11} width={7} height={18} rx={2} fill={GREEN} />
			<rect x={21} y={2} width={7} height={27} rx={2} fill="#fff" />
		</svg>
		<div style={{fontFamily: FONT, fontSize: 26, fontWeight: 800, letterSpacing: 3, color: '#fff', textShadow: '0 2px 6px #000'}}>
			STACK WITH GIO
		</div>
	</div>
);

export const MemeWorstDay: React.FC = () => {
	const frame = useCurrentFrame();

	// Michael: quick rise at 3.0 s, then a slow creeping push-in to sell the discomfort.
	const rise = interpolate(frame, [90, 96], [140, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
	const creep = interpolate(frame, [210, 300], [1, 1.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
	const showMichael = frame >= 90;

	// Dim the chart a touch once Michael is on, so he pops.
	const dim = interpolate(frame, [90, 100], [0, 0.35], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	// Spotlight on the loss during the hook.
	const vignette = interpolate(frame, [3, 30, 45, 53], [0, 0.55, 0.55, 0.3], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	const titleOut = interpolate(frame, [208, 212], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const punch = interpolate(frame, [210, 216], [0.82, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.out(Easing.back(2.2)),
	});

	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<Portfolio frame={frame} />

			<AbsoluteFill
				style={{background: `radial-gradient(ellipse 70% 45% at 50% 47%, rgba(0,0,0,0) 40%, rgba(0,0,0,${vignette}) 100%)`}}
			/>
			<AbsoluteFill
				style={{background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 36%, rgba(0,0,0,${dim}) 50%, rgba(0,0,0,${dim * 1.6}) 100%)`}}
			/>
			{/* keep top captions readable over the zoomed screenshot */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 22%)'}} />

			{showMichael && (
				<div
					style={{
						position: 'absolute',
						left: 0,
						bottom: 0,
						width: 1080,
						height: 1273,
						transform: `translateY(${rise}px) scale(${creep})`,
						transformOrigin: '50% 100%',
					}}
				>
					<Sequence from={90} layout="none">
						<OffthreadVideo
							src={staticFile('meme-worst/michael.webm')}
							transparent
							muted
							style={{width: 1080, height: 1273, display: 'block'}}
						/>
					</Sequence>
				</div>
			)}

			<Wordmark />

			{/* HOOK title (0–7 s) */}
			<div style={{position: 'absolute', top: 180, left: 72, right: 72, opacity: titleOut}}>
				<Caption>
					POV: YOU CHECK
					<br />
					YOUR PORTFOLIO 💀
				</Caption>
			</div>

			{/* PUNCHLINE (7–10 s) */}
			{frame >= 210 && (
				<div style={{position: 'absolute', top: 196, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
					<div
						style={{
							transform: `scale(${punch})`,
							background: GREEN,
							color: INK,
							fontFamily: FONT,
							fontWeight: 900,
							fontSize: 54,
							letterSpacing: -1,
							padding: '16px 34px 18px',
							borderRadius: 22,
							boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
						}}
					>
						LONG-TERM INVESTOR BTW 😭
					</div>
				</div>
			)}

			{/* Audio: impact on the reveal, original meme dialogue on the reaction */}
			<Sequence from={45} durationInFrames={30}>
				<Audio src={staticFile('sfx/thud.wav')} volume={0.8} />
			</Sequence>
			<Sequence from={90}>
				<Audio src={staticFile('meme-worst/michael.wav')} />
			</Sequence>
		</AbsoluteFill>
	);
};
