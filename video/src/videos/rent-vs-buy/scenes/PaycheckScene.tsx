import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {Paycheck} from '../../../story/components/HomeProps';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {cinematic as C, editorial as P, story} from '../../../story/theme';

/**
 * L8 — the punchline. Split screen: a small FIRST PAYCHECK on the left,
 * a huge 30 YEARS on the right. Held long enough for the joke to land.
 */
export const PaycheckScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tPay = cue('L8', 'first paycheck');
	const t30 = cue('L8', 'thirty-year');
	const card = sp(frame, fps, 4, 'bouncy');
	const label = sp(frame, fps, tPay - 2, 'snappy');
	const wipe = prog(frame, t30 - 8, 10, E.inOut);
	const slam = sp(frame, fps, t30 - 1, 'heavy');
	const yrs = sp(frame, fps, t30 + 6, 'snappy');
	const plan = kf(frame, [t30 + 14, t30 + 22], [0, 1]);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<div style={{position: 'absolute', left: 0, top: 0, width: 540, height: 1920}}>
				<div style={{position: 'absolute', left: 0, right: 0, top: 560, textAlign: 'center', opacity: label, transform: `translateY(${(1 - label) * 20}px)`}}>
					<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 5, color: P.muted}}>FIRST</div>
					<div style={{fontSize: 60, fontWeight: 900, letterSpacing: -1, color: P.ink}}>PAYCHECK</div>
				</div>
				<div style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${(1 - card) * 120}px) rotate(${-4 + (1 - card) * -10}deg)`, transformOrigin: '290px 860px', opacity: Math.min(1, card * 2)}}>
					<Paycheck w={330} palette={P} label="PAYCHECK" style={{left: 290, top: 860}} />
				</div>
			</div>
			<div style={{position: 'absolute', left: 540, top: 0, width: 540, height: story.contentBottom, borderBottomLeftRadius: 40, background: C.bg, clipPath: `inset(0 0 ${(1 - wipe) * 100}% 0)`}}>
				<div style={{position: 'absolute', left: 0, width: 420, top: 520, textAlign: 'center'}}>
					<div style={{fontSize: 280, fontWeight: 900, color: C.ink, letterSpacing: -10, lineHeight: 1, transform: `scale(${1 + (1 - slam) * 0.5})`, opacity: Math.min(1, slam * 2)}}>30</div>
					<div style={{fontSize: 104, fontWeight: 900, color: C.danger, letterSpacing: 2, opacity: yrs, transform: `translateY(${(1 - yrs) * 24}px)`}}>YEARS</div>
					<div style={{fontSize: 30, fontWeight: 800, color: C.muted, letterSpacing: 4, marginTop: 18, opacity: plan}}>OF PAYMENTS</div>
				</div>
			</div>
			<Sfx at={4} name="paper" volume={0.3} />
			<Sfx at={t30 + 2} name="thud" volume={0.4} />
		</AbsoluteFill>
	);
};
