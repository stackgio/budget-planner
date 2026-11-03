import React from 'react';
import {AbsoluteFill} from 'remotion';
import {cinematic, editorial} from '../theme';

const Grain: React.FC<{opacity: number; seed?: number}> = ({opacity, seed = 3}) => (
	<svg width="100%" height="100%" style={{position: 'absolute', inset: 0, opacity, mixBlendMode: 'multiply'}}>
		<filter id={`grain${seed}`}>
			<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
			<feColorMatrix type="saturate" values="0" />
		</filter>
		<rect width="100%" height="100%" filter={`url(#grain${seed})`} />
	</svg>
);

/** Warm paper: cream base, soft light from top, faint grain. */
export const EditorialBg: React.FC<{floorY?: number; tint?: string}> = ({floorY, tint}) => (
	<AbsoluteFill style={{background: tint ?? editorial.bg}}>
		<AbsoluteFill style={{background: 'radial-gradient(120% 70% at 50% 0%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 60%)'}} />
		<AbsoluteFill style={{background: 'radial-gradient(140% 90% at 50% 110%, rgba(120,95,50,0.10) 0%, rgba(0,0,0,0) 55%)'}} />
		{floorY !== undefined && <div style={{position: 'absolute', left: 0, right: 0, top: floorY, height: 3, background: editorial.line}} />}
		<Grain opacity={0.06} />
	</AbsoluteFill>
);

/** Matte black stage with a controllable key light (lamp / spotlight) and vignette. */
export const CinematicBg: React.FC<{lightX?: number; lightY?: number; light?: number; warm?: boolean; floorY?: number}> = ({
	lightX = 540,
	lightY = 900,
	light = 1,
	warm = true,
	floorY,
}) => (
	<AbsoluteFill style={{background: cinematic.bg}}>
		<AbsoluteFill
			style={{
				background: `radial-gradient(900px 900px at ${lightX}px ${lightY}px, ${warm ? `rgba(255,236,200,${0.13 * light})` : `rgba(44,212,122,${0.1 * light})`} 0%, rgba(0,0,0,0) 70%)`,
			}}
		/>
		{floorY !== undefined && (
			<div style={{position: 'absolute', left: 0, right: 0, top: floorY, bottom: 0, background: 'linear-gradient(180deg, #16181C 0%, #0B0C0E 100%)', borderTop: '2px solid #23262C'}} />
		)}
		<AbsoluteFill style={{background: 'radial-gradient(120% 80% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)'}} />
		<Grain opacity={0.1} seed={7} />
	</AbsoluteFill>
);
