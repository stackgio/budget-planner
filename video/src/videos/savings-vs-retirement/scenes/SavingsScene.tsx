import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera, type CamKey} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {AccountCard, CarKeys, DebitCard, desk, Pen, RepairEstimate, StoneDesk} from '../../../story/components/Desk';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {CARD, Chip, CONTENT_CX, Kicker, Reveal, Slot} from './parts';

const money = (v: number) => `$${v.toLocaleString('en-US')}`;

/** One savings card's printed content. */
const SavingsFace: React.FC<{title: [string, string]; balanceAt: number; pulse: number; chip?: React.ReactNode}> = ({title, balanceAt, pulse, chip}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, balanceAt, 'bouncy');
	const shown = frame >= balanceAt;
	return (
		<div style={{position: 'absolute', inset: 0, padding: '34px 34px 0'}}>
			<Kicker>Account</Kicker>
			<div style={{marginTop: 12, fontSize: 52, fontWeight: 900, letterSpacing: -1.2, lineHeight: 1.0, color: desk.ink}}>
				{title[0]}
				<br />
				{title[1]}
			</div>
			<div style={{height: 3, background: desk.ink, marginTop: 26, opacity: 0.9}} />
			<div style={{marginTop: 22, display: 'flex', alignItems: 'center', gap: 12}}>
				<Kicker>Example balance</Kicker>
			</div>
			<div style={{position: 'relative', height: 140, marginTop: 6}}>
				{!shown && <Slot w={300} h={118} style={{position: 'absolute', top: 10}} />}
				{shown && (
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							fontSize: 128,
							fontWeight: 900,
							letterSpacing: -4,
							color: desk.ink,
							fontVariantNumeric: 'tabular-nums',
							transformOrigin: '0% 60%',
							transform: `scale(${(0.7 + 0.3 * p) * (1 + pulse * 0.06)})`,
							opacity: Math.min(1, p * 2),
						}}
					>
						{money(FACTS.emergencyFund.value)}
						<div style={{position: 'absolute', left: 4, bottom: -6, height: 8, borderRadius: 4, background: desk.green, width: `${pulse * 100}%`, opacity: pulse}} />
					</div>
				)}
			</div>
			<div style={{position: 'absolute', left: 34, right: 34, top: 438}}>{chip}</div>
		</div>
	);
};

/**
 * SAVINGS (L1–L9) — overhead stone desk. Two white account cards slide in on
 * "This is…", align on "What's the difference?". Cut to a close-up of car keys
 * landing beside a repair estimate, pull back as $500 lands on both cards.
 * "Interest" appears beneath the balances; the high-yield card goes green.
 */
