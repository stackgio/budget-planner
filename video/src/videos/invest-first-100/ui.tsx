import React from 'react';
import {Img, staticFile} from 'remotion';
import {E, kf} from '../../story/lib/motion';
import {story, type Palette} from '../../story/theme';
import {Banknote} from '../../story/components/Banknote';

export const asset = (f: string) => `motion/invest-first-100/assets/${f}`;

/** Card swap envelope: in at `tIn`, out at `tOut` (frames). Returns opacity + y offset. */
export const swapIn = (frame: number, tIn: number, tOut = Infinity, dist = 70) => {
	const i = kf(frame, [tIn, tIn + 12], [0, 1], E.out);
	const o = tOut === Infinity ? 0 : kf(frame, [tOut, tOut + 9], [0, 1], E.in);
	return {opacity: i * (1 - o), y: (1 - i) * dist - o * dist * 0.6, on: i > 0 && o < 1};
};

/** Official logo tile (logo file + weight in the fund). */
export const LogoTile: React.FC<{src: string; logoH: number; weight: string; caption: string; palette: Palette; p: number; style?: React.CSSProperties}> = ({src, logoH, weight, caption, palette, p, style}) => (
	<div
		style={{
			position: 'absolute',
			background: '#fff',
			borderRadius: 26,
			border: `2px solid ${palette.line}`,
			boxShadow: `0 18px 40px ${palette.shadow}`,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 12,
			fontFamily: story.font,
			transform: `scale(${0.6 + 0.4 * p})`,
			opacity: Math.min(1, p * 1.5),
			...style,
		}}
	>
		<Img src={staticFile(asset(src))} style={{height: logoH, width: 'auto', maxWidth: '80%', objectFit: 'contain'}} />
		<div style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
			<span style={{fontSize: 40, fontWeight: 900, color: palette.ink, letterSpacing: -1}}>{weight}</span>
			<span style={{fontSize: 24, fontWeight: 800, color: palette.muted}}>{caption}</span>
		</div>
	</div>
);

/** Clean white paper background with a hairline grid (data/evidence scenes). */
export const WhiteBg: React.FC<{palette: Palette}> = ({palette}) => (
	<div style={{position: 'absolute', inset: 0, background: palette.bg}}>
		<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity: 0.55}}>
			<defs>
				<pattern id="wgrid" width={60} height={60} patternUnits="userSpaceOnUse">
					<path d="M 60 0 L 0 0 0 60" fill="none" stroke="#EEF0F2" strokeWidth={1.5} />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#wgrid)" />
		</svg>
		<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 60%)'}} />
	</div>
);

/**
 * The fund's strip of the hook's $100 note, carried into its chapter: it holds
 * centre stage until `tOut` (the spoken amount), then flies into the hero
 * number at top-left and dissolves.
 */
export const IntroStrip: React.FC<{frame: number; slice: [number, number]; noteW: number; x: number; y: number; scale: number; tOut: number; band: string}> = ({frame, slice, noteW, x, y, scale, tOut, band}) => {
	const go = kf(frame, [tOut - 4, tOut + 12], [0, 1], E.inOut);
	if (go >= 1) return null;
	const inP = kf(frame, [0, 10], [0.92, 1], E.out);
	const tx = x + (story.safe.left - x) * go;
	const ty = y + (330 - y) * go;
	const s = scale * inP * (1 - 0.75 * go);
	return (
		<div style={{position: 'absolute', left: tx, top: ty, transformOrigin: '0 0', transform: `scale(${s})`, opacity: 1 - go}}>
			<div style={{position: 'absolute', left: 0, top: -14, width: noteW * (slice[1] - slice[0]), height: 8, borderRadius: 4, background: band}} />
			<Banknote w={noteW} slice={slice} style={{position: 'relative'}} />
		</div>
	);
};
