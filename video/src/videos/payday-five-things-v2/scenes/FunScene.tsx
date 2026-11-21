import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {DeskSurface, deskColors, deskShadow, PenPath, RedactBar, ThermalReceipt} from '../../../story/components/Desk';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {C, Chip, ExampleTag, G, StepHeader} from '../kit';

/** Top-down takeout bag: folded paper, plain sticker, stapled receipt with the amount hidden. */
const TakeoutBag: React.FC<{w: number; rot?: number; style?: React.CSSProperties}> = ({w, rot = 0, style}) => {
	const s = w / 500;
	return (
		<div style={{position: 'absolute', width: w, height: 600 * s, transform: `rotate(${rot}deg)`, ...style}}>
			<div style={{position: 'absolute', inset: 0, borderRadius: 8 * s, background: 'linear-gradient(160deg,#CDBB9C 0%,#B9A684 100%)', boxShadow: deskShadow(0.1)}} />
			{/* folded top */}
			<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 110 * s, borderRadius: `${8 * s}px ${8 * s}px 0 0`, background: 'linear-gradient(180deg,#D8C7A8,#C3B08F)', borderBottom: `${4 * s}px solid rgba(90,70,40,0.25)`}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 130 * s, height: 3 * s, background: 'rgba(90,70,40,0.15)'}} />
			{/* plain sticker */}
			<div style={{position: 'absolute', left: 60 * s, top: 250 * s, width: 140 * s, height: 140 * s, borderRadius: '50%', background: deskColors.paper, border: `${5 * s}px solid ${deskColors.ink}`}} />
			{/* stapled receipt, amount hidden */}
			<div style={{position: 'absolute', left: 250 * s, top: 70 * s, width: 200 * s, padding: 18 * s, background: deskColors.paper, transform: 'rotate(6deg)', boxShadow: '4px 8px 12px rgba(40,34,24,0.25)', fontFamily: story.font}}>
				<div style={{height: 10 * s, width: 50 * s, background: '#9A9A9A', margin: `0 auto ${14 * s}px`}} />
				{[0, 1, 2].map((i) => (
					<div key={i} style={{display: 'flex', justifyContent: 'space-between', margin: `${10 * s}px 0`}}>
						<div style={{width: 80 * s, height: 10 * s, background: deskColors.paperLine}} />
						<RedactBar w={50 * s} h={14 * s} />
					</div>
				))}
				<div style={{display: 'flex', justifyContent: 'space-between', marginTop: 18 * s, alignItems: 'center'}}>
					<div style={{fontSize: 22 * s, fontWeight: 900, color: deskColors.ink}}>TOTAL</div>
					<RedactBar w={70 * s} h={20 * s} />
				</div>
			</div>
		</div>
	);
};

const CHECKOUT_ROWS = ['TICKETS', 'SNACKS', 'TOTAL'];

