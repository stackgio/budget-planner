import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {colors, fonts} from '../../brand/theme';
import {clamp, ease, springAt, springs} from '../../lib/motion';

type PhoneProps = {
	/** Device width in px; height follows a modern 19.5:9 phone. */
	width?: number;
	children?: React.ReactNode;
	style?: React.CSSProperties;
};

/** Generic modern smartphone (no brand marks). Screen content goes in children. */
export const Phone: React.FC<PhoneProps> = ({width = 620, children, style}) => {
	const height = width * 2.08;
	const bezel = width * 0.032;
	const radius = width * 0.15;
	return (
		<div
			style={{
				position: 'relative',
				width,
				height,
				borderRadius: radius,
				background: 'linear-gradient(145deg, #3A3A40 0%, #18181B 35%, #0E0E10 70%, #2A2A2F 100%)',
				padding: bezel,
				boxShadow: '0 60px 120px rgba(0,0,0,0.65), 0 0 0 2px #45454C inset',
				...style,
			}}
		>
			<div style={{position: 'relative', width: '100%', height: '100%', borderRadius: radius - bezel, overflow: 'hidden', background: colors.black}}>
				{children}
				{/* Dynamic island */}
				<div
					style={{
						position: 'absolute',
						top: width * 0.03,
						left: '50%',
						translate: '-50% 0px',
						width: width * 0.3,
						height: width * 0.085,
						borderRadius: 999,
						background: '#000',
					}}
				/>
				{/* Glass reflection */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: 'linear-gradient(115deg, rgba(255,255,255,0.08) 0%, transparent 32%, transparent 70%, rgba(255,255,255,0.03) 100%)',
						pointerEvents: 'none',
					}}
				/>
			</div>
		</div>
	);
};

type LockScreenProps = {
	time?: string;
	date?: string;
	/** Scales type to the phone width it sits in. */
	phoneWidth?: number;
	children?: React.ReactNode;
};

export const LockScreen: React.FC<LockScreenProps> = ({time = '9:41', date = 'Monday, October 26', phoneWidth = 620, children}) => {
	const u = phoneWidth / 620;
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				background: `radial-gradient(circle at 30% 85%, ${colors.greenDeep} 0%, transparent 55%), radial-gradient(circle at 85% 20%, #1D3B2C 0%, transparent 50%), ${colors.matte}`,
				fontFamily: fonts.body,
				color: colors.white,
			}}
		>
			<div style={{textAlign: 'center', marginTop: 150 * u, fontSize: 30 * u, fontWeight: 600, opacity: 0.85}}>{date}</div>
			<div style={{textAlign: 'center', fontSize: 170 * u, fontWeight: 700, fontFamily: fonts.display, lineHeight: 1, letterSpacing: '-0.03em'}}>
				{time}
			</div>
			<div style={{position: 'absolute', left: 22 * u, right: 22 * u, top: 470 * u}}>{children}</div>
		</div>
	);
};

type NotificationProps = {
	enterFrame: number;
	app?: string;
	title: string;
	body: React.ReactNode;
	time?: string;
	/** Width of the phone it sits in, for scaling. */
	phoneWidth?: number;
	icon?: React.ReactNode;
	/** Frame to flash the card in brand green (e.g. when the amount is spoken). */
	highlightFrame?: number;
};

/** iOS-style notification banner that drops in with a spring. */
export const Notification: React.FC<NotificationProps> = ({
	enterFrame,
	app = 'BROKERAGE',
	title,
	body,
	time = 'now',
	phoneWidth = 620,
	icon,
	highlightFrame,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const u = phoneWidth / 620;
	const enter = springAt(frame, fps, enterFrame, springs.pop);
	const hl = highlightFrame === undefined ? 0 : interpolate(frame, [highlightFrame, highlightFrame + 6, highlightFrame + 30], [0, 1, 0.35], clamp);
	if (frame < enterFrame) return null;
	return (
		<div
			style={{
				translate: `0px ${interpolate(enter, [0, 1], [-260 * u, 0])}px`,
				scale: interpolate(enter, [0, 1], [0.9, 1]),
				opacity: interpolate(frame, [enterFrame, enterFrame + 5], [0, 1], {...clamp, easing: ease.out}),
				display: 'flex',
				gap: 18 * u,
				alignItems: 'center',
				padding: `${22 * u}px ${24 * u}px`,
				borderRadius: 34 * u,
				background: 'rgba(40,40,44,0.78)',
				border: `${2 * u}px solid rgba(46,224,122,${0.15 + hl * 0.6})`,
				boxShadow: `0 20px 50px rgba(0,0,0,0.45), 0 0 ${hl * 60 * u}px rgba(46,224,122,${hl * 0.45})`,
				backdropFilter: 'blur(20px)',
				fontFamily: fonts.body,
				color: colors.white,
			}}
		>
			<div
				style={{
					width: 76 * u,
					height: 76 * u,
					flexShrink: 0,
					borderRadius: 18 * u,
					background: `linear-gradient(145deg, ${colors.green}, ${colors.greenDeep})`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				{icon ?? <TrendIcon size={46 * u} />}
			</div>
			<div style={{flex: 1, minWidth: 0}}>
				<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 22 * u, color: colors.muted, fontWeight: 600, letterSpacing: '0.04em'}}>
					<span>{app}</span>
					<span style={{letterSpacing: 0}}>{time}</span>
				</div>
				<div style={{fontSize: 30 * u, fontWeight: 700, marginTop: 4 * u}}>{title}</div>
				<div style={{fontSize: 27 * u, fontWeight: 500, color: '#D9D9D4', marginTop: 2 * u}}>{body}</div>
			</div>
		</div>
	);
};

export const TrendIcon: React.FC<{size: number; color?: string}> = ({size, color = colors.black}) => (
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
		<path d="M3 17 L9 11 L13 15 L21 7" />
		<path d="M15 7 L21 7 L21 13" />
	</svg>
);
