import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {TickerChip} from '../../../story/components/FundCards';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {C, FONT} from './common';

export const TICKERS = ['VOO', 'VTI', 'VT', 'VXUS', 'SCHD'];

/** HOOK — title + all five tickers readable on frame 0; voice starts on "New to investing?". */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tFive = cue('L2', 'five');
	const tBuy = cue('L2', 'buying');
	const pulse = sp(frame, fps, tFive, 'bouncy') - sp(frame, fps, tFive + 8, 'smooth');
	const rows = [TICKERS.slice(0, 3), TICKERS.slice(3)];
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<CinematicBg lightX={540} lightY={640} />
			{/* title */}
			<div style={{position: 'absolute', left: 120, right: 120, top: 250, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 28}}>
					<div style={{fontSize: 400, fontWeight: 900, lineHeight: 0.9, color: C.accent, letterSpacing: -16, transform: `scale(${1 + 0.08 * pulse})`, transformOrigin: '50% 70%'}}>5</div>
					<div style={{fontSize: 190, fontWeight: 900, lineHeight: 0.9, color: C.ink, letterSpacing: -6}}>ETFs</div>
				</div>
				<div style={{fontSize: 104, fontWeight: 900, color: C.ink, letterSpacing: -3, marginTop: 18}}>for Beginners</div>
			</div>
			{/* five tickers: already on screen at frame 0, settle within ~0.4 s */}
			<div style={{position: 'absolute', left: 120, right: 120, top: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28}}>
				{rows.map((row, r) => (
					<div key={r} style={{display: 'flex', gap: 28}}>
						{row.map((t, i) => {
							const k = r * 3 + i;
							const e = sp(frame, fps, -7 + k * 2, 'snappy');
							const act = kf(frame, [tBuy + k * 3, tBuy + k * 3 + 6], [0, 1], E.out) * kf(frame, [tBuy + k * 3 + 14, tBuy + k * 3 + 26], [1, 0.35]);
							return <TickerChip key={t} ticker={t} fontSize={84} active={act} style={{transform: `translateY(${(1 - e) * 40}px)`, opacity: Math.min(1, 0.55 + e)}} />;
						})}
					</div>
				))}
			</div>
			<Sfx at={tBuy} name="tick" volume={0.2} />
		</AbsoluteFill>
	);
};
