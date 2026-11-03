import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {ChapterTag, Sfx} from '../../../story/components/Chrome';
import {DebtMeter} from '../../../story/components/DebtMeter';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {Bill} from '../../../story/components/Money';
import {StoryGraph} from '../../../story/components/StoryGraph';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {valueAt} from '../../../lib/timeline';
import {cinematic as P, story} from '../../../story/theme';
import {balanceAfterFirst, EXAMPLE, interestSaved, minOnly, monthsSaved, withExtra} from '../numbers';

const HX = 300; // Marcus hip x (sitting, facing right)
const DESK_Y = 1150;
const METER = {x: 600, y: 480, size: 420};
const GRAPH = {x: 30, y: 480, w: 1010, h: 760, pad: {l: 130, r: 80, t: 40, b: 80}};
const LAMP = {x: 905, y: 905};

/** Desk, chair, laptop, lamp — drawn once, lit by the lamp. */
const Desk: React.FC<{clock: string; glow: number}> = ({clock, glow}) => (
	<>
		{/* lamp light cone */}
		<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
			<defs>
				<radialGradient id="cone" cx={LAMP.x} cy={LAMP.y} r={520} gradientUnits="userSpaceOnUse">
					<stop offset="0%" stopColor="rgba(255,232,190,0.42)" />
					<stop offset="100%" stopColor="rgba(255,232,190,0)" />
				</radialGradient>
			</defs>
			<path d={`M${LAMP.x - 20},${LAMP.y + 10}L${LAMP.x - 520},${DESK_Y + 4}L${LAMP.x + 60},${DESK_Y + 4}Z`} fill="url(#cone)" />
			{/* chair */}
			<g stroke="#3A3E46" strokeWidth={12} strokeLinecap="round" fill="none">
				<path d={`M${HX - 60},${DESK_Y - 210}L${HX - 52},${DESK_Y + 100}`} />
				<path d={`M${HX - 56},${DESK_Y + 100}H${HX + 70}`} />
				<path d={`M${HX - 40},${DESK_Y + 100}L${HX - 60},1340M${HX + 56},${DESK_Y + 100}L${HX + 70},1340`} />
			</g>
			{/* desk */}
			<rect x={HX + 120} y={DESK_Y} width={1080 - HX - 120 + 20} height={20} rx={4} fill="#2B2F36" />
			<rect x={HX + 140} y={DESK_Y + 20} width={14} height={1340 - DESK_Y - 20} fill="#22252B" />
			{/* laptop (side view): base + lid, screen glow toward Marcus */}
			<rect x={HX + 150} y={DESK_Y - 12} width={210} height={12} rx={4} fill="#9AA1AB" />
			<g transform={`translate(${HX + 352},${DESK_Y - 8}) rotate(-12)`}>
				<rect x={-8} y={-170} width={12} height={172} rx={5} fill="#B9C0CA" />
			</g>
			<path d={`M${HX + 330},${DESK_Y - 160}L${HX + 40},${DESK_Y - 330}L${HX + 40},${DESK_Y - 60}Z`} fill={`rgba(44,212,122,${0.08 * glow})`} />
			{/* lamp */}
			<g stroke="#5A606A" strokeWidth={9} strokeLinecap="round" fill="none">
				<path d={`M${LAMP.x + 70},${DESK_Y}L${LAMP.x + 90},${LAMP.y - 60}L${LAMP.x + 10},${LAMP.y - 14}`} />
			</g>
			<rect x={LAMP.x + 30} y={DESK_Y - 12} width={90} height={12} rx={6} fill="#5A606A" />
			<path d={`M${LAMP.x - 40},${LAMP.y + 18}L${LAMP.x + 30},${LAMP.y - 44}L${LAMP.x + 52},${LAMP.y - 16}Z`} fill="#6B717C" />
			<circle cx={LAMP.x - 4} cy={LAMP.y + 6} r={9} fill="#FFF3D6" />
		</svg>
		{/* desk clock: time-lapse of a late shift */}
		<div
			style={{
				position: 'absolute',
				left: HX + 400,
				top: DESK_Y - 66,
				width: 170,
				height: 62,
				borderRadius: 12,
				background: '#121417',
				border: '3px solid #2C3038',
				color: P.accent,
				fontSize: 30,
				fontWeight: 800,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontVariantNumeric: 'tabular-nums',
				letterSpacing: 1,
				textShadow: `0 0 12px ${P.accentSoft}`,
			}}
		>
			{clock}
		</div>
	</>
);

const SOURCES = [
	{word: 'overtime', label: 'OVERTIME', amount: `+$${EXAMPLE.overtime}/mo`},
	{word: 'selling', label: 'SOLD STUFF', amount: `+$${EXAMPLE.sold}`},
	{word: 'cutting', label: 'CUT COSTS', amount: `+$${EXAMPLE.cut}/mo`},
];

