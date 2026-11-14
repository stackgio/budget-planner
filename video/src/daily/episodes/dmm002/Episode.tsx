// DMM-002 · "Saving is invisible. Until it isn't." (Engine C-style 2.5D cinematic motion design)
// One note a day drops into a glass column. Four slow, tactile drops (hook),
// then a year in time-lapse. The column — barely visible at first — fills and
// lights up. Sound is generated from the SAME drop schedule (timing.ts).
import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import '../../../fonts';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {E, kf, prog, sp, wobble} from '../../../story/lib/motion';
import {Camera2D} from '../../components/Camera2D';
import {Signature} from '../../components/Chrome';
import {FilmFinish, Stage} from '../../components/FilmLook';
import {GlassBack, GlassFront} from '../../components/GlassColumn';
import {Headline} from '../../components/Headline';
import {Note} from '../../components/Note';
import {SafeZoneOverlay} from '../../components/Chrome';
import {dmm} from '../../theme';
import {DAILY, TOTAL} from './facts';
import {COL, DAYS, FULL, G, LANDINGS, SPAWN_Y, T, THICK, landedBy, launch} from './timing';

export {QC_BEATS} from './timing';

const C = dmm.color;
const NOTE_W = COL.w - 44;

/** Notes in flight at frame f (pure function of frame → safe for motion blur). */
const FallingNotes: React.FC = () => {
	const f = useCurrentFrame();
	const out: React.ReactNode[] = [];
	for (let d = 1; d <= DAYS; d++) {
		const l0 = launch(d);
		if (l0 > f) break;
		const l1 = LANDINGS[d - 1];
		if (f >= l1) continue;
		// time-lapse: when several notes launch per frame, draw a thinned stream
		const gap = launch(d + 1) - l0;
		const every = gap >= 1.6 ? 1 : Math.ceil(1.6 / Math.max(0.05, gap));
		if (d % every !== 0) continue;
		const t = f - l0;
		const y = SPAWN_Y + 0.5 * G * t * t;
		const x = COL.cx + wobble(f, d * 1.7, 1.6, 14) * Math.min(1, t / 6);
		const flutter = Math.sin(t * 0.55 + d) * 0.5 + 0.5;
		const toFlat = Math.min(1, t / (l1 - l0));
		out.push(<Note key={d} opacity={every > 1 ? 0.8 : 1} x={x} y={y} w={NOTE_W} rot={wobble(f, d * 3.1, 2.4, 9)} tilt={0.35 + 0.45 * flutter * (1 - toFlat) + 0.5 * toFlat} />);
	}
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
			<defs>
				{/* notes live inside the glass: clip to the interior, fade in at the mouth */}
				<clipPath id="colInterior">
					<rect x={COL.cx - COL.w / 2 + 3} y={COL.top - 70} width={COL.w - 6} height={COL.bottom - COL.top + 70} />
				</clipPath>
				<linearGradient id="mouthFade" x1={0} x2={0} gradientUnits="userSpaceOnUse" y1={COL.top - 70} y2={COL.top + 30}>
					<stop offset="0%" stopColor="#fff" stopOpacity={0} />
					<stop offset="100%" stopColor="#fff" stopOpacity={1} />
				</linearGradient>
				<mask id="mouthMask" maskUnits="userSpaceOnUse" x={0} y={0} width={1080} height={1920}>
					<rect x={0} y={COL.top - 70} width={1080} height={1920} fill="url(#mouthFade)" />
				</mask>
			</defs>
			<g clipPath="url(#colInterior)" mask="url(#mouthMask)">
				{out}
			</g>
		</svg>
	);
};

const Stack: React.FC<{n: number; impact: number}> = ({n, impact}) => {
	if (n <= 0) return null;
	const top = COL.bottom - n * THICK;
	const x0 = COL.cx - COL.w / 2 + 10;
	const w = COL.w - 20;
	const tops = Math.min(n, 6);
	return (
		<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
			<defs>
				<pattern id="stackLines" width={8} height={6.6} patternUnits="userSpaceOnUse">
					<rect width={8} height={6.6} fill="hsl(148, 30%, 24%)" />
					<rect y={0} width={8} height={2.2} fill="hsl(146, 26%, 34%)" />
				</pattern>
				<linearGradient id="stackShade" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#000" stopOpacity={0.55} />
					<stop offset="30%" stopColor="#000" stopOpacity={0.05} />
					<stop offset="70%" stopColor="#000" stopOpacity={0.1} />
					<stop offset="100%" stopColor="#000" stopOpacity={0.6} />
				</linearGradient>
			</defs>
			<rect x={x0} y={top} width={w} height={COL.bottom - top} fill="url(#stackLines)" />
			<rect x={x0} y={top} width={w} height={COL.bottom - top} fill="url(#stackShade)" />
			{Array.from({length: tops}, (_, i) => {
				const k = n - tops + i + 1; // day number of this note
				return <Note key={k} x={COL.cx + Math.sin(k * 2.3) * 5} y={COL.bottom - k * THICK + 1} w={NOTE_W + 8} rot={Math.sin(k * 1.7) * 2.5} tilt={0.9} shade={(tops - 1 - i) * 0.12} />;
			})}
			{/* settle squash on each landing */}
			<ellipse cx={COL.cx} cy={top + 2} rx={w * 0.5} ry={6 + impact * 6} fill={C.accent} opacity={0.12 * impact} />
		</svg>
	);
};

