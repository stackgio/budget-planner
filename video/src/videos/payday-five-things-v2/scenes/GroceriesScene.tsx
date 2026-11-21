import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {DeskSurface, deskColors, deskShadow, ThermalReceipt} from '../../../story/components/Desk';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {C, Chip, G, StepHeader} from '../kit';

const Pump: React.FC<{s: number}> = ({s}) => (
	<svg width={44 * s} height={44 * s} viewBox="0 0 44 44">
		<rect x={6} y={6} width={20} height={34} rx={3} fill={deskColors.ink} />
		<rect x={10} y={10} width={12} height={9} rx={1.5} fill={deskColors.paper} />
		<path d="M26 14 h6 l5 6 v14 a3 3 0 0 1 -6 0 v-8 h-5" fill="none" stroke={deskColors.ink} strokeWidth={3} strokeLinejoin="round" />
	</svg>
);
const Basket: React.FC<{s: number}> = ({s}) => (
	<svg width={46 * s} height={44 * s} viewBox="0 0 46 44">
		<path d="M4 16 h38 l-5 22 h-28 z" fill={deskColors.ink} />
		<path d="M13 16 l7 -11 M33 16 l-7 -11" stroke={deskColors.ink} strokeWidth={3.5} strokeLinecap="round" />
	</svg>
);

const GAS_ROWS = ['PUMP', 'GALLONS', 'PRICE / GAL', 'TOTAL'];
const GROC_ROWS = ['PRODUCE', 'DAIRY', 'BREAD', 'HOUSEHOLD', 'TOTAL'];

// pair layout (after "Look at what you spent last time")
const PAIR = {gas: {x: 80, y: 470, w: 420, rot: -3}, groc: {x: 560, y: 450, w: 420, rot: 2.5}};
const ROW = {x: 72, y: 1110, w: 888, h: 170};

/**
 * 2 · GAS + GROCERIES — where the estimate comes from.
 * Two tight redacted inserts (fuel, then groceries) → the pair under one
 * LAST PAY PERIOD label → both categories carried into one THIS PAYCHECK row.
 */
