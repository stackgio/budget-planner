import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {C, GoalBar, L, VaultBg} from '../ui';

const BAR_Y = 1150;

/**
 * HOOK — "Trying to save your first $10,000? Stop worrying about $10,000. Focus on your first $1,000."
 * Frame 0: "SAVE YOUR FIRST $10,000" fills the screen (readable with sound off).
 * "Stop" → the number recedes in depth, then shrinks into the far end of a goal bar.
 * "$1,000" → the first milestone lands in green and the bar fills its first 10%.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tStop = cue('L2', 'Stop');
	const tAbout = cue('L2', 'about');
	const tFocus = cue('L3', 'Focus');
	const tFirst = cue('L3', 'first');
	const t1k = cue('L3', '$1,000');

	// $10,000: settle → slow push → recede in depth → fly into the bar's end label
	const settle = kf(frame, [0, 16], [1.05, 1], E.out);
	const push = kf(frame, [0, tStop], [1, 1.04], E.soft);
	const recede = sp(frame, fps, tStop, 'smooth');
	const toBar = sp(frame, fps, tFocus - 6, {damping: 200, stiffness: 70, mass: 1});
	const from = {x: L.cx, y: 740, s: settle * push * (1 - 0.42 * recede)};
	const ry = mix(740, 600, recede);
	const endLabel = {x: L.x + L.w - 58, y: BAR_Y + 30 + 16 + 20, s: 30 / 210};
	const nx = mix(from.x, endLabel.x, toBar);
	const ny = mix(ry, endLabel.y, toBar);
	const ns = mix(from.s, endLabel.s, toBar);
	const tenOpacity = (1 - 0.6 * recede + 0.6 * toBar) * (toBar > 0.97 ? 0 : 1);
	const tenGray = recede;

	const kicker = 1 - kf(frame, [tStop, tStop + 10], [0, 1], E.in);

	// bar
	const barReveal = kf(frame, [tAbout, tAbout + 20], [0, 1], E.out);
	const fill = 0.1 * sp(frame, fps, t1k, 'smooth');
	const mile = kf(frame, [t1k + 6, t1k + 16], [0, 1], E.out);

	// $1,000 lands
	const land = sp(frame, fps, tFirst + 2, 'heavy');
	const tag = sp(frame, fps, tFocus + 2, 'snappy');
	const pct = sp(frame, fps, t1k + 14, 'snappy');
	const glow = 0.6 + 0.8 * land;

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<VaultBg glow={glow} gy={720} />

			{/* frame-0 kicker */}
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 520, textAlign: 'center', opacity: kicker}}>
				<div style={{fontSize: 44, fontWeight: 800, letterSpacing: 10, color: C.gray}}>SAVE YOUR FIRST</div>
			</div>

			{/* the overwhelming goal */}
			<div
				style={{
					position: 'absolute',
					left: nx,
					top: ny,
					transform: `translate(-50%, -50%) scale(${ns})`,
					fontSize: 210,
					fontWeight: 900,
					letterSpacing: -8,
					color: tenGray > 0.5 ? C.gray : C.white,
					opacity: tenOpacity,
					filter: `blur(${4 * recede * (1 - toBar)}px)`,
					whiteSpace: 'nowrap',
					fontVariantNumeric: 'tabular-nums',
				}}
			>
				$10,000
			</div>

			{/* the approachable milestone */}
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 470, display: 'flex', justifyContent: 'center', opacity: tag}}>
				<div style={{fontSize: 34, fontWeight: 800, letterSpacing: 8, color: C.gray, transform: `translateY(${(1 - tag) * 20}px)`}}>FOCUS ON YOUR FIRST</div>
			</div>
			<div
				style={{
					position: 'absolute',
					left: L.x,
					width: L.w,
					top: 540,
					display: 'flex',
					justifyContent: 'center',
					opacity: Math.min(1, land * 1.4),
					transform: `translateY(${(1 - land) * 80}px) scale(${0.9 + 0.1 * land})`,
				}}
			>
				<NumberCounter value={FACTS.milestone.value} fontSize={230} color={C.green} style={{letterSpacing: -6, textShadow: '0 0 60px rgba(57,255,136,0.25)'}} />
			</div>
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 830, textAlign: 'center', opacity: pct, transform: `translateY(${(1 - pct) * 16}px)`}}>
				<div style={{fontSize: 34, fontWeight: 800, letterSpacing: 4, color: C.white}}>
					<span style={{color: C.green}}>10%</span> OF THE GOAL
				</div>
			</div>

			<GoalBar y={BAR_Y} fill={fill} reveal={barReveal} labels={barReveal} endLabel={toBar > 0.97 ? 1 : 0} mile={mile} />

			<Sfx at={tStop + 2} name="whoosh-soft" volume={0.3} />
			<Sfx at={tFocus - 4} name="whoosh" volume={0.25} />
			<Sfx at={t1k + 18} name="chime" volume={0.3} />
		</AbsoluteFill>
	);
};
