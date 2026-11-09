import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {FONT, K, WhiteStudioBg} from '../look';

/** Silver used car in a matte-white studio. */
export const UsedScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tRel = cue('L4', 'reliable', -0.05);
	const tKeep = cue('L4', 'keep', -0.05);
	const tPay = cue('L4', 'paycheck');

	const roll = sp(frame, fps, 0, 'smooth');
	const a = sp(frame, fps, tRel, 'snappy');
	const b = sp(frame, fps, tKeep, 'snappy');
	const mark = kf(frame, [tPay - 2, tPay + 12], [0, 1], E.out);

	return (
		<AbsoluteFill>
			<WhiteStudioBg floorY={1130} />
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${(1 - roll) * 180}px)`}}>
				<Car id="rcUsed" variant="sedan" paint={PAINTS.silver} x={540} y={1130} w={960} lights={0.2} spin={-(1 - roll) * 360} sheen={kf(frame, [0, 90], [0.2, 0.8])} sheenAmt={0.5} reflection={0.1} rim={0.4} />
			</div>
			<div style={{position: 'absolute', left: 70, right: 70, top: 250, fontFamily: FONT, textAlign: 'center'}}>
				<div style={{fontWeight: 900, fontSize: 96, letterSpacing: -3, lineHeight: 1, color: K.ink, opacity: frame < tRel ? 0 : prog(frame, tRel, 4), transform: `translateY(${(1 - a) * 30}px)`}}>
					RELIABLE USED CAR
				</div>
				<div style={{marginTop: 34, fontWeight: 900, fontSize: 76, letterSpacing: -2, lineHeight: 1.05, color: K.ink, opacity: frame < tKeep ? 0 : prog(frame, tKeep, 4), transform: `translateY(${(1 - b) * 30}px)`}}>
					KEEP MORE OF MY{' '}
					<span style={{position: 'relative', display: 'inline-block', color: K.greenInk}}>
						PAYCHECK
						<span style={{position: 'absolute', left: 0, bottom: -4, height: 10, width: `${mark * 100}%`, borderRadius: 5, background: K.green}} />
					</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};
