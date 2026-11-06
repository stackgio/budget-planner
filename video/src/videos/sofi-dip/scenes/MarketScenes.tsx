import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, shake, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {FACTS, NASDAQ, SPX} from '../facts';
import {CHART, LAST, Label, NasdaqLine, OrderShot, ROWS, lerpRegion} from '../parts';

const RED = P.danger;
const GREY = '#5B6068';

/** blend two hex colours */
const blend = (a: string, b: string, t: number) => {
	const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
	const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
	return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

const RedWash: React.FC<{amount: number}> = ({amount}) => (
	<AbsoluteFill style={{background: `radial-gradient(900px 700px at ${LAST.x}px ${LAST.y}px, rgba(255,91,72,${0.16 * amount}) 0%, rgba(0,0,0,0) 70%)`}} />
);

const ChartHeader: React.FC<{opacity?: number}> = ({opacity = 1}) => (
	<div style={{position: 'absolute', left: story.safe.left, top: 490, opacity}}>
		<Label color={P.muted}>Nasdaq Composite · daily close</Label>
	</div>
);

/**
 * SCENE 1 — HOOK. Frame 0: the real Nasdaq line falling under "PANIC-SELLING".
 * On "I did…" the line freezes and a green BUY lands on Nov 5; the REAL order
 * confirmation rises over the chart by ~2.3 s and pays off on "SoFi".
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tDid = cue('L2', 'did');
	const tComplete = cue('L2', 'complete');
	const tBought = cue('L3', 'bought');
	const tStock = cue('L3', 'stock.');
	const tEnd = cue('L3', 'stock.', 0, 'end');
	const progress = kf(frame, [0, tDid - 4], [0.4, 1], E.soft);
	const hit = shake(frame, tDid - 4, 14, 14);
	const freeze = kf(frame, [tDid - 2, tDid + 10], [0, 1]);
	const buy = sp(frame, fps, tDid + 2, 'bouncy');
	const ring = prog(frame, tDid + 2, 24);
	const shot = sp(frame, fps, tComplete - 6, 'smooth');
	const look = prog(frame, tComplete + 6, 14, E.inOut);
	const toShares = prog(frame, tBought, 12, E.inOut);
	const toTotal = prog(frame, tStock, 12, E.inOut);
	const color = freeze < 1 ? blend(RED, GREY, freeze) : GREY;
	const W = 780;
	void tEnd;
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg light={0.5 + 0.6 * buy} lightX={LAST.x} lightY={LAST.y} warm={buy < 0.5} />
			<RedWash amount={1 - freeze} />
			<Camera
				keys={[
					{at: 0, zoom: 1.1, x: 420, y: 860},
					{at: tDid - 4, zoom: 1.0, x: 540, y: 960, ease: E.out},
				]}
				shakeX={hit.x}
				shakeY={hit.y}
			>
				<div style={{opacity: 1 - 0.7 * shot}}>
					<ChartHeader />
					<NasdaqLine progress={progress} color={color} tipGlow={1 - freeze} />
					<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
						<circle cx={LAST.x} cy={LAST.y} r={22 + 70 * ring} fill="none" stroke={P.accent} strokeWidth={5} opacity={(1 - ring) * buy} />
						<circle cx={LAST.x} cy={LAST.y} r={20 * buy} fill={P.accent} stroke={P.bg} strokeWidth={6} />
					</svg>
				</div>
			</Camera>
			{/* the real order confirmation */}
			<OrderShot
				w={W}
				mark={toTotal > 0 ? lerpRegion(ROWS.shares, ROWS.total, toTotal) : toShares > 0 ? lerpRegion(ROWS.title, ROWS.shares, toShares) : ROWS.title}
				highlight={look}
				style={{left: (1080 - W) / 2 - 10, top: mix(1700, 470, shot), opacity: Math.min(1, shot * 2), transform: `rotate(${(1 - shot) * 3}deg)`}}
			/>
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 10, right: story.safe.right}}>
				<KineticText text="EVERYONE WAS PANIC-SELLING." at={-14} mode="none" exitAt={tDid - 2} fontSize={story.type.h1 + 10} color={P.ink} colors={{panicselling: RED}} />
			</div>
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 10, right: story.safe.right}}>
				<KineticText text="I DID THE OPPOSITE." at={tDid} mode="rise" exitAt={tBought - 4} fontSize={story.type.h1 + 10} color={P.ink} colors={{opposite: P.accent}} />
			</div>
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 10, right: story.safe.right}}>
				<KineticText text="I BOUGHT MORE." at={tBought - 2} mode="slam" slamScale={0.25} fontSize={story.type.h1 + 10} color={P.ink} colors={{more: P.accent}} />
			</div>
			<Sfx at={0} name="whoosh" volume={0.3} />
			<Sfx at={tDid - 4} name="thud" volume={0.35} />
			<Sfx at={tDid + 2} name="pop" volume={0.4} />
			<Sfx at={tComplete - 6} name="paper" volume={0.35} />
			<Sfx at={tBought - 2} name="stamp" volume={0.3} />
		</AbsoluteFill>
	);
};

