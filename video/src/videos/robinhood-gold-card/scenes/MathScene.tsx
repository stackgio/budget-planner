import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {ScreenshotCrop} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {PREAPPROVAL} from '../assets';
import {FACTS, fmt$, monthlyCashBack, yearlyCashBack} from '../facts';

const Row: React.FC<{top: number; p: number; dim?: number; children: React.ReactNode}> = ({top, p, dim = 0, children}) => (
	<div
		style={{
			position: 'absolute',
			left: 0,
			right: 0,
			top,
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'baseline',
			opacity: Math.min(1, p * 1.6) * (1 - 0.55 * dim),
			transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})`,
		}}
	>
		{children}
	</div>
);

const DownArrow: React.FC<{top: number; p: number}> = ({top, p}) => (
	<svg width={60} height={56} viewBox="0 0 60 56" style={{position: 'absolute', left: 510, top, opacity: p}}>
		<path d={`M30 4 V${4 + 40 * p}`} stroke={P.muted} strokeWidth={6} strokeLinecap="round" />
		<path d="M14 34 L30 50 L46 34" fill="none" stroke={P.muted} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={p > 0.6 ? 1 : 0} />
	</svg>
);

/** REWARDS MATH — $2,500/month × 3% → $75/month → $900/year, each figure on its spoken word. */
export const MathScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();

	const tSpend = cue('L4', 'two');
	const tSpendEnd = cue('L4', 'dollars', 0, 'end');
	const tRate = cue('L5', 'three');
	const tProof = cue('L5', 'cashback');
	const tArrow1 = cue('L5', 'looking');
	const t75 = cue('L5', 'seventy-five');
	const t75End = cue('L5', 'dollars', 0, 'end');
	const tArrow2 = cue('L6', "that's");
	const t900 = cue('L6', 'nine');
	const t900End = cue('L6', 'dollars', 0, 'end');
	const tBefore = cue('L6', 'before');

	const pA = sp(frame, fps, tSpend, 'snappy');
	const vA = FACTS.monthlySpend.value * kf(frame, [tSpend, tSpendEnd], [0.4, 1], E.out);
	const pB = sp(frame, fps, tRate - 2, 'bouncy');
	const pProof = sp(frame, fps, tProof, 'snappy');
	const pAr1 = kf(frame, [tArrow1, tArrow1 + 8], [0, 1], E.out);
	const p75 = sp(frame, fps, t75, 'heavy');
	const v75 = monthlyCashBack * kf(frame, [t75, t75End], [0.4, 1], E.out);
	const pAr2 = kf(frame, [tArrow2, tArrow2 + 8], [0, 1], E.out);
	const p900 = sp(frame, fps, t900, 'heavy');
	const v900 = yearlyCashBack * kf(frame, [t900, t900End], [0.4, 1], E.out);
	const pBefore = sp(frame, fps, tBefore, 'snappy');
	const dim = kf(frame, [t900, t900 + 10], [0, 1]);
	const glow = kf(frame, [t900End - 4, t900End + 10, t900End + 40], [0, 1, 0.55]);

	const num: React.CSSProperties = {fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: -3};
	const unit: React.CSSProperties = {fontWeight: 800, color: P.body, marginLeft: 6, letterSpacing: -1};

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={1040} light={0.9} warm={false} />
			{/* footnote: readable for the whole math beat */}
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: story.safe.top + 14, textAlign: 'center', fontSize: 31, fontWeight: 700, lineHeight: 1.3, color: P.body}}>
				<span style={{color: P.ink, fontWeight: 900, letterSpacing: 2}}>Estimated</span> • assumes $2,500/month in eligible purchases
			</div>
			<>
				<Row top={300} p={pA} dim={dim}>
					<span style={{...num, fontSize: 104, color: P.ink}}>{fmt$(vA)}</span>
					<span style={{...unit, fontSize: 52}}>/month</span>
				</Row>
				<Row top={420} p={pB} dim={dim}>
					<span style={{...num, fontSize: 104, color: P.ink}}>
						<span style={{color: P.muted}}>× </span>
						{Math.round(FACTS.cashBackRate.value * 100)}%
					</span>
				</Row>
				{/* real preapproval email line, illustrating the 3% */}
				<div style={{position: 'absolute', left: 540 - 270, top: 552 + (1 - pProof) * 20, opacity: pProof * (1 - 0.6 * dim)}}>
					<ScreenshotCrop src={PREAPPROVAL.src} natural={PREAPPROVAL.natural} region={PREAPPROVAL.rate} w={540} radius={14} style={{position: 'relative', border: `2px solid ${P.line}`}} />
				</div>
				<DownArrow top={652} p={pAr1} />
				<Row top={706} p={p75}>
					<span style={{...num, fontSize: 176, color: P.accent, textShadow: `0 0 ${30 * p75}px rgba(44,212,122,0.25)`}}>{fmt$(v75)}</span>
					<span style={{...unit, fontSize: 60}}>/month</span>
				</Row>
				<DownArrow top={902} p={pAr2} />
				<Row top={950} p={p900}>
					<span style={{...num, fontSize: 216, color: P.accent, textShadow: `0 0 ${60 * glow}px rgba(44,212,122,${0.45 * glow})`}}>{fmt$(v900)}</span>
					<span style={{...unit, fontSize: 64}}>/year</span>
				</Row>
				<div style={{position: 'absolute', left: 0, right: 0, top: 1196, textAlign: 'center', fontSize: 40, fontWeight: 800, color: P.ink, opacity: pBefore, transform: `translateY(${mix(16, 0, pBefore)}px)`}}>
					Before Gold membership cost
				</div>
			</>
			<Sfx at={tSpendEnd + 2} name="tick" volume={0.3} />
			<Sfx at={t75End + 2} name="coin" volume={0.35} />
			<Sfx at={t900End + 2} name="cash" volume={0.38} />
		</AbsoluteFill>
	);
};
