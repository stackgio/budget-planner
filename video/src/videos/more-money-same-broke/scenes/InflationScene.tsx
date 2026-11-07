import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {kf, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {usd} from '../facts';
import {Kicker} from '../props';

const BASE = 1250;
const BW = 230;
const BARS = {income: 230, spend: 590};
/** illustrative heights (no values shown): start, step 1, step 2 */
const H = [300, 460, 620];
/** shared with RealizeScene so the title survives the match cut */
export const LIFESTYLE_TITLE: React.CSSProperties = {position: 'absolute', left: story.safe.left, top: story.safe.top + 20, right: story.safe.right};

/**
 * LIFESTYLE INFLATION — "That's called lifestyle inflation. Basically, every
 * time you make more money, you find new ways to spend it."
 * Two bars: income steps up, spending steps up right behind it. The gap
 * (money left) never opens. Deliberately unlabelled: the shape is the lesson.
 */
export const InflationScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tStart = cue('L10', 'Basically');
	const tTime = cue('L10', 'every');
	const tMoney = cue('L10', 'more');
	const tFind2 = cue('L10', 'find');
	const tWays = cue('L10', 'ways');

	const rise = sp(frame, fps, tStart - 6, 'smooth');
	const step = (t: number) => sp(frame, fps, t - 2, 'heavy');
	const hInc = H[0] * rise + (H[1] - H[0]) * step(tTime) + (H[2] - H[1]) * step(tMoney);
	const hSp = H[0] * rise + (H[1] - H[0]) * step(tFind2) + (H[2] - H[1]) * step(tWays);
	const zeroPill = sp(frame, fps, tFind2 - 4, 'bouncy');
	const flash = (t: number) => kf(frame, [t, t + 4, t + 18], [0, 1, 0]);

	const bar = (x: number, h: number, color: string, label: string, flashes: number[]) => {
		const f = Math.max(...flashes.map(flash));
		return (
			<>
				<div style={{position: 'absolute', left: x, top: BASE - h, width: BW, height: h, borderRadius: '24px 24px 0 0', background: color, boxShadow: `0 0 ${50 * f}px ${color}`}} />
				<svg width={60} height={50} viewBox="0 0 60 50" style={{position: 'absolute', left: x + BW / 2 - 30, top: BASE - h - 70, opacity: f}}>
					<path d="M30,46V8M12,24L30,6L48,24" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
				</svg>
				<Kicker color={color} style={{position: 'absolute', left: x + BW / 2, top: BASE + 22, transform: 'translateX(-50%)', opacity: rise}}>
					{label}
				</Kicker>
			</>
		);
	};

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={900} warm={false} />
			<div style={LIFESTYLE_TITLE}>
				<KineticText text="LIFESTYLE" at={-30} mode="none" fontSize={108} color={P.ink} />
				<KineticText text="INFLATION" at={-30} mode="none" fontSize={108} color={P.danger} />
			</div>
			<div style={{position: 'absolute', left: 120, right: 120, top: BASE, height: 3, background: P.line}} />
			{bar(BARS.income, hInc, P.accent, 'Income', [tTime, tMoney])}
			{bar(BARS.spend, hSp, P.danger, 'Spending', [tFind2, tWays])}
			{/* the gap that never opens */}
			<div
				style={{
					position: 'absolute',
					left: 540 - 180,
					top: 432,
					width: 360,
					textAlign: 'center',
					background: P.paper,
					border: `2px solid ${P.line}`,
					borderRadius: 20,
					padding: '12px 0',
					opacity: Math.min(1, zeroPill * 1.4),
					transform: `scale(${zeroPill})`,
				}}
			>
				<Kicker color={P.muted} size={26}>Left over</Kicker>
				<div style={{fontSize: 72, fontWeight: 900, color: P.ink, lineHeight: 1.05}}>{usd(0)}</div>
			</div>
			<Sfx at={tTime} name="tick" volume={0.35} />
			<Sfx at={tMoney} name="tick" volume={0.35} />
			<Sfx at={tFind2} name="tick" volume={0.3} />
			<Sfx at={tWays} name="tick" volume={0.3} />
			<Sfx at={tFind2 - 4} name="pop" volume={0.3} />
		</AbsoluteFill>
	);
};
