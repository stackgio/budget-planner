import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {cinematic, story} from '../../../story/theme';
import {FACTS, MEMBERS_M, QUARTERS, REVENUE_M} from '../facts';
import {Label, TickerBadge} from '../parts';

const fmt1 = (v: number) => v.toFixed(1);

/** mini bar chart of a real quarterly series (last bar green) */
const Bars: React.FC<{values: number[]; max: number; w: number; h: number; grow: number}> = ({values, max, w, h, grow}) => {
	const n = values.length;
	const gap = 8;
	const bw = (w - gap * (n - 1)) / n;
	return (
		<svg width={w} height={h + 40} style={{overflow: 'visible'}}>
			{values.map((v, i) => {
				const stag = Math.max(0, Math.min(1, grow * 1.6 - (i / n) * 0.6));
				const bh = h * (v / max) * E.out(stag);
				const last = i === n - 1;
				return <rect key={i} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx={5} fill={last ? cinematic.accent : '#3A3F47'} />;
			})}
			<line x1={0} x2={w} y1={h} y2={h} stroke={cinematic.ink} strokeWidth={3} />
			<text x={0} y={h + 32} fontSize={24} fontWeight={800} fill={cinematic.muted} fontFamily="Inter">
				{QUARTERS[0]}
			</text>
			<text x={w} y={h + 32} fontSize={24} fontWeight={800} fill={cinematic.ink} textAnchor="end" fontFamily="Inter">
				{QUARTERS[n - 1]}
			</text>
		</svg>
	);
};

/** One stat row: big number + label on the left, real 9-quarter bars on the right. */
const StatRow: React.FC<{top: number; inAt: number; countAt: number; big: string; label: string; values: number[]; max: number}> = ({top, inAt, countAt, big, label, values, max}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = sp(frame, fps, inAt, 'heavy');
	const P = cinematic;
	return (
		<div
			style={{
				position: 'absolute',
				left: story.safe.left - 12,
				right: story.safe.right - 60,
				top,
				height: 350,
				borderRadius: 34,
				background: P.paper,
				border: `2px solid ${P.line}`,
				boxSizing: 'border-box',
				padding: '44px 40px',
				transform: `translateY(${(1 - p) * 120}px)`,
				opacity: Math.min(1, p * 1.6),
				boxShadow: `0 30px 60px ${P.shadow}`,
				overflow: 'hidden',
			}}
		>
			<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: P.accent}} />
			<div style={{fontSize: 140, fontWeight: 900, letterSpacing: -6, color: P.accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums', opacity: kf(frame, [countAt - 4, countAt + 2], [0, 1])}}>{big}</div>
			<Label color={P.ink} size={32} style={{marginTop: 22}}>
				{label}
			</Label>
			<Label color={P.muted} size={24} style={{marginTop: 10}}>
				Record high
			</Label>
			<div style={{position: 'absolute', right: 40, top: 70}}>
				<Bars values={values} max={max} w={330} h={180} grow={kf(frame, [inAt, inAt + 30], [0, 1])} />
			</div>
		</div>
	);
};

/**
 * SCENE 4 — REASON. "I bought more SoFi stock." reveals the ticker, "Why?" docks it
 * into the header, then ONE graphic shows both Q3 2026 figures (same quarter:
 * three months ended Sep 30, 2026), each with real 9-quarter bars.
 */
