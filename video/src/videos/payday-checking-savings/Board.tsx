import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {E, kf, sp} from '../../story/lib/motion';
import {story} from '../../story/theme';
import {P} from './look';

/**
 * The emerald two-column board, shared by the CHECKING and SAVINGS scenes so
 * it reads as one object that fills up. Every element is driven by the
 * scene-local frame it should land on (from narration cues); a frame far in
 * the past (e.g. -90) = already on the board.
 */
export type ColCues = {on: number; header: number; purpose: number; items: number[]};

const BOARD = {x: story.safe.left, y: 268, w: 1080 - story.safe.left - story.safe.right, h: 1030};
const GAP = 26;
const COL_W = (BOARD.w - GAP) / 2;
const COL_Y = 318;
const COL_H = 920;
const HEADER_H = 168;

type Icon = 'home' | 'cart' | 'fuel' | 'grow' | 'lock';
const COLS: {header: string[]; headerSize: number; purpose: string[]; items: {label: string; icon: Icon}[]}[] = [
	{
		header: ['CHECKING'],
		headerSize: 54,
		purpose: ['Everyday', 'spending'],
		items: [
			{label: 'Rent', icon: 'home'},
			{label: 'Groceries', icon: 'cart'},
			{label: 'Gas', icon: 'fuel'},
		],
	},
	{
		header: ['HIGH-YIELD', 'SAVINGS'],
		headerSize: 46,
		purpose: ['Emergency', 'money'],
		items: [
			{label: 'Earns interest', icon: 'grow'},
			{label: 'Set aside', icon: 'lock'},
		],
	},
];

const IconSvg: React.FC<{icon: Icon; color: string}> = ({icon, color}) => (
	<svg width={40} height={40} viewBox="-20 -20 40 40" fill="none" stroke={color} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round">
		{icon === 'home' && (
			<>
				<path d="M-15 -1 L0 -14 L15 -1" />
				<path d="M-11 -4 V14 H11 V-4" />
				<path d="M-4 14 V5 H4 V14" />
			</>
		)}
		{icon === 'cart' && (
			<>
				<path d="M-17 -12 H-11 L-6 7 H12 L16 -6 H-9" />
				<circle cx="-4" cy="13" r="2.6" fill={color} />
				<circle cx="10" cy="13" r="2.6" fill={color} />
			</>
		)}
		{icon === 'fuel' && (
			<>
				<rect x="-14" y="-14" width="18" height="29" rx="3" />
				<path d="M-14 -3 H4" />
				<path d="M4 -8 L11 -2 V10 A3 3 0 0 0 17 10 V-6 L12 -11" />
			</>
		)}
		{icon === 'grow' && (
			<>
				<path d="M-16 12 L-5 1 L2 8 L15 -6" />
				<path d="M6 -6 H15 V3" />
			</>
		)}
		{icon === 'lock' && (
			<>
				<rect x="-13" y="-3" width="26" height="19" rx="4" />
				<path d="M-8 -3 V-8 A8 8 0 0 1 8 -8 V-3" />
				<circle cx="0" cy="6" r="2.4" fill={color} />
			</>
		)}
	</svg>
);

