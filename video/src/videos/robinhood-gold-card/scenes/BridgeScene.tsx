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

const CARD_W = 760;
const CARD_H = (DASH.card.h / DASH.card.w) * CARD_W;
const CARD_TOP = 560;
/** centre of the "+ Earn points" pill */
export const PILL_CENTER = {x: 540, y: CARD_TOP + CARD_H + 50 + 44};

/**
 * The bridge layout. `headlineAt` drives the headline entrance; the rest is driven by
 * explicit 0..1 values so RedeemScene can continue the exact end state and hand the
 * "Earn points" pill over to the Cash back screen (`exit`, `pillTo`).
 */
export const BridgeStage: React.FC<{
	headlineAt: number;
	cardIn: number;
	tap: number;
	pill: number;
	exit?: number;
	pillTo?: {x: number; y: number; scale: number};
}> = ({headlineAt, cardIn, tap, pill, exit = 0, pillTo}) => {
	const px = pillTo ? PILL_CENTER.x + (pillTo.x - PILL_CENTER.x) * exit : PILL_CENTER.x;
	const py = pillTo ? PILL_CENTER.y + (pillTo.y - PILL_CENTER.y) * exit : PILL_CENTER.y;
	const ps = pillTo ? 1 + (pillTo.scale - 1) * exit : 1;
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<div style={{opacity: 1 - Math.min(1, exit * 1.8)}}>
				<CinematicBg lightX={540} lightY={880} light={1} />
				<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 48, top: story.safe.top + 40}}>
					<KineticText text="Into my portfolio" at={headlineAt} mode="rise" fontSize={100} color={P.ink} colors={{portfolio: P.accent}} align="center" />
				</div>
				<div
					style={{
						position: 'absolute',
						left: 540 - CARD_W / 2,
						top: CARD_TOP,
						width: CARD_W,
						height: CARD_H,
						borderRadius: 28,
						transform: `translateY(${(1 - cardIn) * 80 + exit * 120}px) scale(${1 - 0.05 * tap}) rotate(${-2 * tap}deg)`,
						opacity: cardIn,
						boxShadow: '0 40px 90px rgba(0,0,0,0.7)',
					}}
				>
					<ScreenshotCrop src={DASH.src} natural={DASH.natural} region={DASH.card} w={CARD_W} radius={28} />
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					left: px,
					top: py,
					transform: `translate(-50%, -50%) translateY(${(1 - pill) * -60}px) scale(${(0.6 + 0.4 * pill) * ps})`,
					opacity: Math.min(1, pill * 1.5) * (1 - kf(exit, [0.6, 1], [0, 1])),
					padding: '18px 38px',
					borderRadius: 999,
					background: P.accent,
					color: '#06130B',
					fontSize: 50,
					fontWeight: 900,
					letterSpacing: -1,
					whiteSpace: 'nowrap',
				}}
			>
				+ Earn points
			</div>
		</AbsoluteFill>
	);
};

/** BRIDGE — "here's how I get that money into my portfolio" · "use the card, earn points". The real card returns. */
export const BridgeScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tHow = cue('L7', 'how');
	const tCard = cue('L8', 'card');
	const tPoints = cue('L8', 'points');
	return (
		<>
			<BridgeStage
				headlineAt={tHow}
				cardIn={sp(frame, fps, 0, 'smooth')}
				tap={kf(frame, [tCard - 2, tCard + 3, tCard + 12], [0, 1, 0], E.inOut)}
				pill={sp(frame, fps, tPoints - 2, 'bouncy')}
			/>
			<Sfx at={tCard} name="card" volume={0.35} />
			<Sfx at={tPoints + 6} name="pop" volume={0.3} />
		</>
	);
};
