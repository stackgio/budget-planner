import React from 'react';
import {FundCard, StockTile, TickerWord} from '../../../story/components/FundCards';
import {C} from './common';

/** The VOO / VTI / VT comparison cards — shared by the opening preview and the payoff. */
export const MINI = {w: 260, h: 740, xs: [120, 410, 700], appleDy: 230, msftDy: 330};

export type Mini = {ticker: string; desc: string; small: number; intl: number};
export const MINIS: Mini[] = [
	{ticker: 'VOO', desc: 'Large U.S.', small: 0, intl: 0},
	{ticker: 'VTI', desc: 'Broad U.S.', small: 10, intl: 0},
	{ticker: 'VT', desc: 'U.S. + intl.', small: 5, intl: 5},
];

export const MiniFundCard: React.FC<{
	m: Mini;
	x: number;
	y: number;
	h?: number;
	apple?: number;
	msft?: number;
	glow?: number;
	opacity?: number;
	dy?: number;
}> = ({m, x, y, h = MINI.h, apple = 0, msft = 0, glow = 0, opacity = 1, dy = 0}) => {
	const fx = x + 22;
	const fw = MINI.w - 44;
	return (
		<div style={{position: 'absolute', inset: 0, opacity, transform: `translateY(${dy}px)`}}>
			<FundCard x={x} y={y} w={MINI.w} h={h} radius={30} glow={glow}>
				<div style={{position: 'absolute', left: 22, top: 24}}>
					<TickerWord text={m.ticker} fontSize={88} />
					<div style={{fontSize: 32, fontWeight: 800, color: C.body, marginTop: 12, whiteSpace: 'nowrap'}}>{m.desc}</div>
				</div>
			</FundCard>
			<StockTile x={fx} y={y + MINI.appleDy} w={fw} h={80} label="Apple" fontSize={38} focus={apple} />
			<StockTile x={fx} y={y + MINI.msftDy} w={fw} h={80} label="Microsoft" fontSize={36} focus={msft} />
			{/* other holdings, unlabeled: medium (large U.S.), small (smaller U.S.), warm (international) */}
			{[0, 1, 2, 3].map((k) => (
				<StockTile key={`m${k}`} x={fx + (k % 2) * (fw / 2 + 4)} y={y + 430 + Math.floor(k / 2) * 84} w={fw / 2 - 4} h={72} radius={14} dim={0.3} />
			))}
			{Array.from({length: m.small}).map((_, k) => (
				<StockTile key={`s${k}`} x={fx + (k % 5) * (fw / 5)} y={y + 610 + Math.floor(k / 5) * 52} w={fw / 5 - 8} h={36} radius={8} dim={0.3} />
			))}
			{Array.from({length: m.intl}).map((_, k) => (
				<StockTile key={`i${k}`} x={fx + (k % 5) * (fw / 5)} y={y + 662} w={fw / 5 - 8} h={36} radius={8} tint="#3B3527" />
			))}
		</div>
	);
};

/** Accent line running through one tile row across all three cards. */
export const RowLine: React.FC<{y: number; draw: number}> = ({y, draw}) => (
	<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
		<line x1={140} y1={y + 40} x2={140 + 800 * draw} y2={y + 40} stroke={C.accent} strokeWidth={6} strokeLinecap="round" opacity={0.85 * Math.min(1, draw * 4)} />
	</svg>
);
