import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {MINI, MINIS, MiniFundCard, RowLine} from './MiniCards';
import {C, FONT} from './common';

export const TICKERS = ['VOO', 'VTI', 'VT', 'VXUS', 'SCHD'];

const CARDS_Y = 640;
const CARDS_H = 720;

/**
 * HOOK — "5 ETFs for Beginners" on frame 0, with a preview of the payoff:
 * the VOO, VTI and VT cards, Apple lit in all three. Voice starts on "New to investing?".
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tFive = cue('L2', 'five');
	const tBuy = cue('L2', 'buying');
	const pulse = sp(frame, fps, tFive, 'bouncy') - sp(frame, fps, tFive + 8, 'smooth');
	// Apple is already lit on frame 0; the line through the three cards draws in over ~0.4 s
	const line = kf(frame, [0, 12], [0.15, 1], E.out);
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<CinematicBg lightX={540} lightY={760} />
			{/* headline */}
			<div style={{position: 'absolute', left: 120, right: 120, top: 176, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 22}}>
					<div style={{fontSize: 300, fontWeight: 900, lineHeight: 0.9, color: C.accent, letterSpacing: -12, transform: `scale(${1 + 0.08 * pulse})`, transformOrigin: '50% 70%'}}>5</div>
					<div style={{fontSize: 156, fontWeight: 900, lineHeight: 0.9, color: C.ink, letterSpacing: -5}}>ETFs</div>
				</div>
				<div style={{fontSize: 92, fontWeight: 900, color: C.ink, letterSpacing: -3, marginTop: 14}}>for Beginners</div>
			</div>
			{/* preview: the same cards as the payoff, Apple in all three */}
			<RowLine y={CARDS_Y + MINI.appleDy} draw={line} />
			{MINIS.map((m, i) => {
				const e = sp(frame, fps, -9 + i * 2, 'snappy');
				const sweep = kf(frame, [tBuy + i * 4, tBuy + i * 4 + 6, tBuy + i * 4 + 22], [0, 0.8, 0], E.out);
				return <MiniFundCard key={m.ticker} m={m} x={MINI.xs[i]} y={CARDS_Y} h={CARDS_H} apple={1} glow={sweep} opacity={Math.min(1, 0.6 + e)} dy={(1 - e) * 40} />;
			})}
			<Sfx at={tBuy} name="tick" volume={0.2} />
		</AbsoluteFill>
	);
};
