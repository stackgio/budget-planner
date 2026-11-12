import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {kf, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {Chip, StepHeader} from '../ui';

/** Optional recurring buy — no recording supplied, so a clearly labelled text step. */
export const RecurringScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tRec = cue('L25', 'recurring');
	const tWeek = cue('L25', 'week');
	const tMonth = cue('L25', 'month');
	const tBudget = cue('L25', 'budget');
	const pIn = sp(frame, fps, tRec - 4, 'bouncy');
	const toggle = sp(frame, fps, tMonth - 2, 'snappy');
	const weekOn = frame >= tWeek - 2 ? 1 : 0;
	const W = 780;
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={420} lightY={700} />
			<StepHeader palette={P} steps={[{at: -30, n: '+', label: 'OPTIONAL: RECURRING BUY'}]} />
			<div style={{position: 'absolute', left: story.safe.left, top: 360, fontSize: 26, fontWeight: 800, letterSpacing: 3, color: P.muted, opacity: kf(frame, [0, 10], [0, 1])}}>TEXT STEP · NOT IN MY RECORDING</div>
			<div style={{position: 'absolute', left: story.safe.left, top: 440, fontSize: 96, fontWeight: 900, lineHeight: 1, color: P.ink, letterSpacing: -2, opacity: Math.min(1, pIn * 1.4), transform: `translateY(${(1 - pIn) * 40}px)`}}>
				WEEKLY <span style={{color: P.muted}}>OR</span>
				<br />
				<span style={{color: P.accent}}>MONTHLY</span>
			</div>
			{/* frequency toggle */}
			<div style={{position: 'absolute', left: story.safe.left, top: 700, width: W, height: 120, borderRadius: 999, background: P.paper, border: `3px solid ${P.line}`, opacity: weekOn ? 1 : 0.4}}>
				<div style={{position: 'absolute', top: 8, left: 8 + toggle * (W / 2 - 8), width: W / 2 - 16, height: 104 - 6, borderRadius: 999, background: weekOn ? P.accent : 'transparent'}} />
				{['WEEKLY', 'MONTHLY'].map((l, i) => {
					const activeIdx = toggle > 0.5 ? 1 : 0;
					return (
						<div key={l} style={{position: 'absolute', left: i * (W / 2), width: W / 2, top: 0, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 900, color: weekOn && activeIdx === i ? '#0B0C0E' : P.body}}>
							{l}
						</div>
					);
				})}
			</div>
			<Chip text="AN AMOUNT THAT FITS YOUR BUDGET" at={tBudget - 4} x={story.safe.left} y={880} palette={P} size={40} tone="dark" anchor="left" />
			<Marcus
				x={800}
				y={story.ground}
				scale={1.0}
				facing={-1}
				onDark
				seed={3}
				track={[
					{at: 0, pose: 'idle', face: 'curious'},
					{at: tWeek - 6, pose: 'point', face: 'happy'},
					{at: tBudget - 4, pose: 'present', face: 'happy'},
				]}
			/>
			<Sfx at={tWeek} name="tick" volume={0.3} />
			<Sfx at={tMonth} name="tick" volume={0.3} />
			<Sfx at={tBudget} name="pop" volume={0.25} />
		</AbsoluteFill>
	);
};
