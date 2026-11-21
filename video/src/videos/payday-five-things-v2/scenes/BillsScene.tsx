import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {DeskSurface, deskColors, deskShadow, PenEllipse, PenPath} from '../../../story/components/Desk';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, prog, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {C, Chip, G, StepHeader} from '../kit';

// close crop of a paper desk calendar: three week rows, bleeding off both edges
const PAPER = {x: 20, y: 330, w: 1040, rot: -1};
const PAD = 20;
const HOLES = 44;
const WK = 54;
const CW = (PAPER.w - PAD * 2) / 7;
const RH = 175;
const PAPER_H = PAD + HOLES + WK + RH * 3 + PAD;
const ROWS = [
	[22, 23, 24, 25, 26, 27, 28],
	[29, 30, 1, 2, 3, 4, 5],
	[6, 7, 8, 9, 10, 11, 12],
];
const cell = (row: number, col: number) => ({x: PAD + col * CW + CW / 2, y: PAD + HOLES + WK + row * RH + RH / 2});
const TODAY = {row: 0, col: 5};
const RENT = {row: 1, col: 2};
const PAYDAY = {row: 2, col: 5};

/** paper-local point → frame point (paper rotates about its centre) */
const toFrame = (p: {x: number; y: number}) => {
	const a = (PAPER.rot * Math.PI) / 180;
	const cx = PAPER.w / 2;
	const cy = PAPER_H / 2;
	const dx = p.x - cx;
	const dy = p.y - cy;
	return {x: PAPER.x + cx + dx * Math.cos(a) - dy * Math.sin(a), y: PAPER.y + cy + dx * Math.sin(a) + dy * Math.cos(a)};
};

const SLOT = {x: 120, y: 1095, w: 840, h: 150};

/**
 * 1 · BILLS — why the date matters.
 * TODAY → RENT DUE → NEXT PAYDAY get marked in order; on "rent's" the pen
 * circles RENT DUE; on "set that money aside" the RENT DUE label is carried
 * into a SET ASIDE slot while the calendar keeps both dates visible.
 */
