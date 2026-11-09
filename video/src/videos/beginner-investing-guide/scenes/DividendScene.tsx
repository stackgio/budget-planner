import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {recView, ScreenRecording, type RecRect} from '../../../story/components/ScreenRecording';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {DIV_DATES, FACTS} from '../facts';
import {BrandBg, FONT, L, Label, Num, P, Pill, useIn} from '../ui';

const DIV = {src: 'motion/beginner-investing-guide/assets/voo-dividend.png', natural: {w: 1206, h: 2622}};
const DRIP = {src: 'motion/beginner-investing-guide/assets/drip-enabled.jpg', natural: {w: 1206, h: 744}};
/** regions on the real screenshots (natural px) */
const ROI = {
	header: {x: 50, y: 300, w: 560, h: 230},
	reinvestStep: {x: 50, y: 1420, w: 680, h: 160},
	reinvestAmount: {x: 50, y: 2215, w: 700, h: 150},
	enabled: {x: 55, y: 128, w: 290, h: 104},
};

const PW = 470; // proof viewport
const PH = 1050;
const PT = 300;
const pv = (y: number, w: number, x = 0): RecRect => ({x, y, w, h: (w * PH) / PW});

/**
 * REAL DIVIDEND PROOF + DRIP SETTING — both screenshots untouched; numbers
 * beside them come from facts.ts and match the screenshots exactly.
 */
