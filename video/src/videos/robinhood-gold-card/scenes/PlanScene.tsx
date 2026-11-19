import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {kf, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';

export const MARCUS_X = 540;
export const MARCUS_SCALE = 1.08;

/** PLAN — regular spending, paid in full every month. Marcus states the rule. */
export const PlanScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tReg = cue('L13', 'regular');
	const tFull = cue('L13', 'full');
	const stamp = sp(frame, fps, tFull - 2, 'heavy');
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={1000} light={1.1} floorY={story.ground} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 48, top: story.safe.top + 70}}>
				<KineticText text="Regular spending." at={tReg - 3} mode="rise" fontSize={96} color={P.ink} align="center" />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: story.safe.top + 220,
					display: 'flex',
					justifyContent: 'center',
					opacity: kf(stamp, [0, 0.3], [0, 1]),
					transform: `scale(${1 + (1 - stamp) * 0.5}) rotate(${-3 * stamp}deg)`,
				}}
			>
				<div style={{padding: '14px 36px', border: `6px solid ${P.accent}`, borderRadius: 20, color: P.accent, fontSize: 84, fontWeight: 900, letterSpacing: -1}}>Paid in full</div>
			</div>
			<Marcus
				x={MARCUS_X}
				y={story.ground}
				scale={MARCUS_SCALE}
				facing={1}
				seed={3}
				onDark
				track={[
					{at: 0, pose: 'idle', face: 'neutral'},
					{at: tReg, pose: 'present', face: 'focused', spring: 'snappy'},
					{at: tFull, pose: 'fist', face: 'determined', spring: 'bouncy'},
				]}
			/>
			<Sfx at={tFull + 3} name="stamp" volume={0.35} />
		</AbsoluteFill>
	);
};
