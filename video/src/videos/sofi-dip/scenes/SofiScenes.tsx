import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg, EditorialBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {cinematic, editorial, story} from '../../../story/theme';
import {FACTS, MEMBERS_M, QUARTERS, REVENUE_M} from '../facts';
import {CROP, Label, OrderShot, ROWS, TickerBadge, lerpRegion} from '../parts';

/** SCENE 4 — SOFI REVEAL → the real order (first look). */
export const SofiScene: React.FC = () => {
	const P = editorial;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSofi = cue('L8', 'SoFi');
	const tStock = cue('L8', 'stock.');
	const tWhy = cue('L9', 'Why?');
	const badge = sp(frame, fps, 0, 'heavy');
	const reveal = sp(frame, fps, tSofi - 2, 'heavy');
	const shot = sp(frame, fps, tStock - 2, 'smooth');
	const look = prog(frame, tWhy - 4, 18, E.inOut);
	const W = 820;
	const H = (W * CROP.h) / CROP.w;
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<Camera keys={[{at: 0, zoom: 1}, {at: tWhy - 4, zoom: 1}, {at: tWhy + 30, zoom: 1.06, x: 540, y: 820}]}>
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: mix(700, 210, shot),
						display: 'flex',
						justifyContent: 'center',
						transform: `scale(${(0.6 + 0.4 * badge + 0.15 * Math.sin(Math.min(1, reveal) * Math.PI)) * mix(1.25, 0.85, shot)})`,
						opacity: Math.min(1, badge * 2),
					}}
				>
					<TickerBadge palette={P} reveal={reveal} />
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: 410, textAlign: 'center', opacity: shot}}>
					<Label color={P.muted}>My actual order</Label>
				</div>
				<OrderShot
					w={W}
					palette={P}
					mark={ROWS.title}
					highlight={look}
					style={{left: (1080 - W) / 2 - 10, top: mix(1920, 470, shot), transform: `rotate(${(1 - shot) * 4}deg)`}}
				/>
			</Camera>
			<Sfx at={tSofi - 2} name="stamp" volume={0.4} />
			<Sfx at={tStock - 2} name="paper" volume={0.35} />
		</AbsoluteFill>
	);
};

const fmt1 = (v: number) => v.toFixed(1);

/** SCENE 5 — WHY SOFI: real quarterly revenue bars morph into member bars. */
export const WhyScene: React.FC = () => {
	const P = cinematic;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tReported = cue('L10', 'reported');
	const tRecord = cue('L10', 'record');
	const tNum = cue('L10', '$1.4');
	const tBillion = cue('L10', 'billion', 0, 'end');
	const tReached = cue('L11', 'reached');
	const t17 = cue('L11', '17');
	const tMembers = cue('L11', 'members.', 0, 'end');
	const grow = kf(frame, [tReported, tNum], [0, 1], E.out);
	const morph = kf(frame, [tReached, t17 + 6], [0, 1], E.inOut);
	const rev = kf(frame, [tNum, tBillion - 8], [0, FACTS.revenueQ3.value / 1000], E.out);
	const mem = kf(frame, [t17, tMembers - 10], [0, 17], E.out);
	const head1 = sp(frame, fps, tNum - 4, 'heavy');
	const head2 = sp(frame, fps, t17 - 4, 'heavy');
	const record = sp(frame, fps, tRecord, 'bouncy');
	// bars
	const BX = story.safe.left + 10;
	const BW = 1080 - story.safe.left - story.safe.right - 20 + 40;
	const BY = 1210; // baseline
	const BH = 440;
	const n = QUARTERS.length;
	const gap = 18;
	const bw = (BW - gap * (n - 1)) / n;
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg light={0.8} lightX={900} lightY={800} warm={false} />
			<Camera keys={[{at: 0, zoom: 1}, {at: tReached, zoom: 1}, {at: tMembers, zoom: 1.03, x: 540, y: 820}]}>
				<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 10, opacity: sp(frame, fps, 0, 'snappy')}}>
					<Label color={P.muted}>SoFi · Q3 2026 results</Label>
				</div>
				{/* headline number A: revenue */}
				<div style={{position: 'absolute', left: story.safe.left, top: 230, opacity: head1 * (1 - morph), transform: `translateY(${-morph * 40}px)`}}>
					<div style={{fontSize: 190, fontWeight: 900, letterSpacing: -7, color: P.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>
						<span style={{color: P.accent}}>${fmt1(rev)}</span>
						<span style={{fontSize: 96, letterSpacing: -2}}> BILLION</span>
					</div>
					<Label color={P.body} size={32} style={{marginTop: 18}}>
						Quarterly revenue
					</Label>
				</div>
				{/* headline number B: members */}
				<div style={{position: 'absolute', left: story.safe.left, top: 230, opacity: head2 * morph, transform: `translateY(${(1 - morph) * 40}px)`}}>
					<div style={{fontSize: 190, fontWeight: 900, letterSpacing: -7, color: P.accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>
						{Math.round(mem)}M+
					</div>
					<Label color={P.body} size={32} style={{marginTop: 18}}>
						Members
					</Label>
				</div>
				{/* RECORD tag */}
				<div
					style={{
						position: 'absolute',
						right: story.safe.right - 30,
						top: 560,
						padding: '10px 20px',
						borderRadius: 12,
						border: `3px solid ${P.accent}`,
						color: P.accent,
						fontSize: 28,
						fontWeight: 900,
						letterSpacing: 4,
						transform: `scale(${record}) rotate(-4deg)`,
						opacity: record,
					}}
				>
					RECORD
				</div>
				{/* real quarterly bars */}
				<svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
					<line x1={BX} x2={BX + BW} y1={BY} y2={BY} stroke={P.ink} strokeWidth={5} />
					{QUARTERS.map((q, i) => {
						const vR = REVENUE_M[i] / 1400;
						const vM = MEMBERS_M[i] / 17.5;
						const stag = Math.max(0, Math.min(1, grow * 1.6 - (i / n) * 0.6));
						const h = BH * mix(vR, vM, morph) * E.out(stag);
						const last = i === n - 1;
						return (
							<rect key={q} x={BX + i * (bw + gap)} y={BY - h} width={bw} height={h} rx={8} fill={last ? P.accent : '#3A3F47'} style={last ? {filter: `drop-shadow(0 0 18px ${P.accentSoft})`} : undefined} />
						);
					})}
				</svg>
				<div style={{position: 'absolute', left: BX, top: BY + 16, fontSize: 26, fontWeight: 800, color: P.muted, letterSpacing: 1}}>{QUARTERS[0]}</div>
				<div style={{position: 'absolute', left: BX + BW - 110, top: BY + 16, fontSize: 26, fontWeight: 800, color: P.ink, letterSpacing: 1, width: 110, textAlign: 'right'}}>{QUARTERS[n - 1]}</div>
				<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 40, top: 1300, fontSize: 24, fontWeight: 700, color: P.muted, lineHeight: 1.3}}>
					Source: SoFi Q3 2026 earnings release (Oct 27, 2026). Revenue = GAAP net revenue, $1.385B. Members: 17,074,272.
				</div>
			</Camera>
			<Sfx at={tNum} name="tick" volume={0.3} />
			<Sfx at={tRecord} name="pop" volume={0.3} />
			<Sfx at={t17} name="tick" volume={0.3} />
		</AbsoluteFill>
	);
};

