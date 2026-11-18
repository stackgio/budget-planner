import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {TickerChip} from '../../../story/components/FundCards';
import {MINI, MINIS, MiniFundCard, RowLine} from './MiniCards';
import {useCues} from '../../../story/lib/cues';
import {E, kf, prog, sp} from '../../../story/lib/motion';
import {TICKERS} from './HookScene';
import {C, Desc, FONT} from './common';

const CARD = {y: 440};

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
			<RowLine y={CARD.y + MINI.appleDy} draw={line} />
			<RowLine y={CARD.y + MINI.msftDy} draw={line} />
			{MINIS.map((m, i) => {
				const e = sp(frame, fps, tCards[i], 'bouncy');
				if (e < 0.01) return null;
				const isVt = m.ticker === 'VT';
				const dim = isVt ? 0 : vt * 0.55;
				return (
					<MiniFundCard
						key={m.ticker}
						m={m}
						x={MINI.xs[i]}
						y={CARD.y}
						apple={overlap}
						msft={overlap}
						glow={isVt ? Math.max(vt, vtPop) : 0}
						opacity={Math.min(1, e * 1.4) * (1 - dim)}
						dy={(1 - e) * 100}
					/>
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
