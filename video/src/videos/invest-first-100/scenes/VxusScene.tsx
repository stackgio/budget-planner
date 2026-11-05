import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {SourceTag} from '../../../story/components/Evidence';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {WorldMap} from '../../../story/components/WorldMap';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {PLAN, SOURCES, VXUS} from '../facts';
import {FUND, NOTE, SPLIT, white as P} from '../look';
import {IntroStrip, swapIn, WhiteBg} from '../ui';
import {WORLD} from '../worldPaths';

const BLUE = FUND.vxus.light;
const MAP = {x: 72, y: 540, w: 936};
const MAP_H = (MAP.w * WORLD.h) / WORLD.w;
const k = MAP.w / WORLD.w;
const GREY = [231, 233, 236];
const LIGHT = [191, 214, 246];
// first x of each country path → order of the left-to-right "switch on" wave
const XS = WORLD.countries.map((c) => Number((/M\s*(-?[\d.]+)/.exec(c.d) ?? [0, 500])[1]) / WORLD.w);

/**
 * VXUS — ONE visual: the world map.
 *  "$10 → VXUS" → the U.S. greys out ("not in VXUS") → the rest of the world switches
 *  on left to right → 8,901 stocks → Japan / Germany / Canada pins with fact-sheet weights.
 */
export const VxusScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t10 = cue('L8', '$10?');
	const tVxus = cue('L8', 'VXUS.');
	const tUS = cue('L9', 'want'); // the U.S. greys out as soon as the idea lands
	const tVx2 = cue('L10', 'VXUS');
	const tOther = cue('L10', 'other'); // map 'switch-on' SFX
	const tLike = cue('L10', 'like');
	const tC = [cue('L10', 'Japan,'), cue('L10', 'Germany,'), cue('L10', 'Canada.')];

	const amt = kf(frame, [t10, t10 + 14], [PLAN.vxus.value, PLAN.vxus.value], E.out);
	const tickIn = sp(frame, fps, tVxus - 3, 'bouncy');
	const heroA = swapIn(frame, t10 - 4, tLike - 4, 40);
	const heroC = swapIn(frame, tLike - 2, Infinity, 40);
	const map = swapIn(frame, t10 + 2);
	const usOff = kf(frame, [tUS, tUS + 10], [0, 1]);
	const wave = kf(frame, [tUS + 2, tUS + 22], [0, 1.2], E.inOut);
	const count = swapIn(frame, tVx2 - 2, Infinity, 40);
	const stocks = kf(frame, [tVx2, tVx2 + 26], [0, VXUS.stocks.value], E.out);

	const fills: Record<string, string> = {USA: usOff < 0.5 ? P.ink : `rgb(${GREY.join(',')})`};
	const countries = [
		{id: 'JPN', name: 'JAPAN', v: VXUS.japan.value, t: tC[0], dx: -170, dy: 40},
		{id: 'DEU', name: 'GERMANY', v: VXUS.germany.value, t: tC[1], dx: 10, dy: -78},
		{id: 'CAN', name: 'CANADA', v: VXUS.canada.value, t: tC[2], dx: -250, dy: -70},
	];
	for (const c of countries) if (frame >= c.t - 3) fills[c.id] = BLUE;
	const colorAt = (i: number) => {
		const c = WORLD.countries[i];
		if (fills[c.id]) return fills[c.id];
		const t = Math.max(0, Math.min(1, (wave - XS[i]) / 0.2));
		return `rgb(${GREY.map((g, j) => Math.round(mix(g, LIGHT[j], t))).join(',')})`;
	};

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

			<Camera keys={[{at: 0, zoom: 1}]}>
				{map.on && (
					<WorldMap countries={WORLD.countries} vw={WORLD.w} vh={WORLD.h} w={MAP.w} base="#E7E9EC" stroke="#FFFFFF" colorAt={colorAt} style={{left: MAP.x, top: MAP.y + map.y, opacity: map.opacity}}>
						<div style={{position: 'absolute', left: 168 * k, top: 150 * k, fontSize: 30, fontWeight: 900, letterSpacing: 2, color: usOff < 0.5 ? '#fff' : P.muted, background: usOff < 0.5 ? 'transparent' : 'rgba(255,255,255,0.85)', borderRadius: 10, padding: '2px 10px'}}>
							{usOff < 0.5 ? 'U.S.' : 'NOT IN VXUS'}
						</div>
						{countries.map((c) => {
							const p = sp(frame, fps, c.t - 3, 'snappy');
							if (p <= 0.01) return null;
							const [cx, cy] = WORLD.pins[c.id as 'JPN' | 'DEU' | 'CAN'];
							const px = (c.id === 'CAN' ? cx - 10 : cx) * k;
							const py = cy * k;
							return (
								<React.Fragment key={c.id}>
									<div style={{position: 'absolute', left: px - 9, top: py - 9, width: 18, height: 18, borderRadius: 9, background: P.ink, border: '3px solid #fff', transform: `scale(${p})`}} />
									<div style={{position: 'absolute', left: px + c.dx, top: py + c.dy, background: P.ink, color: '#fff', borderRadius: 14, padding: '8px 16px', fontSize: 30, fontWeight: 900, whiteSpace: 'nowrap', transform: `scale(${p})`, transformOrigin: '0 100%', boxShadow: `0 10px 24px ${P.shadow}`}}>
										{c.name} <span style={{color: '#8FB6FF'}}>{c.v.toFixed(1)}%</span>
									</div>
								</React.Fragment>
							);
						})}
					</WorldMap>
				)}
				{count.on && (
					<div style={{position: 'absolute', left: story.safe.left, top: MAP.y + MAP_H + 24 + count.y, opacity: count.opacity}}>
						<div style={{display: 'flex', alignItems: 'baseline', gap: 22}}>
							<NumberCounter value={stocks} prefix="" fontSize={130} color={BLUE} style={{letterSpacing: -5}} />
							<span style={{fontSize: 46, fontWeight: 900, color: P.ink, lineHeight: 1.02}}>
								STOCKS
								<br />
								<span style={{color: P.muted, fontSize: 34}}>OUTSIDE THE U.S.</span>
							</span>
						</div>
					</div>
				)}
			</Camera>
			{count.on && (
				<SourceTag
					size={28}
					text={frame >= tC[0] - 3 ? SOURCES.vxusFactSheet : `${SOURCES.vxus} · stocks`}
					asOf={VXUS.asOf}
					palette={{...P, accent: BLUE}}
					style={{left: story.safe.left, top: 1316, opacity: count.opacity}}
				/>
			)}

			<Sfx at={t10} name="coin" volume={0.35} />
			<Sfx at={tVxus - 4} name="whoosh-soft" volume={0.3} />
			<Sfx at={tUS + 2} name="whoosh-soft" volume={0.3} />
			<Sfx at={tOther} name="chime" volume={0.18} />
			<Sfx at={tVx2} name="tick" volume={0.28} />
			{tC.map((t, i) => (
				<Sfx key={i} at={t - 3} name="pop" volume={0.28} />
			))}
		</AbsoluteFill>
	);
};
