import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {EvidenceChip, SourceTag} from '../../../story/components/Evidence';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {Screenshot} from '../../../story/components/Screenshot';
import {WorldMap} from '../../../story/components/WorldMap';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {PLAN, SOURCES, VXUS} from '../facts';
import {FUND, NOTE, SPLIT, white as P} from '../look';
import {asset, IntroStrip, swapIn, WhiteBg} from '../ui';
import {WORLD} from '../worldPaths';

const BLUE = FUND.vxus.light;
const MAP = {x: 72, y: 500, w: 936};
const MAP_H = (MAP.w * WORLD.h) / WORLD.w;
const PROOF = {x: 100, y: 1040, w: 860, vh: 300};
const k = MAP.w / WORLD.w;

/**
 * VXUS — "$10 into VXUS. Because I don't want all my money invested in the
 * United States. VXUS gives me exposure to companies in other countries,
 * like Japan, Germany, and Canada."
 * Proof: Vanguard page header, region table, number of stocks; country weights
 * from Vanguard's VXUS fact sheet (as of 09/30/2026).
 */
export const VxusScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t10 = cue('L8', '$10?');
	const tVxus = cue('L8', 'VXUS.');
	const tBecause = cue('L9', 'Because');
	const tUS = cue('L9', 'United');
	const tVx2 = cue('L10', 'VXUS');
	const tOther = cue('L10', 'other');
	const tLike = cue('L10', 'like');
	const tC = [cue('L10', 'Japan,'), cue('L10', 'Germany,'), cue('L10', 'Canada.')];

	const amt = kf(frame, [t10, t10 + 16], [PLAN.vxus.value * 0.6, PLAN.vxus.value], E.out);
	const tickIn = sp(frame, fps, tVxus - 3, 'bouncy');
	const heroA = swapIn(frame, t10 - 4, tVx2 - 4, 40);
	const heroB = swapIn(frame, tVx2 - 2, tLike - 4, 40);
	const heroC = swapIn(frame, tLike - 2, Infinity, 40);
	const stocks = kf(frame, [tVx2, tVx2 + 28], [0, VXUS.stocks.value], E.out);

	const head = swapIn(frame, tVxus - 6, tBecause - 6);
	const map = swapIn(frame, tBecause - 4);
	const usOff = kf(frame, [tUS, tUS + 12], [0, 1]);
	const world = kf(frame, [tUS + 4, tUS + 24], [0, 1]);
	const reg = swapIn(frame, tUS - 2, tVx2 - 4, 50);
	const chr = swapIn(frame, tVx2 - 2, Infinity, 50);

	const fills: Record<string, string> = {USA: usOff < 0.5 ? P.ink : '#E7E9EC'};
	const countries = [
		{id: 'JPN', name: 'JAPAN', v: VXUS.japan.value, t: tC[0], dx: -150, dy: 60},
		{id: 'DEU', name: 'GERMANY', v: VXUS.germany.value, t: tC[1], dx: 10, dy: -78},
		{id: 'CAN', name: 'CANADA', v: VXUS.canada.value, t: tC[2], dx: -250, dy: -70},
	];
	for (const c of countries) if (frame >= c.t - 3) fills[c.id] = BLUE;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<WhiteBg palette={P} />
			<ChapterTag n="03" label="$10 · VXUS" at={4} palette={{...P, accent: BLUE}} style={{left: story.safe.left, top: story.safe.top}} />

			<IntroStrip frame={frame} slice={SPLIT.cuts[2]} noteW={NOTE.w} x={540 - 96} y={530} scale={2.4} tOut={t10} band={BLUE} />
			{heroA.on && (
				<div style={{position: 'absolute', left: story.safe.left, top: 300, display: 'flex', alignItems: 'center', gap: 28, opacity: heroA.opacity, transform: `translateY(${heroA.y}px)`}}>
					<NumberCounter value={amt} fontSize={150} color={BLUE} style={{letterSpacing: -4}} />
					<span style={{fontSize: 90, fontWeight: 900, color: P.muted}}>→</span>
					<span style={{fontSize: 150, fontWeight: 900, color: P.ink, letterSpacing: -4, display: 'inline-block', transform: `scale(${tickIn})`, opacity: Math.min(1, tickIn * 1.5)}}>VXUS</span>
				</div>
			)}
			{heroB.on && (
				<div style={{position: 'absolute', left: story.safe.left, top: 300, display: 'flex', alignItems: 'baseline', gap: 24, opacity: heroB.opacity, transform: `translateY(${heroB.y}px)`}}>
					<NumberCounter value={stocks} prefix="" fontSize={150} color={BLUE} style={{letterSpacing: -4}} />
					<span style={{fontSize: 52, fontWeight: 900, color: P.ink, lineHeight: 1}}>
						STOCKS
						<br />
						<span style={{color: P.muted, fontSize: 36}}>OUTSIDE THE U.S.</span>
					</span>
				</div>
			)}
			{heroC.on && (
				<div style={{position: 'absolute', left: story.safe.left, top: 300, display: 'flex', alignItems: 'center', gap: 24, opacity: heroC.opacity, transform: `translateY(${heroC.y}px)`}}>
					<span style={{fontSize: 120, fontWeight: 900, color: BLUE, letterSpacing: -4}}>${PLAN.vxus.value}</span>
					<span style={{fontSize: 70, fontWeight: 900, color: P.muted}}>→</span>
					<span style={{fontSize: 54, fontWeight: 900, color: P.ink, lineHeight: 1.02, letterSpacing: -1}}>
						INTERNATIONAL
						<br />
						DIVERSIFICATION
					</span>
				</div>
			)}

			{/* Vanguard header (official screenshot) */}
			{head.on && (
				<>
					<Screenshot src={asset('vxus_head.png')} natural={{w: 1280, h: 700}} w={860} viewportH={540} zoomTo={{x: 50, y: 0, w: 760, h: 520}} focus={1} palette={P} style={{left: 90, top: 520 + head.y, opacity: head.opacity}} />
					<EvidenceChip text="OFFICIAL VANGUARD PAGE" palette={P} style={{left: 122, top: 498 + head.y, opacity: head.opacity}} />
				</>
			)}

			{/* world map: everything that is NOT the U.S. */}
			{map.on && (
				<WorldMap
					countries={WORLD.countries}
					vw={WORLD.w}
					vh={WORLD.h}
					w={MAP.w}
					base={world > 0 ? mixColor(world) : '#E7E9EC'}
					stroke="#FFFFFF"
					fills={fills}
					style={{left: MAP.x, top: MAP.y + map.y, opacity: map.opacity}}
				>
					{/* U.S. label */}
					<div style={{position: 'absolute', left: 170 * k, top: 150 * k, fontSize: 30, fontWeight: 900, color: usOff < 0.5 ? '#fff' : P.muted, letterSpacing: 2, opacity: 1 - 0.4 * usOff}}>
						{usOff < 0.5 ? 'U.S.' : 'NOT IN VXUS'}
					</div>
					{countries.map((c) => {
						const p = sp(frame, fps, c.t - 3, 'bouncy');
						if (p <= 0.01) return null;
						const [cx, cy] = WORLD.pins[c.id as 'JPN' | 'DEU' | 'CAN'];
						const px = (c.id === 'CAN' ? cx - 10 : cx) * k;
						const py = cy * k;
						return (
							<React.Fragment key={c.id}>
								<div style={{position: 'absolute', left: px - 9, top: py - 9, width: 18, height: 18, borderRadius: 9, background: P.ink, border: '3px solid #fff', transform: `scale(${p})`}} />
								<div
									style={{
										position: 'absolute',
										left: px + c.dx,
										top: py + c.dy,
										background: P.ink,
										color: '#fff',
										borderRadius: 14,
										padding: '8px 16px',
										fontSize: 28,
										fontWeight: 900,
										letterSpacing: 1,
										whiteSpace: 'nowrap',
										transform: `scale(${p})`,
										transformOrigin: '0 100%',
										boxShadow: `0 10px 24px ${P.shadow}`,
									}}
								>
									{c.name} <span style={{color: '#8FB6FF'}}>{c.v.toFixed(1)}%</span>
								</div>
							</React.Fragment>
						);
					})}
				</WorldMap>
			)}
			{map.on && (
				<SourceTag
					text={frame >= tC[0] - 3 ? `${SOURCES.vxusFactSheet} · % of stocks` : `${SOURCES.vxus}`}
					asOf={VXUS.asOf}
					palette={{...P, accent: BLUE}}
					style={{left: MAP.x + 20, top: MAP.y + MAP_H + 6, opacity: map.opacity}}
				/>
			)}

			{/* proof under the map */}
			{reg.on && (
				<Screenshot
					src={asset('vxus_reg.png')}
					natural={{w: 1280, h: 700}}
					w={PROOF.w}
					viewportH={PROOF.vh}
					zoomTo={{x: 464, y: 250, w: 734, h: 250}}
					focus={1}
					mark={{x: 464, y: 449, w: 734, h: 46}}
					highlight={kf(frame, [tUS + 8, tUS + 18], [0, 1])}
					palette={P}
					style={{left: PROOF.x - 10, top: PROOF.y + reg.y, opacity: reg.opacity}}
				/>
			)}
			{chr.on && (
				<Screenshot
					src={asset('vxus_char.png')}
					natural={{w: 1280, h: 780}}
					w={PROOF.w}
					viewportH={PROOF.vh}
					zoomTo={{x: 82, y: 150, w: 880, h: 120}}
					focus={1}
					mark={{x: 82, y: 205, w: 880, h: 46}}
					highlight={kf(frame, [tVx2 + 8, tVx2 + 18], [0, 1])}
					palette={P}
					style={{left: PROOF.x - 10, top: PROOF.y + chr.y, opacity: chr.opacity}}
				/>
			)}

			<Sfx at={t10} name="coin" volume={0.35} />
			<Sfx at={tVxus - 4} name="whoosh-soft" volume={0.35} />
			<Sfx at={tUS} name="click" volume={0.3} />
			<Sfx at={tVx2 + 8} name="tick" volume={0.3} />
			<Sfx at={tOther} name="whoosh-soft" volume={0.25} />
			{tC.map((t, i) => (
				<Sfx key={i} at={t - 3} name="pop" volume={0.3} />
			))}
		</AbsoluteFill>
	);
};

/** grey → light blue as the rest of the world switches on */
const mixColor = (t: number) => {
	const a = [231, 233, 236];
	const b = [191, 214, 246];
	return `rgb(${a.map((v, i) => Math.round(mix(v, b[i], t))).join(',')})`;
};
