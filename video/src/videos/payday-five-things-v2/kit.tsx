import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {E, kf, sp} from '../../story/lib/motion';
import {story} from '../../story/theme';

/** Overlay palette for this video: matte black, white, bright green. */
export const C = {
	black: '#0B0C0E',
	black2: '#17191D',
	white: '#FFFFFF',
	green: '#2CD47A',
	grey: '#9A9EA6',
};

export const L = story.safe.left; // 72
export const R = 1080 - story.safe.right; // 960
export const HEADER_TOP = story.safe.top; // 170

/** Small uppercase label chip (tracked annotation). */
export const Chip: React.FC<{text: React.ReactNode; tone?: 'black' | 'green' | 'white'; size?: number; style?: React.CSSProperties}> = ({text, tone = 'black', size = 30, style}) => (
	<div
		style={{
			position: 'absolute',
			display: 'inline-flex',
			alignItems: 'center',
			gap: size * 0.4,
			whiteSpace: 'nowrap',
			fontFamily: story.font,
			fontSize: size,
			fontWeight: 900,
			letterSpacing: size * 0.1,
			padding: `${size * 0.32}px ${size * 0.55}px`,
			borderRadius: size * 0.28,
			background: tone === 'black' ? C.black : tone === 'green' ? C.green : C.white,
			color: tone === 'black' ? C.white : C.black,
			boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
			...style,
		}}
	>
		{text}
	</div>
);

/** "EXAMPLE" tag attached to every illustrative amount. */
export const ExampleTag: React.FC<{size?: number; style?: React.CSSProperties}> = ({size = 26, style}) => (
	<div
		style={{
			display: 'inline-block',
			fontFamily: story.font,
			fontSize: size,
			fontWeight: 900,
			letterSpacing: size * 0.16,
			color: C.black,
			background: C.white,
			border: `${Math.max(2, size * 0.1)}px solid ${C.black}`,
			padding: `${size * 0.18}px ${size * 0.4}px`,
			borderRadius: size * 0.22,
			...style,
		}}
	>
		EXAMPLE
	</div>
);

/**
 * Step header: green numbered square + main text on a matte black bar.
 * `swap` replaces the text at `swapAt` (rise-out / rise-in).
 */
export const StepHeader: React.FC<{n: number; text: React.ReactNode; at: number; swap?: React.ReactNode; swapAt?: number}> = ({n, text, at, swap, swapAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pIn = sp(frame, fps, at, 'snappy');
	const sw = swapAt === undefined ? 0 : kf(frame, [swapAt, swapAt + 8], [0, 1], E.inOut);
	const swIn = swapAt === undefined ? 0 : sp(frame, fps, swapAt + 6, 'snappy');
	return (
		<div
			style={{
				position: 'absolute',
				left: L,
				top: HEADER_TOP,
				maxWidth: R - L,
				display: 'flex',
				alignItems: 'stretch',
				fontFamily: story.font,
				transform: `translateY(${(1 - pIn) * -24}px)`,
				opacity: Math.min(1, pIn * 2),
				boxShadow: '0 10px 24px rgba(0,0,0,0.22)',
				borderRadius: 18,
				overflow: 'hidden',
			}}
		>
			<div style={{width: 104, flex: 'none', background: C.green, color: C.black, fontSize: 64, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: -2}}>{n}</div>
			<div style={{background: C.black, color: C.white, padding: '22px 30px', fontSize: 52, fontWeight: 900, letterSpacing: -0.5, lineHeight: 1.08, display: 'grid', alignItems: 'center', overflow: 'hidden'}}>
				{swap === undefined || swapAt === undefined || frame < swapAt + 7 ? (
					<div style={{gridArea: '1 / 1', transform: `translateY(${-sw * 140}%)`, opacity: 1 - sw}}>{text}</div>
				) : (
					<div style={{gridArea: '1 / 1', transform: `translateY(${(1 - swIn) * 140}%)`}}>{swap}</div>
				)}
			</div>
		</div>
	);
};

export const G: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{color: C.green}}>{children}</span>;
