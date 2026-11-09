import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Car, PAINTS} from '../../../story/components/Car';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {WhiteStudioBg} from '../../car-payment-750-recut/look';
import {C, FONT, Label, StudioBg} from '../look';

/** The original spoken question, word for word; words 3–14 of L15. */
const QUESTION = "WHAT'S THE MOST YOU'D BE WILLING TO PAY FOR A CAR PAYMENT?";
const FIRST_WORD = 3; // "But I'm curious," come first

export const AskScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue, narration, sceneStartFrame} = useCues();
	const line = narration.lines.find((l) => l.id === 'L15')!;
	const tQ = cue('L15', "what's", -0.2);
	const push = kf(frame, [0, 130], [1, 1.05], E.soft);
	const inn = sp(frame, fps, 0, 'smooth');
	const q = sp(frame, fps, tQ, 'smooth');
	const words = QUESTION.split(' ');

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
				<Label size={28} color={C.gray} style={{opacity: prog(frame, cue('L15', 'curious', -0.1), 6)}}>
					But I&rsquo;m curious&hellip;
				</Label>
				<div style={{width: 940, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 82, letterSpacing: -2, lineHeight: 1.06, opacity: frame < tQ ? 0 : prog(frame, tQ, 6), transform: `translateY(${(1 - q) * 24}px)`}}>
					{words.map((w, i) => {
						const lw = line.words[FIRST_WORD + i];
						const spoken = lw ? frame + sceneStartFrame >= Math.round(lw.start * fps) : true;
						const key = w === 'MOST';
						return (
							<span key={i} style={{color: key ? C.green : C.white, opacity: spoken ? 1 : 0.4}}>
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
