import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {StudioBg} from '../../car-payment-750/look';
import {FONT, K, WhiteStudioBg} from '../look';

/** On-screen words match the VO; each lights up as it is spoken (captions stay off here). */
export const QUESTION = "WHAT'S THE MOST YOU'D PAY PER MONTH FOR THE CAR PAYMENT ALONE?";

export const AskScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue, narration, sceneStartFrame} = useCues();
	const line = narration.lines.find((l) => l.id === 'L5')!;
	const push = kf(frame, [0, 150], [1, 1.05], E.soft);
	const inn = sp(frame, fps, 0, 'smooth');
	const q = sp(frame, fps, cue('L5', undefined, -0.25), 'smooth');
	const words = QUESTION.split(' ');

	return (
		<AbsoluteFill style={{background: K.black}}>
			{/* top: the dark car */}
			<div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 560, overflow: 'hidden', transform: `translateX(${(1 - inn) * -70}px)`}}>
				<div style={{position: 'absolute', inset: 0, width: 1080, height: 1920, transform: `scale(${push})`, transformOrigin: '540px 420px'}}>
					<StudioBg floorY={500} />
					<Car id="rcAskLux" variant="luxury" paint={PAINTS.gunmetal} x={540} y={500} w={780} lights={1} beam={0.5} sheen={kf(frame, [0, 90], [-0.2, 1.2])} sheenAmt={0.55} reflection={0.2} />
				</div>
			</div>
			{/* bottom: the silver used car */}
			<div style={{position: 'absolute', left: 0, top: 960, width: 1080, height: 960, overflow: 'hidden', transform: `translateX(${(1 - inn) * 70}px)`}}>
				<div style={{position: 'absolute', inset: 0, width: 1080, height: 1920, transform: `scale(${push})`, transformOrigin: '540px 240px'}}>
					<WhiteStudioBg floorY={262} />
					<Car id="rcAskUsed" variant="sedan" paint={PAINTS.silver} x={540} y={262} w={620} lights={0.2} sheen={0.6} sheenAmt={0.5} reflection={0.1} rim={0.4} />
				</div>
			</div>
			{/* the one question */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 560, height: 400, background: K.black, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<div style={{width: 900, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 84, letterSpacing: -2, lineHeight: 1.05, opacity: prog(frame, cue('L5', undefined, -0.25), 6), transform: `translateY(${(1 - q) * 24}px)`}}>
					{words.map((w, i) => {
						const spoken = line.words[i] ? frame + sceneStartFrame >= Math.round(line.words[i].start * fps) : true;
						const key = w === 'ALONE?' || w === 'MOST';
						return (
							<span key={i} style={{color: key ? K.green : K.white, opacity: spoken ? 1 : 0.35}}>
								{w}
								{i < words.length - 1 ? ' ' : ''}
							</span>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
