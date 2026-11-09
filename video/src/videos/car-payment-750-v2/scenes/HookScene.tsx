import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, FONT, StudioBg} from '../look';

/** One "+ LABEL ?" chip that appears beside the payment to tease the real total. */
const Extra: React.FC<{label: string; at: number; pulseAt: number}> = ({label, at, pulseAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = sp(frame, fps, at, 'snappy');
	const pulse = frame > pulseAt ? 0.75 + 0.25 * Math.sin((frame - pulseAt) * 0.25) : 1;
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 14,
				padding: '16px 28px',
				borderRadius: 999,
				border: '3px solid rgba(255,255,255,0.85)',
				background: 'rgba(15,15,16,0.7)',
				fontFamily: FONT,
				fontWeight: 900,
				fontSize: 50,
				letterSpacing: 2,
				color: C.white,
				opacity: frame < at ? 0 : prog(frame, at, 5),
				transform: `translateY(${(1 - s) * 30}px) scale(${0.9 + 0.1 * s})`,
			}}
		>
			+ {label} <span style={{color: C.green, opacity: pulse}}>?</span>
		</div>
	);
};

/**
 * 0:00–0:10 — "$750/MONTH" and "JUST THE PAYMENT" are fully readable on frame one.
 * Insurance and gas chips stack up as Gio keeps talking, then "JUST" lights up on the word.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tIns = cue('L1', 'car');
	const tGas = cue('L2', 'like');
	const tTotal = cue('L2', 'crazy');
	const tWorst = cue('L3', 'worst');
	const tJust = cue('L4', 'just');

	const settle = sp(frame, fps, -6, 'smooth'); // barely-there settle: readable at frame 0
	const total = sp(frame, fps, tTotal, 'bouncy');
	const just = kf(frame, [tJust - 2, tJust + 10], [0, 1], E.out);
	const dim = kf(frame, [tWorst - 4, tWorst + 14], [1, 0.6]);

	return (
		<AbsoluteFill style={{background: C.black}}>
			<Camera
				keys={[
					{at: 0, zoom: 1.05, x: 580, y: 1000},
					{at: tTotal, zoom: 1.0, x: 540, y: 980, ease: E.soft},
					{at: tJust + 20, zoom: 1.07, x: 600, y: 1000, ease: E.inOut},
				]}
			>
				<StudioBg floorY={1190} />
				<div style={{position: 'absolute', inset: 0, filter: `brightness(${dim})`}}>
					<Car id="v2hook" variant="luxury" paint={PAINTS.gunmetal} x={380} y={1190} w={1300} lights={1} beam={0.85} sheen={kf(frame, [0, 75], [-0.25, 1.25], E.soft)} sheenAmt={0.6} reflection={0.22} />
				</div>
			</Camera>
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 940, background: 'linear-gradient(180deg, rgba(15,15,16,0.92) 0%, rgba(15,15,16,0.6) 70%, rgba(15,15,16,0) 100%)'}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 240, textAlign: 'center', fontFamily: FONT, transform: `scale(${1.03 - 0.03 * settle})`}}>
				<div style={{fontWeight: 900, fontSize: 200, lineHeight: 1, letterSpacing: -8, color: C.white}}>
					${FACTS.payment.value}
					<span style={{fontSize: 76, letterSpacing: 0, color: C.white}}>/MONTH</span>
				</div>
				<div style={{marginTop: 26, fontWeight: 900, fontSize: 92, letterSpacing: -2, color: C.white}}>
					<span style={{position: 'relative', display: 'inline-block', color: C.green}}>
						JUST
						<span style={{position: 'absolute', left: 0, bottom: -2, height: 10, width: `${just * 100}%`, borderRadius: 5, background: C.green}} />
					</span>{' '}
					THE PAYMENT
				</div>
			</div>
			{/* the rest of the bill, still unknown */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 600, display: 'flex', justifyContent: 'center', gap: 22}}>
				<Extra label="INSURANCE" at={tIns} pulseAt={tTotal} />
				<Extra label="GAS" at={tGas} pulseAt={tTotal} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 712,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 900,
					fontSize: 64,
					color: C.green,
					opacity: frame < tTotal ? 0 : prog(frame, tTotal, 5),
					transform: `scale(${0.8 + 0.2 * total})`,
				}}
			>
				= TOTAL ?
			</div>
		</AbsoluteFill>
	);
};
