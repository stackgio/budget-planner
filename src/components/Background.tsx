import React from 'react';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {colors} from '../brand/theme';

type Props = {
	/** 'matte' = brand black, 'photo' = image/footage behind a darkening grade. */
	variant?: 'matte' | 'photo';
	/** Image for variant="photo" (staticFile path or URL). For footage, pass children instead. */
	src?: string;
	/** Soft light source position and color. Set glow={null} to disable. */
	glow?: {x: number; y: number; color?: string; size?: number; opacity?: number} | null;
	/** Film grain strength 0–1. Subtle grain keeps flat blacks from banding. */
	grain?: number;
	/** 0–1 darkening applied over photo/footage so type stays readable. */
	shade?: number;
	children?: React.ReactNode;
};

export const Background: React.FC<Props> = ({
	variant = 'matte',
	src,
	glow = {x: 50, y: 30},
	grain = 0.5,
	shade = 0.55,
	children,
}) => {
	return (
		<AbsoluteFill style={{backgroundColor: colors.black}}>
			{variant === 'photo' && src ? (
				<Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
			) : null}
			{children}
			{variant === 'photo' ? <AbsoluteFill style={{backgroundColor: `rgba(0,0,0,${shade})`}} /> : null}
			{glow ? (
				<AbsoluteFill
					style={{
						background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, ${glow.color ?? colors.green} 0%, transparent ${
							glow.size ?? 55
						}%)`,
						opacity: glow.opacity ?? 0.16,
					}}
				/>
			) : null}
			{/* Vignette */}
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.6) 100%)'}} />
			{grain > 0 ? <Grain strength={grain} /> : null}
		</AbsoluteFill>
	);
};

// Animated grain: the noise seed changes every 2 frames, like real film.
const Grain: React.FC<{strength: number}> = ({strength}) => {
	const frame = useCurrentFrame();
	const seed = Math.floor(frame / 2) % 50;
	return (
		<AbsoluteFill style={{opacity: 0.07 * strength, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
			<svg width="100%" height="100%">
				<filter id={`grain-${seed}`}>
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
			</svg>
		</AbsoluteFill>
	);
};
