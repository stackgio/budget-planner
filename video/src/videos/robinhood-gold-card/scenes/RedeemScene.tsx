import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';
import {CASHBACK as C} from '../assets';
import {FACTS} from '../facts';
import {BridgeStage} from './BridgeScene';
import {HoldingsShot} from './HoldingsShot';

// the Cash back screen, shown large
const VIEW_W = 888;
const VIEW_LEFT = 72;
const VIEW_TOP = 280;
const S = VIEW_W / C.view.w;
const VIEW_H = C.view.h * S;
const toScreen = (x: number, y: number) => ({x: VIEW_LEFT + (x - C.view.x) * S, y: VIEW_TOP + (y - C.view.y) * S});

const SLIDE_FRAMES = 24; // ~0.8 s
const KNOB_STOP = 0.75; // about three-quarters across

const FS = C.valueH / 0.727; // Inter digit height ≈ 0.727 em → same digit size as the app
const lerpColor = (a: string, b: string, t: number) => {
	const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
	const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
	return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
};

const patch = (r: {x: number; y: number; w: number; h: number}): React.CSSProperties => ({position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, background: C.bg});

/**
 * Real Cash back screen (IMG_0754) with the slider, gold knob and both amounts rebuilt as
 * animated layers on top of it (measured to the screenshot's pixels). The knob drives both
 * counters: 0 → 1,000 points and $0.00 → $10.00 — always under a visible EXAMPLE label.
 */
const CashBackScreen: React.FC<{p: number}> = ({p}) => {
	const travel = (C.track.x + C.track.w - C.knob.r - C.knob.cx) * KNOB_STOP;
	const kx = C.knob.cx + travel * p;
	const points = Math.round(FACTS.examplePoints.value * p);
	const cash = (FACTS.exampleRedemption.value * points) / FACTS.examplePoints.value;
	const lit = kf(p, [0, 0.15], [0, 1]);
	const color = lerpColor(C.valueColor, '#F2F0EA', lit);
	const value: React.CSSProperties = {
		position: 'absolute',
		top: C.valueTop - 0.137 * FS,
		width: 600,
		textAlign: 'center',
		fontFamily: story.font,
		fontSize: FS,
		fontWeight: 400,
		lineHeight: 1,
		letterSpacing: -1,
		fontVariantNumeric: 'tabular-nums',
		color,
	};
	return (
		<div style={{position: 'absolute', left: VIEW_LEFT, top: VIEW_TOP, width: VIEW_W, height: VIEW_H, overflow: 'hidden', borderRadius: 28, border: `2px solid ${P.line}`, boxSizing: 'content-box'}}>
			<div style={{position: 'absolute', left: 0, top: 0, width: C.natural.w, height: C.natural.h, transformOrigin: '0 0', transform: `scale(${S}) translate(${-C.view.x}px, ${-C.view.y}px)`}}>
				<Img src={staticFile(C.src)} style={{position: 'absolute', left: 0, top: 0, width: C.natural.w, height: C.natural.h, maxWidth: 'none'}} />
				{/* animated layers replace the static values and slider */}
				<div style={patch(C.pointsPatch)} />
				<div style={patch(C.cashPatch)} />
				<div style={patch(C.sliderPatch)} />
				<div style={{...value, left: C.pointsCenterX - 300}}>{points.toLocaleString('en-US')}</div>
				<div style={{...value, left: C.cashCenterX - 300}}>${cash.toFixed(2)}</div>
				<div style={{position: 'absolute', left: C.track.x, top: C.track.y, width: C.track.w, height: C.track.h, borderRadius: C.track.h / 2, background: C.track.color}} />
				<div
					style={{
						position: 'absolute',
						left: C.track.x,
						top: C.track.y,
						width: kx - C.track.x,
						height: C.track.h,
						borderRadius: C.track.h / 2,
						background: `linear-gradient(90deg, ${C.knob.bottom}, ${C.knob.top})`,
					}}
				/>
				<div
					style={{
						position: 'absolute',
						left: kx - C.knob.r,
						top: C.knob.cy - C.knob.r,
						width: C.knob.r * 2,
						height: C.knob.r * 2,
						borderRadius: '50%',
						background: `linear-gradient(180deg, ${C.knob.top}, ${C.knob.bottom})`,
						boxShadow: '0 6px 18px rgba(0,0,0,0.5)',
					}}
				>
					<svg width={C.knob.r * 2} height={C.knob.r * 2} viewBox="-72 -72 144 144" style={{position: 'absolute', inset: 0}}>
						<path d="M-6 -10 L-18 0 L-6 10 Z M6 -10 L18 0 L6 10 Z" fill="#050403" />
					</svg>
				</div>
			</div>
		</div>
	);
};

