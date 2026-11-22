import React from 'react';
import {AbsoluteFill} from 'remotion';
import {cinematic, type Palette} from '../../story/theme';

/** Matte black + bright emerald + white (this video's requested look, built on `cinematic`). */
export const P: Palette = {
	...cinematic,
	bg: '#0A0A0B',
	bg2: '#111214',
	paper: '#121315',
	ink: '#FFFFFF',
	body: '#D6D9DD',
	muted: '#8B9197',
	line: '#26292D',
	accent: '#1EE38F',
	accentDeep: '#0FA866',
	accentSoft: 'rgba(30,227,143,0.14)',
};

/** Flat matte black with a barely-there lift behind the subject (no glow, no particles). */
export const MatteBg: React.FC<{x?: number; y?: number; lift?: number}> = ({x = 540, y = 820, lift = 0.05}) => (
	<AbsoluteFill style={{background: `radial-gradient(1100px 1100px at ${x}px ${y}px, rgba(255,255,255,${lift}), rgba(255,255,255,0) 70%), ${P.bg}`}} />
);
