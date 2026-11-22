import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {kf, sp} from '../lib/motion';
import {story} from '../theme';

/**
 * Generic lock-screen notification banner (no bank or app branding — a
 * stylised UI, never presented as a real screenshot). Drops in from above.
 */
export const PhoneNotification: React.FC<{
	at: number;
	x: number;
	y: number;
	w: number;
	title: string;
	body: string;
	time?: string;
	accent: string;
	/** frame of a soft "just arrived" glow pulse */
	pulseAt?: number;
}> = ({at, x, y, w, title, body, time = 'now', accent, pulseAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, 'bouncy');
	const pulse = pulseAt === undefined ? 0 : kf(frame, [pulseAt, pulseAt + 6, pulseAt + 30], [0, 1, 0]);
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				fontFamily: story.font,
				transform: `translateY(${(1 - p) * -160}px) scale(${0.94 + 0.06 * p})`,
				opacity: Math.min(1, p * 1.5),
				display: 'flex',
				alignItems: 'center',
				gap: 26,
				padding: '28px 30px',
				borderRadius: 40,
				background: 'linear-gradient(180deg, rgba(48,50,55,0.96), rgba(32,34,38,0.96))',
				border: '1.5px solid rgba(255,255,255,0.08)',
				boxShadow: `0 20px 50px rgba(0,0,0,0.6), 0 0 ${40 + 50 * pulse}px rgba(30,227,143,${0.12 + 0.3 * pulse})`,
			}}
		>
			<div
				style={{
					width: 96,
					height: 96,
					flex: '0 0 96px',
					borderRadius: 24,
					background: accent,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: '#05140D',
					fontSize: 60,
					fontWeight: 900,
				}}
			>
				$
			</div>
			<div style={{flex: 1, minWidth: 0}}>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
					<div style={{fontSize: 46, fontWeight: 900, letterSpacing: 3, color: '#FFFFFF'}}>{title}</div>
					<div style={{fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.5)'}}>{time}</div>
				</div>
				<div style={{fontSize: 30, fontWeight: 600, color: 'rgba(255,255,255,0.78)', marginTop: 6}}>{body}</div>
			</div>
		</div>
	);
};
