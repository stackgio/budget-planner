import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {FundCard, StockTile, TickerChip, TickerWord} from '../../../story/components/FundCards';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {TICKERS} from './HookScene';
import {C, Desc, FONT} from './common';

const CARD = {y: 440, w: 260, h: 740, xs: [120, 410, 700]};
const TILE_Y = [CARD.y + 230, CARD.y + 330]; // Apple, Microsoft rows (same in all three)

type Mini = {ticker: string; desc: string; small: number; intl: number};
const MINIS: Mini[] = [
	{ticker: 'VOO', desc: 'Large U.S.', small: 0, intl: 0},
	{ticker: 'VTI', desc: 'Broad U.S.', small: 10, intl: 0},
	{ticker: 'VT', desc: 'U.S. + intl.', small: 5, intl: 5},
];

/** PAYOFF — VOO, VTI and VT side by side; Apple + Microsoft light up in all three. Then VT = one fund for U.S. + international. */
export const PayoffScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tAll = cue('L20', 'all');
	const tCards = [cue('L21', 'VOO', -0.05), cue('L21', 'VTI', -0.05), cue('L21', 'VT', -0.05)];
	const tHold = cue('L21', 'already');
	const tSame = cue('L21', 'same');
	const tOne = cue('L22', 'one');
	const tVt = cue('L22', 'VT');

	const chipsOut = prog(frame, tCards[0] - 6, 10);
	const overlap = prog(frame, tHold, 14);
	const line = kf(frame, [tHold + 4, tHold + 28], [0, 1], E.inOut);
	const headline = sp(frame, fps, tHold - 2, 'snappy');
	const vt = sp(frame, fps, tOne - 2, 'smooth');
	const vtPop = kf(frame, [tVt, tVt + 6, tVt + 22], [0, 1, 0], E.out);

	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<CinematicBg lightX={540} lightY={820} />
			{/* L20: all five, asked as a question */}
			{chipsOut < 1 && (
				<div style={{position: 'absolute', left: 90, right: 90, top: 640, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22, opacity: 1 - chipsOut}}>
					{TICKERS.map((t, i) => {
						const e = sp(frame, fps, -4 + i * 2, 'snappy');
						const pulse = kf(frame, [tAll + i * 2, tAll + i * 2 + 5, tAll + i * 2 + 16], [0, 1, 0]);
						return <TickerChip key={t} ticker={t} fontSize={84} active={pulse} style={{transform: `scale(${0.7 + 0.3 * e})`, opacity: e}} />;
					})}
				</div>
			)}
			{/* headline */}
			<div style={{position: 'absolute', left: 120, right: 120, top: 220, opacity: headline, transform: `translateY(${(1 - headline) * 24}px)`}}>
				<Desc text="Different ETFs can hold the same stocks." hl={['same', 'stocks.']} fontSize={66} style={{letterSpacing: -1.5, lineHeight: 1.08}} />
			</div>
			{/* connecting lines through Apple + Microsoft (behind tiles) */}
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				{TILE_Y.map((y) => (
					<line key={y} x1={140} y1={y + 40} x2={140 + 800 * line} y2={y + 40} stroke={C.accent} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
				))}
			</svg>
			{MINIS.map((m, i) => {
				const e = sp(frame, fps, tCards[i], 'bouncy');
				if (e < 0.01) return null;
				const x = CARD.xs[i];
				const isVt = m.ticker === 'VT';
				const dim = isVt ? 0 : vt * 0.55;
				const glow = isVt ? Math.max(vt, vtPop) : 0;
				const fx = x + 22;
				const fw = CARD.w - 44;
				return (
					<div
						key={m.ticker}
						style={{position: 'absolute', inset: 0, opacity: Math.min(1, e * 1.4) * (1 - dim), transform: `translateY(${(1 - e) * 100}px)`}}
					>
						<FundCard x={x} y={CARD.y} w={CARD.w} h={CARD.h} radius={30} glow={glow}>
							<div style={{position: 'absolute', left: 22, top: 24}}>
								<TickerWord text={m.ticker} fontSize={88} />
								<div style={{fontSize: 32, fontWeight: 800, color: C.body, marginTop: 12, whiteSpace: 'nowrap'}}>{m.desc}</div>
							</div>
						</FundCard>
						<StockTile x={fx} y={TILE_Y[0]} w={fw} h={80} label="Apple" fontSize={38} focus={overlap} />
						<StockTile x={fx} y={TILE_Y[1]} w={fw} h={80} label="Microsoft" fontSize={36} focus={overlap} />
						{/* other holdings, unlabeled: medium (large U.S.), small (smaller U.S.), warm (international) */}
						{[0, 1, 2, 3].map((k) => (
							<StockTile key={`m${k}`} x={fx + (k % 2) * (fw / 2 + 4)} y={CARD.y + 430 + Math.floor(k / 2) * 84} w={fw / 2 - 4} h={72} radius={14} dim={0.3} />
						))}
						{Array.from({length: m.small}).map((_, k) => (
							<StockTile key={`s${k}`} x={fx + (k % 5) * (fw / 5)} y={CARD.y + 610 + Math.floor(k / 5) * 52} w={fw / 5 - 8} h={36} radius={8} dim={0.3} />
						))}
						{Array.from({length: m.intl}).map((_, k) => (
							<StockTile key={`i${k}`} x={fx + (k % 5) * (fw / 5)} y={CARD.y + 662} w={fw / 5 - 8} h={36} radius={8} tint="#3B3527" />
						))}
					</div>
				);
			})}
			{/* L22: the hypothetical one-fund pick */}
			<div style={{position: 'absolute', left: 120, right: 120, top: 1230, textAlign: 'center', opacity: vt, transform: `translateY(${(1 - vt) * 24}px)`}}>
				<Desc text="U.S. + international in one fund." hl={['one', 'fund.']} fontSize={54} />
			</div>
			<Sfx at={tCards[0]} name="card" volume={0.18} />
			<Sfx at={tCards[1]} name="card" volume={0.18} />
			<Sfx at={tCards[2]} name="card" volume={0.18} />
			<Sfx at={tHold + 4} name="chime" volume={0.18} />
		</AbsoluteFill>
	);
};
