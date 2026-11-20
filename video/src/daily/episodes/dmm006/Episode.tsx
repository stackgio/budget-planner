// DMM-006 · "Fifteen a month feels like nothing. But you don't pay just one." (narrated: creator's "Stack voice")
// A receipt, the clearest picture of spending anybody knows. It opens on one big
// "$15 / MONTH", then prints one labelled line per subscription as each is spoken,
// a PER MONTH total ($90.00), and a PER YEAR total that counts up while 12 monthly
// copies fan out behind it ($1,080.00). Ends on the takeaway in words.
// Every beat is keyed to the narration's word timestamps (timing.ts ← voice.words.json).
import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../../fonts';
import {E, prog, sp} from '../../../story/lib/motion';
import {SafeZoneOverlay, Signature} from '../../components/Chrome';
import {FilmFinish, Stage} from '../../components/FilmLook';
import {Headline} from '../../components/Headline';
import {buildPages, WordCaptions} from '../../components/WordCaptions';
import {dmm, usd} from '../../theme';
import {COUNT, EACH, ITEMS, money, MONTHLY, YEARLY} from './facts';
import {FPS, KEY_WORDS, PAGE_BREAKS, T, VO_OFFSET, WORDS} from './timing';

export {QC_BEATS} from './timing';

const C = dmm.color;
const PAPER = '#ECEBE4';
const INK = '#0B0F0C';
const INK_SOFT = 'rgba(11,15,12,0.55)';
const GREEN_DARK = '#167A43';
const PX = 280; // paper left
const PW = 520; // paper width
const PY = 560; // paper top (printer slot)
const LINE = 62;
const ITEM0 = 100; // first item line (relative to paper top)
const TOTALS = ITEM0 + ITEMS.length * LINE + 14;
const PAGES = buildPages(WORDS, FPS, VO_OFFSET, PAGE_BREAKS, KEY_WORDS);

const fadeIn = (f: number, at: number, d = 8) => prog(f, at, d, E.out);

/** Torn (zig-zag) bottom edge for a paper of the given length. */
const paperPath = (len: number) => {
	let d = `M${PX} ${PY}L${PX + PW} ${PY}L${PX + PW} ${PY + len}`;
	const teeth = 18;
	for (let i = teeth; i >= 0; i--) d += `L${PX + (PW * i) / teeth} ${PY + len + (i % 2 === 0 ? 0 : 10)}`;
	return d + 'Z';
};

