// DMM-008 · "Two people save the same five thousand dollars." (narrated: creator's "Stack voice")
// Two people, side by side, each with a mailbox and a bank. Both banks hold the same
// $5,000 (EXAMPLE). Bank A pays the U.S. average (FDIC, Nov 2026: 0.39%); bank B pays an
// EXAMPLE 4.00% APY. Then a year plays out: every month each bank mails its interest —
// a thin envelope to A, a fat one to B — the envelopes stack inside each open mailbox and
// the "INTEREST PAID" counters climb to $19.50 vs $200. Takeaway on screen at the end.
// Every beat is keyed to the narration's word timestamps (timing.ts ← voice.words.json).
import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../../fonts';
import {E, prog, sp} from '../../../story/lib/motion';
import {SafeZoneOverlay} from '../../components/Chrome';
import {CTACard} from '../../components/CTA';
import {HookStamp} from '../../components/Hook';
import {FilmFinish, Stage} from '../../components/FilmLook';
import {Headline} from '../../components/Headline';
import {buildPages, WordCaptions} from '../../components/WordCaptions';
import {dmm, usd} from '../../theme';
import {AVG_RATE, DIFF, earned, EXAMPLE_RATE, MONTHS, SAVED, YEAR_A, YEAR_B} from './facts';
import {FPS, KEY_WORDS, PAGE_BREAKS, T, VO_OFFSET, WORDS} from './timing';

export {QC_BEATS} from './timing';

const C = dmm.color;
const PAGES = buildPages(WORDS, FPS, VO_OFFSET, PAGE_BREAKS, KEY_WORDS);
const GROUND = 1300;
const CARD_TOP = 470;
const CARD_BOTTOM = 800;
const BOX_TOP = 890;
const BOX_BOTTOM = 1060;
const BOX_HALF = 118;
const fadeIn = (f: number, at: number, d = 8) => prog(f, at, d, E.out);
const HOOK_OUT = 34; // hook stamp lifts away (≈ "ten times more")

type Side = {key: 'A' | 'B'; x: number; rate: number; rateAt: number; perYearAt: number; perYear: string; rateNote: string; env: {w: number; h: number; row: number}; color: string};
const SIDES: Side[] = [
	{key: 'A', x: 330, rate: AVG_RATE.value, rateAt: T.bankA, perYearAt: T.perYearA, perYear: `≈ ${usd(Math.round(YEAR_A.value + 1e-6))} A YEAR`, rateNote: 'U.S. AVERAGE*', env: {w: 58, h: 30, row: 1.1}, color: C.ink},
	{key: 'B', x: 790, rate: EXAMPLE_RATE.value, rateAt: T.bankB, perYearAt: T.perYearB, perYear: `${usd(YEAR_B.value)} A YEAR`, rateNote: 'EXAMPLE RATE', env: {w: 104, h: 62, row: 11}, color: C.accent},
];

const boxPath = (cx: number) => `M${cx - BOX_HALF} ${BOX_BOTTOM}V${BOX_TOP + 70}Q${cx - BOX_HALF} ${BOX_TOP} ${cx} ${BOX_TOP}Q${cx + BOX_HALF} ${BOX_TOP} ${cx + BOX_HALF} ${BOX_TOP + 70}V${BOX_BOTTOM}Z`;
const innerPath = (cx: number) => {
	const h = BOX_HALF - 16;
	return `M${cx - h} ${BOX_BOTTOM - 8}V${BOX_TOP + 76}Q${cx - h} ${BOX_TOP + 16} ${cx} ${BOX_TOP + 16}Q${cx + h} ${BOX_TOP + 16} ${cx + h} ${BOX_TOP + 76}V${BOX_BOTTOM - 8}Z`;
};

const Envelope: React.FC<{x: number; y: number; w: number; h: number; fill: string; seal?: string; rot?: number; opacity?: number}> = ({x, y, w, h, fill, seal, rot = 0, opacity = 1}) => (
	<g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
		<rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill={fill} stroke="rgba(8,13,10,0.5)" strokeWidth={2} />
		<path d={`M${-w / 2 + 3} ${-h / 2 + 3}L0 ${h * 0.08}L${w / 2 - 3} ${-h / 2 + 3}`} fill="none" stroke="rgba(8,13,10,0.45)" strokeWidth={2} />
		{seal && <circle cx={0} cy={h * 0.08} r={Math.min(w, h) * 0.16} fill={seal} />}
	</g>
);