/** SCENE 8 — MY CONVICTION: back to the real order, rows lifted into chips. */
export const ConvictScene: React.FC = () => {
	const P = cinematic;
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tBelieve = cue('L15', 'believe');
	const tDecided = cue('L16', 'decided');
	const tBuy = cue('L16', 'buy');
	const shot = sp(frame, fps, tBelieve - 8, 'smooth');
	const c1 = sp(frame, fps, tDecided, 'bouncy');
	const c2 = sp(frame, fps, tBuy, 'bouncy');
	const toShares = prog(frame, tDecided - 6, 14, E.inOut);
	const toTotal = prog(frame, tBuy - 6, 14, E.inOut);
	const mark = toTotal > 0 ? lerpRegion(ROWS.shares, ROWS.total, toTotal) : ROWS.shares;
	const W = 780;
	const H = (W * CROP.h) / CROP.w;
	const chip = (p: number, big: string, small: string, left: number) => (
		<div
			style={{
				position: 'absolute',
				left,
				top: 990,
				width: 410,
				padding: '26px 30px',
				borderRadius: 26,
				background: P.paper,
				border: `3px solid ${P.accent}`,
				boxSizing: 'border-box',
				transform: `translateY(${(1 - p) * -120}px) scale(${0.7 + 0.3 * p})`,
				opacity: Math.min(1, p * 1.5),
			}}
		>
			<div style={{fontSize: 92, fontWeight: 900, letterSpacing: -3, color: P.accent, lineHeight: 1}}>{big}</div>
			<Label color={P.ink} size={30} style={{marginTop: 10}}>
				{small}
			</Label>
		</div>
	);
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg light={0.7} lightX={540} lightY={600} />
			<Camera keys={[{at: 0, zoom: 1.04, x: 540, y: 760}, {at: tBuy + 40, zoom: 1.0, x: 540, y: 960, ease: E.soft}]}>
				<OrderShot
					w={W}
					palette={P}
					mark={mark}
					highlight={Math.max(toShares, 0) * 1}
					style={{left: (1080 - W) / 2 - 10, top: mix(260, 190, shot), opacity: shot, transform: `scale(${mix(0.94, 1, shot)})`}}
				/>
				{chip(c1, `${FACTS.shares.value}`, 'Shares', 56)}
				{chip(c2, `$${FACTS.totalCost.value.toFixed(2)}`, 'Invested', 490)}
			</Camera>
			<Sfx at={tDecided} name="pop" volume={0.35} />
			<Sfx at={tBuy} name="coin" volume={0.35} />
		</AbsoluteFill>
	);
};
