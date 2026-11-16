import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {CUT_TOTAL, FACTS} from '../facts';
import {C, ExampleTag, L, Panel, StepTag, VaultBg, fmt} from '../ui';

type Row = {name: string; amount: number; cut: number; note: string; order: number};
const ROWS: Row[] = [
	{name: 'Food', amount: FACTS.spend.food.value, cut: FACTS.cuts.food.value, note: 'Reduce unnecessary takeout', order: 2},
	{name: 'Subscriptions', amount: FACTS.spend.subscriptions.value, cut: FACTS.cuts.subscriptions.value, note: 'Cancel an unused subscription', order: 1},
	{name: 'Shopping', amount: FACTS.spend.shopping.value, cut: FACTS.cuts.shopping.value, note: 'Fewer impulse purchases', order: 0},
	{name: 'Entertainment', amount: FACTS.spend.entertainment.value, cut: 0, note: '', order: -1},
];
const MAX = Math.max(...ROWS.map((r) => r.amount));
const PANEL = {y: 360, h: 640, rowH: 152, pad: 24};
const BAR_W = L.w - 72;
const POT = {x: L.cx, y: 1072};

/**
 * STEP 03 — "Look at your last 30 days of spending. Find two or three things you can cut
 * back on. You don't have to stop enjoying life just to save money."
 * Example spending bars; three optional trims turn green and flow into savings.
 * Entertainment is explicitly kept — smarter spending, not no fun.
 */
