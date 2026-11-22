import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandBug} from '../../../story/components/Chrome';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {Board} from '../Board';
import {MatteBg, P} from '../look';

/** The board returns (left column intact); HIGH-YIELD SAVINGS fills, then the completed board holds. */
export const SavingsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tEmergency = cue('G2', 'emergency', -0.05);
	const tHys = cue('G2', 'high-yield', -0.08);
	const tInterest = cue('G2', 'interest', -0.05);
	const tAside = cue('G2', 'set', -0.05);
	const tEnd = cue('G2', undefined, 0.15, 'end');
	const done = -90;
	const brand = sp(frame, fps, tEnd + 24, 'smooth');
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<MatteBg y={760} />
			<Camera keys={[{at: 0, zoom: 1.0}, {at: tEnd, zoom: 1.0}, {at: tEnd + 40, zoom: 1.03, y: 940}]}>
				<Board
					left={{on: done, header: done, purpose: done, items: [done, done, done]}}
					right={{on: 6, header: tHys, purpose: tEmergency, items: [tInterest, tAside]}}
					finalAt={tEnd}
				/>
			</Camera>
			<BrandBug palette={P} opacity={brand} style={{left: 0, right: 0, justifyContent: 'center', top: 1470}} />
			<Sfx at={tEmergency} name="whoosh-soft" volume={0.3} />
			<Sfx at={tHys} name="stamp" volume={0.35} />
			<Sfx at={tInterest} name="pop" volume={0.3} />
			<Sfx at={tAside} name="click" volume={0.35} />
			<Sfx at={tEnd} name="chime" volume={0.3} />
		</AbsoluteFill>
	);
};
