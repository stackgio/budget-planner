import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {E, mix, prog, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {at, ProgressPath, STOPS} from '../path';

/**
 * ENDING — same path (match cut). The three signs appear as stops ahead of Marcus;
 * on "start" he takes the first steps and the first stop lights up. Then it breathes.
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tThings = cue('L12', 'these');
	const tDont = cue('L12', "don't");
	const tYou = cue('L13', 'you');
	const tStart = cue('L13', 'start');
	const tToday = cue('L13', 'today');

	const icons = [0, 1, 2].map((i) => sp(frame, fps, tThings + i * 5, 'bouncy'));
	const walk = prog(frame, tStart, 46, E.inOut);
	const s = mix(0, STOPS[0] - 0.06, walk);
	const [wx, wy] = s <= 0 ? [220, story.ground] : at(s);
	const mx = s <= 0 ? 220 : mix(220, wx, Math.min(1, walk * 3));
	const lit0 = sp(frame, fps, tToday, 'bouncy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={mix(300, 640, walk)} lightY={1100} floorY={story.ground} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 320}}>
				<KineticText text="DON'T FEEL BEHIND" at={cue('L12', 'yet') - 2} exitAt={tYou - 12} fontSize={104} color={P.ink} colors={{behind: P.accent}} />
			</div>
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 320}}>
				<KineticText text="YOU CAN START TODAY" at={tYou + 4} fontSize={124} color={P.ink} colors={{today: P.accent}} lineHeight={1.0} />
			</div>
			<Camera keys={[{at: 0, zoom: 1.04, x: 420, y: 1000}, {at: tThings, zoom: 1.04, x: 420, y: 1000}, {at: tThings + 30, zoom: 1, ease: E.inOut}]}>
				<ProgressPath drawn={1} done={s} icons={icons} lit={[lit0, 0, 0]} />
				<Marcus
					x={mx}
					y={s <= 0 ? story.ground : wy + 4}
					scale={1.05}
					facing={1}
					seed={9}
					onDark
					track={[
						{at: -10, pose: ['relaxed', {head: -12}], face: 'determined'},
						{at: tDont - 2, pose: ['point', {head: -14}], face: 'happy', spring: 'snappy'},
						{at: tStart - 2, pose: 'walk', face: 'determined', cycle: 'walk'},
						{at: tStart + 46, pose: 'fist', face: 'joy', spring: 'bouncy'},
					]}
				/>
			</Camera>
			{icons.map((_, i) => (
				<Sfx key={i} at={tThings + 2 + i * 5} name="pop" volume={0.25} />
			))}
			<Sfx at={tToday} name="chime" volume={0.35} />
		</AbsoluteFill>
	);
};
