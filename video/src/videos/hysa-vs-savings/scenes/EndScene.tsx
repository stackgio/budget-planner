import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Bookmark} from '../../../story/components/Places';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {MARCUS} from '../layout';

/**
 * END — "Save this, and switch your savings before Monday."
 * A calm, confident CTA: bookmark stamps in, the deadline lands in green.
 */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSave = cue('L11', 'save');
	const tSwitch = cue('L11', 'switch');
	const tMonday = cue('L11', 'monday');
	const mark = sp(frame, fps, tSave - 2, 'bouncy');
	const foot = sp(frame, fps, tMonday + 6, 'smooth');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={300} lightY={500} warm={false} />
			<div style={{position: 'absolute', left: story.safe.left, top: 300, display: 'flex', alignItems: 'center', gap: 34}}>
				<div style={{transform: `scale(${mark}) rotate(${(1 - mark) * -25}deg)`, opacity: Math.min(1, mark * 2)}}>
					<Bookmark w={96} fill={P.accent} stroke={P.ink} />
				</div>
				<KineticText text="SAVE THIS" at={tSave - 4} fontSize={130} color={P.ink} />
			</div>
			<div style={{position: 'absolute', left: story.safe.left, top: 500, right: story.safe.right}}>
				<KineticText text="SWITCH BEFORE MONDAY" at={tSwitch - 4} fontSize={120} color={P.accent} marker={{words: ['monday'], color: 'rgba(44,212,122,0.18)', at: tMonday}} />
			</div>

			<Marcus
				x={MARCUS.x}
				y={story.ground}
				scale={1.05}
				facing={-1}
				seed={6}
				onDark
				track={[
					{at: 0, pose: 'idle', face: 'happy'},
					{at: tSave, pose: ['point', {head: -16}], face: 'determined'},
					{at: tMonday + 4, pose: 'fist', face: 'smug', spring: 'bouncy'},
				]}
			/>

			<div style={{position: 'absolute', left: story.safe.left, top: 1200, opacity: foot}}>
				<BrandBug palette={P} />
				<div style={{marginTop: 18, fontSize: 24, fontWeight: 600, color: P.muted, width: 560, lineHeight: 1.3}}>Example rates, compounded yearly. HYSA rates vary. Not financial advice.</div>
			</div>
			<Sfx at={tSave} name="pop" volume={0.4} />
			<Sfx at={tMonday} name="chime" volume={0.35} />
		</AbsoluteFill>
	);
};

