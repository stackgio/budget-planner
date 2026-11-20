import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {DeskSurface, DrawCheck, TopDownPhone} from '../../../story/components/Desk';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {C, CaptionPlate, Chip, ExampleTag, G, StepHeader} from '../kit';

// transfer view in phone-screen coordinates (screen ≈ 390 × 830 at phone w=420)
const SW = 390;
const CARD_H = 150;
const CHK_Y = 150;
const SAV_Y = 470;

const AccountCard: React.FC<{y: number; label: string; glow: number; children?: React.ReactNode}> = ({y, label, glow, children}) => (
	<div
		style={{
			position: 'absolute',
			left: 20,
			width: SW - 40,
			top: y,
			height: CARD_H,
			borderRadius: 22,
			background: '#23262C',
			border: `3px solid ${glow > 0.01 ? `rgba(44,212,122,${glow})` : '#33373F'}`,
		}}
	>
		<div style={{position: 'absolute', left: 22, top: 18, fontSize: 22, fontWeight: 900, letterSpacing: 3, color: glow > 0.5 ? C.green : C.white}}>{label}</div>
		{children}
	</div>
);

/** The transfer: labels only — no balances, no account numbers, no bank branding. */
const TransferView: React.FC<{amount: number; move: number; landed: number; savGlow: number; tag?: boolean}> = ({amount, move, landed, savGlow, tag = true}) => {
	const from: [number, number] = [SW / 2, CHK_Y + 92];
	const to: [number, number] = [SW / 2, SAV_Y + 92];
	const [ax, ay] = arc(move, from, to, -70);
	return (
		<div style={{position: 'absolute', left: 0, top: 0, width: SW, height: 830, fontFamily: story.font}}>
			<div style={{position: 'absolute', left: 22, top: 70, fontSize: 22, fontWeight: 800, letterSpacing: 3, color: C.grey}}>MOVE MONEY</div>
			<AccountCard y={CHK_Y} label="CHECKING" glow={0} />
			{/* direction */}
			<svg width={SW} height={SAV_Y - CHK_Y - CARD_H} style={{position: 'absolute', left: 0, top: CHK_Y + CARD_H}}>
				<path d={`M ${SW / 2} 20 L ${SW / 2} 140 M ${SW / 2 - 18} 122 L ${SW / 2} 142 L ${SW / 2 + 18} 122`} stroke="#4A4E56" strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<AccountCard y={SAV_Y} label="SAVINGS" glow={savGlow}>
				<DrawCheck size={42} progress={landed} style={{position: 'absolute', right: 18, top: 12}} />
			</AccountCard>
			{amount > 0 && (
				<div style={{position: 'absolute', left: ax, top: ay, transform: `translate(-50%, -50%) scale(${(0.5 + 0.5 * amount) * (1 + 0.08 * Math.sin(Math.PI * move))})`, opacity: Math.min(1, amount * 2), display: 'flex', alignItems: 'center', gap: 10}}>
					<div style={{fontSize: 84, fontWeight: 900, color: C.green, letterSpacing: -3, lineHeight: 1}}>${FACTS.savingsTransfer.value}</div>
					{tag && <ExampleTag size={15} />}
				</div>
			)}
		</div>
	);
};

/**
 * 3 · SAVINGS — the $20 transfer is the hero shot.
 * Wide: phone on the desk (CHECKING / SAVINGS). On "20" cut in tight: $20 +
 * EXAMPLE lands in CHECKING; on "transfer" it travels to SAVINGS in one arc and
 * holds. On "still" cut back wide: the money is in savings, checking is
 * "easy to spend".
 */
export const SavingsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tThree = cue('L8', 'Three');
	const tSavings = cue('L8', 'savings');
	const t20 = cue('L9', '20');
	const tTransfer = cue('L9', 'transfer');
	const tStill = cue('L10', 'still');
	const tChecking = cue('L10', 'checking');

	const shot = frame < t20 - 2 ? 'wideA' : frame < tStill - 2 ? 'tight' : 'wideB';
	const amount = sp(frame, fps, t20 - 1, 'bouncy');
	const move = kf(frame, [tTransfer, tTransfer + 20], [0, 1], E.inOut);
	const landed = kf(frame, [tTransfer + 18, tTransfer + 32], [0, 1], E.out);
	const savGlowA = kf(frame, [tSavings, tSavings + 8], [0, 1], E.out);
	const spend = sp(frame, fps, tChecking, 'snappy');
	const settle = kf(frame, [0, 14], [1, 0], E.out);

	const wide = (state: 'before' | 'after') => (
		<TopDownPhone w={420} rot={3} lift={0} style={{left: 330, top: 360 + settle * 10}}>
			<TransferView amount={state === 'after' ? 1 : 0} move={1} landed={state === 'after' ? 1 : 0} savGlow={state === 'after' ? 1 : savGlowA} tag={false} />
		</TopDownPhone>
	);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<DeskSurface />
			{shot === 'wideA' && wide('before')}
			{shot === 'tight' && (
				// close crop on the same phone (same screen layout, 2× scale)
				<TopDownPhone w={840} rot={1} style={{left: 120, top: 330 - CHK_Y * 2 + 10}}>
					<div style={{position: 'absolute', left: 0, top: 0, transform: 'scale(2)', transformOrigin: '0 0'}}>
						<TransferView amount={amount} move={move} landed={landed} savGlow={landed} />
					</div>
				</TopDownPhone>
			)}
			{shot === 'wideB' && (
				<>
					{wide('after')}
					{/* tag outside the phone so it stays readable at this framing */}
					<ExampleTag size={26} style={{position: 'absolute', left: 770, top: 905, transform: 'rotate(3deg)'}} />
					<Chip text="EASY TO SPEND" tone="white" size={30} style={{left: 64, top: 610, transform: `scale(${0.6 + 0.4 * spend})`, opacity: Math.min(1, spend * 2)}} />
				</>
			)}

			<StepHeader n={3} text={<>SAVE ON <G>PAYDAY</G></>} at={tThree} />
			<CaptionPlate />
			<Sfx at={t20 - 2} name="click" volume={0.25} />
			<Sfx at={tTransfer + 20} name="chime" volume={0.3} />
		</AbsoluteFill>
	);
};
