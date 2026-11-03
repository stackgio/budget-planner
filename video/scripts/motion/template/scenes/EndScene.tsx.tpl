import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {BrandBug} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {editorial as P, story} from '../../../story/theme';

/** ENDING — satisfying takeaway, natural CTA only if it fits. */
export const EndScene: React.FC = () => {
	const {cue} = useCues();
	const tTake = cue('L3', 'takeaway');
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<div style={{position: 'absolute', left: story.safe.left, top: 420, right: story.safe.right}}>
				<KineticText text="PLACEHOLDER TAKEAWAY" at={tTake - 6} mode="slam" fontSize={104} color={P.ink} colors={{TAKEAWAY: P.accent}} />
			</div>
			<Marcus x={540} y={story.ground} scale={1.05} track={[{at: 0, pose: 'idle', face: 'neutral'}, {at: tTake, pose: 'celebrate', face: 'joy', cycle: 'cheer'}]} />
			<BrandBug palette={P} style={{position: 'absolute', left: story.safe.left, top: story.safe.top}} opacity={0.7} />
		</AbsoluteFill>
	);
};
