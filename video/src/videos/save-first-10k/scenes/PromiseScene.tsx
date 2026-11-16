import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {C, L, Panel, VaultBg} from '../ui';

const Icon: React.FC<{k: number; color: string}> = ({k, color}) => {
	const s = {fill: 'none', stroke: color, strokeWidth: 5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	return (
		<svg width={64} height={64} viewBox="0 0 64 64">
			{k === 0 && (
				<g {...s}>
					<ellipse cx={32} cy={46} rx={20} ry={7} />
					<ellipse cx={32} cy={33} rx={20} ry={7} />
					<ellipse cx={32} cy={20} rx={20} ry={7} />
				</g>
			)}
			{k === 1 && (
				<g {...s}>
					<path d="M50 26 A20 20 0 0 0 14 22" />
					<path d="M14 10 V22 H26" />
					<path d="M14 38 A20 20 0 0 0 50 42" />
					<path d="M50 54 V42 H38" />
				</g>
			)}
			{k === 2 && (
				<g {...s}>
					<path d="M12 52 V36" />
					<path d="M26 52 V22" />
					<path d="M40 52 V30" />
					<path d="M54 52 V14" />
				</g>
			)}
			{k === 3 && (
				<g {...s}>
					<path d="M10 50 L26 34 L36 42 L54 18" />
					<path d="M42 18 H54 V30" />
				</g>
			)}
		</svg>
	);
};

const CARDS = [
	{n: '01', label: 'SAVE', sub: 'What you can afford'},
	{n: '02', label: 'AUTOMATE', sub: 'Every payday'},
	{n: '03', label: 'REVIEW', sub: 'Last 30 days'},
	{n: '04', label: 'EXTRA INCOME', sub: 'Give it a purpose'},
];

/**
 * PROMISE — "Here are four things I'd do, starting with my next paycheck."
 * Four step cards land in a 2×2 grid; on "paycheck" card 01 steps forward
 * (the depth push into scene 3 goes "through" it).
 */
export const PromiseScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tFour = cue('L4', 'four');
	const tStart = cue('L4', 'starting');
	const tPay = cue('L4', 'paycheck');
	const head = sp(frame, fps, tFour - 4, 'snappy');
	const sub = sp(frame, fps, tStart, 'snappy');
	const focus = sp(frame, fps, tPay, 'smooth');
	const W = (L.w - 28) / 2;
	const H = 360;
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<VaultBg glow={0.7} gy={800} />
			<div style={{position: 'absolute', left: L.x, top: 220, opacity: head, transform: `translateY(${(1 - head) * 30}px)`}}>
				<div style={{fontSize: 96, fontWeight: 900, letterSpacing: -3, color: C.white, lineHeight: 1}}>
					<span style={{color: C.green}}>4</span> MOVES
				</div>
			</div>
			<div style={{position: 'absolute', left: L.x, top: 340, opacity: sub, transform: `translateX(${(1 - sub) * -30}px)`}}>
				<div style={{fontSize: 32, fontWeight: 800, letterSpacing: 5, color: C.gray}}>STARTING NEXT PAYCHECK</div>
			</div>
			{CARDS.map((c, i) => {
				const p = sp(frame, fps, tFour + 2 + i * 4, 'snappy');
				const x = L.x + (i % 2) * (W + 28);
				const y = 450 + Math.floor(i / 2) * (H + 28);
				const isFirst = i === 0;
				const sc = (0.92 + 0.08 * p) * (isFirst ? 1 + 0.05 * focus : 1 - 0.04 * focus);
				return (
					<Panel
						key={c.n}
						glow={isFirst ? focus : 0}
						style={{
							left: x,
							top: y,
							width: W,
							height: H,
							opacity: Math.min(1, p * 1.3) * (isFirst ? 1 : 1 - 0.6 * focus),
							transform: `translateY(${(1 - p) * 70}px) scale(${sc})`,
							zIndex: isFirst ? 2 : 1,
						}}
					>
						<div style={{position: 'absolute', left: 36, top: 32, fontSize: 40, fontWeight: 900, color: C.green, letterSpacing: 1}}>{c.n}</div>
						<div style={{position: 'absolute', right: 32, top: 28}}>
							<Icon k={i} color={isFirst && focus > 0.5 ? C.green : C.gray} />
						</div>
						<div style={{position: 'absolute', left: 36, bottom: 84, fontSize: c.label.length > 8 ? 46 : 54, fontWeight: 900, color: C.white, letterSpacing: 0.5, whiteSpace: 'nowrap'}}>{c.label}</div>
						<div style={{position: 'absolute', left: 36, bottom: 40, fontSize: 26, fontWeight: 600, color: C.gray, whiteSpace: 'nowrap'}}>{c.sub}</div>
					</Panel>
				);
			})}
			<Sfx at={tFour + 2} name="card" volume={0.3} />
			<Sfx at={tFour + 14} name="card" volume={0.22} />
			<Sfx at={tPay + 4} name="click" volume={0.3} />
		</AbsoluteFill>
	);
};