export const DividendScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const inn = useIn();
	const tBegin = cue('L22', 'beginning');
	const tTurn = cue('L23', 'turn', -0.1);
	const tReinv = cue('L23', 'reinvestment');
	const tElig = cue('L23', 'eligible', -0.1);
	const tAuto = cue('L23', 'automatically');
	const tMore = cue('L23', 'more');
	// proof camera: full → header ($5.35) → reinvestment block
	const view = recView(frame, [
		{at: 0, v: pv(30, 1206)},
		{at: 10, v: pv(30, 1206)},
		{at: 30, v: pv(220, 720)},
		{at: tElig - 2, v: pv(220, 720)},
		{at: tElig + 14, v: pv(1330, 780, 0)},
	]);
	const markHeader = kf(frame, [24, 34, tTurn - 4, tTurn + 4], [0, 1, 1, 0]);
	const markReinv = kf(frame, [tElig + 10, tElig + 20], [0, 1]);
	// DRIP card: big overlay → docked top-right
	const dripIn = sp(frame, fps, tTurn, 'bouncy');
	const dock = kf(frame, [tElig, tElig + 16], [0, 1], E.inOut);
	const dripW = mix(900, 380, dock);
	const dripX = mix(90, 580, dock);
	const dripY = mix(720, PT, dock);
	const dripH = (dripW * DRIP.natural.h) / DRIP.natural.w;
	const markEnabled = kf(frame, [tReinv - 2, tReinv + 8], [0, 1]);
	const backdrop = kf(frame, [tTurn, tTurn + 8, tElig, tElig + 12], [0, 0.93, 0.93, 0]);
	// right column: $5.35 first, then the flow chain
	const amountOut = kf(frame, [tTurn - 6, tTurn + 4], [1, 0]);
	const amtP = kf(frame, [12, 34], [0, 1], E.out);
	const chain = [
		{t: tElig + 8, text: <>VOO pays a dividend</>},
		{t: tElig + 16, text: <><G>${FACTS.dividendTotal.value.toFixed(2)}</G> received</>},
		{t: tAuto, text: <>Automatically reinvested</>},
		{t: tMore - 4, text: <><G>+{FACTS.reinvestShares.value}</G> VOO shares</>, hero: true},
	];
	const RX = 580;
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowX={300} glowY={700} />
			<div style={{position: 'absolute', left: L, top: 186, display: 'flex', gap: 14, alignItems: 'center', ...inn(0)}}>
				<Pill tone="accent" size={26}>
					05 · My real dividend
				</Pill>
			</div>
			{/* proof */}
			<div style={{position: 'absolute', left: L, top: PT, width: PW, height: PH, borderRadius: 36, boxShadow: `0 0 0 2px ${P.line}, 0 40px 80px rgba(0,0,0,0.7)`}}>
				<ScreenRecording
					dir=""
					count={1}
					index={0}
					src={DIV.src}
					natural={DIV.natural}
					w={PW}
					h={PH}
					view={view}
					radius={36}
					marks={[
						{rect: ROI.header, p: markHeader, color: P.accent},
						{rect: ROI.reinvestStep, p: markReinv * 0.9, color: P.accent},
						{rect: ROI.reinvestAmount, p: markReinv, color: P.accent},
					]}
				/>
			</div>
			{/* right column A: the amount */}
			<div style={{position: 'absolute', left: RX, top: 360, width: 380, opacity: amountOut * Math.min(1, amtP * 2)}}>
				<Label size={26} color={P.muted}>Dividend</Label>
				<Num value={FACTS.dividendTotal.value} p={amtP} decimals={2} prefix="$" size={120} color={P.accent} style={{display: 'block', marginTop: 4}} />
				<div style={{fontSize: 30, fontWeight: 800, color: P.ink, marginTop: 10}}>Paid {DIV_DATES.paid}</div>
				<div style={{fontSize: 26, fontWeight: 700, color: P.muted, marginTop: 26, lineHeight: 1.3, ...inn(tBegin - 10, 'smooth', 10)}}>
					From VOO shares I already own — not the $10 order
				</div>
			</div>
			{/* right column C: the flow */}
			<div style={{position: 'absolute', left: RX, top: PT + 280, width: 380, display: 'flex', flexDirection: 'column', alignItems: 'stretch'}}>
				{chain.map((s, i) => {
					const p = sp(frame, fps, s.t, 'snappy');
					return (
						<React.Fragment key={i}>
							{i > 0 && (
								<div style={{height: 40, display: 'flex', justifyContent: 'center', opacity: p}}>
									<svg width={30} height={40} viewBox="0 0 30 40">
										<path d="M15 2v30M6 24l9 10 9-10" fill="none" stroke={P.accent} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</div>
							)}
							<div
								style={{
									padding: '20px 22px',
									borderRadius: 22,
									background: s.hero ? 'rgba(57,255,20,0.12)' : P.paper,
									border: `3px solid ${s.hero ? P.accent : P.line}`,
									fontSize: s.hero ? 34 : 30,
									fontWeight: 900,
									color: P.ink,
									textAlign: 'center',
									opacity: Math.min(1, p * 1.5),
									transform: `translateY(${(1 - p) * 24}px) scale(${0.92 + 0.08 * p})`,
									boxShadow: s.hero ? `0 0 ${36 * p}px rgba(57,255,20,0.3)` : 'none',
								}}
							>
								{s.text}
							</div>
						</React.Fragment>
					);
				})}
			</div>
			{/* DRIP setting screenshot */}
			<div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${backdrop})`}} />
			<div
				style={{
					position: 'absolute',
					left: dripX,
					top: dripY,
					width: dripW,
					height: dripH,
					borderRadius: 30,
					opacity: Math.min(1, dripIn * 1.5),
					transform: `translateY(${(1 - dripIn) * 120}px)`,
					boxShadow: `0 0 0 2px ${markEnabled > 0.5 ? P.accentDeep : P.line}, 0 40px 80px rgba(0,0,0,0.8)`,
				}}
			>
				<ScreenRecording dir="" count={1} index={0} src={DRIP.src} natural={DRIP.natural} w={dripW} h={dripH} view={{x: 0, y: 0, w: 1206, h: 744}} radius={30} marks={[{rect: ROI.enabled, p: markEnabled, color: P.accent}]} />
				<div style={{position: 'absolute', left: 0, top: -64, opacity: 1 - dock}}>
					<Label color={P.ink} size={28}>
						My setting · <span style={{color: P.accent}}>DRIP enabled</span>
					</Label>
				</div>
			</div>
			<Sfx at={20} name="coin" volume={0.3} />
			<Sfx at={tReinv} name="chime" volume={0.25} />
			<Sfx at={tMore - 4} name="coin" volume={0.28} />
		</AbsoluteFill>
	);
};

const G: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{color: P.accent}}>{children}</span>;
