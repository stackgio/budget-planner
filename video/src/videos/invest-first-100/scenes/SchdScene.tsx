import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {EvidenceChip, SourceTag} from '../../../story/components/Evidence';
import {Coin} from '../../../story/components/Money';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {PLAN, SCHD, SOURCES, VTI} from '../facts';
import {dark as P, FUND, NOTE, SPLIT} from '../look';
import {IntroStrip, swapIn} from '../ui';

const GOLD = FUND.schd.dark;
const ACCOUNT = {x: 540, y: 1150};

/**
 * SCHD — "$20 into SCHD … established U.S. companies with a history of paying
 * dividends … I already get some of these companies through VTI, but …"
 * Proof: Schwab's own fund data (holdings count, objective, top holdings).
 * Schwab's site covers every page with a role-selection overlay, so this is a
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

	const amt = kf(frame, [t20, t20 + 16], [PLAN.schd.value * 0.6, PLAN.schd.value], E.out);
	const tickIn = sp(frame, fps, tSchd - 3, 'bouncy');
	const holdings = kf(frame, [tSchd, tSchd + 24], [0, SCHD.holdings.value], E.out);

	const cardA = swapIn(frame, tSchd - 8, tFocus - 4);
	const phaseB = swapIn(frame, tFocus - 2, tL7 - 4);
	const phaseC = swapIn(frame, tL7 - 2);

	// overlap diagram
	const big = sp(frame, fps, tL7, 'smooth');
	const small = sp(frame, fps, tThroughVti - 4, 'heavy');
	const extra = sp(frame, fps, tExtra - 2, 'bouncy');
	const banner = sp(frame, fps, tStocks - 6, 'snappy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={700} light={1} warm />
			<ChapterTag n="02" label="$20 · SCHD" at={6} palette={P} style={{left: story.safe.left, top: story.safe.top}} />

			<IntroStrip frame={frame} slice={SPLIT.cuts[1]} noteW={NOTE.w} x={540 - 160 * 1.25} y={520} scale={2.5} tOut={t20} band={GOLD} />
			<div style={{position: 'absolute', left: story.safe.left, top: 300, display: 'flex', alignItems: 'center', gap: 28, opacity: kf(frame, [t20 - 4, t20 + 4], [0, 1])}}>
				<NumberCounter value={amt} fontSize={150} color={GOLD} style={{letterSpacing: -4}} />
				<span style={{fontSize: 90, fontWeight: 900, color: P.muted}}>→</span>
				<span style={{fontSize: 150, fontWeight: 900, color: P.ink, letterSpacing: -4, display: 'inline-block', transform: `scale(${tickIn})`, opacity: Math.min(1, tickIn * 1.5)}}>SCHD</span>
			</div>

			{/* A — the fund, from Schwab's own page */}
			{cardA.on && (
				<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 540 + cardA.y, opacity: cardA.opacity}}>
					<div style={{background: P.paper, borderRadius: 30, border: `2px solid ${P.line}`, padding: '52px 44px 40px', boxShadow: `0 30px 60px ${P.shadow}`}}>
						<div style={{fontSize: 44, fontWeight: 900, color: P.ink, letterSpacing: -0.5, lineHeight: 1.1}}>{SCHD.name}</div>
						<div style={{height: 2, background: P.line, margin: '30px 0'}} />
						<div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between'}}>
							<span style={{fontSize: 30, fontWeight: 900, letterSpacing: 3, color: P.muted}}>TOTAL HOLDINGS</span>
							<NumberCounter value={holdings} prefix="" fontSize={110} color={GOLD} />
						</div>
						<div style={{height: 2, background: P.line, margin: '24px 0 28px'}} />
						<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 3, color: P.muted, marginBottom: 12}}>OBJECTIVE</div>
						<div style={{fontSize: 38, fontWeight: 700, color: P.body, lineHeight: 1.25}}>
							Track the <span style={{color: P.ink, fontWeight: 900}}>Dow Jones U.S. Dividend 100™</span> Index
						</div>
					</div>
					<EvidenceChip text="VERIFIED DATA · SCHWAB" palette={P} style={{left: 28, top: -22}} />
					<SourceTag text={SOURCES.schd} asOf={SCHD.holdingsAsOf} palette={P} style={{left: 0, top: 560}} />
				</div>
			)}

			{/* B — what it focuses on + dividends flowing to the account */}
			{phaseB.on && (
				<div style={{position: 'absolute', inset: 0, opacity: phaseB.opacity}}>
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 520 + phaseB.y}}>
						<div style={{fontSize: 26, fontWeight: 900, letterSpacing: 3, color: P.muted, marginBottom: 10}}>SCHWAB, ON SCHD:</div>
						<div style={{fontSize: 44, fontWeight: 800, color: P.ink, lineHeight: 1.2}}>
							“Tracks an index focused on the quality and sustainability of{' '}
							<span style={{color: GOLD, background: `rgba(240,182,74,${0.18 * kf(frame, [tPaying, tPaying + 10], [0, 1])})`, borderRadius: 8, padding: '0 6px'}}>dividends</span>”
						</div>
					</div>
					{/* top holdings (as of 11/03/2026) */}
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 790, display: 'flex', justifyContent: 'space-between'}}>
						{SCHD.top.map((h, i) => {
							const p = sp(frame, fps, tEst + i * 3, 'snappy');
							return (
								<div key={h.t} style={{width: 158, height: 106, borderRadius: 20, border: `3px solid ${GOLD}`, background: '#1F1B14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - p) * 40}px)`, opacity: Math.min(1, p * 1.5)}}>
									<span style={{fontSize: 40, fontWeight: 900, color: P.ink}}>{h.t}</span>
									<span style={{fontSize: 26, fontWeight: 800, color: GOLD}}>{h.w.toFixed(2)}%</span>
								</div>
							);
						})}
					</div>
					<div style={{position: 'absolute', left: story.safe.left, top: 912, fontSize: 24, fontWeight: 700, color: P.muted, opacity: kf(frame, [tEst + 12, tEst + 20], [0, 1])}}>TOP 5 HOLDINGS · % OF FUND · AS OF {SCHD.holdingsAsOf}</div>
					{/* coins arc from the companies into the account */}
					{SCHD.top.map((_, i) =>
						[0, 1].map((k) => {
							const start = tPaying - 4 + i * 4 + k * 14;
							const t = kf(frame, [start, start + 18], [0, 1], E.inOut);
							if (t <= 0 || t >= 1) return null;
							const fromX = story.safe.left + 79 + i * ((1080 - story.safe.left - story.safe.right + 40 - 158) / 4);
							const [x, y] = arc(t, [fromX, 860], [ACCOUNT.x, ACCOUNT.y - 40], 120);
							return <Coin key={`${i}-${k}`} size={54} spin={frame * 0.4 + i} style={{left: x, top: y}} />;
						}),
					)}
					<div style={{position: 'absolute', left: ACCOUNT.x - 220, top: ACCOUNT.y - 50, width: 440, height: 150, borderRadius: 28, background: P.paper, border: `3px solid ${GOLD}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.04 * Math.sin(Math.max(0, frame - tPaying) * 0.5) * kf(frame, [tPaying, tPaying + 40], [1, 0])})`}}>
						<span style={{fontSize: 26, fontWeight: 900, letterSpacing: 3, color: P.muted}}>MY ACCOUNT</span>
						<span style={{fontSize: 46, fontWeight: 900, color: GOLD}}>+ DIVIDENDS</span>
					</div>
					<div style={{position: 'absolute', left: 0, right: 0, top: ACCOUNT.y + 118, textAlign: 'center', fontSize: 26, fontWeight: 800, color: P.body, opacity: kf(frame, [tPaying + 6, tPaying + 16], [0, 1])}}>
						Dividends can be cut or stopped — not guaranteed.
					</div>
				</div>
			)}

			{/* C — overlap: SCHD sits inside the same U.S. market VTI already owns */}
			{phaseC.on && (
				<div style={{position: 'absolute', inset: 0, opacity: phaseC.opacity}}>
					<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
						<circle cx={470} cy={800} r={280 * big} fill="rgba(44,212,122,0.10)" stroke={FUND.vti.dark} strokeWidth={5} />
						<circle cx={470 + 260 * (1 - small) + 210 * small} cy={730} r={(105 + 22 * extra) * small} fill="rgba(240,182,74,0.28)" stroke={GOLD} strokeWidth={5} opacity={small} />
					</svg>
					<div style={{position: 'absolute', left: 250, top: 860, opacity: big, textAlign: 'center', width: 300}}>
						<div style={{fontSize: 64, fontWeight: 900, color: FUND.vti.dark}}>VTI</div>
						<div style={{fontSize: 30, fontWeight: 800, color: P.body}}>{VTI.stocks.value.toLocaleString('en-US')} stocks</div>
					</div>
					<div style={{position: 'absolute', left: 680 - 100, top: 690, width: 200, textAlign: 'center', opacity: small}}>
						<div style={{fontSize: 44, fontWeight: 900, color: GOLD}}>SCHD</div>
						<div style={{fontSize: 26, fontWeight: 800, color: P.ink}}>{SCHD.holdings.value} holdings</div>
					</div>
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 1100, textAlign: 'center', fontSize: 50, fontWeight: 900, color: P.ink, opacity: small}}>
						OVERLAP, <span style={{color: GOLD}}>NOT A NEW MARKET</span>
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
			<Sfx at={tSchd - 4} name="card" volume={0.35} />
			<Sfx at={tEst} name="pop" volume={0.25} />
			<Sfx at={tPaying} name="coin" volume={0.35} />
			<Sfx at={tPaying + 14} name="coin" volume={0.3} />
			<Sfx at={tThroughVti - 4} name="whoosh-soft" volume={0.35} />
			<Sfx at={tStocks - 6} name="stamp" volume={0.35} />
		</AbsoluteFill>
	);
};
