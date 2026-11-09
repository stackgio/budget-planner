import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {recIndex, recView, ScreenRecording, type RecRect} from '../../../story/components/ScreenRecording';
import {useCues} from '../../../story/lib/cues';
import {kf, sp} from '../../../story/lib/motion';
import {FACTS} from '../facts';
import {BrandBg, FONT, L, Label, P, REC, REC_MASKS, REC_ROI} from '../ui';

const VW = 900;
const VH = 920;
const VTOP = 318;
const ASPECT = VH / VW;
const v = (y: number, x = 0, w = 1206): RecRect => ({x, y, w, h: w * ASPECT});

/**
 * THE CENTERPIECE — the creator's real Robinhood recording, re-timed to the
 * narration (holds and fast-forwards only; frames are untouched), privacy
 * masks over position value and buying power, and a 6-step rail on top.
 * The recording ends on the genuine "order queued" screen — it is NOT shown
 * as filled.
 */
export const BuyScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const {cue} = useCues();
	const c = {
		search: cue('L20', 'search'),
		voo: cue('L20', 'VOO'),
		tap: cue('L20', 'tap'),
		trade: cue('L20', 'Trade'),
		select: cue('L20', 'select'),
		buy: cue('L20', 'Buy'),
		enter: cue('L20', 'enter'),
		ten: cue('L20', 'ten'),
		dollars: cue('L20', 'dollars', 0, 'end'),
		review: cue('L21', 'Review'),
		submit: cue('L21', 'submit'),
		now: cue('L21', 'now'),
		fraction: cue('L21', 'fraction'),
		end: cue('L21', undefined, 0, 'end'),
	};
	const idx = recIndex(frame, [
		[0, 10],
		[c.search - 4, 30],
		[c.voo + 6, 68],
		[c.voo + 12, 80],
		[c.tap - 2, 94], // hold the results (VOO row) until "tap"
		[c.tap + 10, 114],
		[c.trade + 6, 124], // Trade button visible before the menu opens
		[c.trade + 16, 140],
		[c.buy - 2, 172],
		[c.buy + 6, 178],
		[c.buy + 14, 208],
		[c.enter, 214],
		[c.dollars, 262],
		[c.review - 2, 272],
		[c.review + 6, 300],
		[c.submit, 318],
		[c.submit + 14, 345],
		[c.now - 4, 384],
		[c.now + 8, 400],
		[Math.max(c.now + 9, durationInFrames - 1), REC.at.last],
	]);
	// per-step framing: each step pushes in on the part of the real screen the narration names
	const view = recView(frame, [
		{at: 0, v: v(150)}, // search screen
		{at: c.search - 8, v: v(150)},
		{at: c.search + 4, v: v(150, 20, 960)}, // 1 · search field + results
		{at: c.voo + 4, v: v(150, 20, 960)},
		{at: c.voo + 14, v: v(480, 20, 800)}, // 2 · the VOO row, enlarged
		{at: c.tap, v: v(480, 20, 800)},
		{at: c.tap + 12, v: v(300)}, // VOO page: name + price
		{at: c.trade - 10, v: v(300)},
		{at: c.trade, v: v(1520, 400, 806)}, // 3 · Trade → Buy buttons, enlarged
		{at: c.buy + 6, v: v(1520, 400, 806)},
		{at: c.buy + 16, v: v(380)}, // 4 · order screen
		{at: c.ten - 8, v: v(380)},
		{at: c.ten + 4, v: v(540, 40, 1126)}, //   shares → estimated cost
		{at: c.review - 2, v: v(540, 40, 1126)},
		{at: c.review + 8, v: v(330)}, // 5 · review: amount + account
		{at: c.submit - 4, v: v(330)},
		{at: c.submit + 4, v: v(1389)}, // 6 · swipe up to submit
		{at: c.submit + 16, v: v(1389)},
		{at: c.now - 4, v: v(680, 20, 1166)}, //   genuine "order queued" screen
	]);
	const pulse = (a: number, b: number) => {
		const e = Math.max(b, a + 16);
		return kf(frame, [a - 4, a + 6, e - 4, e + 4], [0, 1, 1, 0]);
	};
	const marks: {rect: RecRect; p: number; color: string; arrow?: 'left' | 'right' | 'up' | 'down'}[] = [
		{rect: REC_ROI.searchField, p: pulse(c.search - 6, c.voo + 2), color: P.accent},
		{rect: REC_ROI.vooName, p: pulse(c.voo + 10, c.tap - 4), color: P.accent, arrow: 'right'},
		{rect: REC_ROI.tradeBtn, p: pulse(c.trade - 4, c.trade + 8), color: P.accent, arrow: 'left'},
		{rect: REC_ROI.buyBtn, p: pulse(c.select + 2, c.buy + 2), color: P.accent, arrow: 'left'},
		{rect: REC_ROI.sharesRow, p: pulse(c.enter + 4, c.ten - 2), color: P.accent},
		{rect: REC_ROI.estCost, p: pulse(c.ten, c.review - 4), color: P.accent},
		{rect: REC_ROI.reviewEst, p: pulse(c.review + 8, c.submit - 6), color: P.accent},
		{rect: REC_ROI.accountRow, p: pulse(c.review + 14, c.submit - 6), color: P.accent},
		{rect: REC_ROI.swipe, p: pulse(c.submit + 2, c.submit + 14), color: '#FFFFFF'},
		{rect: REC_ROI.queuedTitle, p: pulse(c.now + 8, c.end + 30), color: '#FFFFFF'},
	];
	const steps: {n: number; label: string; at: number; note: React.ReactNode; sub?: React.ReactNode}[] = [
		{n: 1, label: 'Search VOO', at: 0, note: <>Type <G>VOO</G> in search</>},
		{n: 2, label: 'Open VOO', at: c.voo + 6, note: <>Vanguard S&amp;P 500 ETF</>, sub: 'Check the ticker is VOO'},
		{n: 3, label: 'Trade → Buy', at: c.trade - 2, note: <>Tap <G>Trade</G>, then <G>Buy</G></>},
		{
			n: 4,
			label: 'Enter ~$10',
			at: c.enter - 4,
			note: (
				<>
					{FACTS.orderShares.value} shares ≈ <G>${FACTS.orderEstCost.value.toFixed(2)}</G>
				</>
			),
			sub: 'I entered shares — you can also buy in dollars',
		},
		{n: 5, label: 'Review', at: c.review - 2, note: <>Check the <G>amount</G> &amp; <G>account</G></>},
		{n: 6, label: 'Submit', at: c.submit - 2, note: <>Swipe up to submit</>},
	];
	let cur = 0;
	steps.forEach((s, i) => {
		if (frame >= s.at) cur = i;
	});
	const step = steps[cur];
	const stepIn = sp(frame, fps, step.at, 'snappy');
	// final honest callouts (queued, then the fill caveat)
	const tQueued = c.now - 2;
	const tFill = c.fraction - 6;
	const queuedP = sp(frame, fps, tQueued, 'snappy');
	const fillP = sp(frame, fps, tFill, 'bouncy');
	const enter = sp(frame, fps, 0, 'smooth');
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<BrandBg glowY={760} />
			{/* step chip + rail */}
			<div style={{position: 'absolute', left: L, top: 182, right: 120, display: 'flex', alignItems: 'center', gap: 18}}>
				<div style={{height: 70, padding: '0 22px', borderRadius: 18, background: P.accent, color: P.bg, display: 'flex', alignItems: 'center', fontSize: 30, fontWeight: 900, letterSpacing: 2}}>STEP {step.n}</div>
				<div style={{overflow: 'hidden', height: 70, display: 'flex', alignItems: 'center'}}>
					<div style={{fontSize: 46, fontWeight: 900, color: P.ink, letterSpacing: -0.5, transform: `translateY(${(1 - stepIn) * 70}px)`, opacity: stepIn}}>{step.label.toUpperCase()}</div>
				</div>
			</div>
			<div style={{position: 'absolute', right: 120, top: 200}}>
				<Label color={P.muted} size={24}>
					<span style={{color: P.danger}}>●</span> Real recording
				</Label>
			</div>
			<div style={{position: 'absolute', left: L, top: 270, width: 888, display: 'flex', gap: 10}}>
				{steps.map((s, i) => (
					<div key={s.n} style={{flex: 1, height: 8, borderRadius: 4, background: i <= cur ? P.accent : P.line, opacity: i === cur ? 1 : i < cur ? 0.6 : 1}} />
				))}
			</div>
			{/* the real recording */}
			<div style={{position: 'absolute', left: (1080 - VW) / 2, top: VTOP, width: VW, height: VH, borderRadius: 40, boxShadow: `0 0 0 2px ${P.line}, 0 40px 80px rgba(0,0,0,0.7)`, opacity: enter, transform: `scale(${0.96 + 0.04 * enter})`}}>
				<ScreenRecording dir={REC.dir} count={REC.count} index={idx} natural={REC.natural} w={VW} h={VH} view={view} masks={REC_MASKS} marks={marks} radius={40} />
			</div>
			{/* callout band (between footage and captions) */}
			<div style={{position: 'absolute', left: L, right: 120, top: 1262, height: 130, opacity: 1 - queuedP}}>
				<div style={{fontSize: 40, fontWeight: 900, color: P.ink, letterSpacing: -0.5, transform: `translateY(${(1 - stepIn) * 16}px)`, opacity: stepIn}}>{step.note}</div>
				{step.sub && <div style={{fontSize: 26, fontWeight: 700, color: P.muted, marginTop: 8, opacity: stepIn}}>{step.sub}</div>}
			</div>
			<div style={{position: 'absolute', left: L, right: 120, top: 1262, height: 130, opacity: queuedP}}>
				<div style={{fontSize: 40, fontWeight: 900, color: P.ink, letterSpacing: -0.5}}>
					Order <G>queued</G> for market open
				</div>
				<div style={{fontSize: 30, fontWeight: 800, color: P.body, marginTop: 10, opacity: Math.min(1, fillP * 1.4), transform: `translateY(${(1 - fillP) * 12}px)`}}>
					Once it fills → you own a <G>fraction</G> of VOO
				</div>
			</div>
			<Sfx at={c.voo + 4} name="click" volume={0.22} />
			<Sfx at={c.trade + 4} name="click" volume={0.22} />
			<Sfx at={c.buy} name="click" volume={0.22} />
			<Sfx at={c.ten} name="tick" volume={0.2} />
			<Sfx at={c.submit + 6} name="whoosh-soft" volume={0.22} />
			<Sfx at={c.now} name="chime" volume={0.22} />
		</AbsoluteFill>
	);
};

const G: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{color: P.accent}}>{children}</span>;

