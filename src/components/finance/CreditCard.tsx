import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../../brand/theme';
import {clamp, ease, springAt, springs} from '../../lib/motion';

type CardProps = {
	name?: string;
	/** Last four digits to show; omit to show only dots. */
	last4?: string;
	kind?: string;
	variant?: 'matte' | 'green' | 'white';
	width?: number;
	/** 3D tilt in degrees (rotateY / rotateX). */
	tiltY?: number;
	tiltX?: number;
	style?: React.CSSProperties;
};

const variants = {
	matte: {bg: 'linear-gradient(135deg, #2A2A2F 0%, #111113 45%, #0A0A0B 100%)', fg: colors.white, accent: colors.green},
	green: {bg: `linear-gradient(135deg, ${colors.green} 0%, ${colors.greenDeep} 100%)`, fg: colors.black, accent: colors.black},
	white: {bg: 'linear-gradient(135deg, #FFFFFF 0%, #E4E4DF 100%)', fg: colors.black, accent: colors.greenDeep},
};

/** Generic payment card (no network logos). Tilt drives a moving light sweep. */
export const CreditCard: React.FC<CardProps> = ({name = 'STACK WITH GIO', last4, kind = 'DEBIT', variant = 'matte', width = 640, tiltY = 0, tiltX = 0, style}) => {
	const v = variants[variant];
	const h = width / 1.586;
	const u = width / 640;
	return (
		<div style={{perspective: 1600, ...style}}>
			<div
				style={{
					position: 'relative',
					width,
					height: h,
					borderRadius: 34 * u,
					background: v.bg,
					color: v.fg,
					fontFamily: fonts.body,
					overflow: 'hidden',
					rotate: `y ${tiltY}deg`,
					transform: `rotateX(${tiltX}deg)`,
					boxShadow: '0 40px 80px rgba(0,0,0,0.55), inset 0 0 0 2px rgba(255,255,255,0.08)',
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: `linear-gradient(${110 + tiltY * 2}deg, transparent 30%, rgba(255,255,255,0.16) 48%, transparent 62%)`,
						translate: `${tiltY * 6}px 0px`,
					}}
				/>
				<div style={{position: 'absolute', left: 48 * u, top: 44 * u, fontWeight: 900, fontSize: 30 * u, letterSpacing: '0.12em'}}>
					<span style={{color: v.accent}}>■</span> {kind}
				</div>
				<ContactlessIcon size={44 * u} color={v.fg} style={{position: 'absolute', right: 48 * u, top: 40 * u}} />
				<Chip width={88 * u} style={{position: 'absolute', left: 48 * u, top: 130 * u}} />
				<div style={{position: 'absolute', left: 48 * u, bottom: 92 * u, fontSize: 40 * u, fontWeight: 600, letterSpacing: '0.16em', fontVariantNumeric: 'tabular-nums'}}>
					•••• •••• •••• {last4 ?? '••••'}
				</div>
				<div style={{position: 'absolute', left: 48 * u, bottom: 40 * u, fontSize: 26 * u, fontWeight: 700, letterSpacing: '0.12em', opacity: 0.85}}>{name}</div>
			</div>
		</div>
	);
};

const Chip: React.FC<{width: number; style?: React.CSSProperties}> = ({width, style}) => (
	<svg width={width} height={width * 0.75} viewBox="0 0 88 66" style={style}>
		<rect x={1} y={1} width={86} height={64} rx={12} fill="#D9B565" stroke="#A88A44" strokeWidth={2} />
		<path d="M 1 22 H 30 M 1 44 H 30 M 58 22 H 87 M 58 44 H 87 M 30 1 V 65 M 58 1 V 65" stroke="#A88A44" strokeWidth={2} fill="none" />
	</svg>
);

export const ContactlessIcon: React.FC<{size: number; color: string; style?: React.CSSProperties}> = ({size, color, style}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" style={style}>
		<path d="M8 8.5a5 5 0 0 1 0 7" />
		<path d="M11.5 6a8.5 8.5 0 0 1 0 12" />
		<path d="M15 3.5a12 12 0 0 1 0 17" />
	</svg>
);

type TapProps = {
	startFrame: number;
	/** Frame the card touches the terminal. */
	tapFrame: number;
	amount: number;
	/** 'approved' (green) or 'declined' (red) — the declined one is great for memes. */
	result?: 'approved' | 'declined';
	cardVariant?: CardProps['variant'];
};

