// DMM-004 · "Waiting ten years to invest doesn't cost you the small years." (narrated: creator's "Stack voice")
// A tree-trunk cross-section: one ring per invested year, ring AREA = the balance
// (radius ∝ √balance), so late rings are visibly the biggest. "The last ten" turn
// emerald; after the voice, those 10 rings lift away (a 35-year-old starter's
// trunk at 65), then grow back one per year (start 10 years earlier). Every beat
// is keyed to the narration's word timestamps (timing.ts ← voice.words.json).
import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../../fonts';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {Camera2D} from '../../components/Camera2D';
import {SafeZoneOverlay, Signature} from '../../components/Chrome';
import {FilmFinish, Stage} from '../../components/FilmLook';
import {Headline} from '../../components/Headline';
import {ringPath, RingStyle, TreeRings} from '../../components/TreeRings';
import {buildPages, WordCaptions} from '../../components/WordCaptions';
import {dmm, usd} from '../../theme';
import {AGE_EARLY, AGE_LATE, B_EARLY, B_LATE, balance, k, LAST_TEN, MONTHLY, RATE, YEARS_EARLY, YEARS_LATE} from './facts';
import {FPS, KEY_WORDS, PAGE_BREAKS, T, VO_OFFSET, WORDS} from './timing';

export {QC_BEATS} from './timing';

const C = dmm.color;
const CX = 540;
const CY = 930;
const R = 300;
const RADII = Array.from({length: YEARS_EARLY}, (_, i) => R * Math.sqrt(balance(i + 1) / B_EARLY.value));
const PAGES = buildPages(WORDS, FPS, VO_OFFSET, PAGE_BREAKS, KEY_WORDS);
const START_YEARS = 3; // rings already present on frame 0 (hook has an object)

const win = (f: number, a: number, b: number, fade = 8) => Math.min(prog(f, a, fade, E.out), 1 - prog(f, b, fade, E.in));

