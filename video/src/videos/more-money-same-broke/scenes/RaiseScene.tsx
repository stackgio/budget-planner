import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {FACTS, usd} from '../facts';
import {ExampleTag, Kicker} from '../props';

/** income column: px per dollar */
export const RAISE_BAR = {x: 110, base: 1300, w: 270, perDollar: 0.16};

/**
 * THE RAISE — "Then boom, you get a raise. Now you're making five thousand."
 * The income column climbs from $3,000 to $5,000; the new +$2,000 block
 * glows bright green (it becomes the spending meter in the next scene).
 */
export const RaiseScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBoom = cue('L3', 'boom');
	const tRaise = cue('L3', 'raise');
	const tFive = cue('L4', 'five');
	const tThousand = cue('L4', 'thousand');

	const base = sp(frame, fps, 2, 'smooth');
	const grow = sp(frame, fps, tFive - 4, {damping: 20, stiffness: 170, mass: 0.9});
	const income = mix(FACTS.oldIncome.value, FACTS.newIncome.value, grow);
	const hOld = FACTS.oldIncome.value * RAISE_BAR.perDollar * base;
	const hNew = FACTS.raise.value * RAISE_BAR.perDollar * grow;
	const top = RAISE_BAR.base - hOld - hNew;
	const badge = sp(frame, fps, tBoom, 'bouncy');
	const badgeOut = kf(frame, [tFive - 6, tFive + 4], [0, 1], E.in);
	const plus = sp(frame, fps, tThousand - 2, 'bouncy');
	const glow = kf(frame, [tThousand, tThousand + 10, tThousand + 40], [0, 1, 0.35]);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg tint="#F7F4EE" floorY={RAISE_BAR.base} />
			<Kicker style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 12}}>The raise</Kicker>
			<ExampleTag style={{right: story.safe.right, top: story.safe.top + 8}} />
			<Camera
				keys={[
					{at: 0, zoom: 1},
					{at: tFive, zoom: 1},
					{at: tFive + 16, zoom: 1.05, x: 440, y: 900, ease: E.out},
				]}
			>
				{/* income number rides the top of the column */}
				<div style={{position: 'absolute', left: RAISE_BAR.x - 6, top: top - 190}}>
					<Kicker>Monthly income</Kicker>
					<NumberCounter value={income} fontSize={136} color={grow > 0.5 ? P.accent : P.ink} style={{letterSpacing: -4}} fixedDigits={4} />
				</div>
				{/* $3,000 base */}
				<div
					style={{
						position: 'absolute',
						left: RAISE_BAR.x,
						top: RAISE_BAR.base - hOld,
						width: RAISE_BAR.w,
						height: hOld,
						background: P.accentDeep,
						borderRadius: hNew > 4 ? '0 0 0 0' : '22px 22px 0 0',
					}}
				>
					<div style={{position: 'absolute', left: 26, bottom: 24, fontSize: 40, fontWeight: 900, color: 'rgba(255,255,255,0.85)', opacity: base}}>
						{usd(FACTS.oldIncome.value)}
					</div>
				</div>
				{/* +$2,000 block */}
				{hNew > 1 && (
					<div
						style={{
							position: 'absolute',
							left: RAISE_BAR.x,
							top,
							width: RAISE_BAR.w,
							height: hNew,
							background: '#3FCB7E',
							borderRadius: '22px 22px 0 0',
							boxShadow: `0 0 ${40 * glow}px rgba(63,203,126,${0.6 * glow})`,
						}}
					/>
				)}
				<div
					style={{
						position: 'absolute',
						left: RAISE_BAR.x + RAISE_BAR.w + 30,
						top: top + hNew / 2 - 50,
						opacity: Math.min(1, plus * 1.5),
						transform: `translateX(${(1 - plus) * -40}px)`,
					}}
				>
					<div style={{fontSize: 92, fontWeight: 900, color: P.accent, letterSpacing: -3, lineHeight: 1}}>+{usd(FACTS.raise.value)}</div>
					<Kicker color={P.accentDeep} size={30}>Every month</Kicker>
				</div>

				{/* RAISE! badge */}
				<div
					style={{
						position: 'absolute',
						left: 560,
						top: 520,
						width: 300,
						height: 300,
						transform: `scale(${badge * (1 - badgeOut)}) rotate(${(1 - badge) * -40 - 8}deg)`,
						opacity: 1 - badgeOut,
					}}
				>
					<svg width={300} height={300} viewBox="-150 -150 300 300" style={{position: 'absolute', inset: 0}}>
						<path
							d={Array.from({length: 24}, (_, i) => {
								const r = i % 2 ? 112 : 146;
								const a = (i / 24) * Math.PI * 2 + frame * 0.01;
								return `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
							}).join('') + 'Z'}
							fill={P.gold}
						/>
					</svg>
					<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 900, color: P.ink, letterSpacing: -1}}>RAISE!</div>
				</div>

				<Marcus
					x={780}
					y={RAISE_BAR.base}
					scale={1.05}
					facing={-1}
					seed={4}
					track={[
						{at: 0, pose: 'idle', face: 'neutral'},
						{at: tBoom - 2, pose: 'shock', face: 'shock', spring: 'bouncy'},
						{at: tRaise - 2, pose: 'celebrate', face: 'joy', cycle: 'cheer'},
						{at: tFive - 4, pose: ['point', {head: -14, fs: 128}], face: 'joy', spring: 'snappy'},
						{at: tThousand + 24, pose: ['present', {head: -10}], face: 'smug'},
					]}
				/>
			</Camera>
			<Sfx at={tBoom} name="pop" volume={0.5} />
			<Sfx at={tRaise} name="chime" volume={0.35} />
			<Sfx at={tFive - 2} name="whoosh-soft" volume={0.35} />
			<Sfx at={tThousand + 2} name="coin" volume={0.4} />
		</AbsoluteFill>
	);
};