const Column: React.FC<{i: number; cues: ColCues; finalAt: number}> = ({i, cues, finalAt}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const col = COLS[i];
	const x = BOARD.x + i * (COL_W + GAP);
	const on = sp(frame, fps, cues.on, 'smooth');
	const hdr = sp(frame, fps, cues.header, 'heavy');
	const hdrText = sp(frame, fps, cues.header + 4, 'snappy');
	const pur = sp(frame, fps, cues.purpose, 'bouncy');
	const fin = kf(frame, [finalAt, finalAt + 14], [0, 1], E.out);
	return (
		<div style={{position: 'absolute', left: x, top: COL_Y, width: COL_W, height: COL_H}}>
			{/* placeholder outline (before the column is "claimed") */}
			<div style={{position: 'absolute', inset: 0, borderRadius: 34, border: `3px dashed rgba(255,255,255,${0.16 * (1 - on)})`}} />
			{/* claimed column */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: 34,
					background: P.paper,
					border: `3px solid ${P.accent}`,
					opacity: on,
					boxShadow: `0 0 ${40 * fin}px rgba(30,227,143,${0.28 * fin})`,
				}}
			/>
			{/* header */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: COL_W,
					height: HEADER_H,
					borderRadius: '34px 34px 0 0',
					background: P.accent,
					transformOrigin: '50% 0%',
					transform: `scaleY(${Math.max(0, hdr)})`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					width: COL_W,
					height: HEADER_H,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					color: '#04130C',
					fontSize: col.headerSize,
					fontWeight: 900,
					letterSpacing: 1.5,
					lineHeight: 1.02,
					opacity: Math.min(1, hdrText * 1.4),
					transform: `translateY(${(1 - hdrText) * 24}px)`,
				}}
			>
				{col.header.map((h) => (
					<div key={h}>{h}</div>
				))}
			</div>
			{/* arrow + purpose */}
			<svg width={44} height={56} viewBox="0 0 44 56" style={{position: 'absolute', left: COL_W / 2 - 22, top: HEADER_H + 22, opacity: Math.min(1, pur)}}>
				<path d="M22 2 V48 M6 34 L22 50 L38 34" stroke={P.accent} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
			</svg>
			<div
				style={{
					position: 'absolute',
					left: 0,
					width: COL_W,
					top: HEADER_H + 92,
					textAlign: 'center',
					color: P.ink,
					fontSize: 56 + 4 * fin,
					fontWeight: 900,
					lineHeight: 1.04,
					letterSpacing: -1,
					opacity: Math.min(1, pur * 1.3),
					transform: `translateY(${(1 - Math.min(1, pur)) * 30}px) scale(${0.9 + 0.1 * pur})`,
				}}
			>
				{col.purpose.map((p) => (
					<div key={p}>{p}</div>
				))}
				<div style={{margin: '18px auto 0', height: 8, borderRadius: 4, background: P.accent, width: `${fin * 62}%`}} />
			</div>
			{/* items */}
			{col.items.map((it, k) => {
				const at = cues.items[k] ?? 1e6;
				const p = sp(frame, fps, at, 'snappy');
				const icon = sp(frame, fps, at + 2, 'bouncy');
				const flash = kf(frame, [at, at + 4, at + 22], [0, 1, 0]);
				return (
					<div
						key={it.label}
						style={{
							position: 'absolute',
							left: 26,
							width: COL_W - 52,
							top: HEADER_H + 330 + k * 128,
							height: 108,
							borderRadius: 26,
							background: '#1A1C1F',
							border: `2px solid rgba(30,227,143,${0.18 + 0.82 * flash})`,
							display: 'flex',
							alignItems: 'center',
							gap: 20,
							padding: '0 22px',
							opacity: Math.min(1, p * 1.5),
							transform: `translateX(${(1 - p) * -40}px)`,
						}}
					>
						<div
							style={{
								width: 66,
								height: 66,
								flex: '0 0 66px',
								borderRadius: 33,
								background: P.accentSoft,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								transform: `scale(${icon})`,
							}}
						>
							<IconSvg icon={it.icon} color={P.accent} />
						</div>
						<div style={{fontSize: it.label.length > 10 ? 34 : 40, fontWeight: 800, color: P.ink, letterSpacing: -0.5, whiteSpace: 'nowrap'}}>{it.label}</div>
					</div>
				);
			})}
		</div>
	);
};

export const Board: React.FC<{left: ColCues; right: ColCues; finalAt?: number; titleAt?: number}> = ({left, right, finalAt = 1e6, titleAt = -90}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = sp(frame, fps, titleAt, 'snappy');
	return (
		<div style={{position: 'absolute', inset: 0, fontFamily: story.font}}>
			<div
				style={{
					position: 'absolute',
					left: BOARD.x,
					width: BOARD.w,
					top: BOARD.y - 70,
					textAlign: 'center',
					fontSize: 28,
					fontWeight: 800,
					letterSpacing: 6,
					color: P.muted,
					opacity: t,
				}}
			>
				WHERE MY PAYCHECK GOES
			</div>
			<Column i={0} cues={left} finalAt={finalAt} />
			<Column i={1} cues={right} finalAt={finalAt + 4} />
		</div>
	);
};

export const BOARD_LAYOUT = {...BOARD, COL_Y, COL_H};
