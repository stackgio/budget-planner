import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {ScreenshotCrop} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {DASH} from '../assets';

/** BRIDGE — "here's how I get that money into my portfolio" · "use the card, earn points". The real card returns. */
export const BridgeScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tHow = cue('L7', 'how');
	const tCard = cue('L8', 'card');
	const tPoints = cue('L8', 'points');

	const cardIn = sp(frame, fps, 0, 'smooth');
	const tap = kf(frame, [tCard - 2, tCard + 3, tCard + 12], [0, 1, 0], E.inOut);
	const pill = sp(frame, fps, tPoints - 2, 'bouncy');
	const w = 760;
	const h = (DASH.card.h / DASH.card.w) * w;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={880} light={1} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 48, top: story.safe.top + 40}}>
				<KineticText text="Into my portfolio" at={tHow} mode="rise" fontSize={100} color={P.ink} colors={{portfolio: P.accent}} align="center" />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 540 - w / 2,
					top: 560,
					width: w,
					height: h,
					borderRadius: 28,
					transform: `translateY(${(1 - cardIn) * 80}px) scale(${1 - 0.05 * tap}) rotate(${-2 * tap}deg)`,
					opacity: cardIn,
					boxShadow: '0 40px 90px rgba(0,0,0,0.7)',
				}}
			>
				<ScreenshotCrop src={DASH.src} natural={DASH.natural} region={DASH.card} w={w} radius={28} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0,
					right: 0,
					top: 560 + h + 50,
					display: 'flex',
					justifyContent: 'center',
					opacity: Math.min(1, pill * 1.5),
					transform: `translateY(${(1 - pill) * -60}px) scale(${0.6 + 0.4 * pill})`,
				}}
			>
				<div style={{padding: '18px 38px', borderRadius: 999, background: P.accent, color: '#06130B', fontSize: 50, fontWeight: 900, letterSpacing: -1}}>+ Earn points</div>
			</div>
			<Sfx at={tCard} name="card" volume={0.35} />
			<Sfx at={tPoints + 6} name="pop" volume={0.3} />
		</AbsoluteFill>
	);
};
