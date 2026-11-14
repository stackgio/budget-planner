// DMM-003 · "You're not bad at saving. You're just saving last." (narrated: creator's "Stack voice")
// A cascade of glass trays: a paycheck pours in at the top and fills each tray
// in order. Savings sits last and gets nothing; "Flip it" lifts savings to the
// top tray and the next payday fills it first. Every beat is keyed to the
// narration's word timestamps (timing.ts ← voice.words.json).
import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../../../fonts';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {Camera2D} from '../../components/Camera2D';
import {SafeZoneOverlay, Signature} from '../../components/Chrome';
import {FilmFinish, Stage} from '../../components/FilmLook';
import {Headline} from '../../components/Headline';
import {Stream, Tray} from '../../components/Tray';
import {buildPages, WordCaptions} from '../../components/WordCaptions';
import {dmm, usd} from '../../theme';
import {PAYCHECK, SAVE_MONTHLY, SAVE_YEARLY} from './facts';
import {FPS, KEY_WORDS, PAGE_BREAKS, T, VO_OFFSET, WORDS} from './timing';

export {QC_BEATS} from './timing';

const C = dmm.color;
type Id = 'rent' | 'food' | 'fun' | 'savings';
const SLOTS = [
	{x: 500, y: 710},
	{x: 580, y: 875},
	{x: 500, y: 1040},
	{x: 580, y: 1205},
];
const ORDER_A: Id[] = ['rent', 'food', 'fun', 'savings'];
const ORDER_B: Id[] = ['savings', 'rent', 'food', 'fun'];
const TRAY_W = 400;
const LABEL: Record<Id, string> = {rent: 'RENT', food: 'FOOD', fun: 'FUN', savings: 'SAVINGS'};
const PAGES = buildPages(WORDS, FPS, VO_OFFSET, PAGE_BREAKS, KEY_WORDS);

const win = (f: number, a: number, b: number, fade = 6) => Math.min(prog(f, a, fade, E.out), 1 - prog(f, b, fade, E.in));