/**
 * 02 — EXTRA MONEY (cinematic)
 * Learn: every extra dollar shortens the payoff. Feel: late-night effort turning
 * into visible progress, then the payoff — the curve that ends years sooner.
 */
export const ExtraScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t0 = cue('L5');
	const tL6 = cue('L6');
	const hits = SOURCES.map((s) => cue('L6', s.word));
	const tGraph = cue('L6', 'can');
	const tFaster = cue('L6', 'faster');
	const fly = 16;

	// meter follows the extra-payment plan month by month (time-lapse)
	const month = hits.reduce((m, h) => m + 2 * prog(frame, h + 6 + fly, 14, E.out), 0);
	const remaining = valueAt(withExtra.balances, month);
	const hitPulse = Math.max(...hits.map((h) => kf(frame, [h + 6 + fly, h + 10 + fly, h + 30 + fly], [0, 1, 0])));

	// clock: 9:58 PM → 11:42 PM over the scene (time-lapse of overtime)
	const mins = Math.round(mix(9 * 60 + 58, 11 * 60 + 42, prog(frame, t0, tGraph - t0, E.inOut)));
	const clock = `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')} PM`;

	// meter → graph origin (object-to-object), desk sinks away
	const g = sp(frame, fps, tGraph - 4, 'smooth');
	const plotH = GRAPH.h - GRAPH.pad.t - GRAPH.pad.b;
	const yMax = 9000;
	const origin = {x: GRAPH.x + GRAPH.pad.l, y: GRAPH.y + GRAPH.pad.t + plotH * (1 - balanceAfterFirst / yMax)};
	const mScale = mix(1, 0.12, g);
	const mCx = mix(METER.x + METER.size / 2, origin.x, g);
	const mCy = mix(METER.y + METER.size / 2, origin.y, g);
	const draw = prog(frame, tGraph + 6, 40, E.soft);
	const xMax = minOnly.balances.length - 1;
	const greenDone = kf(draw, [withExtra.months / xMax, withExtra.months / xMax + 0.08], [0, 1], E.out);
	const callout = sp(frame, fps, tFaster - 2, 'bouncy');
	const chipLabel = (text: string, color: string, dark = false) => (
		<div style={{background: color, color: dark ? P.bg : '#fff', fontSize: 26, fontWeight: 900, padding: '6px 14px', borderRadius: 10, letterSpacing: 1}}>{text}</div>
	);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={LAMP.x - 120} lightY={LAMP.y + 140} light={1 - g * 0.6} floorY={1340 + g * 600} />
			<ChapterTag n="02" label="EXTRA MONEY" at={t0 - 2} palette={P} style={{left: story.safe.left, top: story.safe.top + 10}} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 296}}>
				<KineticText text="Find extra money to throw at your debt." at={t0 + 4} fontSize={70} color={P.ink} colors={{extra: P.accent, money: P.accent}} />
			</div>
			<Camera keys={[{at: 0, zoom: 1.06, x: 560, y: 1000}, {at: t0 + 40, zoom: 1, x: 540, y: 960}]} handheld={g > 0.5 ? 0 : 1.5}>
				{/* desk world sinks out when the graph takes over */}
				<div style={{position: 'absolute', inset: 0, transform: `translateY(${g * 560}px)`, opacity: 1 - g}}>
					<Desk clock={clock} glow={1} />
					<Marcus
						x={HX}
						y={1340}
						scale={1.05}
						facing={1}
						seed={3}
						onDark
						track={[
							{at: 0, pose: 'sitType', face: 'focused', cycle: 'type'},
							{at: hits[0] + 4, pose: ['sitType', {head: 2}], face: 'determined', cycle: 'type'},
							{at: hits[2] + 20, pose: ['sit', {head: -8, fs: 40, fe: 120}], face: 'happy', cycle: 'none'},
						]}
					/>
				</div>

				{/* income sources */}
				{SOURCES.map((s, i) => {
					const p = sp(frame, fps, hits[i] - 2, 'bouncy');
					return (
						<div
							key={s.label}
							style={{
								position: 'absolute',
								left: story.safe.left,
								top: 530 + i * 104,
								width: 470,
								height: 80,
								borderRadius: 20,
								background: P.paper,
								border: `2px solid ${P.line}`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '0 24px',
								boxSizing: 'border-box',
								transform: `translateX(${(1 - p) * -60}px) scale(${0.9 + 0.1 * p})`,
								opacity: Math.min(1, p * 1.4) * (1 - g),
							}}
						>
							<div style={{fontSize: 28, fontWeight: 900, letterSpacing: 2, color: P.body}}>{s.label}</div>
							<div style={{fontSize: 30, fontWeight: 900, color: P.accent}}>{s.amount}</div>
						</div>
					);
				})}
				{/* money flows from each source into the meter */}
				{hits.map((h, i) => {
					const f = prog(frame, h + 6, fly, E.inOut);
					if (f <= 0 || f >= 1) return null;
					const [x, y] = arc(f, [story.safe.left + 470, 570 + i * 104], [METER.x + METER.size / 2, METER.y + METER.size / 2], 120);
					return <Bill key={i} w={120} value="$" style={{left: x, top: y, transform: `translate(-50%,-50%) rotate(${f * 220 - 30}deg) scale(${1 - 0.4 * f})`}} />;
				})}

				{/* the meter */}
				<div style={{position: 'absolute', left: mCx - METER.size / 2, top: mCy - METER.size / 2, width: METER.size, height: METER.size, transform: `scale(${mScale})`, opacity: 1 - kf(g, [0.6, 0.95], [0, 1])}}>
					<DebtMeter total={balanceAfterFirst} remaining={remaining} size={METER.size} palette={P} hit={hitPulse} style={{left: 0, top: 0}} />
					<div style={{position: 'absolute', left: 0, right: 0, top: METER.size * 0.86, textAlign: 'center', fontSize: 24, fontWeight: 800, letterSpacing: 3, color: P.muted}}>
						MONTH {Math.round(month)}
					</div>
				</div>

				{/* payoff curves: minimum only vs with extra */}
				{g > 0.02 && (
					<StoryGraph
						w={GRAPH.w}
						h={GRAPH.h}
						pad={GRAPH.pad}
						palette={P}
						yMax={yMax}
						progress={draw}
						axisOpacity={kf(g, [0.4, 1], [0, 1])}
						style={{left: GRAPH.x, top: GRAPH.y}}
						yLabels={[
							{v: 0, text: '$0'},
							{v: 4000, text: '$4K'},
							{v: 8000, text: '$8K'},
						]}
						xLabels={[0, 12, 24, 36, 48].map((m) => ({at: m / xMax, text: m === 0 ? 'NOW' : `${m / 12} YR`}))}
						series={[
							{id: 'min', values: minOnly.balances, color: '#8A9099', width: 6, dash: '14 12', endLabel: draw > 0.97 ? chipLabel(`${minOnly.months} MONTHS`, '#8A9099', true) : undefined},
							{id: 'extra', values: withExtra.balances, color: P.accent, width: 9, fill: true},
						]}
						markers={[{at: withExtra.months / xMax, seriesId: 'extra', show: greenDone, label: chipLabel(`PAID OFF · ${withExtra.months} MO`, P.accent)}]}
					/>
				)}
				{callout > 0.01 && (
					<div style={{position: 'absolute', right: story.safe.right - 40, top: GRAPH.y + 70, textAlign: 'right', transform: `translateY(${(1 - callout) * 30}px)`, opacity: Math.min(1, callout * 1.5)}}>
						<div style={{fontSize: 92, fontWeight: 900, color: P.accent, letterSpacing: -3, lineHeight: 1}}>{monthsSaved} months</div>
						<div style={{fontSize: 44, fontWeight: 900, color: P.ink, letterSpacing: -1}}>sooner</div>
						<div style={{fontSize: 28, fontWeight: 700, color: P.body, marginTop: 10}}>${Math.round(interestSaved).toLocaleString('en-US')} less interest</div>
					</div>
				)}
				{g > 0.05 && (
					<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: GRAPH.y + GRAPH.h + 6, fontSize: 21, fontWeight: 600, color: P.muted, opacity: g, lineHeight: 1.35}}>
						Example: ${balanceAfterFirst.toLocaleString('en-US')} at {(EXAMPLE.apr * 100).toFixed(1)}% APR. ${EXAMPLE.minPayment}/mo minimum vs +${EXAMPLE.extraMonthly}/mo extra and ${EXAMPLE.sold} from selling stuff.
					</div>
				)}
			</Camera>
			<Sfx at={0} name="click" volume={0.5} />
			<Sfx at={t0 + 10} name="tick" volume={0.35} />
			<Sfx at={tL6 - 6} name="tick" volume={0.35} />
			{hits.map((h, i) => (
				<React.Fragment key={i}>
					<Sfx at={h - 2} name="pop" volume={0.3} />
					<Sfx at={h + 6 + fly} name="cash" volume={0.4} />
				</React.Fragment>
			))}
			<Sfx at={tGraph - 2} name="whoosh-soft" volume={0.45} />
			<Sfx at={tFaster - 2} name="chime" volume={0.35} />
		</AbsoluteFill>
	);
};
