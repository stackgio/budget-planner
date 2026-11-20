import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {C, ChecklistRow, L, Label, Stage} from '../ui';

const ITEMS = [
	'Set aside bills due before payday',
	'Budget for gas + groceries',
	'Move money into savings',
	'Pay card minimums, then target the highest rate',
	'Set a fun-money limit',
];

/**
 * ENDING — pull back to the completed checklist (screenshot frame). The list is
 * static once revealed; the footer CTA appears as the spoken CTA ends so the
 * last frame shows it once.
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const pull = sp(frame, fps, 0, 'smooth');
	const footAt = cue('L16', 'payday', 0.12, 'end');
	const foot = sp(frame, fps, footAt, 'smooth');
	const s = mix(1.22, 1, pull);
	return (
		<Stage lightY={760}>
			<div style={{position: 'absolute', inset: 0, transform: `scale(${s})`, transformOrigin: '540px 640px', opacity: kf(frame, [0, 6], [0.4, 1], E.out)}}>
				<div style={{position: 'absolute', left: L.left, top: 262, right: 100}}>
					<div style={{fontSize: 66, fontWeight: 900, color: C.white, lineHeight: 1.04, letterSpacing: -1.5}}>
						<span style={{color: C.green, fontSize: 84}}>5</span> THINGS TO DO
						<br />
						WHEN YOU GET PAID
					</div>
				</div>
				{ITEMS.map((t, i) => (
					<ChecklistRow
						key={i}
						n={i + 1}
						label={t}
						checkAt={-40}
						h={126}
						fontSize={i === 3 ? 34 : 38}
						style={{left: L.left, top: 462 + i * 144}}
					/>
				))}
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 1218, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, opacity: foot, transform: `translateY(${(1 - foot) * 14}px)`}}>
				<svg width={26} height={30} viewBox="0 0 20 24">
					<path d="M3 2h14v20l-7-5-7 5z" fill={C.green} />
				</svg>
				<Label size={30} color={C.white} style={{fontWeight: 900, letterSpacing: 5}}>
					SAVE FOR NEXT PAYDAY
				</Label>
			</div>
			<Sfx at={4} name="chime" volume={0.24} />
		</Stage>
	);
};
