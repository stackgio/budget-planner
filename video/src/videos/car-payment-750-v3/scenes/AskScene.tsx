import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {WhiteStudioBg} from '../../car-payment-750-recut/look';
import {C, FONT, Label, StudioBg} from '../look';

/** End card headline; the full spoken question stays in the synced captions. */

export const AskScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tQ = cue('L15', 'curious', -0.1);
	const push = kf(frame, [0, 130], [1, 1.05], E.soft);
	const inn = sp(frame, fps, 0, 'smooth');
	const q = sp(frame, fps, tQ, 'smooth');

	return (
		<AbsoluteFill style={{background: C.black}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 520, overflow: 'hidden', transform: `translateX(${(1 - inn) * -70}px)`}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${push})`, transformOrigin: '540px 400px'}}>
					<StudioBg floorY={470} />
					<Car id="v2AskLux" variant="luxury" paint={PAINTS.gunmetal} x={540} y={470} w={760} lights={1} beam={0.5} sheen={kf(frame, [0, 90], [-0.2, 1.2])} sheenAmt={0.55} reflection={0.2} />
				</div>
			</div>
			<div style={{position: 'absolute', left: 0, top: 1000, width: 1080, height: 920, overflow: 'hidden', transform: `translateX(${(1 - inn) * 70}px)`}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${push})`, transformOrigin: '540px 200px'}}>
					<WhiteStudioBg floorY={232} />
					<Car id="v2AskUsed" variant="sedan" paint={PAINTS.silver} x={540} y={232} w={600} lights={0.2} sheen={0.6} sheenAmt={0.5} reflection={0.1} rim={0.4} />
				</div>
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 520, height: 480, background: C.black, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22}}>
				<div style={{textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 124, letterSpacing: -4, lineHeight: 1.0, color: C.white, opacity: frame < tQ ? 0 : prog(frame, tQ, 6), transform: `translateY(${(1 - q) * 24}px) scale(${push})`}}>
					YOUR <span style={{color: C.green}}>MAX</span>
					<br />
					CAR PAYMENT?
				</div>
			</div>
		</AbsoluteFill>
	);
};
