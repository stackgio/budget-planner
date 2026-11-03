import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {EditorialBg} from '../../../story/components/Backgrounds';
import {Sfx} from '../../../story/components/Chrome';
import {Marcus} from '../../../story/components/Marcus';
import {useCues} from '../../../story/lib/cues';
import {arc, kf, E, mix, shake, sp} from '../../../story/lib/motion';
import {editorial as P, story} from '../../../story/theme';
import {CHASE_YEARLY, FACTS} from '../facts';

export const SLOT = {y: 850, w: 228, h: 270, gap: 24};
export const slotX = (i: number) => story.safe.left + i * (SLOT.w + SLOT.gap);
export const HOOK_CARD3 = {x: slotX(0) + SLOT.w / 2, y: SLOT.y + SLOT.h / 2};

/**
 * COLD OPEN — spoken: "$180 a year if you can't avoid the fee."
 * Frame 0: "ONE OF THESE BANKS COULD COST YOU $180/YEAR IN CHECKING FEES" fully readable.
 * On "if you can't avoid": POTENTIAL tag + the 3 · 2 · 1 ranking cards rise;
 * on "fee" the $180 shrinks and lands on card #3 (Chase), where the next scene opens.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tIf = cue('L1', 'if');
	const tYear = cue('L1', 'year');
	const per = sp(frame, fps, tYear - 2, 'snappy');
	const tAvoid = cue('L1', 'avoid');
	const tFee = cue('L1', 'fee');

	const hit = kf(frame, [0, 10], [1.06, 1], E.out);
	const imp = shake(frame, 2, 8, 12);
	const tag = sp(frame, fps, tIf - 2, 'snappy');
	const cards = [0, 1, 2].map((i) => sp(frame, fps, tYear + 4 + i * 3, 'bouncy'));
	const fly = sp(frame, fps, tAvoid + 2, {damping: 20, stiffness: 110, mass: 0.9});
	const [nx, ny] = arc(fly, [story.safe.left, 372], [slotX(0) + 30, SLOT.y + 168], -60);
	const nfs = mix(250, 64, fly);
	const land = sp(frame, fps, tFee + 4, 'heavy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<EditorialBg />
			<div style={{position: 'absolute', left: story.safe.left, top: story.safe.top + 10, right: story.safe.right, fontSize: 64, fontWeight: 900, lineHeight: 1.05, color: P.ink, letterSpacing: -1}}>
				ONE OF THESE BANKS
				<br />
				COULD COST YOU
			</div>

			{/* the $180 — on screen from frame 0, then carried into card #3 */}
			<div style={{position: 'absolute', left: nx + imp.x, top: ny + imp.y, display: 'flex', alignItems: 'baseline', gap: 14 * (1 - fly), transform: `scale(${hit})`, transformOrigin: '0 50%', zIndex: 5}}>
				<span style={{fontSize: nfs, fontWeight: 900, color: P.danger, letterSpacing: -nfs * 0.04, lineHeight: 1}}>${CHASE_YEARLY}</span>
				<span style={{fontSize: mix(64, 26, fly), fontWeight: 900, color: P.danger}}>/yr</span>
			</div>
			<div style={{position: 'absolute', left: story.safe.left, top: 640, fontSize: 52, fontWeight: 900, color: P.ink, opacity: 1 - fly}}>IN CHECKING FEES</div>
			<div style={{position: 'absolute', left: story.safe.left, top: 704, fontSize: 40, fontWeight: 900, color: P.muted, opacity: per * (1 - fly), transform: `translateX(${(1 - per) * -30}px)`}}>
				= ${FACTS.chaseFee.value}/MONTH × {FACTS.months.value}
			</div>
			<div
				style={{
					position: 'absolute',
					left: story.safe.left,
					top: 770,
					padding: '8px 16px',
					borderRadius: 12,
					border: `3px solid ${P.muted}`,
					color: P.body,
					fontSize: 24,
					fontWeight: 900,
					letterSpacing: 3,
					opacity: tag * (1 - fly),
					transform: `translateY(${(1 - tag) * 14}px)`,
				}}
			>
				POTENTIAL · IF NOT WAIVED
			</div>

			{[0, 1, 2].map((i) => {
				const p = cards[i];
				const first = i === 0;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: slotX(i),
							top: SLOT.y + (1 - p) * 140 - (first ? 14 * land : 0),
							width: SLOT.w,
							height: SLOT.h,
							borderRadius: 28,
							background: first ? '#FFFDF8' : '#1B1E23',
							border: `4px solid ${first ? (land > 0.3 ? P.danger : P.line) : '#1B1E23'}`,
							boxShadow: `0 26px 50px ${P.shadow}`,
							opacity: Math.min(1, p * 1.4),
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							paddingTop: 24,
							boxSizing: 'border-box',
						}}
					>
						<div style={{fontSize: 26, fontWeight: 900, letterSpacing: 4, color: first ? P.muted : '#7C828B'}}>NUMBER</div>
						<div style={{fontSize: 130, fontWeight: 900, lineHeight: 1, color: first ? P.ink : '#F5F2EA', letterSpacing: -4}}>{3 - i}</div>
					</div>
				);
			})}

			<Marcus
				x={918}
				y={story.ground}
				scale={0.82}
				facing={-1}
				seed={4}
				track={[
					{at: -10, pose: 'shock', face: 'shock'},
					{at: tYear, pose: 'worried', face: 'worried'},
					{at: tIf + 6, pose: 'think', face: 'focused'},
					{at: tFee, pose: ['point', {head: -4}], face: 'determined', spring: 'bouncy'},
				]}
			/>
			<Sfx at={1} name="thud" volume={0.35} />
			<Sfx at={tIf + 2} name="card" volume={0.3} />
			<Sfx at={tFee + 4} name="stamp" volume={0.3} />
		</AbsoluteFill>
	);
};