/** "$80 TOTAL" pinned limit — the same pill across every shot of this beat. */
const LimitPill: React.FC<{p: number}> = ({p}) => (
	<div
		style={{
			position: 'absolute',
			left: 540,
			top: 420,
			transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * p})`,
			opacity: Math.min(1, p * 2),
			display: 'flex',
			alignItems: 'center',
			gap: 18,
			background: C.black,
			borderRadius: 26,
			padding: '14px 30px 14px 34px',
			boxShadow: '0 14px 30px rgba(0,0,0,0.3)',
			whiteSpace: 'nowrap',
		}}
	>
		<div style={{fontSize: 92, fontWeight: 900, color: C.green, letterSpacing: -3, lineHeight: 1}}>${FACTS.funMoney.value}</div>
		<div style={{fontSize: 52, fontWeight: 900, color: C.white, letterSpacing: 1}}>TOTAL</div>
		<ExampleTag size={24} style={{marginLeft: 6, border: 'none'}} />
	</div>
);

/**
 * 5 · FUN MONEY — $80 is the total, shared.
 * Envelope → "$80 TOTAL · EXAMPLE" pinned on "80" → takeout insert on
 * "eating out" → checkout insert on "hanging out" (pill stays) → both labels
 * gathered under one bracket → "UNTIL NEXT PAYCHECK".
 */
export const FunScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tFive = cue('L14', 'Five');
	const tLimit = cue('L14', 'limit');
	const t80 = cue('L15', '80');
	const tEat = cue('L15', 'eating');
	const tHang = cue('L15', 'hanging');
	const tWhat = cue('L15', 'whatever');
	const tUntil = cue('L15', 'until');

	const shot = frame < tEat - 2 ? 'envelope' : frame < tHang - 2 ? 'eat' : frame < tWhat - 2 ? 'hang' : 'together';
	const pill = sp(frame, fps, t80 - 1, 'bouncy');
	const under = kf(frame, [tLimit, tLimit + 12], [0, 1], E.out);
	const gather = kf(frame, [tWhat - 2, tWhat + 14], [0, 1], E.inOut);
	const bracket = kf(frame, [tWhat + 6, tWhat + 20], [0, 1], E.out);
	const until = sp(frame, fps, tUntil, 'snappy');
	const tagIn = (t: number) => sp(frame, fps, t, 'snappy');
	const drift = (start: number) => kf(frame, [start, start + 40], [0, 1], E.out);

	// label positions: on their insert → gathered under the bracket
	const eatPos = {x: mix(150, 205, gather), y: mix(560, 640, gather)};
	const hangPos = {x: mix(150, 585, gather), y: mix(560, 640, gather)};

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<DeskSurface />

			{shot === 'envelope' && (
				<div style={{position: 'absolute', left: 150, top: 600, width: 780, height: 470, transform: 'rotate(-3deg)'}}>
					<div style={{position: 'absolute', inset: 0, background: deskColors.paper, borderRadius: 10, boxShadow: deskShadow(0)}} />
					<svg width={780} height={470} style={{position: 'absolute', inset: 0}}>
						<path d="M 0 0 L 390 250 L 780 0" fill="none" stroke={deskColors.paperLine} strokeWidth={4} />
					</svg>
					<div style={{position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', fontSize: 84, fontWeight: 800, fontStyle: 'italic', color: deskColors.ink, letterSpacing: -1}}>FUN MONEY</div>
					<PenPath d="M 190 400 C 330 410, 470 392, 600 402" progress={under} color={deskColors.pen} stroke={9} />
				</div>
			)}
			{shot === 'eat' && <TakeoutBag w={600} rot={-4 + drift(tEat) * 1.5} style={{left: 240, top: 580}} />}
			{shot === 'hang' && <ThermalReceipt w={600} title="CHECKOUT" rows={CHECKOUT_ROWS} rot={3 - drift(tHang)} style={{left: 250, top: 650}} />}
			{shot === 'together' && (
				<>
					<TakeoutBag w={300} rot={-4} style={{left: 140, top: 760}} />
					<ThermalReceipt w={310} title="CHECKOUT" rows={CHECKOUT_ROWS} rot={3} style={{left: 590, top: 740}} />
					{/* one bracket: the $80 covers both */}
					<svg width={880} height={80} style={{position: 'absolute', left: 100, top: 498, opacity: bracket}}>
						<path d="M 8 72 L 8 30 L 872 30 L 872 72 M 440 30 L 440 4" fill="none" stroke={C.black} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - bracket} />
					</svg>
				</>
			)}

			{(shot === 'eat' || shot === 'together') && (
				<Chip text="EATING OUT" tone="green" size={40} style={{left: eatPos.x, top: eatPos.y, transform: `scale(${shot === 'eat' ? 0.6 + 0.4 * tagIn(tEat) : 1})`}} />
			)}
			{(shot === 'hang' || shot === 'together') && (
				<Chip text="HANGING OUT" tone="green" size={40} style={{left: hangPos.x, top: hangPos.y, transform: `scale(${shot === 'hang' ? 0.6 + 0.4 * tagIn(tHang) : 1})`}} />
			)}

			{shot === 'together' && (
				<Chip
					text="UNTIL NEXT PAYCHECK"
					tone="black"
					size={44}
					style={{left: 540, top: 1230, transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * until})`, opacity: Math.min(1, until * 2)}}
				/>
			)}

			<LimitPill p={pill} />

			<StepHeader n={5} text={<>FUN MONEY <G>TILL PAYDAY</G></>} at={tFive} />
			<Sfx at={t80} name="click" volume={0.25} />
			<Sfx at={tUntil} name="tick" volume={0.25} />
		</AbsoluteFill>
	);
};
