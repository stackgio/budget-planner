import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {C, Check, ExampleTag, L, Panel, StepTag, VaultBg, WeekGrid, fmt} from '../ui';

export const GRID = {x: L.cx - 325, y: 660, cell: 56, gap: 10};
export const COUNTER_Y = 270;
const MILESTONES = [500, 1000, 2500, FACTS.year1.value, FACTS.goal.value];

/** "$100 / WEEK" chip, top-right — shared with the habit scene (match cut). */
export const RateChip: React.FC<{value: number; p: number; dim?: number; nudge?: number}> = ({value, p, dim = 0, nudge = 0}) => (
	<div
		style={{
			position: 'absolute',
			right: story.safe.right,
			top: 186,
			height: 60,
			padding: '0 24px',
			borderRadius: 999,
			display: 'flex',
			alignItems: 'center',
			gap: 10,
			background: dim > 0.5 ? 'rgba(255,255,255,0.06)' : C.greenSoft,
			border: `2px solid ${dim > 0.5 ? C.grayDim : C.green}`,
			opacity: p,
			transform: `translateX(${nudge}px) scale(${0.9 + 0.1 * p})`,
			transformOrigin: '100% 50%',
		}}
	>
		<NumberCounter value={value} fontSize={34} color={dim > 0.5 ? C.gray : C.green} roll={false} />
		<span style={{fontSize: 30, fontWeight: 800, color: C.white, letterSpacing: 2}}>/ WEEK</span>
	</div>
);

/**
 * STEP 01 — "Pick an amount you can actually afford to save."
 * A paycheck lands; a slider decides the savings slice (no income figure shown).
 * "$100 a week … $5,200 in one year … $10,000 in less than two years":
 * a 100-cell grid fills one $100 week at a time while the balance counts.
 */
