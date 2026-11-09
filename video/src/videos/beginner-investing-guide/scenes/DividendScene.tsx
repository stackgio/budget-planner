import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {recView, ScreenRecording, type RecRect} from '../../../story/components/ScreenRecording';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {DIV_DATES, FACTS} from '../facts';
import {BrandBg, FONT, L, Num, P, Pill, useIn} from '../ui';

const DIV = {src: 'motion/beginner-investing-guide/assets/voo-dividend.png', natural: {w: 1206, h: 2622}};
const DRIP = {src: 'motion/beginner-investing-guide/assets/drip-enabled.jpg', natural: {w: 1206, h: 744}};
/** regions on the real screenshots (natural px) */
const ROI = {
	header: {x: 50, y: 300, w: 560, h: 230},
	reinvestStep: {x: 50, y: 1420, w: 680, h: 160},
	reinvestAmount: {x: 50, y: 2215, w: 700, h: 150},
	enabled: {x: 55, y: 128, w: 290, h: 104},
};

// proof viewport — wide and readable, above the explanation stack and the captions
const PW = 900;
const PH = 600;
const PT = 268;
const pv = (y: number, w = 1206, x = 0): RecRect => ({x, y, w, h: (w * PH) / PW});

/**
 * REAL DIVIDEND PROOF + DRIP SETTING — three beats, each with the original
 * screenshot enlarged on the exact line being explained:
 *   1. $5.35 DIVIDEND  2. AUTOMATICALLY REINVESTED (DRIP enabled)  3. +0.007628 VOO SHARES
 * Both screenshots are untouched; every figure comes from facts.ts.
 */
