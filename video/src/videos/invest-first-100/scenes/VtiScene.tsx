import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {EvidenceChip, SourceTag} from '../../../story/components/Evidence';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {Screenshot} from '../../../story/components/Screenshot';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {PLAN, SOURCES, VTI} from '../facts';
import {FUND, NOTE, NOTE_H, SPLIT, stripX, TILES, white as P} from '../look';
import {asset, IntroStrip, LogoTile, swapIn, WhiteBg} from '../ui';

const CARD = {x: 100, y: 520, w: 860, vh: 540};
const NAT = {w: 1280};

/**
 * VTI — "First, I'd put $70 into VTI. This ETF gives me exposure to thousands
 * of U.S. companies, including Apple, Microsoft, and Amazon."
 * Real proof: Vanguard's own page — header, the holdings count (zoom + highlight
 * on "thousands") and the holdings table rows lit as each company is named.
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

	// hero: "$70 → VTI" then "3,519 STOCKS"
	const heroA = swapIn(frame, t70 - 4, tThousands - 4, 40);
	const heroB = swapIn(frame, tThousands - 2, Infinity, 40);
	const amt = kf(frame, [t70, t70 + 16], [PLAN.vti.value * 0.6, PLAN.vti.value], E.out);
	const vtiIn = sp(frame, fps, tVti - 3, 'bouncy');
	const stocks = kf(frame, [tThousands, tThousands + 30], [0, VTI.stocks.value], E.out);

	// proof cards
	const cA = swapIn(frame, tVti - 6, tThousands - 6);
	const cB = swapIn(frame, tThousands - 4, tIncl - 4);
	const cC = swapIn(frame, tIncl - 2);
	const pushB = kf(frame, [tThousands - 4, tThousands + 22], [0.55, 1], E.inOut);
	const markB = kf(frame, [tThousands + 10, tThousands + 22], [0, 1], E.out);
	const rowY = [340, 389, 438]; // AAPL, MSFT, AMZN rows in vti_hold.png
	const which = names.reduce((k, t, i) => (frame >= t - 2 ? i : k), -1);

	const tiles = [
		{src: 'AAPL.svg', h: 70, w: `${VTI.aapl.value.toFixed(2)}%`},
		{src: 'MSFT.png', h: 64, w: `${VTI.msft.value.toFixed(2)}%`},
		{src: 'AMZN.png', h: 46, w: `${VTI.amzn.value.toFixed(2)}%`},
	];

	const source = frame < tThousands - 4 ? {t: `${SOURCES.vti} · captured 11/04/2026`, a: undefined} : frame < tIncl - 2 ? {t: `${SOURCES.vti} · Characteristics`, a: VTI.asOf} : {t: `${SOURCES.vti} · Holding details`, a: VTI.asOf};

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<WhiteBg palette={P} />
			<ChapterTag n="01" label="$70 · VTI" at={4} palette={P} style={{left: story.safe.left, top: story.safe.top}} />

			<IntroStrip frame={frame} slice={SPLIT.cuts[0]} noteW={NOTE.w} x={stripX(0)} y={NOTE.cy - NOTE_H / 2} scale={1} tOut={t70} band={FUND.vti.light} />
			{/* hero line */}
			{heroA.on && (
				<div style={{position: 'absolute', left: story.safe.left, top: 300, display: 'flex', alignItems: 'center', gap: 28, opacity: heroA.opacity, transform: `translateY(${heroA.y}px)`}}>
					<NumberCounter value={amt} fontSize={150} color={FUND.vti.light} style={{letterSpacing: -4}} />
					<span style={{fontSize: 90, fontWeight: 900, color: P.muted}}>→</span>
					<span style={{fontSize: 150, fontWeight: 900, color: P.ink, letterSpacing: -4, display: 'inline-block', transform: `scale(${vtiIn})`, opacity: Math.min(1, vtiIn * 1.5)}}>VTI</span>
				</div>
			)}
			{heroB.on && (
				<div style={{position: 'absolute', left: story.safe.left, top: 300, display: 'flex', alignItems: 'baseline', gap: 26, opacity: heroB.opacity, transform: `translateY(${heroB.y}px)`}}>
					<NumberCounter value={stocks} prefix="" fontSize={150} color={FUND.vti.light} style={{letterSpacing: -4}} />
					<span style={{fontSize: 64, fontWeight: 900, color: P.ink, letterSpacing: -1}}>STOCKS</span>
				</div>
			)}

			{/* proof cards (unaltered official screenshots, framed + zoomed) */}
			{cA.on && (
				<Screenshot src={asset('vti_head.png')} natural={{w: NAT.w, h: 700}} w={CARD.w} viewportH={CARD.vh} zoomTo={{x: 50, y: 0, w: 760, h: 520}} focus={1} palette={P} style={{left: CARD.x - 10, top: CARD.y + cA.y, opacity: cA.opacity}} />
			)}
			{cB.on && (
				<Screenshot
					src={asset('vti_char.png')}
					natural={{w: NAT.w, h: 800}}
					w={CARD.w}
					viewportH={CARD.vh}
					zoomTo={{x: 76, y: 90, w: 680, h: 200}}
					focus={pushB}
					mark={{x: 82, y: 232, w: 661, h: 48}}
					highlight={markB}
					palette={P}
					style={{left: CARD.x - 10, top: CARD.y + cB.y, opacity: cB.opacity}}
				/>
			)}
			{cC.on && (
				<Screenshot
					src={asset('vti_hold.png')}
					natural={{w: NAT.w, h: 750}}
					w={CARD.w}
					viewportH={CARD.vh}
					zoomTo={{x: 76, y: 76, w: 760, h: 420}}
					focus={1}
					mark={which >= 0 ? {x: 82, y: rowY[which], w: 750, h: 48} : undefined}
					highlight={which >= 0 ? kf(frame, [names[which] - 2, names[which] + 6], [0.3, 1], E.out) : 0}
					palette={P}
					style={{left: CARD.x - 10, top: CARD.y + cC.y, opacity: cC.opacity}}
				/>
			)}
			<EvidenceChip text="OFFICIAL VANGUARD PAGE" palette={P} style={{left: CARD.x + 22, top: CARD.y - 22, opacity: kf(frame, [tVti - 4, tVti + 6], [0, 1])}} />
			<SourceTag text={source.t} asOf={source.a} palette={P} style={{left: CARD.x, top: CARD.y + CARD.vh + 40, opacity: kf(frame, [tVti, tVti + 10], [0, 1])}} />

			{/* the three names, as real logos + their weight in VTI */}
			{tiles.map((t, i) => (
				<LogoTile key={t.src} src={t.src} logoH={t.h} weight={t.w} caption="of VTI" palette={P} p={sp(frame, fps, names[i] - 3, 'bouncy')} style={{left: TILES.xs[i], top: TILES.y, width: TILES.w, height: TILES.h}} />
			))}

			<Sfx at={t70} name="coin" volume={0.35} />
			<Sfx at={tVti - 4} name="whoosh-soft" volume={0.4} />
			<Sfx at={tThousands - 4} name="whoosh-soft" volume={0.35} />
			<Sfx at={tThousands + 10} name="tick" volume={0.35} />
			{names.map((t, i) => (
				<Sfx key={i} at={t - 2} name="pop" volume={0.3} />
			))}
		</AbsoluteFill>
	);
};
