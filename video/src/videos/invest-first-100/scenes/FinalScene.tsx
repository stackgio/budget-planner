import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {BrandBug, Sfx} from '../../../story/components/Chrome';
import {Donut} from '../../../story/components/Donut';
import {Bill} from '../../../story/components/Money';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {arc, E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {PLAN, pct, RECURRING, recurringTotal, SHARES} from '../facts';

void recurringTotal;
import {dark as P, FUND} from '../look';
import {swapIn} from '../ui';

const DONUT = {size: 560, x: 260, y: 290};
const C = {x: DONUT.x + DONUT.size / 2, y: DONUT.y + DONUT.size / 2};
const ROWS = [
	{t: 'VTI', v: PLAN.vti.value, sh: SHARES.vti.value, c: FUND.vti.dark},
	{t: 'SCHD', v: PLAN.schd.value, sh: SHARES.schd.value, c: FUND.schd.dark},
	{t: 'VXUS', v: PLAN.vxus.value, sh: SHARES.vxus.value, c: FUND.vxus.dark},
];
const SLOTS = {x: 112, y: 960, w: 62, gap: 9};

/**
 * FINAL — "Now, $100 isn't going to make me rich overnight. But starting small
 * and investing consistently over the long term can make a difference."
 * The three strips become one portfolio (donut). Then the same $100 keeps
 * arriving month after month — contributions only, no invented returns.
 */
export const FinalScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const t100 = cue('L11', '$100');
	const tRich = cue('L11', 'rich');
	const tBut = cue('L12', 'But');
	const tStart = cue('L12', 'starting');
	const tTerm = cue('L12', 'term', 0, 'end');
	const tEnd = cue('L12', 'difference.', 0, 'end');

	const draw = ROWS.map((_, i) => kf(frame, [t100 - 6 + i * 9, t100 + 10 + i * 9], [0, 1], E.out));
	const total = kf(frame, [t100 - 6, t100 + 28], [0, PLAN.total.value], E.out);
	const legend = swapIn(frame, t100 + 4, tBut - 2, 40);
	const strike = kf(frame, [tRich + 4, tRich + 16], [0, 1], E.out);
	const richIn = sp(frame, fps, tRich - 4, 'snappy');
	const months = RECURRING.months.value;
	const step = (tTerm - tStart) / months;
	const monthAt = (m: number) => tStart + m * step;
	const done = Array.from({length: months}, (_, m) => frame >= monthAt(m) + 12).filter(Boolean).length;
	const contributed = Math.max(PLAN.total.value, done * RECURRING.monthly.value);
	const centre = frame >= tStart ? contributed : total;
	const rec = swapIn(frame, tBut, Infinity, 40);
	const lastBump = Math.max(0, ...Array.from({length: months}, (_, m) => (frame >= monthAt(m) + 12 ? monthAt(m) + 12 : 0)));
	const pulse = frame >= tStart ? 1 + 0.035 * Math.max(0, 1 - (frame - lastBump) / 8) : 1;
	const brand = kf(frame, [tEnd - 4, tEnd + 14], [0, 1], E.out);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={C.x} lightY={C.y} light={1.15} warm={false} />
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 6, fontSize: 30, fontWeight: 900, letterSpacing: 4, color: P.muted}}>MY FIRST $100 PORTFOLIO</div>

			<Donut
				size={DONUT.size}
				thickness={70}
				segs={ROWS.map((r, i) => ({value: r.v, color: r.c, draw: draw[i]}))}
				style={{left: DONUT.x, top: DONUT.y, transform: `scale(${pulse})`}}
			>
				<NumberCounter value={centre} roll={frame < tStart} fontSize={contributed >= 1000 ? 104 : 120} color={P.ink} style={{letterSpacing: -3}} />
				<div style={{fontSize: 30, fontWeight: 900, letterSpacing: 5, color: P.accent, marginTop: 4}}>INVESTED</div>
			</Donut>

			{/* "rich overnight" — struck out */}
			<div style={{position: 'absolute', left: 640, top: 300, transform: `rotate(-6deg) scale(${richIn})`, opacity: Math.min(1, richIn * 1.4) * (1 - kf(frame, [tBut, tBut + 8], [0, 1]))}}>
				<div style={{position: 'relative', background: P.paper, border: `2px solid ${P.line}`, borderRadius: 14, padding: '10px 18px', fontSize: 34, fontWeight: 900, color: P.body}}>
					RICH OVERNIGHT
					<div style={{position: 'absolute', left: 10, right: 10, top: '50%', height: 5, background: P.danger, transformOrigin: '0 50%', transform: `scaleX(${strike})`}} />
				</div>
			</div>

			{/* allocation legend with the fractional-share reality */}
			{legend.on && (
				<div style={{position: 'absolute', left: story.safe.left + 30, right: story.safe.right - 10, top: 920 + legend.y, opacity: legend.opacity}}>
					{ROWS.map((r) => (
						<div key={r.t} style={{display: 'flex', alignItems: 'center', height: 96, borderBottom: `2px solid ${P.line}`}}>
							<span style={{width: 26, height: 26, borderRadius: 7, background: r.c, marginRight: 24}} />
							<span style={{fontSize: 52, fontWeight: 900, color: P.ink, width: 200}}>{r.t}</span>
							<span style={{fontSize: 52, fontWeight: 900, color: r.c, width: 150}}>${r.v}</span>
							<span style={{fontSize: 40, fontWeight: 800, color: P.muted, width: 120}}>{pct(r.v)}%</span>
							<span style={{fontSize: 26, fontWeight: 800, color: P.body, marginLeft: 'auto'}}>≈{r.sh.toFixed(2)} share</span>
						</div>
					))}
					<div style={{fontSize: 24, fontWeight: 700, color: P.muted, marginTop: 18, lineHeight: 1.35}}>
						Fractional shares needed for exact amounts · prices: 11/03/2026 closes
					</div>
				</div>
			)}

			{/* recurring: the same $100, month after month */}
			{rec.on && (
				<div style={{position: 'absolute', inset: 0, opacity: rec.opacity, transform: `translateY(${rec.y}px)`}}>
					<div style={{position: 'absolute', left: SLOTS.x, top: SLOTS.y - 50, fontSize: 26, fontWeight: 900, letterSpacing: 3, color: P.muted}}>EXAMPLE · $100 EVERY MONTH</div>
					{Array.from({length: months}, (_, m) => {
						const on = frame >= monthAt(m) + 12;
						return (
							<div key={m} style={{position: 'absolute', left: SLOTS.x + m * (SLOTS.w + SLOTS.gap), top: SLOTS.y, width: SLOTS.w, height: 92, borderRadius: 14, border: `2px solid ${on ? P.accent : P.line}`, background: on ? 'rgba(44,212,122,0.18)' : 'transparent', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8, boxSizing: 'border-box'}}>
								<span style={{fontSize: 24, fontWeight: 900, color: on ? P.ink : P.muted}}>{m + 1}</span>
							</div>
						);
					})}
					{/* each month's bill travels from its slot into the portfolio */}
					{Array.from({length: months}, (_, m) => {
						const t = kf(frame, [monthAt(m), monthAt(m) + 12], [0, 1], E.inOut);
						if (t <= 0 || t >= 1) return null;
						const sx = SLOTS.x + m * (SLOTS.w + SLOTS.gap) + SLOTS.w / 2;
						const [x, y] = arc(t, [sx, SLOTS.y + 40], [C.x, C.y], 140);
						return <Bill key={m} w={120 - 50 * t} value="100" rot={-12 + 24 * t} style={{left: x, top: y, opacity: 1 - t * 0.6}} />;
					})}
					<div style={{position: 'absolute', left: SLOTS.x, top: 1100, display: 'flex', alignItems: 'baseline', gap: 20}}>
						<span style={{fontSize: 92, fontWeight: 900, color: P.accent, letterSpacing: -2}}>{Math.max(1, done)}</span>
						<span style={{fontSize: 44, fontWeight: 900, color: P.ink}}>{Math.max(1, done) === 1 ? 'MONTH' : 'MONTHS'} × ${RECURRING.monthly.value}</span>
					</div>
					<div style={{position: 'absolute', left: SLOTS.x, right: story.safe.right, top: 1240, fontSize: 24, fontWeight: 700, color: P.muted}}>
						Contributions only — no returns shown or promised.
					</div>
				</div>
			)}

			<BrandBug palette={P} opacity={brand} style={{left: 0, right: 0, justifyContent: 'center', top: 1312}} />

			<Sfx at={t100 - 6} name="whoosh-soft" volume={0.35} />
			<Sfx at={t100 + 4} name="chime" volume={0.3} />
			<Sfx at={tRich + 4} name="stamp" volume={0.3} />
			{Array.from({length: months}, (_, m) => (m % 3 === 0 ? <Sfx key={m} at={monthAt(m) + 10} name="cash" volume={0.22} /> : null))}
			<Sfx at={tEnd} name="chime" volume={0.3} />
		</AbsoluteFill>
	);
};
