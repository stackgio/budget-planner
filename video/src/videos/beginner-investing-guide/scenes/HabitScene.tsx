import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {exampleTotal, FACTS} from '../facts';
import {BrandBg, ExampleTag, FONT, L, Label, P, StepTag, useIn} from '../ui';

/**
 * 07 · HABIT — contributions only (no fictional returns). Illustrative example,
 * labelled EXAMPLE: $10 on each of 4 paychecks = $40 contributed.
 */
export const HabitScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const inn = useIn();
	const amounts = [
		{v: '$5', t: cue('L25', 'five')},
		{v: '$10', t: cue('L25', 'ten')},
		{v: '$20', t: cue('L25', 'twenty')},
	];
	const tPay = cue('L25', 'paycheck', -0.1);
	const tGoal = cue('L25', 'goal');
	const tHabit = cue('L25', 'habit');
	const n = FACTS.examplePaychecks.value;
	const per = FACTS.examplePerPaycheck.value;
	const span = Math.max(24, tHabit - tPay);
	const nodeT = (i: number) => tPay + (i * span) / n;
	const reached = (i: number) => kf(frame, [nodeT(i), nodeT(i) + 8], [0, 1]);
	const total = Array.from({length: n}).reduce<number>((s, _, i) => s + per * reached(i), 0);
	const xs = Array.from({length: n}).map((_, i) => 150 + (i * (930 - 150)) / (n - 1));
	const lineP = kf(frame, [tPay, tPay + span], [0, 1], E.inOut);
	const habitP = sp(frame, fps, tHabit, 'bouncy');
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={900} />
			<StepTag n="06" label="CONSISTENCY" at={2} style={{left: L, top: 190}} />
			<div style={{position: 'absolute', left: L, top: 300, right: 120}}>
				<KineticText text="FOCUS ON CONSISTENCY" at={cue('L24', 'focus') - 4} fontSize={92} color={P.ink} colors={{consistency: P.accent}} />
			</div>
			{/* $5 · $10 · $20 */}
			<div style={{position: 'absolute', left: L, top: 540, display: 'flex', gap: 22}}>
				{amounts.map((a) => {
					const p = sp(frame, fps, a.t - 2, 'bouncy');
					return (
						<div key={a.v} style={{width: 170, height: 96, borderRadius: 24, border: `3px solid ${P.line}`, background: P.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, fontWeight: 900, color: P.ink, opacity: Math.min(1, p * 1.5), transform: `scale(${0.6 + 0.4 * p})`}}>
							{a.v}
						</div>
					);
				})}
				<div style={{alignSelf: 'center', fontSize: 30, fontWeight: 800, color: P.muted, letterSpacing: 2, ...inn(amounts[2].t + 6)}}>/ PAYCHECK</div>
			</div>
			{/* timeline */}
			<ExampleTag style={{left: L, top: 712, ...inn(tPay - 6)}} />
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<line x1={xs[0]} y1={880} x2={xs[n - 1]} y2={880} stroke={P.line} strokeWidth={6} strokeLinecap="round" />
				<line x1={xs[0]} y1={880} x2={xs[0] + (xs[n - 1] - xs[0]) * lineP} y2={880} stroke={P.accent} strokeWidth={6} strokeLinecap="round" />
			</svg>
			{xs.map((x, i) => {
				const p = sp(frame, fps, nodeT(i), 'bouncy');
				const r = reached(i);
				return (
					<React.Fragment key={i}>
						<div style={{position: 'absolute', left: x - 26, top: 854, width: 52, height: 52, borderRadius: 26, background: r > 0.5 ? P.accent : P.bg, border: `5px solid ${r > 0.05 ? P.accent : P.line}`, boxSizing: 'border-box'}} />
						<div style={{position: 'absolute', left: x - 100, width: 200, top: 790, textAlign: 'center', fontSize: 24, fontWeight: 800, letterSpacing: 2, color: P.muted, opacity: Math.min(1, p * 1.5)}}>PAYCHECK {i + 1}</div>
						<div style={{position: 'absolute', left: x - 70, width: 140, top: 930, textAlign: 'center', fontSize: 46, fontWeight: 900, color: P.accent, opacity: Math.min(1, p * 1.5), transform: `translateY(${(1 - p) * -30}px)`}}>
							+${per}
						</div>
					</React.Fragment>
				);
			})}
			{/* total contributed */}
			<div style={{position: 'absolute', left: L, right: 120, top: 1060, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 34px', borderRadius: 30, background: P.paper, border: `3px solid ${total >= exampleTotal ? P.accent : P.line}`, ...inn(tPay + 4)}}>
				<Label size={28} color={P.body}>Total contributed</Label>
				<NumberCounter value={total} fontSize={84} color={P.ink} minDigits={2} />
			</div>
			<div style={{position: 'absolute', left: L, right: 120, top: 1250, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
				<div style={{fontSize: 40, fontWeight: 900, color: P.ink, opacity: Math.min(1, habitP * 1.5), transform: `translateY(${(1 - habitP) * 20}px)`}}>
					Build the <span style={{color: P.accent}}>habit</span>
				</div>
				<div style={{fontSize: 24, fontWeight: 700, color: P.muted, opacity: kf(frame, [tGoal, tGoal + 10], [0, 1])}}>Contributions only — no returns</div>
			</div>
			{xs.map((_, i) => (
				<Sfx key={i} at={nodeT(i)} name="tick" volume={0.2} />
			))}
		</AbsoluteFill>
	);
};
