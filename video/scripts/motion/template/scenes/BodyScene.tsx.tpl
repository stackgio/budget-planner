import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {ProgressBar} from '../../../story/components/ProgressBar';
import {useCues} from '../../../story/lib/cues';
import {mix, prog} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS} from '../facts';

/** BODY — the money moves on the word that names it. Viewer learns: TODO */
export const BodyScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {cue} = useCues();
	const tMoney = cue('L2', 'money');
	const p = prog(frame, tMoney, 30);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={700} />
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 40, fontSize: 28, fontWeight: 900, letterSpacing: 4, color: P.muted}}>EXAMPLE</div>
			<NumberCounter value={mix(FACTS.start.value, FACTS.end.value, p)} fontSize={180} color={P.ink} style={{position: 'absolute', left: story.safe.left, top: 300}} />
			<ProgressBar progress={p} w={1080 - story.safe.left - story.safe.right} palette={P} style={{left: story.safe.left, top: 560}} />
			<Marcus x={540} y={story.ground} facing={1} onDark track={[{at: 0, pose: 'present', face: 'focused'}, {at: tMoney + 30, pose: 'fist', face: 'determined'}]} />
			<Sfx at={tMoney} name="coin" volume={0.4} />
		</AbsoluteFill>
	);
};
