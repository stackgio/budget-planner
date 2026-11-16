import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Camera} from '../../../story/components/Camera';
import {Sfx} from '../../../story/components/Chrome';
import {NumberCounter} from '../../../story/components/NumberCounter';
import {useCues} from '../../../story/lib/cues';
import {E, arc, kf, mix, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {FACTS} from '../facts';
import {C, L, VaultBg, fmt} from '../ui';

/** The $10,000 goal as ten $1,000 blocks (world coordinates, inside the camera). */
const N = FACTS.goal.value / FACTS.milestone.value; // 10
const ROW = {y: 1000, h: 130, gap: 12};
const BW = (L.w - (N - 1) * ROW.gap) / N;
const B1 = {x: L.x + BW / 2, y: ROW.y + ROW.h / 2}; // centre of block 1
const ZOOM = 2.35;

/**
 * HOOK — "Trying to save your first $10,000? Stop worrying about $10,000. Focus on your first $1,000."
 * Frame 0: "SAVE YOUR FIRST $10,000" (readable with sound off). Within the first second the
 * goal visibly splits into ten $1,000 blocks. "Stop" → $10,000 is knocked back to a small
 * GOAL chip and blocks 2–10 dim. "Focus" → the camera dives into block 1, which fills green
 * while the counter runs $0 → $1,000: the smaller-milestone strategy, shown, not told.
 */
export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tTen = cue('L1', '$10,000?');
	const tStop = cue('L2', 'Stop');
	const tWorry = cue('L2', 'worrying');
	const tFocus = cue('L3', 'Focus');
	const tFirst = cue('L3', 'first');
	const t1k = cue('L3', '$1,000');
	const t1kEnd = cue('L3', '$1,000', 0, 'end');

	// big $10,000: frame-0 readable → weighted beat on the spoken amount → knocked back to a chip
	const settle = kf(frame, [0, 14], [1.06, 1], E.out);
	const beat = 1 + 0.035 * Math.sin(Math.PI * kf(frame, [tTen, tTen + 10], [0, 1], E.out));
	const knock = sp(frame, fps, tStop, {damping: 15, stiffness: 140, mass: 0.9});
	const eject = Math.sin(Math.PI * kf(frame, [4, 26], [0, 1], E.out));
	const tenScale = settle * beat * (1 - 0.025 * eject) * mix(1, 0.24, knock);
	const tenY = mix(640, 262, knock);
	const kicker = 1 - kf(frame, [tStop - 2, tStop + 6], [0, 1], E.in);
	const goalTag = kf(frame, [tStop + 8, tStop + 16], [0, 1], E.out);

	// blocks build in during the first second
	// the ten $1,000 blocks peel out of the $10,000 and drop into their slots (first second)
	const blockIn = (i: number) => sp(frame, fps, 4 + i * 2, {damping: 14, stiffness: 150, mass: 0.8});
	const dimOthers = kf(frame, [tWorry, tWorry + 12], [0, 1], E.out);
	const b1Lit = kf(frame, [tWorry + 4, tWorry + 14], [0, 1], E.out);
	const splitLabel = kf(frame, [24, 34], [0, 1], E.out) * (1 - kf(frame, [tStop, tStop + 8], [0, 1], E.in));
	const fill = kf(frame, [tFirst, t1kEnd], [0, 1], E.inOut);
	const value = fill * FACTS.milestone.value;
	const lands = sp(frame, fps, t1kEnd, 'bouncy');
	const mileTag = sp(frame, fps, t1kEnd + 1, 'snappy');
	const counterIn = sp(frame, fps, tFirst - 4, 'snappy');

	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<VaultBg glow={0.6 + 0.9 * fill} gx={540} gy={mix(900, 960, fill)} />

			<Camera
				keys={[
					{at: 0, zoom: 1, x: 540, y: 960},
					{at: tStop, zoom: 1.03, x: 540, y: 960, ease: E.soft},
					{at: tStop + 22, zoom: 1.1, x: 516, y: 1000, ease: E.inOut},
					{at: tFocus - 3, zoom: 1.12, x: 516, y: 1010, ease: E.soft},
					{at: tFirst + 8, zoom: ZOOM, x: B1.x, y: B1.y, ease: E.inOut},
					{at: t1kEnd + 30, zoom: ZOOM * 0.96, x: B1.x + 6, y: B1.y},
				]}
			>
				{Array.from({length: N}, (_, i) => {
					const p = blockIn(i);
					const first = i === 0;
					const x = L.x + i * (BW + ROW.gap);
					const from: [number, number] = [L.cx + (i - 4.5) * 34, 640];
					const to: [number, number] = [x + BW / 2, ROW.y + ROW.h / 2];
					const [px, py] = arc(Math.min(1.04, Math.max(0, p)), from, to, 90);
					return (
						<div
							key={i}
							style={{
								position: 'absolute',
								left: x,
								top: ROW.y,
								width: BW,
								height: ROW.h,
								borderRadius: 16,
								overflow: 'hidden',
								background: 'rgba(255,255,255,0.05)',
								border: `2.5px solid ${first && b1Lit > 0.5 ? C.green : 'rgba(255,255,255,0.28)'}`,
								boxShadow: first ? `0 0 ${30 * (b1Lit + fill)}px rgba(57,255,136,${0.25 * b1Lit + 0.35 * fill})` : 'none',
								opacity: Math.min(1, p * 2.5) * (first ? 1 : 1 - 0.62 * dimOthers),
								transform: `translate(${px - to[0]}px, ${py - to[1]}px) scale(${0.35 + 0.65 * Math.min(1, p)}) rotate(${(1 - Math.min(1, p)) * (i - 4.5) * 4}deg)`,
							}}
						>
							{first && (
								<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: `${fill * 100}%`, background: `linear-gradient(180deg, ${C.green} 0%, #1FAE5C 100%)`}} />
							)}
						</div>
					);
				})}
				<div style={{position: 'absolute', left: L.x, top: ROW.y + ROW.h + 20, fontSize: 30, fontWeight: 800, color: C.gray, opacity: kf(frame, [22, 32], [0, 1])}}>$0</div>
				<div style={{position: 'absolute', right: story.safe.right, top: ROW.y + ROW.h + 20, fontSize: 30, fontWeight: 800, color: C.gray, opacity: kf(frame, [22, 32], [0, 1]) * (1 - dimOthers * 0.4)}}>{fmt(FACTS.goal.value)}</div>
				<div style={{position: 'absolute', left: L.x, width: L.w, top: ROW.y + ROW.h + 20, textAlign: 'center', fontSize: 34, fontWeight: 900, letterSpacing: 2, color: C.white, opacity: splitLabel}}>
					= 10 × <span style={{color: C.green}}>{fmt(FACTS.milestone.value)}</span>
				</div>
			</Camera>

			{/* screen-space type */}
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 430, textAlign: 'center', opacity: kicker}}>
				<div style={{fontSize: 44, fontWeight: 800, letterSpacing: 10, color: C.gray}}>SAVE YOUR FIRST</div>
			</div>
			<div
				style={{
					position: 'absolute',
					left: L.cx,
					top: tenY,
					transform: `translate(-50%, -50%) scale(${tenScale})`,
					fontSize: 210,
					fontWeight: 900,
					letterSpacing: -8,
					color: knock > 0.4 ? C.gray : C.white,
					whiteSpace: 'nowrap',
					fontVariantNumeric: 'tabular-nums',
				}}
			>
				{fmt(FACTS.goal.value)}
			</div>
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 206, textAlign: 'center', opacity: goalTag, fontSize: 26, fontWeight: 800, letterSpacing: 6, color: C.gray}}>GOAL</div>

			<div style={{position: 'absolute', left: L.x, width: L.w, top: 470, display: 'flex', justifyContent: 'center', opacity: counterIn, transform: `translateY(${(1 - counterIn) * 30}px) scale(${1 + 0.06 * Math.sin(Math.PI * Math.min(1, lands))})`}}>
				<NumberCounter value={value} fontSize={220} color={C.green} roll={false} style={{letterSpacing: -6, textShadow: `0 0 ${40 + 40 * lands}px rgba(57,255,136,0.3)`}} />
			</div>
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 410, textAlign: 'center', opacity: counterIn * (1 - kf(frame, [t1kEnd - 6, t1kEnd], [0, 1], E.in)), fontSize: 32, fontWeight: 800, letterSpacing: 7, color: C.gray}}>FOCUS ON</div>
			<div style={{position: 'absolute', left: L.x, width: L.w, top: 410, textAlign: 'center', opacity: mileTag, transform: `translateY(${(1 - mileTag) * 12}px)`, fontSize: 32, fontWeight: 900, letterSpacing: 6, color: C.white}}>
				MILESTONE <span style={{color: C.green}}>1</span> OF 10
			</div>

			<Sfx at={8} name="click" volume={0.16} />
			<Sfx at={tStop + 1} name="thud" volume={0.28} />
			<Sfx at={tFocus - 3} name="whoosh" volume={0.3} />
			<Sfx at={t1kEnd + 2} name="chime" volume={0.32} />
		</AbsoluteFill>
	);
};
