import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {C, FONT, GridBg, Label} from '../look';
import {HERO750, Price750} from './HookScene';

/** Second hook: the $750 shrinks into one line item of a bigger, still-unknown bill. */
export const PaymentScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tWorst = cue('L3', 'worst');
	const tJust = cue('L4', 'just');
	const tPay = cue('L4', 'payment');

	const move = sp(frame, fps, cue('L3') + 2, 'smooth');
	const s = HERO750.endScale + (0.4 - HERO750.endScale) * move;
	const dx = 260 * move;
	const dy = -80 * move;
	const row = prog(frame, cue('L3') + 8, 14);
	const slam = sp(frame, fps, tJust - 2, 'heavy');
	const slamO = prog(frame, tJust - 2, 4);
	const underline = kf(frame, [tJust + 2, tJust + 14], [0, 1], E.out);

	return (
		<AbsoluteFill>
			<GridBg drift={frame * 0.4} />
			<div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', ...{opacity: prog(frame, tWorst - 4, 8)}}}>
				<Label size={34} color={C.gray}>And the worst part?</Label>
			</div>
			{/* line-item card the price drops into */}
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: 432,
					height: 180,
					borderRadius: 26,
					background: 'rgba(255,255,255,0.045)',
					border: '2px solid rgba(255,255,255,0.10)',
					opacity: row,
					transform: `scale(${0.96 + 0.04 * row})`,
				}}
			>
				<div style={{position: 'absolute', left: 44, top: 62, fontFamily: FONT, fontWeight: 800, fontSize: 42, letterSpacing: 5, color: C.white}}>CAR PAYMENT</div>
			</div>
			<div style={{position: 'absolute', inset: 0, transform: `translate(${dx}px, ${dy}px)`}}>
				<div style={{position: 'absolute', inset: 0, transform: `scale(${s / HERO750.endScale})`, transformOrigin: `540px ${HERO750.cy}px`}}>
					<Price750 scale={HERO750.endScale} />
				</div>
			</div>
			{/* JUST THE PAYMENT. */}
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					top: 700,
					fontFamily: FONT,
					fontWeight: 900,
					fontSize: 150,
					lineHeight: 0.98,
					letterSpacing: -5,
					color: C.white,
					opacity: slamO,
					transform: `scale(${1.25 - 0.25 * slam})`,
					transformOrigin: '0% 50%',
				}}
			>
				<span style={{position: 'relative', display: 'inline-block'}}>
					<span style={{color: C.red}}>JUST</span>
					<span style={{position: 'absolute', left: 0, bottom: 4, height: 10, width: `${underline * 100}%`, background: C.red, borderRadius: 5}} />
				</span>{' '}
				THE
				<br />
				PAYMENT.
			</div>
			{/* unknown costs still to come */}
			{[0, 1, 2].map((i) => {
				const a = tPay + 2 + i * 4;
				const o = prog(frame, a, 10);
				const pulse = 0.6 + 0.4 * Math.sin((frame - a) * 0.18 + i);
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: 90,
							right: 90,
							top: 1060 + i * 104,
							height: 84,
							borderRadius: 18,
							border: '2px dashed rgba(167,173,180,0.35)',
							opacity: o,
							transform: `translateY(${(1 - o) * 20}px)`,
						}}
					>
						<div style={{position: 'absolute', left: 32, top: 30, width: 220 + i * 60, height: 22, borderRadius: 11, background: 'rgba(167,173,180,0.22)'}} />
						<div style={{position: 'absolute', right: 34, top: 14, fontFamily: FONT, fontWeight: 900, fontSize: 50, color: C.red, opacity: pulse}}>+ ?</div>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};
