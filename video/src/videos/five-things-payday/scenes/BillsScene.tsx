import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {C, CheckBox, ChecklistRow, L, Label, Stage, StepHeading} from '../ui';
import {ROW1_LABEL, ROWS} from './HookScene';

const CELL = {n: 14, w: 60, gap: 7, x0: 74, top: 676, h: 96};
const cellX = (i: number) => CELL.x0 + i * (CELL.w + CELL.gap);
const TODAY = 0;
const RENT = 5;
const NEXT = 13;
const SLOT = {x: 250, y: 1010, w: 580, h: 300};
const CARD = {w: 340, h: 190};

/** Plain bill card (no amounts). */
const RentCard: React.FC<{style?: React.CSSProperties}> = ({style}) => (
	<div
		style={{
			position: 'absolute',
			width: CARD.w,
			height: CARD.h,
			borderRadius: 22,
			background: '#F5F2EA',
			boxShadow: '0 22px 50px rgba(0,0,0,0.55)',
			display: 'flex',
			alignItems: 'center',
			gap: 22,
			padding: '0 30px',
			boxSizing: 'border-box',
			...style,
		}}
	>
		<svg width={78} height={78} viewBox="0 0 24 24">
			<path d="M3 11.2L12 4l9 7.2M5.5 9.5V20h13V9.5" fill="none" stroke="#121316" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
			<rect x={10} y={14} width={4} height={6} fill="#121316" />
		</svg>
		<div>
			<div style={{fontSize: 70, fontWeight: 900, color: '#121316', letterSpacing: -1.5, lineHeight: 0.95}}>RENT</div>
			<div style={{width: 120, height: 10, borderRadius: 5, background: '#D6D0C3', marginTop: 12}} />
		</div>
	</div>
);

/**
 * STEP 1 — "One, check which bills are due before your next paycheck. If rent's due
 * before you get paid again, set that money aside now…"
 * Calendar strip TODAY → RENT DUE → NEXT PAYDAY; the RENT card lifts out of its
 * day and drops into SET ASIDE. Reads with the sound off.
 */
