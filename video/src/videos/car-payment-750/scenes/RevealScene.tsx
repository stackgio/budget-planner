import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {C, ExampleTag, FONT} from '../look';
import {TOTAL_POS} from './CalcScene';

const fmt = (v: number) => `$${v.toLocaleString('en-US')}`;

/** $1,150 / MONTH — the calculator total becomes the hero, the car silhouette waits behind it. */
export const RevealScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tOne = cue('L7', 'one');
	const tFifty = cue('L7', 'fifty');
	const tMonth = cue('L7', 'month');
	const tDrive = cue('L7', 'drive');

	const hit = sp(frame, fps, tOne - 3, 'heavy');
	const size = mix(TOTAL_POS.size, 290, hit);
	const cy = mix(TOTAL_POS.cy, 780, hit);
	const glow = kf(frame, [tOne - 2, tOne + 10, tOne + 60], [0, 1, 0.55]);
	const month = prog(frame, tMonth - 3, 10);
	const drive = sp(frame, fps, tDrive - 3, 'snappy');
	const rim = kf(frame, [0, tOne, tOne + 30], [0.2, 0.2, 1]);
	const settle = kf(frame, [tFifty, tFifty + 12], [0, 1]);

	return (
		<AbsoluteFill style={{background: C.black}}>
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 30% at 50% 780px, rgba(57,255,136,${0.16 * glow}) 0%, rgba(57,255,136,0) 70%)`}} />
			{/* the car, as a rim-lit silhouette */}
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${-frame * 0.5}px)`}}>
				<Car id="revealcar" variant="luxury" paint={PAINTS.silhouette} x={600} y={1385} w={1100} lights={0.35} rim={rim} sheen={kf(frame, [tOne, tOne + 60], [-0.2, 1.2])} sheenAmt={0.25} reflection={0.18} opacity={0.9} />
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 1000, height: 420, background: 'linear-gradient(180deg, rgba(16,16,16,0) 0%, rgba(16,16,16,0.4) 100%)'}} />
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: cy - size * 0.56,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 900,
					fontSize: size,
					lineHeight: 1.12,
					letterSpacing: -size * 0.045,
					color: C.green,
					fontVariantNumeric: 'tabular-nums',
					textShadow: `0 0 ${60 * glow}px rgba(57,255,136,${0.35 * glow})`,
					transform: `scale(${1 + 0.015 * settle})`,
				}}
			>
				{fmt(FACTS.monthly.value)}
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 960, textAlign: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 64, letterSpacing: 18, color: C.white, opacity: month, transform: `translateY(${(1 - month) * 20}px)`}}>
				/ MONTH
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 380, textAlign: 'center', opacity: prog(frame, tOne + 6, 10)}}>
				<ExampleTag text="Payment + insurance + gas" />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 1070,
					textAlign: 'center',
					fontFamily: FONT,
					fontWeight: 800,
					fontSize: 52,
					letterSpacing: 1,
					color: C.gray,
					opacity: frame < tDrive - 3 ? 0 : prog(frame, tDrive - 3, 6),
					transform: `translateY(${(1 - drive) * 26}px)`,
				}}
			>
				just to <span style={{color: C.white}}>drive</span> your car.
			</div>
		</AbsoluteFill>
	);
};
