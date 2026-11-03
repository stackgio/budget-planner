import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {CreditCard} from '../../../story/components/CreditCard';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, shake, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {CARD, CARD_BALANCE, MARCUS_A} from '../layout';
import {EXAMPLE} from '../numbers';

/**
 * HOOK — "Before you start paying off debt, here are three things I wish I knew."
 * Viewer feels: the weight of a big balance (it literally leans on Marcus),
 * then curiosity (three locked slots). Ends framed exactly like scene 2.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tPay = cue('L1', 'paying');
	const tThree = cue('L1', 'three');
	const tEnd = cue('L1', undefined, 0, 'end');

	const approach = sp(frame, fps, tPay - 2, 'heavy');
	const toCard = sp(frame, fps, tEnd - 6, {damping: 200, stiffness: 120, mass: 1});
	const NUM = {x: story.safe.left, y: 590, fs: 200};
	// number: rest → looms toward Marcus → shrinks into the card's balance slot
	const nx = mix(NUM.x + 80 * approach, CARD_BALANCE.x, toCard);
	const ny = mix(NUM.y + 50 * approach, CARD_BALANCE.y, toCard);
	const ns = mix(1 + 0.06 * approach, CARD_BALANCE.fontSize / NUM.fs, toCard);
	const nr = mix(4.5 * approach, 0, toCard);
	const impact = shake(frame, tPay + 10, 10, 16);
	const settle = kf(frame, [0, 12], [1.04, 1], E.out);

	const cardIn = kf(frame, [tEnd - 6, tEnd + 10], [0, 1], E.out);
	const swap = toCard > 0.985;

	const slots = [0, 1, 2].map((i) => sp(frame, fps, tThree + i * 4, 'bouncy'));
	const slotsOut = kf(frame, [tEnd - 10, tEnd + 2], [0, 1], E.in);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
				{/* kicker + title: readable on frame 0 */}
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 20, fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted}}>
				BEFORE PAYING OFF DEBT
			</div>
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 66, right: story.safe.right}}>
				<KineticText text="3 THINGS" at={-14} fontSize={118} color={P.ink} colors={{'3': P.accent}} />
				<KineticText text="I WISH I KNEW" at={-18} stagger={2} fontSize={118} color={P.ink} />
			</div>

			{/* curiosity gap: three locked slots */}
			<div style={{position: 'absolute', left: story.safe.left, top: 496, display: 'flex', gap: 16, opacity: 1 - slotsOut}}>
				{slots.map((p, i) => (
					<div
						key={i}
						style={{
							width: 128,
							height: 64,
							borderRadius: 18,
							border: `3px dashed ${P.muted}`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 10,
							fontSize: 30,
							fontWeight: 900,
							color: P.body,
							transform: `scale(${p * (1 - slotsOut * 0.3)})`,
							opacity: Math.min(1, p * 1.5),
							background: 'rgba(255,255,255,0.5)',
						}}
					>
						<span style={{color: P.accent}}>{i + 1}</span>
						<span style={{color: P.muted}}>?</span>
					</div>
				))}
			</div>

			<Camera
				keys={[
					{at: 0, zoom: 1.0},
					{at: tPay, zoom: 1.0},
					{at: tPay + 26, zoom: 1.07, x: 620, y: 960},
					{at: tEnd - 8, zoom: 1.07, x: 620, y: 960},
					{at: tEnd + 10, zoom: 1, x: 540, y: 960},
				]}
				shakeX={impact.x}
				shakeY={impact.y}
			>
				{/* the card the balance belongs to (lands where scene 2 has it) */}
				{cardIn > 0 && (
					<CreditCard
						w={CARD.w}
						balance={swap ? <NumberCounter value={EXAMPLE.startBalance} fontSize={CARD_BALANCE.fontSize} color="#F5F2EA" /> : <span style={{opacity: 0}}>$0</span>}
						balanceLabel="CARD BALANCE"
						style={{left: CARD.x, top: CARD.y, opacity: cardIn, transform: `scale(${0.94 + 0.06 * cardIn})`, transformOrigin: '20% 50%'}}
					/>
				)}

				{/* the debt itself */}
				{!swap && (
					<div style={{position: 'absolute', left: nx, top: ny, transformOrigin: '0 0', transform: `scale(${ns * settle}) rotate(${nr}deg)`}}>
						<div style={{opacity: 1 - toCard, display: 'inline-block', background: P.danger, color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: 3, padding: '8px 16px', borderRadius: 10, marginBottom: 6, marginLeft: 6}}>
							CREDIT CARD DEBT
						</div>
						<div style={{filter: `drop-shadow(0 ${24 * approach}px ${30 * approach}px rgba(60,30,10,${0.28 * approach * (1 - toCard)}))`}}>
							<NumberCounter value={EXAMPLE.startBalance} fontSize={NUM.fs} color={toCard > 0.3 ? '#F5F2EA' : P.ink} style={{letterSpacing: -6}} />
						</div>
					</div>
				)}

				<Marcus
					x={MARCUS_A.x + 50 * approach * (1 - toCard)}
					y={MARCUS_A.y}
					scale={MARCUS_A.scale}
					facing={-1}
					seed={1}
					track={[
						{at: 0, pose: ['idle', {head: -14}], face: 'curious'},
						{at: tPay + 8, pose: 'flinch', face: 'shock', spring: 'bouncy'},
						{at: tThree - 2, pose: 'worried', face: 'worried'},
						{at: tEnd - 4, pose: 'idle', face: 'neutral'},
					]}
				/>
			</Camera>
			<Sfx at={tPay + 4} name="whoosh" volume={0.45} />
			<Sfx at={tPay + 10} name="thud" volume={0.55} />
			<Sfx at={tThree} name="pop" volume={0.35} />
			<Sfx at={tThree + 4} name="pop" volume={0.3} />
			<Sfx at={tThree + 8} name="pop" volume={0.3} />
			<Sfx at={tEnd - 4} name="card" volume={0.45} />
		</AbsoluteFill>
	);
};