export const BillsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBills = cue('L3', 'bills');
	const tNext = cue('L3', 'next');
	const tRent = cue('L4', "rent's");
	const tSet = cue('L4', 'set');
	const land = tSet + 26;

	// row 1 from the hook carries up into the heading
	const carry = kf(frame, [3, 17], [0, 1], E.in);

	const todayIn = sp(frame, fps, tBills + 4, 'snappy');
	const nextIn = sp(frame, fps, tNext, 'snappy');
	const rentHi = sp(frame, fps, tRent, 'snappy');
	const ring = kf(frame, [tRent, tRent + 18], [0, 1], E.out);

	const slotIn = sp(frame, fps, tSet - 8, 'snappy');
	const fly = prog(frame, tSet, 26, E.inOut);
	const landed = sp(frame, fps, land, 'snappy');
	const from: [number, number] = [cellX(RENT) + CELL.w / 2, CELL.top + CELL.h / 2];
	const to: [number, number] = [540, SLOT.y + 70 + CARD.h / 2];
	const [cx, cy] = arc(fly, from, to, 120);
	const cs = mix(0.22, 1, E.out(fly)) * (1 - 0.04 * Math.sin(Math.min(1, landed) * Math.PI));

	return (
		<Stage>
			{carry < 1 && (
				<ChecklistRow
					n={1}
					label={ROW1_LABEL}
					focus={1}
					h={ROWS.h}
					style={{left: L.left, top: mix(ROWS.top, 330, carry), opacity: 1 - carry, transform: `scale(${1.025 - 0.05 * carry})`}}
				/>
			)}
			<StepHeading n={1} text="BILLS DUE BEFORE PAYDAY" at={10} />

			{/* calendar strip */}
			{Array.from({length: CELL.n}).map((_, i) => {
				const p = sp(frame, fps, tBills - 6 + i * 1.5, 'snappy');
				const isRent = i === RENT;
				const isMark = (i === TODAY && todayIn > 0) || (i === NEXT && nextIn > 0);
				const hi = isRent ? rentHi : 0;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: cellX(i),
							top: CELL.top,
							width: CELL.w,
							height: CELL.h,
							borderRadius: 14,
							boxSizing: 'border-box',
							background: hi > 0.02 ? `rgba(245,242,234,${hi})` : '#16181C',
							border: `3px solid ${isMark ? C.ink : hi > 0.02 ? C.ink : C.line}`,
							opacity: Math.min(1, p * 1.4),
							transform: `translateY(${(1 - p) * 30}px) scale(${1 + 0.08 * hi})`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 26,
							fontWeight: 800,
							color: hi > 0.5 ? '#121316' : isMark ? C.white : C.muted,
						}}
					>
						{i + 1}
					</div>
				);
			})}
			{/* RENT DUE pulse ring */}
			{ring > 0 && ring < 1 && (
				<div
					style={{
						position: 'absolute',
						left: cellX(RENT) - 8 - ring * 18,
						top: CELL.top - 8 - ring * 18,
						width: CELL.w + 16 + ring * 36,
						height: CELL.h + 16 + ring * 36,
						borderRadius: 20,
						border: `3px solid rgba(245,242,234,${0.7 * (1 - ring)})`,
					}}
				/>
			)}
			<div style={{position: 'absolute', left: cellX(TODAY), top: CELL.top - 52, opacity: todayIn, transform: `translateY(${(1 - todayIn) * 14}px)`}}>
				<Label size={28} color={C.white}>TODAY</Label>
			</div>
			<div style={{position: 'absolute', right: 1080 - (cellX(NEXT) + CELL.w), top: CELL.top - 52, opacity: nextIn, transform: `translateY(${(1 - nextIn) * 14}px)`}}>
				<Label size={28} color={C.white}>NEXT PAYDAY</Label>
			</div>
			<div
				style={{
					position: 'absolute',
					left: cellX(RENT) + CELL.w / 2 - 150,
					width: 300,
					top: CELL.top + CELL.h + 22,
					textAlign: 'center',
					opacity: rentHi,
					transform: `translateY(${(1 - rentHi) * -14}px)`,
				}}
			>
				<svg width={26} height={14} viewBox="0 0 26 14" style={{display: 'block', margin: '0 auto 6px'}}>
					<path d="M2 12L13 2l11 10" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<Label size={32} color={C.white} style={{fontWeight: 900}}>RENT DUE</Label>
			</div>

			{/* SET ASIDE slot */}
			<div
				style={{
					position: 'absolute',
					left: SLOT.x,
					top: SLOT.y,
					width: SLOT.w,
					height: SLOT.h,
					borderRadius: 30,
					boxSizing: 'border-box',
					border: `4px ${landed > 0.02 ? 'solid' : 'dashed'} ${landed > 0.02 ? C.green : '#4A4F57'}`,
					background: landed > 0.02 ? 'rgba(44,212,122,0.07)' : 'transparent',
					opacity: slotIn,
					transform: `scale(${0.94 + 0.06 * slotIn})`,
				}}
			>
				<Label size={30} color={landed > 0.02 ? C.green : C.soft} style={{position: 'absolute', left: 32, top: 24, fontWeight: 900}}>
					SET ASIDE
				</Label>
				<CheckBox size={56} at={land + 2} style={{position: 'absolute', right: 22, top: 16}} />
			</div>

			{fly > 0 && <RentCard style={{left: cx - CARD.w / 2, top: cy - CARD.h / 2, transform: `scale(${cs}) rotate(${(1 - fly) * -6}deg)`}} />}

			<Sfx at={tSet} name="paper" volume={0.22} />
			<Sfx at={land} name="pop" volume={0.2} />
		</Stage>
	);
};
