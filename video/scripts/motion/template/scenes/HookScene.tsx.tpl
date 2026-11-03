import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';

/** HOOK — readable on frame 0. Viewer feels: TODO */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tKey = cue('L1', 'attention');
	const react = sp(frame, fps, tKey, 'bouncy');
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 20, right: story.safe.right}}>
				<KineticText text="PLACEHOLDER HOOK" at={-14} fontSize={112} color={P.ink} colors={{HOOK: P.accent}} />
			</div>
			<Camera keys={[{at: 0, zoom: 1}, {at: tKey, zoom: 1}, {at: tKey + 24, zoom: 1.06, x: 640, y: 1000}]}>
				<Marcus
					x={760}
					y={story.ground}
					scale={1.05}
					facing={-1}
					track={[
						{at: 0, pose: 'idle', face: 'curious'},
						{at: tKey, pose: 'shock', face: 'shock', spring: 'bouncy'},
					]}
				/>
			</Camera>
			<div style={{position: 'absolute', left: story.safe.left, top: 760, fontSize: 64, fontWeight: 900, color: P.accent, opacity: react}}>!</div>
			<Sfx at={tKey} name="pop" volume={0.35} />
		</AbsoluteFill>
	);
};
