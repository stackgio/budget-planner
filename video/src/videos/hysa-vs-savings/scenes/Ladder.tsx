import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {CashStack} from '../../../story/components/Money';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {E, kf, sp} from '../../../story/lib/motion';
import {story, type Palette} from '../../../story/theme';
import {LADDER} from '../layout';

/**
 * Year-by-year balance ladder: three cash stacks on a shelf with the balance
 * under each. `counts` = bill layers per year (flat for the big bank, growing
 * for the HYSA). Balances count up from the deposit when `countUp` is set.
 */
export const Ladder: React.FC<{
	at: number;
	palette: Palette;
	counts: number[];
	balances: number[];
	deposit: number;
	cents?: boolean;
	tone: string;
	countUp?: boolean;
	dark?: boolean;
	exampleLabel?: boolean;
}> = ({at, palette: P, counts, balances, deposit, cents, tone, countUp, dark, exampleLabel = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const card = sp(frame, fps, at - 4, 'smooth');
	const colW = LADDER.w / 3;
	return (
		<div
			style={{
				position: 'absolute',
				left: LADDER.x,
				top: LADDER.y,
				width: LADDER.w,
				height: LADDER.h,
				borderRadius: 36,
				background: dark ? '#15171B' : P.paper,
				border: `3px solid ${dark ? '#2A2E35' : P.line}`,
				boxShadow: `0 24px 50px -24px ${P.shadow}`,
				opacity: card,
				transform: `translateY(${(1 - card) * 40}px)`,
				fontFamily: story.font,
			}}
		>
			{exampleLabel && (
				<div style={{position: 'absolute', right: 26, top: -22, background: P.ink, color: P.bg, fontSize: 24, fontWeight: 900, letterSpacing: 3, padding: '6px 14px', borderRadius: 10}}>
					EXAMPLE
				</div>
			)}
			{/* shelf */}
			<div style={{position: 'absolute', left: 30, right: 30, top: 190, height: 5, borderRadius: 3, background: dark ? '#3A3F47' : P.ink, opacity: 0.85}} />
			{counts.map((n, i) => {
				const t0 = at + i * 6;
				const p = sp(frame, fps, t0, 'bouncy');
				const grow = kf(frame, [t0, t0 + 18], [0, 1], E.out);
				const shown = Math.max(1, Math.round(1 + (n - 1) * grow));
				const v = countUp ? deposit + (balances[i] - deposit) * kf(frame, [t0 + 2, t0 + 22], [0, 1], E.out) : balances[i];
				const cx = colW * i + colW / 2;
				return (
					<div key={i} style={{position: 'absolute', left: cx - colW / 2, width: colW, top: 0, height: LADDER.h, opacity: Math.min(1, p * 1.4)}}>
						<CashStack w={150} count={shown} style={{left: colW / 2, top: 188, transform: `translate(-50%,-100%) scale(${0.6 + 0.4 * p})`, transformOrigin: '50% 100%'}} />
						<div style={{position: 'absolute', top: 212, width: '100%', textAlign: 'center', fontSize: 26, fontWeight: 800, letterSpacing: 3, color: P.muted}}>YEAR {i + 1}</div>
						<div style={{position: 'absolute', top: 248, width: '100%', display: 'flex', justifyContent: 'center'}}>
							{cents ? (
								<span style={{fontSize: 44, fontWeight: 900, color: tone, letterSpacing: -1}}>
									${v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
								</span>
							) : (
								<NumberCounter value={Math.round(v)} fontSize={48} color={tone} roll={false} style={{letterSpacing: -1}} />
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
};
