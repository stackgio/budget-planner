import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {C, CheckBox, L, Label, Stage, StepHeading} from '../ui';

const CELL = {n: 14, w: 60, gap: 7, x0: 74, top: 640, h: 96};
const cellX = (i: number) => CELL.x0 + i * (CELL.w + CELL.gap);
const RENT = 5;
const NEXT = 13;
const SLOT = {x: 210, y: 960, w: 660, h: 330};
const TILE = {w: 470, h: 190};
const TILE_HOME: [number, number] = [540, SLOT.y + 70 + TILE.h / 2];

/** Push-style deposit alert (no amount, no account details). */
const DepositAlert: React.FC<{style?: React.CSSProperties}> = ({style}) => (
	<div
		style={{
			position: 'absolute',
			left: L.left,
			width: L.width,
			height: 176,
			borderRadius: 34,
			background: 'linear-gradient(160deg, #1F2228 0%, #15171B 100%)',
			border: '3px solid #2E3239',
			boxShadow: '0 26px 70px rgba(0,0,0,0.6)',
			boxSizing: 'border-box',
			display: 'flex',
			alignItems: 'center',
			gap: 30,
			padding: '0 34px',
			...style,
		}}
	>
		<div style={{width: 104, height: 104, borderRadius: 52, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
			<svg width={58} height={58} viewBox="0 0 24 24">
				<path d="M12 4v13M6 11.5l6 6 6-6M5 21h14" fill="none" stroke="#0B0C0E" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
			</svg>
		</div>
		<div>
			<div style={{fontSize: 52, fontWeight: 900, color: C.white, letterSpacing: -1, lineHeight: 1}}>PAYCHECK DEPOSITED</div>
			<Label size={26} color={C.soft} style={{marginTop: 12}}>
				DIRECT DEPOSIT · JUST NOW
			</Label>
		</div>
	</div>
);

/** White RENT DUE tile — the thing that gets reserved. */
const RentTile: React.FC<{style?: React.CSSProperties}> = ({style}) => (
	<div
		style={{
			position: 'absolute',
			width: TILE.w,
			height: TILE.h,
			borderRadius: 26,
			background: '#F5F2EA',
			boxShadow: '0 24px 56px rgba(0,0,0,0.6)',
			display: 'flex',
			alignItems: 'center',
			gap: 26,
			padding: '0 36px',
			boxSizing: 'border-box',
			...style,
		}}
	>
		<svg width={92} height={92} viewBox="0 0 24 24" style={{flexShrink: 0}}>
			<path d="M3 11.2L12 4l9 7.2M5.5 9.5V20h13V9.5" fill="none" stroke="#121316" strokeWidth={2.3} strokeLinejoin="round" strokeLinecap="round" />
			<rect x={10} y={14} width={4} height={6} fill="#121316" />
		</svg>
		<div style={{fontSize: 74, fontWeight: 900, color: '#121316', letterSpacing: -2, lineHeight: 0.95}}>
			RENT
			<br />
			DUE
		</div>
	</div>
);

/**
 * OPEN + STEP 1 (one continuous shot, L1–L4).
 * Frame 0: "JUST GOT PAID?" + deposit alert. Before 2 s a RENT DUE tile drops
 * into SET ASIDE. On "One" the headline becomes step 1, the calendar explains
 * why (rent lands before next payday) and "set that money aside now" locks it.
 */
export const OpenScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tOne = cue('L3', 'One');
	const tBills = cue('L3', 'bills');
	const tNext = cue('L3', 'next');
	const tRent = cue('L4', "rent's");
	const tSet = cue('L4', 'set');
	const tLock = cue('L4', 'now', 0.3);

	// frame 0: alert already sliding in
	const alertIn = kf(frame, [-8, 10], [0, 1], E.out);
	const alertOut = kf(frame, [tOne - 8, tOne + 6], [0, 1], E.in);
	const headOut = kf(frame, [tOne - 8, tOne + 2], [0, 1], E.in);

	// RENT DUE tile: pops in under the alert, drops into SET ASIDE by ~1.6 s
	const tileIn = sp(frame, fps, 4, 'snappy');
	const drop = prog(frame, 26, 22, E.inOut);
	const landed = sp(frame, fps, 48, 'snappy');
	const slotIn = sp(frame, fps, -12, 'snappy');
	const [tx, ty] = arc(drop, [540, 735], TILE_HOME, 30);
	const tileS = mix(0.82 + 0.18 * tileIn, 1, drop) * (1 - 0.04 * Math.sin(Math.min(1, landed) * Math.PI));

	const lockP = sp(frame, fps, tLock, 'snappy');
	const setPulse = Math.sin(prog(frame, tSet, 12, E.out) * Math.PI);

	const nextIn = sp(frame, fps, tNext, 'snappy');
	const todayIn = sp(frame, fps, tBills + 3, 'snappy');
	const rentHi = sp(frame, fps, tRent, 'snappy');
	const link = prog(frame, tRent + 6, 12, E.out);

	return (
		<Stage>
			{/* hook headline — readable on frame 0 */}
			<div style={{position: 'absolute', left: L.left, top: 262, opacity: 1 - headOut, transform: `translateY(${-headOut * 40}px)`}}>
				<div style={{fontSize: 104, fontWeight: 900, color: C.white, letterSpacing: -3, lineHeight: 1}}>JUST GOT PAID?</div>
			</div>
			{frame >= tOne - 4 && <StepHeading n={1} text="BILLS DUE BEFORE PAYDAY" at={tOne - 2} />}

			{alertOut < 1 && <DepositAlert style={{top: 420 + (1 - alertIn) * -50 - alertOut * 40, opacity: Math.min(1, 0.35 + alertIn) * (1 - alertOut), transform: `scale(${0.97 + 0.03 * alertIn})`}} />}

			{/* calendar strip (step 1) */}
			{frame >= tBills - 8 &&
				Array.from({length: CELL.n}).map((_, i) => {
					const p = sp(frame, fps, tBills - 6 + i * 1.2, 'snappy');
					const isRent = i === RENT;
					const mark = (i === 0 && todayIn > 0) || (i === NEXT && nextIn > 0);
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
								border: `3px solid ${mark || hi > 0.02 ? C.ink : C.line}`,
								opacity: Math.min(1, p * 1.4),
								transform: `translateY(${(1 - p) * 30}px) scale(${1 + 0.08 * hi})`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 26,
								fontWeight: 800,
								color: hi > 0.5 ? '#121316' : mark ? C.white : C.muted,
							}}
						>
							{i + 1}
						</div>
					);
				})}
			<div style={{position: 'absolute', left: cellX(0), top: CELL.top - 52, opacity: todayIn}}>
				<Label size={28} color={C.white}>TODAY</Label>
			</div>
			<div style={{position: 'absolute', right: 1080 - (cellX(NEXT) + CELL.w), top: CELL.top - 52, opacity: nextIn}}>
				<Label size={28} color={C.white}>NEXT PAYDAY</Label>
			</div>
			<div style={{position: 'absolute', left: cellX(RENT) + CELL.w / 2 - 150, width: 300, top: CELL.top + CELL.h + 18, textAlign: 'center', opacity: rentHi}}>
				<Label size={32} color={C.white} style={{fontWeight: 900}}>RENT DUE</Label>
			</div>
			{/* link: the highlighted day is the tile already set aside */}
			<div
				style={{
					position: 'absolute',
					left: cellX(RENT) + CELL.w / 2 - 2,
					top: CELL.top + CELL.h + 64,
					width: 0,
					height: (SLOT.y - (CELL.top + CELL.h + 64)) * link,
					borderLeft: `4px dashed ${C.ink}`,
					opacity: 0.7,
				}}
			/>

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
					border: `4px ${landed > 0.02 ? 'solid' : 'dashed'} ${lockP > 0.02 ? C.green : landed > 0.02 ? '#5A6069' : '#4A4F57'}`,
					background: lockP > 0.02 ? 'rgba(44,212,122,0.08)' : 'rgba(255,255,255,0.02)',
					opacity: slotIn,
					transform: `scale(${(0.94 + 0.06 * slotIn) * (1 + 0.025 * setPulse)})`,
				}}
			>
				<Label size={32} color={lockP > 0.02 ? C.green : C.white} style={{position: 'absolute', left: 32, top: 22, fontWeight: 900}}>
					SET ASIDE
				</Label>
				<CheckBox size={56} at={tLock} style={{position: 'absolute', right: 22, top: 14}} />
			</div>

			<RentTile style={{left: tx - TILE.w / 2, top: ty - TILE.h / 2, opacity: Math.min(1, tileIn * 1.6), transform: `scale(${tileS}) rotate(${(1 - drop) * -3}deg)`}} />

			<Sfx at={2} name="cash" volume={0.26} />
			<Sfx at={47} name="paper" volume={0.22} />
			<Sfx at={tLock} name="pop" volume={0.2} />
		</Stage>
	);
};
