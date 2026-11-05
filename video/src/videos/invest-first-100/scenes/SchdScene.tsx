import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {EvidenceChip, SourceTag} from '../../../story/components/Evidence';
import {Coin} from '../../../story/components/Money';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {PLAN, SCHD, SOURCES, VTI} from '../facts';
import {dark as P, FUND, NOTE, SPLIT} from '../look';
import {IntroStrip, swapIn} from '../ui';

const GOLD = FUND.schd.dark;
const GREEN = FUND.vti.dark;
const ACCOUNT = {x: 540, y: 1130};
const VENN = {big: {x: 410, y: 820, r: 290}, small: {x: 715, y: 770, r: 150}};

/**
 * SCHD — three beats, no repeats:
 *  A ($20 → SCHD)        one card: 102 holdings + the dividend index it tracks
 *  B (L6 "dividends")    top holdings pay dividends into the account (not guaranteed)
 *  C (L7 "through VTI")  smooth overlap: same U.S. companies as VTI + extra dividend focus
 * Schwab's site covers every page with a role-selection overlay, so the proof is a
 * VERIFIED DATA card with its source — not a screenshot.
 */
export const SchdScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t20 = cue('L5', '$20');
	const tSchd = cue('L5', 'SCHD.');
	const tFocus = cue('L6', 'focuses');
	const tEst = cue('L6', 'established');
	const tPaying = cue('L6', 'paying');
	const tL7 = cue('L7', 'I');
	const tThroughVti = cue('L7', 'VTI,');
	const tExtra = cue('L7', 'extra');
	const tStocks = cue('L7', 'stocks.');

	const amt = kf(frame, [t20, t20 + 14], [PLAN.schd.value, PLAN.schd.value], E.out);
	const tickIn = sp(frame, fps, tSchd - 3, 'bouncy');
	const holdings = kf(frame, [tSchd, tSchd + 22], [0, SCHD.holdings.value], E.out);

	const cardA = swapIn(frame, tSchd - 6, tFocus - 4);
	const phaseB = swapIn(frame, tFocus - 2, tL7 - 4);
	const phaseC = swapIn(frame, tL7 - 2);

	// overlap — eased, no bounce
	const ring = kf(frame, [tL7, tL7 + 22], [0, 1], E.inOut);
	const slideIn = kf(frame, [tThroughVti - 10, tThroughVti + 14], [0, 1], E.inOut);
	const extraFill = kf(frame, [tExtra - 4, tExtra + 14], [0, 1], E.inOut);
	const line1 = kf(frame, [tThroughVti, tThroughVti + 10], [0, 1], E.out);
	const line2 = kf(frame, [tExtra, tExtra + 10], [0, 1], E.out);
	const banner = sp(frame, fps, tStocks - 6, 'snappy');
	const sx = mix(1180, VENN.small.x, slideIn);
	const circ = 2 * Math.PI * VENN.big.r;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={760} light={1} warm />
			<ChapterTag n="02" label="$20 · SCHD" at={6} palette={P} style={{left: story.safe.left, top: story.safe.top}} />
			<IntroStrip frame={frame} slice={SPLIT.cuts[1]} noteW={NOTE.w} x={540 - 200} y={520} scale={2.5} tOut={t20} band={GOLD} />

			<div style={{position: 'absolute', left: story.safe.left, top: 300, display: 'flex', alignItems: 'center', gap: 28, opacity: kf(frame, [t20 - 4, t20 + 4], [0, 1])}}>
				<NumberCounter value={amt} fontSize={150} color={GOLD} style={{letterSpacing: -4}} />
				<span style={{fontSize: 90, fontWeight: 900, color: P.muted}}>→</span>
				<span style={{fontSize: 150, fontWeight: 900, color: P.ink, letterSpacing: -4, display: 'inline-block', transform: `scale(${tickIn})`, opacity: Math.min(1, tickIn * 1.5)}}>SCHD</span>
			</div>

			{/* A — one fact card */}
			{cardA.on && (
				<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 560 + cardA.y, opacity: cardA.opacity}}>
					<div style={{background: P.paper, borderRadius: 30, border: `2px solid ${P.line}`, padding: '50px 44px 40px'}}>
						<div style={{display: 'flex', alignItems: 'baseline', gap: 22}}>
							<NumberCounter value={holdings} prefix="" fontSize={170} color={GOLD} style={{letterSpacing: -6}} />
							<span style={{fontSize: 56, fontWeight: 900, color: P.ink}}>HOLDINGS</span>
						</div>
						<div style={{fontSize: 38, fontWeight: 700, color: P.body, lineHeight: 1.25, marginTop: 18}}>
							Tracks the <span style={{color: P.ink, fontWeight: 900}}>Dow Jones U.S. Dividend 100™</span> Index
						</div>
					</div>
					<EvidenceChip text="VERIFIED DATA · SCHWAB" palette={P} style={{left: 28, top: -22}} />
					<SourceTag size={28} text={`${SOURCES.schd} · Total holdings`} asOf={SCHD.holdingsAsOf} palette={P} style={{left: 0, top: 420}} />
				</div>
			)}

			{/* B — dividends flow to the account */}
			{phaseB.on && (
				<div style={{position: 'absolute', inset: 0, opacity: phaseB.opacity, transform: `translateY(${phaseB.y * 0.5}px)`}}>
					<div style={{position: 'absolute', left: story.safe.left, top: 560, fontSize: 64, fontWeight: 900, color: P.ink, letterSpacing: -1, lineHeight: 1.05}}>
						FOCUS: <span style={{color: GOLD}}>DIVIDEND PAYERS</span>
					</div>
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 700, display: 'flex', justifyContent: 'space-between'}}>
						{SCHD.top.map((h, i) => {
							const p = sp(frame, fps, tEst + i * 3, 'snappy');
							return (
								<div key={h.t} style={{width: 158, height: 110, borderRadius: 20, border: `3px solid ${GOLD}`, background: '#1F1B14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - p) * 30}px)`, opacity: Math.min(1, p * 1.5)}}>
									<span style={{fontSize: 42, fontWeight: 900, color: P.ink}}>{h.t}</span>
									<span style={{fontSize: 30, fontWeight: 800, color: GOLD}}>{h.w.toFixed(2)}%</span>
								</div>
							);
						})}
					</div>
					<SourceTag size={28} text={`${SOURCES.schd} · top 5 holdings`} asOf={SCHD.holdingsAsOf} palette={P} style={{left: story.safe.left, top: 830, opacity: kf(frame, [tEst + 10, tEst + 18], [0, 1])}} />
					{SCHD.top.map((_, i) =>
						[0, 1].map((k) => {
							const start = tPaying - 6 + i * 3 + k * 12;
							const t = kf(frame, [start, start + 18], [0, 1], E.inOut);
							if (t <= 0 || t >= 1) return null;
							const fromX = story.safe.left + 79 + i * 192.5;
							const [x, y] = arc(t, [fromX, 760], [ACCOUNT.x, ACCOUNT.y - 30], 90);
							return <Coin key={`${i}-${k}`} size={54} spin={frame * 0.35 + i} style={{left: x, top: y}} />;
						}),
					)}
					<div style={{position: 'absolute', left: ACCOUNT.x - 230, top: ACCOUNT.y - 50, width: 460, height: 150, borderRadius: 28, background: P.paper, border: `3px solid ${GOLD}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
						<span style={{fontSize: 30, fontWeight: 900, letterSpacing: 3, color: P.muted}}>MY ACCOUNT</span>
						<span style={{fontSize: 48, fontWeight: 900, color: GOLD}}>+ DIVIDENDS</span>
					</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: ACCOUNT.y + 122, textAlign: 'center', fontSize: 28, fontWeight: 800, color: P.body, opacity: kf(frame, [tPaying, tPaying + 10], [0, 1])}}>
						Dividends can be cut or stopped — not guaranteed.
					</div>
				</div>
			)}

			{/* C — the overlap, said plainly */}
			{phaseC.on && (
				<div style={{position: 'absolute', inset: 0, opacity: phaseC.opacity}}>
					<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
						<circle cx={VENN.big.x} cy={VENN.big.y} r={VENN.big.r} fill={`rgba(44,212,122,${0.1 * ring})`} stroke={GREEN} strokeWidth={6} strokeDasharray={`${circ * ring} ${circ}`} transform={`rotate(-90 ${VENN.big.x} ${VENN.big.y})`} />
						<circle cx={sx} cy={VENN.small.y} r={VENN.small.r} fill={`rgba(240,182,74,${0.16 + 0.22 * extraFill})`} stroke={GOLD} strokeWidth={6} opacity={slideIn > 0 ? 1 : 0} />
					</svg>
					<div style={{position: 'absolute', left: VENN.big.x - 240, top: VENN.big.y + 40, width: 300, textAlign: 'center', opacity: ring}}>
						<div style={{fontSize: 66, fontWeight: 900, color: GREEN}}>VTI</div>
						<div style={{fontSize: 32, fontWeight: 800, color: P.body}}>{VTI.stocks.value.toLocaleString('en-US')} U.S. stocks</div>
					</div>
					<div style={{position: 'absolute', left: sx - 110, top: VENN.small.y - 54, width: 220, textAlign: 'center', opacity: slideIn}}>
						<div style={{fontSize: 50, fontWeight: 900, color: GOLD}}>SCHD</div>
						<div style={{fontSize: 28, fontWeight: 800, color: P.ink}}>{SCHD.holdings.value} holdings</div>
					</div>
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 1135, textAlign: 'center'}}>
						<div style={{fontSize: 46, fontWeight: 900, color: P.ink, opacity: line1, transform: `translateY(${(1 - line1) * 16}px)`}}>OVERLAPS WITH VTI</div>
						<div style={{fontSize: 46, fontWeight: 900, color: GOLD, opacity: line2 * (1 - kf(frame, [tStocks - 6, tStocks + 2], [0, 1])), transform: `translateY(${(1 - line2) * 16}px)`}}>+ EXTRA DIVIDEND FOCUS</div>
					</div>
					<div
						style={{
							position: 'absolute',
							left: story.safe.left,
							right: story.safe.right - 40,
							top: 1222,
							height: 140,
							borderRadius: 30,
							background: P.paper,
							border: `2px solid ${P.line}`,
							display: 'flex',
							alignItems: 'center',
							gap: 24,
							padding: '0 34px',
							opacity: Math.min(1, banner * 1.4),
							transform: `translateY(${(1 - banner) * 40}px)`,
						}}
					>
						<span style={{fontSize: 72, fontWeight: 900, color: GOLD, letterSpacing: -2}}>${PLAN.schd.value}</span>
						<span style={{fontSize: 52, fontWeight: 900, color: P.muted}}>→</span>
						<span style={{fontSize: 46, fontWeight: 900, color: P.ink, lineHeight: 1.05}}>DIVIDEND-FOCUSED STOCKS</span>
					</div>
				</div>
			)}

			<Sfx at={t20} name="coin" volume={0.35} />
			<Sfx at={tSchd - 4} name="card" volume={0.3} />
			<Sfx at={tPaying} name="coin" volume={0.3} />
			<Sfx at={tThroughVti - 8} name="whoosh-soft" volume={0.3} />
			<Sfx at={tStocks - 6} name="stamp" volume={0.3} />
		</AbsoluteFill>
	);
};
