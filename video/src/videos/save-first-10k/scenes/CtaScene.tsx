import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {Bookmark, Brand, C, GoalBar, L, Panel, VaultBg, fmt} from '../ui';
import {BIG} from './PayoffScene';

/**
 * CTA — "Save this video and start working toward your first $1,000."
 * Match cut from the completed bar: the full goal stays as a faint layer, the fill
 * returns to the first 10% — FIRST MILESTONE: $1,000. A "SAVE THIS PLAN" bookmark
 * fills on "Save", and the frame settles on STACK WITH GIO.
 */
export const CtaScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tSave = cue('L21', 'Save');
	const tStart = cue('L21', 'start');
	const tWorking = cue('L21', 'working');
	const tFirst = cue('L21', 'first');

	const lift = sp(frame, fps, 2, 'smooth');
	const label = sp(frame, fps, 4, 'snappy');
	const reset = sp(frame, fps, tStart - 2, 'smooth');
	const fill = mix(1, FACTS.milestone.value / FACTS.goal.value, reset);
	const mile = kf(frame, [tFirst - 4, tFirst + 8], [0, 1], E.out);
	const btn = sp(frame, fps, tSave - 6, 'bouncy');
	const press = kf(frame, [tSave + 4, tSave + 8, tSave + 16], [0, 1, 0], E.inOut);
	const bm = kf(frame, [tSave + 6, tSave + 20], [0, 1], E.out);
	const brand = sp(frame, fps, tWorking, 'smooth');
	const fs = mix(BIG.counterFs, 170, lift);

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<VaultBg glow={1.1 - 0.4 * reset} gy={BIG.barY} />
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 228, textAlign: 'center', opacity: label, transform: `translateY(${(1 - label) * 16}px)`}}>
				<div style={{fontSize: 38, fontWeight: 800, letterSpacing: 8, color: C.gray}}>YOUR FIRST</div>
			</div>
			<div style={{position: 'absolute', left: L.x, width: L.w, top: mix(BIG.counterY, 300, lift), display: 'flex', justifyContent: 'center'}}>
				<NumberCounter value={FACTS.goal.value} fontSize={fs} color={reset > 0.5 ? C.white : C.green} roll={false} style={{letterSpacing: -5}} />
			</div>

			<GoalBar
				y={BIG.barY}
				h={BIG.barH}
				fill={fill}
				ghost={reset}
				segments
				done={1 - reset}
				mile={mile}
				mileLabel={
					<span>
						FIRST MILESTONE: <span style={{color: mile > 0.5 ? C.green : C.white}}>{fmt(FACTS.milestone.value)}</span>
					</span>
				}
			/>

			<Panel
				glow={bm}
				style={{
					left: L.cx - 290,
					top: 930,
					width: 580,
					height: 130,
					borderRadius: 65,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 26,
					opacity: Math.min(1, btn * 1.4),
					transform: `translateY(${(1 - btn) * 50}px) scale(${(0.92 + 0.08 * btn) * (1 - 0.05 * press)})`,
				}}
			>
				<Bookmark size={44} fill={bm} />
				<div style={{fontSize: 44, fontWeight: 900, letterSpacing: 3, color: C.white}}>SAVE THIS PLAN</div>
			</Panel>

			<Brand size={36} style={{left: L.x, width: L.w, justifyContent: 'center', top: 1186, opacity: brand, transform: `translateY(${(1 - brand) * 20}px)`}} />

			<Sfx at={tSave + 6} name="click" volume={0.35} />
			<Sfx at={cue('L21', undefined, 0.1, 'end')} name="chime" volume={0.25} />
		</AbsoluteFill>
	);
};
