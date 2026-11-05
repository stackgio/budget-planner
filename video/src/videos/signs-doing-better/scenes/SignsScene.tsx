import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {IconInvest, IconJar, IconNoDebt} from '../icons';

const CARDS = [
	{n: '01', Icon: IconInvest},
	{n: '02', Icon: IconNoDebt},
	{n: '03', Icon: IconJar},
];

/** 3 SIGNS — a counter rolls to 3 and three minimal cards deal in; card 01 steps forward. No Marcus. */
export const SignsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tThree = cue('L3', '3');
	const tSigns = cue('L3', 'signs');
	const tRealize = cue('L3', 'realize');

	const count = mix(0, 3, prog(frame, tThree - 4, 14, E.out));
	const signsIn = sp(frame, fps, tSigns - 2, 'snappy');
	const focus = prog(frame, tRealize - 4, 16, E.inOut);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={700} warm={false} />
			<div style={{position: 'absolute', left: story.safe.left, top: 260, display: 'flex', alignItems: 'flex-end', gap: 30}}>
				<NumberCounter value={count} prefix="" fontSize={360} color={P.accent} fixedDigits={1} style={{opacity: frame >= tThree - 4 ? 1 : 0}} />
				<div
					style={{
						fontSize: 150,
						fontWeight: 900,
						letterSpacing: -4,
						color: P.ink,
						lineHeight: 1,
						paddingBottom: 46,
						transform: `translateY(${(1 - signsIn) * 60}px)`,
						opacity: Math.min(1, signsIn * 1.5),
					}}
				>
					SIGNS
				</div>
			</div>
			{CARDS.map(({n, Icon}, i) => {
				const tIn = tSigns + 2 + i * 5;
				const p = sp(frame, fps, tIn, 'bouncy');
				const isFirst = i === 0;
				const x = 72 + i * 300;
				const scale = (0.7 + 0.3 * p) * (isFirst ? 1 + 0.12 * focus : 1 - 0.06 * focus);
				return (
					<div
						key={n}
						style={{
							position: 'absolute',
							left: x,
							top: 820,
							width: 270,
							height: 380,
							borderRadius: 28,
							background: P.paper,
							border: `3px solid ${isFirst && focus > 0.5 ? P.accent : P.line}`,
							boxShadow: `0 30px 60px ${P.shadow}`,
							opacity: Math.min(1, p * 1.6) * (isFirst ? 1 : 1 - 0.55 * focus),
							transform: `translateY(${(1 - p) * 260}px) rotate(${(1 - p) * (i - 1) * 12}deg) scale(${scale})`,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 34,
						}}
					>
						<div style={{fontSize: 84, fontWeight: 900, color: P.ink, letterSpacing: -2}}>{n}</div>
						<Icon size={120} />
					</div>
				);
			})}
			<Sfx at={tThree} name="tick" volume={0.4} />
			{CARDS.map((_, i) => (
				<Sfx key={i} at={tSigns + 4 + i * 5} name="card" volume={0.3} />
			))}
			<Sfx at={tRealize - 2} name="whoosh-soft" volume={0.3} />
		</AbsoluteFill>
	);
};
