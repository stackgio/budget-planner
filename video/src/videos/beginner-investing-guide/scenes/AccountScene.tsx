import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {BrandBg, FONT, L, Label, P, StepTag} from '../ui';

type IconName = 'unlock' | 'tax' | 'clock' | 'shield' | 'rules';
const Icon: React.FC<{name: IconName; color: string; size?: number}> = ({name, color, size = 52}) => {
	const s = {fill: 'none', stroke: color, strokeWidth: 3.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	return (
		<svg width={size} height={size} viewBox="0 0 40 40">
			{name === 'unlock' && (
				<>
					<rect x="8" y="18" width="24" height="17" rx="4" {...s} />
					<path d="M14 18v-5a6 6 0 0 1 11.5-2.4" {...s} />
					<circle cx="20" cy="26.5" r="2" fill={color} />
				</>
			)}
			{name === 'tax' && (
				<>
					<path d="M10 5h20v30l-4-3-3 3-3-3-3 3-3-3-4 3z" {...s} />
					<path d="M15 23l10-10" {...s} />
					<circle cx="15.5" cy="14" r="1.8" fill={color} />
					<circle cx="24.5" cy="22" r="1.8" fill={color} />
				</>
			)}
			{name === 'clock' && (
				<>
					<circle cx="20" cy="20" r="14" {...s} />
					<path d="M20 12v8l5 4" {...s} />
				</>
			)}
			{name === 'shield' && (
				<>
					<path d="M20 5l12 5v9c0 8-5.5 13-12 16C13.5 32 8 27 8 19v-9z" {...s} />
					<path d="M14.5 20l4 4 7-8" {...s} />
				</>
			)}
			{name === 'rules' && (
				<>
					<rect x="9" y="5" width="22" height="30" rx="3" {...s} />
					<path d="M14 13h12M14 19h12M14 25h7" {...s} />
				</>
			)}
		</svg>
	);
};

const Row: React.FC<{icon: IconName; text: React.ReactNode; at: number; tone?: string}> = ({icon, text, at, tone = P.accent}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, at, 'snappy');
	return (
		<div style={{display: 'flex', alignItems: 'flex-start', gap: 18, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * 30}px)`}}>
			<div style={{width: 72, height: 72, flex: 'none', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: `2px solid ${P.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Icon name={icon} color={tone} />
			</div>
			<div style={{fontSize: 34, fontWeight: 800, color: P.ink, lineHeight: 1.15, paddingTop: 2}}>{text}</div>
		</div>
	);
};

/**
 * 02 · ACCOUNT — side-by-side, neither "better". Each card wakes up while it's
 * being described; facts reveal on the words that state them.
 */
export const AccountScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tCards = cue('L7', 'account', -0.3);
	const tBro = cue('L8', 'brokerage', -0.2);
	const tFlex = cue('L8', 'flexibility');
	const tTax = cue('L8', 'taxes');
	const tRoth = cue('L9', 'Roth', -0.2);
	const tRet = cue('L9', 'retirement');
	const tQual = cue('L10', 'qualified');
	const tRules = cue('L11', 'contribution');
	const left = sp(frame, fps, tCards, 'bouncy');
	const right = sp(frame, fps, tCards + 5, 'bouncy');
	// focus: 0 = none, 1 = brokerage, 2 = roth, then both settle at the end
	const fBro = kf(frame, [tBro - 6, tBro + 8, tRoth - 8, tRoth + 6], [0, 1, 1, 0]);
	const fRoth = kf(frame, [tRoth - 6, tRoth + 8], [0, 1]);
	const settle = kf(frame, [tRules + 40, tRules + 56], [0, 1]);
	const W = 438;
	const card = (focus: number, other: number): React.CSSProperties => ({
		position: 'absolute',
		top: 560,
		width: W,
		height: 760,
		borderRadius: 36,
		padding: '36px 30px',
		boxSizing: 'border-box',
		background: P.paper,
		border: `3px solid ${focus > 0.5 ? P.accent : P.line}`,
		boxShadow: focus > 0 ? `0 0 ${50 * focus}px rgba(57,255,20,${0.18 * focus})` : 'none',
		opacity: 1 - 0.55 * other * (1 - settle),
		display: 'flex',
		flexDirection: 'column',
		gap: 30,
	});
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowX={300 + 480 * fRoth} glowY={900} />
			<StepTag n="02" label="ACCOUNT" at={2} style={{left: L, top: 190}} />
			<div style={{position: 'absolute', left: L, top: 310, right: 120}}>
				<KineticText text="CHOOSE YOUR ACCOUNT" at={4} fontSize={92} color={P.ink} colors={{account: P.accent}} />
			</div>
			{/* LEFT — regular brokerage */}
			<div style={{...card(fBro, fRoth), left: L, transform: `translateY(${(1 - left) * 120}px) scale(${1 + 0.02 * fBro})`}}>
				<div>
					<Label color={P.muted} size={24}>Regular</Label>
					<div style={{fontSize: 52, fontWeight: 900, color: P.ink, letterSpacing: -1, lineHeight: 1.02, marginTop: 6}}>BROKERAGE</div>
				</div>
				<div style={{height: 2, background: P.line}} />
				<Row icon="unlock" at={tFlex} text={<>Flexible <span style={{color: P.accent}}>access</span></>} />
				<Row icon="tax" at={tTax} tone={P.gold} text={<>Taxes may apply on <span style={{color: P.gold}}>gains</span></>} />
			</div>
			{/* RIGHT — Roth IRA */}
			<div style={{...card(fRoth, fBro), left: 1080 - 120 - W, transform: `translateY(${(1 - right) * 120}px) scale(${1 + 0.02 * fRoth})`}}>
				<div>
					<Label color={P.muted} size={24}>Retirement</Label>
					<div style={{fontSize: 52, fontWeight: 900, color: P.ink, letterSpacing: -1, lineHeight: 1.02, marginTop: 6}}>ROTH IRA</div>
				</div>
				<div style={{height: 2, background: P.line}} />
				<Row icon="clock" at={tRet} text={<>Designed for <span style={{color: P.accent}}>retirement</span></>} />
				<Row icon="shield" at={tQual} text={<><span style={{color: P.accent}}>Qualified</span> withdrawals tax-free</>} />
				<Row icon="rules" at={tRules} tone={P.gold} text={<>Contribution &amp; withdrawal <span style={{color: P.gold}}>rules apply</span></>} />
			</div>
			<div style={{position: 'absolute', left: L, right: 120, top: 1342, textAlign: 'center', fontSize: 26, fontWeight: 700, color: P.muted, opacity: settle}}>
				Different goals — neither is “better”
			</div>
			<Sfx at={tCards} name="card" volume={0.3} />
			<Sfx at={tRoth} name="whoosh-soft" volume={0.22} />
		</AbsoluteFill>
	);
};
