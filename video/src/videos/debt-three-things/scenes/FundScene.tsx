import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {CreditCard} from '../../../story/components/CreditCard';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Bill, Receipt, SavingsJar} from '../../../story/components/Money';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, shake, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {CARD, CARD_BALANCE, CARD_H, MARCUS_A} from '../layout';
import {balanceAfterFirst, EXAMPLE} from '../numbers';

const CarIcon: React.FC<{size: number}> = ({size}) => (
	<svg width={size} height={size * 0.62} viewBox="0 0 100 62">
		<path d="M10,40L18,20Q22,12 32,12H66Q75,12 80,20L90,40V50H10Z" fill={P.danger} />
		<path d="M28,20H70L76,34H22Z" fill="#fff" opacity={0.85} />
		<circle cx={28} cy={50} r={10} fill={P.ink} />
		<circle cx={72} cy={50} r={10} fill={P.ink} />
	</svg>
);

/**
 * 01 — EMERGENCY FUND
 * Learn: progress on debt is fragile without a buffer. Feel: the gut-drop of a
 * surprise bill, then relief when the jar (not the card) absorbs it.
 */
export const FundScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t0 = cue('L2');
	const tPayStart = cue('L2', 'build');
	const tCar = cue('L3', 'car');
	const tFixing = cue('L3', 'fixing');
	const tFive = cue('L4', 'five');
	const tSaved = cue('L4', 'saved');
	const tMore = cue('L4', 'more');
	const tEnd = cue('L4', undefined, 0, 'end');

	// --- 1) Marcus pays the card: a bill arcs from his hand into the card
	const payT = prog(frame, tPayStart + 6, 20, E.inOut);
	const payLanded = frame >= tPayStart + 26;
	const balance = mix(EXAMPLE.startBalance, balanceAfterFirst, prog(frame, tPayStart + 26, 18, E.out));
	const [bx, by] = arc(payT, [660, 1010], [CARD.x + CARD.w * 0.62, CARD.y + CARD_H * 0.5], 160);
	const minus = kf(frame, [tPayStart + 26, tPayStart + 32, tPayStart + 58, tPayStart + 66], [0, 1, 1, 0]);

	// --- 2) the repair bill slams in
	const drop = sp(frame, fps, tCar - 2, 'heavy');
	const RC = {x: 470, y: 1060};
	const recY = mix(-500, RC.y, drop);
	const recRot = mix(-24, -5, drop);
	const reveal = prog(frame, tCar + 8, 22, E.out);
	const hit = shake(frame, tCar + 12, 16, 18);
	// threat: the bill wants to land on the card
	const threat = kf(frame, [tFixing - 2, tFixing + 10, tSaved + 14, tSaved + 22], [0, 1, 1, 0]);
	const lean = kf(frame, [tFixing, tFixing + 16], [0, 1], E.inOut) * (1 - prog(frame, tFive, 14));

	// --- 3) the jar intercepts
	const jarIn = sp(frame, fps, tFive - 3, 'bouncy');
	const JAR = {x: 196, y: 1330};
	const flights = [0, 1, 2].map((i) => prog(frame, tSaved + 2 + i * 6, 16, E.inOut));
	const jarLevel = mix(1, 0.06, prog(frame, tSaved + 2, 30, E.inOut));
	const jarAmt = mix(EXAMPLE.fund, EXAMPLE.fund - EXAMPLE.repair, prog(frame, tSaved + 2, 30, E.inOut));
	const tStamp = tSaved + 2 + 12 + 16;
	const stamp = sp(frame, fps, tStamp, 'heavy');
	const safeChip = sp(frame, fps, tMore - 4, 'bouncy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<ChapterTag n="01" label="EMERGENCY FUND" at={t0 - 2} palette={P} style={{left: story.safe.left, top: story.safe.top + 10}} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 296}}>
				<KineticText
					text="Build a small emergency fund first."
					at={t0 + 4}
					fontSize={74}
					color={P.ink}
					marker={{words: ['emergency', 'fund'], color: 'rgba(30,158,87,0.22)', at: cue('L2', 'emergency')}}
				/>
			</div>
			<Camera
				keys={[
					{at: 0, zoom: 1},
					{at: tCar, zoom: 1},
					{at: tCar + 16, zoom: 1.04, x: 520, y: 1000, ease: E.out},
					{at: tSaved, zoom: 1.04, x: 520, y: 1000},
					{at: tSaved + 24, zoom: 1, x: 540, y: 960},
				]}
				shakeX={hit.x}
				shakeY={hit.y}
			>
				{/* the card */}
				<CreditCard
					w={CARD.w}
					balanceLabel="CARD BALANCE"
					balance={<NumberCounter value={balance} fontSize={CARD_BALANCE.fontSize} color="#F5F2EA" />}
					shine={kf(frame, [tMore, tMore + 24], [0, 1], E.inOut) || -1}
					rotY={-6 * threat}
					style={{left: CARD.x, top: CARD.y}}
				/>
				{/* payment feedback */}
				<div
					style={{
						position: 'absolute',
						left: CARD.x + CARD.w + 18,
						top: CARD.y + 40,
						opacity: minus,
						transform: `translateY(${(1 - minus) * 20}px)`,
						fontSize: 46,
						fontWeight: 900,
						color: P.accent,
					}}
				>
					−$250
				</div>
				{/* threat: what the bill would do to the card */}
				<div
					style={{
						position: 'absolute',
						left: CARD.x + CARD.w + 18,
						top: CARD.y + 120,
						opacity: threat,
						transform: `scale(${0.8 + 0.2 * threat})`,
						transformOrigin: '0 50%',
						background: P.dangerSoft,
						border: `3px solid ${P.danger}`,
						color: P.danger,
						borderRadius: 16,
						padding: '10px 16px',
						fontSize: 34,
						fontWeight: 900,
						lineHeight: 1.1,
					}}
				>
					+$480?
					<div style={{fontSize: 22, letterSpacing: 2}}>MORE DEBT</div>
				</div>
				{/* outcome */}
				<div
					style={{
						position: 'absolute',
						left: CARD.x + CARD.w + 18,
						top: CARD.y + 120,
						opacity: Math.min(1, safeChip * 1.5),
						transform: `scale(${safeChip})`,
						transformOrigin: '0 50%',
						background: P.accent,
						color: '#fff',
						borderRadius: 16,
						padding: '10px 16px',
						fontSize: 30,
						fontWeight: 900,
						lineHeight: 1.1,
					}}
				>
					✓ NO NEW
					<div>DEBT</div>
				</div>
				{threat > 0.02 && (
					<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: threat * 0.8}}>
						<path
							d={`M${RC.x - 40},${RC.y - 170}Q${RC.x - 60},${CARD.y + CARD_H + 60} ${CARD.x + CARD.w * 0.6},${CARD.y + CARD_H + 16}`}
							fill="none"
							stroke={P.danger}
							strokeWidth={6}
							strokeDasharray="14 12"
							strokeDashoffset={-frame * 2}
						/>
					</svg>
				)}

				{/* the emergency fund */}
				{jarIn > 0.001 && (
					<SavingsJar
						w={230}
						level={jarLevel}
						amount={`$${Math.round(jarAmt)}`}
						style={{left: JAR.x, top: JAR.y, transform: `translate(-50%,-100%) scale(${jarIn})`, transformOrigin: '50% 100%'}}
					/>
				)}

				{/* the surprise bill */}
				{frame >= tCar - 4 && (
					<Receipt
						w={360}
						title="AUTO REPAIR"
						icon={<CarIcon size={54} />}
						lines={[
							['Brake pads', '$210'],
							['Rotors', '$190'],
							['Labor', '$80'],
						]}
						total="$480"
						reveal={reveal}
						stamp={stamp}
						style={{left: RC.x - 40 * lean, top: recY - 30 * lean, transform: `translate(-50%,-50%) rotate(${recRot - 6 * lean}deg)`}}
					/>
				)}

				{/* money flying */}
				{!payLanded && payT > 0 && (
					<Bill w={150} value="250" style={{left: bx, top: by, transform: `translate(-50%,-50%) rotate(${-20 + 40 * payT}deg) scale(${1 - 0.35 * payT})`}} />
				)}
				{flights.map((f, i) => {
					if (f <= 0 || f >= 1) return null;
					const [x, y] = arc(f, [JAR.x + (i - 1) * 30, JAR.y - 250], [RC.x + (i - 1) * 40, RC.y + 40], 220);
					return <Bill key={i} w={130} value="$" style={{left: x, top: y, transform: `translate(-50%,-50%) rotate(${f * 300 + i * 40}deg) scale(${1 - 0.2 * f})`}} />;
				})}

				<Marcus
					x={MARCUS_A.x}
					y={MARCUS_A.y}
					scale={MARCUS_A.scale}
					facing={-1}
					seed={2}
					track={[
						{at: 0, pose: 'idle', face: 'neutral'},
						{at: tPayStart - 2, pose: 'hold', face: 'focused'},
						{at: tPayStart + 6, pose: 'feed', face: 'determined', spring: 'snappy'},
						{at: tPayStart + 30, pose: 'fist', face: 'happy'},
						{at: tPayStart + 52, pose: 'relaxed', face: 'smug'},
						{at: tCar + 6, pose: 'shock', face: 'shock', spring: 'bouncy'},
						{at: tFixing - 4, pose: 'worried', face: 'worried'},
						{at: tFive + 2, pose: ['point', {fs: 58, fe: 6, head: 16, lean: 8}], face: 'curious', spring: 'snappy'},
						{at: tStamp + 2, pose: 'fist', face: 'joy', spring: 'bouncy'},
						{at: tEnd - 4, pose: 'relaxed', face: 'happy'},
					]}
				/>
			</Camera>
			<Sfx at={tPayStart + 6} name="whoosh-soft" volume={0.4} />
			<Sfx at={tPayStart + 26} name="cash" volume={0.5} />
			<Sfx at={tCar - 2} name="whoosh" volume={0.4} />
			<Sfx at={tCar + 12} name="thud" volume={0.6} />
			<Sfx at={tCar + 10} name="paper" volume={0.4} />
			<Sfx at={tFive - 2} name="pop" volume={0.4} />
			{[0, 1, 2].map((i) => (
				<Sfx key={i} at={tSaved + 16 + i * 6} name="coin" volume={0.3} />
			))}
			<Sfx at={tStamp} name="stamp" volume={0.6} />
			<Sfx at={tMore - 2} name="chime" volume={0.35} />
		</AbsoluteFill>
	);
};
