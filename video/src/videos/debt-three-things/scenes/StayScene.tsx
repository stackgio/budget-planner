import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {CreditCard} from '../../../story/components/CreditCard';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {ProgressBar} from '../../../story/components/ProgressBar';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, shake, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';

const MX = 800;
const OFFER = {x: 330, y: 1080, w: 400};

/** The tempting new card. Reads the frame itself so motion blur can sample it. */
const Offer: React.FC<{tIn: number; tPush: number}> = ({tIn, tPush}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const pin = sp(frame, fps, tIn, 'bouncy');
	const out = prog(frame, tPush + 2, 13, E.in);
	const x = mix(mix(-420, OFFER.x, pin), -760, out);
	const y = OFFER.y - 160 * out + Math.sin(frame * 0.12) * 6 * (1 - out);
	const rot = mix(mix(-38, -8, pin), -70, out);
	const h = OFFER.w * 0.63;
	return (
		<div style={{position: 'absolute', left: x - OFFER.w / 2, top: y - h / 2, transform: `rotate(${rot}deg)`}}>
			<CreditCard
				w={OFFER.w}
				variant="offer"
				issuer="NEW CARD"
				balanceLabel="PRE-APPROVED!"
				balance="0% APR*"
				shine={kf(frame, [tIn + 6, tIn + 30], [0, 1], E.inOut) || -1}
				style={{left: 0, top: 0}}
			/>
		</div>
	);
};

/**
 * 03 — STAY DEBT-FREE
 * Learn: the finish line is a new habit, not a zero. Feel: the high of $0,
 * then the pull of a shiny offer, and the confidence to push it away.
 */
export const StayScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t0 = cue('L7');
	const tZero = t0 + 22;
	const tOffer = cue('L8', undefined, -0.25, 'end');
	const tStaying = cue('L9', 'staying');
	const tPush = cue('L9', 'debt');
	const tReal = cue('L9', 'real');

	const roll = prog(frame, t0 - 4, 26, E.inOut);
	const remaining = mix(640, 0, roll);
	const bar = mix(0.93, 1, roll);
	const paid = sp(frame, fps, tZero, 'heavy');
	const blockOut = kf(frame, [tStaying - 8, tStaying], [0, 1], E.in);
	const pushHit = shake(frame, tPush + 2, 8, 10);
	const blurWindow = frame >= tPush - 1 && frame <= tPush + 18;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<ChapterTag n="03" label="DON'T GO BACK" at={t0 + 2} palette={P} style={{left: story.safe.left, top: story.safe.top + 10}} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 296}}>
				<KineticText text="Don't go right back into debt." at={t0 + 8} fontSize={74} color={P.ink} colors={{"don't": P.danger}} />
			</div>
			<Camera
				keys={[
					{at: 0, zoom: 1},
					{at: tOffer, zoom: 1},
					{at: tOffer + 18, zoom: 1.05, x: 520, y: 1020},
					{at: tPush + 10, zoom: 1.05, x: 520, y: 1020},
					{at: tReal + 6, zoom: 1, x: 540, y: 960},
				]}
				shakeX={pushHit.x}
				shakeY={pushHit.y}
			>
				{/* balance hits zero */}
				<div style={{position: 'absolute', left: story.safe.left, top: 500, width: 936, opacity: 1 - blockOut, transform: `translateY(${-blockOut * 40}px)`}}>
					<div style={{fontSize: 28, fontWeight: 900, letterSpacing: 3, color: P.muted}}>CARD BALANCE</div>
					<div style={{display: 'flex', alignItems: 'center', gap: 28}}>
						<NumberCounter value={remaining} fontSize={170} color={roll >= 1 ? P.accent : P.ink} style={{letterSpacing: -4}} />
						<div
							style={{
								border: `7px solid ${P.accent}`,
								color: P.accent,
								borderRadius: 16,
								padding: '4px 18px',
								fontSize: 52,
								fontWeight: 900,
								letterSpacing: 3,
								transform: `rotate(-10deg) scale(${1 + (1 - paid) * 1.5})`,
								opacity: Math.min(1, paid * 1.6),
							}}
						>
							PAID OFF
						</div>
					</div>
					<ProgressBar progress={bar} w={540} h={30} palette={P} style={{left: 0, top: 236}} />
				</div>

				{/* the payoff line */}
				<div style={{position: 'absolute', left: story.safe.left, top: 580, right: story.safe.right - 40}}>
					<KineticText text="STAY" at={tStaying + 2} mode={frame >= tStaying + 2 ? 'slam' : 'none'} slamScale={0.25} fontSize={128} color={P.ink} style={{opacity: frame >= tStaying + 2 ? undefined : 0}} />
					<KineticText
						text="DEBT-FREE"
						at={tPush + 4}
						mode={frame >= tPush + 4 ? 'slam' : 'none'}
						slamScale={0.25}
						fontSize={128}
						color={P.accentDeep}
						marker={{words: ['DEBT-FREE'], color: 'rgba(30,158,87,0.2)', at: tReal}}
						style={{opacity: frame >= tPush + 4 ? undefined : 0}}
					/>
				</div>

				{/* temptation */}
				{frame >= tOffer - 2 && frame < tPush + 22 &&
					(blurWindow ? (
						<CameraMotionBlur samples={8} shutterAngle={200}>
							<Offer tIn={tOffer} tPush={tPush} />
						</CameraMotionBlur>
					) : (
						<Offer tIn={tOffer} tPush={tPush} />
					))}

				<Marcus
					x={MX}
					y={story.ground}
					scale={1.02}
					facing={-1}
					seed={4}
					track={[
						{at: 0, pose: 'relaxed', face: 'happy'},
						{at: tZero - 2, pose: 'celebrate', face: 'joy', cycle: 'cheer', spring: 'bouncy'},
						{at: tOffer + 2, pose: ['idle', {head: 6}], face: 'curious', cycle: 'none'},
						{at: tStaying, pose: 'stop', face: 'smug', spring: 'snappy'},
						{at: tPush - 3, pose: ['stop', {lean: -12, fs: 70, fe: 60}], face: 'determined', spring: 'snappy'},
						{at: tPush, pose: 'push', face: 'determined', spring: {damping: 14, stiffness: 260, mass: 0.6}},
						{at: tPush + 16, pose: 'fist', face: 'smug'},
						{at: tReal + 14, pose: 'relaxed', face: 'happy'},
					]}
				/>
			</Camera>
			<Sfx at={t0 - 2} name="tick" volume={0.3} />
			<Sfx at={tZero} name="stamp" volume={0.55} />
			<Sfx at={tZero + 2} name="chime" volume={0.4} />
			<Sfx at={tOffer} name="whoosh-soft" volume={0.45} />
			<Sfx at={tOffer + 6} name="card" volume={0.45} />
			<Sfx at={tPush} name="whoosh" volume={0.55} />
			<Sfx at={tStaying + 2} name="thud" volume={0.35} />
			<Sfx at={tPush + 4} name="thud" volume={0.45} />
		</AbsoluteFill>
	);
};
