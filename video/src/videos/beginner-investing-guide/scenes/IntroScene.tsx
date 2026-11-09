import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {BrandBg, FONT, L, P, Pill, useIn} from '../ui';

/** PERSONAL DISCLAIMER — short, honest, human. */
export const IntroScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const inn = useIn();
	const tNot = cue('L2', 'not');
	const tShare = cue('L3', 'sharing');
	const tJourney = cue('L3', 'journey');
	const bug = sp(frame, fps, 2, 'smooth');
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowX={300} glowY={500} />
			<BrandBug palette={P} opacity={bug} style={{left: L, top: 190}} />
			<div style={{position: 'absolute', left: L, top: 300, ...inn(tNot - 4, 'bouncy')}}>
				<Pill tone="ghost" size={30}>
					<span style={{color: P.accent}}>●</span> Not a financial advisor
				</Pill>
			</div>
			<div style={{position: 'absolute', left: L, top: 430, right: 120}}>
				<KineticText text="MY PERSONAL INVESTING JOURNEY" at={tShare - 2} fontSize={110} color={P.ink} colors={{journey: P.accent}} stagger={4} />
			</div>
			<div style={{position: 'absolute', left: L, top: 820, fontSize: 32, fontWeight: 700, color: P.body, letterSpacing: 0.5, ...inn(tJourney, 'smooth', 20)}}>
				Educational content <span style={{color: P.accent}}>•</span> Investing involves risk
			</div>
			<Marcus
				x={800}
				y={story.ground}
				scale={1.0}
				facing={-1}
				onDark
				seed={4}
				track={[
					{at: 0, pose: 'relaxed', face: 'neutral'},
					{at: tNot, pose: 'shrug', face: 'smug', spring: 'bouncy'},
					{at: tShare, pose: 'present', face: 'happy'},
					{at: tJourney + 6, pose: ['present', {head: 8}], face: 'joy'},
				]}
			/>
			<Sfx at={tNot} name="pop" volume={0.25} />
		</AbsoluteFill>
	);
};