export const DMM004: React.FC<{showSafeZones?: boolean; audio?: boolean}> = ({showSafeZones = false, audio = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// ---- growth: year 3 on frame 0 → 40 rings by the end of "ring."
	const growP = prog(frame, 0, T.growDone, (t) => t); // linear in years: the area visibly accelerates
	const years = mix(START_YEARS, YEARS_EARLY, growP);
	// ---- emphasis: the last ten rings turn emerald on "last"; the first thirty dim on "first"
	const lastOn = prog(frame, T.last - 2, 10);
	const firstDim = prog(frame, T.first - 2, 10);
	// ---- payoff: peel the outer 10 (late start), then regrow them one per year
	const peelP = prog(frame, T.peel, 34, E.inOut);
	const peeled = frame >= T.peel;
	const regrowYears = frame < T.regrow ? 0 : 10 * prog(frame, T.regrow, T.regrowDone - T.regrow, (t) => t);
	const regrowing = frame >= T.regrow;

	const newest = Math.ceil(years);
	const ringStyle = (i: number): RingStyle => {
		const outer = i > YEARS_LATE;
		const band = i % 2 === 0;
		const accent = outer ? lastOn : 0;
		const fresh = !peeled && i === newest ? 1 - (years - Math.floor(years)) : 0; // newest ring flashes as it lands
		if (accent > 0 || (regrowing && outer)) {
			const a = regrowing && outer ? 1 : accent;
			return {
				fill: band ? `rgba(54,217,121,${mix(0.13, 0.34, a)})` : `rgba(8,13,10,${mix(0.6, 0.55, a)})`,
				stroke: `rgba(54,217,121,${mix(0.22, 0.7, a)})`,
				strokeW: 1.1 + a * 0.6,
			};
		}
		const dim = outer ? 0 : firstDim * 0.35;
		return {
			fill: band ? `rgba(156,163,175,${0.16 - dim * 0.22})` : `rgba(8,13,10,0.6)`,
			stroke: `rgba(255,255,255,${0.2 + fresh * 0.55 - dim * 0.4})`,
			strokeW: 1.1 + fresh * 1.6,
		};
	};

	// ---- camera: tight on the young trunk, pulling back as it grows
	const camKeys = [
		{at: 0, zoom: 3.0, fx: CX, fy: CY},
		{at: T.small, zoom: 1.6, fx: CX, fy: CY},
		{at: T.biggest, zoom: 1.18, fx: CX, fy: CY},
		{at: T.growDone, zoom: 1.0, fx: CX, fy: CY},
		{at: T.thirty + 6, zoom: 1.03, fx: CX, fy: CY + 10},
		{at: T.peel + 30, zoom: 0.94, fx: CX, fy: CY + 10},
		{at: T.regrowDone, zoom: 1.0, fx: CX, fy: CY},
		{at: 449, zoom: 1.02, fx: CX, fy: CY},
	];

	// ---- readouts
	const shownYears = Math.max(START_YEARS, Math.min(YEARS_EARLY, Math.floor(years + 1e-6)));
	const ageRead = win(frame, -20, T.growDone, 6);
	const splitRead = win(frame, T.growDone + 7, T.peel - 2, 6);
	const firstIn = prog(frame, T.first - 2, 10);
	const lateIn = sp(frame, fps, T.lateTag, 'smooth');
	const earlyIn = sp(frame, fps, T.regrow - 4, 'smooth');
	const earlyVal = B_LATE.value + (LAST_TEN.value * regrowYears) / 10;
	const signIn = prog(frame, T.sign, 16);
	const ghost = peeled ? 0.5 * prog(frame, T.peel + 10, 16) * (1 - prog(frame, T.regrowDone - 10, 14)) : 0;
	const glint = prog(frame, T.regrowDone - 4, 40, E.inOut);

	return (
		<AbsoluteFill style={{fontFamily: dmm.font}}>
			<Stage lightX={CX} lightY={CY - 80} light={1 + 0.5 * lastOn * (1 - peelP) + 0.4 * (regrowYears / 10)} />
			<Camera2D keys={camKeys} anchor={[CX, CY]} drift={0.6}>
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<defs>
						<radialGradient id="dmm4core" cx="50%" cy="50%" r="50%">
							<stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
							<stop offset="100%" stopColor="rgba(255,255,255,0)" />
						</radialGradient>
					</defs>
					{/* bark: a soft dark rim that grows with the trunk */}
					{(() => {
						const outerIdx = peeled ? (regrowing ? YEARS_LATE + regrowYears : YEARS_LATE) : years;
						const i0 = Math.max(1, Math.floor(outerIdx));
						const rr = i0 >= YEARS_EARLY ? RADII[YEARS_EARLY - 1] : mix(RADII[i0 - 1], RADII[Math.min(YEARS_EARLY - 1, i0)], outerIdx - i0);
						return <path d={ringPath(CX, CY, rr + 10, outerIdx)} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.22)" strokeWidth={8} />;
					})()}
					{/* ghost outline of the trunk a 25-year-old starter would have */}
					<path d={ringPath(CX, CY, RADII[YEARS_EARLY - 1], YEARS_EARLY)} fill="none" stroke={C.accent} strokeWidth={3} strokeDasharray="10 12" strokeDashoffset={-frame * 0.8} opacity={ghost} />
					{!peeled ? (
						<TreeRings cx={CX} cy={CY} radii={RADII} shown={years} ringStyle={ringStyle} />
					) : (
						<>
							{/* the outer ten lift away (scale up + fade) */}
							<g opacity={1 - peelP} transform={`translate(${CX} ${CY}) scale(${1 + 0.16 * peelP}) translate(${-CX} ${-CY})`}>
								<TreeRings cx={CX} cy={CY} radii={RADII} shown={YEARS_EARLY} ringStyle={ringStyle} skip={(i) => i <= YEARS_LATE} />
							</g>
							<TreeRings cx={CX} cy={CY} radii={RADII} shown={YEARS_LATE + regrowYears} ringStyle={ringStyle} skip={(i) => i > YEARS_LATE && !regrowing} />
						</>
					)}
					<circle cx={CX} cy={CY} r={RADII[6]} fill="url(#dmm4core)" />
					{/* final glint sweeping once around the restored trunk */}
					{glint > 0 && glint < 1 && (
						<path
							d={ringPath(CX, CY, RADII[YEARS_EARLY - 1] + 2, YEARS_EARLY)}
							fill="none"
							stroke={C.ink}
							strokeWidth={4}
							pathLength={100}
							strokeDasharray="8 92"
							strokeDashoffset={-100 * glint}
							opacity={Math.sin(Math.PI * glint) * 0.9}
						/>
					)}
				</svg>
			</Camera2D>

			{/* legibility band behind captions */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,13,10,0.9) 0%, rgba(8,13,10,0.6) 18%, rgba(8,13,10,0) 26%, rgba(8,13,10,0) 74%, rgba(8,13,10,0.85) 88%)'}} />

			<WordCaptions pages={PAGES} y={196} size={76} />
			<Headline
				y={196}
				at={T.headline}
				stagger={6}
				align="center"
				lines={[
					{text: 'START NOW.', size: 88},
					{text: 'THE BIG RINGS COME LAST.', size: 64, color: C.accent},
				]}
			/>

			{/* readouts under the trunk */}
			<div style={{position: 'absolute', left: dmm.safe.left, width: 888, top: 1290, height: 150, fontVariantNumeric: 'tabular-nums'}}>
				<div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 28, opacity: ageRead}}>
					<span style={{fontSize: 40, fontWeight: 800, letterSpacing: 3, color: C.muted}}>AGE {AGE_EARLY.value + shownYears}</span>
					<span style={{fontSize: 64, fontWeight: 900, color: C.ink}}>{usd(Math.round(balance(shownYears) / 100) * 100)}</span>
				</div>
				<div style={{position: 'absolute', inset: 0, opacity: splitRead}}>
					<Row label="LAST 10 YEARS ADD" value={`+${k(LAST_TEN.value)}`} color={C.accent} y={0} />
					<Row label="FIRST 30 YEARS" value={k(B_LATE.value)} color={C.muted} y={68} opacity={firstIn} />
				</div>
				<div style={{position: 'absolute', inset: 0, opacity: peeled ? 1 : 0}}>
					<Row label={`START AT ${AGE_LATE.value}`} value={k(B_LATE.value)} color={C.muted} y={0} opacity={Math.min(1, lateIn * 1.3)} shift={(1 - lateIn) * 20} />
					<Row label={`START AT ${AGE_EARLY.value}`} value={k(earlyVal)} color={C.accent} y={68} opacity={Math.min(1, earlyIn * 1.3)} shift={(1 - earlyIn) * 20} />
				</div>
			</div>

			<div style={{opacity: signIn}}>
				<Signature y={1452} />
			</div>
			<div style={{position: 'absolute', left: dmm.safe.left, top: 1500, width: 888, fontSize: 23, lineHeight: 1.3, fontWeight: 600, color: C.muted}}>
				<span style={{color: C.ink, fontWeight: 800, letterSpacing: 2}}>EXAMPLE</span> · {usd(MONTHLY.value)}/mo invested to age 65 · {Math.round(RATE.value * 100)}%/yr average return assumed, compounded monthly · not guaranteed. Not advice.
			</div>

			<FilmFinish grain={0.06} />
			{showSafeZones && <SafeZoneOverlay />}
			{audio && (
				<>
					<Html5Audio src={staticFile('daily/audio/dmm004-sfx-v02.wav')} />
					<Sequence from={VO_OFFSET} layout="none" name="voice: Stack voice">
						<Html5Audio src={staticFile('daily/voice/DMM-004/voice.mp3')} />
					</Sequence>
				</>
			)}
		</AbsoluteFill>
	);
};

const Row: React.FC<{label: string; value: string; color: string; y: number; opacity?: number; shift?: number}> = ({label, value, color, y, opacity = 1, shift = 0}) => (
	<div style={{position: 'absolute', left: 60, right: 60, top: y, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity, transform: `translateY(${shift}px)`}}>
		<span style={{fontSize: 34, fontWeight: 800, letterSpacing: 3, color}}>{label}</span>
		<span style={{fontSize: 56, fontWeight: 900, color}}>{value}</span>
	</div>
);