export const DMM006: React.FC<{showSafeZones?: boolean; audio?: boolean}> = ({showSafeZones = false, audio = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// ---- how much paper has printed (smooth feed: each line eases out over 6 frames)
	const fed = T.items.reduce((acc, t) => acc + prog(frame, t - 3, 6, E.out), 0);
	const shown = Math.max(
		300 * prog(frame, 0, 24, E.out), // hook: the slip feeds out from frame 0
		fed > 0 ? ITEM0 + fed * LINE + 24 : 0,
		TOTALS + 92 * prog(frame, T.monthTotal - 4, 8, E.out),
		frame >= T.over - 4 ? TOTALS + 92 + 158 * prog(frame, T.over - 4, 10, E.out) : 0,
	);

	// ---- the big "$15" (hook) leaves on "But you don't pay just one"
	const bigOut = prog(frame, T.but + 4, 14, E.in);
	// ---- yearly: 12 monthly copies fan out while PER YEAR counts 1 → 12 months
	const fanP = prog(frame, T.over, T.fanDone - T.over, E.inOut);
	const months = Math.max(1, Math.min(12, 1 + Math.floor(11 * fanP + 1e-6)));
	// ---- camera: intro pull-back (hook motion), payoff drift (constant speed: no static hold)
	const intro = 1.25 - 0.25 * prog(frame, 0, 62, (t) => t);
	const drift = -70 * prog(frame, T.headline, 449 - T.headline, (t) => t);
	const sway = Math.sin(frame / 26) * 0.5;
	const yearPulse = frame >= T.yearTotal ? 0.5 + 0.5 * Math.sin((frame - T.yearTotal) / 6) : 0;

	return (
		<AbsoluteFill style={{fontFamily: dmm.font}}>
			<Stage lightX={540} lightY={PY + 200} light={1.1} />
			<AbsoluteFill style={{transform: `translateY(${drift}px) scale(${intro})`, transformOrigin: '540px 800px'}}>
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					{/* 11 more monthly copies fan out behind (× 12 = a year) */}
					{Array.from({length: 11}, (_, k) => {
						const side = k % 2 === 0 ? -1 : 1;
						const rank = Math.floor(k / 2) + 1;
						const ang = side * rank * 2.1 * fanP;
						return (
							<g key={k} transform={`rotate(${ang} 540 ${PY})`} opacity={0.18 + 0.5 * fanP}>
								<path d={paperPath(shown)} fill={PAPER} stroke="rgba(0,0,0,0.35)" strokeWidth={1.5} />
							</g>
						);
					})}
					<g transform={`rotate(${sway} 540 ${PY})`}>
						<path d={paperPath(shown)} fill={PAPER} />
					</g>
					{/* the printer */}
					<rect x={240} y={PY - 70} width={600} height={78} rx={22} fill="#1A201C" stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
					<rect x={PX - 10} y={PY - 6} width={PW + 20} height={8} rx={4} fill="#050806" />
					<circle cx={800} cy={PY - 32} r={7} fill={frame < T.check + 10 ? C.accent : 'rgba(54,217,121,0.35)'} opacity={0.6 + 0.4 * Math.sin(frame / 5)} />
				</svg>

				{/* receipt contents (rides with the paper) */}
				<div style={{position: 'absolute', left: PX, top: PY, width: PW, height: shown, overflow: 'hidden', transform: `rotate(${sway}deg)`, transformOrigin: `260px 0px`, color: INK, fontVariantNumeric: 'tabular-nums'}}>
					<div style={{position: 'absolute', top: 22, left: 0, width: PW, textAlign: 'center', fontSize: 26, fontWeight: 900, letterSpacing: 6, color: INK_SOFT}}>MONTHLY CHARGES</div>
					<div style={{position: 'absolute', top: 70, left: 34, right: 34, borderTop: `3px dashed ${INK_SOFT}`}} />

					{/* hook: one small charge, big */}
					<div style={{position: 'absolute', top: 92, left: 0, width: PW, textAlign: 'center', opacity: 1 - bigOut, transform: `scale(${1 - 0.25 * bigOut})`}}>
						<div style={{fontSize: 30, fontWeight: 800, letterSpacing: 3, color: INK_SOFT}}>ONE SUBSCRIPTION</div>
						<div style={{fontSize: 120, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05}}>{usd(EACH.value)}</div>
						<div style={{fontSize: 34, fontWeight: 900, letterSpacing: 4}}>/ MONTH</div>
					</div>

					{/* one line per subscription, printed on its spoken word */}
					{ITEMS.map((name, i) => {
						const a = fadeIn(frame, T.items[i] - 3, 6);
						return (
							<div key={name} style={{position: 'absolute', top: ITEM0 + i * LINE, left: 34, right: 34, height: LINE, display: 'flex', alignItems: 'center', gap: 14, opacity: a, transform: `translateY(${(1 - a) * -14}px)`}}>
								<span style={{fontSize: 32, fontWeight: 900, letterSpacing: 0.5, whiteSpace: 'nowrap'}}>{name}</span>
								<span style={{flex: 1, borderBottom: `3px dotted ${INK_SOFT}`, transform: 'translateY(6px)'}} />
								<span style={{fontSize: 32, fontWeight: 900, whiteSpace: 'nowrap'}}>{money(EACH.value)}</span>
							</div>
						);
					})}

					{/* totals */}
					<div style={{position: 'absolute', top: TOTALS, left: 34, right: 34, borderTop: `3px dashed ${INK_SOFT}`, opacity: fadeIn(frame, T.monthTotal - 4)}} />
					<div style={{position: 'absolute', top: TOTALS + 14, left: 34, right: 34, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: fadeIn(frame, T.monthTotal - 2), transform: `scale(${0.9 + 0.1 * sp(frame, fps, T.monthTotal - 2, 'bouncy')})`, transformOrigin: '50% 50%'}}>
						<span style={{fontSize: 32, fontWeight: 900, letterSpacing: 2, whiteSpace: 'nowrap'}}>PER MONTH</span>
						<span style={{fontSize: 52, fontWeight: 900}}>{money(MONTHLY.value)}</span>
					</div>
					<div style={{position: 'absolute', top: TOTALS + 96, left: 34, right: 34, textAlign: 'right', fontSize: 28, fontWeight: 800, color: INK_SOFT, letterSpacing: 2, opacity: fadeIn(frame, T.over - 2)}}>× {months} MONTH{months === 1 ? '' : 'S'}</div>
					<div style={{position: 'absolute', top: TOTALS + 140, left: 20, right: 20, height: 92, borderRadius: 14, background: `rgba(54,217,121,${0.55 + 0.25 * yearPulse})`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '0 20px', opacity: fadeIn(frame, T.over - 2)}}>
						<span style={{fontSize: 28, fontWeight: 900, letterSpacing: 2, color: INK, whiteSpace: 'nowrap'}}>PER YEAR</span>
						<span style={{fontSize: 48, fontWeight: 900, color: INK, whiteSpace: 'nowrap'}}>{money(MONTHLY.value * months)}</span>
					</div>
				</div>
				{/* count of lines, left of the paper (labels the symbol: these are subscriptions) */}
				<div style={{position: 'absolute', left: 840, top: PY + ITEM0 + 6, width: 110, textAlign: 'center', opacity: fadeIn(frame, T.items[0]) * (1 - prog(frame, T.over, 10))}}>
					<div style={{fontSize: 64, fontWeight: 900, color: C.accent, lineHeight: 1}}>{T.items.filter((t) => frame >= t - 3).length}</div>
					<div style={{fontSize: 20, fontWeight: 800, letterSpacing: 2, color: C.muted}}>SUBS</div>
				</div>
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
					{text: 'SMALL CHARGES ADD UP.', size: 66},
					{text: 'CHECK YOUR SUBSCRIPTIONS.', size: 56, color: C.accent},
				]}
			/>

			<div style={{opacity: prog(frame, T.sign, 16)}}>
				<Signature y={1462} />
			</div>
			<div style={{position: 'absolute', left: dmm.safe.left, top: 1506, width: 888, fontSize: 23, lineHeight: 1.3, fontWeight: 600, color: C.muted}}>
				<span style={{color: C.ink, fontWeight: 800, letterSpacing: 2}}>EXAMPLE</span> · {COUNT.value} subscriptions × {usd(EACH.value)}/mo = {usd(MONTHLY.value)}/mo · × 12 = {usd(YEARLY.value)}/yr. Cash totals, no interest. Not advice.
			</div>

			<FilmFinish grain={0.06} />
			{showSafeZones && <SafeZoneOverlay />}
			{audio && (
				<>
					<Html5Audio src={staticFile('daily/audio/dmm006-sfx-v01.wav')} />
					<Sequence from={VO_OFFSET} layout="none" name="voice: Stack voice">
						<Html5Audio src={staticFile('daily/voice/DMM-006/voice.mp3')} />
					</Sequence>
				</>
			)}
		</AbsoluteFill>
	);
};
