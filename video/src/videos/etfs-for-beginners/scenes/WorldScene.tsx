import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {FundCard, StockTile, Swap, TickerWord} from '../../../story/components/FundCards';
import {mapHeight, usPoint, WorldDotMap} from '../../../story/components/WorldDotMap';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {INTL_TILES} from '../facts';
import {C, Desc, FONT} from './common';

const MAP = {x: 40, y: 560, w: 1000};
const MAP_SMALL = {x: 250, y: 470, w: 580};
const PAIR = {y: 800, w: 380, h: 540, xs: [120, 580]};

const Legend: React.FC<{color: string; lit: number; label: string; strike?: number}> = ({color, lit, label, strike = 0}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 14, fontSize: 34, fontWeight: 800, color: C.ink, opacity: 0.35 + 0.65 * lit, position: 'relative'}}>
		<div style={{width: 24, height: 24, borderRadius: 12, background: lit > 0.5 ? color : '#3A3F47'}} />
		{label}
		{strike > 0 && <div style={{position: 'absolute', left: 36, right: -6, top: '52%', height: 4, background: C.ink, transformOrigin: '0 50%', transform: `scaleX(${strike})`}} />}
	</div>
);

/** VT → VXUS — one map: zoom out from the U.S. as VT lights the world; VXUS dims the U.S.; then VOO + VXUS side by side. */
export const WorldScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tVt = cue('L13', 'VT', -0.05);
	const tWorld = cue('L13', 'worldwide');
	const tUs = cue('L14', 'US');
	const tOther = cue('L14', 'other');
	const tVxus = cue('L15', 'VXUS', -0.05);
	const tOverseas = cue('L15', 'overseas');
	const tVoo = cue('L16', 'VOO');
	const tOutside = cue('L16', 'outside');
	const tVxus2 = cue('L16', 'VXUS');

	// camera: start tight on the U.S., pull out to the world on "takes it worldwide"
	const [ux, uy] = usPoint(MAP.x, MAP.y, MAP.w);
	const ripple = prog(frame, tWorld - 4, Math.max(20, tOther - tWorld + 10), E.soft);
	const usDim = prog(frame, tOverseas, 14);
	const shrink = sp(frame, fps, tVoo - 4, 'smooth');
	const m = {x: mix(MAP.x, MAP_SMALL.x, shrink), y: mix(MAP.y, MAP_SMALL.y, shrink), w: mix(MAP.w, MAP_SMALL.w, shrink)};
	const legend = 1 - prog(frame, tVoo - 6, 10);

	const ticker = [
		{at: tVt, node: <TickerWord text="VT" fontSize={150} />},
		{at: tVxus, node: <TickerWord text="VXUS" prev="VT" at={tVxus} hold={60} fontSize={150} />},
	];
	const desc = [
		{at: tUs, node: <Desc text="U.S. + international stocks" hl={['+', 'international']} fontSize={52} />},
		{at: tVxus, node: <Desc text="Stocks outside the U.S." hl={['outside']} fontSize={52} />},
	];
	const pair = [
		{t: tVoo, ticker: 'VOO', desc: 'Large U.S. companies', hl: ['U.S.'], tiles: ['Apple', 'Microsoft'], glow: 0},
		{t: tOutside, ticker: 'VXUS', desc: 'Companies outside the U.S.', hl: ['outside'], tiles: INTL_TILES, glow: kf(frame, [tVxus2, tVxus2 + 8], [0, 1])},
	];
	return (
		<AbsoluteFill style={{fontFamily: FONT}}>
			<CinematicBg lightX={540} lightY={760} warm={false} />
			<div style={{position: 'absolute', left: 120, top: 210, right: 120}}>
				<Swap steps={ticker} height={156} dur={10} />
				<Swap steps={desc} height={64} dur={10} style={{marginTop: 8}} />
			</div>
			<Camera
				keys={[
					{at: 0, zoom: 2.6, x: ux, y: uy},
					{at: tWorld - 8, zoom: 2.6, x: ux, y: uy},
					{at: tWorld + 26, zoom: 1, x: 540, y: 960, ease: E.inOut},
				]}
			>
				<WorldDotMap x={m.x} y={m.y} w={m.w} us={1 - 0.85 * usDim} intl={ripple} ripple usColor={C.accent} />
			</Camera>
			<div style={{position: 'absolute', left: 120, right: 120, top: MAP.y + mapHeight(MAP.w) + 40, display: 'flex', justifyContent: 'center', gap: 60, opacity: legend * prog(frame, tWorld + 10, 12)}}>
				<Legend color={C.accent} lit={1 - usDim} label="U.S." strike={usDim} />
				<Legend color={C.accent} lit={ripple} label="International" />
			</div>
			{/* VOO + VXUS, equal-size cards (no allocation implied) */}
			{pair.map((p, i) => {
				const e = sp(frame, fps, p.t, 'bouncy');
				if (e < 0.01) return null;
				const x = PAIR.xs[i];
				return (
					<div key={p.ticker} style={{opacity: Math.min(1, e * 1.5), transform: `translateY(${(1 - e) * 120}px)`, position: 'absolute', inset: 0}}>
						<FundCard x={x} y={PAIR.y} w={PAIR.w} h={PAIR.h} glow={p.glow} radius={34}>
							<div style={{position: 'absolute', left: 34, top: 30, right: 30}}>
								<TickerWord text={p.ticker} fontSize={104} />
								<Desc text={p.desc} hl={p.hl} fontSize={38} style={{marginTop: 14}} />
							</div>
						</FundCard>
						{p.tiles.map((t, k) => (
							<StockTile key={t} x={x + 34} y={PAIR.y + 300 + k * 110} w={PAIR.w - 68} h={90} label={t} fontSize={40} focus={i === 1 ? p.glow * 0.6 : 0} />
						))}
					</div>
				);
			})}
			{(() => {
				const e = sp(frame, fps, tOutside - 4, 'bouncy');
				return e > 0.01 ? (
					<div style={{position: 'absolute', left: 540 - 40, top: PAIR.y + PAIR.h / 2 - 40, width: 80, height: 80, borderRadius: 40, background: C.ink, color: '#0B0C0E', fontSize: 64, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${e})`, lineHeight: 1}}>+</div>
				) : null;
			})()}
			<Sfx at={tWorld} name="whoosh" volume={0.22} />
			<Sfx at={tOverseas} name="click" volume={0.2} />
			<Sfx at={tVoo} name="card" volume={0.2} />
			<Sfx at={tOutside} name="card" volume={0.18} />
		</AbsoluteFill>
	);
};
