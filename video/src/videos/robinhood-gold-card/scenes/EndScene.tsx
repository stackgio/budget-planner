import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {MARCUS_SCALE, MARCUS_X} from './PlanScene';

/** ENDING — FIRST STATEMENT UPDATE (reason to follow) → the question. Marcus match-cuts in from the plan scene. */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tFirst = cue('L14', 'first');
	const tShow = cue('L14', 'show');
	const tL15 = cue('L15');
	const tAre = cue('L15', 'are');
	const tOr = cue('L15', 'or');

	const badge = sp(frame, fps, tFirst - 3, 'bouncy');
	const badgeOut = kf(frame, [tAre - 10, tAre - 2], [0, 1], E.in);
	const bug = kf(frame, [tL15, tL15 + 12], [0, 1]);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={1000} light={1.1} floorY={story.ground} />
			{badgeOut < 1 && (
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 300,
						display: 'flex',
						justifyContent: 'center',
						opacity: Math.min(1, badge * 1.5) * (1 - badgeOut),
						transform: `translateY(${-badgeOut * 60}px) scale(${0.7 + 0.3 * badge})`,
					}}
				>
					<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '26px 46px', borderRadius: 26, background: P.accent, color: '#06130B', fontWeight: 900, textAlign: 'center'}}>
						<div style={{fontSize: 84, letterSpacing: -2, lineHeight: 1}}>FIRST STATEMENT</div>
						<div style={{fontSize: 84, letterSpacing: -2, lineHeight: 1}}>UPDATE</div>
					</div>
				</div>
			)}
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 48, top: 290}}>
				<KineticText text="SPEND THE POINTS OR INVEST THEM?" at={tAre} mode="slam" slamScale={0.3} fontSize={104} color={P.ink} colors={{invest: P.accent}} align="center" />
			</div>
			<BrandBug palette={P} opacity={0.75 * bug} style={{left: story.safe.left, top: story.safe.top - 10}} />
			<Marcus
				x={MARCUS_X}
				y={story.ground}
				scale={MARCUS_SCALE}
				facing={1}
				seed={3}
				onDark
				track={[
					{at: 0, pose: 'fist', face: 'determined'},
					{at: tFirst, pose: 'think', face: 'curious', spring: 'smooth'},
					{at: tShow, pose: ['point', {fs: 70, head: -6}], face: 'happy', spring: 'snappy'},
					{at: tOr, pose: 'shrug', face: 'smug', spring: 'bouncy'},
				]}
			/>
			<Sfx at={tFirst - 2} name="whoosh-soft" volume={0.3} />
			<Sfx at={tAre} name="thud" volume={0.3} />
		</AbsoluteFill>
	);
};