export const AffordScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tNum = cue('L5', 'Number');
	const tPick = cue('L5', 'pick');
	const tAmount = cue('L5', 'amount');
	const tAfford = cue('L5', 'afford');
	const tSave = cue('L5', 'save');
	const tIf = cue('L6', 'If');
	const t100 = cue('L6', '$100');
	const t5200e = cue('L6', '$5,200', 0, 'end');
	const tYear = cue('L6', 'year');
	const tKeep = cue('L7', 'Keep');
	const t10ke = cue('L7', '$10,000', 0, 'end');
	const tLess = cue('L7', 'less');

	// ── phase A: paycheck + slider
	const aOut = kf(frame, [tIf - 8, tIf + 4], [0, 1], E.in);
	const pIn = sp(frame, fps, 0, 'smooth');
	const recv = kf(frame, [8, 26], [0, 1], E.out);
	const head = sp(frame, fps, tPick, 'snappy');
	const val = frame < tAmount ? 25 : kf(frame, [tAmount, tAfford, tSave + 8], [25, 160, FACTS.weekly.value], E.inOut);
	const share = val / 400;

	// ── phase B/C: weekly deposits
	const weeksRaw = frame < t100 ? 0 : frame < tKeep ? kf(frame, [t100, t5200e], [1, 52], E.inOut) : kf(frame, [tKeep, t10ke], [52, FACTS.weeksToGoal.value], E.inOut);
	const weeks = Math.floor(weeksRaw + 1e-6);
	const balance = weeks * FACTS.weekly.value;
	const bIn = sp(frame, fps, tIf, 'smooth');
	const chip = sp(frame, fps, tIf + 2, 'snappy');
	const yr = sp(frame, fps, tYear, 'snappy');
	const done = sp(frame, fps, tLess, 'snappy');

	const firstFrameAt = (w: number) => {
		for (let f = t100; f < t10ke + 2; f++) {
			const r = f < tKeep ? kf(f, [t100, t5200e], [1, 52], E.inOut) : kf(f, [tKeep, t10ke], [52, 100], E.inOut);
			if (Math.floor(r + 1e-6) >= w) return f;
		}
		return t10ke;
	};

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<VaultBg glow={0.6 + 0.6 * bIn} gy={900} />
			<StepTag n="01" label="SAVE" at={tNum - 2} />

			{/* ── phase A */}
			<div style={{opacity: 1 - aOut, transform: `translateY(${-aOut * 60}px)`}}>
				<div style={{position: 'absolute', left: L.x, top: 300, opacity: head, transform: `translateY(${(1 - head) * 26}px)`}}>
					<div style={{fontSize: 80, fontWeight: 900, letterSpacing: -2, lineHeight: 1.02, color: C.white}}>
						SAVE WHAT YOU
						<br />
						CAN <span style={{color: C.green}}>AFFORD</span>
					</div>
				</div>
				<Panel style={{left: L.x, top: 540, width: L.w, height: 560, opacity: pIn, transform: `translateY(${(1 - pIn) * 40}px)`}}>
					<div style={{position: 'absolute', left: 36, top: 38, width: 76, height: 76, borderRadius: 22, background: C.greenSoft, color: C.green, fontSize: 40, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>$</div>
					<div style={{position: 'absolute', left: 136, top: 38, fontSize: 38, fontWeight: 800, color: C.white}}>Paycheck</div>
					<div style={{position: 'absolute', left: 136, top: 86, fontSize: 26, fontWeight: 600, color: C.gray}}>Direct deposit · Today</div>
					<div style={{position: 'absolute', right: 32, top: 50, display: 'flex', alignItems: 'center', gap: 10, opacity: recv}}>
						<Check size={40} p={recv} />
						<span style={{fontSize: 26, fontWeight: 800, letterSpacing: 2, color: C.green}}>RECEIVED</span>
					</div>
					<div style={{position: 'absolute', left: 36, right: 36, top: 150, height: 1.5, background: C.line}} />
					<div style={{position: 'absolute', left: 36, top: 186, fontSize: 26, fontWeight: 700, letterSpacing: 3, color: C.gray}}>YOUR PAYCHECK</div>
					<div style={{position: 'absolute', left: 36, top: 236, width: 816, height: 72, borderRadius: 18, overflow: 'hidden', background: 'rgba(255,255,255,0.10)', display: 'flex'}}>
						<div style={{flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 24, fontSize: 26, fontWeight: 800, letterSpacing: 2, color: C.gray}}>BILLS + SPENDING</div>
						<div style={{width: 816 * share, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, letterSpacing: 2, color: C.bg, overflow: 'hidden'}}>
							{share > 0.16 ? 'SAVE' : ''}
						</div>
					</div>
					<div style={{position: 'absolute', left: 36, top: 380, fontSize: 26, fontWeight: 700, letterSpacing: 3, color: C.gray}}>SAVE PER WEEK</div>
					<div style={{position: 'absolute', right: 36, top: 352}}>
						<NumberCounter value={val} fontSize={64} color={C.green} roll={false} />
					</div>
					<div style={{position: 'absolute', left: 36, top: 470, width: 816, height: 12, borderRadius: 6, background: C.track}}>
						<div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 816 * (val / 200), borderRadius: 6, background: C.green}} />
						<div style={{position: 'absolute', left: 816 * (val / 200) - 24, top: -18, width: 48, height: 48, borderRadius: '50%', background: C.white, boxShadow: '0 6px 18px rgba(0,0,0,0.5)'}} />
					</div>
				</Panel>
				<div style={{position: 'absolute', left: L.x, top: 1134, fontSize: 26, fontWeight: 700, letterSpacing: 3, color: C.gray, opacity: head}}>ADJUST TO YOUR BUDGET</div>
				<ExampleTag style={{right: story.safe.right, top: 1126, opacity: head}} />
			</div>

			{/* ── phase B/C */}
			<RateChip value={FACTS.weekly.value} p={chip} />
			<div style={{position: 'absolute', left: L.x, width: L.w, top: COUNTER_Y, display: 'flex', justifyContent: 'center', opacity: bIn, transform: `translateY(${(1 - bIn) * 30}px)`}}>
				<NumberCounter value={balance} fontSize={170} color={C.green} roll={false} style={{letterSpacing: -4, textShadow: '0 0 50px rgba(57,255,136,0.22)'}} />
			</div>
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 494, display: 'flex', gap: 12, opacity: bIn}}>
				{MILESTONES.map((m, i) => {
					const hit = balance >= m;
					const pop = hit ? sp(frame, fps, firstFrameAt(m / 100), 'snappy') : 0;
					return (
						<div
							key={m}
							style={{
								flex: 1,
								height: 58,
								borderRadius: 16,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: 28,
								fontWeight: 900,
								color: hit ? C.bg : C.gray,
								background: hit ? C.green : 'rgba(255,255,255,0.04)',
								border: `1.5px solid ${hit ? C.green : C.line}`,
								transform: `scale(${1 + 0.08 * Math.sin(pop * Math.PI)})`,
							}}
							data-i={i}
						>
							{fmt(m)}
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: GRID.x, top: 594, opacity: bIn * (1 - done), fontSize: 30, fontWeight: 800, letterSpacing: 3, color: C.gray}}>
				WEEK <span style={{color: C.white}}>{weeks}</span>
			</div>
			<div style={{position: 'absolute', left: GRID.x, top: 594, opacity: done, transform: `translateY(${(1 - done) * 14}px)`, fontSize: 30, fontWeight: 900, letterSpacing: 2, color: C.white, whiteSpace: 'nowrap'}}>
				<span style={{color: C.green}}>{FACTS.weeksToGoal.value} WEEKS</span> TO {fmt(FACTS.goal.value)}
			</div>
			<div style={{position: 'absolute', right: story.width - (GRID.x + 650), top: 588, opacity: yr * (1 - done), transform: `scale(${0.9 + 0.1 * yr})`, transformOrigin: '100% 50%', padding: '4px 14px', borderRadius: 12, border: `1.5px solid ${C.green}`, fontSize: 28, fontWeight: 900, color: C.green, whiteSpace: 'nowrap'}}>
				YEAR 1 — {fmt(FACTS.year1.value)}
			</div>
			<div style={{position: 'absolute', right: story.width - (GRID.x + 650), top: 594, opacity: done, fontSize: 30, fontWeight: 800, letterSpacing: 2, color: C.gray}}>&lt; 2 YEARS</div>
			<div style={{opacity: bIn, transform: `translateY(${(1 - bIn) * 30}px)`}}>
				<WeekGrid {...GRID} filled={weeks} year2Tint={yr} />
			</div>
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 1328, textAlign: 'center', fontSize: 24, fontWeight: 700, letterSpacing: 2, color: C.gray, opacity: bIn}}>
				EXAMPLE · $0 START · NO INTEREST
			</div>

			<Sfx at={6} name="cash" volume={0.3} />
			<Sfx at={tSave + 8} name="click" volume={0.3} />
			{[5, 10, 25].map((w) => (
				<Sfx key={w} at={firstFrameAt(w)} name="tick" volume={0.22} />
			))}
			<Sfx at={t5200e + 2} name="coin" volume={0.35} />
			<Sfx at={t10ke + 2} name="chime" volume={0.35} />
		</AbsoluteFill>
	);
};
