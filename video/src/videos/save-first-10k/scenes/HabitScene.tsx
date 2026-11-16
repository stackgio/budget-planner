import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, shake, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {C, ExampleTag, L, StepTag, VaultBg, WeekGrid, fmt} from '../ui';
import {COUNTER_Y, GRID, RateChip} from './AffordScene';

const BASE = 1090;
const MAXH = 440;
const N = FACTS.weeksPerYear.value; // 52 weeks
const BW = (L.w - (N - 1) * 4) / N;
const yOf = (v: number) => BASE - (v / FACTS.smallYear1.value) * MAXH;

/**
 * "Can't afford $100? Start with $25. The important thing is building the habit."
 * Match cut from the $100 grid: the chip drops to $25, the grid folds away and a
 * year of small, steady deposits builds — crossing $1,000 at week 40, $1,300 by week 52.
 * (Never implies $25/week reaches $10,000 on the same timeline.)
 */
export const HabitScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tCant = cue('L8', "Can't");
	const t100 = cue('L8', '$100');
	const tStart = cue('L9', 'Start');
	const t25 = cue('L9', '$25');
	const tImp = cue('L10', 'important');
	const tHabit = cue('L10', 'habit');

	const dim = kf(frame, [tCant, tCant + 10], [0, 1], E.out);
	const collapse = kf(frame, [tStart - 4, tStart + 14], [0, 1], E.in);
	const oldOut = kf(frame, [tStart - 4, tStart + 6], [0, 1], E.in);
	const nudge = shake(frame, t100 + 2, 10, 14).x;
	const rate = frame < t25 ? FACTS.weekly.value : FACTS.smallWeekly.value;

	const bars = Math.floor(kf(frame, [t25 + 4, tHabit], [0, N], E.soft) + 1e-6);
	const total = bars * FACTS.smallWeekly.value;
	const chartIn = sp(frame, fps, t25, 'smooth');
	const hit1k = bars >= FACTS.smallWeeksTo1k.value;
	let hitAt = tHabit;
	for (let f = t25 + 4; f <= tHabit; f++) if (Math.floor(kf(f, [t25 + 4, tHabit], [0, N], E.soft) + 1e-6) >= FACTS.smallWeeksTo1k.value) { hitAt = f; break; }
	const mk = hit1k ? sp(frame, fps, hitAt, 'snappy') : 0;
	const l1 = sp(frame, fps, tImp, 'snappy');
	const l2 = sp(frame, fps, tImp + 6, 'snappy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<VaultBg glow={0.8} gy={900} />
			<StepTag n="01" label="SAVE" at={-30} />
			<RateChip value={rate} p={1} dim={frame >= t100 && frame < t25 ? 1 : 0} nudge={nudge} />

			{/* the $100 plan, fading back */}
			<div style={{position: 'absolute', left: L.x, width: L.w, top: COUNTER_Y, display: 'flex', justifyContent: 'center', opacity: (1 - 0.55 * dim) * (1 - oldOut)}}>
				<NumberCounter value={FACTS.goal.value} fontSize={170} color={dim > 0.5 ? C.gray : C.green} roll={false} style={{letterSpacing: -4}} />
			</div>
			<WeekGrid {...GRID} filled={100} year2Tint={1} dim={dim} collapse={collapse} />

			{/* $25 a week: one year of steady deposits */}
			<div style={{position: 'absolute', left: L.x, width: L.w, top: COUNTER_Y + 10, display: 'flex', justifyContent: 'center', opacity: chartIn, transform: `translateY(${(1 - chartIn) * 26}px)`}}>
				<NumberCounter value={total} fontSize={150} color={C.green} roll={false} style={{letterSpacing: -4}} />
			</div>
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 452, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18, opacity: chartIn}}>
				<div style={{fontSize: 28, fontWeight: 800, letterSpacing: 3, color: C.gray}}>
					WEEK <span style={{color: C.white}}>{bars}</span> · {fmt(FACTS.smallWeekly.value)} / WEEK
				</div>
				<ExampleTag style={{position: 'relative'}} />
			</div>
			<div style={{position: 'absolute', left: 0, top: 0, opacity: chartIn}}>
				{/* $1,000 line */}
				<div style={{position: 'absolute', left: L.x, width: L.w, top: yOf(FACTS.milestone.value), borderTop: `2.5px dashed ${hit1k ? C.green : C.grayDim}`}} />
				<div style={{position: 'absolute', left: L.x, top: yOf(FACTS.milestone.value) - 46, fontSize: 28, fontWeight: 900, color: hit1k ? C.green : C.gray}}>{fmt(FACTS.milestone.value)}</div>
				{Array.from({length: N}, (_, i) => {
					const on = i < bars;
					const v = (i + 1) * FACTS.smallWeekly.value;
					const h = BASE - yOf(v);
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: L.x + i * (BW + 4),
								top: BASE - h,
								width: BW,
								height: h,
								borderRadius: 4,
								background: on ? (v >= FACTS.milestone.value ? C.green : 'rgba(57,255,136,0.6)') : 'rgba(255,255,255,0.05)',
								transform: `scaleY(${on ? 1 : 0.0})`,
								transformOrigin: '50% 100%',
							}}
						/>
					);
				})}
				<div style={{position: 'absolute', left: L.x, width: L.w, top: BASE + 2, height: 2, background: C.line}} />
				{/* week 40 marker */}
				<div
					style={{
						position: 'absolute',
						left: L.x + (FACTS.smallWeeksTo1k.value - 1) * (BW + 4) + BW / 2 - 110,
						top: yOf(FACTS.milestone.value) - 116,
						width: 220,
						textAlign: 'center',
						opacity: mk,
						transform: `translateY(${(1 - mk) * 14}px)`,
					}}
				>
					<div style={{display: 'inline-block', padding: '6px 16px', borderRadius: 12, background: C.green, color: C.bg, fontSize: 26, fontWeight: 900, letterSpacing: 1}}>WEEK {FACTS.smallWeeksTo1k.value}</div>
				</div>
			</div>

			<div style={{position: 'absolute', left: L.x, width: L.w, top: 1150, textAlign: 'center', lineHeight: 1.04}}>
				<div style={{fontSize: 76, fontWeight: 900, letterSpacing: -2, color: C.green, opacity: l1, transform: `translateY(${(1 - l1) * 24}px)`}}>CONSISTENCY</div>
				<div style={{fontSize: 76, fontWeight: 900, letterSpacing: -2, color: C.white, opacity: l2, transform: `translateY(${(1 - l2) * 24}px)`}}>&gt; PERFECTION</div>
			</div>

			<Sfx at={tStart - 2} name="whoosh-soft" volume={0.28} />
			<Sfx at={hitAt} name="coin" volume={0.3} />
			<Sfx at={tImp + 2} name="pop" volume={0.25} />
		</AbsoluteFill>
	);
};