export const GroceriesScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tTwo = cue('L5', 'Two');
	const tGas = cue('L5', 'gas');
	const tGroc = cue('L5', 'groceries');
	const tLook = cue('L6', 'Look');
	const tNum = cue('L7', 'a');

	const shot = frame < tGroc - 3 ? 'gas' : frame < tLook - 3 ? 'groc' : 'pair';
	const lastLbl = sp(frame, fps, tLook + 2, 'snappy');
	const rowIn = sp(frame, fps, tNum - 8, 'snappy');
	const carry = kf(frame, [tNum, tNum + 20], [0, 1], E.inOut);
	const carry2 = kf(frame, [tNum + 4, tNum + 24], [0, 1], E.inOut);
	const field = sp(frame, fps, tNum + 26, 'snappy');
	const gasTag = sp(frame, fps, Math.min(tGas, 4), 'snappy');
	const grocTag = sp(frame, fps, tGroc - 2, 'snappy');
	// a slow drift in the inserts so they feel shot, not placed
	const drift = (start: number) => kf(frame, [start, start + 60], [0, 1], E.out);

	const gasFrom = {x: PAIR.gas.x + 30, y: PAIR.gas.y - 18};
	const grocFrom = {x: PAIR.groc.x + 30, y: PAIR.groc.y - 18};
	const gasTo = {x: ROW.x + 36, y: ROW.y + 92};
	const grocTo = {x: ROW.x + 196, y: ROW.y + 92};
	const [gx, gy] = arc(carry, [gasFrom.x, gasFrom.y], [gasTo.x, gasTo.y], 40);
	const [cx, cy] = arc(carry2, [grocFrom.x, grocFrom.y], [grocTo.x, grocTo.y], 40);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<DeskSurface />

			{shot === 'gas' && (
				<>
					<ThermalReceipt w={700} title="FUEL" icon={<Pump s={1.6} />} rows={GAS_ROWS} rot={4 - drift(0) * 1.2} style={{left: 190 - drift(0) * 14, top: 400}} />
					<Chip text="GAS" tone="green" size={40} style={{left: 110, top: 318, transform: `scale(${0.6 + 0.4 * gasTag}) rotate(-3deg)`, opacity: Math.min(1, gasTag * 2)}} />
				</>
			)}
			{shot === 'groc' && (
				<>
					<ThermalReceipt w={700} title="GROCERY" icon={<Basket s={1.6} />} rows={GROC_ROWS} rot={-3 + drift(tGroc) * 1.2} style={{left: 170 + drift(tGroc) * 14, top: 380}} />
					<Chip text="GROCERIES" tone="green" size={40} style={{left: 100, top: 300, transform: `scale(${0.6 + 0.4 * grocTag}) rotate(-3deg)`, opacity: Math.min(1, grocTag * 2)}} />
				</>
			)}
			{shot === 'pair' && (
				<>
					<ThermalReceipt w={PAIR.gas.w} title="FUEL" icon={<Pump s={0.95} />} rows={GAS_ROWS} rot={PAIR.gas.rot} style={{left: PAIR.gas.x, top: PAIR.gas.y}} />
					<ThermalReceipt w={PAIR.groc.w} title="GROCERY" icon={<Basket s={0.95} />} rows={GROC_ROWS} rot={PAIR.groc.rot} style={{left: PAIR.groc.x, top: PAIR.groc.y}} />
					{/* one label over the pair */}
					<div style={{position: 'absolute', left: 90, top: 352, width: 880, opacity: Math.min(1, lastLbl * 2), transform: `translateY(${(1 - lastLbl) * -16}px)`}}>
						<svg width={880} height={40} style={{position: 'absolute', left: 0, top: 46}}>
							<path d="M 6 36 L 6 10 L 874 10 L 874 36" fill="none" stroke={C.black} strokeWidth={6} strokeLinejoin="round" />
						</svg>
						<div style={{display: 'flex', justifyContent: 'center'}}>
							<div style={{background: C.black, color: C.white, fontSize: 36, fontWeight: 900, letterSpacing: 4, padding: '12px 26px', borderRadius: 14}}>LAST PAY PERIOD</div>
						</div>
					</div>
				</>
			)}

			{/* THIS PAYCHECK budget row */}
			{shot === 'pair' && (
				<div
					style={{
						position: 'absolute',
						left: ROW.x,
						top: ROW.y,
						width: ROW.w,
						height: ROW.h,
						borderRadius: 24,
						background: C.black,
						boxShadow: deskShadow(0.2),
						transform: `translateY(${(1 - rowIn) * 40}px)`,
						opacity: Math.min(1, rowIn * 2),
					}}
				>
					<div style={{position: 'absolute', left: 36, top: 22, fontSize: 30, fontWeight: 900, letterSpacing: 4, color: C.grey}}>THIS PAYCHECK</div>
					<div
						style={{
							position: 'absolute',
							right: 32,
							top: 70,
							height: 70,
							padding: '0 26px',
							borderRadius: 14,
							border: `3px solid ${C.green}`,
							display: 'flex',
							alignItems: 'center',
							fontSize: 34,
							fontWeight: 900,
							letterSpacing: 2,
							color: C.green,
							opacity: Math.min(1, field * 2),
							transform: `scale(${0.8 + 0.2 * field})`,
						}}
					>
						≈ LAST TIME
					</div>
				</div>
			)}
			{shot === 'pair' && (
				<>
					<Chip text="GAS" tone="green" size={34} style={{left: gx, top: gy}} />
					<Chip text="GROCERIES" tone="green" size={34} style={{left: cx, top: cy}} />
				</>
			)}

			<StepHeader n={2} text={<>GAS <G>+</G> GROCERIES</>} at={tTwo} />
			<Sfx at={tGroc - 3} name="paper" volume={0.25} />
			<Sfx at={tNum + 22} name="click" volume={0.3} />
		</AbsoluteFill>
	);
};
