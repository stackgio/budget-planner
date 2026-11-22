import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {AccountCard, CarKeys, desk, DeskSurface, RepairEstimate} from '../../../story/components/Desk';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {BELOW, C, CARD} from '../layout';

const AMOUNT = `$${FACTS.carFund.value}`;

const Title: React.FC<{lines: string[]; p: number}> = ({lines, p}) => (
	<div style={{position: 'absolute', left: 40, top: 44, right: 30, fontSize: 64, fontWeight: 900, letterSpacing: -1.5, lineHeight: 1.0, color: C.ink}}>
		{lines.map((l, i) => {
			const q = Math.max(0, Math.min(1, p * 1.6 - i * 0.5));
			return (
				<div key={l} style={{overflow: 'hidden', height: 66}}>
					<div style={{transform: `translateY(${(1 - E.out(q)) * 70}px)`}}>{l}</div>
				</div>
			);
		})}
	</div>
);

/** "$500" + "EXAMPLE" inside a card. `pulse` gives the brief "same amount" emphasis. */
const Amount: React.FC<{p: number; pulse: number}> = ({p, pulse}) => (
	<>
		<div style={{position: 'absolute', left: 40, top: 236, fontSize: 26, fontWeight: 800, letterSpacing: 4, color: C.muted, opacity: p}}>EXAMPLE</div>
		<div style={{position: 'absolute', left: 40, right: 30, top: 214, height: 2, background: desk.hair}} />
		<div
			style={{
				position: 'absolute',
				left: 36,
				top: 276,
				fontSize: 132,
				fontWeight: 900,
				letterSpacing: -4,
				color: C.ink,
				fontVariantNumeric: 'tabular-nums',
				opacity: Math.min(1, p * 1.4),
				transform: `translateY(${(1 - p) * -46}px) scale(${1 + pulse * 0.06})`,
				transformOrigin: 'left center',
			}}
		>
			{AMOUNT}
			<div style={{position: 'absolute', left: 4, bottom: 6, height: 8, width: '100%', background: C.ink, transform: `scaleX(${pulse > 0 ? 1 : 0})`, transformOrigin: 'left', opacity: pulse}} />
		</div>
	</>
);

/**
 * SAVINGS — the two account cards, the $500 car fund in both, and interest as
 * "money the bank pays you". Viewer learns: same money, the high-yield card usually earns more.
 */
