import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Sfx} from '../../../story/components/Chrome';
import {KineticText} from '../../../story/components/KineticText';
import {useCues} from '../../../story/lib/cues';
import {E, kf, sp} from '../../../story/lib/motion';
import {story} from '../../../story/theme';
import {C, NewsBg} from '../ui';

/**
 * RISK — "I know that just because a stock drops doesn't mean it's a bargain. /
 * It could fall even further, but I'm sticking to my long-term investing plan."
 * Two HYPOTHETICAL paths (no axes, no numbers, no data) labelled SCENARIOS — NOT PREDICTIONS.
 */
export const RiskScene: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const {cue} = useCues();
	const tDrops = cue('L13', 'drops');
	const tBarg = cue('L13', 'bargain.');
	const tFall = cue('L14', 'fall');
	const tStick = cue('L14', 'sticking');
	const tPlan = cue('L14', 'long-term');

	const head = sp(frame, fps, tDrops - 4, 'snappy');
	const drop = kf(frame, [0, tDrops + 10], [0, 1], E.inOut);
	const red = kf(frame, [tFall - 4, tFall + 22], [0, 1], E.inOut);
	const green = kf(frame, [tFall + 8, tFall + 34], [0, 1], E.inOut);
	const dim = kf(frame, [tStick - 4, tStick + 10], [1, 0.38]);
	const plan = sp(frame, fps, tStick - 2, 'bouncy');
	const planGlow = kf(frame, [tPlan, tPlan + 8, tPlan + 26], [0, 1, 0.4], E.out);
	const T = {x: 380, y: 830}; // "today"
	const pathStyle = (p: number, color: string) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p, stroke: color, strokeWidth: 10, fill: 'none', strokeLinecap: 'round' as const});
	return (
		<AbsoluteFill style={{fontFamily: story.font}}>
			<NewsBg lightY={860} light={0.8} />
			<div style={{position: 'absolute', left: story.safe.left, top: 246, padding: '8px 18px', borderRadius: 999, border: `2px solid ${C.ink}`, fontSize: 26, fontWeight: 800, letterSpacing: 3, color: C.ink}}>
				SCENARIOS — NOT PREDICTIONS
			</div>
			<div style={{position: 'absolute', left: story.safe.left, right: story.safe.right, top: 330, opacity: head}}>
				<KineticText text="A DIP IS NOT" at={tDrops - 4} fontSize={76} color={C.ink} colors={{NOT: C.red}} />
				<KineticText text="A GUARANTEE." at={tBarg - 10} fontSize={76} color={C.ink} />
			</div>

			<svg width={story.width} height={story.height} style={{position: 'absolute', inset: 0, opacity: dim}}>
				{/* the drop so far (illustrative) */}
				<path d={`M90 610 C 180 620 230 670 280 730 S ${T.x - 40} ${T.y - 10} ${T.x} ${T.y}`} {...pathStyle(drop, C.muted)} />
				<circle cx={T.x} cy={T.y} r={14} fill={C.ink} opacity={drop} />
				<text x={T.x - 60} y={T.y + 62} fill={C.body} fontSize={26} fontWeight={800} letterSpacing={2} opacity={drop}>TODAY</text>
				{/* scenario A: falls further */}
				<path d={`M${T.x} ${T.y} C 520 870 640 980 900 1090`} {...pathStyle(red, C.red)} />
				<text x={640} y={1150} fill={C.red} fontSize={30} fontWeight={900} letterSpacing={2} opacity={red}>FALLS FURTHER</text>
				{/* scenario B: recovers later */}
				<path d={`M${T.x} ${T.y} C 520 950 640 870 700 790 S 820 610 930 570`} {...pathStyle(green, C.green)} />
				<text x={960} y={540} textAnchor="end" fill={C.green} fontSize={30} fontWeight={900} letterSpacing={2} opacity={green}>RECOVERS LATER</text>
			</svg>
			<div style={{position: 'absolute', left: story.safe.left, top: 1110, fontSize: 24, fontWeight: 700, letterSpacing: 2, color: C.muted, opacity: drop * dim}}>
				ILLUSTRATION · NOT REAL DATA
			</div>

			<div
				style={{
					position: 'absolute',
					left: story.safe.left,
					top: 1170,
					padding: '22px 36px',
					borderRadius: 26,
					background: C.green,
					color: C.bg,
					fontSize: 58,
					fontWeight: 900,
					letterSpacing: 1,
					opacity: plan,
					transform: `translateY(${(1 - plan) * 40}px) scale(${0.9 + 0.1 * plan})`,
					boxShadow: `0 0 ${70 * planGlow}px rgba(57,255,136,${0.5 * planGlow})`,
				}}
			>
				MY LONG-TERM PLAN
			</div>
			<Sfx at={tFall - 4} name="whoosh-soft" volume={0.18} />
			<Sfx at={tStick - 2} name="stamp" volume={0.2} />
		</AbsoluteFill>
	);
};
