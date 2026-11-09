import React from 'react';
import {FONT, P} from '../ui';

/** Well-known example tickers (illustration of "individual stocks"). */
export const TICKERS = ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'TSLA'] as const;
export type Ticker = (typeof TICKERS)[number];

/** Scattered layout in the "what do I buy?" scene (tile centres). */
export const SCATTER: Record<Ticker, [number, number, number]> = {
	AAPL: [270, 960, -6],
	NVDA: [790, 930, 5],
	MSFT: [830, 1150, -4],
	AMZN: [520, 1100, 3],
	GOOGL: [230, 1220, 4],
	TSLA: [560, 1290, -3],
};

/** The tidy cluster both scenes share at the cut (continuity). */
export const CLUSTER: Record<Ticker, [number, number]> = {
	AAPL: [300, 1000],
	NVDA: [540, 1000],
	MSFT: [780, 1000],
	AMZN: [300, 1120],
	GOOGL: [540, 1120],
	TSLA: [780, 1120],
};

export const TILE = {w: 220, h: 96};

export const TickerTile: React.FC<{t: string; x: number; y: number; rot?: number; scale?: number; hi?: number; dim?: number; opacity?: number}> = ({t, x, y, rot = 0, scale = 1, hi = 0, dim = 0, opacity = 1}) => (
	<div
		style={{
			position: 'absolute',
			left: x - TILE.w / 2,
			top: y - TILE.h / 2,
			width: TILE.w,
			height: TILE.h,
			borderRadius: 22,
			background: hi > 0.5 ? P.accent : P.paper,
			border: `3px solid ${hi > 0.05 ? P.accent : '#2C3630'}`,
			color: hi > 0.5 ? P.bg : P.ink,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontFamily: FONT,
			fontSize: 42,
			fontWeight: 900,
			letterSpacing: 1,
			transform: `rotate(${rot}deg) scale(${scale * (1 + 0.08 * hi)})`,
			opacity: opacity * (1 - 0.55 * dim),
			boxShadow: hi > 0.05 ? `0 0 ${40 * hi}px rgba(57,255,20,${0.35 * hi})` : '0 14px 30px rgba(0,0,0,0.5)',
		}}
	>
		{t}
	</div>
);