export const SavingsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();

	// cues
	const tRight = cue('L2', undefined, -0.2);
	const tAlign = cue('L3', "What's", -0.05);
	const tCut = cue('L4', undefined, -0.12); // hard cut to keys + estimate
	const tFive = cue('L4', 'five');
	const tCar = cue('L4', 'car');
	const tBack = cue('L5', undefined, -0.12); // hard cut back to the cards
	const tPays = cue('L6', 'bank');
	const tInterest = cue('L7', 'interest', -0.05);
	const tUsually = cue('L8', 'usually', -0.05);
	const tSame = cue('L9', 'same', -0.05);
	const tEarn = cue('L9', 'earn', -0.05);

	const inKeys = frame >= tCut && frame < tBack;

	// --- cards (opening) ---
	const align = sp(frame, fps, tAlign, 'smooth');
	const rIn = sp(frame, fps, tRight, 'heavy');
	const lRot = mix(-2.6, 0, align);
	const lDy = mix(26, 0, align);
	const rRot = mix(mix(9, 2.4, rIn), 0, align);
	const rDx = (1 - rIn) * 760;
	const rDy = mix(mix(-60, -22, rIn), 0, align);
	const lTitle = 1; // readable on frame 0
	const rTitle = prog(frame, tRight + 6, 14);

	// --- $500 lands in both cards after the cutaway ---
	// the note dissolves as the same $500 drops into each card (left, then right)
	const amtL = sp(frame, fps, tBack + 2, 'snappy');
	const amtR = sp(frame, fps, tBack + 7, 'snappy');
	const chipFade = kf(frame, [tBack, tBack + 10], [1, 0]);

	// --- interest label + high-yield highlight ---
	const interest = sp(frame, fps, tInterest, 'snappy');
	const hy = sp(frame, fps, tUsually, 'smooth');
	const samePulse = kf(frame, [tSame, tSame + 6, tSame + 24, tSame + 34], [0, 1, 1, 0]);
	const earnPulse = kf(frame, [tEarn, tEarn + 5, tEarn + 14], [0, 1, 0]);

	// gentle live-camera settle on the hold (no constant zoom)
	const camKeys = [
		{at: 0, zoom: 1.0},
		{at: tBack + 20, zoom: 1.0},
		{at: tInterest - 4, zoom: 1.025, x: 540, y: 880},
		{at: tUsually + 20, zoom: 1.025, x: 540, y: 880},
		{at: tUsually + 50, zoom: 1.0},
	];

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<DeskSurface />
			<Camera keys={camKeys}>
				{/* LEFT — regular savings */}
				<AccountCard x={CARD.lx} y={CARD.y + lDy} w={CARD.w} h={CARD.h} rot={lRot}>
					<Title lines={['Regular', 'savings']} p={lTitle} />
					<Amount p={amtL} pulse={samePulse} />
				</AccountCard>
				{/* RIGHT — high-yield savings */}
				<AccountCard x={CARD.rx + rDx} y={CARD.y + rDy} w={CARD.w} h={CARD.h} rot={rRot} highlight={hy} lift={hy * 0.5}>
					<Title lines={['High-yield', 'savings']} p={rTitle} />
					<Amount p={amtR} pulse={samePulse} />
					<div
						style={{
							position: 'absolute',
							left: 30,
							right: 30,
							top: 470,
							padding: '20px 22px',
							borderRadius: 18,
							background: C.green,
							color: '#fff',
							fontSize: 38,
							fontWeight: 900,
							lineHeight: 1.08,
							letterSpacing: -0.5,
							opacity: hy,
							transform: `translateY(${(1 - hy) * 24}px) scale(${1 + earnPulse * 0.05})`,
						}}
					>
						Usually earns more interest
					</div>
				</AccountCard>

				{frame >= tBack && chipFade > 0 && <MoneyNote x={110} y={1010} p={1} style={{opacity: chipFade}} hideAmount />}

				{/* interest = money the bank pays you */}
				<div style={{position: 'absolute', left: BELOW.left, right: 1080 - BELOW.right, top: BELOW.top + 20, opacity: interest, transform: `translateY(${(1 - interest) * 30}px)`}}>
					<div style={{height: 26, borderLeft: `4px solid ${C.ink}`, borderRight: `4px solid ${C.ink}`, borderTop: `4px solid ${C.ink}`, margin: '0 150px', transform: 'scaleY(-1)', opacity: 0.85}} />
					<div style={{textAlign: 'center', marginTop: 26, fontSize: 30, fontWeight: 800, letterSpacing: 5, color: C.greenDeep}}>INTEREST</div>
					<div style={{textAlign: 'center', marginTop: 8, fontSize: 64, fontWeight: 900, letterSpacing: -1.5, color: C.ink}}>Money the bank pays you</div>
				</div>
			</Camera>

			{inKeys && <KeysShot local={frame - tCut} tFive={tFive - tCut} tCar={tCar - tCut} />}

			<Sfx at={tRight} name="paper" volume={0.45} />
			<Sfx at={tCut + 2} name="keys" volume={0.5} />
			<Sfx at={tBack + 4} name="cash" volume={0.3} />
			<Sfx at={tInterest + 2} name="click" volume={0.35} />
			<Sfx at={tUsually + 2} name="pop" volume={0.25} />
		</AbsoluteFill>
	);
};

/** The "$500 set aside" note (example). */
const MoneyNote: React.FC<{x: number; y: number; p: number; style?: React.CSSProperties; hideAmount?: boolean}> = ({x, y, p, style, hideAmount}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y,
			width: 400,
			height: 310,
			borderRadius: 22,
			background: '#fff',
			boxShadow: desk.shadow(0.4),
			transform: `rotate(-2deg) scale(${mix(0.9, 1, p)})`,
			opacity: p,
			...style,
		}}
	>
		<div style={{position: 'absolute', left: 36, top: 34, fontSize: 26, fontWeight: 800, letterSpacing: 4, color: C.muted}}>EXAMPLE</div>
		<div style={{position: 'absolute', left: 30, top: 74, fontSize: 150, fontWeight: 900, letterSpacing: -5, color: C.ink, opacity: hideAmount ? 0 : 1, lineHeight: 1.05}}>{AMOUNT}</div>
		<div style={{position: 'absolute', left: 36, top: 236, fontSize: 40, fontWeight: 800, color: C.greenDeep}}>set aside</div>
	</div>
);

/** Close-up insert: keys dropped on a repair estimate; the $500 note lands on "five hundred". */
const KeysShot: React.FC<{local: number; tFive: number; tCar: number}> = ({local, tFive, tCar}) => {
	const {fps} = useVideoConfig();
	const drop = sp(local, fps, 0, 'heavy');
	const note = sp(local, fps, tFive - 2, 'snappy');
	const mark = prog(local, tCar, 12);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<Camera keys={[{at: 0, zoom: 1.04, x: 540, y: 880}, {at: 100, zoom: 1.1, x: 560, y: 860}]}>
				<DeskSurface seed={23} />
				<RepairEstimate x={150} y={190} w={700} rot={-4} mark={mark} />
				<CarKeys x={mix(700, 620, drop)} y={mix(760, 860, drop)} w={mix(720, 640, drop)} rot={mix(30, 18, drop)} shadowLift={1 - drop} />
			</Camera>
			{local >= tFive - 2 && <MoneyNote x={110} y={1010} p={note} />}
		</AbsoluteFill>
	);
};
