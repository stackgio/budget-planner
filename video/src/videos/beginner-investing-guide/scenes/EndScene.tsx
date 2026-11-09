import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {BrandLogo, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {BrandBg, FONT, L, P, useIn} from '../ui';

/** ENDING — personal, short: "I'm only 22", then the brand and the follow. */
export const EndScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const inn = useIn();
	const tOnly = cue('L28', 'only');
	const tLearn = cue('L28', 'learning');
	const tFollow = cue('L29', 'Follow', -0.1);
	const tStack = cue('L29', 'Stack', -0.1);
	const tLearnCta = cue('L29', 'learn', -0.1);
	const swap = kf(frame, [tFollow - 6, tFollow + 4], [0, 1]);
	const logo = sp(frame, fps, tFollow, 'bouncy');
	const words = ['LEARN.', 'INVEST.', 'BUILD.'];
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={700} glow={1 + swap * 0.6} />
			{/* part 1: personal */}
			<div style={{position: 'absolute', left: L, top: 230, right: 120, opacity: 1 - swap}}>
				<KineticText text="I'M ONLY 22" at={tOnly - 4} fontSize={130} color={P.ink} colors={{'22': P.accent}} />
				<div style={{marginTop: 18}}>
					<KineticText text="still learning, too" at={tLearn - 4} fontSize={64} color={P.body} weight={800} />
				</div>
			</div>
			<div style={{opacity: 1 - swap}}>
				<Marcus
					x={760}
					y={story.ground}
					scale={1.05}
					facing={-1}
					onDark
					seed={9}
					track={[
						{at: 0, pose: 'relaxed', face: 'happy'},
						{at: tOnly, pose: 'shrug', face: 'smug', spring: 'bouncy'},
						{at: tLearn, pose: 'think', face: 'curious'},
					]}
				/>
			</div>
			{/* part 2: brand */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: swap}}>
				<div style={{transform: `scale(${logo * 1})`}}>
					<BrandLogo size={150} ink={P.ink} accent={P.accent} />
				</div>
				<div style={{display: 'flex', gap: 22, marginTop: 70}}>
					{words.map((w, i) => {
						const p = sp(frame, fps, tFollow + 8 + i * 6, 'bouncy');
						return (
							<div key={w} style={{fontSize: 80, fontWeight: 900, letterSpacing: -2, color: i === 2 ? P.accent : P.ink, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 40}px)`}}>
								{w}
							</div>
						);
					})}
				</div>
				<div style={{marginTop: 80, ...inn(tStack, 'bouncy')}}>
					<div style={{padding: '26px 46px', borderRadius: 999, background: P.accent, color: P.bg, fontSize: 46, fontWeight: 900, letterSpacing: 2}}>FOLLOW STACK WITH GIO</div>
				</div>
				<div style={{marginTop: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12}}>
					{['Real investing journey', 'Beginner-friendly money lessons'].map((t, i) => (
						<div key={t} style={{fontSize: 34, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: P.body, ...inn(tLearnCta + i * 6, 'snappy', 18)}}>
							<span style={{color: P.accent}}>●</span> {t}
						</div>
					))}
				</div>
			</div>
			<Sfx at={tFollow} name="pop" volume={0.28} />
		</AbsoluteFill>
	);
};
