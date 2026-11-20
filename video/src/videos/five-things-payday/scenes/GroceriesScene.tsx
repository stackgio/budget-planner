import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {C, L, Label, Stage, StepHeading} from '../ui';

const CARD = {w: 430, h: 300, top: 640};
const LEFTS = [92, 558];
const BR = {x: 72, y: 980, w: 936, h: 370};
const IN = {s: 0.86, top: 1064, lefts: [150, 560]};

const GasIcon = () => (
	<svg width={84} height={84} viewBox="0 0 24 24">
		<path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h6A1.5 1.5 0 0 1 14 5.5V20M4 20h11M7 8h5M14 9h2l2.2 2.2V17a1.3 1.3 0 0 0 2.6 0V8.5L18 6" fill="none" stroke={C.ink} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);
const CartIcon = () => (
	<svg width={84} height={84} viewBox="0 0 24 24">
		<path d="M3 4h2.2l2.3 10.5h10.2L20 7.5H6.4" fill="none" stroke={C.ink} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
		<circle cx={9} cy={18.5} r={1.5} fill={C.ink} />
		<circle cx={16.5} cy={18.5} r={1.5} fill={C.ink} />
	</svg>
);

/** Spending card: dashed placeholder → filled card; `bars` reveals last period's receipt lines (no totals). */
const SpendCard: React.FC<{label: string; icon: React.ReactNode; fill: number; bars: number; budget: number; style?: React.CSSProperties}> = ({label, icon, fill, bars, budget, style}) => (
	<div
		style={{
			position: 'absolute',
			width: CARD.w,
			height: CARD.h,
			borderRadius: 28,
			boxSizing: 'border-box',
			border: `3px ${fill > 0.02 ? 'solid' : 'dashed'} ${budget > 0.5 ? 'rgba(44,212,122,0.55)' : fill > 0.02 ? C.line : '#3A3F47'}`,
			background: `rgba(27,30,35,${fill})`,
			boxShadow: fill > 0.5 ? '0 22px 60px rgba(0,0,0,0.45)' : undefined,
			padding: '30px 34px',
			...style,
		}}
	>
		<div style={{opacity: fill, transform: `translateY(${(1 - fill) * 16}px)`}}>
			{icon}
			<div style={{fontSize: 52, fontWeight: 900, color: C.white, letterSpacing: -1, marginTop: 14, lineHeight: 1}}>{label}</div>
		</div>
		<div style={{position: 'absolute', left: 34, right: 34, bottom: 30, display: 'flex', gap: 10, alignItems: 'flex-end', height: 36}}>
			{[0.55, 0.8, 0.45, 0.95, 0.6, 0.75, 0.5].map((h, i) => {
				const p = Math.max(0, Math.min(1, bars * 7 - i));
				return <div key={i} style={{flex: 1, height: 36 * h * E.out(p), borderRadius: 4, background: '#3A3F47'}} />;
			})}
		</div>
	</div>
);

/**
 * STEP 2 — gas + groceries. Placeholders on "figure out", cards fill on "gas" /
 * "groceries", LAST PAY PERIOD appears on "Look at what you spent last time",
 * then both cards drop into THIS PAYCHECK'S BUDGET on "a number to start with".
 */
export const GroceriesScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tFigure = cue('L5', 'figure');
	const tGas = cue('L5', 'gas');
	const tGro = cue('L5', 'groceries');
	const tLook = cue('L6', 'look');
	const tGives = cue('L7', 'gives');
	const tNum = cue('L7', 'number', -0.12);

	const ph = Math.max(sp(frame, fps, -12, 'snappy') * 0.6, sp(frame, fps, tFigure, 'snappy'));
	const fills = [sp(frame, fps, tGas, 'snappy'), sp(frame, fps, tGro, 'snappy')];
	const lastIn = sp(frame, fps, tLook, 'snappy');
	const bars = prog(frame, tLook + 4, 22, E.out);
	const brIn = sp(frame, fps, tGives - 4, 'snappy');
	const moves = [prog(frame, tNum, 18, E.inOut), prog(frame, tNum + 4, 18, E.inOut)];
	const arrived = sp(frame, fps, tNum + 20, 'snappy');
	const lastOut = kf(frame, [tNum, tNum + 10], [0, 1]);

	return (
		<Stage>
			<StepHeading n={2} text="GAS + GROCERIES" at={-12} />

			<div style={{position: 'absolute', left: LEFTS[0], top: CARD.top - 58, display: 'flex', alignItems: 'center', gap: 16, opacity: lastIn * (1 - lastOut), transform: `translateY(${(1 - lastIn) * 16}px)`}}>
				<svg width={30} height={30} viewBox="0 0 24 24">
					<path d="M12 7v5l3.5 2M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4 4v4h4" fill="none" stroke={C.soft} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<Label size={30} color={C.soft} style={{fontWeight: 900}}>LAST PAY PERIOD</Label>
			</div>

			{/* budget bracket */}
			<div
				style={{
					position: 'absolute',
					left: BR.x,
					top: BR.y,
					width: BR.w,
					height: BR.h,
					borderRadius: 34,
					boxSizing: 'border-box',
					border: `4px ${arrived > 0.02 ? 'solid' : 'dashed'} ${arrived > 0.02 ? C.green : '#4A4F57'}`,
					background: arrived > 0.02 ? 'rgba(44,212,122,0.06)' : 'transparent',
					opacity: brIn,
					transform: `scale(${0.95 + 0.05 * brIn})`,
				}}
			>
				<Label size={30} color={arrived > 0.02 ? C.green : C.soft} style={{position: 'absolute', left: 0, right: 0, top: 24, textAlign: 'center', fontWeight: 900}}>
					THIS PAYCHECK’S BUDGET
				</Label>
			</div>

			{[0, 1].map((i) => {
				const m = moves[i];
				const [x, y] = arc(m, [LEFTS[i], CARD.top], [IN.lefts[i], IN.top], 40);
				const s = mix(1, IN.s, m);
				return (
					<SpendCard
						key={i}
						label={i === 0 ? 'GAS' : 'GROCERIES'}
						icon={i === 0 ? <GasIcon /> : <CartIcon />}
						fill={fills[i]}
						bars={bars}
						budget={arrived}
						style={{left: x, top: y, opacity: ph, transform: `scale(${s * (0.96 + 0.04 * ph)})`, transformOrigin: '0 0'}}
					/>
				);
			})}
		</Stage>
	);
};
