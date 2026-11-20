import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {C, ChecklistRow, L, Label, Stage} from '../ui';

const ITEMS = [
	'Set aside bills due before payday',
	'Budget for gas + groceries',
	'Move money into savings',
	'Pay card minimums, then target the highest rate',
	'Set a fun-money limit',
];
const ROW = {top: 400, h: 160, step: 174};

/**
 * ENDING — quick pull-back to the enlarged, completed checklist with the
 * SAVE FOR NEXT PAYDAY footer. Fully settled ~0.4 s in, then static through
 * the CTA and the tail (> 2 s readable). The progress pills fade out so the
 * list can use the full frame.
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pull = sp(frame, fps, -3, 'smooth');
	const s = mix(1.14, 1, pull);
	const foot = sp(frame, fps, 6, 'snappy');
	return (
		<Stage lightY={760}>
			<div style={{position: 'absolute', inset: 0, transform: `scale(${s})`, transformOrigin: '540px 760px', opacity: kf(frame, [0, 5], [0.5, 1], E.out)}}>
				<div style={{position: 'absolute', left: L.left, top: 196, right: 80, fontSize: 76, fontWeight: 900, color: C.white, lineHeight: 1.02, letterSpacing: -2}}>
					<span style={{color: C.green, fontSize: 92}}>5</span> THINGS TO DO
					<br />
					WHEN YOU GET PAID
				</div>
				{ITEMS.map((t, i) => (
					<ChecklistRow key={i} n={i + 1} label={t} checkAt={-40} h={ROW.h} fontSize={i === 3 ? 42 : 46} style={{left: L.left, top: ROW.top + i * ROW.step}} />
				))}
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: ROW.top + 5 * ROW.step + 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, opacity: foot, transform: `translateY(${(1 - foot) * 12}px)`}}>
				<svg width={30} height={36} viewBox="0 0 20 24">
					<path d="M3 2h14v20l-7-5-7 5z" fill={C.green} />
				</svg>
				<Label size={38} color={C.white} style={{fontWeight: 900, letterSpacing: 5}}>
					SAVE FOR NEXT PAYDAY
				</Label>
			</div>
			<Sfx at={3} name="chime" volume={0.24} />
		</Stage>
	);
};
