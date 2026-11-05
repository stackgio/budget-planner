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

const CARD = {x: 430, y: 585, w: 540};
const CARD_H = CARD.w * 0.63;
const STRIP = {x: CARD.x, y: CARD.y + CARD_H + 34, w: CARD.w, h: 26};
const MATH = {x: CARD.x, y: 985, w: CARD.w};

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

/**
 * 02 — HIGH-INTEREST DEBT. Learn: interest is a monthly cost. The $1,000 / 24% APR
 * card, a red balance strip that shrinks while it's paid off, the simplified first-month
 * math, then $20 leaves Marcus's hand and pushes the balance back.
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
	// balance strip: shrinks while paying, then the $20 interest pushes it back
	const paid = prog(frame, tPaying - 4, 26, E.inOut) * 0.3;
	const back = prog(frame, tSlow + 10, 12, E.out) * 0.08;
	const strip = 1 - paid + back;
	const rows = [tCredit - 2, tCard, tInterest, tCan].map((t) => sp(frame, fps, t, 'snappy'));
	const billT = prog(frame, tSlow - 6, 16, E.inOut);
	const hit = shake(frame, tSlow + 10, 10, 14);

	const Row: React.FC<{p: number; label: string; value: string; tone?: string; big?: boolean}> = ({p, label, value, tone = P.ink, big}) => (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'baseline',
				opacity: Math.min(1, p * 1.5),
				transform: `translateX(${(1 - p) * 40}px)`,
				padding: big ? '6px 0 0' : '0',
				borderTop: big ? `3px solid ${P.line}` : undefined,
				marginTop: big ? 8 : 0,
			}}
		>
			<div style={{fontSize: big ? 30 : 28, fontWeight: 800, letterSpacing: 3, color: big ? P.danger : P.muted}}>{label}</div>
			<div style={{fontSize: big ? 72 : 48, fontWeight: 900, color: tone, fontVariantNumeric: 'tabular-nums', letterSpacing: -1}}>{value}</div>
		</div>
	);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={700} lightY={760} floorY={story.ground} />
			<ChapterTag n="02" label="HIGH-INTEREST DEBT" at={t0 - 4} palette={P} style={{left: story.safe.left, top: story.safe.top + 10}} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 320}}>
				<KineticText text="AVOID HIGH INTEREST" at={tAvoid - 2} fontSize={100} color={P.ink} colors={{avoid: P.accent}} />
			</div>
			<Camera keys={[{at: 0, zoom: 1}]} shakeX={hit.x} shakeY={hit.y}>
				<CreditCard
					w={CARD.w}
					variant="debt"
					balanceLabel="BALANCE"
					balance={<NumberCounter value={balance} fontSize={62} color="#F5F2EA" roll={false} />}
					rotY={(1 - cardIn) * -30}
					shine={kf(frame, [tHigh, tHigh + 22], [0, 1], E.inOut) || -1}
					style={{left: CARD.x + (1 - cardIn) * 500, top: CARD.y}}
					badge={
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
								letterSpacing: 1,
								transform: `scale(${badge}) rotate(${6 * badge}deg)`,
								boxShadow: `0 10px 24px ${P.shadow}`,
							}}
						>
							{apr}% APR
						</div>
					}
				/>
				{/* balance strip (shrinks when paid, grows back with interest) */}
				<div style={{position: 'absolute', left: STRIP.x, top: STRIP.y, width: STRIP.w, height: STRIP.h, borderRadius: STRIP.h / 2, background: P.line, opacity: cardIn}}>
					<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: STRIP.w * strip, borderRadius: STRIP.h / 2, background: P.danger}} />
				</div>
				<div style={{position: 'absolute', left: STRIP.x, top: STRIP.y + STRIP.h + 8, fontSize: 24, fontWeight: 800, letterSpacing: 3, color: P.muted, opacity: cardIn * kf(frame, [tCredit - 8, tCredit - 2], [1, 0])}}>
					BALANCE LEFT
				</div>
				<div style={{position: 'absolute', right: 1080 - (STRIP.x + STRIP.w), top: STRIP.y + STRIP.h + 8, fontSize: 24, fontWeight: 900, letterSpacing: 3, color: P.accent, opacity: kf(frame, [tPaying, tPaying + 8, tCredit - 6, tCredit], [0, 1, 1, 0])}}>
					PAYING IT OFF ↓
				</div>
				{/* simplified first-month interest */}
				<div style={{position: 'absolute', left: MATH.x, top: MATH.y, width: MATH.w}}>
					<Row p={rows[0]} label="BALANCE" value={fmt(balance)} />
					<Row p={rows[1]} label="× APR" value={`${apr}%`} />
					<Row p={rows[2]} label="÷ MONTHS" value="12" />
					<Row p={rows[3]} label="INTEREST / MO" value={`≈ $${monthlyInterest}`} tone={P.danger} big />
					<div style={{marginTop: 10, fontSize: 24, fontWeight: 700, lineHeight: 1.3, color: P.muted, opacity: rows[0]}}>
						Illustrative example — simplified monthly calculation. Real interest depends on daily balances, billing cycles &amp; payments.
					</div>
				</div>
				<ExampleTag style={{left: story.safe.left, top: 640, opacity: Math.min(1, badge * 1.4)}} />
				{/* $20 leaves Marcus's budget */}
				{billT > 0 && billT < 1 && (() => {
					const [x, y] = arc(billT, [320, 1060], [CARD.x + CARD.w * 0.5, CARD.y + CARD_H * 0.5], 260);
					return <Bill w={150} value="20" tint={P.danger} style={{left: x, top: y, transform: `translate(-50%,-50%) rotate(${billT * 220}deg) scale(${1 - 0.3 * billT})`}} />;
				})()}
				<div
					style={{
						position: 'absolute',
						left: 120,
						top: 840,
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
					x={210}
					y={story.ground}
					scale={1.04}
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
			<Sfx at={tCan + 2} name="tick" volume={0.35} />
			<Sfx at={tSlow + 10} name="thud" volume={0.45} />
		</AbsoluteFill>
	);
};
