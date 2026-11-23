// DMM-007 · "A four hundred dollar surprise." (narrated: creator's "Stack voice")
// A storm cloud labelled "$400 SURPRISE" rains labelled bills (CAR REPAIR, DOCTOR BILL).
// Three adults stand under it; one in three is marked NOT COVERED (Fed SHED 2025: 37%
// wouldn't cover $400 with cash or its equivalent). "Build a small cushion": that person
// gets an umbrella labelled EMERGENCY FUND (dashed = not built yet) that fills $10 a week
// to $400 in 40 weeks; when full the rain bounces off and the mark turns to ✓ COVERED.
// Every beat is keyed to the narration's word timestamps (timing.ts ← voice.words.json).
import React from 'react';
import {AbsoluteFill, Html5Audio, random, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../../fonts';
import {E, prog, sp} from '../../../story/lib/motion';
import {SafeZoneOverlay, Signature} from '../../components/Chrome';
import {FilmFinish, Stage} from '../../components/FilmLook';
import {Headline} from '../../components/Headline';
import {buildPages, WordCaptions} from '../../components/WordCaptions';
import {dmm, usd} from '../../theme';
import {SURPRISE, WEEKLY, WEEKS, WOULD_NOT_PCT} from './facts';
import {FPS, KEY_WORDS, PAGE_BREAKS, T, VO_OFFSET, WORDS} from './timing';

export {QC_BEATS} from './timing';

const C = dmm.color;
const CLOUD_Y = 600;
const RAIN_TOP = CLOUD_Y + 80;
const GROUND = 1300;
const PEOPLE = [300, 540, 780];
const UX = PEOPLE[0]; // the one in three
const CANOPY_TOP = 930;
const CANOPY_BASE = 1040;
const CANOPY_HALF = 150;
const PAGES = buildPages(WORDS, FPS, VO_OFFSET, PAGE_BREAKS, KEY_WORDS);
const DROPS = Array.from({length: 46}, (_, i) => ({x: 200 + random(`dx${i}`) * 680, off: random(`do${i}`) * 700, v: 13 + random(`dv${i}`) * 6, heavy: i >= 16}));

const fadeIn = (f: number, at: number, d = 8) => prog(f, at, d, E.out);
const canopyPath = (cx: number) => {
	// dome with a scalloped rim
	let d = `M${cx - CANOPY_HALF} ${CANOPY_BASE}Q${cx} ${CANOPY_TOP - 70} ${cx + CANOPY_HALF} ${CANOPY_BASE}`;
	const n = 5;
	for (let i = n; i > 0; i--) {
		const x0 = cx - CANOPY_HALF + ((2 * CANOPY_HALF) / n) * i;
		const x1 = x0 - (2 * CANOPY_HALF) / n;
		d += `Q${(x0 + x1) / 2} ${CANOPY_BASE - 26} ${x1} ${CANOPY_BASE}`;
	}
	return d + 'Z';
};

export const DMM007: React.FC<{showSafeZones?: boolean; audio?: boolean}> = ({showSafeZones = false, audio = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	const heavy = prog(frame, T.surprise - 6, 16);
	const peopleIn = sp(frame, fps, T.people, 'smooth');
	const umbrellaIn = sp(frame, fps, T.build, 'bouncy');
	const fill = prog(frame, T.fillStart, T.fillDone - T.fillStart, (t) => t);
	const weeks = Math.floor(fill * WEEKS.value + 1e-6);
	const full = frame >= T.fillDone;
	const fullFlash = full ? Math.max(0, 1 - (frame - T.fillDone) / 20) : 0;
	const intro = 1.25 - 0.25 * prog(frame, 0, 62, (t) => t);
	const drift = -50 * prog(frame, T.headline, 449 - T.headline, (t) => t);
	const cloudDx = Math.sin(frame / 40) * 10;

	// ---- the bill drops (labelled)
	const bill = (label: string, at: number, x: number) => {
		const p = prog(frame, at - 2, 64, (t) => t);
		const y = RAIN_TOP + p * (GROUND - 260 - RAIN_TOP);
		const a = Math.min(fadeIn(frame, at - 2, 6), 1 - prog(frame, at + 56, 10));
		return (
			<div key={label} style={{position: 'absolute', left: x - 120, width: 240, top: y, textAlign: 'center', opacity: a}}>
				<span style={{display: 'inline-block', padding: '6px 14px', borderRadius: 10, background: C.ink, color: C.bg, fontSize: 26, fontWeight: 900, letterSpacing: 1}}>{label}</span>
			</div>
		);
	};

	return (
		<AbsoluteFill style={{fontFamily: dmm.font}}>
			<Stage lightX={540} lightY={CLOUD_Y} light={0.8 + 0.6 * fill} />
			<AbsoluteFill style={{transform: `translateY(${drift}px) scale(${intro})`, transformOrigin: `540px ${CLOUD_Y}px`}}>
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<defs>
						<clipPath id="dmm7fill">
							<rect x={UX - CANOPY_HALF - 4} y={CANOPY_BASE - (CANOPY_BASE - CANOPY_TOP + 40) * fill} width={CANOPY_HALF * 2 + 8} height={300} />
						</clipPath>
					</defs>
					{/* rain */}
					{DROPS.map((d, i) => {
						if (d.heavy && random(`dh${i}`) > heavy) return null;
						const span = GROUND - RAIN_TOP;
						let y = RAIN_TOP + ((frame * d.v + d.off) % span);
						const x = d.x + cloudDx * 0.3;
						const shielded = full && x > UX - CANOPY_HALF && x < UX + CANOPY_HALF;
						if (shielded && y > CANOPY_TOP) return <circle key={i} cx={x} cy={CANOPY_TOP + 12 + Math.abs(x - UX) * 0.45} r={3} fill="rgba(255,255,255,0.55)" />; // splashes on the canopy
						return <line key={i} x1={x} y1={y} x2={x - 3} y2={y + 26} stroke="rgba(255,255,255,0.42)" strokeWidth={3} strokeLinecap="round" />;
					})}
					{/* ground */}
					<line x1={150} y1={GROUND} x2={930} y2={GROUND} stroke="rgba(255,255,255,0.2)" strokeWidth={3} />
					{/* umbrella handle (behind the person, so it reads as held) */}
					<g opacity={Math.min(1, umbrellaIn * 1.4)}>
						<line x1={UX} y1={CANOPY_BASE - 20 + (1 - umbrellaIn) * 40} x2={UX} y2={1170} stroke={C.ink} strokeWidth={5} />
						<path d={`M${UX} 1170Q${UX} 1196 ${UX + 22} 1196`} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
					</g>
					{/* three adults (solid, so the handle hides behind them) */}
					{PEOPLE.map((x, i) => (
						<g key={i} opacity={peopleIn} transform={`translate(0 ${(1 - peopleIn) * 30})`}>
							<circle cx={x} cy={1110} r={34} fill="#262D29" stroke={C.ink} strokeWidth={4} />
							<rect x={x - 40} y={1152} width={80} height={GROUND - 1152} rx={34} fill="#262D29" stroke={C.ink} strokeWidth={4} />
						</g>
					))}
					{/* the umbrella (dashed outline until it is funded) */}
					<g opacity={Math.min(1, umbrellaIn * 1.4)} transform={`translate(${UX} ${CANOPY_BASE}) scale(${0.4 + 0.6 * umbrellaIn}) translate(${-UX} ${-CANOPY_BASE})`}>
						<path d={canopyPath(UX)} fill={`rgba(54,217,121,0.12)`} />
						<path d={canopyPath(UX)} fill={C.accent} clipPath="url(#dmm7fill)" opacity={0.85} />
						<path d={canopyPath(UX)} fill="none" stroke={full ? C.accent : C.ink} strokeWidth={4} strokeDasharray={full ? undefined : '12 10'} />
						{fullFlash > 0 && <path d={canopyPath(UX)} fill="none" stroke={C.ink} strokeWidth={4 + 10 * fullFlash} opacity={fullFlash} />}
					</g>
				</svg>

				{/* the cloud */}
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<g transform={`translate(${cloudDx} 0)`}>
						{[
							[400, CLOUD_Y + 20, 90],
							[505, CLOUD_Y - 30, 112],
							[630, CLOUD_Y - 10, 100],
							[715, CLOUD_Y + 35, 72],
							[330, CLOUD_Y + 50, 58],
						].map(([x, y, r], i) => (
							<circle key={i} cx={x} cy={y} r={r} fill="#2A322E" stroke="rgba(255,255,255,0.3)" strokeWidth={3} />
						))}
						<rect x={290} y={CLOUD_Y + 10} width={480} height={90} rx={45} fill="#2A322E" />
					</g>
				</svg>
				<div style={{position: 'absolute', left: 240 + cloudDx, width: 600, top: CLOUD_Y - 6, textAlign: 'center', fontSize: 58, fontWeight: 900, color: C.ink, letterSpacing: -1}}>
					{usd(SURPRISE.value)} SURPRISE
				</div>

				{bill('CAR REPAIR', T.car, 470)}
				{bill('DOCTOR BILL', T.doctor, 650)}

				{/* covered / not covered marks */}
				{PEOPLE.map((x, i) => {
					const isOne = i === 0;
					const at = isOne ? T.oneInThree : T.oneInThree + 8 + i * 4;
					const ok = !isOne || full;
					return (
						<div key={i} style={{position: 'absolute', left: x - 110, width: 220, top: GROUND + 12, textAlign: 'center', opacity: fadeIn(frame, at - 2)}}>
							<span style={{display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: ok ? C.accent : 'rgba(156,163,175,0.3)', color: ok ? C.bg : C.ink, fontSize: 20, fontWeight: 900, letterSpacing: 1, whiteSpace: 'nowrap', transform: `scale(${isOne && full ? 1 + 0.3 * fullFlash : 1})`}}>
								{ok ? '✓ COVERED' : '✕ NOT COVERED'}
							</span>
						</div>
					);
				})}
				<div style={{position: 'absolute', left: UX - 160, width: 320, top: CANOPY_TOP - 58, textAlign: 'center', opacity: Math.min(1, umbrellaIn * 1.4), fontSize: 26, fontWeight: 900, letterSpacing: 2, color: C.accent}}>EMERGENCY FUND</div>
			</AbsoluteFill>

			{/* legibility band behind captions */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,13,10,0.92) 0%, rgba(8,13,10,0.6) 17%, rgba(8,13,10,0) 21%)'}} />

			<WordCaptions pages={PAGES} y={196} size={72} />
			<Headline
				y={196}
				at={T.headline}
				stagger={6}
				align="center"
				lines={[
					{text: 'A SMALL CUSHION BUYS CALM.', size: 54},
					{text: `START WITH ${usd(WEEKLY.value)} A WEEK.`, size: 64, color: C.accent},
				]}
			/>

			{/* the number panel: the statistic, then the fund counter */}
			<div style={{position: 'absolute', left: dmm.safe.left, width: 888, top: 1352, height: 100, textAlign: 'center'}}>
				<div style={{position: 'absolute', inset: 0, opacity: Math.min(fadeIn(frame, T.stat - 2), 1 - prog(frame, T.build + 4, 8))}}>
					<div style={{fontSize: 60, fontWeight: 900, color: C.ink, lineHeight: 1}}>{WOULD_NOT_PCT.value}% OF ADULTS</div>
					<div style={{fontSize: 27, fontWeight: 800, color: C.muted, letterSpacing: 1, marginTop: 8, whiteSpace: 'nowrap'}}>WOULDN'T COVER A {usd(SURPRISE.value)} SURPRISE WITH CASH*</div>
				</div>
				<div style={{position: 'absolute', inset: 0, top: 10, opacity: fadeIn(frame, T.build + 10), fontVariantNumeric: 'tabular-nums'}}>
					<span style={{fontSize: 28, fontWeight: 800, color: C.muted, letterSpacing: 2}}>EMERGENCY FUND · WEEK {weeks} </span>
					<span style={{fontSize: 64, fontWeight: 900, color: C.accent}}>{usd(weeks * WEEKLY.value)}</span>
				</div>
			</div>

			<div style={{opacity: prog(frame, T.sign, 16)}}>
				<Signature y={1458} />
			</div>
			<div style={{position: 'absolute', left: dmm.safe.left, top: 1500, width: 888, fontSize: 21, lineHeight: 1.3, fontWeight: 600, color: C.muted}}>
				*Federal Reserve, Economic Well-Being of U.S. Households in 2025 (May 2026): 63% would cover $400 with cash or its equivalent. <span style={{color: C.ink, fontWeight: 800, letterSpacing: 2}}>EXAMPLE</span> · {usd(WEEKLY.value)}/week × {WEEKS.value} weeks = {usd(SURPRISE.value)}, cash, no interest. Not advice.
			</div>

			<FilmFinish grain={0.06} />
			{showSafeZones && <SafeZoneOverlay />}
			{audio && (
				<>
					<Html5Audio src={staticFile('daily/audio/dmm007-sfx-v01.wav')} />
					<Sequence from={VO_OFFSET} layout="none" name="voice: Stack voice">
						<Html5Audio src={staticFile('daily/voice/DMM-007/voice.mp3')} />
					</Sequence>
				</>
			)}
		</AbsoluteFill>
	);
};
