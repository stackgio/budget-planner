import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {BrandBg, FONT, L, P, StepTag} from '../ui';

const Node: React.FC<{y: number; title: string; sub: string; at: number; lit: number; glyph: React.ReactNode}> = ({y, title, sub, at, lit, glyph}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, 'bouncy');
	return (
		<div
			style={{
				position: 'absolute',
				left: 150,
				width: 780,
				top: y,
				height: 170,
				borderRadius: 34,
				background: P.paper,
				border: `3px solid ${lit > 0.5 ? P.accent : P.line}`,
				boxShadow: `0 0 ${40 * lit}px rgba(57,255,20,${0.2 * lit})`,
				display: 'flex',
				alignItems: 'center',
				gap: 30,
				padding: '0 40px',
				boxSizing: 'border-box',
				opacity: Math.min(1, p * 1.5),
				transform: `scale(${0.85 + 0.15 * p})`,
			}}
		>
			<div style={{width: 92, height: 92, borderRadius: 26, background: lit > 0.5 ? P.accent : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{glyph}</div>
			<div>
				<div style={{fontSize: 46, fontWeight: 900, color: P.ink, letterSpacing: -0.5}}>{title}</div>
				<div style={{fontSize: 26, fontWeight: 700, color: P.muted, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4}}>{sub}</div>
			</div>
		</div>
	);
};

/** 03 · FUND IT — bank → investing account → available to invest. */
export const BankScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {cue} = useCues();
	const tConnect = cue('L12', 'connect');
	const tDeposit = cue('L12', 'deposit');
	const tMoney = cue('L12', 'money');
	const line1 = kf(frame, [tConnect, tConnect + 14], [0, 1], E.inOut);
	const line2 = kf(frame, [tDeposit, tDeposit + 14], [0, 1], E.inOut);
	const coin = kf(frame, [tDeposit - 2, tMoney + 6], [0, 1], E.inOut);
	const lit3 = kf(frame, [tMoney + 2, tMoney + 8], [0, 1]);
	const ys = [520, 830, 1140];
	const cx = 540;
	const coinY = ys[0] + 170 + coin * (ys[2] - ys[0] - 170);
	const ink = (lit: boolean) => (lit ? P.bg : P.ink);
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={1000} />
			<StepTag n="03" label="FUND IT" at={0} style={{left: L, top: 190}} />
			<div style={{position: 'absolute', left: L, top: 300, right: 120}}>
				<KineticText text="CONNECT & DEPOSIT" at={2} fontSize={88} color={P.ink} colors={{deposit: P.accent}} />
			</div>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<line x1={cx} y1={ys[0] + 170} x2={cx} y2={ys[1]} stroke={P.line} strokeWidth={6} strokeDasharray="2 14" strokeLinecap="round" />
				<line x1={cx} y1={ys[1] + 170} x2={cx} y2={ys[2]} stroke={P.line} strokeWidth={6} strokeDasharray="2 14" strokeLinecap="round" />
				<line x1={cx} y1={ys[0] + 170} x2={cx} y2={ys[0] + 170 + line1 * 140} stroke={P.accent} strokeWidth={6} strokeLinecap="round" />
				<line x1={cx} y1={ys[1] + 170} x2={cx} y2={ys[1] + 170 + line2 * 140} stroke={P.accent} strokeWidth={6} strokeLinecap="round" />
				{coin > 0 && coin < 1 && <circle cx={cx} cy={coinY} r={16} fill={P.accent} />}
			</svg>
			<Node y={ys[0]} title="Bank" sub="Your checking" at={0} lit={1} glyph={<span style={{fontSize: 44, fontWeight: 900, color: ink(true)}}>$</span>} />
			<Node y={ys[1]} title="Investing account" sub="Brokerage or Roth IRA" at={tConnect} lit={line1} glyph={<svg width={46} height={46} viewBox="0 0 40 40"><path d="M8 30l9-9 6 6 10-13M24 14h9v9" fill="none" stroke={ink(line1 > 0.5)} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></svg>} />
			<Node y={ys[2]} title="Available to invest" sub="Ready when you are" at={tDeposit} lit={lit3} glyph={<svg width={46} height={46} viewBox="0 0 40 40"><path d="M9 21l7 7 15-16" fill="none" stroke={ink(lit3 > 0.5)} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" /></svg>} />
			<Sfx at={tConnect} name="click" volume={0.3} />
			<Sfx at={tMoney + 4} name="coin" volume={0.3} />
		</AbsoluteFill>
	);
};
