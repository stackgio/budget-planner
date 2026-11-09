import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, sp} from '../../../story/lib/motion';
import {BrandBg, FONT, L, P, StepTag} from '../ui';
import {CLUSTER, TICKERS, TickerTile} from './tickers';

const BX = 540; // basket centre
const RIM = 1060; // rim y
const BW = 640;

const BasketBack: React.FC = () => (
	<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
		<ellipse cx={BX} cy={RIM} rx={BW / 2} ry={46} fill="#0C110D" stroke={P.accentDeep} strokeWidth={5} />
	</svg>
);
const BasketFront: React.FC<{glow: number}> = ({glow}) => {
	const top = RIM;
	const bot = 1330;
	const inset = 70;
	const d = `M ${BX - BW / 2} ${top} L ${BX - BW / 2 + inset} ${bot} Q ${BX} ${bot + 26} ${BX + BW / 2 - inset} ${bot} L ${BX + BW / 2} ${top} Q ${BX} ${top + 92} ${BX - BW / 2} ${top} Z`;
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0, filter: glow > 0 ? `drop-shadow(0 0 ${24 * glow}px rgba(57,255,20,${0.35 * glow}))` : undefined}}>
			<defs>
				<clipPath id="bf">
					<path d={d} />
				</clipPath>
			</defs>
			<path d={d} fill="#111A13" stroke={P.accent} strokeWidth={6} strokeLinejoin="round" />
			<g clipPath="url(#bf)" stroke="rgba(57,255,20,0.16)" strokeWidth={4}>
				{Array.from({length: 14}).map((_, i) => (
					<line key={i} x1={BX - BW / 2 + i * 50} y1={top} x2={BX - BW / 2 + i * 50 + 40} y2={bot + 30} />
				))}
				{Array.from({length: 5}).map((_, i) => (
					<line key={`h${i}`} x1={BX - BW / 2} y1={top + 70 + i * 50} x2={BX + BW / 2} y2={top + 70 + i * 50} />
				))}
			</g>
			<text x={BX} y={1225} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={110} fill={P.accent} letterSpacing={6}>
				ETF
			</text>
		</svg>
	);
};

/** Where each tile lands inside the basket (pile). */
const PILE: Record<string, [number, number, number]> = {
	AAPL: [370, 1050, -8],
	NVDA: [540, 1036, 3],
	MSFT: [708, 1052, 7],
	AMZN: [455, 990, 5],
	GOOGL: [625, 985, -5],
	TSLA: [540, 945, -2],
};

/**
 * 05 · ETF — the basket. The cluster from the previous scene arcs into one
 * basket labelled ETF: ONE FUND, MANY INVESTMENTS.
 */
export const EtfScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBasket = cue('L16', 'basket');
	const tBunch = cue('L16', 'bunch');
	const tDiff = cue('L16', 'different');
	const basketIn = sp(frame, fps, 2, 'heavy');
	const landedGlow = kf(frame, [tBunch + 10, tBunch + 20], [0, 1]);
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={1100} glow={1 + landedGlow * 0.5} />
			<StepTag n="04" label="WHAT TO BUY" at={-30} style={{left: L, top: 190}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 470, display: 'flex', justifyContent: 'center'}}>
				<KineticText text="START WITH ETFs" at={-30} exitAt={tBasket - 8} fontSize={118} color={P.ink} colors={{etfs: P.accent}} align="center" style={{width: 900}} />
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 400, display: 'flex', justifyContent: 'center'}}>
				<KineticText text="ONE FUND" at={tBasket} fontSize={124} color={P.ink} align="center" style={{width: 900}} />
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 540, display: 'flex', justifyContent: 'center'}}>
				<KineticText text="MANY INVESTMENTS" at={tDiff - 4} fontSize={96} color={P.accent} align="center" style={{width: 960}} />
			</div>
			<div style={{position: 'absolute', inset: 0, opacity: basketIn, transform: `translateY(${(1 - basketIn) * 200}px)`}}>
				<BasketBack />
			</div>
			{TICKERS.map((t, i) => {
				const p = kf(frame, [tBasket + i * 3, tBasket + i * 3 + 16], [0, 1], E.inOut);
				const [x, y] = arc(p, CLUSTER[t], [PILE[t][0], PILE[t][1]], 200);
				return <TickerTile key={t} t={t} x={x} y={y} rot={PILE[t][2] * p} scale={1 - 0.22 * p} />;
			})}
			<div style={{position: 'absolute', inset: 0, opacity: basketIn, transform: `translateY(${(1 - basketIn) * 200}px)`}}>
				<BasketFront glow={landedGlow} />
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 1350, textAlign: 'center', fontSize: 26, fontWeight: 700, color: P.muted, opacity: landedGlow}}>
				Example tickers — each ETF holds its own mix
			</div>
			<Sfx at={tBasket + 14} name="paper" volume={0.25} />
			<Sfx at={tBunch + 12} name="thud" volume={0.2} />
		</AbsoluteFill>
	);
};