export const WhyScene: React.FC = () => {
	const P = cinematic;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSofi = cue('L8', 'SoFi');
	const tWhy = cue('L9', 'Why?');
	const tBecause = cue('L10', 'Because');
	const tNum = cue('L10', '$1.4');
	const tBillion = cue('L10', 'billion', 0, 'end');
	const tReached = cue('L11', 'reached');
	const t17 = cue('L11', '17');
	const tMembers = cue('L11', 'members.', 0, 'end');
	const rev = kf(frame, [tNum, tBillion - 8], [0, FACTS.revenueQ3.value / 1000], E.out);
	const mem = kf(frame, [t17, tMembers - 6], [0, FACTS.membersQ3.value], E.out);
	const badgeIn = sp(frame, fps, 0, 'heavy');
	const reveal = sp(frame, fps, tSofi - 2, 'heavy');
	const dock = kf(frame, [tWhy - 4, tWhy + 10], [0, 1], E.inOut);
	const head = sp(frame, fps, tWhy - 2, 'heavy');
	const src = kf(frame, [tMembers - 6, tMembers + 6], [0, 1]);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg light={0.8} lightX={900} lightY={800} warm={false} />
			<Camera keys={[{at: 0, zoom: 1.0}, {at: tBecause, zoom: 1.03, x: 540, y: 760}, {at: tMembers, zoom: 1.0, x: 540, y: 960, ease: E.soft}]}>
				{/* ticker: centred reveal, then it hands over to the header */}
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: mix(760, 120, dock),
						display: 'flex',
						justifyContent: 'center',
						transform: `scale(${(0.6 + 0.4 * badgeIn + 0.12 * Math.sin(Math.min(1, reveal) * Math.PI)) * mix(1.25, 0.6, dock)})`,
						opacity: Math.min(1, badgeIn * 2) * (1 - dock),
					}}
				>
					<TickerBadge palette={P} reveal={reveal} />
				</div>
				<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 10, opacity: head, transform: `translateY(${(1 - head) * 20}px)`}}>
					<div style={{fontSize: story.type.h1 + 10, fontWeight: 900, color: P.ink, letterSpacing: -2, lineHeight: 1}}>
						WHY <span style={{color: P.accent}}>SOFI?</span>
					</div>
					<Label color={P.muted} size={28} style={{marginTop: 14}}>
						Q3 2026 · quarter ended Sep 30
					</Label>
				</div>
				<StatRow top={400} inAt={tBecause - 2} countAt={tNum} big={`$${fmt1(rev)}B`} label="Quarterly revenue" values={REVENUE_M} max={1400} />
				<StatRow top={785} inAt={tReached - 4} countAt={t17} big={`${fmt1(mem)}M`} label="Members" values={MEMBERS_M} max={17.5} />
				<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 1170, fontSize: 24, fontWeight: 700, color: P.muted, lineHeight: 1.3, opacity: src}}>
					Both figures: Q3 2026. Source: SoFi earnings release, Oct 27, 2026. Revenue = GAAP net revenue $1.385B; members 17,074,272 at Sep 30.
				</div>
			</Camera>
			<Sfx at={tSofi - 2} name="stamp" volume={0.35} />
			<Sfx at={tBecause - 2} name="whoosh-soft" volume={0.3} />
			<Sfx at={tNum} name="tick" volume={0.3} />
			<Sfx at={tReached - 4} name="whoosh-soft" volume={0.3} />
			<Sfx at={t17} name="tick" volume={0.3} />
		</AbsoluteFill>
	);
};

/**
 * SCENE 7 — PERSONAL DECISION. No second screenshot: Marcus + the two facts
 * from the order shown in the hook (6 shares, $97.18). Framed as personal.
 */
export const DecideScene: React.FC = () => {
	const P = cinematic;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBelieve = cue('L15', 'believe');
	const tLong = cue('L15', 'long-term');
	const tDecided = cue('L16', 'decided');
	const tBuy = cue('L16', 'buy');
	const c1 = sp(frame, fps, tDecided - 2, 'bouncy');
	const c2 = sp(frame, fps, tBuy, 'bouncy');
	const note = kf(frame, [tBuy + 8, tBuy + 18], [0, 1]);
	const chip = (p: number, big: string, small: string, top: number) => (
		<div
			style={{
				position: 'absolute',
				left: 470,
				top,
				width: 470,
				padding: '26px 32px',
				borderRadius: 26,
				background: P.paper,
				border: `3px solid ${P.accent}`,
				boxSizing: 'border-box',
				transform: `translateX(${(1 - p) * 140}px) scale(${0.8 + 0.2 * p})`,
				opacity: Math.min(1, p * 1.5),
			}}
		>
			<div style={{fontSize: 100, fontWeight: 900, letterSpacing: -3, color: P.accent, lineHeight: 1}}>{big}</div>
			<Label color={P.ink} size={30} style={{marginTop: 10}}>
				{small}
			</Label>
		</div>
	);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg light={0.7} lightX={700} lightY={850} floorY={story.ground} />
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 10, right: story.safe.right}}>
				<KineticText text="LONG-TERM POTENTIAL." at={tLong - 4} mode="rise" fontSize={story.type.h1 + 10} color={P.ink} colors={{longterm: P.accent}} />
			</div>
			<Camera keys={[{at: 0, zoom: 1.03, x: 540, y: 980}, {at: tBuy + 30, zoom: 1.0, x: 540, y: 960, ease: E.soft}]}>
				<Marcus
					x={250}
					y={story.ground}
					scale={1.1}
					facing={1}
					seed={11}
					onDark
					track={[
						{at: 0, pose: 'think', face: 'focused'},
						{at: tBelieve, pose: ['idle', {head: -4}], face: 'determined'},
						{at: tDecided - 4, pose: 'fist', face: 'determined', spring: 'bouncy'},
						{at: tBuy + 4, pose: 'present', face: 'happy'},
					]}
				/>
				<div style={{position: 'absolute', left: 470, top: 640, opacity: c1}}>
					<Label color={P.muted} size={26}>
						My order
					</Label>
				</div>
				{chip(c1, `${FACTS.shares.value}`, 'Shares', 690)}
				{chip(c2, `$${FACTS.totalCost.value.toFixed(2)}`, 'Invested', 930)}
				<div style={{position: 'absolute', left: 470, right: story.safe.right - 40, top: 1180, opacity: note}}>
					<Label color={P.muted} size={24}>
						Personal decision · not a recommendation
					</Label>
				</div>
			</Camera>
			<Sfx at={tDecided - 2} name="pop" volume={0.35} />
			<Sfx at={tBuy} name="coin" volume={0.35} />
		</AbsoluteFill>
	);
};
