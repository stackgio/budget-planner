import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';

/** ENDING — "Which one are you making right now?" Recap of the three costs + the question. */
const ROWS = [
	{n: '01', label: 'THE CAR', cost: `${usd(FACTS.carYear.value)}/yr`},
	{n: '02', label: 'THE MINIMUM', cost: `${usd(FACTS.monthlyInterest.value)}/mo`},
	{n: '03', label: 'THE MATCH', cost: `${usd(FACTS.matchYear.value)}/yr`},
];

export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tWhich = cue('L12', 'which');
	const tNow = cue('L12', 'now');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 20, right: story.safe.right}}>
				<KineticText text="WHICH ONE" at={tWhich - 4} fontSize={story.type.display} color={P.ink} colors={{ONE: P.accent}} />
				<KineticText text="ARE YOU MAKING?" at={tWhich + 2} fontSize={story.type.h1} color={P.ink} />
			</div>
			{ROWS.map((r, i) => {
				const p = sp(frame, fps, 6 + i * 5, 'snappy');
				const hi = sp(frame, fps, tNow + i * 6, 'bouncy');
				return (
					<div
						key={r.n}
						style={{
							position: 'absolute',
							left: story.safe.left,
							top: 470 + i * 112,
							width: 600,
							height: 92,
							borderRadius: 20,
							background: P.paper,
							boxShadow: `0 10px 22px ${P.shadow}`,
							display: 'flex',
							alignItems: 'center',
							gap: 20,
							padding: '0 22px',
							opacity: p,
							transform: `translateX(${(1 - p) * -60}px) scale(${1 + 0.04 * Math.sin(Math.PI * Math.min(1, hi))})`,
						}}
					>
						<div style={{width: 56, height: 56, borderRadius: 14, background: P.accent, color: '#fff', fontWeight: 900, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{r.n}</div>
						<div style={{flex: 1, fontSize: 32, fontWeight: 900, color: P.ink, letterSpacing: 1}}>{r.label}</div>
						<div style={{fontSize: 30, fontWeight: 900, color: P.danger}}>{r.cost}</div>
					</div>
				);
			})}
			<Marcus
				x={860}
				y={story.ground}
				scale={1.04}
				facing={-1}
				seed={9}
				track={[
					{at: 0, pose: 'worried', face: 'worried'},
					{at: tWhich, pose: 'think', face: 'curious', spring: 'bouncy'},
					{at: tNow + 10, pose: ['point', {head: -4}], face: 'happy'},
				]}
			/>
			<BrandBug palette={P} opacity={0.7} style={{position: 'absolute', left: story.safe.left, top: 1300}} />
			{ROWS.map((r, i) => (
				<Sfx key={r.n} at={6 + i * 5} name="click" volume={0.25} />
			))}
		</AbsoluteFill>
	);
};