/**
 * Tap-to-pay beat: card swoops in, taps the terminal, contactless ripples,
 * terminal answers. Place inside a 1080x1920 frame.
 */
export const TapToPay: React.FC<TapProps> = ({startFrame, tapFrame, amount, result = 'approved', cardVariant = 'matte'}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const termIn = springAt(frame, fps, startFrame, springs.soft, 16);
	const cardIn = springAt(frame, fps, startFrame + 6, springs.heavy);
	const toTap = interpolate(frame, [tapFrame - 12, tapFrame], [0, 1], {...clamp, easing: ease.inOut});
	const back = interpolate(frame, [tapFrame + 14, tapFrame + 30], [0, 1], {...clamp, easing: ease.inOut});
	const ok = result === 'approved';
	const resultIn = springAt(frame, fps, tapFrame + 8, springs.pop);
	const accent = ok ? colors.green : colors.red;
	const shakeX = !ok && frame > tapFrame + 8 ? Math.sin((frame - tapFrame) * 1.9) * 10 * Math.max(0, 1 - (frame - tapFrame - 8) / 14) : 0;

	// Card path: offscreen right → hover → tap → back off a bit
	const cx = interpolate(cardIn, [0, 1], [900, 260]) - toTap * 90 + back * 60;
	const cy = interpolate(cardIn, [0, 1], [-200, 60]) + toTap * 360 - back * 310;
	const tilt = interpolate(cardIn, [0, 1], [-50, -18]) + toTap * 12;

	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}>
			{/* Terminal */}
			<div
				style={{
					position: 'absolute',
					left: 290,
					top: 760,
					width: 500,
					height: 760,
					borderRadius: 60,
					background: 'linear-gradient(160deg, #2A2A2F, #121214)',
					boxShadow: '0 50px 100px rgba(0,0,0,0.6), inset 0 0 0 3px #3A3A41',
					opacity: termIn,
					translate: `${shakeX}px ${(1 - termIn) * 120}px`,
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: 40,
						right: 40,
						top: 40,
						height: 380,
						borderRadius: 30,
						background: colors.black,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						fontFamily: fonts.display,
						color: colors.white,
						gap: 10,
					}}
				>
					{frame < tapFrame + 8 ? (
						<>
							<ContactlessIcon size={110} color={colors.white} style={{opacity: 0.7 + 0.3 * Math.sin(frame / 5)}} />
							<div style={{fontSize: 44, fontWeight: 800}}>${amount.toFixed(2)}</div>
							<div style={{fontSize: 28, fontWeight: 600, color: colors.muted}}>Tap to pay</div>
						</>
					) : (
						<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, scale: interpolate(resultIn, [0, 1], [0.6, 1]), opacity: Math.min(1, resultIn)}}>
							<div style={{width: 130, height: 130, borderRadius: 999, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
								<svg width={70} height={70} viewBox="0 0 24 24" fill="none" stroke={colors.black} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
									{ok ? <path d="M5 12.5 L10 17.5 L19 7" /> : <path d="M6 6 L18 18 M18 6 L6 18" />}
								</svg>
							</div>
							<div style={{fontSize: 52, fontWeight: 900, color: accent}}>{ok ? 'Approved' : 'Declined'}</div>
							<div style={{fontSize: 34, fontWeight: 700}}>${amount.toFixed(2)}</div>
						</div>
					)}
				</div>
				{/* Keypad hint */}
				<div style={{position: 'absolute', left: 70, right: 70, bottom: 60, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18}}>
					{Array.from({length: 9}).map((_, i) => (
						<div key={i} style={{height: 54, borderRadius: 14, background: '#1D1D21'}} />
					))}
				</div>
			</div>
			{/* Contactless ripples at the tap */}
			{[0, 1, 2].map((i) => {
				const t = frame - tapFrame - i * 4;
				if (t < 0 || t > 24) return null;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 540,
							top: 960,
							width: 200,
							height: 200,
							translate: '-50% -50%',
							borderRadius: 999,
							border: `6px solid ${accent}`,
							scale: interpolate(t, [0, 24], [0.4, 2.4]),
							opacity: interpolate(t, [0, 24], [0.9, 0]),
						}}
					/>
				);
			})}
			<CreditCard variant={cardVariant} width={560} tiltY={tilt} style={{position: 'absolute', left: cx, top: cy + 300, rotate: `${-12 + toTap * 10 - back * 6}deg`, scale: 1 - back * 0.15}} />
		</div>
	);
};