export const ReviewScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tNum = cue('L13', 'Number');
	const tLast = cue('L13', 'last');
	const t30 = cue('L13', '30');
	const tTwo = cue('L14', 'two');
	const tCut = cue('L14', 'cut');
	const tEnjoy = cue('L15', 'enjoying');
	const tSave = cue('L15', 'save');

	const head = sp(frame, fps, tLast - 4, 'snappy');
	const panel = sp(frame, fps, 0, 'smooth');
	const pot = sp(frame, fps, tCut - 6, 'snappy');
	const keep = sp(frame, fps, tEnjoy, 'bouncy');
	const t1 = sp(frame, fps, tEnjoy + 10, 'snappy');
	const t2 = sp(frame, fps, tSave - 2, 'snappy');
	// trims arrive one by one from "two"
	const trimAt = (o: number) => tTwo + o * 9;
	const flowStart = tCut;
	const flowEnd = tCut + 22;
	const landed = frame >= flowEnd;
	const saved = kf(frame, [flowStart + 8, flowEnd], [0, CUT_TOTAL], E.out);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<VaultBg glow={0.7} gy={800} />
			<StepTag n="03" label="REVIEW" at={tNum - 2} />
			<div style={{position: 'absolute', left: L.x, top: 278, display: 'flex', alignItems: 'center', gap: 20, opacity: head, transform: `translateY(${(1 - head) * 20}px)`}}>
				<div style={{fontSize: 52, fontWeight: 900, letterSpacing: -1, color: C.white}}>LAST 30 DAYS</div>
			</div>
			<ExampleTag style={{right: story.safe.right, top: 290, opacity: head}} />

			<Panel style={{left: L.x, top: PANEL.y, width: L.w, height: PANEL.h, opacity: panel, transform: `translateY(${(1 - panel) * 50}px)`}}>
				{ROWS.map((r, i) => {
					const grow = sp(frame, fps, t30 + i * 4, 'smooth');
					const trim = r.cut ? sp(frame, fps, trimAt(r.order), 'snappy') : 0;
					const cutW = (r.cut / MAX) * BAR_W;
					const fullW = (r.amount / MAX) * BAR_W * grow;
					const flow = r.cut ? kf(frame, [flowStart + r.order * 3, flowEnd], [0, 1], E.inOut) : 0;
					const shown = Math.round(r.amount - (landed || flow > 0.5 ? r.cut : 0));
					const top = PANEL.pad + i * PANEL.rowH;
					const isKeep = r.cut === 0;
					return (
						<div key={r.name} style={{position: 'absolute', left: 36, right: 36, top, height: PANEL.rowH}}>
							<div style={{position: 'absolute', left: 0, top: 10, fontSize: 36, fontWeight: 800, color: C.white}}>{r.name}</div>
							<div style={{position: 'absolute', right: 0, top: 10, fontSize: 36, fontWeight: 800, color: C.white, opacity: grow}}>{fmt(shown * Math.min(1, grow * 1.2))}</div>
							{/* note: the adjustment (or "keep") */}
							<div style={{position: 'absolute', left: 0, top: 58, fontSize: 26, fontWeight: 700, color: C.green, opacity: trim, transform: `translateX(${(1 - trim) * 20}px)`, whiteSpace: 'nowrap'}}>
								{r.note} <span style={{color: C.gray}}>· −{fmt(r.cut)}</span>
							</div>
							{isKeep && (
								<div style={{position: 'absolute', left: 0, top: 56, padding: '2px 12px', borderRadius: 10, border: `1.5px solid ${C.white}`, fontSize: 24, fontWeight: 900, letterSpacing: 2, color: C.white, opacity: keep, transform: `scale(${0.8 + 0.2 * keep})`, transformOrigin: '0 50%'}}>KEEP ✓</div>
							)}
							<div style={{position: 'absolute', left: 0, top: 104, width: BAR_W, height: 22, borderRadius: 11, background: C.track}} />
							<div style={{position: 'absolute', left: 0, top: 104, width: Math.max(0, fullW - (trim > 0 ? cutW : 0)), height: 22, borderRadius: 11, background: isKeep && keep > 0.5 ? C.white : 'rgba(255,255,255,0.55)'}} />
							{trim > 0 && flow < 1 && (
								<div
									style={{
										position: 'absolute',
										left: fullW - cutW + 4,
										top: 104,
										width: cutW - 4,
										height: 22,
										borderRadius: 11,
										background: C.green,
										boxShadow: '0 0 18px rgba(57,255,136,0.45)',
										transform: `translate(${mix(0, POT.x - L.x - 36 - (fullW - cutW / 2), flow)}px, ${mix(0, POT.y - PANEL.y - top - 104, flow) - Math.sin(flow * Math.PI) * 60}px) scale(${1 - 0.4 * flow})`,
										opacity: flow > 0.92 ? 0 : 1,
									}}
								/>
							)}
						</div>
					);
				})}
			</Panel>

			{/* savings pot */}
			<Panel glow={landed ? 0.7 : 0.2 * pot} style={{left: L.x, top: 1030, width: L.w, height: 96, opacity: pot, transform: `scale(${0.94 + 0.06 * pot})`}}>
				<div style={{position: 'absolute', left: 36, top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: 28, fontWeight: 800, letterSpacing: 3, color: C.gray}}>→ SAVINGS</div>
				<div style={{position: 'absolute', right: 36, top: 0, bottom: 0, display: 'flex', alignItems: 'center', gap: 8}}>
					<span style={{fontSize: 48, fontWeight: 900, color: C.green}}>+</span>
					<NumberCounter value={saved} fontSize={48} color={C.green} roll={false} />
					<span style={{fontSize: 30, fontWeight: 800, color: C.gray, marginLeft: 6}}>/ MONTH</span>
				</div>
			</Panel>

			<div style={{position: 'absolute', left: L.x, width: L.w, top: 1168, textAlign: 'center', lineHeight: 1.06}}>
				<div style={{fontSize: 68, fontWeight: 900, letterSpacing: -2, color: C.white, opacity: t1, transform: `translateY(${(1 - t1) * 22}px)`}}>SPEND INTENTIONALLY.</div>
				<div style={{fontSize: 68, fontWeight: 900, letterSpacing: -2, color: C.green, opacity: t2, transform: `translateY(${(1 - t2) * 22}px)`}}>SAVE CONSISTENTLY.</div>
			</div>

			<Sfx at={t30 + 2} name="whoosh-soft" volume={0.25} />
			<Sfx at={trimAt(0)} name="click" volume={0.25} />
			<Sfx at={trimAt(1)} name="click" volume={0.22} />
			<Sfx at={trimAt(2)} name="click" volume={0.22} />
			<Sfx at={flowEnd} name="coin" volume={0.32} />
		</AbsoluteFill>
	);
};
