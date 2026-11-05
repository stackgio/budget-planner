import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {E, prog, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS} from '../facts';
import {ProgressPath} from '../path';

/**
 * PERSONAL — "I STARTED AT 21" is the hero. Marcus stands at the very start of an
 * empty progress path. Quiet: one slow push, no shake, no confetti.
 */
export const StoryScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t0 = cue('L11');
	const tStart = cue('L11', 'start');
	const tSeriously = cue('L11', 'seriously');
	const t21 = cue('L11', '21');

	const age = sp(frame, fps, t21 - 3, 'heavy');
	const drawn = prog(frame, t0, 50, E.inOut);
	const me = sp(frame, fps, t0 + 2, 'snappy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={300} lightY={1100} floorY={story.ground} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 320}}>
				<KineticText text="I STARTED AT" at={tStart - 4} fontSize={96} color={P.ink} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: story.safe.left - 10,
					top: 410,
					fontSize: 430,
					fontWeight: 900,
					letterSpacing: -20,
					lineHeight: 1,
					color: P.accent,
					opacity: Math.min(1, age * 1.6),
					transform: `scale(${1 + (1 - age) * 0.5})`,
					transformOrigin: '20% 60%',
					filter: age < 0.6 ? `blur(${(0.6 - age) * 12}px)` : undefined,
				}}
			>
				{FACTS.startAge.value}
			</div>
			<Camera keys={[{at: 0, zoom: 1}, {at: tSeriously, zoom: 1}, {at: t21 + 30, zoom: 1.04, x: 420, y: 1000, ease: E.inOut}]}>
				<ProgressPath drawn={drawn} done={0} icons={[0, 0, 0]} lit={[0, 0, 0]} />
				<Marcus
					x={220}
					y={story.ground}
					scale={1.05}
					facing={1}
					seed={8}
					onDark
					track={[
						{at: -10, pose: 'idle', face: 'neutral'},
						{at: t0 + 4, pose: ['shrug', {head: 8}], face: {mouthCurve: 0.15, lookX: 0}, spring: 'limb'},
						{at: tSeriously - 4, pose: ['think', {head: 10}], face: 'focused'},
						{at: t21, pose: ['relaxed', {head: -12}], face: 'determined', spring: 'smooth'},
					]}
				/>
				{/* personal: this one is me */}
				<div
					style={{
						position: 'absolute',
						left: 330,
						top: 900,
						fontSize: 44,
						fontWeight: 900,
						letterSpacing: 2,
						color: P.ink,
						opacity: Math.min(1, me * 1.5),
						transform: `rotate(-6deg) scale(${0.7 + 0.3 * me})`,
						transformOrigin: '0 50%',
					}}
				>
					ME
					<svg width={120} height={70} style={{position: 'absolute', left: -110, top: 30}} viewBox="0 0 120 70">
						<path d="M110,10 Q60,6 22,52" fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${me} 1`} />
						<path d="M14,40 L22,54 L36,48" fill="none" stroke={P.ink} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={me > 0.9 ? 1 : 0} />
					</svg>
				</div>
			</Camera>
			<Sfx at={t21 - 2} name="thud" volume={0.35} />
		</AbsoluteFill>
	);
};