const FlowPill: React.FC<{p: number; label: string; hot?: number}> = ({p, label, hot = 0}) => (
	<div
		style={{
			padding: '22px 46px',
			borderRadius: 999,
			fontSize: 64,
			fontWeight: 900,
			letterSpacing: -1,
			whiteSpace: 'nowrap',
			color: hot > 0.5 ? '#06130B' : P.ink,
			background: hot > 0 ? `rgba(44,212,122,${hot})` : P.paper,
			border: `4px solid ${hot > 0 ? P.accent : P.line}`,
			opacity: Math.min(1, p * 1.5),
			transform: `translateY(${(1 - p) * 30}px) scale(${(0.8 + 0.2 * p) * (1 + 0.05 * hot)})`,
		}}
	>
		{label}
	</div>
);

const DownArrow: React.FC<{p: number}> = ({p}) => (
	<svg width={60} height={70} viewBox="0 0 60 70" style={{opacity: p}}>
		<path d="M30 6 V58 M14 44 L30 60 L46 44" fill="none" stroke={P.accent} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
	</svg>
);

/**
 * REDEMPTION — continues the bridge's end state; on "Rewards tab" the "Earn points" pill
 * flies into the points column as the real Cash back screen comes up.
 * "turn those points into cash": knob slides ~¾ across in ~0.8 s, counters land on 1,000 / $10.00,
 * hold ≥ 1 s, then the example clears into Cash back → Robinhood → ETFs, and a hard cut to the
 * real VOO row on "more ETFs".
 */
export const RedeemScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tRewards = cue('L9', 'rewards');
	const tTurn = cue('L9', 'turn');
	const tRh = cue('L9', 'robinhood');
	const tEtf = cue('L10', 'etfs');
	const tMore = cue('L12', 'more');

	if (frame >= tMore) return <HoldingsShot />;

	const handoff = kf(frame, [tRewards, tRewards + 12], [0, 1], E.inOut);
	const screenIn = kf(frame, [tRewards + 6, tRewards + 14], [0, 1], E.out);
	const label = sp(frame, fps, tRewards + 10, 'snappy');
	const p = kf(frame, [tTurn, tTurn + SLIDE_FRAMES], [0, 1], E.inOut);
	const land = tTurn + SLIDE_FRAMES;
	const out = kf(frame, [tRh - 2, tRh + 10], [0, 1], E.in);
	const f1 = sp(frame, fps, tRh + 4, 'snappy');
	const f2 = sp(frame, fps, tRh + 10, 'snappy');
	const f3 = sp(frame, fps, tEtf - 2, 'bouncy');
	const hot = kf(frame, [tEtf + 4, tEtf + 14], [0, 1]);
	const pillTo = toScreen(C.pointsCenterX, C.valueTop + C.valueH / 2);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={540} lightY={700} light={0.6} warm={false} />
			{out < 1 && (
				<AbsoluteFill style={{opacity: screenIn * (1 - out), transform: `scale(${mix(0.94, 1, screenIn) * (1 - 0.06 * out)})`, transformOrigin: '540px 700px'}}>
					<div style={{position: 'absolute', left: 0, right: 0, top: story.safe.top + 40, textAlign: 'center', fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted}}>REWARDS TAB</div>
					<CashBackScreen p={p} />
					{/* EXAMPLE label: up before the knob moves, stays through the hold */}
					<div style={{position: 'absolute', left: 0, right: 0, top: VIEW_TOP + VIEW_H + 54, display: 'flex', justifyContent: 'center', opacity: label, transform: `scale(${0.85 + 0.15 * label})`}}>
						<div style={{padding: '12px 34px', borderRadius: 14, background: '#F5F2EA', color: '#0B0C0E', fontSize: 44, fontWeight: 900, letterSpacing: 7}}>EXAMPLE</div>
					</div>
				</AbsoluteFill>
			)}
			{handoff < 1 && <BridgeStage headlineAt={-200} cardIn={1} tap={0} pill={1} exit={handoff} pillTo={{...pillTo, scale: 0.5}} />}
			{out > 0 && (
				<div style={{position: 'absolute', left: 0, right: 0, top: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22}}>
					<FlowPill p={f1} label="Cash back" />
					<DownArrow p={f2} />
					<FlowPill p={f2} label="Robinhood" />
					<DownArrow p={f3} />
					<FlowPill p={f3} label="ETFs" hot={hot} />
				</div>
			)}
			<Sfx at={tRewards} name="whoosh-soft" volume={0.25} />
			<Sfx at={land} name="coin" volume={0.3} />
			<Sfx at={tEtf + 8} name="click" volume={0.3} />
		</AbsoluteFill>
	);
};
