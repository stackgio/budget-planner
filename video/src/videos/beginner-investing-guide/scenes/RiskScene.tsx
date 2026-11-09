import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {BrandBg, FONT, L, P} from '../ui';

/** Illustrative up-and-down path (NOT market data — labelled on screen). */
const PTS = [0.55, 0.5, 0.58, 0.46, 0.4, 0.52, 0.62, 0.48, 0.66, 0.74, 0.6, 0.38, 0.3, 0.42, 0.36, 0.5, 0.58, 0.52, 0.64];

const Check: React.FC<{p: number}> = ({p}) => (
	<div style={{width: 64, height: 64, flex: 'none', borderRadius: 18, background: p > 0.5 ? P.accent : 'transparent', border: `3px solid ${p > 0.05 ? P.accent : P.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
		<svg width={38} height={38} viewBox="0 0 40 40">
			<path d="M9 21l7 7 15-16" fill="none" stroke={P.bg} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={40} strokeDashoffset={40 * (1 - p)} />
		</svg>
	</div>
);

/** RISK — honest, calm: prices go both ways; cover the basics first. */
export const RiskScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tRisk = cue('L26', 'risk');
	const tLose = cue('L26', 'lose');
	const tBills = cue('L27', 'bills');
	const tEmerg = cue('L27', 'emergency');
	const tFirst = cue('L27', 'first', -0.3);
	const draw = kf(frame, [4, tLose + 10], [0, 1], E.inOut);
	const cx = L;
	const cw = 888;
	const cy = 560;
	const ch = 330;
	const pts = PTS.map((v, i) => [cx + (i * cw) / (PTS.length - 1), cy + (1 - v) * ch] as const);
	const nShow = draw * (PTS.length - 1);
	const segs: React.ReactNode[] = [];
	for (let i = 0; i < PTS.length - 1; i++) {
		const f = Math.max(0, Math.min(1, nShow - i));
		if (f <= 0) break;
		const [x0, y0] = pts[i];
		const [x1, y1] = pts[i + 1];
		const down = PTS[i + 1] < PTS[i];
		segs.push(<line key={i} x1={x0} y1={y0} x2={x0 + (x1 - x0) * f} y2={y0 + (y1 - y0) * f} stroke={down ? P.danger : P.accent} strokeWidth={7} strokeLinecap="round" />);
	}
	const items = [
		{t: tBills, text: 'Bills first'},
		{t: tEmerg, text: 'Emergency savings'},
		{t: tFirst, text: 'Invest what fits your budget'},
	];
	const listIn = sp(frame, fps, tBills - 8, 'smooth');
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={700} glow={0.7} />
			<div style={{position: 'absolute', left: L, top: 190, right: 120}}>
				<KineticText text="INVESTMENTS CAN LOSE VALUE" at={tRisk - 6} fontSize={92} color={P.ink} colors={{lose: P.danger, value: P.danger}} />
			</div>
			<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
				<line x1={cx} y1={cy + ch * 0.5} x2={cx + cw} y2={cy + ch * 0.5} stroke={P.line} strokeWidth={2} strokeDasharray="8 10" />
				{segs}
				<text x={cx} y={cy + ch + 46} fontFamily={FONT} fontSize={25} fontWeight={800} letterSpacing={3} fill={P.muted} opacity={draw > 0.1 ? 1 : 0}>
					ILLUSTRATION ONLY · NOT REAL DATA
				</text>
			</svg>
			<div style={{position: 'absolute', left: L, right: 120, top: 1000, display: 'flex', flexDirection: 'column', gap: 26, opacity: listIn}}>
				{items.map((it) => {
					const p = sp(frame, fps, it.t, 'snappy');
					return (
						<div key={it.text} style={{display: 'flex', alignItems: 'center', gap: 24, opacity: 0.35 + 0.65 * Math.min(1, p * 1.4), transform: `translateX(${(1 - p) * 24}px)`}}>
							<Check p={p} />
							<div style={{fontSize: 48, fontWeight: 900, color: P.ink, letterSpacing: -0.5}}>{it.text}</div>
						</div>
					);
				})}
			</div>
			{items.map((it) => (
				<Sfx key={it.text} at={it.t} name="tick" volume={0.2} />
			))}
		</AbsoluteFill>
	);
};