export const BillsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tToday = cue('L2b', 'before') + 2;
	const tOne = cue('L3', 'One');
	const tRent = cue('L3', 'bills');
	const tPay = cue('L3', 'next');
	const tOrder = cue('L3', 'paycheck');
	const tCircle = cue('L4', "rent's");
	const tSlot = cue('L4', 'again');
	const tSet = cue('L4', 'set');

	const today = sp(frame, fps, tToday, 'snappy');
	const rent = sp(frame, fps, tRent, 'snappy');
	const pay = sp(frame, fps, tPay, 'snappy');
	const order = prog(frame, tOrder, 22, E.inOut);
	const circle = prog(frame, tCircle, 16, E.out);
	const slot = sp(frame, fps, tSlot, 'snappy');
	const move = kf(frame, [tSet, tSet + 22], [0, 1], E.inOut);
	const landed = sp(frame, fps, tSet + 20, 'bouncy');

	const c = (p: {row: number; col: number}) => cell(p.row, p.col);
	const rentChipLocal = {x: c(RENT).x, y: c(RENT).y + 42};
	const rentFrom = toFrame(rentChipLocal);
	const rentTo = {x: SLOT.x + SLOT.w - 190, y: SLOT.y + SLOT.h / 2};
	const [rx, ry] = arc(move, [rentFrom.x, rentFrom.y], [rentTo.x, rentTo.y], 60);

	const chipAt = (p: {x: number; y: number}, s: number, extra?: React.CSSProperties): React.CSSProperties => ({
		left: p.x,
		top: p.y,
		transform: `translate(-50%, -50%) scale(${0.6 + 0.4 * s})`,
		opacity: Math.min(1, s * 2),
		fontSize: 24,
		...extra,
	});

	const t = c(TODAY), r = c(RENT), py = c(PAYDAY);
	const orderPath = `M ${t.x} ${t.y + 5} C ${t.x + 40} ${t.y + 110}, ${r.x + 60} ${r.y - 110}, ${r.x} ${r.y - 10} M ${r.x + 30} ${r.y + 20} C ${r.x + 160} ${r.y + 120}, ${py.x - 120} ${py.y - 120}, ${py.x - 10} ${py.y - 10}`;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<DeskSurface />

			{/* the calendar */}
			<div style={{position: 'absolute', left: PAPER.x, top: PAPER.y, width: PAPER.w, height: PAPER_H, transform: `rotate(${PAPER.rot}deg)`, background: deskColors.paper, boxShadow: deskShadow(0), borderRadius: 6}}>
				{/* binding holes */}
				<div style={{position: 'absolute', left: 0, right: 0, top: PAD, display: 'flex', justifyContent: 'space-evenly'}}>
					{Array.from({length: 14}, (_, i) => (
						<div key={i} style={{width: 18, height: 18, borderRadius: 9, background: deskColors.surface, boxShadow: 'inset 2px 2px 3px rgba(0,0,0,0.25)'}} />
					))}
				</div>
				{['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
					<div key={d} style={{position: 'absolute', left: PAD + i * CW, width: CW, top: PAD + HOLES, height: WK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, letterSpacing: 2, color: deskColors.muted}}>
						{d}
					</div>
				))}
				{ROWS.map((row, ri) =>
					row.map((d, ci) => (
						<div
							key={`${ri}-${ci}`}
							style={{
								position: 'absolute',
								left: PAD + ci * CW,
								top: PAD + HOLES + WK + ri * RH,
								width: CW,
								height: RH,
								borderTop: `2px solid ${deskColors.paperLine}`,
								borderLeft: ci ? `2px solid ${deskColors.paperLine}` : undefined,
								padding: '12px 14px',
								fontSize: 40,
								fontWeight: 800,
								color: deskColors.inkSoft,
							}}
						>
							{d}
						</div>
					)),
				)}

				{/* order of dates */}
				<PenPath d={orderPath} progress={order} color={deskColors.pen} stroke={5} dash="2 12" />
				{/* pen marks */}
				<PenEllipse cx={t.x - CW / 2 + 38} cy={t.y - RH / 2 + 36} rx={40} ry={34} progress={kf(frame, [tToday, tToday + 10], [0, 1], E.out)} stroke={7} rot={10} />
				<PenEllipse cx={r.x} cy={r.y} rx={92} ry={84} progress={circle} stroke={10} />

				<Chip text="TODAY" tone="green" style={chipAt({x: t.x, y: t.y + 42}, today)} />
				<Chip text="NEXT PAYDAY" tone="black" style={chipAt({x: py.x, y: py.y + 42}, pay)} />
				{/* RENT DUE ghost stays in the cell once its label is carried away */}
				{move > 0 && (
					<div style={{position: 'absolute', left: r.x, top: r.y + 42, transform: 'translate(-50%,-50%)', fontSize: 22, fontWeight: 900, letterSpacing: 2, color: deskColors.ink, opacity: 0.55 * move, whiteSpace: 'nowrap'}}>
						RENT
					</div>
				)}
			</div>

			{/* SET ASIDE slot */}
			<div
				style={{
					position: 'absolute',
					left: SLOT.x,
					top: SLOT.y,
					width: SLOT.w,
					height: SLOT.h,
					borderRadius: 24,
					background: C.black,
					display: 'flex',
					alignItems: 'center',
					paddingLeft: 40,
					gap: 22,
					transform: `translateY(${(1 - slot) * 30}px)`,
					opacity: Math.min(1, slot * 2),
					boxShadow: deskShadow(0.2),
				}}
			>
				<div style={{fontSize: 46, fontWeight: 900, color: C.white, letterSpacing: 1}}>
					<G>SET ASIDE</G>
				</div>
				<div
					style={{
						position: 'absolute',
						right: 40,
						top: 26,
						width: 300,
						height: SLOT.h - 52,
						borderRadius: 16,
						border: `3px dashed ${landed > 0.2 ? C.green : '#4A4E56'}`,
						background: landed > 0.2 ? 'rgba(44,212,122,0.12)' : 'transparent',
					}}
				/>
			</div>

			{/* the RENT DUE label: in its cell, then carried into the slot */}
			<Chip
				text="RENT DUE"
				tone={move >= 1 ? 'green' : 'black'}
				style={{
					left: rx,
					top: ry,
					transform: `translate(-50%, -50%) scale(${(0.6 + 0.4 * rent) * (1 + 0.45 * move) * (1 + 0.05 * Math.sin(Math.PI * Math.min(1, landed)))}) rotate(${PAPER.rot * (1 - move)}deg)`,
					opacity: Math.min(1, rent * 2),
					fontSize: 24,
					boxShadow: move > 0 && move < 1 ? '10px 22px 30px rgba(0,0,0,0.3)' : '0 6px 16px rgba(0,0,0,0.18)',
				}}
			/>

			<StepHeader n={1} text={<>BILLS DUE <G>BEFORE PAYDAY</G></>} at={tOne} />

			<Sfx at={tToday} name="tick" volume={0.25} />
			<Sfx at={tCircle} name="paper" volume={0.3} />
			<Sfx at={tSet + 20} name="click" volume={0.3} />
		</AbsoluteFill>
	);
};
