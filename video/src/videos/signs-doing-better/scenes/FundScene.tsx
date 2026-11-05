import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Bill, SavingsJar} from '../../../story/components/Money';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, shake, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS, fundAfterRepair, MILESTONES} from '../facts';
import {Footnote} from '../ui';

const BAR = {x: 92, y: 640, w: 860, h: 40};
const GOAL = FACTS.fundGoal.value;
const BILLC = {x: 350, y: 830, w: 330, h: 270};
const JAR = {x: 830, y: story.ground - 6, w: 270};

/**
 * 03 — EMERGENCY FUND. Learn: $100, $250, $500 are real progress. Feel: the
 * gut-drop of a $300 bill, then relief when the jar (not a card) pays it.
 */
export const FundScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t0 = cue('L8');
	const tBuilding = cue('L8', 'building');
	const tEmergency = cue('L8', 'emergency');
	const tFund = cue('L8', 'fund');
	const tEven = cue('L8', 'even');
	const tThousand = cue('L8', 'thousand');
	const tUnexpected = cue('L9', 'unexpected');
	const tBill = cue('L9', 'bill');
	const tFrom = cue('L9', 'from');
	const tDebt = cue('L9', 'debt');

	// $0 → $100 → $250 → $500, then the repair takes $300
	const steps: [number, number][] = [
		[tBuilding, MILESTONES[1]],
		[tFund, MILESTONES[2]],
		[tEven + 4, MILESTONES[3]],
	];
	let saved = 0;
	for (const [t, v] of steps) saved = mix(saved, v, prog(frame, t, 14, E.out));
	const payT = prog(frame, tFrom - 2, 26, E.inOut);
	saved = mix(saved, fundAfterRepair, payT);
	const fillW = (saved / GOAL) * BAR.w;
	const goalP = sp(frame, fps, tThousand, 'bouncy');

	const billIn = sp(frame, fps, tUnexpected - 4, 'heavy');
	const hit = shake(frame, tUnexpected + 4, 12, 16);
	const stamp = sp(frame, fps, tDebt - 2, 'heavy');
	const safe = sp(frame, fps, tDebt + 8, 'bouncy');
	const jarIn = sp(frame, fps, tBuilding - 4, 'bouncy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={520} lightY={900} floorY={story.ground} />
			<ChapterTag n="03" label="EMERGENCY FUND" at={t0 - 4} palette={P} style={{left: story.safe.left, top: story.safe.top + 10}} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 320}}>
				<KineticText text="SMALL AMOUNTS COUNT" at={tEven - 2} fontSize={100} color={P.ink} colors={{count: P.accent}} />
			</div>
			<Camera keys={[{at: 0, zoom: 1}, {at: tUnexpected, zoom: 1}, {at: tUnexpected + 16, zoom: 1.04, x: 600, y: 1000, ease: E.out}, {at: tDebt + 20, zoom: 1.04, x: 600, y: 1000}]} shakeX={hit.x} shakeY={hit.y}>
				{/* milestone bar */}
				<div style={{position: 'absolute', left: BAR.x, top: BAR.y, width: BAR.w, height: BAR.h, borderRadius: BAR.h / 2, background: P.line}}>
					<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.max(fillW, 0), borderRadius: BAR.h / 2, background: `linear-gradient(90deg, ${P.accentDeep}, ${P.accent})`}} />
					{/* goal outline at $1,000 */}
					<div style={{position: 'absolute', right: -8, top: -8, bottom: -8, width: 22, borderRadius: 11, border: `4px dashed ${P.gold}`, opacity: goalP}} />
				</div>
				{MILESTONES.map((m, i) => {
					const x = BAR.x + (m / GOAL) * BAR.w;
					const reached = i > 0 && i < MILESTONES.length - 1 && frame >= steps[i - 1][0] + 8;
					const isGoal = m === GOAL;
					const align = i === 0 ? 'left' : isGoal ? 'right' : 'center';
					return (
						<div
							key={m}
							style={{
								position: 'absolute',
								left: align === 'left' ? x : align === 'right' ? x - 200 : x - 100,
								width: 200,
								textAlign: align,
								top: BAR.y + BAR.h + 14,
								fontSize: m === 100 || m === 0 ? 26 : 30,
								fontWeight: 900,
								color: isGoal ? P.gold : reached ? P.accent : P.muted,
							}}
						>
							{reached ? '✓ ' : ''}${m.toLocaleString('en-US')}
							{isGoal && <div style={{fontSize: 24, letterSpacing: 3, opacity: goalP}}>GOAL</div>}
						</div>
					);
				})}
				<Footnote at={tEven} style={{top: 760, left: BAR.x}}>
					Example amounts. The right fund size depends on your situation (CFPB).
				</Footnote>

				{/* the hypothetical bill */}
				{billIn > 0.001 && (
					<div
						style={{
							position: 'absolute',
							left: BILLC.x,
							top: BILLC.y,
							width: BILLC.w,
							height: BILLC.h,
							background: '#FFFFFF',
							borderRadius: 18,
							padding: '22px 26px',
							boxSizing: 'border-box',
							color: '#121316',
							boxShadow: `0 30px 60px ${P.shadow}`,
							transform: `translateY(${(1 - billIn) * -700}px) rotate(${mix(-20, -4, billIn)}deg)`,
						}}
					>
						<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 2}}>CAR REPAIR</div>
						<div style={{fontSize: 104, fontWeight: 900, color: P.danger, letterSpacing: -3, lineHeight: 1.05}}>${FACTS.repair.value}</div>
						<div style={{fontSize: 24, fontWeight: 900, letterSpacing: 3, color: '#857D6E'}}>HYPOTHETICAL</div>
						{/* PAID stamp */}
						<div
							style={{
								position: 'absolute',
								right: 18,
								bottom: 26,
								border: `6px solid ${P.accentDeep}`,
								color: P.accentDeep,
								borderRadius: 12,
								padding: '2px 14px',
								fontSize: 48,
								fontWeight: 900,
								letterSpacing: 3,
								opacity: Math.min(1, stamp * 1.6),
								transform: `rotate(-12deg) scale(${1 + (1 - Math.min(1, stamp)) * 1.4})`,
								background: 'rgba(255,255,255,0.85)',
							}}
						>
							PAID
						</div>
					</div>
				)}
				{/* outcome chip */}
				<div
					style={{
						position: 'absolute',
						left: BILLC.x,
						top: BILLC.y + BILLC.h + 30,
						background: P.accent,
						color: P.bg,
						borderRadius: 16,
						padding: '10px 20px',
						fontSize: 36,
						fontWeight: 900,
						letterSpacing: 1,
						opacity: Math.min(1, safe * 1.5),
						transform: `scale(${safe})`,
						transformOrigin: '0 50%',
					}}
				>
					✓ NO NEW DEBT
				</div>

				{/* jar */}
				{jarIn > 0.001 && (
					<SavingsJar
						w={JAR.w}
						palette={P}
						level={0.05 + 0.9 * (saved / GOAL)}
						label=""
						amount={`$${Math.round(saved)}`}
						style={{left: JAR.x, top: JAR.y, transform: `translate(-50%,-100%) scale(${jarIn})`, transformOrigin: '50% 100%'}}
					/>
				)}
				{/* money leaves the jar for the bill */}
				{[0, 1, 2].map((i) => {
					const f = prog(frame, tFrom - 2 + i * 6, 16, E.inOut);
					if (f <= 0 || f >= 1) return null;
					const [x, y] = arc(f, [JAR.x + (i - 1) * 24, JAR.y - 260], [BILLC.x + BILLC.w * 0.5, BILLC.y + BILLC.h * 0.55], 200);
					return <Bill key={i} w={130} value="100" style={{left: x, top: y, transform: `translate(-50%,-50%) rotate(${f * 280 + i * 30}deg) scale(${1 - 0.2 * f})`}} />;
				})}

				<Marcus
					x={200}
					y={story.ground}
					scale={1.02}
					facing={1}
					seed={6}
					onDark
					track={[
						{at: -10, pose: 'idle', face: 'focused'},
						{at: tEmergency, pose: 'present', face: 'happy', spring: 'snappy'},
						{at: tThousand - 4, pose: ['think', {head: 10}], face: 'curious'},
						{at: tUnexpected - 2, pose: 'shock', face: 'shock', spring: 'bouncy'},
						{at: tFrom - 2, pose: ['point', {head: -4}], face: 'determined', spring: 'snappy'},
						{at: tDebt + 6, pose: 'fist', face: 'joy', spring: 'bouncy'},
					]}
				/>
			</Camera>
			{steps.map(([t], i) => (
				<Sfx key={i} at={t + 4} name="coin" volume={0.3} />
			))}
			<Sfx at={tUnexpected - 4} name="whoosh" volume={0.35} />
			<Sfx at={tUnexpected + 4} name="thud" volume={0.5} />
			<Sfx at={tDebt - 2} name="stamp" volume={0.5} />
			<Sfx at={tDebt + 8} name="chime" volume={0.3} />
		</AbsoluteFill>
	);
};