/** tiny real sparkline for a panel */
const Spark: React.FC<{values: number[]; w: number; h: number; progress: number}> = ({values, w, h, progress}) => {
	const lo = Math.min(...values);
	const hi = Math.max(...values);
	const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - ((v - lo) / (hi - lo)) * h] as const);
	const n = Math.max(1, Math.floor(progress * (values.length - 1)));
	const d = pts.slice(0, n + 1).map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
	return (
		<svg width={w} height={h} style={{overflow: 'visible'}}>
			<path d={d} fill="none" stroke={RED} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
			<circle cx={pts[n][0]} cy={pts[n][1]} r={9} fill={RED} />
		</svg>
	);
};

const IndexPanel: React.FC<{name: string; pct: number; close: string; values: number[]; inAt: number; countAt: number; countEnd: number; top: number}> = ({
	name,
	pct,
	close,
	values,
	inAt,
	countAt,
	countEnd,
	top,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, inAt, 'heavy');
	const c = kf(frame, [countAt, countEnd], [0, 1], E.out);
	const v = pct * c;
	return (
		<div
			style={{
				position: 'absolute',
				left: story.safe.left - 12,
				right: story.safe.right - 60,
				top,
				height: 400,
				borderRadius: 34,
				background: P.paper,
				border: `2px solid ${P.line}`,
				padding: '38px 44px',
				boxSizing: 'border-box',
				transform: `translateY(${(1 - p) * 140}px)`,
				opacity: Math.min(1, p * 1.6),
				boxShadow: `0 30px 60px ${P.shadow}`,
				overflow: 'hidden',
			}}
		>
			<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: RED}} />
			<Label color={P.body} size={32}>
				{name}
			</Label>
			<div style={{marginTop: 18, fontSize: 168, fontWeight: 900, letterSpacing: -6, color: RED, lineHeight: 1, fontVariantNumeric: 'tabular-nums', opacity: kf(frame, [countAt - 3, countAt + 3], [0, 1])}}>
				−{Math.abs(v).toFixed(2)}%
			</div>
			<div style={{marginTop: 22, fontSize: 28, fontWeight: 700, letterSpacing: 2, color: P.muted, opacity: c}}>CLOSE {close}</div>
			<div style={{position: 'absolute', right: 44, bottom: 52}}>
				<Spark values={values} w={280} h={120} progress={kf(frame, [inAt, countEnd + 6], [0, 1], E.out)} />
			</div>
		</div>
	);
};