export const DMM002: React.FC<{showSafeZones?: boolean; audio?: boolean}> = ({showSafeZones = false, audio = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const n = landedBy(frame);
	const fill = n / DAYS;
	const stackTop = COL.bottom - n * THICK;
	// last landing impact (0..1 decaying)
	const lastLand = n > 0 ? LANDINGS[n - 1] : -99;
	const impact = Math.max(0, 1 - (frame - lastLand) / 8);

	const bloom = kf(frame, [T.payoff - 2, T.payoff + 10, T.payoff + 50], [0, 1, 0.55], E.out);
	const light = Math.min(1, Math.pow(fill, 1.3) * 0.85 + bloom * 0.4);
	const visible = 0.68 + 0.32 * Math.min(1, Math.pow(fill, 0.6) + bloom); // the glass itself "appears"

	const [c0, c1, c2, c3, c4] = T.cam;
	const camKeys = [
		{at: c0, zoom: 1.55, fx: 700, fy: 1300},
		{at: c1, zoom: 1.0, fx: 700, fy: 1012},
		{at: c2, zoom: 1.0, fx: 700, fy: 1012},
		// push-in on the payoff; column base stays above the footnote band (screen y ≤ 1490)
		{at: c3, zoom: 1.06, fx: 700, fy: 1032},
		{at: c4, zoom: 1.03, fx: 700, fy: 1025},
	];

	const done = frame >= T.payoff;
	const settle = done ? sp(frame, fps, T.payoff, 'bouncy') : 0;
	const counterScale = done ? 1 + 0.18 * settle : 1;
	const subOut = (at: number) => kf(frame, [at, at + 10], [0, 1], E.in);
	const signIn = prog(frame, T.sign, 16);

	return (
		<AbsoluteFill style={{fontFamily: dmm.font}}>
			<Stage lightX={COL.cx} lightY={stackTop} light={0.6 + light * 0.9} />

			<Camera2D keys={camKeys} anchor={[700, 1000]} drift={1.2}>
				<div style={{position: 'absolute', inset: 0, opacity: visible}}>
					<GlassBack {...COL} light={light} lightY={stackTop} />
				</div>
				<Stack n={n} impact={impact} />
				{frame >= 120 ? (
					<CameraMotionBlur shutterAngle={200} samples={6}>
						<FallingNotes />
					</CameraMotionBlur>
				) : (
					<FallingNotes />
				)}
				<div style={{position: 'absolute', inset: 0, opacity: visible}}>
					<GlassFront {...COL} light={light} />
				</div>
			</Camera2D>

			{/* legibility bands (top headline, bottom counter/footnote) */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,13,10,0.92) 0%, rgba(8,13,10,0.55) 22%, rgba(8,13,10,0) 34%, rgba(8,13,10,0) 62%, rgba(8,13,10,0.7) 80%, rgba(8,13,10,0.95) 100%)'}} />

			{/* HEADLINES */}
			<Headline y={196} exitAt={T.headOut} lines={[{text: '$20 A DAY.', size: 108}]} />
			<div style={{opacity: 1 - subOut(T.still - 10)}}>
				<Headline y={318} at={T.hook2} lines={[{text: 'NOBODY NOTICES.', size: 64, color: C.muted, weight: 800}]} />
			</div>
			<div style={{opacity: 1 - subOut(T.stillOut)}}>
				<Headline y={318} at={T.still} lines={[{text: 'STILL LOOKS LIKE NOTHING.', size: 58, color: C.muted, weight: 800}]} />
			</div>
			<Headline y={318} at={T.stillOut + 34} exitAt={T.headOut} lines={[{text: 'THEN ONE DAY, YOU SEE IT.', size: 58, color: C.ink, weight: 800}]} />
			<Headline
				y={200}
				at={T.headIn}
				stagger={7}
				lines={[
					{text: 'SAVING IS INVISIBLE.', size: 86},
					{text: 'UNTIL IT ISN’T.', size: 86, color: C.accent},
				]}
			/>

			{/* COUNTER */}
			<div style={{position: 'absolute', left: dmm.safe.left, top: 1250, transformOrigin: '0% 100%', transform: `scale(${counterScale})`}}>
				<div style={{fontSize: 26, fontWeight: 800, letterSpacing: 4, color: done ? C.accent : C.muted, fontVariantNumeric: 'tabular-nums'}}>
					DAY {Math.max(1, n)}
				</div>
				<NumberCounter value={n * DAILY.value} fontSize={104} color={done ? C.accent : C.ink} roll={false} />
			</div>
			<div style={{opacity: signIn}}>
				<Signature y={1140} />
			</div>

			<div style={{position: 'absolute', left: dmm.safe.left, top: 1500, width: 888, fontSize: 24, lineHeight: 1.3, fontWeight: 600, color: C.muted}}>
				<span style={{color: C.ink, fontWeight: 800, letterSpacing: 2}}>EXAMPLE</span> · ${DAILY.value} a day × 365 days = ${TOTAL.value.toLocaleString('en-US')} in cash. No interest or returns assumed.
			</div>

			<FilmFinish grain={0.07} />
			{showSafeZones && <SafeZoneOverlay />}
			{audio && <Html5Audio src={staticFile('daily/audio/dmm002-mix.wav')} />}
		</AbsoluteFill>
	);
};

export const __FULL = FULL;
