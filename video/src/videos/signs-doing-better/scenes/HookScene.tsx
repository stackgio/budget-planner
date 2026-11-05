import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {CinematicBg} from '../../../story/components/Backgrounds';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {E, kf, mix, prog, sp} from '../../../story/lib/motion';
import {cinematic as P, story} from '../../../story/theme';

const BAR = {x: 400, y: 980, w: 600, h: 46};

/**
 * HOOK — question on frame 0. Feel: "that's me" (Marcus worried at a short
 * progress bar), then relief: the bar reveals hidden progress.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tFin = cue('L1', 'financially');
	const tDoing = cue('L2', 'doing');
	const tBetter = cue('L2', 'better');
	const tThink = cue('L2', 'think');

	const thinkP = 0.2;
	const realP = 0.64;
	const fill = mix(thinkP * prog(frame, -30, 30, E.out) + 0.0, realP, prog(frame, tBetter - 2, 22, E.inOut));
	const youThink = kf(frame, [0, 1, tBetter + 4, tBetter + 14], [1, 1, 1, 0.45]);
	const actually = sp(frame, fps, tBetter + 10, 'bouncy');
	const qPulse = 1 + 0.06 * Math.sin(frame / 5) * (1 - prog(frame, tDoing - 8, 8));

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<CinematicBg lightX={560} lightY={1000} floorY={story.ground} />
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 20, top: 300}}>
				<KineticText text="BEHIND FINANCIALLY?" at={-14} mode="none" exitAt={tDoing - 8} fontSize={118} color={P.ink} colors={{behind: P.danger}} lineHeight={1.0} />
			</div>
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right - 20, top: 300}}>
				<KineticText text="DOING BETTER THAN YOU THINK" at={tDoing} fontSize={108} color={P.ink} colors={{better: P.accent}} stagger={3} lineHeight={1.0} />
			</div>

			<Camera
				keys={[
					{at: 0, zoom: 1},
					{at: tBetter, zoom: 1},
					{at: tBetter + 20, zoom: 1.05, x: 620, y: 1060, ease: E.out},
				]}
			>
				{/* money progress graphic */}
				<div style={{position: 'absolute', left: BAR.x, width: BAR.w, textAlign: 'right', top: BAR.y - 70, fontSize: 30, fontWeight: 800, letterSpacing: 4, color: P.muted}}>MONEY PROGRESS</div>
				<div style={{position: 'absolute', left: BAR.x, top: BAR.y, width: BAR.w, height: BAR.h, borderRadius: BAR.h / 2, background: P.line}}>
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							bottom: 0,
							width: Math.max(BAR.h, fill * BAR.w),
							borderRadius: BAR.h / 2,
							background: `linear-gradient(90deg, ${P.accentDeep}, ${P.accent})`,
						}}
					/>
					{/* "you think" tick */}
					<div style={{position: 'absolute', left: thinkP * BAR.w - 2, top: -16, width: 4, height: BAR.h + 32, background: P.ink, opacity: youThink}} />
					<div style={{position: 'absolute', left: thinkP * BAR.w - 70, top: BAR.h + 24, width: 140, textAlign: 'center', fontSize: 28, fontWeight: 900, letterSpacing: 2, color: P.body, opacity: youThink}}>
						YOU THINK
					</div>
					{/* "actually" tick */}
					<div style={{position: 'absolute', left: realP * BAR.w - 2, top: -16, width: 4, height: (BAR.h + 32) * actually, background: P.accent}} />
					<div
						style={{
							position: 'absolute',
							left: realP * BAR.w - 90,
							top: BAR.h + 24,
							width: 180,
							textAlign: 'center',
							fontSize: 28,
							fontWeight: 900,
							letterSpacing: 2,
							color: P.accent,
							opacity: Math.min(1, actually * 1.4),
							transform: `scale(${0.6 + 0.4 * actually})`,
						}}
					>
						ACTUALLY
					</div>
				</div>
				{/* worried question mark over Marcus */}
				<div
					style={{
						position: 'absolute',
						left: 210,
						top: 760,
						fontSize: 120,
						fontWeight: 900,
						color: P.danger,
						opacity: kf(frame, [tDoing - 8, tDoing], [1, 0]),
						transform: `scale(${qPulse}) rotate(-8deg)`,
					}}
				>
					?
				</div>
				<Marcus
					x={240}
					y={story.ground}
					scale={1.08}
					facing={1}
					seed={3}
					onDark
					track={[
						{at: -20, pose: ['worried', {head: 8}], face: 'worried'},
						{at: tFin, pose: ['shrug', {head: 6}], face: 'worried', spring: 'limb'},
						{at: tBetter - 2, pose: 'shock', face: 'shock', spring: 'bouncy'},
						{at: tThink - 2, pose: ['point', {head: -6}], face: 'joy', spring: 'snappy'},
					]}
				/>
			</Camera>
			<Sfx at={tDoing - 4} name="whoosh-soft" volume={0.35} />
			<Sfx at={tBetter + 10} name="pop" volume={0.35} />
		</AbsoluteFill>
	);
};