export const DividendScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const inn = useIn();
	const tTurn = cue('L23', 'turn', -0.15);
	const tReinv = cue('L23', 'reinvestment', -0.1);
	const tElig = cue('L23', 'eligible', -0.1);
	const tBuy = cue('L23', 'buy', -0.15);
	// which screenshot is on screen: dividend → DRIP setting → dividend
	const dripOn = kf(frame, [tTurn - 4, tTurn + 6, tElig - 2, tElig + 8], [0, 1, 1, 0], E.inOut);
	const view = recView(frame, [
		{at: 0, v: pv(200)},
		{at: 8, v: pv(200)},
		{at: 26, v: pv(285, 900, 20)}, // 1 · "Dividend $5.35"
		{at: tElig - 2, v: pv(285, 900, 20)},
		{at: tElig + 10, v: pv(1060)}, // 2 · "Dividend reinvestment · Filled Oct 1"
		{at: tBuy - 2, v: pv(1060)},
		{at: tBuy + 10, v: pv(1800)}, // 3 · "0.007628 shares at $701.34"
	]);
	const markHeader = kf(frame, [20, 30, tTurn - 6, tTurn], [0, 1, 1, 0]);
	const markStep = kf(frame, [tElig + 8, tElig + 16, tBuy, tBuy + 6], [0, 1, 1, 0]);
	const markAmount = kf(frame, [tBuy + 10, tBuy + 18], [0, 1]);
	const markEnabled = kf(frame, [tReinv - 2, tReinv + 8], [0, 1]);
	// explanation stack
	const beats = [
		{
			at: 6,
			title: (
				<>
					<Num value={FACTS.dividendTotal.value} p={kf(frame, [10, 30], [0, 1], E.out)} decimals={2} prefix="$" size={60} color={P.accent} /> DIVIDEND
				</>
			),
			sub: <>Paid {DIV_DATES.paid} · from VOO shares I already owned</>,
		},
		{at: tReinv, title: <>AUTOMATICALLY REINVESTED</>, sub: <>My DRIP setting is enabled · {DIV_DATES.reinvested}</>},
		{
			at: tBuy,
			title: (
				<>
					<span style={{color: P.accent}}>+{FACTS.reinvestShares.value}</span> VOO SHARES
				</>
			),
			sub: <>Bought at ${FACTS.reinvestPrice.value.toFixed(2)} per share</>,
		},
	];
	let active = 0;
	beats.forEach((b, i) => {
		if (frame >= b.at) active = i;
	});
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowX={540} glowY={560} />
			<div style={{position: 'absolute', left: L, top: 186, ...inn(0)}}>
				<Pill tone="accent" size={26}>
					05 · My real dividend
				</Pill>
			</div>
			<div style={{position: 'absolute', right: 120, top: 196, fontSize: 24, fontWeight: 800, letterSpacing: 3, color: P.muted, ...inn(4)}}>
				<span style={{color: P.danger}}>●</span> REAL SCREENSHOTS
			</div>
			{/* proof — the original screenshots */}
			<div style={{position: 'absolute', left: (1080 - PW) / 2, top: PT, width: PW, height: PH, borderRadius: 36, boxShadow: `0 0 0 2px ${P.line}, 0 40px 80px rgba(0,0,0,0.7)`, background: '#000', overflow: 'hidden'}}>
				<div style={{position: 'absolute', inset: 0, opacity: 1 - dripOn}}>
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
							{rect: ROI.header, p: markHeader, color: P.accent, arrow: 'right'},
							{rect: ROI.reinvestStep, p: markStep, color: P.accent, arrow: 'right'},
							{rect: ROI.reinvestAmount, p: markAmount, color: P.accent, arrow: 'right'},
						]}
					/>
				</div>
				<div style={{position: 'absolute', inset: 0, opacity: dripOn, transform: `scale(${0.97 + 0.03 * dripOn})`}}>
					<ScreenRecording
						dir=""
						count={1}
						index={0}
						src={DRIP.src}
						natural={DRIP.natural}
						w={PW}
						h={PH}
						view={{x: 0, y: (744 - 804) / 2, w: 1206, h: 804}}
						radius={36}
						marks={[{rect: ROI.enabled, p: markEnabled, color: P.accent, arrow: 'right'}]}
					/>
				</div>
			</div>
			{/* explanation stack: 1 → 2 → 3 */}
			<div style={{position: 'absolute', left: L, right: 120, top: PT + PH + 32, display: 'flex', flexDirection: 'column', gap: 14}}>
				{beats.map((b, i) => {
					const p = sp(frame, fps, b.at, 'snappy');
					const isActive = i === active;
					const shown = frame >= b.at - 1;
					return (
						<div
							key={i}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 22,
								padding: '16px 24px',
								borderRadius: 24,
								background: isActive ? 'rgba(57,255,20,0.08)' : P.paper,
								border: `3px solid ${isActive ? P.accent : P.line}`,
								opacity: shown ? Math.min(1, p * 1.5) * (isActive ? 1 : 0.5) : 0,
								transform: `translateY(${(1 - p) * 24}px)`,
							}}
						>
							<div style={{width: 54, height: 54, flex: 'none', borderRadius: 16, background: isActive ? P.accent : 'rgba(255,255,255,0.08)', color: isActive ? P.bg : P.body, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900}}>
								{i + 1}
							</div>
							<div>
								<div style={{fontSize: 42, fontWeight: 900, color: P.ink, letterSpacing: -0.5, lineHeight: 1.1, display: 'flex', alignItems: 'baseline', gap: 14, whiteSpace: 'nowrap'}}>{b.title}</div>
								<div style={{fontSize: 25, fontWeight: 700, color: P.body, marginTop: 4}}>{b.sub}</div>
							</div>
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: L, right: 120, top: 1352, textAlign: 'center', fontSize: 24, fontWeight: 700, color: P.muted, opacity: kf(frame, [tBuy + 6, tBuy + 16], [0, 1])}}>
				Dividends can change — they’re not guaranteed
			</div>
			<Sfx at={20} name="coin" volume={0.3} />
			<Sfx at={tReinv} name="chime" volume={0.25} />
			<Sfx at={tBuy + 2} name="coin" volume={0.28} />
		</AbsoluteFill>
	);
};