/** SCENE 3 — THE NUMBERS (verified: Reuters / CNBC / Yahoo Finance). */
export const NumbersScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tHit = cue('L4', 'hit');
	const tNq = cue('L5', 'Nasdaq');
	const tNqPct = cue('L5', '5.5%,');
	const tNqEnd = cue('L5', '5.5%,', 0, 'end');
	const tSp = cue('L6', 'S&P');
	const tSpPct = cue('L6', '4%.');
	const tSpEnd = cue('L6', '4%.', 0, 'end');
	const chip = sp(frame, fps, 0, 'snappy');
	const hitIn = sp(frame, fps, tHit - 2, 'heavy');
	const dock = kf(frame, [tNq - 10, tNq + 6], [0, 1], E.inOut);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg light={0.6} lightX={540} lightY={700} />
			<Camera keys={[{at: 0, zoom: 1.0}, {at: tSpEnd, zoom: 1.0}, {at: tSpEnd + 30, zoom: 1.04, x: 540, y: 900}]}>
				{/* "yesterday": the date leads big, then docks at the top when the numbers arrive */}
				<div
					style={{
						position: 'absolute',
						left: story.safe.left,
						top: mix(560, story.safe.top + 30, dock),
						opacity: chip,
						transform: `scale(${mix(1.45, 1, dock)})`,
						transformOrigin: '0% 0%',
					}}
				>
					<Label color={P.muted} size={30}>
						Yesterday · Thursday
					</Label>
					<div style={{fontSize: story.type.h1, fontWeight: 900, color: P.ink, letterSpacing: -2, marginTop: 6}}>NOV 5, 2026</div>
					<div style={{marginTop: 18, fontSize: 52, fontWeight: 900, letterSpacing: -1, color: P.danger, opacity: hitIn * (1 - dock)}}>A MASSIVE HIT</div>
				</div>
				<IndexPanel name="Nasdaq Composite" pct={FACTS.nasdaqPct.value} close={FACTS.nasdaqClose.value.toLocaleString('en-US', {minimumFractionDigits: 2})} values={NASDAQ} inAt={tNq - 4} countAt={tNqPct} countEnd={tNqEnd} top={420} />
				<IndexPanel name="S&P 500" pct={FACTS.spxPct.value} close={FACTS.spxClose.value.toLocaleString('en-US', {minimumFractionDigits: 2})} values={SPX} inAt={tSp - 6} countAt={tSpPct} countEnd={tSpEnd} top={860} />
				<div style={{position: 'absolute', left: story.safe.left, top: 1290, fontSize: 24, fontWeight: 700, color: P.muted, letterSpacing: 1, opacity: kf(frame, [tSpEnd, tSpEnd + 10], [0, 1])}}>
					Daily close vs. Nov 4 · Source: Reuters, Yahoo Finance
				</div>
			</Camera>
			<Sfx at={tHit - 2} name="thud" volume={0.3} />
			<Sfx at={tNq - 4} name="whoosh-soft" volume={0.3} />
			<Sfx at={tSp - 6} name="whoosh-soft" volume={0.3} />
		</AbsoluteFill>
	);
};

/** SCENE 3b — "…I saw an opportunity." The panic line dims; a green scan lands on Nov 5. */
export const OppScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tInstead = cue('L7', 'instead');
	const tSaw = cue('L7', 'saw');
	const tOpp = cue('L7', 'opportunity.');
	const scan = kf(frame, [tInstead, tSaw + 6], [0, 1], E.inOut);
	const scanX = mix(CHART.x, LAST.x, scan);
	const found = sp(frame, fps, tSaw + 6, 'bouncy');
	const pulse = (frame - tSaw) % 30 / 30;
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg light={0.4 + 0.8 * found} lightX={LAST.x} lightY={LAST.y} warm={false} />
			<Camera keys={[{at: 0, zoom: 1.0}, {at: tSaw, zoom: 1.0}, {at: tOpp + 20, zoom: 1.1, x: LAST.x - 160, y: LAST.y - 120}]}>
				<NasdaqLine progress={1} color={RED} opacity={0.35} fill={0.4} tipGlow={0} labels={0.6} />
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<defs>
						<linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor={P.accent} stopOpacity={0} />
							<stop offset="100%" stopColor={P.accent} stopOpacity={0.35} />
						</linearGradient>
					</defs>
					{scan > 0 && scan < 1 && <rect x={scanX - 220} y={CHART.y} width={220} height={CHART.h - 70} fill="url(#beam)" />}
					{scan > 0 && <line x1={scanX} x2={scanX} y1={CHART.y} y2={CHART.y + CHART.h - 70} stroke={P.accent} strokeWidth={4} opacity={scan < 1 ? 1 : 1 - found} />}
					{found > 0.01 && frame > tSaw && <circle cx={LAST.x} cy={LAST.y} r={26 + 80 * pulse} fill="none" stroke={P.accent} strokeWidth={4} opacity={(1 - pulse) * 0.8} />}
					<circle cx={LAST.x} cy={LAST.y} r={22 * found} fill="none" stroke={P.accent} strokeWidth={8} />
					<circle cx={LAST.x} cy={LAST.y} r={10 * found} fill={P.accent} />
				</svg>
			</Camera>
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 20, right: story.safe.right}}>
				<KineticText
					text="AN OPPORTUNITY?"
					at={tOpp - 4}
					mode="rise"
					fontSize={story.type.display - 12}
					color={P.ink}
					colors={{opportunity: P.accent}}
					marker={{words: ['OPPORTUNITY?'], color: P.accentSoft, at: tOpp + 8}}
				/>
			</div>
			<Sfx at={tInstead} name="whoosh-soft" volume={0.25} />
			<Sfx at={tSaw + 6} name="chime" volume={0.3} />
		</AbsoluteFill>
	);
};
