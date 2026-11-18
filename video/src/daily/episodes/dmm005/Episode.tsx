// DMM-005 v2 (clarity rework) · "Two people, same seven hundred a month."
// Two people side by side, each on their own iceberg, labelled PERSON A / PERSON B.
// A spends $700/mo on a car payment: the car sits on top, everyone sees it, and
// nothing grows under the water. B invests the same $700 instead: nothing shows on
// top, but a hidden mass grows month by month under the water (area ∝ balance).
// Ends on the takeaway in words: SAME $700 A MONTH. / SPEND IT, OR GROW IT.
// Every beat is keyed to the narration's word timestamps (timing.ts ← voice.words.json).
import React from 'react';
import {AbsoluteFill, Html5Audio, random, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../../fonts';
import {E, prog, sp} from '../../../story/lib/motion';
import {SafeZoneOverlay, Signature} from '../../components/Chrome';
import {FilmFinish, Stage} from '../../components/FilmLook';
import {Headline} from '../../components/Headline';
import {CarIcon, Iceberg} from '../../components/Iceberg';
import {buildPages, WordCaptions} from '../../components/WordCaptions';
import {dmm, usd} from '../../theme';
import {B_FINAL, balance, MONTHLY, MONTHS, RATE, YEARS} from './facts';
import {FPS, KEY_WORDS, PAGE_BREAKS, T, VO_OFFSET, WORDS} from './timing';

export {QC_BEATS} from './timing';

const C = dmm.color;
const WATER = 760;
const AX = 300; // person A (spends)
const BX = 770; // person B (invests)
const FLOE_W = 110;
const FLOE_H = 80;
const PAGES = buildPages(WORDS, FPS, VO_OFFSET, PAGE_BREAKS, KEY_WORDS);
const BUBBLES = Array.from({length: 16}, (_, i) => ({x: 90 + random(`bx${i}`) * 860, off: random(`bo${i}`) * 600, v: 1.1 + random(`bv${i}`) * 1.5, r: 3 + random(`br${i}`) * 4}));

const fadeIn = (f: number, at: number, d = 10) => prog(f, at, d, E.out);
const fadeOut = (f: number, at: number, d = 10) => 1 - prog(f, at, d, E.in);

export const DMM005: React.FC<{showSafeZones?: boolean; audio?: boolean}> = ({showSafeZones = false, audio = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// ---- B's hidden mass: month 0 → 120 from "invests" to the end of "thousand."
	const months = MONTHS * prog(frame, T.invests, T.growDone - T.invests, (t) => t);
	const s = Math.sqrt(balance(months) / B_FINAL.value);
	const bob = Math.sin(frame / 22) * 3;
	const glint = frame >= T.glint ? prog(frame, T.glint, 54, E.inOut) : -1;

	// ---- A's car lands on "car"; glow rays on "everyone sees it"
	const carIn = sp(frame, fps, T.car - 6, 'bouncy');
	const seen = frame >= T.everyone ? 0.5 + 0.5 * Math.sin((frame - T.everyone) / 4) : 0;
	const seenIn = fadeIn(frame, T.everyone - 2, 8);

	// ---- intro: constant-speed pull-back over the first 2 s (hook motion; the scene stays readable)
	const intro = 1.25 - 0.25 * prog(frame, 0, 62, (t) => t);
	// ---- payoff: constant-speed vertical drift down the water column. NOT a scale push:
	// scaling about the centre pushed B's iceberg into the right-side platform UI band (v04 FAIL).
	const drift = -110 * prog(frame, T.headline, 449 - T.headline, (t) => t);
	const topOut = fadeOut(frame, T.headline - 8, 10); // names/roles leave before the headline

	// ---- water
	const wave = (x: number) => WATER + Math.sin(x / 70 + frame / 9) * 4 + Math.sin(x / 31 - frame / 6) * 2;
	let surface = '';
	for (let x = -100; x <= 1180; x += 20) surface += `${x === -100 ? 'M' : 'L'}${x} ${wave(x).toFixed(1)}`;

	const shownMonths = Math.floor(months + 1e-6);
	const nameStyle: React.CSSProperties = {fontSize: 34, fontWeight: 900, letterSpacing: 4, color: C.ink};
	const pill = (bg: string, fg: string, border: string): React.CSSProperties => ({display: 'inline-block', padding: '8px 18px', borderRadius: 999, border: `2px solid ${border}`, background: bg, color: fg, fontSize: 27, fontWeight: 900, letterSpacing: 1.5, whiteSpace: 'nowrap'});

	const people = [
		{x: AX, name: 'PERSON A', role: 'SPENDS IT · CAR PAYMENT', roleAt: T.one, roleStyle: pill(C.bg, C.ink, C.ink), tag: 'EVERYONE SEES IT', tagAt: T.everyone, tagY: WATER + 40, tagColor: C.ink},
		{x: BX, name: 'PERSON B', role: 'INVESTS IT INSTEAD', roleAt: T.other, roleStyle: pill(C.accent, C.bg, C.accent), tag: 'NOBODY SEES IT', tagAt: T.nobody, tagY: WATER + 40, tagColor: C.accent},
	];

	return (
		<AbsoluteFill style={{fontFamily: dmm.font}}>
			<Stage lightX={540} lightY={WATER + 200} light={1 + 0.5 * s} />
			<AbsoluteFill style={{transform: `translateY(${drift}px) scale(${intro})`, transformOrigin: '540px 900px'}}>
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<defs>
						<linearGradient id="dmm5water" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="rgba(54,217,121,0.18)" />
							<stop offset="45%" stopColor="rgba(54,217,121,0.08)" />
							<stop offset="100%" stopColor="rgba(54,217,121,0.02)" />
						</linearGradient>
					</defs>
					{/* divider between the two people */}
					<line x1={540} y1={400} x2={540} y2={1300} stroke="rgba(255,255,255,0.12)" strokeWidth={2} strokeDasharray="6 10" />
					<g transform={`translate(0 ${bob})`}>
						{/* A: floe only, nothing grows below */}
						<Iceberg cx={AX} waterY={WATER} s={0} floeW={FLOE_W} floeH={FLOE_H} />
						{/* B: same floe, a hidden mass that grows */}
						<Iceberg cx={BX} waterY={WATER} s={s} halfW={190} depth={520} floeW={FLOE_W} floeH={FLOE_H} glint={glint} />
						{/* A's car, with "seen" rays */}
						<g opacity={Math.min(1, carIn * 1.3)} transform={`translate(0 ${(1 - carIn) * -60})`}>
							<CarIcon cx={AX} ground={WATER - FLOE_H * 0.83} w={150} />
						</g>
						{Array.from({length: 9}, (_, i) => {
							const a = Math.PI * (1.08 + (i / 8) * 0.84);
							const r0 = 98;
							const r1 = r0 + 22 + 10 * seen;
							const cy = WATER - FLOE_H * 0.83 - 28;
							return <line key={i} x1={AX + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={AX + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={C.ink} strokeWidth={4} strokeLinecap="round" opacity={seenIn * (0.45 + 0.55 * seen) * topOut} />;
						})}
					</g>
					{/* water over the masses so the surface reads as a surface */}
					<path d={`${surface}L1180 2400L-100 2400Z`} fill="url(#dmm5water)" />
					{[-80, 180, 440, 700, 960].map((x0, i) => {
						const sway = Math.sin(frame / (28 + i * 5) + i * 1.7) * 50;
						return <path key={i} d={`M${x0 + sway} ${WATER + 6}L${x0 + sway + 80} ${WATER + 6}L${x0 + sway + 300} ${WATER + 700}L${x0 + sway + 160} ${WATER + 700}Z`} fill={`rgba(54,217,121,${0.045 + 0.025 * Math.sin(frame / 17 + i)})`} />;
					})}
					<path d={surface} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2.5} />
					{BUBBLES.map((b, i) => {
						const y = WATER + 560 - ((frame * b.v + b.off) % 560);
						return y > WATER + 14 ? <circle key={i} cx={b.x + Math.sin(frame / 12 + i) * 5} cy={y} r={b.r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} /> : null;
					})}
				</svg>

				{/* names + roles (what each person does with the same $700) */}
				{people.map((p) => (
					<React.Fragment key={p.name}>
						<div style={{position: 'absolute', left: p.x - 230, width: 460, top: 418, textAlign: 'center', opacity: topOut}}>
							<div style={nameStyle}>{p.name}</div>
							<div style={{fontSize: 30, fontWeight: 800, color: C.muted, marginTop: 4, opacity: fadeIn(frame, T.same - 4)}}>{usd(MONTHLY.value)}/MO</div>
						</div>
						<div style={{position: 'absolute', left: p.x - 230, width: 460, top: 522, textAlign: 'center', opacity: fadeIn(frame, p.roleAt - 3, 8) * topOut, transform: `scale(${0.85 + 0.15 * sp(frame, fps, p.roleAt - 3, 'bouncy')})`}}>
							<span style={p.roleStyle}>{p.role}</span>
						</div>
						<div style={{position: 'absolute', left: p.x - 230, width: 460, top: p.tagY, textAlign: 'center', fontSize: 24, fontWeight: 900, letterSpacing: 3, color: p.tagColor, opacity: fadeIn(frame, p.tagAt - 2, 8) * topOut}}>
							{p.tag}
						</div>
					</React.Fragment>
				))}
			</AbsoluteFill>

			{/* legibility band behind captions */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,13,10,0.92) 0%, rgba(8,13,10,0.6) 17%, rgba(8,13,10,0) 21%, rgba(8,13,10,0) 67%, rgba(8,13,10,0.88) 70%)'}} />

			<WordCaptions pages={PAGES} y={196} size={72} />
			<Headline
				y={196}
				at={T.headline}
				stagger={6}
				align="center"
				lines={[
					{text: `SAME ${usd(MONTHLY.value)} A MONTH.`, size: 76},
					{text: 'SPEND IT, OR GROW IT.', size: 70, color: C.accent},
				]}
			/>

			{/* what each person has invested */}
			<div style={{position: 'absolute', left: 0, width: 1080, top: 1338, fontVariantNumeric: 'tabular-nums'}}>
				{[
					{x: AX, label: 'A · INVESTED', value: usd(0), color: C.muted},
					{x: BX, label: frame >= T.growDone ? `B · AFTER ${YEARS.value} YEARS` : `B · MONTH ${shownMonths}`, value: usd(Math.round(balance(shownMonths) / 10) * 10), color: C.accent},
				].map((c) => (
					<div key={c.x} style={{position: 'absolute', left: c.x - 220, width: 440, textAlign: 'center', opacity: fadeIn(frame, T.invests - 4)}}>
						<div style={{fontSize: 26, fontWeight: 800, letterSpacing: 3, color: C.muted}}>{c.label}</div>
						<div style={{fontSize: 68, fontWeight: 900, color: c.color, letterSpacing: -1}}>{c.value}</div>
					</div>
				))}
			</div>

			<div style={{opacity: prog(frame, T.sign, 16)}}>
				<Signature y={1462} />
			</div>
			<div style={{position: 'absolute', left: dmm.safe.left, top: 1506, width: 888, fontSize: 23, lineHeight: 1.3, fontWeight: 600, color: C.muted}}>
				<span style={{color: C.ink, fontWeight: 800, letterSpacing: 2}}>EXAMPLE</span> · {usd(MONTHLY.value)}/mo invested for {YEARS.value} years · {Math.round(RATE.value * 100)}%/yr average return assumed, compounded monthly · not guaranteed. Not advice.
			</div>

			<FilmFinish grain={0.06} />
			{showSafeZones && <SafeZoneOverlay />}
			{audio && (
				<>
					<Html5Audio src={staticFile('daily/audio/dmm005-sfx-v02.wav')} />
					<Sequence from={VO_OFFSET} layout="none" name="voice: Stack voice">
						<Html5Audio src={staticFile('daily/voice/DMM-005/voice.mp3')} />
					</Sequence>
				</>
			)}
		</AbsoluteFill>
	);
};