export const DMM003: React.FC<{showSafeZones?: boolean; audio?: boolean}> = ({showSafeZones = false, audio = true}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// ---- positions (phase A → flip → phase B)
	const flipP = prog(frame, T.flip + 2, 22, E.inOut);
	const pos = (id: Id) => {
		const a = SLOTS[ORDER_A.indexOf(id)];
		const b = SLOTS[ORDER_B.indexOf(id)];
		const x = mix(a.x, b.x, flipP) + (id === 'savings' ? Math.sin(Math.PI * flipP) * 220 : 0);
		// hook motion: the tower assembles from frame 0 (each tray drops in and settles)
		const k = ORDER_A.indexOf(id);
		const settleIn = sp(frame, fps, -6 + k * 5, 'bouncy');
		const y = mix(a.y, b.y, flipP) - (1 - settleIn) * 40;
		return {x, y, rot: id === 'savings' ? Math.sin(Math.PI * flipP) * -8 : 0, op: Math.min(1, Math.max(0, settleIn * 1.6))};
	};

	// ---- liquid levels (phase A drains on the flip; phase B refills in the new order)
	const drain = 1 - prog(frame, T.flip, 12, E.in);
	const level: Record<Id, number> = {
		rent: prog(frame, T.rent - 10, 16) * drain + prog(frame, T.then - 6, 14),
		food: prog(frame, T.food - 2, 14) * drain + prog(frame, T.live - 2, 14),
		fun: prog(frame, T.fun - 2, 20) * drain + 0.7 * prog(frame, T.rest - 4, 18),
		savings: prog(frame, T.savings2 - 4, 18), // phase A: the trickle never arrives
	};
	const savedFull = frame >= T.savings2 + 14;

	// ---- streams
	const streamX = (k: number) => (SLOTS[k + 1].x > SLOTS[k].x ? SLOTS[k].x + 186 : SLOTS[k].x - 186);
	const phaseA = frame < T.flip + 2;
	const sw = phaseA
		? {
				src: 22 * win(frame, T.rent - 16, T.usually),
				s01: 18 * win(frame, T.food - 5, T.usually),
				s12: 16 * win(frame, T.fun - 5, T.usually),
				s23: 7 * win(frame, T.toSavings, T.left + 4) * (1 - prog(frame, T.toSavings, T.left - T.toSavings, E.in)),
			}
		: {
				src: 22 * win(frame, T.savings2 - 10, T.rest + 18),
				s01: 18 * win(frame, T.then - 9, T.rest + 18),
				s12: 16 * win(frame, T.live - 5, T.rest + 18),
				s23: 14 * win(frame, T.rest - 7, T.rest + 20),
			};
	const toneAt = (k: number): 'accent' | 'muted' => (phaseA ? 'muted' : k === 0 ? 'accent' : 'muted');

	// ---- camera
	const camKeys = [
		{at: 0, zoom: 1.0, fx: 540, fy: 930},
		{at: T.last - 6, zoom: 1.0, fx: 540, fy: 930},
		{at: T.last + 14, zoom: 1.04, fx: 560, fy: 1000},
		{at: T.nothing + 6, zoom: 1.04, fx: 560, fy: 1000},
		{at: T.flip + 20, zoom: 1.0, fx: 540, fy: 930},
		{at: T.savings2 + 10, zoom: 1.06, fx: 540, fy: 860},
		{at: T.rest, zoom: 1.02, fx: 540, fy: 900},
		{at: T.endCard, zoom: 1.0, fx: 540, fy: 930},
	];

	const lastTag = win(frame, T.last - 2, T.flip, 8);
	const firstTag = prog(frame, T.first - 2, 8);
	const zeroPill = win(frame, T.nothing - 2, T.flip, 6);
	const savePill = sp(frame, fps, T.savings2 + 14, 'bouncy');
	const paydayPulse = 1 + 0.08 * Math.max(0, 1 - Math.abs(frame - T.payday - 4) / 8);
	const savingsGlow = !phaseA ? level.savings * (0.6 + 0.4 * prog(frame, T.endCard, 20)) : 0;
	const yearIn = sp(frame, fps, T.yearCallout, 'bouncy');
	const signIn = prog(frame, T.sign, 16);

	return (
		<AbsoluteFill style={{fontFamily: dmm.font}}>
			<Stage lightX={540} lightY={phaseA ? 1180 : 640} light={phaseA ? 0.7 : 1 + savingsGlow * 0.4} />
			<Camera2D keys={camKeys} anchor={[540, 930]} drift={0.8}>
				<svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<Stream x={SLOTS[0].x} y0={566} y1={SLOTS[0].y - 18} width={sw.src} tone={phaseA ? 'muted' : 'accent'} phase={frame} />
					{phaseA || flipP >= 1 ? (
						<>
							<Stream x={streamX(0)} y0={SLOTS[0].y - 30} y1={SLOTS[1].y - 14} width={sw.s01} tone="muted" phase={frame} />
							<Stream x={streamX(1)} y0={SLOTS[1].y - 30} y1={SLOTS[2].y - 14} width={sw.s12} tone="muted" phase={frame} />
							<Stream x={streamX(2)} y0={SLOTS[2].y - 30} y1={SLOTS[3].y - 14} width={sw.s23} tone={toneAt(2)} phase={frame} />
						</>
					) : null}
					{(['rent', 'food', 'fun', 'savings'] as Id[]).map((id) => {
						const p = pos(id);
						return (
							<g key={id} transform={`rotate(${p.rot} ${p.x} ${p.y})`} opacity={p.op}>
								<Tray cx={p.x} cy={p.y} w={TRAY_W} level={level[id]} tone={id === 'savings' ? 'accent' : 'muted'} glow={id === 'savings' ? savingsGlow : 0} />
							</g>
						);
					})}
				</svg>
				{/* paycheck source */}
				<div
					style={{
						position: 'absolute',
						left: SLOTS[0].x - 220,
						top: 512,
						width: 440,
						textAlign: 'center',
						transform: `scale(${paydayPulse})`,
					}}
				>
					<div style={{display: 'inline-block', padding: '8px 20px', borderRadius: 999, border: `2px solid ${C.ink}`, color: C.ink, fontSize: 28, fontWeight: 900, letterSpacing: 2, whiteSpace: 'nowrap', background: C.bg}}>
						PAYCHECK {usd(PAYCHECK.value)}
					</div>
				</div>
				{/* labels ride with their trays */}
				{(['rent', 'food', 'fun', 'savings'] as Id[]).map((id) => {
					const p = pos(id);
					const isS = id === 'savings';
					return (
						<div key={id} style={{position: 'absolute', left: p.x - TRAY_W / 2 - 250, top: p.y - 20, width: 228, textAlign: 'right', opacity: p.op * (1 - Math.sin(Math.PI * flipP))}}>
							<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 3, color: isS ? C.accent : C.muted}}>{LABEL[id]}</div>
							{isS && (
								<div style={{position: 'relative', height: 40, marginTop: 6}}>
									<span style={{position: 'absolute', right: 0, opacity: lastTag, padding: '4px 12px', borderRadius: 8, background: 'rgba(156,163,175,0.25)', color: C.ink, fontSize: 24, fontWeight: 900, letterSpacing: 2}}>LAST</span>
									<span style={{position: 'absolute', right: 0, opacity: firstTag, padding: '4px 12px', borderRadius: 8, background: C.accent, color: C.bg, fontSize: 24, fontWeight: 900, letterSpacing: 2}}>FIRST</span>
								</div>
							)}
						</div>
					);
				})}
				{/* savings amount */}
				{(() => {
					const p = pos('savings');
					return (
						<div style={{position: 'absolute', left: p.x + TRAY_W / 2 + 22, top: p.y - 28}}>
							<div style={{opacity: zeroPill, fontSize: 48, fontWeight: 900, color: C.muted, position: 'absolute'}}>$0</div>
							<div style={{opacity: Math.min(1, savePill * 1.3), transform: `scale(${0.7 + 0.3 * savePill})`, transformOrigin: '0% 50%', fontSize: 48, fontWeight: 900, color: C.accent, position: 'absolute'}}>
								{savedFull ? usd(SAVE_MONTHLY.value) : ''}
							</div>
						</div>
					);
				})()}
			</Camera2D>

			{/* legibility band behind captions */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(8,13,10,0.9) 0%, rgba(8,13,10,0.6) 18%, rgba(8,13,10,0) 26%, rgba(8,13,10,0) 76%, rgba(8,13,10,0.85) 92%)'}} />

			<WordCaptions pages={PAGES} y={200} size={74} />
			<Headline
				y={196}
				at={T.endCard}
				stagger={6}
				lines={[
					{text: 'SAVE FIRST.', size: 84},
					{text: 'LIVE ON THE REST.', size: 76, color: C.accent},
				]}
			/>

			{/* the year view (after the voice ends) */}
			<div style={{position: 'absolute', left: 0, width: 1080, top: 1300, textAlign: 'center', opacity: Math.min(1, yearIn * 1.3), transform: `translateY(${(1 - yearIn) * 30}px)`}}>
				<div style={{fontSize: 64, fontWeight: 900, color: C.accent, letterSpacing: -1}}>{usd(SAVE_YEARLY.value)} A YEAR</div>
				<div style={{fontSize: 26, fontWeight: 700, color: C.muted, letterSpacing: 2, marginTop: 4}}>{usd(SAVE_MONTHLY.value)}/MO SAVED FIRST × 12</div>
			</div>
			<div style={{opacity: signIn}}>
				<Signature y={1446} />
			</div>
			<div style={{position: 'absolute', left: dmm.safe.left, top: 1500, width: 888, fontSize: 24, lineHeight: 1.3, fontWeight: 600, color: C.muted}}>
				<span style={{color: C.ink, fontWeight: 800, letterSpacing: 2}}>EXAMPLE</span> · {usd(PAYCHECK.value)} paycheck, 10% saved first = {usd(SAVE_MONTHLY.value)}/mo · {usd(SAVE_YEARLY.value)}/yr in cash, no interest. Not advice.
			</div>

			<FilmFinish grain={0.06} />
			{showSafeZones && <SafeZoneOverlay />}
			{audio && (
				<>
					<Html5Audio src={staticFile('daily/audio/dmm003-bed-sfx.wav')} />
					<Sequence from={VO_OFFSET} layout="none" name="voice: Stack voice">
						<Html5Audio src={staticFile('daily/voice/DMM-003/voice.mp3')} />
					</Sequence>
				</>
			)}
		</AbsoluteFill>
	);
};
