// DMM-005 · "Everyone sees your car payment. Nobody sees what you invest." (narrated: creator's "Stack voice")
// An iceberg cut by a waterline. Above water, a small floe carries a car: the
// payment everyone sees. The camera dives under the surface, where the same
// $700 a month, invested, builds a faceted mass month by month (area ∝ balance).
// It pulls out to show the tiny visible tip against the hidden mass. Every beat is
// keyed to the narration's word timestamps (timing.ts ← voice.words.json).
import React from 'react';
import {AbsoluteFill, Html5Audio, random, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../../fonts';
import {E, prog, sp} from '../../../story/lib/motion';
import {Camera2D} from '../../components/Camera2D';
import {SafeZoneOverlay, Signature} from '../../components/Chrome';
import {FilmFinish, Stage} from '../../components/FilmLook';
import {Headline} from '../../components/Headline';
import {CarIcon, Iceberg} from '../../components/Iceberg';
import {buildPages, WordCaptions} from '../../components/WordCaptions';
import {dmm, usd} from '../../theme';
import {B_FINAL, balance, k, MONTHLY, MONTHS, PUT_IN, RATE, YEARS} from './facts';
import {FPS, KEY_WORDS, PAGE_BREAKS, T, VO_OFFSET, WORDS} from './timing';

export {QC_BEATS} from './timing';

const C = dmm.color;
const CX = 540;
const WATER = 640;
const FLOE_H = 110;
const PAGES = buildPages(WORDS, FPS, VO_OFFSET, PAGE_BREAKS, KEY_WORDS);
const BUBBLES = Array.from({length: 18}, (_, i) => ({x: 220 + random(`bx${i}`) * 640, off: random(`bo${i}`) * 700, v: 1.2 + random(`bv${i}`) * 1.6, r: 3 + random(`br${i}`) * 5}));

const win = (f: number, a: number, b: number, fade = 8) => Math.min(prog(f, a, fade, E.out), 1 - prog(f, b, fade, E.in));

export const DMM005: React.FC<{showSafeZones?: boolean; audio?: boolean}> = ({showSafeZones = false, audio = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// ---- the hidden mass: month 0 → 120 from "Seven" to the end of "thousand."
	const months = MONTHS * prog(frame, T.seven - 4, T.growDone - T.seven + 4, (t) => t);
	const s = Math.sqrt(balance(months) / B_FINAL.value);
	const bob = Math.sin(frame / 22) * 4;
	const glint = frame >= T.glint ? prog(frame, T.glint, 54, E.inOut) : -1;

	// ---- camera: on the visible tip → dive under the surface → pull out to the whole berg
	const camKeys = [
		{at: 0, zoom: 1.45, fx: CX, fy: 560},
		{at: T.payment, zoom: 1.4, fx: CX, fy: 572},
		{at: T.invest + 6, zoom: 1.15, fx: CX, fy: 860},
		{at: T.seven, zoom: 1.15, fx: CX, fy: 880},
		{at: T.growDone, zoom: 0.96, fx: CX, fy: 930},
		{at: T.under + 6, zoom: 0.88, fx: CX, fy: 960},
		{at: T.voEnd + 34, zoom: 0.89, fx: CX, fy: 957},
		{at: 449, zoom: 0.9, fx: CX, fy: 955},
	];

	// payoff push: CONSTANT speed (an eased push stalls and reads as a static hold),
	// anchored at the berg's base so the bottom never reaches the stats
	const push = 1 + 0.12 * prog(frame, T.voEnd + 20, 449 - T.voEnd - 20, (t) => t);

	// ---- water surface
	const wave = (x: number) => WATER + Math.sin(x / 70 + frame / 9) * 5 + Math.sin(x / 31 - frame / 6) * 2.2;
	let surface = '';
	for (let x = -300; x <= 1380; x += 20) surface += `${x === -300 ? 'M' : 'L'}${x} ${wave(x).toFixed(1)}`;
	const waterBody = `${surface}L1380 2600L-300 2600Z`;

	// ---- readouts
	const growRead = win(frame, T.nobody, T.growDone + 6, 8);
	const totalsIn = sp(frame, fps, T.totals, 'smooth');
	const totals2In = sp(frame, fps, T.totals + 12, 'smooth');
	const pillIn = sp(frame, fps, -6, 'smooth') * (1 - prog(frame, T.headline - 6, 14));
	const pillPulse = 1 + 0.06 * Math.max(0, 1 - Math.abs(frame - T.payment - 4) / 8);
	const signIn = prog(frame, T.sign, 16);
	const shownMonths = Math.floor(months + 1e-6);

	return (
		<AbsoluteFill style={{fontFamily: dmm.font}}>
			<Stage lightX={CX} lightY={frame < T.nobody ? 420 : 1100} light={1 + 0.5 * s} />
			<AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '540px 1290px'}}>
			<Camera2D keys={camKeys} anchor={[540, 960]} drift={0.7}>
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<defs>
						<linearGradient id="dmm5water" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="rgba(54,217,121,0.2)" />
							<stop offset="40%" stopColor="rgba(54,217,121,0.1)" />
							<stop offset="100%" stopColor="rgba(54,217,121,0.03)" />
						</linearGradient>
					</defs>
					<g transform={`translate(0 ${bob})`}>
						<Iceberg cx={CX} waterY={WATER} s={s} floeH={FLOE_H} glint={glint} />
						<CarIcon cx={CX - 10} ground={WATER - FLOE_H * 0.83} />
					</g>
					{/* water drawn over the mass so the surface reads as a surface */}
					<path d={waterBody} fill="url(#dmm5water)" />
					{/* light shafts from the surface, swaying (continuous motion + a look of its own) */}
					{[-120, 120, 360, 600, 840, 1080].map((x0, i) => {
						const sway = Math.sin(frame / (28 + i * 5) + i * 1.7) * 60;
						const top = x0 + sway;
						const w0 = 70 + (i % 3) * 30;
						return <path key={i} d={`M${top} ${WATER + 6}L${top + w0} ${WATER + 6}L${top + w0 + 260} ${WATER + 900}L${top + 140} ${WATER + 900}Z`} fill={`rgba(54,217,121,${0.05 + 0.03 * Math.sin(frame / 17 + i)})`} />;
					})}
					<path d={surface} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2.5} />
					{BUBBLES.map((b, i) => {
						const y = WATER + 760 - ((frame * b.v + b.off) % 720);
						return y > WATER + 14 ? <circle key={i} cx={b.x + Math.sin(frame / 12 + i) * 6} cy={y} r={b.r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1.5} /> : null;
					})}
				</svg>
				{/* what everyone sees: the payment rides on the car */}
				<div style={{position: 'absolute', left: CX - 260, width: 520, top: WATER - FLOE_H - 150 + bob, textAlign: 'center', opacity: Math.min(1, pillIn * 1.4), transform: `scale(${pillPulse})`}}>
					<div style={{display: 'inline-block', padding: '8px 22px', borderRadius: 999, border: `2px solid ${C.ink}`, background: C.bg, color: C.ink, fontSize: 30, fontWeight: 900, letterSpacing: 2, whiteSpace: 'nowrap'}}>
						CAR PAYMENT · {usd(MONTHLY.value)}/MO
					</div>
				</div>
			</Camera2D>
			</AbsoluteFill>

			{/* legibility band behind captions */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,13,10,0.92) 0%, rgba(8,13,10,0.6) 18%, rgba(8,13,10,0) 26%, rgba(8,13,10,0) 66%, rgba(8,13,10,0.88) 72%)'}} />

			<WordCaptions pages={PAGES} y={196} size={76} />
			<Headline
				y={196}
				at={T.headline}
				stagger={6}
				align="center"
				lines={[
					{text: 'BUILD WHAT', size: 88},
					{text: 'NOBODY SEES.', size: 88, color: C.accent},
				]}
			/>

			{/* readouts */}
			<div style={{position: 'absolute', left: dmm.safe.left, width: 888, top: 1318, height: 150, fontVariantNumeric: 'tabular-nums'}}>
				<div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 28, opacity: growRead}}>
					<span style={{fontSize: 38, fontWeight: 800, letterSpacing: 3, color: C.muted}}>INVESTED · MONTH {shownMonths}</span>
					<span style={{fontSize: 62, fontWeight: 900, color: C.accent}}>{usd(Math.round(balance(shownMonths) / 10) * 10)}</span>
				</div>
				<div style={{position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-around', opacity: frame >= T.totals ? 1 : 0}}>
					<Stat label={`PUT IN · ${YEARS.value} YRS`} value={usd(PUT_IN.value)} color={C.muted} opacity={Math.min(1, totalsIn * 1.3)} shift={(1 - totalsIn) * 20} />
					<div style={{width: 2, height: 110, background: 'rgba(255,255,255,0.14)', opacity: totals2In}} />
					<Stat label="COULD GROW TO" value={k(B_FINAL.value)} color={C.accent} opacity={Math.min(1, totals2In * 1.3)} shift={(1 - totals2In) * 20} />
				</div>
			</div>

			<div style={{opacity: signIn}}>
				<Signature y={1462} />
			</div>
			<div style={{position: 'absolute', left: dmm.safe.left, top: 1506, width: 888, fontSize: 23, lineHeight: 1.3, fontWeight: 600, color: C.muted}}>
				<span style={{color: C.ink, fontWeight: 800, letterSpacing: 2}}>EXAMPLE</span> · {usd(MONTHLY.value)}/mo invested for {YEARS.value} years · {Math.round(RATE.value * 100)}%/yr average return assumed, compounded monthly · not guaranteed. Not advice.
			</div>

			<FilmFinish grain={0.06} />
			{showSafeZones && <SafeZoneOverlay />}
			{audio && (
				<>
					<Html5Audio src={staticFile('daily/audio/dmm005-sfx-v01.wav')} />
					<Sequence from={VO_OFFSET} layout="none" name="voice: Stack voice">
						<Html5Audio src={staticFile('daily/voice/DMM-005/voice.mp3')} />
					</Sequence>
				</>
			)}
		</AbsoluteFill>
	);
};

/** Stacked stat: small label over a big number (two side by side under the berg). */
const Stat: React.FC<{label: string; value: string; color: string; opacity?: number; shift?: number}> = ({label, value, color, opacity = 1, shift = 0}) => (
	<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity, transform: `translateY(${shift}px)`}}>
		<span style={{fontSize: 28, fontWeight: 800, letterSpacing: 3, color: dmm.color.muted}}>{label}</span>
		<span style={{fontSize: 76, fontWeight: 900, color, letterSpacing: -1}}>{value}</span>
	</div>
);
