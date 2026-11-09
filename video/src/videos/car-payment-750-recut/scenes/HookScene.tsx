import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {StudioBg} from '../../car-payment-750/look';
import {FACTS} from '../facts';
import {FONT, K} from '../look';

const usd = (v: number) => `$${v.toLocaleString('en-US')}`;

/** Frame one: dark car, $750 already readable; → $1,150/mo lands well before 2 s. */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	// both numbers readable by 0:02 regardless of pace; earlier if the VO says it sooner
	const tTo = Math.min(cue('L1', 'one', -0.15), Math.round(0.75 * fps));
	const tMonth = cue('L1', 'month');

	const land = sp(frame, fps, -4, 'heavy');
	const arrow = kf(frame, [tTo - 8, tTo + 4], [0, 1], E.out);
	const big = sp(frame, fps, tTo, 'heavy');
	const bigO = frame < tTo ? 0 : prog(frame, tTo, 4);
	const push = kf(frame, [tMonth - 4, tMonth + 30], [0, 1], E.inOut);

	return (
		<AbsoluteFill style={{background: K.black}}>
			<Camera keys={[{at: 0, zoom: 1.05, x: 560, y: 1000}, {at: tMonth - 4, zoom: 1.0, x: 540, y: 980, ease: E.soft}, {at: tMonth + 30, zoom: 1.07, x: 580, y: 980}]}>
				<StudioBg floorY={1180} />
				<Car id="rcHook" variant="luxury" paint={PAINTS.gunmetal} x={380} y={1180} w={1300} lights={1} beam={0.85} sheen={kf(frame, [0, 70], [-0.25, 1.25], E.soft)} sheenAmt={0.6} reflection={0.22} />
			</Camera>
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 900, background: 'linear-gradient(180deg, rgba(15,15,16,0.9) 0%, rgba(15,15,16,0.5) 70%, rgba(15,15,16,0) 100%)'}} />
			{/* $750 — readable on frame 0 */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 250,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 900,
					fontSize: 190,
					lineHeight: 1,
					letterSpacing: -7,
					color: K.white,
					transform: `scale(${1.18 - 0.18 * land})`,
				}}
			>
				{usd(FACTS.payment.value)}
			</div>
			{/* arrow */}
			<svg width={120} height={110} style={{position: 'absolute', left: 480, top: 455, opacity: arrow}}>
				<path d={`M60 6 L60 ${6 + 78 * arrow}`} stroke={K.green} strokeWidth={14} strokeLinecap="round" />
				<path d="M24 58 L60 96 L96 58" stroke={K.green} strokeWidth={14} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={arrow > 0.8 ? 1 : 0} />
			</svg>
			{/* $1,150/mo */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 580,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 900,
					fontSize: 210,
					lineHeight: 1,
					letterSpacing: -8,
					color: K.green,
					opacity: bigO,
					transform: `translateY(${(1 - big) * 50}px) scale(${(1.15 - 0.15 * big) * (1 + 0.04 * push)})`,
					textShadow: '0 0 50px rgba(57,255,136,0.25)',
				}}
			>
				{usd(FACTS.monthly.value)}
				<span style={{fontSize: '0.36em', letterSpacing: 2, color: K.white}}>/mo</span>
			</div>
		</AbsoluteFill>
	);
};
