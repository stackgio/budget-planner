import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {CreditCard} from '../../../story/components/CreditCard';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Bill} from '../../../story/components/Money';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, prog, shake, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS, monthlyInterest} from '../facts';
import {ExampleTag} from '../ui';

const CARD = {x: 500, y: 585, w: 420};
const CARD_H = CARD.w * 0.63;
const EQ = {x: 380, y: 880, w: 580};

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

/**
 * 02 — HIGH-INTEREST DEBT. The interest math is the hero: $1,000 × 24% ÷ 12 ≈ $20,
 * built term by term on the spoken words, then $20 physically leaves Marcus's hand.
 * One small card, one label, one short disclaimer.
 */
export const DebtScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t0 = cue('L6');
	const tAvoid = cue('L6', 'avoiding');
	const tHigh = cue('L6', 'high-interest');
	const tPaying = cue('L6', 'paying');
	const tCredit = cue('L7', 'credit');
	const tCard = cue('L7', 'card');
	const tInterest = cue('L7', 'interest');
	const tCan = cue('L7', 'can');
	const tSlow = cue('L7', 'slow');

	const balance = FACTS.cardBalance.value;
	const apr = FACTS.apr.value;
	const cardIn = sp(frame, fps, t0 - 6, 'heavy');
	const badge = sp(frame, fps, tHigh, 'bouncy');
	const paying = kf(frame, [tPaying - 2, tPaying + 6, tCredit - 8, tCredit - 2], [0, 1, 1, 0]);
	const [pBal, pApr, pMo, pRes] = [tCredit - 2, tCard, tInterest, tCan].map((t) => sp(frame, fps, t, 'snappy'));
	const resSlam = sp(frame, fps, tCan, 'heavy');
	const billT = prog(frame, tSlow - 6, 16, E.inOut);
	const hit = shake(frame, tSlow + 10, 10, 14);

	const term = (p: number): React.CSSProperties => ({display: 'inline-block', opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * 40}px)`});

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={680} lightY={1000} floorY={story.ground} />
			<ChapterTag n="02" label="HIGH-INTEREST DEBT" at={t0 - 4} palette={P} style={{left: story.safe.left, top: story.safe.top + 10}} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 320}}>
				<KineticText text="AVOID HIGH INTEREST" at={tAvoid - 2} fontSize={100} color={P.ink} colors={{avoid: P.accent}} />
			</div>
			<Camera
				keys={[
					{at: 0, zoom: 1},
					{at: tCan, zoom: 1},
				]}
				shakeX={hit.x}
				shakeY={hit.y}
			>
				<CreditCard
					w={CARD.w}
					variant="debt"
					balanceLabel="BALANCE"
					balance={<NumberCounter value={balance} fontSize={50} color="#F5F2EA" roll={false} />}
					rotY={(1 - cardIn) * -30}
					shine={kf(frame, [tHigh, tHigh + 22], [0, 1], E.inOut) || -1}
					style={{left: CARD.x + (1 - cardIn) * 500, top: CARD.y}}
					badge={
						<>
							<div
								style={{
									position: 'absolute',
									right: -16,
									top: -26,
									background: P.danger,
									color: '#fff',
									fontSize: 40,
									fontWeight: 900,
									borderRadius: 16,
									padding: '8px 18px',
									transform: `scale(${badge}) rotate(${6 * badge}deg)`,
									boxShadow: `0 10px 24px ${P.shadow}`,
								}}
							>
								{apr}% APR
							</div>
							<div
								style={{
									position: 'absolute',
									left: 24,
									bottom: -26,
									background: P.accent,
									color: P.bg,
									fontSize: 30,
									fontWeight: 900,
									letterSpacing: 2,
									borderRadius: 14,
									padding: '6px 16px',
									opacity: paying,
									transform: `scale(${0.7 + 0.3 * paying})`,
									transformOrigin: '0 50%',
								}}
							>
								PAYING IT OFF ↓
							</div>
						</>
					}
				/>

				{/* the math — primary visual */}
				<div style={{position: 'absolute', left: EQ.x, top: EQ.y, width: EQ.w, fontWeight: 900, color: P.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: -2}}>
					<div style={{fontSize: 80, lineHeight: 1.08, whiteSpace: 'nowrap'}}>
						<span style={term(pBal)}>{fmt(balance)}</span>
						<span style={{...term(pApr), marginLeft: 22}}>
							<span style={{color: P.muted}}>×</span> {apr}%
						</span>
					</div>
					<div style={{fontSize: 80, lineHeight: 1.08, whiteSpace: 'nowrap'}}>
						<span style={term(pMo)}>
							<span style={{color: P.muted}}>÷</span> 12 <span style={{fontSize: 30, letterSpacing: 3, color: P.muted}}>MONTHS</span>
						</span>
					</div>
					<div style={{height: 5, borderRadius: 3, background: P.line, margin: '14px 0 6px', transform: `scaleX(${pRes})`, transformOrigin: '0 50%'}} />
					<div
						style={{
							fontSize: 150,
							lineHeight: 1.05,
							color: P.danger,
							whiteSpace: 'nowrap',
							opacity: Math.min(1, resSlam * 2),
							transform: `scale(${1 + (1 - resSlam) * 0.4})`,
							transformOrigin: '0 50%',
						}}
					>
						≈ ${monthlyInterest}
						<span style={{fontSize: 34, letterSpacing: 3, marginLeft: 14}}>/ MONTH</span>
					</div>
				</div>
				<ExampleTag text="SIMPLIFIED EXAMPLE" style={{left: EQ.x, top: 1250, opacity: Math.min(1, pBal * 1.4)}} />
				<div style={{position: 'absolute', left: EQ.x, width: EQ.w, top: 1305, fontSize: 24, fontWeight: 700, lineHeight: 1.3, color: P.muted, opacity: pBal}}>
					Real interest varies with daily balances &amp; payments.
				</div>

				{/* $20 leaves Marcus's budget */}
				{billT > 0 && billT < 1 && (() => {
					const [x, y] = arc(billT, [300, 1060], [CARD.x + CARD.w * 0.5, CARD.y + CARD_H * 0.5], 240);
					return <Bill w={150} value="20" tint={P.danger} style={{left: x, top: y, transform: `translate(-50%,-50%) rotate(${billT * 220}deg) scale(${1 - 0.3 * billT})`}} />;
				})()}
				<div
					style={{
						position: 'absolute',
						left: 150,
						top: 820,
						fontSize: 56,
						fontWeight: 900,
						color: P.danger,
						opacity: kf(frame, [tSlow - 4, tSlow + 2, tSlow + 30, tSlow + 40], [0, 1, 1, 0]),
						transform: `translateY(${-prog(frame, tSlow - 4, 30) * 40}px)`,
					}}
				>
					−${monthlyInterest}
				</div>
				<Marcus
					x={200}
					y={story.ground}
					scale={1.0}
					facing={1}
					seed={5}
					onDark
					track={[
						{at: -10, pose: 'idle', face: 'neutral'},
						{at: tAvoid - 2, pose: 'stop', face: 'determined', spring: 'snappy'},
						{at: tPaying - 6, pose: 'push', face: 'focused', spring: 'snappy'},
						{at: tCredit - 2, pose: ['think', {head: 8}], face: 'worried'},
						{at: tSlow - 6, pose: 'feed', face: 'worried', spring: 'snappy'},
						{at: tSlow + 10, pose: 'flinch', face: {mouthCurve: -0.6, sweat: 1}, spring: 'bouncy'},
					]}
				/>
			</Camera>
			<Sfx at={t0 - 4} name="card" volume={0.4} />
			<Sfx at={tHigh + 2} name="pop" volume={0.35} />
			<Sfx at={tPaying} name="cash" volume={0.3} />
			<Sfx at={tCan + 2} name="thud" volume={0.4} />
			<Sfx at={tSlow + 10} name="coin" volume={0.35} />
		</AbsoluteFill>
	);
};
