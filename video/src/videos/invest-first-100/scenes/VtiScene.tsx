import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {SourceTag} from '../../../story/components/Evidence';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {PLAN, SOURCES, VTI} from '../facts';
import {BARS, FUND, NOTE, SPLIT, STRIP_TOP, stripX, white as P} from '../look';
import {asset, IntroStrip, swapIn, WhiteBg} from '../ui';

const GREEN = FUND.vti.light;
const BAR_MAX = 520; // px for the largest weight shown

/**
 * VTI — "First, I'd put $70 into VTI. This ETF gives me exposure to thousands
 * of U.S. companies, including Apple, Microsoft, and Amazon."
 * No tiny screenshots: each fact is restated large, with its Vanguard source.
 *  A  the fund (name + what it tracks)   B  3,519 stocks   C  three holdings as weight bars
 */
export const VtiScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t70 = cue('L2', '$70');
	const tVti = cue('L2', 'VTI.');
	const tThousands = cue('L3', 'thousands');
	const tIncl = cue('L3', 'including');
	const names = [cue('L3', 'Apple,'), cue('L3', 'Microsoft,'), cue('L3', 'Amazon.')];

	const hero = swapIn(frame, t70 - 4, Infinity, 40);
	const amt = kf(frame, [t70, t70 + 14], [PLAN.vti.value, PLAN.vti.value], E.out);
	const vtiIn = sp(frame, fps, tVti - 3, 'bouncy');

	const cA = swapIn(frame, tVti - 4, tThousands - 6);
	const cB = swapIn(frame, tThousands + 3, tIncl - 4);
	const cC = swapIn(frame, tIncl - 2);
	const stocks = kf(frame, [tThousands + 3, tThousands + 28], [0, VTI.stocks.value], E.out);

	const rows = [
		{src: 'AAPL.svg', name: 'Apple', w: VTI.aapl.value, logoH: 64},
		{src: 'MSFT.png', name: 'Microsoft', w: VTI.msft.value, logoH: 60},
		{src: 'AMZN.png', name: 'Amazon', w: VTI.amzn.value, logoH: 40},
	];

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<WhiteBg palette={P} />
			<ChapterTag n="01" label="$70 · VTI" at={4} palette={P} style={{left: story.safe.left, top: story.safe.top}} />
			<IntroStrip frame={frame} slice={SPLIT.cuts[0]} noteW={NOTE.w} x={stripX(0)} y={STRIP_TOP} scale={1} tOut={t70} band={GREEN} />

			{hero.on && (
				<div style={{position: 'absolute', left: story.safe.left, top: 300, display: 'flex', alignItems: 'center', gap: 28, opacity: hero.opacity, transform: `translateY(${hero.y}px)`}}>
					<NumberCounter value={amt} fontSize={150} color={GREEN} style={{letterSpacing: -4}} />
					<span style={{fontSize: 90, fontWeight: 900, color: P.muted}}>→</span>
					<span style={{fontSize: 150, fontWeight: 900, color: P.ink, letterSpacing: -4, display: 'inline-block', transform: `scale(${vtiIn})`, opacity: Math.min(1, vtiIn * 1.5)}}>VTI</span>
				</div>
			)}

			<Camera keys={[{at: 0, zoom: 1}, {at: tThousands, zoom: 1}, {at: tThousands + 24, zoom: 1.04, y: 860}, {at: tIncl - 4, zoom: 1.04, y: 860}, {at: tIncl + 10, zoom: 1, y: 960}]}>
				{/* A — the fund */}
				{cA.on && (
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 560 + cA.y, opacity: cA.opacity}}>
						<div style={{fontSize: 28, fontWeight: 900, letterSpacing: 4, color: P.muted}}>VANGUARD</div>
						<div style={{fontSize: 62, fontWeight: 900, color: P.ink, lineHeight: 1.08, letterSpacing: -1, marginTop: 10}}>{VTI.name}</div>
						<div style={{marginTop: 40, display: 'flex', alignItems: 'center', gap: 22, background: P.accentSoft, borderRadius: 24, padding: '26px 30px'}}>
							<span style={{fontSize: 76, fontWeight: 900, color: GREEN}}>≈{VTI.indexCoverage.value}%</span>
							<span style={{fontSize: 34, fontWeight: 800, color: P.body, lineHeight: 1.2}}>of the investable U.S. stock market (its index)</span>
						</div>
						<SourceTag text={`${SOURCES.vti} · fund management summary`} palette={P} style={{left: 0, top: 470}} />
					</div>
				)}

				{/* B — the count */}
				{cB.on && (
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 600 + cB.y, opacity: cB.opacity}}>
						<NumberCounter value={stocks} prefix="" fontSize={230} color={GREEN} style={{letterSpacing: -8}} />
						<div style={{fontSize: 64, fontWeight: 900, color: P.ink, marginTop: 6, letterSpacing: -1}}>U.S. STOCKS</div>
						<div style={{fontSize: 40, fontWeight: 800, color: P.muted, marginTop: 6}}>in one fund</div>
						<SourceTag text={`${SOURCES.vti} · Number of stocks`} asOf={VTI.asOf} palette={P} style={{left: 0, top: 470}} />
					</div>
				)}

				{/* C — three names, as real weights */}
				{cC.on && (
					<div style={{position: 'absolute', inset: 0, opacity: cC.opacity, transform: `translateY(${cC.y}px)`}}>
						<div style={{position: 'absolute', left: BARS.x, top: 600, fontSize: 30, fontWeight: 900, letterSpacing: 3, color: P.muted}}>SHARE OF THE FUND</div>
						{rows.map((r, i) => {
							const p = sp(frame, fps, names[i] - 3, 'snappy');
							const grow = kf(frame, [names[i] - 2, names[i] + 14], [0, 1], E.out);
							return (
								<div key={r.src} style={{position: 'absolute', left: BARS.x, top: BARS.ys[i], height: BARS.h, display: 'flex', alignItems: 'center', gap: 24, opacity: Math.min(1, p * 1.5), transform: `translateX(${(1 - p) * -40}px)`}}>
									<div style={{width: BARS.logoW, height: BARS.h, borderRadius: 24, background: '#fff', border: `2px solid ${P.line}`, boxShadow: `0 12px 28px ${P.shadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
										<Img src={staticFile(asset(r.src))} style={{height: r.logoH, width: 'auto', maxWidth: '78%', objectFit: 'contain'}} />
									</div>
									<div style={{width: (BAR_MAX * r.w * grow) / VTI.aapl.value, height: 56, borderRadius: 14, background: GREEN}} />
									<span style={{fontSize: 56, fontWeight: 900, color: P.ink, letterSpacing: -1, opacity: grow}}>{r.w.toFixed(2)}%</span>
								</div>
							);
						})}
						<SourceTag text={`${SOURCES.vti} · Holding details`} asOf={VTI.asOf} palette={P} style={{left: BARS.x, top: 1190}} />
					</div>
				)}
			</Camera>

			<Sfx at={t70} name="coin" volume={0.35} />
			<Sfx at={tVti - 4} name="whoosh-soft" volume={0.35} />
			<Sfx at={tThousands} name="tick" volume={0.3} />
			{names.map((t, i) => (
				<Sfx key={i} at={t - 2} name="pop" volume={0.28} />
			))}
		</AbsoluteFill>
	);
};
