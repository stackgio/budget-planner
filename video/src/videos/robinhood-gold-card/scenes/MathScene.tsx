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

/** Clean paper receipt, printed downward (`print` 0..1); line items without amounts. */
const SpendReceipt: React.FC<{print: number; items: [string, number][]; out: number}> = ({print, items, out}) => {
	const w = 440;
	const h = 250;
	const zig = Array.from({length: 17}, (_, k) => `L${((w / 16) * (16 - k)).toFixed(1)},${h - (k % 2 ? 0 : 14)}`).join('');
	return (
		<div
			style={{
				position: 'absolute',
				left: 540 - w / 2,
				top: 436,
				width: w,
				height: h,
				clipPath: `inset(0 0 ${(1 - print) * 100}% 0)`,
				opacity: 1 - out,
				transform: `translateY(${-out * 40}px) scale(${1 - 0.15 * out})`,
			}}
		>
			<svg width={w} height={h} style={{position: 'absolute', inset: 0}}>
				<path d={`M0,0H${w}V${h - 14}${zig}Z`} fill="#F5F2EA" />
			</svg>
			<div style={{position: 'absolute', inset: 0, padding: '26px 34px', color: '#121316'}}>
				<div style={{fontSize: 26, fontWeight: 900, letterSpacing: 4, color: '#5B6068'}}>MONTHLY SPEND</div>
				<div style={{borderTop: '3px dashed #C9C2B3', margin: '14px 0 10px'}} />
				{items.map(([label, at]) => (
					<div key={label} style={{display: 'flex', alignItems: 'center', gap: 16, fontSize: 40, fontWeight: 800, lineHeight: 1.5, opacity: at}}>
						<svg width={30} height={30} viewBox="0 0 30 30">
							<path d="M5 16 L12 23 L25 8" fill="none" stroke={P.accentDeep} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
						</svg>
						{label}
					</div>
				))}
			</div>
		</div>
	);
};

/** REWARDS MATH — $2,500/month → receipt → × 3% → $75/month → $900/year, each shown directly on its spoken word. */
export const MathScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();

	const tSpend = cue('L4', 'two');
	const tBills = cue('L4', 'bills');
	const tStuff = cue('L4', 'everyday');
	const tRate = cue('L5', 'three');
	const tProof = cue('L5', 'cashback');
	const tArrow1 = cue('L5', 'looking');
	const t75 = cue('L5', 'seventy-five');
	const tArrow2 = cue('L6', "that's");
	const t900 = cue('L6', 'nine');
	const tBefore = cue('L6', 'before');

	const pA = sp(frame, fps, tSpend, 'snappy');
	const print = kf(frame, [tBills - 3, tBills + 10], [0, 1], E.out);
	const item1 = kf(frame, [tBills, tBills + 6], [0, 1]);
	const item2 = kf(frame, [tStuff, tStuff + 6], [0, 1]);
	const receiptOut = kf(frame, [tRate - 8, tRate], [0, 1], E.in);
	const pB = sp(frame, fps, tRate, 'bouncy');
	const pProof = sp(frame, fps, tProof, 'snappy');
	const pAr1 = kf(frame, [tArrow1, tArrow1 + 8], [0, 1], E.out);
	const p75 = sp(frame, fps, t75, 'heavy');
	const pAr2 = kf(frame, [tArrow2, tArrow2 + 8], [0, 1], E.out);
	const p900 = sp(frame, fps, t900, 'heavy');
	const pBefore = sp(frame, fps, tBefore, 'snappy');
	const dim = kf(frame, [t900, t900 + 10], [0, 1]);
	const glow = kf(frame, [t900 + 4, t900 + 18, t900 + 50], [0, 1, 0.55]);

	const num: React.CSSProperties = {fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: -3};
	const unit: React.CSSProperties = {fontWeight: 800, color: P.body, marginLeft: 6, letterSpacing: -1};

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={1040} light={0.9} warm={false} />
			<Row top={230} p={pA} dim={dim}>
				<span style={{...num, fontSize: 104, color: P.ink}}>{fmt$(FACTS.monthlySpend.value)}</span>
				<span style={{...unit, fontSize: 52}}>/month</span>
			</Row>
			{/* assumption sits right under the figure it qualifies */}
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 352, textAlign: 'center', fontSize: 34, fontWeight: 700, color: P.ink, opacity: 0.88}}>
				Assumes $2,500/month in eligible purchases
			</div>
			{receiptOut < 1 && print > 0 && (
				<SpendReceipt
					print={print}
					out={receiptOut}
					items={[
						['Bills', item1],
						['Everyday stuff', item2],
					]}
				/>
			)}
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
				<span style={{...num, fontSize: 176, color: P.accent, textShadow: `0 0 ${30 * p75}px rgba(44,212,122,0.25)`}}>{fmt$(monthlyCashBack)}</span>
				<span style={{...unit, fontSize: 60}}>/month</span>
			</Row>
			<DownArrow top={902} p={pAr2} />
			<Row top={950} p={p900}>
				<span style={{...num, fontSize: 216, color: P.accent, textShadow: `0 0 ${60 * glow}px rgba(44,212,122,${0.45 * glow})`}}>{fmt$(yearlyCashBack)}</span>
				<span style={{...unit, fontSize: 64}}>/year</span>
			</Row>
			<div style={{position: 'absolute', left: 0, right: 0, top: 1196, textAlign: 'center', fontSize: 40, fontWeight: 800, color: P.ink, opacity: pBefore, transform: `translateY(${mix(16, 0, pBefore)}px)`}}>
				Before Gold membership cost
			</div>
			<Sfx at={tBills - 2} name="paper" volume={0.3} />
			<Sfx at={cue('L5', 'month', 0, 'end') + 2} name="coin" volume={0.32} />
			<Sfx at={cue('L6', 'year', 0, 'end') + 2} name="cash" volume={0.35} />
		</AbsoluteFill>
	);
};