export const SavingsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();

	// --- cues
	const tR = cue('L2', 'This', -0.12);
	const tAlign = cue('L3', 'What’s', -0.1);
	const tCut = cue('L4', 'Say', -0.14);
	const tKeysLand = tCut + 9;
	const tFive = cue('L4', 'five');
	const tPull = tFive - 10;
	const tCar = cue('L4', 'car');
	const tEither = cue('L5', 'Either');
	const tHold = cue('L5', 'hold');
	const tInterest = cue('L7', 'interest');
	const tRegPay = cue('L8', 'pay');
	const tUsually = cue('L8', 'usually');
	const tMore = cue('L8', 'more');
	const tRepair = cue('L9', 'surprise');
	const tSame = cue('L9', 'same');
	const tFive2 = cue('L9', 'five');
	const tEarn = cue('L9', 'earn');

	// --- card entrances (left card is already mostly in on frame 0)
	const pL = prog(frame, -9, 22, E.out);
	const pR = prog(frame, tR, 20, E.out);
	const pA = sp(frame, fps, tAlign, 'smooth');
	const lx = CARD.lx + mix(-430, 0, pL);
	const lrot = mix(-9, -2.2, pL) * (1 - pA);
	const ly = CARD.y + 16 * (1 - pA);
	const rx = CARD.rx + mix(620, 0, pR);
	const rrot = mix(11, 2.6, pR) * (1 - pA);
	const ry = CARD.y - 12 * (1 - pA);

	// --- after the cut: desk props
	const afterCut = frame >= tCut;
	const keysP = prog(frame, tCut, tKeysLand - tCut, E.in);
	const keysSettle = sp(frame, fps, tKeysLand, 'heavy');
	const jig = frame >= tCar ? Math.sin((frame - tCar) * 0.9) * Math.exp(-(frame - tCar) / 9) : 0;

	// --- balance pulses ("hold that money", "the same five hundred dollars")
	const pulse = (t: number, len = 30) => kf(frame, [t, t + 6, t + len, t + len + 10], [0, 1, 1, 0], E.inOut);
	const balPulse = Math.max(pulse(tHold, 22), pulse(tFive2, Math.max(24, tEarn - tFive2)));

	// --- high-yield highlight
	const hy = sp(frame, fps, tUsually, 'smooth');
	const earnPulse = kf(frame, [tEarn, tEarn + 6, tEarn + 18], [0, 1, 0]);

	// --- camera: hold framings, move with intent
	const overhead = {zoom: 1, x: 540, y: 960};
	const keys: CamKey[] = [
		{at: 0, ...overhead},
		{at: tAlign, ...overhead},
		{at: tAlign + 24, zoom: 1.035, x: CONTENT_CX + 20, y: 820},
		{at: tCut - 1, zoom: 1.035, x: CONTENT_CX + 20, y: 820},
		{at: tCut, zoom: 1.6, x: 440, y: 1170, ease: () => 1}, // hard cut to the close-up
		{at: tPull, zoom: 1.6, x: 440, y: 1170},
		{at: tPull + 18, ...overhead},
		{at: tCar - 2, ...overhead},
		{at: tCar + 16, zoom: 1.07, x: 520, y: 1040},
		{at: tEither - 2, zoom: 1.07, x: 520, y: 1040},
		{at: tEither + 16, ...overhead},
		{at: tRepair - 2, ...overhead},
		{at: tRepair + 16, zoom: 1.05, x: 520, y: 1060},
		{at: tSame - 6, zoom: 1.05, x: 520, y: 1060},
		{at: tSame + 10, ...overhead},
	];

	const bracket = prog(frame, tInterest - 4, 14);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<Camera keys={keys}>
				<StoneDesk seed={5} />

				{/* desk props */}
				{!afterCut && (
					<>
						<Pen x={120} y={1236} rot={-16} len={330} />
						<DebitCard x={640} y={1120} w={300} rot={7} />
					</>
				)}
				{afterCut && (
					<>
						<DebitCard x={850} y={1205} w={300} rot={14} />
						<RepairEstimate x={112} y={1026} w={420} h={378} rot={-3} />
						<CarKeys
							x={mix(470, 520, keysP)}
							y={mix(990, 1080, keysP) + (1 - keysSettle) * 0}
							scale={mix(1.22, 1, keysP)}
							rot={mix(-34, -12, keysP) + (keysP >= 1 ? (1 - keysSettle) * 4 : 0)}
							lift={1 - keysP}
							jiggle={jig}
						/>
					</>
				)}

				{/* account cards */}
				<AccountCard x={lx} y={ly} w={CARD.w} h={CARD.h} rot={lrot} lift={1 - pL}>
					<SavingsFace
						title={['REGULAR', 'SAVINGS']}
						balanceAt={tFive}
						pulse={balPulse}
						chip={
							<Reveal at={tRegPay}>
								<Chip tone="muted" size={28}>
									Can earn interest
								</Chip>
							</Reveal>
						}
					/>
				</AccountCard>
				<AccountCard x={rx} y={ry} w={CARD.w} h={CARD.h} rot={rrot} lift={1 - pR} highlight={hy}>
					<SavingsFace
						title={['HIGH-YIELD', 'SAVINGS']}
						balanceAt={tFive + 4}
						pulse={balPulse}
						chip={
							<Reveal at={tUsually + 8}>
								<div style={{transform: `scale(${1 + earnPulse * 0.06})`, transformOrigin: '0 50%'}}>
									<Chip tone="green" size={28}>
										Typically earns
										<br />
										more interest
									</Chip>
								</div>
							</Reveal>
						}
					/>
				</AccountCard>

				{/* "interest" directly beneath the balances, bracketing both cards */}
				{frame >= tInterest - 4 && (
					<svg width={1080} height={120} style={{position: 'absolute', left: 0, top: CARD.y + CARD.h + 4}}>
						<path
							d={`M ${CARD.lx + CARD.w / 2} 0 L ${CARD.lx + CARD.w / 2} 22 L ${CARD.rx + CARD.w / 2} 22 L ${CARD.rx + CARD.w / 2} 0`}
							fill="none"
							stroke={desk.ink}
							strokeWidth={4}
							strokeLinejoin="round"
							strokeDasharray={1200}
							strokeDashoffset={1200 * (1 - bracket)}
						/>
					</svg>
				)}
				<div style={{position: 'absolute', left: CARD.lx, width: CARD.rx + CARD.w - CARD.lx, top: CARD.y + CARD.h + 44, textAlign: 'center'}}>
					<Reveal at={tInterest}>
						<div style={{fontSize: 92, fontWeight: 900, letterSpacing: -2, lineHeight: 1, color: desk.ink}}>INTEREST</div>
					</Reveal>
					<Reveal at={tInterest + 9}>
						<div style={{fontSize: 36, fontWeight: 700, color: desk.body, marginTop: 10}}>Money the bank pays you</div>
					</Reveal>
				</div>
			</Camera>

			<Sfx at={0} name="card" volume={0.35} />
			<Sfx at={tR} name="card" volume={0.3} />
			<Sfx at={tKeysLand - 1} name="keys" volume={0.55} />
			<Sfx at={tFive + 1} name="pop" volume={0.22} />
			<Sfx at={tCar + 1} name="keys" volume={0.25} />
			<Sfx at={tInterest} name="tick" volume={0.3} />
			<Sfx at={tUsually + 2} name="chime" volume={0.22} />
			<Sfx at={tMore + 2} name="paper" volume={0.15} />
		</AbsoluteFill>
	);
};
