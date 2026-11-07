import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, mix, prog, shake, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {Kicker} from '../props';
import {KineticText} from '../../../story/components/KineticText';
import {LIFESTYLE_TITLE} from './InflationScene';

const L = story.safe.left;
const ARROW_X = 420;
const NEW_X = 520;

/**
 * THE REALIZATION — "Your paycheck went up, but your bank account didn't."
 * A before/after ledger on a dark stage. Income row lands first, then the
 * money-left row slams in with the biggest number in the video: $0 → $0.
 */
export const RealizeScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tPay = cue('L8', 'paycheck');
	const tUp = cue('L8', 'up');
	const tBank = cue('L8', 'bank');
	const tDidnt = cue('L8', "didn't");

	const row1 = sp(frame, fps, tPay - 8, 'snappy');
	const roll = prog(frame, tUp - 4, 16, E.inOut);
	const row2 = sp(frame, fps, tBank - 10, 'snappy');
	const slam = sp(frame, fps, tBank + 2, 'heavy');
	const hit = shake(frame, tBank + 8, 12, 14);
	const line = prog(frame, tBank + 10, 14, E.out);
	const tLife = cue('L9', 'lifestyle');
	const tInfl = cue('L9', 'inflation');
	// the finished comparison stays on screen: it docks below the title instead of leaving
	const dock = prog(frame, tLife - 10, 18, E.inOut);

	const old = (v: string, p: number, top: number) => (
		<div style={{position: 'absolute', left: L, top, fontSize: 84, fontWeight: 900, color: P.body, letterSpacing: -3, opacity: p, transform: `translateX(${(1 - p) * -40}px)`}}>{v}</div>
	);
	const arrow = (p: number, top: number) => (
		<svg width={70} height={50} viewBox="0 0 70 50" style={{position: 'absolute', left: ARROW_X, top, opacity: p}}>
			<path d="M4,25H58M40,8L60,25L40,42" fill="none" stroke={P.body} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={760} floorY={1300} />
			<Camera keys={[{at: 0, zoom: 1.03, x: 540, y: 900}, {at: tBank + 8, zoom: 1.0, x: 540, y: 900, ease: E.soft}]} handheld={0.6} shakeX={hit.x} shakeY={hit.y}>
				<div style={{position: 'absolute', inset: 0, transformOrigin: `${L}px 270px`, transform: `translateY(${dock * 210}px) scale(${1 - 0.22 * dock})`}}>
				{/* INCOME row */}
				<Kicker color={P.body} size={34} style={{position: 'absolute', left: L, top: 266, opacity: row1}}>Income</Kicker>
				{old(usd(FACTS.oldIncome.value), row1, 330)}
				{arrow(row1, 370)}
				<div style={{position: 'absolute', left: NEW_X, top: 316, opacity: row1, transform: `translateX(${(1 - row1) * 40}px)`}}>
					<NumberCounter value={mix(FACTS.oldIncome.value, FACTS.newIncome.value, roll)} fontSize={124} color={P.accent} fixedDigits={4} style={{letterSpacing: -5}} />
				</div>

				<div style={{position: 'absolute', left: L, right: story.safe.right, top: 540, height: 2, background: P.line, opacity: row2}} />

				{/* MONEY LEFT row — the hero */}
				<Kicker color={P.body} size={34} style={{position: 'absolute', left: L, top: 596, opacity: row2}}>Money left</Kicker>
				{old(usd(FACTS.leftOver.value), row2, 700)}
				{arrow(row2, 740)}
				<div
					style={{
						position: 'absolute',
						left: NEW_X,
						top: 610,
						fontSize: 300,
						fontWeight: 900,
						color: P.ink,
						letterSpacing: -10,
						lineHeight: 1,
						opacity: Math.min(1, slam * 1.6),
						transform: `scale(${1 + (1 - slam) * 0.5})`,
						transformOrigin: '20% 50%',
						filter: slam < 0.6 ? `blur(${(0.6 - slam) * 12}px)` : undefined,
					}}
				>
					{usd(FACTS.leftOver.value)}
				</div>
				<div style={{position: 'absolute', left: NEW_X + 6, top: 930, width: 330 * line, height: 12, borderRadius: 6, background: P.danger}} />

				</div>
				<Marcus
					x={250}
					y={1300}
					scale={0.95}
					facing={1}
					seed={6}
					onDark
					opacity={1 - prog(frame, tInfl, 14, E.in)}
					track={[
						{at: 0, pose: ['idle', {head: -10}], face: 'curious'},
						{at: tUp, pose: ['present', {head: -12}], face: 'happy'},
						{at: tBank + 6, pose: 'sit', face: 'worried', spring: 'heavy'},
					]}
				/>
			</Camera>
			<div style={{...LIFESTYLE_TITLE}}>
				<KineticText text="LIFESTYLE" at={tLife - 4} fontSize={108} color={P.ink} />
				<KineticText text="INFLATION" at={tInfl - 4} fontSize={108} color={P.danger} />
			</div>
			<Sfx at={tInfl} name="whoosh-soft" volume={0.35} />
			<Sfx at={tUp - 2} name="tick" volume={0.35} />
			<Sfx at={tBank + 6} name="thud" volume={0.55} />
		</AbsoluteFill>
	);
};