export const DMM008: React.FC<{showSafeZones?: boolean; audio?: boolean}> = ({showSafeZones = false, audio = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// camera: a short pull-back on the hook, then a constant slow drift (never static)
	// the scene waits below the hook stamp, then rises once the stamp lifts away
	const introY = 150 * (1 - prog(frame, HOOK_OUT - 6, 45, (t) => t)) + 14 * Math.sin(frame / 8) * (1 - prog(frame, HOOK_OUT - 6, 20));
	const drift = -46 * prog(frame, 73, 449 - 73, (t) => t);

	const yearT = (frame - T.yearStart) / T.monthFrames; // months elapsed (continuous)
	const monthsDone = Math.max(0, Math.min(MONTHS, Math.floor(yearT + 1e-6)));
	const yearDone = frame >= T.yearDone;
	const doneFlash = yearDone ? Math.max(0, 1 - (frame - T.yearDone) / 18) : 0;
	const savedPulse = Math.max(0, 1 - Math.abs(frame - T.saved - 6) / 10) + Math.max(0, 1 - Math.abs(frame - T.people - 6) / 10) * 0.6;
	const diffPulse = Math.max(0, 1 - Math.abs(frame - T.check - 6) / 10);
	const peopleIn = sp(frame, fps, -30, 'smooth');

	return (
		<AbsoluteFill style={{fontFamily: dmm.font}}>
			<Stage lightX={560} lightY={900} light={0.9 + 0.4 * prog(frame, T.yearStart, T.yearDone - T.yearStart, (t) => t)} />
			<AbsoluteFill style={{transform: `translateY(${drift + introY}px)`}}>
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<defs>
						{SIDES.map((s) => (
							<clipPath key={s.key} id={`dmm8in${s.key}`}>
								<path d={innerPath(s.x)} />
							</clipPath>
						))}
					</defs>
					{/* ground */}
					<line x1={110} y1={GROUND} x2={940} y2={GROUND} stroke="rgba(255,255,255,0.2)" strokeWidth={3} />
					{SIDES.map((s) => {
						const px = s.x - 190;
						const flagUp = prog(frame, T.yearStart + 10, 8);
						const wave = s.key === 'B' ? Math.sin(frame / 7) * 6 * flagUp : 0;
						return (
							<g key={s.key}>
								{/* bank roof (pediment) over the card */}
								<path d={`M${s.x - 150} ${CARD_TOP + 40}L${s.x} ${CARD_TOP - 18}L${s.x + 150} ${CARD_TOP + 40}Z`} fill="#1B231F" stroke="rgba(255,255,255,0.35)" strokeWidth={3} />
								<rect x={s.x - 140} y={CARD_TOP + 40} width={280} height={CARD_BOTTOM - CARD_TOP - 40} rx={14} fill="#141B17" stroke="rgba(255,255,255,0.28)" strokeWidth={3} />
								{/* post and mailbox */}
								<rect x={s.x - 14} y={BOX_BOTTOM} width={28} height={GROUND - BOX_BOTTOM} fill="#2A322E" stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
								<path d={boxPath(s.x)} fill="#262D29" stroke={C.ink} strokeWidth={4} />
								<path d={innerPath(s.x)} fill="#0B100D" />
								{/* envelopes stacked inside (one row per month) */}
								<g clipPath={`url(#dmm8in${s.key})`}>
									{/* stack height ∝ interest: A's 12 months ≈ 13 px, B's ≈ 132 px (≈ 10×) */}
									{monthsDone > 0 && <rect x={s.x - BOX_HALF + 24} y={BOX_BOTTOM - 10 - monthsDone * s.env.row} width={(BOX_HALF - 24) * 2} height={monthsDone * s.env.row} rx={2} fill="#FFFFFF" opacity={0.94} />}
									{s.env.row > 4 && Array.from({length: monthsDone}, (_, m) => (
										<line key={m} x1={s.x - BOX_HALF + 26} x2={s.x + BOX_HALF - 26} y1={BOX_BOTTOM - 10 - m * s.env.row} y2={BOX_BOTTOM - 10 - m * s.env.row} stroke="rgba(8,13,10,0.35)" strokeWidth={2} />
									))}
								</g>
								{/* the open door, folded down */}
								<path d={`M${s.x - BOX_HALF} ${BOX_BOTTOM}L${s.x + BOX_HALF} ${BOX_BOTTOM}L${s.x + BOX_HALF - 10} ${BOX_BOTTOM + 24}L${s.x - BOX_HALF + 10} ${BOX_BOTTOM + 24}Z`} fill="#323A36" stroke={C.ink} strokeWidth={3} />
								{/* flag on the side: up once mail starts arriving */}
								<g transform={`translate(0 ${(1 - flagUp) * 64}) rotate(${wave} ${s.x + BOX_HALF + 6} ${BOX_TOP + 110})`}>
									<rect x={s.x + BOX_HALF + 2} y={BOX_TOP + 40} width={8} height={70} fill={C.muted} />
									<rect x={s.x + BOX_HALF + 2} y={BOX_TOP + 40} width={34} height={22} fill={s.key === 'B' ? C.accent : C.muted} />
								</g>
								{/* the person (solid) */}
								<g opacity={peopleIn} transform={`translate(0 ${(1 - peopleIn) * 30})`}>
									<circle cx={px} cy={1112} r={34} fill="#262D29" stroke={C.ink} strokeWidth={4} />
									<rect x={px - 40} y={1154} width={80} height={GROUND - 1154} rx={34} fill="#262D29" stroke={C.ink} strokeWidth={4} />
								</g>
								{/* this month's envelope: bank → mailbox */}
								{frame >= T.yearStart && frame < T.yearDone + 1 &&
									(() => {
										const m = Math.floor(yearT);
										const t = Math.min(1, (yearT - m) * 1.25); // flies for 80% of the month
										if (m >= MONTHS) return null;
										const y0 = CARD_BOTTOM - 10;
										const y1 = BOX_BOTTOM - 40;
										const y = y0 + (y1 - y0) * t;
										const x = s.x + Math.sin(t * Math.PI) * (s.key === 'A' ? -26 : 26);
										return <Envelope x={x} y={y} w={s.env.w} h={s.env.h} fill="#FFFFFF" seal={s.key === 'B' ? C.accent : undefined} rot={(1 - t) * (s.key === 'A' ? -10 : 10)} opacity={t < 0.9 ? 1 : (1 - t) * 10} />;
									})()}
							</g>
						);
					})}
				</svg>

				{/* person letters */}
				{SIDES.map((s) => (
					<div key={s.key} style={{position: 'absolute', left: s.x - 190 - 40, width: 80, top: 1190, textAlign: 'center', fontSize: 44, fontWeight: 900, color: C.ink, opacity: peopleIn}}>
						{s.key}
					</div>
				))}

				{/* bank cards */}
				{SIDES.map((s) => {
					const rateIn = sp(frame, fps, s.rateAt, 'bouncy');
					const big = 1 + 0.12 * diffPulse;
					return (
						<div key={s.key} style={{position: 'absolute', left: s.x - 140, width: 280, top: CARD_TOP + 50, textAlign: 'center', color: C.ink}}>
							<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 3, color: s.key === 'B' ? C.accent : C.ink, transform: `scale(${big})`}}>BANK {s.key}</div>
							<div style={{fontSize: 36, fontWeight: 900, marginTop: 6, whiteSpace: 'nowrap', transform: `scale(${1 + 0.12 * savedPulse})`}}>{usd(SAVED.value)} SAVED</div>
							<div style={{height: 82, marginTop: 4, position: 'relative'}}>
								{/* hook: the rate is unknown until the narration names it */}
								<div style={{position: 'absolute', inset: 0, fontSize: 72, fontWeight: 900, color: 'rgba(156,163,175,0.55)', lineHeight: '82px', letterSpacing: 2, opacity: 1 - Math.min(1, rateIn * 2), transform: `rotate(${Math.sin(frame / 9 + (s.key === 'B' ? 1.6 : 0)) * 3}deg)`}}>?.??%</div>
								<div style={{position: 'absolute', inset: 0, opacity: Math.min(1, rateIn * 1.5), transform: `scale(${0.6 + 0.4 * rateIn})`}}>
									<div style={{fontSize: 72, fontWeight: 900, color: s.color, lineHeight: '82px', letterSpacing: -2}}>{s.rate.toFixed(2)}%</div>
								</div>
							</div>
							<div style={{fontSize: 21, fontWeight: 800, letterSpacing: 2, color: C.muted, opacity: fadeIn(frame, s.rateAt + 4), whiteSpace: 'nowrap'}}>{s.rateNote}</div>
							<div style={{marginTop: 10, opacity: fadeIn(frame, s.perYearAt - 2)}}>
								<span style={{display: 'inline-block', padding: '4px 14px', borderRadius: 999, background: s.key === 'B' ? C.accent : 'rgba(255,255,255,0.16)', color: s.key === 'B' ? C.bg : C.ink, fontSize: 24, fontWeight: 900, whiteSpace: 'nowrap'}}>
									PAYS {s.perYear}
								</span>
							</div>
						</div>
					);
				})}

				{/* the month counter between the mailboxes */}
				<div style={{position: 'absolute', left: 470, width: 180, top: BOX_TOP + 40, textAlign: 'center', opacity: fadeIn(frame, T.yearStart - 6), fontVariantNumeric: 'tabular-nums'}}>
					<div style={{fontSize: 22, fontWeight: 800, letterSpacing: 3, color: C.muted}}>MONTH</div>
					<div style={{fontSize: 54, fontWeight: 900, color: C.ink, lineHeight: 1.05}}>{Math.max(1, Math.min(MONTHS, monthsDone + (yearDone ? 0 : 1)))}</div>
					<div style={{fontSize: 20, fontWeight: 800, letterSpacing: 2, color: C.muted}}>OF {MONTHS}</div>
				</div>

				{/* interest counters under each person */}
				{SIDES.map((s) => {
					const m = Math.max(0, Math.min(MONTHS, yearT < 0 ? 0 : monthsDone));
					const val = earned(s.rate, m);
					return (
						<div key={s.key} style={{position: 'absolute', left: s.x - 190, width: 380, top: GROUND + 16, textAlign: 'center', fontVariantNumeric: 'tabular-nums', opacity: fadeIn(frame, T.yearStart - 6)}}>
							<div style={{fontSize: 22, fontWeight: 800, letterSpacing: 2, color: C.muted, whiteSpace: 'nowrap'}}>{s.key} · INTEREST PAID</div>
							<div style={{fontSize: 64, fontWeight: 900, color: s.color, lineHeight: 1.1, transform: `scale(${1 + 0.18 * doneFlash})`}}>{usd(val, 2)}</div>
							{/* payoff: the difference after one year, under B's counter */}
							{s.key === 'B' && (
								<div style={{fontSize: 30, fontWeight: 900, color: C.accent, whiteSpace: 'nowrap', opacity: fadeIn(frame, T.yearDone + 8, 10), transform: `scale(${0.6 + 0.4 * sp(frame, fps, T.yearDone + 8, 'bouncy')})`}}>
									+{usd(DIFF.value, 2)} MORE
								</div>
							)}
						</div>
					);
				})}
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
					{text: `SAME ${usd(SAVED.value)}. DIFFERENT BANK.`, size: 52},
					{text: 'CHECK YOUR SAVINGS RATE.', size: 56, color: C.accent},
				]}
			/>

			{/* hook (frame 0) and CTA (spoken "follow for more") — series rule since 2026-11-26 */}
			<HookStamp big={`${Math.round(EXAMPLE_RATE.value / AVG_RATE.value)}× MORE?`} y={356} out={HOOK_OUT} />
			<CTACard at={T.cta} y={1434} prompt="COMMENT YOUR SAVINGS RATE BELOW" />
			<div style={{position: 'absolute', left: dmm.safe.left, top: 1543, width: 888, fontSize: 18, lineHeight: 1.25, fontWeight: 600, color: C.muted}}>
				*FDIC national savings rate, Nov 2026: {AVG_RATE.value}%. <span style={{color: C.ink, fontWeight: 800, letterSpacing: 2}}>EXAMPLE</span> · {usd(SAVED.value)} for one year at {EXAMPLE_RATE.value.toFixed(2)}% APY, paid monthly. Rates change; not guaranteed. Not advice.
			</div>

			<FilmFinish grain={0.06} />
			{showSafeZones && <SafeZoneOverlay />}
			{audio && (
				<>
					<Html5Audio src={staticFile('daily/audio/dmm008-sfx-v02.wav')} />
					<Sequence from={VO_OFFSET} layout="none" name="voice: Stack voice">
						<Html5Audio src={staticFile('daily/voice/DMM-008/voice.mp3')} />
					</Sequence>
				</>
			)}
		</AbsoluteFill>
	);
};
