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
			{/* headline + pill share one flow column: the pill is always laid out BELOW the
			    headline's actual (two-line) height, so they can never overlap at any frame.
			    Column spans y 986 → ~1282, clear of the source credit (1318) and captions (1430). */}
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 986, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 26}}>
				<KineticText text="MIDTERM RESULTS" at={tDem - 2} fontSize={94} color={C.ink} />
			<div
				style={{
					padding: '12px 26px',
					borderRadius: 999,
					border: `3px solid ${C.ink}`,
					fontSize: 38,
					fontWeight: 900,
					letterSpacing: 3,
					color: C.ink,
					opacity: chip,
					// enters from slightly BELOW its slot (away from the headline)
					transform: `translateY(${(1 - chip) * 14}px)`,
				}}
			>
				DEMOCRATIC VICTORIES
			</div>
			</div>
			<SourceTag text={SRC.election} extra="ALSO CITED: AI SPENDING DOUBTS · PROFIT-TAKING" at={tWon} />
			<Sfx at={tDem - 2} name="paper" volume={0.22} />
		</AbsoluteFill>
	);
};
