import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {dmm} from '../theme';

/**
 * Near-black stage: one soft emerald key light, a floor falloff, vignette and
 * fine animated film grain. Deliberately restrained — no particles, no neon.
 */
export const Stage: React.FC<{lightX?: number; lightY?: number; light?: number; children?: React.ReactNode}> = ({
	lightX = 300,
	lightY = 260,
	light = 1,
	children,
}) => (
	<AbsoluteFill style={{background: dmm.color.bg}}>
		<AbsoluteFill
			style={{
				background: `radial-gradient(1100px 900px at ${lightX}px ${lightY}px, rgba(54,217,121,${0.085 * light}) 0%, rgba(54,217,121,${0.03 * light}) 38%, rgba(0,0,0,0) 70%)`,
			}}
		/>
		<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.35) 100%)'}} />
		{children}
	</AbsoluteFill>
);

/** Top-layer film finish: vignette + grain. Put it last. */
export const FilmFinish: React.FC<{grain?: number; vignette?: number}> = ({grain = 0.06, vignette = 0.55}) => {
	const frame = useCurrentFrame();
	// grain pattern changes every 2 frames (film cadence), deterministic per frame
	const seed = Math.floor(frame / 2);
	const ox = Math.floor(random(`gx${seed}`) * 200);
	const oy = Math.floor(random(`gy${seed}`) * 200);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: `radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)`}} />
			<svg width={dmm.width} height={dmm.height} style={{position: 'absolute', inset: 0, opacity: grain, mixBlendMode: 'screen'}}>
				<filter id={`grain${seed}`} x="0" y="0" width="100%" height="100%">
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed % 97} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect x={-ox} y={-oy} width={dmm.width + 200} height={dmm.height + 200} filter={`url(#grain${seed})`} />
			</svg>
		</AbsoluteFill>
	);
};
