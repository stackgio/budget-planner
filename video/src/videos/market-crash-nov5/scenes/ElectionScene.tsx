import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {SRC} from '../facts';
import {CapitolLine} from '../art';
import {C, Kicker, NewsBg, SourceTag} from '../ui';

/**
 * ELECTION — "One major concern? Democrats just won big in the midterm elections,"
 * Neutral, original line drawing (no party colours, no campaign imagery).
 * Framed as ONE concern among several — footnote lists the others reported.
 */
export const ElectionScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tOne = cue('L4');
	const tDem = cue('L5', 'Democrats');
	const tWon = cue('L5', 'won');
	const draw = kf(frame, [2, tDem + 12], [0, 1], E.soft);
	const chip = sp(frame, fps, tWon - 2, 'snappy');
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<NewsBg lightY={700} />
			<Camera keys={[{at: 0, zoom: 1.04, y: 900}, {at: tWon + 30, zoom: 1.0, y: 960, ease: E.soft}]}>
				<div style={{position: 'absolute', left: (story.width - 800) / 2, top: 400}}>
					<CapitolLine w={800} draw={draw} />
				</div>
				<div style={{position: 'absolute', left: 40, right: 40, top: 950, height: 3, background: C.line}} />
			</Camera>
			<Kicker style={{left: story.safe.left, top: 250, opacity: kf(frame, [tOne - 4, tOne + 6], [0, 1])}}>ONE MAJOR CONCERN</Kicker>
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 1000}}>
				<KineticText text="MIDTERM RESULTS" at={tDem - 2} fontSize={100} color={C.ink} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: story.safe.left,
					top: 1132,
					padding: '14px 28px',
					borderRadius: 999,
					border: `3px solid ${C.ink}`,
					fontSize: 40,
					fontWeight: 900,
					letterSpacing: 3,
					color: C.ink,
					opacity: chip,
					transform: `translateY(${(1 - chip) * 24}px)`,
				}}
			>
				DEMOCRATIC VICTORIES
			</div>
			<SourceTag text={SRC.election} extra="ALSO CITED: AI SPENDING DOUBTS · PROFIT-TAKING" at={tWon} />
			<Sfx at={tDem - 2} name="paper" volume={0.22} />
		</AbsoluteFill>
	);
};
